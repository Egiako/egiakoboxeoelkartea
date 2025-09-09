-- Crear perfil para el usuario ibisateibon@gmail.com que se registró pero no tiene perfil
BEGIN;

-- Crear el perfil faltante para el usuario que se registró
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
  '7b1e15d3-ee34-4670-97a1-54b11ddef3a3'::uuid,
  'Ibon',
  'Alberdi',
  '648276849',
  'ibisateibon@gmail.com',
  true,  -- Lo activamos por defecto
  false, -- No es reregistro
  NULL,  -- Sin status previo
  'pending'::approval_status -- Estado pendiente para que aparezca en el admin
) ON CONFLICT (user_id) DO UPDATE SET
  email = EXCLUDED.email,
  approval_status = 'pending'::approval_status,
  updated_at = now();

-- Revisar la función handle_new_user y corregirla si es necesario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
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
    CASE WHEN NEW.email = 'etius93.xb@gmail.com' THEN true ELSE true END, -- Todos activos por defecto
    (existing_profile IS NOT NULL),
    prev_status,
    CASE 
      WHEN NEW.email = 'egiakobe@gmail.com' THEN 'approved'::approval_status
      WHEN NEW.email = 'etius93.xb@gmail.com' THEN 'approved'::approval_status 
      ELSE 'pending'::approval_status 
    END
  );

  RAISE LOG 'handle_new_user: Successfully created profile for user % with email %', NEW.id, NEW.email;

  -- Asignar roles según el email
  DELETE FROM public.user_roles WHERE user_id = NEW.id;
  
  IF NEW.email = 'egiakobe@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin'::app_role);
    RAISE LOG 'handle_new_user: Assigned admin role to %', NEW.email;
  ELSIF NEW.email = 'etius93.xb@gmail.com' THEN
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
    RETURN NEW; -- No bloquear el registro aunque falle
END;
$function$;

COMMIT;