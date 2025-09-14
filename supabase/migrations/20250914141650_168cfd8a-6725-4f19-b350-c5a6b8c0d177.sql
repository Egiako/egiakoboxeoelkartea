-- Add delete function for periodic classes
CREATE OR REPLACE FUNCTION public.delete_periodic_class(target_class_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  -- Check if user is trainer or admin
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden eliminar clases';
  END IF;
  
  -- Cancel all future bookings for this class
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE class_id = target_class_id
    AND booking_date >= CURRENT_DATE
    AND status = 'confirmed';
  
  -- Delete schedule overrides for this class
  DELETE FROM public.schedule_overrides WHERE class_id = target_class_id;
  
  -- Delete class instructors for this class
  DELETE FROM public.class_instructors WHERE class_id = target_class_id;
  
  -- Delete the class itself
  DELETE FROM public.classes WHERE id = target_class_id;
  
  RETURN FOUND;
END;
$function$;