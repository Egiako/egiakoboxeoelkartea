-- Remove duplicate triggers that are causing double deduction of classes

-- Drop the duplicate trigger that uses check_and_update_classes
DROP TRIGGER IF EXISTS trg_check_and_update_classes ON public.bookings;

-- Drop the duplicate trigger that uses check_class_capacity (there are two with same function)
DROP TRIGGER IF EXISTS trg_check_class_capacity ON public.bookings;

-- Drop the duplicate function that was decreasing classes twice
DROP FUNCTION IF EXISTS public.check_and_update_classes();

-- Drop the restore classes trigger as its functionality is already covered by decrease_monthly_classes
DROP TRIGGER IF EXISTS trg_restore_classes_on_cancel ON public.bookings;
DROP FUNCTION IF EXISTS public.restore_classes_on_cancel();

-- Keep only the booking_monthly_classes_trigger which handles both INSERT and DELETE properly
-- This trigger uses decrease_monthly_classes() function which already handles:
-- - Decreasing classes on INSERT with confirmed status
-- - Increasing classes on DELETE with confirmed status

-- Also keep check_booking_capacity trigger (not the duplicate trg_check_class_capacity)
-- This ensures class capacity limits are still enforced