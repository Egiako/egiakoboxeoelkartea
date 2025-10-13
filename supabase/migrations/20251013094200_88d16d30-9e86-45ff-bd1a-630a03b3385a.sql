-- Add new trainer email to handle_new_user function
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
  RAISE LOG 'handle_new_user: Processing new user % with email %', NEW.id, NEW.email;

  -- Validar que existe el email
  IF NEW.email IS NULL THEN
    RAISE LOG 'handle_new_user: ERROR - User email is required for %', NEW.id;
    RAISE EXCEPTION 'User email is required';
  END IF;

  -- Buscar perfil previo por email (usuario puede haber sido expulsado)
  SELECT * INTO existing_profile
  FROM public.profiles
  WHERE email = NEW.email
  ORDER BY created_at DESC
  LIMIT 1;

  -- Determinar status previo si existe
  IF existing_profile IS NOT NULL THEN
    prev_status := CASE 
      WHEN existing_profile.approval_status = 'rejected' THEN 'previously_rejected'
      WHEN existing_profile.is_active = false THEN 'previously_deactivated'
      ELSE 'previously_expelled'
    END;
    RAISE LOG 'handle_new_user: Found existing profile with status %', prev_status;
  END IF;

  -- Siempre insertar un nuevo perfil para el nuevo user_id
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
    true,
    (existing_profile IS NOT NULL),
    prev_status,
    CASE 
      WHEN NEW.email = 'egiakobe@gmail.com' THEN 'approved'::approval_status
      WHEN NEW.email = 'egiakoxb@gmail.com' THEN 'approved'::approval_status
      WHEN NEW.email = 'etius93.xb@gmail.com' THEN 'approved'::approval_status
      WHEN NEW.email = 'egiakojw@gmail.com' THEN 'approved'::approval_status 
      ELSE 'pending'::approval_status 
    END
  );

  RAISE LOG 'handle_new_user: Successfully created profile for user % with email %', NEW.id, NEW.email;

  -- Asignar roles según el email
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  
  IF NEW.email = 'egiakobe@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::app_role);
    RAISE LOG 'handle_new_user: Assigned admin role to %', NEW.email;
  ELSIF NEW.email = 'egiakoxb@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trainer'::app_role);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user'::app_role);
    RAISE LOG 'handle_new_user: Assigned trainer and user roles to %', NEW.email;
  ELSIF NEW.email = 'etius93.xb@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trainer'::app_role);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user'::app_role);
    RAISE LOG 'handle_new_user: Assigned trainer and user roles to %', NEW.email;
  ELSIF NEW.email = 'egiakojw@gmail.com' THEN
    -- New English-speaking trainer
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trainer'::app_role);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user'::app_role);
    RAISE LOG 'handle_new_user: Assigned trainer and user roles to %', NEW.email;
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user'::app_role);
    RAISE LOG 'handle_new_user: Assigned user role to %', NEW.email;
  END IF;

  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'handle_new_user: ERROR for user % (%): %', NEW.id, NEW.email, SQLERRM;
    RETURN NEW;
END;
$function$;

-- Update is_specific_trainer function to include new trainer
CREATE OR REPLACE FUNCTION public.is_specific_trainer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE p.user_id = _user_id
      AND p.email IN ('egiakoxb@gmail.com', 'etius93.xb@gmail.com', 'egiakojw@gmail.com')
      AND ur.role = 'trainer'
      AND p.is_active = true
  )
$function$;