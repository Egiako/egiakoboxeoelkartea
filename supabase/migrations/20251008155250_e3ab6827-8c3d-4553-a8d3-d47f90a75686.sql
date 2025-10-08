-- Reinforce profiles RLS: explicit authenticated-only access and owner/admin rules
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Replace generic deny-all with explicit, least-privilege policies
DROP POLICY IF EXISTS "Deny all public access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;

CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins have full access"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Tighten user_monthly_classes: remove any trainer visibility policies
DROP POLICY IF EXISTS "Trainers can view all monthly classes" ON public.user_monthly_classes;
DROP POLICY IF EXISTS "Trainers see only users with bookings" ON public.user_monthly_classes;

-- Ensure explicit admin-only broad visibility (idempotent)
DROP POLICY IF EXISTS "Admins can view all monthly classes" ON public.user_monthly_classes;
CREATE POLICY "Admins see all user monthly classes"
ON public.user_monthly_classes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Keep existing user self-view policy and baseline deny-all already present
-- No trainer direct access; trainers must use RPCs that return non-sensitive booleans only

-- Documentation for auditors
COMMENT ON TABLE public.profiles IS 'PII protected by RLS: owners and admins only; no public access.';
COMMENT ON TABLE public.user_monthly_classes IS 'Subscription quotas protected: admins + user self-access only; no trainer direct access.';