-- Ensure RLS is enabled on profiles table
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove any existing overly permissive or ineffective deny policies
DROP POLICY IF EXISTS "Deny all public access to profiles" ON public.profiles;

-- Explicitly block all unauthenticated (public/anon) access to profiles
CREATE POLICY "Block unauthenticated public access"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Add comment documenting the security model
COMMENT ON TABLE public.profiles IS 
'Contains sensitive user personal information (names, emails, phone numbers).
Protected by strict RLS policies:
- Anonymous/unauthenticated users are explicitly denied all access
- Authenticated users can only view/update their own profile (auth.uid() = user_id)
- Admins have full access to all profiles (has_role admin check)
- All operations require authentication by default';
