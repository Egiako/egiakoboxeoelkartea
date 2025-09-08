-- Add is_active field to profiles table
ALTER TABLE public.profiles 
ADD COLUMN is_active boolean NOT NULL DEFAULT true;

-- Create function to check if user is active first
CREATE OR REPLACE FUNCTION public.is_user_active(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND is_active = true
  )
$$;

-- Update RLS policies to only allow active users

-- Drop existing user policies that don't check active status
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;

-- Create new policies that check is_active status
CREATE POLICY "Active users can view their own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY "Active users can update their own profile" 
ON public.profiles 
FOR UPDATE 
USING (auth.uid() = user_id AND is_active = true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Update bookings policies to check user is active
DROP POLICY IF EXISTS "Approved users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Approved users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Approved users can update their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Approved users can delete their own bookings" ON public.bookings;

CREATE POLICY "Active approved users can view their own bookings" 
ON public.bookings 
FOR SELECT 
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()) AND is_user_active(auth.uid()));

CREATE POLICY "Active approved users can create their own bookings" 
ON public.bookings 
FOR INSERT 
WITH CHECK ((auth.uid() = user_id) AND is_user_approved(auth.uid()) AND is_user_active(auth.uid()));

CREATE POLICY "Active approved users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()) AND is_user_active(auth.uid()));

CREATE POLICY "Active approved users can delete their own bookings" 
ON public.bookings 
FOR DELETE 
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()) AND is_user_active(auth.uid()));

-- Update monthly classes policies to check user is active
DROP POLICY IF EXISTS "Approved users can view their own monthly classes" ON public.user_monthly_classes;

CREATE POLICY "Active approved users can view their own monthly classes" 
ON public.user_monthly_classes 
FOR SELECT 
USING ((auth.uid() = user_id) AND is_user_approved(auth.uid()) AND is_user_active(auth.uid()));

-- Create function to deactivate user (replaces delete function)
CREATE OR REPLACE FUNCTION public.admin_deactivate_user(target_user_id uuid)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile public.profiles;
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden desactivar usuarios';
  END IF;
  
  -- Deactivate user and cancel all future bookings
  UPDATE public.profiles
  SET is_active = false,
      updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO user_profile;
  
  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  -- Cancel all future bookings for this user
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE user_id = target_user_id
    AND booking_date >= CURRENT_DATE
    AND status = 'confirmed';
  
  RETURN user_profile;
END;
$$;

-- Create function to reactivate user (admin only)
CREATE OR REPLACE FUNCTION public.admin_reactivate_user(target_user_id uuid)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_profile public.profiles;
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden reactivar usuarios';
  END IF;
  
  -- Reactivate user
  UPDATE public.profiles
  SET is_active = true,
      updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO user_profile;
  
  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  RETURN user_profile;
END;
$$;

-- Update handle_new_user to set is_active = true by default
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Insert into profiles table with is_active = true by default
  INSERT INTO public.profiles (user_id, first_name, last_name, phone, email, is_active)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name',
    NEW.raw_user_meta_data ->> 'phone',
    NEW.email,
    true
  );
  
  -- Assign role based on email
  IF NEW.email = 'egiakobe@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;