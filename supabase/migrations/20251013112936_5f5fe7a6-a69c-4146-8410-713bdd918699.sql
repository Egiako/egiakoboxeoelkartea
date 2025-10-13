-- Update booking advance check to enforce weekly booking rules
-- Bookings are unlocked every Sunday for the next week
-- During the current week, users can book any class of that week

-- Drop existing triggers first
DROP TRIGGER IF EXISTS check_booking_date ON public.bookings;
DROP TRIGGER IF EXISTS trg_check_booking_advance ON public.bookings;

-- Drop the function with CASCADE to handle any remaining dependencies
DROP FUNCTION IF EXISTS public.check_booking_advance() CASCADE;

-- Recreate the function with new logic
CREATE OR REPLACE FUNCTION public.check_booking_advance()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $function$
DECLARE
  v_today DATE;
  v_current_day_of_week INTEGER;
  v_current_week_monday DATE;
  v_current_week_sunday DATE;
  v_next_week_monday DATE;
  v_next_week_sunday DATE;
BEGIN
  v_today := CURRENT_DATE;
  
  -- Get current day of week (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  v_current_day_of_week := EXTRACT(DOW FROM v_today);
  
  -- Calculate Monday of current week
  v_current_week_monday := v_today - ((v_current_day_of_week + 6) % 7);
  
  -- Calculate Sunday of current week
  v_current_week_sunday := v_current_week_monday + 6;
  
  -- Calculate next week's Monday and Sunday
  v_next_week_monday := v_current_week_monday + 7;
  v_next_week_sunday := v_current_week_sunday + 7;
  
  -- Cannot book past dates
  IF NEW.booking_date < v_today THEN
    RAISE EXCEPTION 'No se pueden reservar clases en fechas pasadas.';
  END IF;
  
  -- If today is Sunday (0), allow bookings for current week AND next week
  IF v_current_day_of_week = 0 THEN
    IF NEW.booking_date >= v_current_week_monday AND NEW.booking_date <= v_next_week_sunday THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Los domingos se pueden reservar clases de la semana actual (% a %) y la semana siguiente (% a %).',
        v_current_week_monday, v_current_week_sunday, v_next_week_monday, v_next_week_sunday;
    END IF;
  -- If not Sunday, only allow bookings for current week
  ELSE
    IF NEW.booking_date >= v_today AND NEW.booking_date <= v_current_week_sunday THEN
      RETURN NEW;
    ELSE
      RAISE EXCEPTION 'Solo se pueden reservar clases desde hoy (%) hasta el domingo de esta semana (%). Las reservas para la próxima semana se desbloquean el domingo.',
        v_today, v_current_week_sunday;
    END IF;
  END IF;
END;
$function$;

-- Create trigger
CREATE TRIGGER check_booking_date
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_booking_advance();