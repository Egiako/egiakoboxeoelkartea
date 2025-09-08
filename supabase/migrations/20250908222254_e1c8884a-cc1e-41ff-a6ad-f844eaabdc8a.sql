-- Add column to track reregistrations
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_reregistration boolean DEFAULT false;

-- Add column to track previous rejection/expulsion reason
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS previous_status text DEFAULT null;

-- Update the handle_new_user function to support reregistrations
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER 
SET search_path = 'public'
AS $$
DECLARE
  existing_profile public.profiles;
BEGIN
  -- Check if this user had a profile before (was deleted/expelled)
  -- We'll check if there's any record in profiles with this email
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE email = NEW.email
  LIMIT 1;

  -- If user had a previous profile, this is a reregistration
  IF existing_profile IS NOT NULL THEN
    -- Update existing profile for reregistration
    UPDATE public.profiles
    SET 
      user_id = NEW.id,
      first_name = NEW.raw_user_meta_data ->> 'first_name',
      last_name = NEW.raw_user_meta_data ->> 'last_name',
      phone = NEW.raw_user_meta_data ->> 'phone',
      approval_status = 'pending',
      is_active = true,
      is_reregistration = true,
      previous_status = CASE 
        WHEN existing_profile.approval_status = 'rejected' THEN 'previously_rejected'
        WHEN existing_profile.is_active = false THEN 'previously_deactivated'
        ELSE 'previously_expelled'
      END,
      created_at = now(),
      updated_at = now()
    WHERE email = NEW.email;
  ELSE
    -- Insert new profile for first-time users
    INSERT INTO public.profiles (user_id, first_name, last_name, phone, email, is_active, is_reregistration)
    VALUES (
      NEW.id,
      NEW.raw_user_meta_data ->> 'first_name',
      NEW.raw_user_meta_data ->> 'last_name',
      NEW.raw_user_meta_data ->> 'phone',
      NEW.email,
      true,
      false
    );
  END IF;
  
  -- Assign role based on email
  -- First delete any existing role for this user_id to avoid conflicts
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  
  IF NEW.email = 'egiakobe@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create function to properly handle user expulsion (keeps record for reregistrations)
CREATE OR REPLACE FUNCTION public.admin_expel_user(target_user_id uuid)
RETURNS profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  user_profile public.profiles;
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden expulsar usuarios';
  END IF;
  
  -- Get user profile
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE user_id = target_user_id;
  
  if user_profile IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  -- Instead of deleting completely, we'll deactivate and mark as expelled
  -- This allows them to reregister later
  UPDATE public.profiles
  SET is_active = false,
      approval_status = 'rejected',
      previous_status = 'expelled',
      updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO user_profile;
  
  -- Cancel all future bookings for this user
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE user_id = target_user_id
    AND booking_date >= CURRENT_DATE
    AND status = 'confirmed';
  
  -- Delete user roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  RETURN user_profile;
END;
$$;