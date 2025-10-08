-- Add baseline deny-all policy to user_monthly_classes table
-- This ensures that only explicitly defined permissive policies grant access

CREATE POLICY "Deny all public access to monthly classes"
ON public.user_monthly_classes
FOR ALL
TO public
USING (false)
WITH CHECK (false);

-- Revoke any default permissions from public role
REVOKE ALL ON public.user_monthly_classes FROM public;

-- Add documentation
COMMENT ON TABLE public.user_monthly_classes IS 
'Tracks monthly class allowances per user.
Protected by baseline deny-all policy with explicit grants for:
- Users can view their own records (when approved and active)
- Admins can view/modify all records
- Trainers can view all records
- All other access explicitly denied via public role restriction';
