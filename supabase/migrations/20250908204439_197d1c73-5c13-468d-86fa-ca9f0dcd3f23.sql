-- Create enum for user approval status
CREATE TYPE public.approval_status AS ENUM ('pending', 'approved', 'rejected');

-- Add approval status to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS approval_status approval_status NOT NULL DEFAULT 'pending';

-- Create function to approve user
CREATE OR REPLACE FUNCTION admin_approve_user(target_user_id uuid)
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
    RAISE EXCEPTION 'Solo los administradores pueden aprobar usuarios';
  END IF;
  
  -- Update user status to approved
  UPDATE public.profiles
  SET approval_status = 'approved',
      updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO user_profile;
  
  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  RETURN user_profile;
END;
$$;

-- Create function to reject user
CREATE OR REPLACE FUNCTION admin_reject_user(target_user_id uuid)
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
    RAISE EXCEPTION 'Solo los administradores pueden rechazar usuarios';
  END IF;
  
  -- Update user status to rejected
  UPDATE public.profiles
  SET approval_status = 'rejected',
      updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO user_profile;
  
  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  RETURN user_profile;
END;
$$;

-- Function to check if user is approved
CREATE OR REPLACE FUNCTION is_user_approved(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles
    WHERE user_id = _user_id
      AND approval_status = 'approved'
  )
$$;

-- Update existing profiles to approved status (for existing users)
UPDATE public.profiles 
SET approval_status = 'approved' 
WHERE approval_status = 'pending';