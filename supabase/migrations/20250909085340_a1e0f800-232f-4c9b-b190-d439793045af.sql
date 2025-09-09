-- Add reference to manual schedules in bookings table
ALTER TABLE public.bookings ADD COLUMN manual_schedule_id uuid REFERENCES public.manual_class_schedules(id);

-- Create function to get available manual schedules for booking
CREATE OR REPLACE FUNCTION public.get_manual_schedules_for_booking(start_date date, end_date date)
RETURNS TABLE(
  id uuid,
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

-- Create function to book a manual schedule
CREATE OR REPLACE FUNCTION public.book_manual_schedule(
  p_user_id uuid,
  p_manual_schedule_id uuid,
  p_booking_date date
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
  -- Check if user is approved and active
  IF NOT (is_user_approved(p_user_id) AND is_user_active(p_user_id)) THEN
    RAISE EXCEPTION 'Usuario no autorizado para hacer reservas';
  END IF;
  
  -- Get schedule info
  SELECT * INTO schedule_info
  FROM public.manual_class_schedules
  WHERE id = p_manual_schedule_id AND is_enabled = true;
  
  IF schedule_info IS NULL THEN
    RAISE EXCEPTION 'Horario no encontrado o no disponible';
  END IF;
  
  -- Check if booking is for the correct date
  IF schedule_info.class_date != p_booking_date THEN
    RAISE EXCEPTION 'Fecha de reserva no coincide con el horario';
  END IF;
  
  -- Check capacity
  SELECT COUNT(*) INTO current_bookings
  FROM public.bookings
  WHERE manual_schedule_id = p_manual_schedule_id
    AND status = 'confirmed';
    
  IF current_bookings >= schedule_info.max_students THEN
    RAISE EXCEPTION 'La clase está completa. Máximo % estudiantes permitidos.', schedule_info.max_students;
  END IF;
  
  -- Check if user has remaining classes
  SELECT * INTO user_monthly_record
  FROM public.get_or_create_monthly_classes(p_user_id);
  
  IF user_monthly_record.remaining_classes <= 0 THEN
    RAISE EXCEPTION 'No tienes clases restantes este mes';
  END IF;
  
  -- Check booking advance (today or tomorrow only)
  IF p_booking_date < CURRENT_DATE THEN
    RAISE EXCEPTION 'No se pueden reservar fechas pasadas';
  END IF;
  
  IF p_booking_date > (CURRENT_DATE + INTERVAL '1 day')::date THEN
    RAISE EXCEPTION 'Solo puedes reservar con un día de antelación como máximo';
  END IF;
  
  -- Create booking
  INSERT INTO public.bookings (user_id, manual_schedule_id, booking_date, status)
  VALUES (p_user_id, p_manual_schedule_id, p_booking_date, 'confirmed')
  RETURNING * INTO result;
  
  -- Decrease monthly classes
  UPDATE public.user_monthly_classes
  SET remaining_classes = remaining_classes - 1,
      updated_at = now()
  WHERE user_id = p_user_id
    AND month = EXTRACT(month FROM CURRENT_DATE)
    AND year = EXTRACT(year FROM CURRENT_DATE);
  
  RETURN result;
END;
$$;

-- Update trigger for monthly classes to handle manual schedules
CREATE OR REPLACE FUNCTION public.decrease_monthly_classes_manual()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only decrease when a new booking is inserted with confirmed status
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' AND NEW.manual_schedule_id IS NOT NULL THEN
    UPDATE user_monthly_classes
    SET remaining_classes = remaining_classes - 1,
        updated_at = now()
    WHERE user_id = NEW.user_id
      AND month = EXTRACT(month FROM CURRENT_DATE)
      AND year = EXTRACT(year FROM CURRENT_DATE)
      AND remaining_classes > 0;
  -- Increase when a booking is deleted
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' AND OLD.manual_schedule_id IS NOT NULL THEN
    UPDATE user_monthly_classes
    SET remaining_classes = remaining_classes + 1,
        updated_at = now()
    WHERE user_id = OLD.user_id
      AND month = EXTRACT(month FROM CURRENT_DATE)
      AND year = EXTRACT(year FROM CURRENT_DATE);
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Drop old trigger and create new one for manual schedules
DROP TRIGGER IF EXISTS update_monthly_classes_on_booking ON bookings;

CREATE TRIGGER update_monthly_classes_on_booking_manual
  AFTER INSERT OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION decrease_monthly_classes_manual();