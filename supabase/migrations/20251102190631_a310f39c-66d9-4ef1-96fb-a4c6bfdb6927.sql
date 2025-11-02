
-- Fix the get_or_create_monthly_classes function to preserve custom max_monthly_classes
CREATE OR REPLACE FUNCTION public.get_or_create_monthly_classes(user_uuid uuid)
RETURNS user_monthly_classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  current_month int := EXTRACT(month FROM CURRENT_DATE);
  current_year int := EXTRACT(year FROM CURRENT_DATE);
  previous_max_classes int;
  result user_monthly_classes;
BEGIN
  -- Try to get existing record for current month
  SELECT * INTO result
  FROM user_monthly_classes
  WHERE user_id = user_uuid
    AND month = current_month
    AND year = current_year;

  -- If no record exists, create one
  IF result IS NULL THEN
    -- Try to get the max_monthly_classes from the most recent previous month
    SELECT max_monthly_classes INTO previous_max_classes
    FROM user_monthly_classes
    WHERE user_id = user_uuid
    ORDER BY year DESC, month DESC
    LIMIT 1;
    
    -- If user had a previous month record, use that max; otherwise default to 10
    IF previous_max_classes IS NULL THEN
      previous_max_classes := 10;
    END IF;
    
    -- Create new record with preserved or default max
    INSERT INTO user_monthly_classes (user_id, month, year, remaining_classes, max_monthly_classes)
    VALUES (user_uuid, current_month, current_year, previous_max_classes, previous_max_classes)
    RETURNING * INTO result;
  END IF;

  RETURN result;
END;
$$;
