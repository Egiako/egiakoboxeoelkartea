-- Create function for trainers to get all bookings
CREATE OR REPLACE FUNCTION public.trainer_get_all_bookings()
 RETURNS TABLE(
   id uuid, 
   booking_date date, 
   attended boolean, 
   created_at timestamp with time zone, 
   user_id uuid, 
   class_id uuid,
   manual_schedule_id uuid,
   status text,
   class_title text,
   class_start_time time without time zone,
   class_end_time time without time zone,
   class_day_of_week integer,
   class_instructor text,
   manual_title text,
   manual_class_date date,
   manual_start_time time without time zone,
   manual_end_time time without time zone,
   manual_instructor_name text,
   profile_first_name text,
   profile_last_name text,
   remaining_classes integer
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  today date := CURRENT_DATE;
BEGIN
  -- Verificar que el caller es entrenador autorizado
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.user_roles ur ON p.user_id = ur.user_id
      WHERE p.user_id = auth.uid()
        AND ur.role = 'trainer'
        AND p.is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: solo entrenadores autorizados pueden acceder a esta función';
  END IF;

  -- Devolver todas las reservas confirmadas desde hoy en adelante
  RETURN QUERY
    SELECT 
      b.id,
      b.booking_date,
      b.attended,
      b.created_at,
      b.user_id,
      b.class_id,
      b.manual_schedule_id,
      b.status,
      c.title as class_title,
      c.start_time as class_start_time,
      c.end_time as class_end_time,
      c.day_of_week as class_day_of_week,
      c.instructor as class_instructor,
      mcs.title as manual_title,
      mcs.class_date as manual_class_date,
      mcs.start_time as manual_start_time,
      mcs.end_time as manual_end_time,
      mcs.instructor_name as manual_instructor_name,
      p.first_name as profile_first_name,
      p.last_name as profile_last_name,
      COALESCE(umc.remaining_classes, 0) as remaining_classes
    FROM public.bookings b
    LEFT JOIN public.classes c ON b.class_id = c.id
    LEFT JOIN public.manual_class_schedules mcs ON b.manual_schedule_id = mcs.id
    LEFT JOIN public.profiles p ON b.user_id = p.user_id
    LEFT JOIN public.user_monthly_classes umc ON (
      b.user_id = umc.user_id 
      AND umc.month = EXTRACT(month FROM CURRENT_DATE)
      AND umc.year = EXTRACT(year FROM CURRENT_DATE)
    )
    WHERE b.status = 'confirmed'
      AND b.booking_date >= today
      AND p.is_active = true
      AND p.approval_status = 'approved'
    ORDER BY b.booking_date DESC, 
             COALESCE(c.start_time, mcs.start_time) ASC;
END;
$function$