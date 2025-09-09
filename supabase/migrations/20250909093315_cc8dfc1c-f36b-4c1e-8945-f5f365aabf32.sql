-- Completely rewrite the function to fix all column ambiguities
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
  RETURN QUERY
  -- Regular classes with their bookings
  WITH date_series AS (
    SELECT generate_series(start_date, end_date, interval '1 day')::date AS class_date
  ),
  regular_classes AS (
    SELECT 
      false::boolean AS is_manual,
      c.id AS class_id,
      NULL::uuid AS manual_schedule_id,
      c.title AS title,
      COALESCE(
        so.instructor_override, 
        ci.instructor_name, 
        c.instructor, 
        'Sin asignar'
      ) AS instructor_name,
      ds.class_date,
      c.start_time,
      c.end_time,
      c.max_students,
      CASE 
        WHEN so.id IS NOT NULL THEN so.is_enabled
        ELSE (c.is_active = true AND EXTRACT(DOW FROM ds.class_date) = c.day_of_week)
      END AS is_enabled,
      so.notes,
      COALESCE(bc.count_bookings, 0)::bigint AS current_bookings
    FROM date_series ds
    CROSS JOIN public.classes c
    LEFT JOIN public.class_instructors ci ON (c.id = ci.class_id AND ci.specific_date IS NULL)
    LEFT JOIN public.schedule_overrides so ON (c.id = so.class_id AND so.override_date = ds.class_date)
    LEFT JOIN (
      SELECT 
        bookings.class_id AS booking_class_id,
        bookings.booking_date,
        COUNT(*) AS count_bookings
      FROM public.bookings
      WHERE bookings.status = 'confirmed' AND bookings.class_id IS NOT NULL
      GROUP BY bookings.class_id, bookings.booking_date
    ) bc ON (bc.booking_class_id = c.id AND bc.booking_date = ds.class_date)
    WHERE (c.is_active = true OR (so.id IS NOT NULL AND so.is_enabled = true))
  ),
  manual_classes AS (
    SELECT 
      true::boolean AS is_manual,
      NULL::uuid AS class_id,
      mcs.id AS manual_schedule_id,
      mcs.title AS title,
      mcs.instructor_name,
      mcs.class_date,
      mcs.start_time,
      mcs.end_time,
      mcs.max_students,
      mcs.is_enabled,
      mcs.notes,
      COALESCE(bm.count_manual_bookings, 0)::bigint AS current_bookings
    FROM public.manual_class_schedules mcs
    LEFT JOIN (
      SELECT 
        bookings.manual_schedule_id AS booking_manual_id,
        COUNT(*) AS count_manual_bookings
      FROM public.bookings
      WHERE bookings.status = 'confirmed' AND bookings.manual_schedule_id IS NOT NULL
      GROUP BY bookings.manual_schedule_id
    ) bm ON (bm.booking_manual_id = mcs.id)
    WHERE mcs.class_date BETWEEN start_date AND end_date
      AND mcs.is_enabled = true
  )
  SELECT 
    rc.is_manual,
    rc.class_id,
    rc.manual_schedule_id,
    rc.title,
    rc.instructor_name,
    rc.class_date,
    rc.start_time,
    rc.end_time,
    rc.max_students,
    rc.is_enabled,
    rc.notes,
    rc.current_bookings
  FROM regular_classes rc
  WHERE rc.is_enabled = true
  
  UNION ALL
  
  SELECT 
    mc.is_manual,
    mc.class_id,
    mc.manual_schedule_id,
    mc.title,
    mc.instructor_name,
    mc.class_date,
    mc.start_time,
    mc.end_time,
    mc.max_students,
    mc.is_enabled,
    mc.notes,
    mc.current_bookings
  FROM manual_classes mc
  
  ORDER BY class_date, start_time;
END;
$function$