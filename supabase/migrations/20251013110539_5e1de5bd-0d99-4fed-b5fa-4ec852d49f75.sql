-- Update booking check to allow current week only, next week opens on Sundays
DROP FUNCTION IF EXISTS check_booking_advance() CASCADE;

CREATE OR REPLACE FUNCTION check_booking_advance()
RETURNS TRIGGER AS $$
DECLARE
  v_today DATE;
  v_today_dow INTEGER;
  v_current_monday DATE;
  v_current_sunday DATE;
  v_max_booking_date DATE;
BEGIN
  v_today := CURRENT_DATE;
  v_today_dow := EXTRACT(DOW FROM v_today);
  
  -- Calculate Monday of current week
  IF v_today_dow = 0 THEN
    -- Today is Sunday, current week starts yesterday (Monday)
    v_current_monday := v_today - INTERVAL '6 days';
  ELSE
    v_current_monday := v_today - INTERVAL '1 day' * (v_today_dow - 1);
  END IF;
  
  -- Calculate Sunday of current week
  v_current_sunday := v_current_monday + INTERVAL '6 days';
  
  -- Determine max booking date based on day of week
  IF v_today_dow = 0 THEN
    -- Today is Sunday: can book up to next Sunday
    v_max_booking_date := v_current_sunday + INTERVAL '7 days';
  ELSE
    -- Monday-Saturday: can only book up to current Sunday
    v_max_booking_date := v_current_sunday;
  END IF;
  
  -- Check if booking date is valid (from today to max_booking_date)
  IF NEW.booking_date < v_today OR NEW.booking_date > v_max_booking_date THEN
    IF v_today_dow = 0 THEN
      RAISE EXCEPTION 'Solo se pueden reservar clases desde hoy hasta el domingo de la próxima semana (%). Las clases de la próxima semana están disponibles los domingos.', v_max_booking_date;
    ELSE
      RAISE EXCEPTION 'Solo se pueden reservar clases desde hoy hasta el domingo de esta semana (%). Las clases de la próxima semana estarán disponibles el domingo.', v_max_booking_date;
    END IF;
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