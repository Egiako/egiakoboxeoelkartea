-- Update booking check to allow reservations for any day of current month
DROP FUNCTION IF EXISTS check_booking_advance() CASCADE;

CREATE OR REPLACE FUNCTION check_booking_advance()
RETURNS TRIGGER AS $$
DECLARE
  v_today DATE;
  v_first_day_of_month DATE;
  v_last_day_of_month DATE;
BEGIN
  v_today := CURRENT_DATE;
  
  -- Calculate first and last day of current month
  v_first_day_of_month := DATE_TRUNC('month', v_today)::DATE;
  v_last_day_of_month := (DATE_TRUNC('month', v_today) + INTERVAL '1 month - 1 day')::DATE;
  
  -- Allow bookings from today to end of current month
  IF NEW.booking_date < v_today OR NEW.booking_date > v_last_day_of_month THEN
    RAISE EXCEPTION 'Solo se pueden reservar clases desde hoy (%) hasta el final del mes actual (%).', v_today, v_last_day_of_month;
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