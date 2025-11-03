-- Drop and recreate with correct return type
DROP FUNCTION IF EXISTS public.get_booking_counts(date[]);

-- Aggregate booking counts for given dates, bypassing RLS safely
CREATE FUNCTION public.get_booking_counts(_dates date[])
RETURNS TABLE (
  class_key uuid,
  booking_date date,
  count integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    COALESCE(b.class_id, b.manual_schedule_id) AS class_key,
    b.booking_date,
    COUNT(*)::integer AS count
  FROM public.bookings b
  WHERE b.status = 'confirmed'
    AND b.booking_date = ANY(_dates)
  GROUP BY 1, 2
  ORDER BY 2, 1;
$$;

-- Lock down and grant execution rights
REVOKE ALL ON FUNCTION public.get_booking_counts(date[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_booking_counts(date[]) TO authenticated;