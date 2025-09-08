-- Ensure bookings table is in realtime publication and full row data is available
ALTER TABLE public.bookings REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;

-- Admins can view all bookings
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
      AND tablename = 'bookings' 
      AND policyname = 'Admins can view all bookings'
  ) THEN
    CREATE POLICY "Admins can view all bookings"
    ON public.bookings
    FOR SELECT
    USING (public.has_role(auth.uid(), 'admin'));
  END IF;
END $$;

-- Function to get global booking counts bypassing RLS
CREATE OR REPLACE FUNCTION public.get_booking_counts(_dates date[])
RETURNS TABLE (class_id uuid, booking_date date, count integer)
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT class_id, booking_date, COUNT(*)::int as count
  FROM public.bookings
  WHERE booking_date = ANY(_dates) AND status = 'confirmed'
  GROUP BY class_id, booking_date;
$$;

-- Triggers to enforce capacity, booking window and monthly classes
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_class_capacity') THEN
    CREATE TRIGGER trg_check_class_capacity
    BEFORE INSERT OR UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.check_class_capacity();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_booking_advance') THEN
    CREATE TRIGGER trg_check_booking_advance
    BEFORE INSERT OR UPDATE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.check_booking_advance();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_check_and_update_classes') THEN
    CREATE TRIGGER trg_check_and_update_classes
    AFTER INSERT ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.check_and_update_classes();
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_restore_classes_on_cancel') THEN
    CREATE TRIGGER trg_restore_classes_on_cancel
    AFTER DELETE ON public.bookings
    FOR EACH ROW EXECUTE FUNCTION public.restore_classes_on_cancel();
  END IF;
END $$;