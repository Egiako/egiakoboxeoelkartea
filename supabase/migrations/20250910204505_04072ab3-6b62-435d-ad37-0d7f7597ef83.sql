-- Actualizar sistema de entrenador para el nuevo email
BEGIN;

-- Actualizar la función handle_new_user para reconocer el nuevo email del entrenador
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
    true, -- Todos activos por defecto
    (existing_profile IS NOT NULL),
    prev_status,
    CASE 
      WHEN NEW.email = 'egiakobe@gmail.com' THEN 'approved'::approval_status
      WHEN NEW.email = 'egiakoxb@gmail.com' THEN 'approved'::approval_status
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
  ELSIF NEW.email = 'egiakoxb@gmail.com' THEN
    -- Nuevo entrenador
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'trainer'::app_role);
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user'::app_role);
    RAISE LOG 'handle_new_user: Assigned trainer and user roles to %', NEW.email;
  ELSIF NEW.email = 'etius93.xb@gmail.com' THEN
    -- Entrenador anterior (mantener compatibilidad)
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

-- Actualizar la función is_specific_trainer para reconocer el nuevo email
CREATE OR REPLACE FUNCTION public.is_specific_trainer(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    JOIN public.user_roles ur ON p.user_id = ur.user_id
    WHERE p.user_id = _user_id
      AND p.email IN ('egiakoxb@gmail.com', 'etius93.xb@gmail.com')
      AND ur.role = 'trainer'
      AND p.is_active = true
  )
$function$;

-- Crear función para gestionar el calendario colectivo (agregar clases)
CREATE OR REPLACE FUNCTION public.add_schedule_override(
  target_class_id uuid,
  target_date date,
  instructor_name text DEFAULT NULL::text,
  notes text DEFAULT NULL::text
)
RETURNS schedule_overrides
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  result schedule_overrides;
BEGIN
  -- Verificar que el usuario es admin o trainer
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden modificar horarios';
  END IF;
  
  -- Agregar clase habilitándola
  INSERT INTO public.schedule_overrides (
    class_id, 
    override_date, 
    is_enabled, 
    instructor_override, 
    notes, 
    created_by
  )
  VALUES (
    target_class_id, 
    target_date, 
    true, 
    instructor_name, 
    notes, 
    auth.uid()
  )
  ON CONFLICT (class_id, override_date) 
  DO UPDATE SET 
    is_enabled = true,
    instructor_override = EXCLUDED.instructor_override,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING * INTO result;
  
  RETURN result;
END;
$function$;

-- Crear función para deshabilitar clases del calendario
CREATE OR REPLACE FUNCTION public.disable_schedule_class(
  target_class_id uuid,
  target_date date,
  notes text DEFAULT NULL::text
)
RETURNS schedule_overrides
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$
DECLARE
  result schedule_overrides;
BEGIN
  -- Verificar que el usuario es admin o trainer
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden modificar horarios';
  END IF;
  
  -- Deshabilitar clase
  INSERT INTO public.schedule_overrides (
    class_id, 
    override_date, 
    is_enabled, 
    notes, 
    created_by
  )
  VALUES (
    target_class_id, 
    target_date, 
    false, 
    notes, 
    auth.uid()
  )
  ON CONFLICT (class_id, override_date) 
  DO UPDATE SET 
    is_enabled = false,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING * INTO result;
  
  -- Cancelar todas las reservas existentes para esa clase y fecha
  UPDATE public.bookings
  SET status = 'cancelled',
      updated_at = now()
  WHERE class_id = target_class_id
    AND booking_date = target_date
    AND status = 'confirmed';
  
  RETURN result;
END;
$function$;

-- Mejorar la función trainer_update_attendance para penalizar inasistencias
CREATE OR REPLACE FUNCTION public.trainer_update_attendance(booking_uuid uuid, attendance_status boolean)
RETURNS bookings
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $function$ 
DECLARE
  booking_record public.bookings;
BEGIN
  -- Verificar que el usuario es trainer
  IF NOT public.has_role(auth.uid(), 'trainer'::app_role) THEN
    RAISE EXCEPTION 'Solo los entrenadores pueden actualizar la asistencia';
  END IF;
  
  -- Actualizar estado de asistencia
  UPDATE public.bookings
  SET attended = attendance_status,
      updated_at = now()
  WHERE id = booking_uuid
  RETURNING * INTO booking_record;
  
  IF booking_record IS NULL THEN
    RAISE EXCEPTION 'Reserva no encontrada';
  END IF;
  
  -- Si se marca como NO asistido, penalizar quitando 1 clase adicional
  IF attendance_status = false THEN
    UPDATE public.user_monthly_classes
    SET remaining_classes = GREATEST(0, remaining_classes - 1),
        updated_at = now()
    WHERE user_id = booking_record.user_id
      AND month = EXTRACT(month FROM CURRENT_DATE)
      AND year = EXTRACT(year FROM CURRENT_DATE);
      
    RAISE LOG 'Penalization applied: removed 1 additional class for user % due to absence', booking_record.user_id;
  END IF;
  
  RETURN booking_record;
END;
$function$;

COMMIT;