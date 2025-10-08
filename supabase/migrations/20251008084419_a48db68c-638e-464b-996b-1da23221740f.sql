-- Drop the overly permissive INSERT policy that allows any authenticated user to insert
DROP POLICY IF EXISTS "System can insert monthly classes" ON public.user_monthly_classes;

-- Create restrictive INSERT policy: Only admins can manually insert records
-- Note: SECURITY DEFINER functions (like get_or_create_monthly_classes) will bypass this policy
CREATE POLICY "Only admins can insert monthly classes"
ON public.user_monthly_classes
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Revoke any default public access
REVOKE ALL ON public.user_monthly_classes FROM PUBLIC;
REVOKE ALL ON public.user_monthly_classes FROM anon;

-- Grant necessary permissions to authenticated users (policies will restrict)
GRANT SELECT, INSERT, UPDATE ON public.user_monthly_classes TO authenticated;

-- Document the security model
COMMENT ON TABLE public.user_monthly_classes IS 
'Tracks monthly class allowances for users. Protected by strict RLS policies:
- Only admins can manually INSERT records (has_role admin check)
- System operations use SECURITY DEFINER functions that bypass RLS
- Users can only view their own monthly classes (auth.uid() = user_id)
- Admins and trainers can view all monthly classes
- Only admins can UPDATE class allocations
- All other access is denied by default to prevent class allocation manipulation';