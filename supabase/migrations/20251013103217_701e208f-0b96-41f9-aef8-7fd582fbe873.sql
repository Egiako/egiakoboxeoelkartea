-- Fix trigger function call - add missing parentheses
DROP TRIGGER IF EXISTS trg_check_booking_advance ON bookings;

CREATE TRIGGER trg_check_booking_advance
  BEFORE INSERT OR UPDATE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION check_booking_advance();