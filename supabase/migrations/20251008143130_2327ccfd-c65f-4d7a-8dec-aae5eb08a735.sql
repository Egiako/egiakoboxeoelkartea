-- 1️⃣ Ensure RLS is enabled and FORCED
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles FORCE ROW LEVEL SECURITY;

-- 2️⃣ Remove existing policy targeting anon role
DROP POLICY IF EXISTS "Block unauthenticated public access" ON public.profiles;

-- 3️⃣ Create strict deny-all policy for public role (which anon inherits from)
CREATE POLICY "Deny all public access"
ON public.profiles
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- 4️⃣ Revoke all permissions from public role
REVOKE ALL ON public.profiles FROM public;

-- Add security documentation
COMMENT ON TABLE public.profiles IS 
'Contains sensitive user personal information (names, emails, phone numbers).
Protected by FORCED RLS with strict policies:
- Public role explicitly denied all access (USING false, WITH CHECK false)
- All permissions revoked from public role
- Authenticated users can only access their own profile (auth.uid() = user_id)
- Admins have full access (has_role admin check)
- RLS is FORCED, meaning it applies even to table owners';
