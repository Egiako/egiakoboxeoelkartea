-- Fix 1: Restrict public_profiles view access
-- Revoke general authenticated access
REVOKE ALL ON public.public_profiles FROM authenticated;
REVOKE ALL ON public.public_profiles FROM anon;
REVOKE ALL ON public.public_profiles FROM public;

-- Enable RLS on the view (Postgres 15+ supports RLS on views)
ALTER VIEW public.public_profiles SET (security_invoker = true);

-- Create RLS policy on public_profiles for trainers and admins only
-- Note: Views inherit permissions, but we're making it explicit
CREATE POLICY "Trainers and admins can see approved profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  AND is_active = true 
  AND approval_status = 'approved'
);

-- Fix 2: Enable RLS on trainer_visible_classes view
-- First, ensure the underlying table has proper RLS (bookings already has it)
-- Now create a materialized or secure access pattern

-- Drop and recreate trainer_visible_classes as a security definer function instead
DROP VIEW IF EXISTS public.trainer_visible_classes CASCADE;

-- Create a secure function for trainers to access booking data
CREATE OR REPLACE FUNCTION public.get_trainer_visible_bookings()
RETURNS TABLE (
  booking_id uuid,
  user_id uuid,
  class_id uuid,
  manual_schedule_id uuid,
  booking_date date,
  attended boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verify caller is trainer or admin
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Access denied: only trainers and admins can access booking data';
  END IF;

  -- Return booking data without sensitive profile information
  RETURN QUERY
  SELECT 
    b.id as booking_id,
    b.user_id,
    b.class_id,
    b.manual_schedule_id,
    b.booking_date,
    b.attended
  FROM public.bookings b
  JOIN public.profiles p ON b.user_id = p.user_id
  WHERE p.is_active = true
    AND p.approval_status = 'approved'
    AND b.status = 'confirmed'
    AND b.booking_date >= CURRENT_DATE;
END;
$$;

-- Update trainer_get_profiles to ensure it only returns first_name and last_name
CREATE OR REPLACE FUNCTION public.trainer_get_profiles()
RETURNS TABLE(user_id uuid, first_name text, last_name text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar que el caller es entrenador autorizado
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Acceso denegado: solo entrenadores autorizados pueden acceder a esta función';
  END IF;

  -- Devolver solo nombre y apellido (NO email, NO phone)
  RETURN QUERY
    SELECT p.user_id, p.first_name, p.last_name
    FROM public.profiles p
    WHERE p.is_active = true
      AND p.approval_status = 'approved';
END;
$$;

-- Security audit comments
COMMENT ON FUNCTION public.get_trainer_visible_bookings() IS 'Secure function for trainers to access booking data without PII. Requires trainer or admin role.';
COMMENT ON FUNCTION public.trainer_get_profiles() IS 'Returns ONLY first_name and last_name for trainers. NO email, NO phone. Requires trainer or admin role.';
COMMENT ON VIEW public.public_profiles IS 'Limited view of profiles. Access controlled via RLS policies on underlying profiles table.';

-- Verify no direct grants remain
REVOKE ALL ON public.profiles FROM anon;
REVOKE ALL ON public.profiles FROM public;