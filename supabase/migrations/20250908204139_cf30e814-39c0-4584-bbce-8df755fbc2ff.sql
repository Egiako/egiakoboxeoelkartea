-- Add max_monthly_classes column to user_monthly_classes table
ALTER TABLE public.user_monthly_classes 
ADD COLUMN IF NOT EXISTS max_monthly_classes integer NOT NULL DEFAULT 12;

-- Function to update both remaining and max monthly classes for a user
CREATE OR REPLACE FUNCTION admin_update_user_monthly_limits(
  target_user_id uuid, 
  new_remaining integer DEFAULT NULL,
  new_max integer DEFAULT NULL
)
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
    RAISE EXCEPTION 'Solo los administradores pueden actualizar límites mensuales';
  END IF;
  
  -- Get or create current month record
  SELECT * INTO user_classes
  FROM public.get_or_create_monthly_classes(target_user_id);
  
  -- Update the record with new values
  UPDATE public.user_monthly_classes
  SET 
    remaining_classes = CASE 
      WHEN new_remaining IS NOT NULL THEN GREATEST(0, LEAST(50, new_remaining))
      ELSE remaining_classes
    END,
    max_monthly_classes = CASE 
      WHEN new_max IS NOT NULL THEN GREATEST(1, LEAST(50, new_max))
      ELSE max_monthly_classes
    END,
    updated_at = now()
  WHERE user_id = target_user_id 
    AND month = current_month
    AND year = current_year
  RETURNING * INTO user_classes;
  
  RETURN user_classes;
END;
$$;