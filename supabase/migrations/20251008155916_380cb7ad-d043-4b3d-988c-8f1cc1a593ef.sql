-- Fix any security definer views by recreating them without that property
-- The trainer_visible_classes view should NOT be SECURITY DEFINER

DROP VIEW IF EXISTS public.trainer_visible_classes CASCADE;

-- Recreate without SECURITY DEFINER (views inherit RLS from underlying tables)
CREATE VIEW public.trainer_visible_classes 
WITH (security_invoker = true)
AS
SELECT
  b.id               AS booking_id,
  b.user_id          AS user_id,
  b.class_id         AS class_id,
  b.manual_schedule_id AS manual_schedule_id,
  b.booking_date     AS booking_date,
  b.attended         AS attended
FROM public.bookings b
WHERE b.status = 'confirmed'
  AND b.booking_date >= CURRENT_DATE - INTERVAL '30 days';

GRANT SELECT ON public.trainer_visible_classes TO authenticated;

COMMENT ON VIEW public.trainer_visible_classes IS 'Trainer view (security invoker): attendance only, no financial data.';