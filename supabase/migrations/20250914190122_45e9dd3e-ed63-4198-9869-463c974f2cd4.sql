-- Update admin_update_attendance function to apply penalty for non-attendance
CREATE OR REPLACE FUNCTION public.admin_update_attendance(booking_uuid uuid, attendance_status boolean)
 RETURNS bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$ 
DECLARE
  booking_record public.bookings;
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden actualizar la asistencia';
  END IF;
  
  -- Update attendance status
  UPDATE public.bookings
  SET attended = attendance_status,
      updated_at = now()
  WHERE id = booking_uuid
  RETURNING * INTO booking_record;
  
  IF booking_record IS NULL THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;

  -- Apply penalty for absence (same as trainer function)
  IF attendance_status = false THEN
    -- Ensure current month record exists with default 10 classes when missing
    PERFORM public.get_or_create_monthly_classes(booking_record.user_id);
    
    UPDATE public.user_monthly_classes
    SET remaining_classes = GREATEST(0, remaining_classes - 1),
        updated_at = now()
    WHERE user_id = booking_record.user_id
      AND month = EXTRACT(month FROM CURRENT_DATE)
      AND year = EXTRACT(year FROM CURRENT_DATE);
      
    RAISE LOG 'Penalization applied by admin: removed 1 additional class for user % due to absence', booking_record.user_id;
  END IF;
  
  RETURN booking_record;
END;
$function$

-- Update book_manual_schedule function to prevent duplicate bookings
CREATE OR REPLACE FUNCTION public.book_manual_schedule(p_user_id uuid, p_manual_schedule_id uuid)
 RETURNS bookings
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  result bookings;
  schedule_info manual_class_schedules;
  current_bookings integer;
  user_monthly_record user_monthly_classes;
  existing_booking_count integer;
BEGIN
  SELECT * INTO schedule_info
  FROM public.manual_class_schedules
  WHERE id = p_manual_schedule_id AND is_enabled = true;
  
  IF schedule_info IS NULL THEN
    RAISE EXCEPTION 'Horario no encontrado o no disponible';
  END IF;
  
  -- Check for existing bookings by this user for this specific schedule
  SELECT COUNT(*) INTO existing_booking_count
  FROM public.bookings
  WHERE user_id = p_user_id
    AND manual_schedule_id = p_manual_schedule_id
    AND status = 'confirmed';
    
  IF existing_booking_count > 0 THEN
    RAISE EXCEPTION 'Ya tienes una reserva confirmada para esta clase';
  END IF;
  
  -- Capacity check
  SELECT COUNT(*) INTO current_bookings
  FROM public.bookings
  WHERE manual_schedule_id = p_manual_schedule_id
    AND status = 'confirmed';
  
  IF current_bookings >= schedule_info.max_students THEN
    RAISE EXCEPTION 'La clase está completa. Máximo % estudiantes permitidos.', schedule_info.max_students;
  END IF;
  
  -- Remaining classes check
  SELECT * INTO user_monthly_record
  FROM public.get_or_create_monthly_classes(p_user_id);
  
  IF user_monthly_record.remaining_classes <= 0 THEN
    RAISE EXCEPTION 'No tienes clases restantes este mes';
  END IF;
  
  -- Updated date policy: allow current month bookings
  IF schedule_info.class_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se pueden reservar fechas pasadas';
  END IF;
  
  IF EXTRACT(month FROM schedule_info.class_date) != EXTRACT(month FROM CURRENT_DATE)
     OR EXTRACT(year FROM schedule_info.class_date) != EXTRACT(year FROM CURRENT_DATE) THEN
    RAISE EXCEPTION 'Solo puedes reservar clases del mes actual';
  END IF;

  INSERT INTO public.bookings (user_id, manual_schedule_id, booking_date, status)
  VALUES (p_user_id, p_manual_schedule_id, schedule_info.class_date, 'confirmed')
  RETURNING * INTO result;

  RETURN result;
END;
$function$