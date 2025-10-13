-- Update booking advance check to allow bookings from today to next Sunday
DROP FUNCTION IF EXISTS check_booking_advance() CASCADE;

CREATE OR REPLACE FUNCTION check_booking_advance()
RETURNS TRIGGER AS $$
DECLARE
  v_today DATE;
  v_today_dow INTEGER;
  v_current_sunday DATE;
  v_next_sunday DATE;
BEGIN
  v_today := CURRENT_DATE;
  v_today_dow := EXTRACT(DOW FROM v_today);
  
  -- Calculate the Sunday of current week
  IF v_today_dow = 0 THEN
    v_current_sunday := v_today;
  ELSE
    v_current_sunday := v_today + INTERVAL '1 day' * (7 - v_today_dow);
  END IF;
  
  -- Calculate the Sunday of next week
  v_next_sunday := v_current_sunday + INTERVAL '7 days';
  
  -- Allow bookings from today to next Sunday
  IF NEW.booking_date < v_today OR NEW.booking_date > v_next_sunday THEN
    RAISE EXCEPTION 'Solo se pueden reservar clases desde hoy (%) hasta el domingo de la próxima semana (%).', v_today, v_next_sunday;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql
SET search_path = public;

DROP TRIGGER IF EXISTS trg_check_booking_advance ON bookings;

CREATE TRIGGER trg_check_booking_advance
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_advance();