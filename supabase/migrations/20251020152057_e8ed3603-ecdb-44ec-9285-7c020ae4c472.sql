-- ============================================
-- MIGRATION: Implementar política de cancelación de 1 hora
-- ============================================

-- 1) Añadir columnas necesarias a bookings si no existen
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'cancelled_at') THEN
    ALTER TABLE public.bookings ADD COLUMN cancelled_at timestamptz;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'cancelled_by') THEN
    ALTER TABLE public.bookings ADD COLUMN cancelled_by uuid;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'bookings' AND column_name = 'cancelled_reason') THEN
    ALTER TABLE public.bookings ADD COLUMN cancelled_reason text;
  END IF;
END $$;

-- 2) Crear función para calcular el start_time real de una reserva
-- (considerando excepciones y manual schedules)
CREATE OR REPLACE FUNCTION public.get_booking_start_time(booking_record bookings)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_start_time time;
  v_result timestamptz;
BEGIN
  -- Si es una clase manual, usar su start_time
  IF booking_record.manual_schedule_id IS NOT NULL THEN
    SELECT 
      (mcs.class_date::date + mcs.start_time::time)::timestamptz
    INTO v_result
    FROM public.manual_class_schedules mcs
    WHERE mcs.id = booking_record.manual_schedule_id;
    
    RETURN v_result;
  END IF;
  
  -- Si es una clase periódica, comprobar excepciones primero
  IF booking_record.class_id IS NOT NULL THEN
    -- Buscar excepción para esta fecha
    SELECT 
      COALESCE(ce.override_start_time, c.start_time)
    INTO v_start_time
    FROM public.classes c
    LEFT JOIN public.class_exceptions ce ON (
      ce.class_id = c.id AND 
      ce.exception_date = booking_record.booking_date
    )
    WHERE c.id = booking_record.class_id;
    
    -- Combinar fecha de booking con hora de clase
    v_result := (booking_record.booking_date::date + v_start_time::time)::timestamptz;
    
    RETURN v_result;
  END IF;
  
  -- Si no hay clase_id ni manual_schedule_id, error
  RAISE EXCEPTION 'Booking sin clase asociada';
END;
$$;

-- 3) Crear función principal para cancelar con validación de 1 hora
CREATE OR REPLACE FUNCTION public.cancel_booking_if_allowed(
  _booking_id uuid, 
  _requesting_user uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
  v_start_time timestamptz;
  v_diff_minutes integer;
  v_is_admin boolean;
BEGIN
  -- Obtener el booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = _booking_id;

  IF v_booking IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Reserva no encontrada');
  END IF;

  -- Verificar que la reserva está confirmada
  IF v_booking.status <> 'confirmed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'La reserva no se puede cancelar (estado: ' || v_booking.status || ')');
  END IF;

  -- Verificar autorización
  v_is_admin := has_role(_requesting_user, 'admin'::app_role);
  
  IF v_booking.user_id <> _requesting_user AND NOT v_is_admin THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autorizado');
  END IF;

  -- Obtener el start_time real considerando excepciones
  v_start_time := public.get_booking_start_time(v_booking);
  
  -- Calcular diferencia en minutos
  v_diff_minutes := FLOOR(EXTRACT(EPOCH FROM (v_start_time - NOW())) / 60);

  -- Validar ventana de cancelación (solo para usuarios normales)
  IF NOT v_is_admin AND v_diff_minutes <= 60 THEN
    RETURN jsonb_build_object(
      'ok', false, 
      'error', 'within_time_limit',
      'minutes_until_class', v_diff_minutes
    );
  END IF;

  -- Ejecutar cancelación
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = _requesting_user,
    cancelled_reason = CASE 
      WHEN v_is_admin AND v_diff_minutes <= 60 THEN 'admin_override'
      ELSE 'user_cancellation'
    END,
    updated_at = NOW()
  WHERE id = _booking_id;

  -- Devolver clase al usuario (incrementar remaining_classes)
  UPDATE public.user_monthly_classes
  SET 
    remaining_classes = remaining_classes + 1,
    updated_at = NOW()
  WHERE user_id = v_booking.user_id
    AND month = EXTRACT(MONTH FROM CURRENT_DATE)
    AND year = EXTRACT(YEAR FROM CURRENT_DATE);

  RETURN jsonb_build_object(
    'ok', true,
    'message', CASE 
      WHEN v_is_admin AND v_diff_minutes <= 60 THEN 'Cancelación realizada por administrador'
      ELSE 'Cancelación realizada correctamente'
    END
  );
END;
$$;

-- 4) Función para admin force cancel (override)
CREATE OR REPLACE FUNCTION public.admin_force_cancel_booking(
  _booking_id uuid,
  _admin_id uuid,
  _reason text DEFAULT 'Admin override'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
BEGIN
  -- Verificar que el usuario es admin
  IF NOT has_role(_admin_id, 'admin'::app_role) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autorizado - solo administradores');
  END IF;

  -- Obtener booking
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = _booking_id;

  IF v_booking IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Reserva no encontrada');
  END IF;

  -- Cancelar sin validación de tiempo
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = _admin_id,
    cancelled_reason = _reason,
    updated_at = NOW()
  WHERE id = _booking_id;

  -- Devolver clase
  UPDATE public.user_monthly_classes
  SET 
    remaining_classes = remaining_classes + 1,
    updated_at = NOW()
  WHERE user_id = v_booking.user_id
    AND month = EXTRACT(MONTH FROM CURRENT_DATE)
    AND year = EXTRACT(YEAR FROM CURRENT_DATE);

  RETURN jsonb_build_object('ok', true, 'message', 'Cancelación forzada por administrador');
END;
$$;

-- 5) Función helper para validar si se puede cancelar (para UI)
CREATE OR REPLACE FUNCTION public.can_cancel_booking(
  _booking_id uuid,
  _user_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking public.bookings;
  v_start_time timestamptz;
  v_diff_minutes integer;
  v_is_admin boolean;
BEGIN
  SELECT * INTO v_booking
  FROM public.bookings
  WHERE id = _booking_id;

  IF v_booking IS NULL THEN
    RETURN jsonb_build_object('can_cancel', false, 'reason', 'not_found');
  END IF;

  IF v_booking.status <> 'confirmed' THEN
    RETURN jsonb_build_object('can_cancel', false, 'reason', 'not_confirmed');
  END IF;

  v_is_admin := has_role(_user_id, 'admin'::app_role);
  
  IF v_booking.user_id <> _user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object('can_cancel', false, 'reason', 'not_authorized');
  END IF;

  v_start_time := public.get_booking_start_time(v_booking);
  v_diff_minutes := FLOOR(EXTRACT(EPOCH FROM (v_start_time - NOW())) / 60);

  IF v_is_admin THEN
    RETURN jsonb_build_object(
      'can_cancel', true, 
      'reason', 'admin',
      'minutes_until_class', v_diff_minutes
    );
  END IF;

  IF v_diff_minutes <= 60 THEN
    RETURN jsonb_build_object(
      'can_cancel', false, 
      'reason', 'within_time_limit',
      'minutes_until_class', v_diff_minutes
    );
  END IF;

  RETURN jsonb_build_object(
    'can_cancel', true, 
    'reason', 'ok',
    'minutes_until_class', v_diff_minutes
  );
END;
$$;