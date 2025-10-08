-- Create public-safe view of profiles with only non-sensitive fields
DROP VIEW IF EXISTS public.public_profiles CASCADE;

CREATE VIEW public.public_profiles
WITH (security_invoker = true)
AS
SELECT
  p.user_id       AS user_id,
  p.first_name    AS first_name,
  p.last_name     AS last_name,
  p.is_active     AS is_active,
  p.approval_status AS approval_status
FROM public.profiles p
WHERE p.is_active = true
  AND p.approval_status = 'approved';

-- Grant select on view to authenticated users (safe: no PII)
GRANT SELECT ON public.public_profiles TO authenticated;

-- Ensure profiles table has strict RLS (already done, but reconfirm)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Recreate policies to be crystal clear
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;

-- Policy 1: Users see ONLY their own profile (with sensitive data)
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

-- Policy 3: Users can insert ONLY their own profile
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

-- Policy 5: Block all anon access
CREATE POLICY "Block anonymous access"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Revoke direct table access from anon and public (defense in depth)
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- Documentation for auditors
COMMENT ON TABLE public.profiles IS 'Contains PII (email, phone). Access restricted to profile owner and admins only. Use public_profiles view for non-sensitive data.';
COMMENT ON VIEW public.public_profiles IS 'Safe view: exposes only non-sensitive profile fields (names) for approved/active users. No email or phone numbers.';