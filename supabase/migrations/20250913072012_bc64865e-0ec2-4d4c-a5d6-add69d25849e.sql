-- Fix RLS policies for classes table to allow trainers and admins to manage classes
DROP POLICY IF EXISTS "Classes are viewable by authenticated users" ON public.classes;

-- Create proper RLS policies for the classes table
CREATE POLICY "Everyone can view classes" 
ON public.classes 
FOR SELECT 
USING (true);

CREATE POLICY "Trainers and admins can manage classes" 
ON public.classes 
FOR ALL 
USING (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Update the get_class_schedule_for_date function to properly sort by time and include manual schedules
CREATE OR REPLACE FUNCTION public.get_class_schedule_for_date(target_date date)
RETURNS TABLE(
  class_id uuid, 
  title text, 
  instructor text, 
  day_of_week integer, 
  start_time time without time zone, 
  end_time time without time zone, 
  max_students integer, 
  is_active boolean, 
  is_special_day boolean, 
  override_notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  -- First get regular classes with overrides
  SELECT 
    c.id as class_id,
    c.title,
    COALESCE(so.instructor_override, ci.instructor_name, c.instructor, 'Sin asignar') as instructor,
    c.day_of_week,
    c.start_time,
    c.end_time,
    c.max_students,
    CASE 
      WHEN so.id IS NOT NULL THEN so.is_enabled
      ELSE (c.is_active AND EXTRACT(DOW FROM target_date) = c.day_of_week)
    END as is_active,
    (so.id IS NOT NULL AND so.is_enabled = true) as is_special_day,
    so.notes as override_notes
  FROM public.classes c
  LEFT JOIN public.class_instructors ci ON (c.id = ci.class_id AND ci.specific_date IS NULL)
  LEFT JOIN public.schedule_overrides so ON (c.id = so.class_id AND so.override_date = target_date)
  WHERE (c.is_active = true AND EXTRACT(DOW FROM target_date) = c.day_of_week)
    OR (so.id IS NOT NULL AND so.is_enabled = true)
  
  UNION ALL
  
  -- Then get manual schedules for this date
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
    mcs.notes as override_notes
  FROM public.manual_class_schedules mcs
  WHERE mcs.class_date = target_date 
    AND mcs.is_enabled = true
  
  -- Sort everything by start_time to ensure proper ordering
  ORDER BY start_time ASC;
END;
$$;