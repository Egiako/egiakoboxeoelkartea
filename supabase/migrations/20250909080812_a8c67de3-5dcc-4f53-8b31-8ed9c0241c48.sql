-- Update monthly class limit from 12 to 10

-- Update default values in user_monthly_classes table
ALTER TABLE public.user_monthly_classes 
ALTER COLUMN max_monthly_classes SET DEFAULT 10,
ALTER COLUMN remaining_classes SET DEFAULT 10;

-- Update get_or_create_monthly_classes function to use 10 instead of 12
CREATE OR REPLACE FUNCTION public.get_or_create_monthly_classes(user_uuid uuid)
 RETURNS user_monthly_classes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  current_month int := EXTRACT(month FROM CURRENT_DATE);
  current_year int := EXTRACT(year FROM CURRENT_DATE);
  result user_monthly_classes;
BEGIN
  -- Try to get existing record
  SELECT * INTO result
  FROM user_monthly_classes
  WHERE user_id = user_uuid
    AND month = current_month
    AND year = current_year;

  -- If no record exists, create one with 10 classes
  IF result IS NULL THEN
    INSERT INTO user_monthly_classes (user_id, month, year, remaining_classes, max_monthly_classes)
    VALUES (user_uuid, current_month, current_year, 10, 10)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$function$;

-- Update admin_reset_user_monthly_classes function default from 12 to 10
CREATE OR REPLACE FUNCTION public.admin_reset_user_monthly_classes(target_user_id uuid, new_remaining integer DEFAULT 10)
 RETURNS user_monthly_classes
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  user_classes public.user_monthly_classes;
  current_month int := EXTRACT(month FROM CURRENT_DATE);
  current_year int := EXTRACT(year FROM CURRENT_DATE);
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden resetear clases mensuales';
  END IF;
  
  -- Upsert monthly classes record with 10 classes
  INSERT INTO public.user_monthly_classes (user_id, month, year, remaining_classes, max_monthly_classes)
  VALUES (target_user_id, current_month, current_year, LEAST(50, GREATEST(0, new_remaining)), 10)
  ON CONFLICT (user_id, month, year) 
  DO UPDATE SET 
    remaining_classes = LEAST(50, GREATEST(0, new_remaining)),
    max_monthly_classes = 10,
    updated_at = now()
  RETURNING * INTO user_classes;
  
  RETURN user_classes;
END;
$function$;

-- Update admin_advance_all_to_next_month function to use 10 instead of 12
CREATE OR REPLACE FUNCTION public.admin_advance_all_to_next_month()
 RETURNS TABLE(user_id uuid, month integer, year integer, remaining_classes integer)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  
  -- Create new monthly classes records for all existing users for the next month with 10 classes
  INSERT INTO public.user_monthly_classes (user_id, month, year, remaining_classes, max_monthly_classes)
  SELECT DISTINCT p.user_id, next_month, next_year, 10, 10
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
$function$;