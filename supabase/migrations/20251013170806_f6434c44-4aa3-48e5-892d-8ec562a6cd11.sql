-- Ensure public consents bucket exists and is public
insert into storage.buckets (id, name, public)
values ('consents', 'consents', true)
on conflict (id) do update set public = EXCLUDED.public;

-- Update handle_new_user to store extended registration metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  existing_profile public.profiles;
  prev_status text := NULL;
  v_dni text := COALESCE(NEW.raw_user_meta_data ->> 'dni', '');
  v_birth_date date := NULL;
  v_objective text := COALESCE(NEW.raw_user_meta_data ->> 'training_goal', NEW.raw_user_meta_data ->> 'objective');
  v_consent_signed boolean := COALESCE((NEW.raw_user_meta_data ->> 'consent_signed')::boolean, false);
  v_consent_signed_at timestamptz := NULL;
  v_consent_method text := NEW.raw_user_meta_data ->> 'consent_method';
  v_consent_text_version text := COALESCE(NEW.raw_user_meta_data ->> 'consent_text_version', 'v1');
  v_consent_signature_url text := NEW.raw_user_meta_data ->> 'consent_signature_url';
BEGIN
  RAISE LOG 'handle_new_user: Processing new user % with email %', NEW.id, NEW.email;

  -- Validar que existe el email
  IF NEW.email IS NULL THEN
    RAISE LOG 'handle_new_user: ERROR - User email is required for %', NEW.id;
    RAISE EXCEPTION 'User email is required';
  END IF;

  -- Parse dates from metadata
  IF (NEW.raw_user_meta_data ->> 'birth_date') IS NOT NULL AND (NEW.raw_user_meta_data ->> 'birth_date') <> '' THEN
    v_birth_date := (NEW.raw_user_meta_data ->> 'birth_date')::date;
  END IF;
  IF (NEW.raw_user_meta_data ->> 'consent_signed_at') IS NOT NULL AND (NEW.raw_user_meta_data ->> 'consent_signed_at') <> '' THEN
    v_consent_signed_at := (NEW.raw_user_meta_data ->> 'consent_signed_at')::timestamptz;
  ELSIF v_consent_signed THEN
    v_consent_signed_at := now();
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

  -- Siempre insertar un nuevo perfil para el nuevo user_id con metadatos completos
  INSERT INTO public.profiles (
    user_id,
    first_name,
    last_name,
    phone,
    email,
    is_active,
    is_reregistration,
    previous_status,
    approval_status,
    dni,
    birth_date,
    objective,
    consent_signed,
    consent_signed_at,
    consent_method,
    consent_text_version,
    consent_signature_url
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
    END,
    v_dni,
    v_birth_date,
    v_objective,
    v_consent_signed,
    v_consent_signed_at,
    v_consent_method,
    v_consent_text_version,
    v_consent_signature_url
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