-- Function to reset monthly classes for a specific user
CREATE OR REPLACE FUNCTION admin_reset_user_monthly_classes(target_user_id uuid, new_remaining integer DEFAULT 12)
RETURNS user_monthly_classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_classes public.user_monthly_classes;
  current_month int := EXTRACT(month FROM CURRENT_DATE);
  current_year int := EXTRACT(year FROM CURRENT_DATE);
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden resetear clases mensuales';
  END IF;
  
  -- Upsert monthly classes record
  INSERT INTO public.user_monthly_classes (user_id, month, year, remaining_classes)
  VALUES (target_user_id, current_month, current_year, LEAST(50, GREATEST(0, new_remaining)))
  ON CONFLICT (user_id, month, year) 
  DO UPDATE SET 
    remaining_classes = LEAST(50, GREATEST(0, new_remaining)),
    updated_at = now()
  RETURNING * INTO user_classes;
  
  RETURN user_classes;
END;
$$;

-- Function to advance all users to next month
CREATE OR REPLACE FUNCTION admin_advance_all_to_next_month()
RETURNS TABLE(user_id uuid, month integer, year integer, remaining_classes integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  next_month int;
  next_year int;
  current_month int := EXTRACT(month FROM CURRENT_DATE);
  current_year int := EXTRACT(year FROM CURRENT_DATE);
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden avanzar el mes para todos los usuarios';
  END IF;
  
  -- Calculate next month and year
  IF current_month = 12 THEN
    next_month := 1;
    next_year := current_year + 1;
  ELSE
    next_month := current_month + 1;
    next_year := current_year;
  END IF;
  
  -- Create new monthly classes records for all existing users for the next month
  INSERT INTO public.user_monthly_classes (user_id, month, year, remaining_classes)
  SELECT DISTINCT p.user_id, next_month, next_year, 12
  FROM public.profiles p
  WHERE NOT EXISTS (
    SELECT 1 FROM public.user_monthly_classes umc 
    WHERE umc.user_id = p.user_id 
    AND umc.month = next_month 
    AND umc.year = next_year
  );
  
  -- Return the newly created records
  RETURN QUERY
  SELECT umc.user_id, umc.month, umc.year, umc.remaining_classes
  FROM public.user_monthly_classes umc
  WHERE umc.month = next_month AND umc.year = next_year;
END;
$$;

-- Function to get monthly classes statistics for admin
CREATE OR REPLACE FUNCTION admin_get_monthly_stats()
RETURNS TABLE(
  total_users bigint,
  users_with_classes bigint,
  users_without_classes bigint,
  average_remaining numeric,
  current_month integer,
  current_year integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month int := EXTRACT(month FROM CURRENT_DATE);
  current_year int := EXTRACT(year FROM CURRENT_DATE);
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden ver las estadísticas mensuales';
  END IF;
  
  RETURN QUERY
  SELECT 
    COUNT(DISTINCT p.user_id) as total_users,
    COUNT(DISTINCT CASE WHEN umc.remaining_classes > 0 THEN p.user_id END) as users_with_classes,
    COUNT(DISTINCT CASE WHEN COALESCE(umc.remaining_classes, 0) = 0 THEN p.user_id END) as users_without_classes,
    COALESCE(AVG(umc.remaining_classes), 0) as average_remaining,
    current_month,
    current_year
  FROM public.profiles p
  LEFT JOIN public.user_monthly_classes umc ON (
    p.user_id = umc.user_id 
    AND umc.month = current_month 
    AND umc.year = current_year
  );
END;
$$;