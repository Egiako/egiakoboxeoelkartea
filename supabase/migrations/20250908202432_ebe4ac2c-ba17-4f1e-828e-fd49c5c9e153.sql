-- Drop existing function first
DROP FUNCTION IF EXISTS get_booking_counts(date[]);

-- Create function to get booking counts for multiple dates
CREATE OR REPLACE FUNCTION get_booking_counts(_dates date[])
RETURNS TABLE(class_id uuid, booking_date date, count bigint)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    b.class_id,
    b.booking_date::date,
    COUNT(*)::bigint as count
  FROM bookings b
  WHERE b.booking_date = ANY(_dates)
    AND b.status = 'confirmed'
  GROUP BY b.class_id, b.booking_date;
END;
$$;

-- Create function to get or create monthly classes for a user
CREATE OR REPLACE FUNCTION get_or_create_monthly_classes(user_uuid uuid)
RETURNS user_monthly_classes
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_month int := EXTRACT(month FROM CURRENT_DATE);
  current_year int := EXTRACT(year FROM CURRENT_DATE);
  result user_monthly_classes;
BEGIN
  -- Try to get existing record
  SELECT * INTO result
  FROM user_monthly_classes
  WHERE user_id = user_uuid
    AND month = current_month
    AND year = current_year;

  -- If no record exists, create one
  IF result IS NULL THEN
    INSERT INTO user_monthly_classes (user_id, month, year, remaining_classes)
    VALUES (user_uuid, current_month, current_year, 12)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$;

-- Create trigger function to decrease remaining classes when booking is confirmed
CREATE OR REPLACE FUNCTION decrease_monthly_classes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Only decrease when a new booking is inserted with confirmed status
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    UPDATE user_monthly_classes
    SET remaining_classes = remaining_classes - 1,
        updated_at = now()
    WHERE user_id = NEW.user_id
      AND month = EXTRACT(month FROM CURRENT_DATE)
      AND year = EXTRACT(year FROM CURRENT_DATE)
      AND remaining_classes > 0;
  -- Increase when a booking is deleted
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
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

-- Create trigger for booking changes
DROP TRIGGER IF EXISTS booking_monthly_classes_trigger ON bookings;
CREATE TRIGGER booking_monthly_classes_trigger
  AFTER INSERT OR DELETE ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION decrease_monthly_classes();