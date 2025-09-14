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
$function$;