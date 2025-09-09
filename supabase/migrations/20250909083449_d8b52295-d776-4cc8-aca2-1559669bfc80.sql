-- Ensure trainer access configuration is correct
-- Update the trigger to assign trainer role to the specific email

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_profile public.profiles;
  prev_status text := NULL;
BEGIN
  RAISE LOG 'handle_new_user (rework) for user: % email: %', NEW.id, NEW.email;

  IF NEW.email IS NULL THEN
    RAISE EXCEPTION 'User email is required';
  END IF;

  -- Find any previous profile by email (user may have been expelled)
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE email = NEW.email
  ORDER BY created_at DESC
  LIMIT 1;

  IF existing_profile IS NOT NULL THEN
    prev_status := CASE 
      WHEN existing_profile.approval_status = 'rejected' THEN 'previously_rejected'
      WHEN existing_profile.is_active = false THEN 'previously_deactivated'
      ELSE 'previously_expelled'
    END;
  END IF;

  -- Always INSERT a fresh profile for the new auth user
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    phone,
    email,
    is_active,
    is_reregistration,
    previous_status,
    approval_status
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', 'Sin nombre'),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', 'Sin apellido'),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    NEW.email,
    CASE WHEN NEW.email = 'etius93.xb@gmail.com' THEN true ELSE false END, -- Trainer is active by default
    (existing_profile IS NOT NULL),
    prev_status,
    CASE WHEN NEW.email = 'etius93.xb@gmail.com' THEN 'approved' ELSE 'pending' END -- Trainer is approved by default
  );

  -- Assign roles (admin for egiakobe@gmail.com, trainer for etius93.xb@gmail.com, else user)
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  
  IF NEW.email = 'egiakobe@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSIF NEW.email = 'etius93.xb@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trainer');
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user'); -- Also give user role
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user (rework) for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$function$;

-- If the trainer profile already exists but doesn't have proper role, fix it
DO $$
DECLARE
  trainer_user_id uuid;
BEGIN
  -- Get the trainer's user_id
  SELECT user_id INTO trainer_user_id 
  FROM public.profiles 
  WHERE email = 'etius93.xb@gmail.com' 
  LIMIT 1;
  
  IF trainer_user_id IS NOT NULL THEN
    -- Ensure trainer role exists
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (trainer_user_id, 'trainer')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Ensure user role exists too
    INSERT INTO public.user_roles (user_id, role) 
    VALUES (trainer_user_id, 'user')
    ON CONFLICT (user_id, role) DO NOTHING;
    
    -- Ensure profile is active and approved
    UPDATE public.profiles 
    SET is_active = true, 
        approval_status = 'approved'
    WHERE user_id = trainer_user_id;
  END IF;
END $$;