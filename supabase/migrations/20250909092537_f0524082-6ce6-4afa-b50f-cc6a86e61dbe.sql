-- Remove the overly permissive trainer policy
DROP POLICY "Trainers can view all profiles" ON public.profiles;

-- Create new restrictive policies for trainers
CREATE POLICY "Trainers can view relevant user profiles" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'trainer'::app_role) 
  AND public.trainer_can_view_user_profile(auth.uid(), user_id)
);

-- Allow trainers to view their own profile
CREATE POLICY "Trainers can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (
  has_role(auth.uid(), 'trainer'::app_role) 
  AND auth.uid() = user_id
);