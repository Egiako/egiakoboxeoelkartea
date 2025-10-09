-- Drop the vulnerable policy that allows unrestricted updates
DROP POLICY IF EXISTS "Users can update safe profile fields" ON public.profiles;

-- Create a secure policy that only allows updates to safe fields
CREATE POLICY "Users can update safe profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (
  auth.uid() = user_id
  -- Ensure safe fields are not empty
  AND (first_name IS NOT NULL AND first_name != '')
  AND (last_name IS NOT NULL AND last_name != '')
  AND (phone IS NOT NULL AND phone != '')
  -- CRITICAL: Prevent modification of sensitive fields
  AND approval_status = (SELECT approval_status FROM public.profiles WHERE user_id = auth.uid())
  AND is_active = (SELECT is_active FROM public.profiles WHERE user_id = auth.uid())
  AND is_reregistration = (SELECT is_reregistration FROM public.profiles WHERE user_id = auth.uid())
  AND (previous_status IS NOT DISTINCT FROM (SELECT previous_status FROM public.profiles WHERE user_id = auth.uid()))
  AND email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
  AND user_id = auth.uid()
);