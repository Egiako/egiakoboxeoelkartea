-- Change initial monthly classes from 12 to 10
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

  -- If no record exists, create one with 10 classes (changed from 12)
  IF result IS NULL THEN
    INSERT INTO user_monthly_classes (user_id, month, year, remaining_classes, max_monthly_classes)
    VALUES (user_uuid, current_month, current_year, 10, 10)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$function$