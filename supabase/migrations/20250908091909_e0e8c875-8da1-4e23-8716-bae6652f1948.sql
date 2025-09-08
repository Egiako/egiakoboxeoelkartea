-- Enforce booking capacity and 1-day advance limit; seed Mon-Thu classes

-- 1) Function to enforce max 1 day in advance (today and tomorrow only)
CREATE OR REPLACE FUNCTION public.check_booking_advance()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Disallow past dates
  IF NEW.booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se pueden reservar fechas pasadas';
  END IF;

  -- Allow booking today or tomorrow only
  IF NEW.booking_date > (CURRENT_DATE + INTERVAL '1 day')::date THEN
    RAISE EXCEPTION 'Solo puedes reservar con un día de antelación como máximo';
  END IF;

  RETURN NEW;
END;
$$;

-- 2) Attach/refresh triggers
DROP TRIGGER IF EXISTS trg_check_booking_advance ON public.bookings;
CREATE TRIGGER trg_check_booking_advance
BEFORE INSERT ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_booking_advance();

-- Ensure capacity check trigger is present
DROP TRIGGER IF EXISTS trg_check_class_capacity ON public.bookings;
CREATE TRIGGER trg_check_class_capacity
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.check_class_capacity();

-- 3) Seed classes for Mon-Thu at 09:00-10:00 and 18:00-19:00 if missing
DO $$
BEGIN
  -- Monday (1)
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE day_of_week = 1 AND start_time = '09:00:00') THEN
    INSERT INTO public.classes (title, description, day_of_week, start_time, end_time, max_students, is_active)
    VALUES ('Clase de Boxeo', 'Entrenamiento de boxeo', 1, '09:00:00', '10:00:00', 10, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE day_of_week = 1 AND start_time = '18:00:00') THEN
    INSERT INTO public.classes (title, description, day_of_week, start_time, end_time, max_students, is_active)
    VALUES ('Clase de Boxeo', 'Entrenamiento de boxeo', 1, '18:00:00', '19:00:00', 10, true);
  END IF;

  -- Tuesday (2)
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE day_of_week = 2 AND start_time = '09:00:00') THEN
    INSERT INTO public.classes (title, description, day_of_week, start_time, end_time, max_students, is_active)
    VALUES ('Clase de Boxeo', 'Entrenamiento de boxeo', 2, '09:00:00', '10:00:00', 10, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE day_of_week = 2 AND start_time = '18:00:00') THEN
    INSERT INTO public.classes (title, description, day_of_week, start_time, end_time, max_students, is_active)
    VALUES ('Clase de Boxeo', 'Entrenamiento de boxeo', 2, '18:00:00', '19:00:00', 10, true);
  END IF;

  -- Wednesday (3)
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE day_of_week = 3 AND start_time = '09:00:00') THEN
    INSERT INTO public.classes (title, description, day_of_week, start_time, end_time, max_students, is_active)
    VALUES ('Clase de Boxeo', 'Entrenamiento de boxeo', 3, '09:00:00', '10:00:00', 10, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE day_of_week = 3 AND start_time = '18:00:00') THEN
    INSERT INTO public.classes (title, description, day_of_week, start_time, end_time, max_students, is_active)
    VALUES ('Clase de Boxeo', 'Entrenamiento de boxeo', 3, '18:00:00', '19:00:00', 10, true);
  END IF;

  -- Thursday (4)
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE day_of_week = 4 AND start_time = '09:00:00') THEN
    INSERT INTO public.classes (title, description, day_of_week, start_time, end_time, max_students, is_active)
    VALUES ('Clase de Boxeo', 'Entrenamiento de boxeo', 4, '09:00:00', '10:00:00', 10, true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.classes WHERE day_of_week = 4 AND start_time = '18:00:00') THEN
    INSERT INTO public.classes (title, description, day_of_week, start_time, end_time, max_students, is_active)
    VALUES ('Clase de Boxeo', 'Entrenamiento de boxeo', 4, '18:00:00', '19:00:00', 10, true);
  END IF;
END $$;