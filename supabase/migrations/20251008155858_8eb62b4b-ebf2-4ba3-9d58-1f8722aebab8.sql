-- 1) profiles: explicit anon block and authenticated-only access
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Remove any generic deny-all
DROP POLICY IF EXISTS "Deny all public access" ON public.profiles;

-- Block anonymous role explicitly
DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;
CREATE POLICY "Block anonymous access"
ON public.profiles
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

-- Ensure owner and admin policies (idempotent)
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
CREATE POLICY "Users can view own profile only"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile only" ON public.profiles;
CREATE POLICY "Users can update own profile only"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins have full access" ON public.profiles;
CREATE POLICY "Admins have full access"
ON public.profiles
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Revoke anon privileges explicitly
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;

-- 2) user_monthly_classes: remove all trainer policies
DROP POLICY IF EXISTS "Trainers can view all monthly classes" ON public.user_monthly_classes;
DROP POLICY IF EXISTS "Trainers see only users with bookings" ON public.user_monthly_classes;

-- Ensure admin policy exists
DROP POLICY IF EXISTS "Admins see all user monthly classes" ON public.user_monthly_classes;
CREATE POLICY "Admins see all user monthly classes"
ON public.user_monthly_classes
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Revoke direct table access from anon and public
REVOKE ALL ON public.user_monthly_classes FROM anon;
REVOKE ALL ON public.user_monthly_classes FROM public;

-- Create view without RLS (views inherit table RLS)
DROP VIEW IF EXISTS public.trainer_visible_classes;
CREATE VIEW public.trainer_visible_classes AS
SELECT
  b.id               AS booking_id,
  b.user_id          AS user_id,
  b.class_id         AS class_id,
  b.manual_schedule_id AS manual_schedule_id,
  b.booking_date     AS booking_date,
  b.attended         AS attended
FROM public.bookings b
WHERE b.status = 'confirmed'
  AND b.booking_date >= CURRENT_DATE - INTERVAL '30 days';

-- Grant select only on view to authenticated (trainers will use this)
GRANT SELECT ON public.trainer_visible_classes TO authenticated;

COMMENT ON TABLE public.profiles IS 'PII protected: no anon/public access; owners and admins only.';
COMMENT ON TABLE public.user_monthly_classes IS 'Subscription data: admin + user self-access only; trainers use RPCs/views.';
COMMENT ON VIEW public.trainer_visible_classes IS 'Trainer view: attendance only, no financial/subscription data.';