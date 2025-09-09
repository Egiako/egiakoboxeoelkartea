-- Fix the ambiguous column references in get_unified_classes_for_range function
DROP FUNCTION IF EXISTS public.get_unified_classes_for_range(date, date);

CREATE OR REPLACE FUNCTION public.get_unified_classes_for_range(start_date date, end_date date)
 RETURNS TABLE(
   is_manual boolean, 
   class_id uuid, 
   manual_schedule_id uuid, 
   title text, 
   instructor_name text, 
   class_date date, 
   start_time time without time zone, 
   end_time time without time zone, 
   max_students integer, 
   is_enabled boolean, 
   notes text, 
   current_bookings bigint
 )
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Base classes per day with overrides
  RETURN QUERY
  WITH dates AS (
    SELECT generate_series(start_date, end_date, interval '1 day')::date AS d
  ),
  base AS (
    SELECT 
      false AS is_manual,
      c.id AS class_id,
      NULL::uuid AS manual_schedule_id,
      c.title,
      COALESCE(so.instructor_override, ci.instructor_name, c.instructor, 'Sin asignar') AS instructor_name,
      d.d AS class_date,
      c.start_time,
      c.end_time,
      c.max_students,
      CASE 
        WHEN so.id IS NOT NULL THEN so.is_enabled
        ELSE (c.is_active AND EXTRACT(DOW FROM d.d) = c.day_of_week)
      END AS is_enabled,
      so.notes,
      0::bigint AS current_bookings
    FROM dates d
    CROSS JOIN public.classes c
    LEFT JOIN public.class_instructors ci ON (c.id = ci.class_id AND ci.specific_date IS NULL)
    LEFT JOIN public.schedule_overrides so ON (c.id = so.class_id AND so.override_date = d.d)
    WHERE c.is_active = true
       OR (so.id IS NOT NULL AND so.is_enabled = true)
  ),
  base_with_counts AS (
    SELECT 
      b.is_manual,
      b.class_id,
      b.manual_schedule_id,
      b.title,
      b.instructor_name,
      b.class_date,
      b.start_time,
      b.end_time,
      b.max_students,
      b.is_enabled,
      b.notes,
      COALESCE(bc.booking_count, 0)::bigint AS current_bookings
    FROM base b
    LEFT JOIN (
      SELECT bk.class_id, bk.booking_date, COUNT(*) AS booking_count
      FROM public.bookings bk
      WHERE bk.status = 'confirmed' AND bk.class_id IS NOT NULL
      GROUP BY bk.class_id, bk.booking_date
    ) bc ON bc.class_id = b.class_id AND bc.booking_date = b.class_date
    WHERE b.is_enabled = true
  ),
  manual AS (
    SELECT 
      true AS is_manual,
      NULL::uuid AS class_id,
      mcs.id AS manual_schedule_id,
      mcs.title,
      mcs.instructor_name,
      mcs.class_date,
      mcs.start_time,
      mcs.end_time,
      mcs.max_students,
      mcs.is_enabled,
      mcs.notes,
      COALESCE(bc2.booking_count, 0)::bigint AS current_bookings
    FROM public.manual_class_schedules mcs
    LEFT JOIN (
      SELECT bk2.manual_schedule_id, COUNT(*) AS booking_count
      FROM public.bookings bk2
      WHERE bk2.status = 'confirmed' AND bk2.manual_schedule_id IS NOT NULL
      GROUP BY bk2.manual_schedule_id
    ) bc2 ON bc2.manual_schedule_id = mcs.id
    WHERE mcs.class_date BETWEEN start_date AND end_date
      AND mcs.is_enabled = true
  )
  SELECT 
    res.is_manual,
    res.class_id,
    res.manual_schedule_id,
    res.title,
    res.instructor_name,
    res.class_date,
    res.start_time,
    res.end_time,
    res.max_students,
    res.is_enabled,
    res.notes,
    res.current_bookings
  FROM (
    SELECT * FROM base_with_counts
    UNION ALL
    SELECT * FROM manual
  ) res
  ORDER BY res.class_date, res.start_time;
END;
$function$