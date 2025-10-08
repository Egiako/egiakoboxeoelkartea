-- Remove the overly permissive trainer SELECT policy on profiles
-- Trainers will access data only through safe RPC functions that return limited fields

DROP POLICY IF EXISTS "Trainers can view all profiles" ON public.profiles;

-- Add a comment to document why this policy was removed
COMMENT ON TABLE public.profiles IS 'Trainers access profile data through secure RPC functions (trainer_get_profiles, trainer_get_all_bookings) that return only non-sensitive fields. Direct SELECT access is restricted to admins and users viewing their own profiles.';