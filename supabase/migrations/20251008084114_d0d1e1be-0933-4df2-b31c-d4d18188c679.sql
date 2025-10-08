-- Ensure RLS is enabled on user_roles table
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Keep existing SELECT policies:
-- "Users can view their own roles" - already exists
-- "Admins can view all roles" - already exists

-- Add INSERT policy: Only admins can assign roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add UPDATE policy: Only admins can modify roles
CREATE POLICY "Admins can update roles"
ON public.user_roles
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Add DELETE policy: Only admins can delete role assignments
CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Revoke any default public access
REVOKE ALL ON public.user_roles FROM PUBLIC;
REVOKE ALL ON public.user_roles FROM anon;

-- Grant necessary permissions to authenticated users (policies will restrict)
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_roles TO authenticated;

-- Document the security model
COMMENT ON TABLE public.user_roles IS 
'Critical security table for role-based access control. Protected by strict RLS policies:
- Only admins can INSERT, UPDATE, or DELETE role assignments (has_role admin check)
- Users can only view their own roles (auth.uid() = user_id)
- Admins can view all roles
- All other access is denied by default to prevent privilege escalation attacks';