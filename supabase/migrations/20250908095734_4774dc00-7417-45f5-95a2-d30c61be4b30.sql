-- Create user_monthly_classes table to track monthly class limits
CREATE TABLE public.user_monthly_classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  remaining_classes INTEGER NOT NULL DEFAULT 12,
  month INTEGER NOT NULL,
  year INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, month, year)
);

-- Enable RLS on user_monthly_classes
ALTER TABLE public.user_monthly_classes ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_monthly_classes
CREATE POLICY "Users can view their own monthly classes"
ON public.user_monthly_classes
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all monthly classes"
ON public.user_monthly_classes
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update monthly classes"
ON public.user_monthly_classes
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert monthly classes"
ON public.user_monthly_classes
FOR INSERT
WITH CHECK (true);

-- Function to get or create current month record for user
CREATE OR REPLACE FUNCTION public.get_or_create_monthly_classes(user_uuid UUID)
RETURNS public.user_monthly_classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  current_month INTEGER := EXTRACT(MONTH FROM NOW());
  current_year INTEGER := EXTRACT(YEAR FROM NOW());
  user_record public.user_monthly_classes;
BEGIN
  -- Try to get existing record for current month
  SELECT * INTO user_record
  FROM public.user_monthly_classes
  WHERE user_id = user_uuid 
    AND month = current_month 
    AND year = current_year;
  
  -- If no record exists, create one
  IF user_record IS NULL THEN
    INSERT INTO public.user_monthly_classes (user_id, remaining_classes, month, year)
    VALUES (user_uuid, 12, current_month, current_year)
    RETURNING * INTO user_record;
  END IF;
  
  RETURN user_record;
END;
$$;

-- Function to check and update remaining classes when booking
CREATE OR REPLACE FUNCTION public.check_and_update_classes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_classes public.user_monthly_classes;
BEGIN
  -- Get current month record for user
  SELECT * INTO user_classes
  FROM public.get_or_create_monthly_classes(NEW.user_id);
  
  -- Check if user has remaining classes
  IF user_classes.remaining_classes <= 0 THEN
    RAISE EXCEPTION 'No tienes clases restantes este mes. Máximo 12 clases por mes.';
  END IF;
  
  -- Decrease remaining classes
  UPDATE public.user_monthly_classes
  SET remaining_classes = remaining_classes - 1,
      updated_at = now()
  WHERE user_id = NEW.user_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
    
  RETURN NEW;
END;
$$;

-- Function to restore classes when booking is cancelled
CREATE OR REPLACE FUNCTION public.restore_classes_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Increase remaining classes when booking is deleted
  UPDATE public.user_monthly_classes
  SET remaining_classes = remaining_classes + 1,
      updated_at = now()
  WHERE user_id = OLD.user_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW());
    
  RETURN OLD;
END;
$$;

-- Create triggers for class management
CREATE TRIGGER check_classes_before_booking
  BEFORE INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.check_and_update_classes();

CREATE TRIGGER restore_classes_after_cancel
  AFTER DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.restore_classes_on_cancel();

-- Add trigger for updated_at
CREATE TRIGGER update_user_monthly_classes_updated_at
BEFORE UPDATE ON public.user_monthly_classes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function for admin to manage user classes
CREATE OR REPLACE FUNCTION public.admin_update_user_classes(
  target_user_id UUID,
  class_change INTEGER
)
RETURNS public.user_monthly_classes
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_classes public.user_monthly_classes;
  new_remaining INTEGER;
BEGIN
  -- Check if current user is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Solo los administradores pueden gestionar clases de usuarios';
  END IF;
  
  -- Get or create current month record
  SELECT * INTO user_classes
  FROM public.get_or_create_monthly_classes(target_user_id);
  
  -- Calculate new remaining classes (minimum 0, maximum 50 for safety)
  new_remaining := GREATEST(0, LEAST(50, user_classes.remaining_classes + class_change));
  
  -- Update the record
  UPDATE public.user_monthly_classes
  SET remaining_classes = new_remaining,
      updated_at = now()
  WHERE user_id = target_user_id 
    AND month = EXTRACT(MONTH FROM NOW())
    AND year = EXTRACT(YEAR FROM NOW())
  RETURNING * INTO user_classes;
  
  RETURN user_classes;
END;
$$;