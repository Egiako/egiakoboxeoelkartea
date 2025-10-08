-- Restrict trainer access to user_monthly_classes table
-- Remove overly permissive policy that allows trainers to see all users
DROP POLICY IF EXISTS "Trainers can view all monthly classes" ON public.user_monthly_classes;

-- Create restrictive policy: trainers can only see users who have active bookings
CREATE POLICY "Trainers see only users with bookings"
ON public.user_monthly_classes
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'trainer'::app_role) 
  AND EXISTS (
    SELECT 1
    FROM public.bookings b
    WHERE b.user_id = user_monthly_classes.user_id
      AND b.status = 'confirmed'
      AND b.booking_date >= CURRENT_DATE - INTERVAL '30 days'
  )
);

-- Update table documentation
COMMENT ON TABLE public.user_monthly_classes IS 
'Tracks monthly class allowances per user.
Protected by baseline deny-all policy with explicit grants for:
- Users can view their own records (when approved and active)
- Admins can view/modify all records
- Trainers can ONLY view users with confirmed bookings in last 30 days
- All other access explicitly denied';

-- Update policy documentation
COMMENT ON POLICY "Trainers see only users with bookings" ON public.user_monthly_classes IS 
'Trainers can only view monthly class data for users who have confirmed bookings within the last 30 days. This prevents exposure of business-sensitive subscription and usage data for all users.';