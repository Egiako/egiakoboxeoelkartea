-- Update RLS policies to only allow approved users to create bookings
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
CREATE POLICY "Approved users can create their own bookings"
ON public.bookings
FOR INSERT
WITH CHECK (
  auth.uid() = user_id AND 
  is_user_approved(auth.uid())
);

-- Update booking view policies to only show bookings for approved users
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
CREATE POLICY "Approved users can view their own bookings"
ON public.bookings
FOR SELECT
USING (
  auth.uid() = user_id AND 
  is_user_approved(auth.uid())
);

-- Update booking update policies
DROP POLICY IF EXISTS "Users can update their own bookings" ON public.bookings;
CREATE POLICY "Approved users can update their own bookings"
ON public.bookings
FOR UPDATE
USING (
  auth.uid() = user_id AND 
  is_user_approved(auth.uid())
);

-- Update booking delete policies
DROP POLICY IF EXISTS "Users can delete their own bookings" ON public.bookings;
CREATE POLICY "Approved users can delete their own bookings"
ON public.bookings
FOR DELETE
USING (
  auth.uid() = user_id AND 
  is_user_approved(auth.uid())
);

-- Update user_monthly_classes policies to only allow approved users
DROP POLICY IF EXISTS "Users can view their own monthly classes" ON public.user_monthly_classes;
CREATE POLICY "Approved users can view their own monthly classes"
ON public.user_monthly_classes
FOR SELECT
USING (
  auth.uid() = user_id AND 
  is_user_approved(auth.uid())
);