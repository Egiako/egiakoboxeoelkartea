-- ============================================
-- CORRECCIÓN: Política de cancelación de 1 hora
-- ============================================

-- 1) Actualizar función get_booking_start_time para usar UTC explícitamente
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
  -- Si es una clase manual, usar su start_time con UTC
  IF booking_record.manual_schedule_id IS NOT NULL THEN
    SELECT 
      (mcs.class_date::date + mcs.start_time::time) AT TIME ZONE 'UTC'
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
    
    -- Combinar fecha de booking con hora de clase en UTC
    v_result := (booking_record.booking_date::date + v_start_time::time) AT TIME ZONE 'UTC';
    
    RETURN v_result;
  END IF;
  
  -- Si no hay clase_id ni manual_schedule_id, error
  RAISE EXCEPTION 'Booking sin clase asociada';
END;
$$;

-- 2) Actualizar función cancel_booking_if_allowed con lógica corregida
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
  v_diff_minutes numeric;
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

  -- Obtener el start_time real considerando excepciones, forzado a UTC
  v_start_time := public.get_booking_start_time(v_booking);
  
  -- Calcular diferencia en minutos (ambos en UTC)
  v_diff_minutes := EXTRACT(EPOCH FROM (v_start_time AT TIME ZONE 'UTC' - NOW() AT TIME ZONE 'UTC')) / 60;

  -- REGLA CRÍTICA: Validar ventana de cancelación
  -- Solo permitir si faltan MÁS de 60 minutos (v_diff_minutes > 60)
  -- Bloquear si faltan 60 minutos o menos (v_diff_minutes <= 60)
  IF NOT v_is_admin AND v_diff_minutes <= 60 THEN
    -- NO ejecutar UPDATE ni devolución
    -- NO liberar aforo
    -- Solo retornar error
    RETURN jsonb_build_object(
      'ok', false, 
      'error', 'within_time_limit',
      'message', 'No se puede cancelar la clase. Estás dentro de la hora máxima (1 hora antes del inicio).',
      'minutes_until_class', FLOOR(v_diff_minutes)
    );
  END IF;

  -- SOLO si llegamos aquí (v_diff_minutes > 60 o es admin):
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

  -- Log de la cancelación exitosa
  RAISE NOTICE 'Cancelación exitosa: booking_id=%, user_id=%, diff_minutes=%, is_admin=%', 
    _booking_id, v_booking.user_id, v_diff_minutes, v_is_admin;

  RETURN jsonb_build_object(
    'ok', true,
    'message', CASE 
      WHEN v_is_admin AND v_diff_minutes <= 60 THEN 'Cancelación realizada por administrador'
      ELSE 'Tu reserva se ha cancelado correctamente'
    END
  );
END;
$$;

-- 3) Actualizar función can_cancel_booking con misma lógica
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
  v_diff_minutes numeric;
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
  v_diff_minutes := EXTRACT(EPOCH FROM (v_start_time AT TIME ZONE 'UTC' - NOW() AT TIME ZONE 'UTC')) / 60;

  IF v_is_admin THEN
    RETURN jsonb_build_object(
      'can_cancel', true, 
      'reason', 'admin',
      'minutes_until_class', FLOOR(v_diff_minutes)
    );
  END IF;

  -- Misma lógica: bloquear si <= 60 minutos
  IF v_diff_minutes <= 60 THEN
    RETURN jsonb_build_object(
      'can_cancel', false, 
      'reason', 'within_time_limit',
      'minutes_until_class', FLOOR(v_diff_minutes)
    );
  END IF;

  RETURN jsonb_build_object(
    'can_cancel', true, 
    'reason', 'ok',
    'minutes_until_class', FLOOR(v_diff_minutes)
  );
END;
$$;