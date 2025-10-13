-- Fix booking advance check to allow current week + next week (14 days total)
DROP FUNCTION IF EXISTS check_booking_advance() CASCADE;

CREATE OR REPLACE FUNCTION check_booking_advance()
RETURNS TRIGGER AS $$
DECLARE
  v_today DATE;
  v_today_dow INTEGER;
  v_current_monday DATE;
  v_next_sunday DATE;
BEGIN
  v_today := CURRENT_DATE;
  v_today_dow := EXTRACT(DOW FROM v_today);

  IF v_today_dow = 0 THEN
    v_current_monday := v_today - INTERVAL '6 days';
  ELSE
    v_current_monday := v_today - INTERVAL '1 day' * (v_today_dow - 1);
  END IF;

  v_next_sunday := v_current_monday + INTERVAL '13 days';

  IF NEW.booking_date < v_current_monday OR NEW.booking_date > v_next_sunday THEN
    RAISE EXCEPTION 'Solo se pueden reservar clases desde el lunes de esta semana (%) hasta el domingo de la próxima semana (%).', v_current_monday, v_next_sunday;
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