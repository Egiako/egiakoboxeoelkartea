BEGIN;

-- Tighten profiles table SELECT access and remove any possibility of implicit public access
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Active users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Trainers can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Trainers can view relevant user profiles" ON public.profiles;
DROP POLICY IF EXISTS "Authenticated users can view their own profile" ON public.profiles;

-- Recreate SELECT policies explicitly scoped to authenticated users only
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view their own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Trainers can view relevant user profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'trainer'::app_role) AND trainer_can_view_user_profile(auth.uid(), user_id));

-- Note: Existing UPDATE and INSERT policies remain unchanged to preserve behavior
COMMIT;