-- Función auxiliar para recalcular capacidad de clases
CREATE OR REPLACE FUNCTION public.recompute_class_capacity(p_class_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Esta función puede usarse para recalcular o validar capacidad
  -- Por ahora es un placeholder para futuras optimizaciones
  RETURN;
END;
$$;

-- Función segura de creación de reservas (parámetros reordenados)
CREATE OR REPLACE FUNCTION public.create_reservation_safe(
  p_user_id uuid,
  p_booking_date date,
  p_class_id uuid DEFAULT NULL,
  p_manual_schedule_id uuid DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_count int;
  new_id uuid;
  v_max_students int;
  v_current_bookings int;
BEGIN
  -- Validar que el usuario existe y está aprobado
  IF NOT is_user_approved(p_user_id) OR NOT is_user_active(p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuario no autorizado');
  END IF;

  -- Verificar que se proporcionó al menos un ID (class_id o manual_schedule_id)
  IF p_class_id IS NULL AND p_manual_schedule_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Debe proporcionar class_id o manual_schedule_id');
  END IF;

  -- Verificar si ya existe una reserva activa (ignorando cancelled/rejected)
  SELECT COUNT(*) INTO existing_count
  FROM public.bookings b
  WHERE b.user_id = p_user_id
    AND b.booking_date = p_booking_date
    AND (
      (p_class_id IS NOT NULL AND b.class_id = p_class_id) OR
      (p_manual_schedule_id IS NOT NULL AND b.manual_schedule_id = p_manual_schedule_id)
    )
    AND b.status NOT IN ('cancelled', 'rejected');

  IF existing_count > 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Ya existe una reserva activa para esta clase');
  END IF;

  -- Obtener capacidad máxima y contar reservas actuales
  IF p_class_id IS NOT NULL THEN
    SELECT max_students INTO v_max_students
    FROM public.classes
    WHERE id = p_class_id;
    
    SELECT COUNT(*) INTO v_current_bookings
    FROM public.bookings
    WHERE class_id = p_class_id
      AND booking_date = p_booking_date
      AND status = 'confirmed';
  ELSE
    SELECT max_students INTO v_max_students
    FROM public.manual_class_schedules
    WHERE id = p_manual_schedule_id;
    
    SELECT COUNT(*) INTO v_current_bookings
    FROM public.bookings
    WHERE manual_schedule_id = p_manual_schedule_id
      AND booking_date = p_booking_date
      AND status = 'confirmed';
  END IF;

  -- Verificar capacidad
  IF v_current_bookings >= v_max_students THEN
    RETURN jsonb_build_object('ok', false, 'error', 'La clase está completa');
  END IF;

  -- Crear la reserva
  INSERT INTO public.bookings (user_id, class_id, manual_schedule_id, booking_date, status, created_at)
  VALUES (p_user_id, p_class_id, p_manual_schedule_id, p_booking_date, 'confirmed', now())
  RETURNING id INTO new_id;

  -- Recalcular capacidad si es necesario
  IF p_class_id IS NOT NULL THEN
    PERFORM public.recompute_class_capacity(p_class_id);
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', new_id, 'message', 'Reserva creada exitosamente');
END;
$$;

-- Función segura de cancelación de reservas
CREATE OR REPLACE FUNCTION public.cancel_reservation_safe(
  p_booking_id uuid,
  p_actor_user_id uuid
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  bk record;
  diff_minutes numeric;
  v_start_time timestamptz;
  v_is_admin boolean;
BEGIN
  -- Obtener información de la reserva
  SELECT id, user_id, class_id, manual_schedule_id, booking_date, status
  INTO bk
  FROM public.bookings
  WHERE id = p_booking_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Reserva no encontrada');
  END IF;

  -- Verificar que el status es confirmed
  IF bk.status <> 'confirmed' THEN
    RETURN jsonb_build_object('ok', false, 'error', 'La reserva no está confirmada');
  END IF;

  -- Verificar autorización
  v_is_admin := has_role(p_actor_user_id, 'admin'::app_role);
  
  IF bk.user_id <> p_actor_user_id AND NOT v_is_admin THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No autorizado para cancelar esta reserva');
  END IF;

  -- Obtener hora de inicio de la clase
  v_start_time := public.get_booking_start_time(bk);

  -- Calcular diferencia en minutos
  diff_minutes := EXTRACT(EPOCH FROM (v_start_time AT TIME ZONE 'UTC' - NOW() AT TIME ZONE 'UTC')) / 60;

  -- REGLA CRÍTICA: No permitir cancelación si faltan 60 minutos o menos (excepto admin)
  IF NOT v_is_admin AND diff_minutes <= 60 THEN
    RETURN jsonb_build_object(
      'ok', false, 
      'error', 'within_time_limit',
      'message', 'No se puede cancelar la clase. Estás dentro de la hora máxima (1 hora antes del inicio).',
      'minutes_until_class', FLOOR(diff_minutes)
    );
  END IF;

  -- Cancelar la reserva
  UPDATE public.bookings
  SET 
    status = 'cancelled',
    cancelled_at = NOW(),
    cancelled_by = p_actor_user_id,
    cancelled_reason = CASE 
      WHEN v_is_admin AND diff_minutes <= 60 THEN 'admin_override'
      ELSE 'user_cancellation'
    END,
    updated_at = NOW()
  WHERE id = p_booking_id;

  -- Devolver clase al usuario
  UPDATE public.user_monthly_classes
  SET 
    remaining_classes = remaining_classes + 1,
    updated_at = NOW()
  WHERE user_id = bk.user_id
    AND month = EXTRACT(MONTH FROM CURRENT_DATE)
    AND year = EXTRACT(YEAR FROM CURRENT_DATE);

  -- Recalcular capacidad
  IF bk.class_id IS NOT NULL THEN
    PERFORM public.recompute_class_capacity(bk.class_id);
  END IF;

  RETURN jsonb_build_object(
    'ok', true,
    'message', CASE 
      WHEN v_is_admin AND diff_minutes <= 60 THEN 'Cancelación realizada por administrador'
      ELSE 'Tu reserva se ha cancelado correctamente'
    END
  );
END;
$$;