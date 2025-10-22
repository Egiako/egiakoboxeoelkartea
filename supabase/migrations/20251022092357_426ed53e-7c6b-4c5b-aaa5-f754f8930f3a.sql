-- 1) Ensure booking counts include manual schedules by using a unified key
CREATE OR REPLACE FUNCTION public.get_booking_counts(_dates date[])
RETURNS TABLE(class_id uuid, booking_date date, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT 
    COALESCE(b.class_id, b.manual_schedule_id) AS class_id,
    b.booking_date::date,
    COUNT(*)::bigint as count
  FROM public.bookings b
  WHERE b.booking_date = ANY(_dates)
    AND b.status = 'confirmed'
  GROUP BY COALESCE(b.class_id, b.manual_schedule_id), b.booking_date;
END;
$function$;

-- 2) Fix timezone handling for start time calculation using Europe/Madrid local time
CREATE OR REPLACE FUNCTION public.get_booking_start_time(booking_record bookings)
RETURNS timestamptz
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_start_time time;
  v_result timestamptz;
BEGIN
  -- Si es una clase manual, usar su start_time con zona horaria local (Europe/Madrid)
  IF booking_record.manual_schedule_id IS NOT NULL THEN
    SELECT 
      (mcs.class_date::date + mcs.start_time::time) AT TIME ZONE 'Europe/Madrid'
    INTO v_result
    FROM public.manual_class_schedules mcs
    WHERE mcs.id = booking_record.manual_schedule_id;
    
    RETURN v_result;
  END IF;
  
  -- Si es una clase periódica, comprobar excepciones primero y convertir desde hora local
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
    
    -- Combinar fecha de booking con hora de clase en hora local Europe/Madrid
    v_result := (booking_record.booking_date::date + v_start_time::time) AT TIME ZONE 'Europe/Madrid';
    
    RETURN v_result;
  END IF;
  
  -- Si no hay clase_id ni manual_schedule_id, error
  RAISE EXCEPTION 'Booking sin clase asociada';
END;
$function$;

-- 3) Decrement monthly classes atomically when creating/reactivating a reservation
CREATE OR REPLACE FUNCTION public.create_reservation_safe(
  p_user_id uuid,
  p_booking_date date,
  p_class_id uuid DEFAULT NULL,
  p_manual_schedule_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_booking record;
  new_id uuid;
  v_max_students int;
  v_current_bookings int;
  v_remaining int;
BEGIN
  -- Validar que el usuario existe y está aprobado/activo
  IF NOT is_user_approved(p_user_id) OR NOT is_user_active(p_user_id) THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Usuario no autorizado');
  END IF;

  -- Verificar que se proporcionó al menos un ID (class_id o manual_schedule_id)
  IF p_class_id IS NULL AND p_manual_schedule_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'Debe proporcionar class_id o manual_schedule_id');
  END IF;

  -- Asegurar registro mensual y obtener clases restantes
  PERFORM public.get_or_create_monthly_classes(p_user_id);
  SELECT remaining_classes INTO v_remaining
  FROM public.user_monthly_classes
  WHERE user_id = p_user_id
    AND month = EXTRACT(month FROM CURRENT_DATE)
    AND year = EXTRACT(year FROM CURRENT_DATE)
  LIMIT 1;

  IF COALESCE(v_remaining, 0) <= 0 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'No tienes clases restantes este mes');
  END IF;

  -- Buscar reserva existente para este usuario, clase y fecha
  SELECT * INTO existing_booking
  FROM public.bookings b
  WHERE b.user_id = p_user_id
    AND b.booking_date = p_booking_date
    AND (
      (p_class_id IS NOT NULL AND b.class_id = p_class_id) OR
      (p_manual_schedule_id IS NOT NULL AND b.manual_schedule_id = p_manual_schedule_id)
    )
  ORDER BY b.created_at DESC
  LIMIT 1;

  -- Si existe una reserva
  IF FOUND THEN
    -- Si está activa, devolver error
    IF existing_booking.status NOT IN ('cancelled', 'rejected') THEN
      RETURN jsonb_build_object('ok', false, 'error', 'Ya tienes una reserva activa para esta clase en este día');
    END IF;
    
    -- Verificar capacidad antes de reactivar
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

    IF v_current_bookings >= v_max_students THEN
      RETURN jsonb_build_object('ok', false, 'error', 'La clase está completa');
    END IF;
    
    -- Reactivar la reserva existente
    UPDATE public.bookings
    SET status = 'confirmed',
        updated_at = now(),
        cancelled_at = NULL,
        cancelled_by = NULL,
        cancelled_reason = NULL
    WHERE id = existing_booking.id;
    
    -- Descontar 1 clase al usuario
    UPDATE public.user_monthly_classes
    SET remaining_classes = GREATEST(0, remaining_classes - 1),
        updated_at = now()
    WHERE user_id = p_user_id
      AND month = EXTRACT(month FROM CURRENT_DATE)
      AND year = EXTRACT(year FROM CURRENT_DATE);
    
    RETURN jsonb_build_object('ok', true, 'id', existing_booking.id, 'message', 'Reserva reactivada exitosamente');
  END IF;

  -- No existe reserva previa, verificar capacidad antes de crear
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

  IF v_current_bookings >= v_max_students THEN
    RETURN jsonb_build_object('ok', false, 'error', 'La clase está completa');
  END IF;

  -- Crear nueva reserva
  INSERT INTO public.bookings (user_id, class_id, manual_schedule_id, booking_date, status, created_at)
  VALUES (p_user_id, p_class_id, p_manual_schedule_id, p_booking_date, 'confirmed', now())
  RETURNING id INTO new_id;

  -- Descontar 1 clase al usuario
  UPDATE public.user_monthly_classes
  SET remaining_classes = GREATEST(0, remaining_classes - 1),
      updated_at = now()
  WHERE user_id = p_user_id
    AND month = EXTRACT(month FROM CURRENT_DATE)
    AND year = EXTRACT(year FROM CURRENT_DATE);

  -- Recalcular capacidad si es necesario (solo clases periódicas)
  IF p_class_id IS NOT NULL THEN
    PERFORM public.recompute_class_capacity(p_class_id);
  END IF;

  RETURN jsonb_build_object('ok', true, 'id', new_id, 'message', 'Reserva creada exitosamente');
END;
$function$;