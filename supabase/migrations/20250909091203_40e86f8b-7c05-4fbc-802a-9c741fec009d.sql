-- 1) Allow bookings to reference either base classes or manual schedules
ALTER TABLE public.bookings ALTER COLUMN class_id DROP NOT NULL;

-- Ensure at least one reference is present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_constraint 
    WHERE conname = 'bookings_class_or_manual_check'
  ) THEN
    ALTER TABLE public.bookings
    ADD CONSTRAINT bookings_class_or_manual_check 
    CHECK (class_id IS NOT NULL OR manual_schedule_id IS NOT NULL);
  END IF;
END $$;

-- 2) Unified function: base classes (with overrides) + manual classes
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
AS $$
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
    JOIN public.classes c ON true
    LEFT JOIN public.class_instructors ci ON (c.id = ci.class_id AND ci.specific_date IS NULL)
    LEFT JOIN public.schedule_overrides so ON (c.id = so.class_id AND so.override_date = d.d)
    WHERE c.is_active = true
       OR (so.id IS NOT NULL AND so.is_enabled = true)
  ),
  base_with_counts AS (
    SELECT 
      b.*,
      COALESCE(bc.booking_count, 0)::bigint AS current_bookings
    FROM base b
    LEFT JOIN (
      SELECT class_id, booking_date, COUNT(*) AS booking_count
      FROM public.bookings
      WHERE status = 'confirmed' AND class_id IS NOT NULL
      GROUP BY class_id, booking_date
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
      SELECT manual_schedule_id, COUNT(*) AS booking_count
      FROM public.bookings
      WHERE status = 'confirmed' AND manual_schedule_id IS NOT NULL
      GROUP BY manual_schedule_id
    ) bc2 ON bc2.manual_schedule_id = mcs.id
    WHERE mcs.class_date BETWEEN start_date AND end_date
      AND mcs.is_enabled = true
  )
  SELECT * FROM base_with_counts
  UNION ALL
  SELECT * FROM manual
  ORDER BY class_date, start_time;
END;
$$;

-- 3) Safer booking function for manual schedules (ensure RLS-compatible)
CREATE OR REPLACE FUNCTION public.book_manual_schedule(
  p_user_id uuid,
  p_manual_schedule_id uuid
)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result bookings;
  schedule_info manual_class_schedules;
  current_bookings integer;
  user_monthly_record user_monthly_classes;
BEGIN
  SELECT * INTO schedule_info
  FROM public.manual_class_schedules
  WHERE id = p_manual_schedule_id AND is_enabled = true;
  
  IF schedule_info IS NULL THEN
    RAISE EXCEPTION 'Horario no encontrado o no disponible';
  END IF;
  
  -- Capacity
  SELECT COUNT(*) INTO current_bookings
  FROM public.bookings
  WHERE manual_schedule_id = p_manual_schedule_id
    AND status = 'confirmed';
  
  IF current_bookings >= schedule_info.max_students THEN
    RAISE EXCEPTION 'La clase está completa. Máximo % estudiantes permitidos.', schedule_info.max_students;
  END IF;
  
  -- Remaining classes
  SELECT * INTO user_monthly_record
  FROM public.get_or_create_monthly_classes(p_user_id);
  
  IF user_monthly_record.remaining_classes <= 0 THEN
    RAISE EXCEPTION 'No tienes clases restantes este mes';
  END IF;
  
  -- Date policy today/tomorrow
  IF schedule_info.class_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se pueden reservar fechas pasadas';
  END IF;
  IF schedule_info.class_date > (CURRENT_DATE + INTERVAL '1 day')::date THEN
    RAISE EXCEPTION 'Solo puedes reservar con un día de antelación como máximo';
  END IF;

  INSERT INTO public.bookings (user_id, manual_schedule_id, booking_date, status)
  VALUES (p_user_id, p_manual_schedule_id, schedule_info.class_date, 'confirmed')
  RETURNING * INTO result;

  RETURN result;
END;
$$;