-- Update handle_new_user function with better error handling and logging
-- This will help us debug why profiles aren't being created

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  existing_profile public.profiles;
  profile_created boolean := false;
BEGIN
  -- Log the trigger execution (will appear in Postgres logs)
  RAISE LOG 'handle_new_user triggered for user: % with email: %', NEW.id, NEW.email;
  
  -- Ensure we have required data
  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'User email is required';
  END IF;

  -- Check if this user had a profile before (was deleted/expelled)
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE email = NEW.email
  LIMIT 1;

  RAISE LOG 'Existing profile found: %', (existing_profile IS NOT NULL);

  -- If user had a previous profile, this is a reregistration
  IF existing_profile IS NOT NULL THEN
    RAISE LOG 'Updating existing profile for reregistration';
    
    UPDATE public.profiles
    SET 
      user_id = NEW.id,
      first_name = COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Sin nombre'),
      last_name = COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Sin apellido'),
      phone = COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
      approval_status = 'pending',
      is_active = false, -- Important: set to false until approved
      is_reregistration = true,
      previous_status = CASE 
        WHEN existing_profile.approval_status = 'rejected' THEN 'previously_rejected'
        WHEN existing_profile.is_active = false THEN 'previously_deactivated'
        ELSE 'previously_expelled'
      END,
      created_at = now(),
      updated_at = now()
    WHERE email = NEW.email;
    
    profile_created := true;
    RAISE LOG 'Profile updated for reregistration';
  ELSE
    RAISE LOG 'Creating new profile for first-time user';
    
    -- Insert new profile for first-time users
    INSERT INTO public.profiles (
      user_id, 
      first_name, 
      last_name, 
      phone, 
      email, 
      is_active, 
      is_reregistration,
      approval_status
    )
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Sin nombre'),
      COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Sin apellido'),
      COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
      NEW.email,
      false, -- Important: new users start inactive until approved
      false,
      'pending' -- All new users need approval
    );
    
    profile_created := true;
    RAISE LOG 'New profile created';
  END IF;
  
  -- Assign role based on email
  -- First delete any existing role for this user_id to avoid conflicts
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  
  IF NEW.email = 'egiakobe@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
    RAISE LOG 'Admin role assigned';
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
    RAISE LOG 'User role assigned';
  END IF;
  
  RAISE LOG 'handle_new_user completed successfully for user: %', NEW.id;
  RETURN NEW;
  
EXCEPTION
  WHEN OTHERS THEN
    -- Log the error but don't fail the auth process
    RAISE LOG 'Error in handle_new_user for user %: %', NEW.id, SQLERRM;
    -- Still return NEW to allow auth user creation
    RETURN NEW;
END;
$$;