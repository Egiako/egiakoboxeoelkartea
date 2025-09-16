-- Security Fix: Restrict class schedule data access to authenticated users only
-- Remove public access policies and implement proper authentication-based restrictions

-- 1. Update schedule_overrides policies
DROP POLICY IF EXISTS "Anyone can view schedule overrides" ON public.schedule_overrides;

CREATE POLICY "Authenticated users can view schedule overrides"
ON public.schedule_overrides
FOR SELECT
TO authenticated
USING (true);

-- 2. Update classes policies  
DROP POLICY IF EXISTS "Everyone can view classes" ON public.classes;

CREATE POLICY "Authenticated users can view classes"
ON public.classes
FOR SELECT
TO authenticated
USING (true);

-- 3. Update class_instructors policies
DROP POLICY IF EXISTS "Anyone can view class instructors" ON public.class_instructors;

CREATE POLICY "Authenticated users can view class instructors"
ON public.class_instructors
FOR SELECT
TO authenticated
USING (true);

-- 4. Update manual_class_schedules policies
DROP POLICY IF EXISTS "Anyone can view manual schedules" ON public.manual_class_schedules;

CREATE POLICY "Authenticated users can view manual schedules"
ON public.manual_class_schedules
FOR SELECT
TO authenticated
USING (true);

-- 5. Review and restrict trainer_user_view access
-- Ensure only trainers can access the restricted view
DROP POLICY IF EXISTS "Trainers can view trainer_user_view" ON public.trainer_user_view;

-- Note: Views use the underlying table policies, so trainer_user_view will be protected by profiles policies

-- 6. Add additional security for booking-related queries
-- Ensure get_booking_counts function has proper security
CREATE OR REPLACE FUNCTION public.get_booking_counts(_dates date[])
RETURNS TABLE(class_id uuid, booking_date date, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT 
    b.class_id,
    b.booking_date::date,
    COUNT(*)::bigint as count
  FROM bookings b
  WHERE b.booking_date = ANY(_dates)
    AND b.status = 'confirmed'
  GROUP BY b.class_id, b.booking_date;
END;
$$;

-- 7. Ensure get_class_schedule_for_date requires authentication
CREATE OR REPLACE FUNCTION public.get_class_schedule_for_date(target_date date)
RETURNS TABLE(class_id uuid, title text, instructor text, day_of_week integer, start_time time without time zone, end_time time without time zone, max_students integer, is_active boolean, is_special_day boolean, override_notes text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
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

-- 8. Secure manual schedule booking functions
CREATE OR REPLACE FUNCTION public.get_manual_schedules_for_booking(start_date date, end_date date)
RETURNS TABLE(id uuid, title text, instructor_name text, class_date date, start_time time without time zone, end_time time without time zone, max_students integer, is_enabled boolean, notes text, current_bookings bigint)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Only allow authenticated users
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  RETURN QUERY
  SELECT 
    mcs.id,
    mcs.title,
    mcs.instructor_name,
    mcs.class_date,
    mcs.start_time,
    mcs.end_time,
    mcs.max_students,
    mcs.is_enabled,
    mcs.notes,
    COALESCE(b.booking_count, 0) as current_bookings
  FROM public.manual_class_schedules mcs
  LEFT JOIN (
    SELECT 
      manual_schedule_id,
      COUNT(*) as booking_count
    FROM public.bookings
    WHERE status = 'confirmed'
      AND manual_schedule_id IS NOT NULL
    GROUP BY manual_schedule_id
  ) b ON mcs.id = b.manual_schedule_id
  WHERE mcs.class_date BETWEEN start_date AND end_date
    AND mcs.is_enabled = true
  ORDER BY mcs.class_date, mcs.start_time;
END;
$$;