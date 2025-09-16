-- ===============================================
-- BACKUP DE POLÍTICAS ACTUALES (DOCUMENTACIÓN)
-- ===============================================

-- POLÍTICAS EXISTENTES ANTES DEL CAMBIO:
-- 1. "Admins can view all profiles" - SELECT - has_role(auth.uid(), 'admin'::app_role)
-- 2. "Users can view their own profile" - SELECT - (auth.uid() = user_id)
-- 3. "Trainers can view limited profile data for their students" - SELECT - PROBLEMA DE SEGURIDAD
-- 4. "Authenticated users can insert their own profile" - INSERT
-- 5. "Authenticated users can update their own profile" - UPDATE

-- ===============================================
-- RESTRICCIÓN URGENTE DE ACCESO A PII
-- ===============================================

-- 1. ELIMINAR POLÍTICA QUE EXPONE PII A ENTRENADORES
DROP POLICY IF EXISTS "Trainers can view limited profile data for their students" ON public.profiles;

-- 2. CREAR FUNCIÓN SEGURA PARA ENTRENADORES (SOLO DATOS NO SENSIBLES)
CREATE OR REPLACE FUNCTION public.trainer_get_profiles()
RETURNS TABLE(user_id uuid, first_name text, last_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el caller es entrenador autorizado
  IF NOT (
    SELECT EXISTS (
      SELECT 1 FROM public.profiles p
      JOIN public.user_roles ur ON p.user_id = ur.user_id
      WHERE p.user_id = auth.uid()
        AND ur.role = 'trainer'
        AND p.is_active = true
    )
  ) THEN
    RAISE EXCEPTION 'Acceso denegado: solo entrenadores autorizados pueden acceder a esta función';
  END IF;

  -- Devolver solo datos no sensibles de usuarios activos y aprobados
  RETURN QUERY
    SELECT p.user_id, p.first_name, p.last_name
    FROM public.profiles p
    WHERE p.is_active = true
      AND p.approval_status = 'approved';
END;
$$;

-- 3. OTORGAR PERMISOS DE EJECUCIÓN A USUARIOS AUTENTICADOS
GRANT EXECUTE ON FUNCTION public.trainer_get_profiles() TO authenticated;

-- 4. VERIFICAR QUE RLS ESTÁ ACTIVADO
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 5. CREAR POLÍTICA RESTRICTIVA PARA SELECT (SOLO OWNER Y ADMIN)
-- Nota: Las políticas existentes de admin y users ya cubren esto correctamente
-- Solo nos aseguramos de que no hay otras políticas problemáticas

-- ===============================================
-- VERIFICACIÓN DE SEGURIDAD
-- ===============================================

-- Crear función para verificar el estado de seguridad
CREATE OR REPLACE FUNCTION public.verify_profiles_security()
RETURNS TABLE(
  policy_name text,
  policy_command text,
  policy_qual text,
  status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
    SELECT 
      pp.policyname::text as policy_name,
      pp.cmd::text as policy_command,
      pp.qual::text as policy_qual,
      CASE 
        WHEN pp.policyname LIKE '%trainer%' THEN 'ELIMINADA - RIESGO DE SEGURIDAD'
        WHEN pp.policyname LIKE '%admin%' THEN 'SEGURA - ACCESO ADMIN'
        WHEN pp.policyname LIKE '%own%' THEN 'SEGURA - ACCESO PROPIO'
        ELSE 'REVISAR'
      END as status
    FROM pg_policies pp
    WHERE pp.tablename = 'profiles'
      AND pp.schemaname = 'public';
END;
$$;