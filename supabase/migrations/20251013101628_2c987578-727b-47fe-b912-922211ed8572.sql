-- Fix security warning: Add search_path to check_booking_advance function
DROP FUNCTION IF EXISTS check_booking_advance() CASCADE;

CREATE OR REPLACE FUNCTION check_booking_advance()
RETURNS TRIGGER AS $$
DECLARE
  v_next_monday DATE;
  v_next_sunday DATE;
  v_today DATE;
  v_today_dow INTEGER;
BEGIN
  -- Get today's date and day of week (0=Sunday, 1=Monday, etc.)
  v_today := CURRENT_DATE;
  v_today_dow := EXTRACT(DOW FROM v_today);
  
  -- Calculate next Monday
  -- If today is Sunday (0), next Monday is tomorrow
  -- Otherwise, calculate days until next Monday
  IF v_today_dow = 0 THEN
    v_next_monday := v_today + INTERVAL '1 day';
  ELSE
    v_next_monday := v_today + INTERVAL '1 day' * (8 - v_today_dow);
  END IF;
  
  -- Calculate next Sunday (6 days after next Monday)
  v_next_sunday := v_next_monday + INTERVAL '6 days';
  
  -- Check if booking_date is within the allowed window
  IF NEW.booking_date < v_next_monday OR NEW.booking_date > v_next_sunday THEN
    RAISE EXCEPTION 'Las reservas solo están disponibles para la próxima semana (del % al %). Cada domingo se habilitan las reservas para la semana siguiente.', 
      v_next_monday, v_next_sunday;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

-- Recreate trigger
CREATE TRIGGER trg_check_booking_advance
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_advance();