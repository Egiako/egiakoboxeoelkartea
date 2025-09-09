BEGIN;

-- Remove all the duplicate monthly classes triggers
DROP TRIGGER IF EXISTS booking_monthly_classes_trigger ON public.bookings;
DROP TRIGGER IF EXISTS update_monthly_classes_on_booking_manual ON public.bookings;
DROP TRIGGER IF EXISTS trg_decrease_monthly_classes_ins ON public.bookings;
DROP TRIGGER IF EXISTS trg_decrease_monthly_classes_del ON public.bookings;

-- Create a single unified trigger that handles both cases correctly
CREATE OR REPLACE FUNCTION public.handle_booking_monthly_classes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Handle INSERT (new booking)
  IF TG_OP = 'INSERT' AND NEW.status = 'confirmed' THEN
    -- Only decrease for class bookings (class_id) or manual schedules (manual_schedule_id)
    IF NEW.class_id IS NOT NULL OR NEW.manual_schedule_id IS NOT NULL THEN
      UPDATE user_monthly_classes
      SET remaining_classes = remaining_classes - 1,
          updated_at = now()
      WHERE user_id = NEW.user_id
        AND month = EXTRACT(month FROM CURRENT_DATE)
        AND year = EXTRACT(year FROM CURRENT_DATE)
        AND remaining_classes > 0;
    END IF;
  -- Handle DELETE (cancelled booking)
  ELSIF TG_OP = 'DELETE' AND OLD.status = 'confirmed' THEN
    -- Only increase for class bookings (class_id) or manual schedules (manual_schedule_id)
    IF OLD.class_id IS NOT NULL OR OLD.manual_schedule_id IS NOT NULL THEN
      UPDATE user_monthly_classes
      SET remaining_classes = remaining_classes + 1,
          updated_at = now()
      WHERE user_id = OLD.user_id
        AND month = EXTRACT(month FROM CURRENT_DATE)
        AND year = EXTRACT(year FROM CURRENT_DATE);
    END IF;
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Create single trigger for monthly classes management
CREATE TRIGGER booking_monthly_classes_unified
AFTER INSERT OR DELETE ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.handle_booking_monthly_classes();

COMMIT;