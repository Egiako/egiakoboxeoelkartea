BEGIN;

-- Remove existing triggers if any to avoid duplicates
DROP TRIGGER IF EXISTS trg_check_class_capacity ON public.bookings;
DROP TRIGGER IF EXISTS trg_check_booking_advance ON public.bookings;
DROP TRIGGER IF EXISTS trg_decrease_monthly_classes_ins ON public.bookings;
DROP TRIGGER IF EXISTS trg_decrease_monthly_classes_del ON public.bookings;

-- Enforce capacity for class-based bookings
CREATE TRIGGER trg_check_class_capacity
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
WHEN (NEW.class_id IS NOT NULL)
EXECUTE FUNCTION public.check_class_capacity();

-- Enforce booking date policy (hoy o mañana)
CREATE TRIGGER trg_check_booking_advance
BEFORE INSERT OR UPDATE ON public.bookings
FOR EACH ROW
WHEN (NEW.class_id IS NOT NULL)
EXECUTE FUNCTION public.check_booking_advance();

-- Keep monthly classes in sync on create/delete
CREATE TRIGGER trg_decrease_monthly_classes_ins
AFTER INSERT ON public.bookings
FOR EACH ROW
WHEN (NEW.class_id IS NOT NULL)
EXECUTE FUNCTION public.decrease_monthly_classes();

CREATE TRIGGER trg_decrease_monthly_classes_del
AFTER DELETE ON public.bookings
FOR EACH ROW
WHEN (OLD.class_id IS NOT NULL)
EXECUTE FUNCTION public.decrease_monthly_classes();

COMMIT;