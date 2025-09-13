-- Update booking advance check to allow monthly bookings instead of 1-day advance
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

  -- Allow booking for the entire current month
  IF EXTRACT(month FROM NEW.booking_date) != EXTRACT(month FROM CURRENT_DATE)
     OR EXTRACT(year FROM NEW.booking_date) != EXTRACT(year FROM CURRENT_DATE) THEN
    RAISE EXCEPTION 'Solo puedes reservar clases del mes actual';
  END IF;

  RETURN NEW;
END;
$$;

-- Update manual booking function to use new date policy
CREATE OR REPLACE FUNCTION public.book_manual_schedule(p_user_id uuid, p_manual_schedule_id uuid)
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
  
  -- Capacity check
  SELECT COUNT(*) INTO current_bookings
  FROM public.bookings
  WHERE manual_schedule_id = p_manual_schedule_id
    AND status = 'confirmed';
  
  IF current_bookings >= schedule_info.max_students THEN
    RAISE EXCEPTION 'La clase está completa. Máximo % estudiantes permitidos.', schedule_info.max_students;
  END IF;
  
  -- Remaining classes check
  SELECT * INTO user_monthly_record
  FROM public.get_or_create_monthly_classes(p_user_id);
  
  IF user_monthly_record.remaining_classes <= 0 THEN
    RAISE EXCEPTION 'No tienes clases restantes este mes';
  END IF;
  
  -- Updated date policy: allow current month bookings
  IF schedule_info.class_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se pueden reservar fechas pasadas';
  END IF;
  
  IF EXTRACT(month FROM schedule_info.class_date) != EXTRACT(month FROM CURRENT_DATE)
     OR EXTRACT(year FROM schedule_info.class_date) != EXTRACT(year FROM CURRENT_DATE) THEN
    RAISE EXCEPTION 'Solo puedes reservar clases del mes actual';
  END IF;

  INSERT INTO public.bookings (user_id, manual_schedule_id, booking_date, status)
  VALUES (p_user_id, p_manual_schedule_id, schedule_info.class_date, 'confirmed')
  RETURNING * INTO result;

  RETURN result;
END;
$$;