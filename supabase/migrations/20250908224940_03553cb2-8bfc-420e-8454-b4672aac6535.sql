-- Update handle_new_user to create a NEW profile on re-registration instead of updating old one
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    false,              -- inactive until admin approval
    (existing_profile IS NOT NULL),
    prev_status,
    'pending'           -- all signups pending approval
  );

  -- Assign role (admin for specific email, else user)
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  IF NEW.email = 'egiakobe@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Error in handle_new_user (rework) for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$;

-- Recreate the trigger with explicit function qualification to avoid search_path issues
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();