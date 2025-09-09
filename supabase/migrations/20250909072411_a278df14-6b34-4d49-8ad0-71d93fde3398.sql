-- Fix admin_approve_user function to activate users when approving
CREATE OR REPLACE FUNCTION public.admin_approve_user(target_user_id uuid)
 RETURNS profiles
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_profile public.profiles;
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden aprobar usuarios';
  END IF;
  
  -- Update user status to approved AND activate them
  UPDATE public.profiles
  SET approval_status = 'approved',
      is_active = true,
      updated_at = now()
  WHERE user_id = target_user_id
  RETURNING * INTO user_profile;
  
  IF user_profile IS NULL THEN
    RAISE EXCEPTION 'Usuario no encontrado';
  END IF;
  
  RETURN user_profile;
END;
$function$