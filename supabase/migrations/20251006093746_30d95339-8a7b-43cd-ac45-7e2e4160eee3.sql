-- Drop the old function
DROP FUNCTION IF EXISTS public.get_class_schedule_for_date(date);

-- Create new version that includes class exceptions
CREATE OR REPLACE FUNCTION public.get_class_schedule_for_date(target_date date)
RETURNS TABLE(
  class_id uuid, 
  title text, 
  instructor text, 
  day_of_week integer, 
  start_time time, 
  end_time time, 
  max_students integer, 
  is_active boolean, 
  is_special_day boolean, 
  override_notes text,
  is_exception boolean,
  is_cancelled boolean,
  exception_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  -- Get regular classes with possible exceptions
  SELECT 
    c.id as class_id,
    c.title,
    COALESCE(ce.override_instructor, ci.instructor_name, c.instructor, 'Sin asignar') as instructor,
    c.day_of_week,
    COALESCE(ce.override_start_time, c.start_time) as start_time,
    COALESCE(ce.override_end_time, c.end_time) as end_time,
    COALESCE(ce.override_max_students, c.max_students) as max_students,
    CASE 
      WHEN ce.is_cancelled = true THEN false
      WHEN so.id IS NOT NULL THEN so.is_enabled
      ELSE (c.is_active AND EXTRACT(DOW FROM target_date) = c.day_of_week)
    END as is_active,
    (so.id IS NOT NULL AND so.is_enabled = true) as is_special_day,
    COALESCE(ce.notes, so.notes) as override_notes,
    (ce.id IS NOT NULL) as is_exception,
    COALESCE(ce.is_cancelled, false) as is_cancelled,
    ce.id as exception_id
  FROM public.classes c
  LEFT JOIN public.class_instructors ci ON (c.id = ci.class_id AND ci.specific_date IS NULL)
  LEFT JOIN public.schedule_overrides so ON (c.id = so.class_id AND so.override_date = target_date)
  LEFT JOIN public.class_exceptions ce ON (c.id = ce.class_id AND ce.exception_date = target_date)
  WHERE (c.is_active = true AND EXTRACT(DOW FROM target_date) = c.day_of_week)
    OR (so.id IS NOT NULL AND so.is_enabled = true)
  -- Don't show cancelled exceptions
  AND COALESCE(ce.is_cancelled, false) = false
  
  UNION ALL
  
  -- Get manual schedules for this date
  SELECT 
    mcs.id as class_id,
    mcs.title,
    mcs.instructor_name as instructor,
    null as day_of_week,
    mcs.start_time,
    mcs.end_time,
    mcs.max_students,
    mcs.is_enabled as is_active,
    false as is_special_day,
    mcs.notes as override_notes,
    false as is_exception,
    false as is_cancelled,
    null as exception_id
  FROM public.manual_class_schedules mcs
  WHERE mcs.class_date = target_date 
    AND mcs.is_enabled = true
  
  -- Sort everything by start_time
  ORDER BY start_time ASC;
END;
$$;