-- Drop all existing policies on profiles to start with a clean slate
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Trainers can view all profiles" ON public.profiles;

-- Ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view ONLY their own profile
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can update ONLY their own profile
CREATE POLICY "Users can update own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can insert their own profile (during signup)
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins have full access to all profiles
CREATE POLICY "Admins have full access"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Revoke any default public access
REVOKE ALL ON public.profiles FROM PUBLIC;
REVOKE ALL ON public.profiles FROM anon;

-- Grant necessary access to authenticated users (policies will restrict)
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;

-- Document the security model
COMMENT ON TABLE public.profiles IS 
'Contains sensitive user data (email, phone, etc.). Protected by RLS policies:
- Users can only view/update their own profile (auth.uid() = user_id)
- Admins can view/update all profiles (has_role admin check)
- Trainers access data through secure RPC functions that return only non-sensitive fields
- All other access is denied by default';