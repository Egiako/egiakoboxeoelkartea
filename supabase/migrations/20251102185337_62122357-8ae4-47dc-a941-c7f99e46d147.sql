-- Fix the double decrement issue by dropping the problematic trigger
-- The RPC function already handles the class decrement correctly
DROP TRIGGER IF EXISTS booking_monthly_classes_unified ON public.bookings;
DROP FUNCTION IF EXISTS public.handle_booking_monthly_classes();

-- This trigger was causing double decrements because it was firing on INSERT
-- while create_reservation_safe already decrements the classes manually