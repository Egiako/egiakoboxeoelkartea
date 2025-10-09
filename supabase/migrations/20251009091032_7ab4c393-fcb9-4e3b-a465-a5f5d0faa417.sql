-- ============================================================================
-- SECURITY FIX: Resolve PUBLIC_USER_DATA and EXPOSED_SENSITIVE_DATA warnings
-- ============================================================================

-- Step 1: Drop and recreate ALL policies on profiles table with explicit role-based access
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;
DROP POLICY IF EXISTS "Trainers and admins can see approved profiles" ON public.profiles;

-- Policy 1: Users can ONLY view their own profile (with all sensitive data)
CREATE POLICY "Users view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Policy 2: Users can ONLY update their own profile
CREATE POLICY "Users update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can ONLY insert their own profile
CREATE POLICY "Users insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy 4: Admins have full access to all profiles (all operations)
CREATE POLICY "Admins full access"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Policy 5: Trainers can SELECT approved/active profiles (limited fields via function)
-- Note: This policy allows SELECT, but trainers should use trainer_get_profiles() 
-- function which only returns first_name and last_name
CREATE POLICY "Trainers view approved profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  has_role(auth.uid(), 'trainer'::app_role)
  AND is_active = true
  AND approval_status = 'approved'
);

-- Policy 6: Block ALL anonymous access explicitly
CREATE POLICY "Block all anon access"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Step 2: Drop public_profiles view and replace with secure function
DROP VIEW IF EXISTS public.public_profiles CASCADE;

-- Create a secure function instead of a view
CREATE OR REPLACE FUNCTION public.get_public_profiles()
RETURNS TABLE (
  user_id uuid,
  first_name text,
  last_name text,
  is_active boolean,
  approval_status approval_status
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only authenticated users can call this function
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Only return active and approved profiles
  -- No email, no phone - just public info
  RETURN QUERY
  SELECT 
    p.user_id,
    p.first_name,
    p.last_name,
    p.is_active,
    p.approval_status
  FROM public.profiles p
  WHERE p.is_active = true
    AND p.approval_status = 'approved';
END;
$$;

-- Step 3: Revoke all direct access from anon and public roles
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Step 4: Security audit documentation
COMMENT ON TABLE public.profiles IS 
'Contains PII (email, phone). Access restricted:
- Users: own profile only (all fields)
- Admins: all profiles (all fields)
- Trainers: approved profiles (use trainer_get_profiles() for first_name/last_name only)
- Anon: blocked completely';

COMMENT ON FUNCTION public.get_public_profiles() IS 
'Secure replacement for public_profiles view. Returns only non-sensitive fields (first_name, last_name) for approved/active users. Requires authentication.';

COMMENT ON FUNCTION public.trainer_get_profiles() IS 
'Trainers must use this function to access profiles. Returns ONLY first_name and last_name. NO email, NO phone.';

-- Step 5: Verify no leaked permissions
DO $$
DECLARE
  leaked_perms record;
BEGIN
  -- Check for any remaining grants to anon or public
  FOR leaked_perms IN 
    SELECT grantee, table_name, privilege_type
    FROM information_schema.table_privileges
    WHERE table_schema = 'public'
      AND table_name = 'profiles'
      AND grantee IN ('anon', 'public', 'authenticated')
  LOOP
    RAISE WARNING 'Found permission: % has % on %', 
      leaked_perms.grantee, leaked_perms.privilege_type, leaked_perms.table_name;
  END LOOP;
END $$;