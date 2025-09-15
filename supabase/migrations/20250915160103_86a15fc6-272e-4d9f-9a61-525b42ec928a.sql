-- Create a restricted trainer view that only exposes essential user information
CREATE OR REPLACE VIEW public.trainer_user_view AS
SELECT 
  id,
  user_id,
  first_name,
  last_name,
  created_at,
  is_active,
  approval_status
FROM public.profiles
WHERE is_active = true AND approval_status = 'approved';

-- Grant access to the view for authenticated users
GRANT SELECT ON public.trainer_user_view TO authenticated;

-- Enable RLS on the view
ALTER VIEW public.trainer_user_view SET (security_invoker = true);

-- Update RLS policies to restrict trainer access to sensitive profile data
-- First, drop the existing overly permissive trainer policies
DROP POLICY IF EXISTS "Trainers can view relevant user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Trainers can view active approved profiles" ON public.profiles;

-- Create a new restrictive policy that only allows trainers to see non-sensitive data
-- through the trainer view or for users they actually need to manage
CREATE POLICY "Trainers can view limited profile data for their students"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'trainer'::app_role) 
  AND is_active = true 
  AND approval_status = 'approved'::approval_status
  AND trainer_can_view_user_profile(auth.uid(), user_id)
);

-- Update the trainer_can_view_user_profile function to be more restrictive
-- It should only allow viewing profiles of users who have current/recent bookings
CREATE OR REPLACE FUNCTION public.trainer_can_view_user_profile(trainer_id uuid, target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  -- Check if trainer_id is actually a trainer
  IF NOT public.has_role(trainer_id, 'trainer'::app_role) THEN
    RETURN false;
  END IF;
  
  -- Only allow viewing profiles of users with recent bookings (last 30 days)
  -- This restricts access to only relevant students
  RETURN EXISTS (
    -- Check recent bookings for regular classes
    SELECT 1 
    FROM public.bookings b
    WHERE b.user_id = target_user_id 
      AND b.status = 'confirmed'
      AND b.booking_date >= (CURRENT_DATE - INTERVAL '30 days')
      AND b.booking_date <= (CURRENT_DATE + INTERVAL '7 days') -- Include near future bookings
      
    UNION
    
    -- Check recent manual schedule bookings
    SELECT 1 
    FROM public.bookings b
    WHERE b.user_id = target_user_id 
      AND b.manual_schedule_id IS NOT NULL
      AND b.status = 'confirmed'
      AND b.booking_date >= (CURRENT_DATE - INTERVAL '30 days')
      AND b.booking_date <= (CURRENT_DATE + INTERVAL '7 days')
  );
END;
$$;