-- Create comprehensive admin function to delete users completely from the system
CREATE OR REPLACE FUNCTION public.admin_delete_user_completely(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  user_profile public.profiles;
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden eliminar usuarios';
  END IF;
  
  -- Get user profile to verify it exists
  SELECT * INTO user_profile
  FROM public.profiles
  WHERE user_id = target_user_id;
  
  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  -- Delete all user data in the correct order (respecting foreign keys)
  
  -- 1. Delete bookings first (references user_id)
  DELETE FROM public.bookings WHERE user_id = target_user_id;
  
  -- 2. Delete monthly classes records
  DELETE FROM public.user_monthly_classes WHERE user_id = target_user_id;
  
  -- 3. Delete user roles
  DELETE FROM public.user_roles WHERE user_id = target_user_id;
  
  -- 4. Delete profile (main record)
  DELETE FROM public.profiles WHERE user_id = target_user_id;
  
  -- Note: We cannot delete from auth.users table directly as it's managed by Supabase
  -- The auth user will remain but won't be able to access the app without a profile
  
  RETURN true;
END;
$function$;