-- Update trainer_update_attendance to handle class restoration
CREATE OR REPLACE FUNCTION public.trainer_update_attendance(booking_uuid uuid, attendance_status boolean)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  booking_record public.bookings;
  previous_attendance boolean;
BEGIN
  -- Verify trainer role
  IF NOT public.has_role(auth.uid(), 'trainer'::app_role) THEN
    RAISE EXCEPTION 'Solo los entrenadores pueden actualizar la asistencia';
  END IF;

  -- Get current booking record
  SELECT * INTO booking_record FROM public.bookings WHERE id = booking_uuid;
  
  IF booking_record IS NULL THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;

  -- Store previous attendance status
  previous_attendance := booking_record.attended;

  -- Update attendance
  UPDATE public.bookings
  SET attended = attendance_status,
      updated_at = now()
  WHERE id = booking_uuid
  RETURNING * INTO booking_record;

  -- Ensure current month record exists with default 10 classes when missing
  PERFORM public.get_or_create_monthly_classes(booking_record.user_id);

  -- Handle class adjustments based on attendance change
  IF previous_attendance IS NULL OR previous_attendance != attendance_status THEN
    IF attendance_status = false THEN
      -- Apply penalty for absence (remove 1 additional class)
      UPDATE public.user_monthly_classes
      SET remaining_classes = GREATEST(0, remaining_classes - 1),
          updated_at = now()
      WHERE user_id = booking_record.user_id
        AND month = EXTRACT(month FROM CURRENT_DATE)
        AND year = EXTRACT(year FROM CURRENT_DATE);
        
      RAISE LOG 'Penalization applied: removed 1 additional class for user % due to absence', booking_record.user_id;
    
    ELSIF attendance_status = true AND previous_attendance = false THEN
      -- Restore class when changing from not attended to attended
      UPDATE public.user_monthly_classes
      SET remaining_classes = remaining_classes + 1,
          updated_at = now()
      WHERE user_id = booking_record.user_id
        AND month = EXTRACT(month FROM CURRENT_DATE)
        AND year = EXTRACT(year FROM CURRENT_DATE);
        
      RAISE LOG 'Class restored: added 1 class back for user % when correcting attendance', booking_record.user_id;
    END IF;
  END IF;
  
  RETURN booking_record;
END;
$function$;

-- Update admin_update_attendance to handle class restoration
CREATE OR REPLACE FUNCTION public.admin_update_attendance(booking_uuid uuid, attendance_status boolean)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$ 
DECLARE
  booking_record public.bookings;
  previous_attendance boolean;
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden actualizar la asistencia';
  END IF;

  -- Get current booking record
  SELECT * INTO booking_record FROM public.bookings WHERE id = booking_uuid;
  
  IF booking_record IS NULL THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;

  -- Store previous attendance status
  previous_attendance := booking_record.attended;
  
  -- Update attendance status
  UPDATE public.bookings
  SET attended = attendance_status,
      updated_at = now()
  WHERE id = booking_uuid
  RETURNING * INTO booking_record;

  -- Ensure current month record exists with default 10 classes when missing
  PERFORM public.get_or_create_monthly_classes(booking_record.user_id);

  -- Handle class adjustments based on attendance change
  IF previous_attendance IS NULL OR previous_attendance != attendance_status THEN
    IF attendance_status = false THEN
      -- Apply penalty for absence (remove 1 additional class)
      UPDATE public.user_monthly_classes
      SET remaining_classes = GREATEST(0, remaining_classes - 1),
          updated_at = now()
      WHERE user_id = booking_record.user_id
        AND month = EXTRACT(month FROM CURRENT_DATE)
        AND year = EXTRACT(year FROM CURRENT_DATE);
        
      RAISE LOG 'Penalization applied by admin: removed 1 additional class for user % due to absence', booking_record.user_id;
    
    ELSIF attendance_status = true AND previous_attendance = false THEN
      -- Restore class when changing from not attended to attended
      UPDATE public.user_monthly_classes
      SET remaining_classes = remaining_classes + 1,
          updated_at = now()
      WHERE user_id = booking_record.user_id
        AND month = EXTRACT(month FROM CURRENT_DATE)
        AND year = EXTRACT(year FROM CURRENT_DATE);
        
      RAISE LOG 'Class restored by admin: added 1 class back for user % when correcting attendance', booking_record.user_id;
    END IF;
  END IF;
  
  RETURN booking_record;
END;
$function$;