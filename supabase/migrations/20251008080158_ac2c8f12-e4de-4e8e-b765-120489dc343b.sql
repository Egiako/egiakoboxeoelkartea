-- Fix RLS policies to restore normal functionality after security hardening

-- ============================================
-- 1. FIX PROFILES TABLE - Simplify policies
-- ============================================

-- Drop all existing policies on profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Admins can manage all profiles" ON profiles;
DROP POLICY IF EXISTS "Trainers can view all profiles" ON profiles;

-- Ensure RLS is enabled
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view and edit their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
ON profiles
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Admins can manage all profiles (full access)
CREATE POLICY "Admins can manage all profiles"
ON profiles
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trainers can view all profiles (read-only)
CREATE POLICY "Trainers can view all profiles"
ON profiles
FOR SELECT
USING (has_role(auth.uid(), 'trainer'::app_role));

-- ============================================
-- 2. FIX BOOKINGS TABLE - Restore booking functionality
-- ============================================

-- Drop all existing policies on bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can update their own bookings" ON bookings;
DROP POLICY IF EXISTS "Users can delete their own bookings" ON bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON bookings;
DROP POLICY IF EXISTS "Trainers can view all bookings" ON bookings;
DROP POLICY IF EXISTS "Trainers can update booking attendance" ON bookings;

-- Ensure RLS is enabled
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;

-- Users can view their own bookings
CREATE POLICY "Users can view their own bookings"
ON bookings
FOR SELECT
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid()) 
  AND is_user_active(auth.uid())
);

-- Users can create their own bookings
CREATE POLICY "Users can create their own bookings"
ON bookings
FOR INSERT
WITH CHECK (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid()) 
  AND is_user_active(auth.uid())
);

-- Users can update their own bookings
CREATE POLICY "Users can update their own bookings"
ON bookings
FOR UPDATE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid()) 
  AND is_user_active(auth.uid())
);

-- Users can delete their own bookings
CREATE POLICY "Users can delete their own bookings"
ON bookings
FOR DELETE
USING (
  auth.uid() = user_id 
  AND is_user_approved(auth.uid()) 
  AND is_user_active(auth.uid())
);

-- Admins can manage all bookings (full access)
CREATE POLICY "Admins can manage all bookings"
ON bookings
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Trainers can view all bookings
CREATE POLICY "Trainers can view all bookings"
ON bookings
FOR SELECT
USING (has_role(auth.uid(), 'trainer'::app_role));

-- Trainers can update booking attendance
CREATE POLICY "Trainers can update booking attendance"
ON bookings
FOR UPDATE
USING (has_role(auth.uid(), 'trainer'::app_role))
WITH CHECK (has_role(auth.uid(), 'trainer'::app_role));