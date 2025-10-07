-- Fix RLS policies for profiles and bookings tables

-- ============================================
-- 1. FIX PROFILES TABLE
-- ============================================

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Deny all public access to profiles" ON profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Authenticated users can insert their own profile" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Restrictive policy: Users can view their own profile only
CREATE POLICY "Users can view their own profile"
ON profiles
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Restrictive policy: Users can update their own profile only
CREATE POLICY "Users can update their own profile"
ON profiles
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Restrictive policy: Users can insert their own profile only
CREATE POLICY "Users can insert their own profile"
ON profiles
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Permissive policy: Admins can manage all profiles
CREATE POLICY "Admins can manage all profiles"
ON profiles
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Permissive policy: Trainers can view all profiles (read-only)
CREATE POLICY "Trainers can view all profiles"
ON profiles
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'trainer'::app_role));

-- ============================================
-- 2. FIX BOOKINGS TABLE
-- ============================================

-- Drop all existing policies on bookings
DROP POLICY IF EXISTS "Admins can update booking attendance" ON bookings;
DROP POLICY IF EXISTS "Admins can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Active approved users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Active approved users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Active approved users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Active approved users can delete their own bookings" ON bookings;
DROP POLICY IF EXISTS "Trainers can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Trainers can update booking attendance" ON bookings;

-- Ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Restrictive policy: Users can only access their own bookings
CREATE POLICY "Users can view their own bookings"
ON bookings
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid()) 
  AND is_user_active(auth.uid())
);

CREATE POLICY "Users can create their own bookings"
ON bookings
AS RESTRICTIVE
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid()) 
  AND is_user_active(auth.uid())
);

CREATE POLICY "Users can update their own bookings"
ON bookings
AS RESTRICTIVE
FOR UPDATE
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid()) 
  AND is_user_active(auth.uid())
);

CREATE POLICY "Users can delete their own bookings"
ON bookings
AS RESTRICTIVE
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid()) 
  AND is_user_active(auth.uid())
);

-- Permissive policy: Admins can manage all bookings
CREATE POLICY "Admins can manage all bookings"
ON bookings
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Permissive policy: Trainers can view and update bookings (for attendance)
CREATE POLICY "Trainers can view all bookings"
ON bookings
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'trainer'::app_role));

CREATE POLICY "Trainers can update booking attendance"
ON bookings
AS PERMISSIVE
FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'trainer'::app_role))
WITH CHECK (has_role(auth.uid(), 'trainer'::app_role));