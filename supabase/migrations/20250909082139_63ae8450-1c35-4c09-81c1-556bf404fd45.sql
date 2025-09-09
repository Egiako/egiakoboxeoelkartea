-- Create trainer management functions and ensure proper access

-- First, ensure the trainer user exists with proper role
-- Insert the trainer profile if it doesn't exist (this will be manual in production)
-- Note: The actual user creation must be done through Supabase Auth UI

-- Create function to manage class instructors
CREATE TABLE IF NOT EXISTS public.class_instructors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  instructor_name TEXT NOT NULL,
  specific_date DATE, -- null means it applies to all instances of this class
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(class_id, specific_date)
);

-- Enable RLS on class_instructors
ALTER TABLE public.class_instructors ENABLE ROW LEVEL SECURITY;

-- RLS policies for class_instructors
CREATE POLICY "Anyone can view class instructors"
ON public.class_instructors
FOR SELECT
USING (true);

CREATE POLICY "Trainers and admins can manage class instructors"
ON public.class_instructors
FOR ALL
USING (
  has_role(auth.uid(), 'trainer'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'trainer'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Create table for special schedule overrides
CREATE TABLE IF NOT EXISTS public.schedule_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  override_date DATE NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT false, -- false = disabled, true = enabled special day
  instructor_override TEXT, -- override instructor for this specific date
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(class_id, override_date)
);

-- Enable RLS on schedule_overrides
ALTER TABLE public.schedule_overrides ENABLE ROW LEVEL SECURITY;

-- RLS policies for schedule_overrides
CREATE POLICY "Anyone can view schedule overrides"
ON public.schedule_overrides
FOR SELECT
USING (true);

CREATE POLICY "Trainers and admins can manage schedule overrides"
ON public.schedule_overrides
FOR ALL
USING (
  has_role(auth.uid(), 'trainer'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'trainer'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Function to get class schedule with overrides
CREATE OR REPLACE FUNCTION public.get_class_schedule_for_date(target_date DATE)
RETURNS TABLE(
  class_id UUID,
  title TEXT,
  instructor TEXT,
  day_of_week INTEGER,
  start_time TIME,
  end_time TIME,
  max_students INTEGER,
  is_active BOOLEAN,
  is_special_day BOOLEAN,
  override_notes TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as class_id,
    c.title,
    COALESCE(so.instructor_override, ci.instructor_name, c.instructor, 'Sin asignar') as instructor,
    c.day_of_week,
    c.start_time,
    c.end_time,
    c.max_students,
    CASE 
      WHEN so.id IS NOT NULL THEN so.is_enabled
      ELSE (c.is_active AND EXTRACT(DOW FROM target_date) = c.day_of_week)
    END as is_active,
    (so.id IS NOT NULL AND so.is_enabled = true) as is_special_day,
    so.notes as override_notes
  FROM public.classes c
  LEFT JOIN public.class_instructors ci ON (c.id = ci.class_id AND ci.specific_date IS NULL)
  LEFT JOIN public.schedule_overrides so ON (c.id = so.class_id AND so.override_date = target_date)
  WHERE c.is_active = true
    OR (so.id IS NOT NULL AND so.is_enabled = true);
END;
$$;

-- Function to set class instructor
CREATE OR REPLACE FUNCTION public.set_class_instructor(
  target_class_id UUID,
  instructor_name TEXT,
  specific_date DATE DEFAULT NULL
)
RETURNS class_instructors
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result class_instructors;
BEGIN
  -- Check if user is trainer or admin
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden asignar instructores';
  END IF;
  
  -- Upsert instructor assignment
  INSERT INTO public.class_instructors (class_id, instructor_name, specific_date, created_by)
  VALUES (target_class_id, instructor_name, specific_date, auth.uid())
  ON CONFLICT (class_id, specific_date) 
  DO UPDATE SET 
    instructor_name = EXCLUDED.instructor_name,
    updated_at = now()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Function to set schedule override
CREATE OR REPLACE FUNCTION public.set_schedule_override(
  target_class_id UUID,
  target_date DATE,
  is_enabled BOOLEAN,
  instructor_override TEXT DEFAULT NULL,
  notes TEXT DEFAULT NULL
)
RETURNS schedule_overrides
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result schedule_overrides;
BEGIN
  -- Check if user is trainer or admin
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden modificar horarios';
  END IF;
  
  -- Upsert schedule override
  INSERT INTO public.schedule_overrides (class_id, override_date, is_enabled, instructor_override, notes, created_by)
  VALUES (target_class_id, target_date, is_enabled, instructor_override, notes, auth.uid())
  ON CONFLICT (class_id, override_date) 
  DO UPDATE SET 
    is_enabled = EXCLUDED.is_enabled,
    instructor_override = EXCLUDED.instructor_override,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Update triggers for updated_at
CREATE TRIGGER update_class_instructors_updated_at
  BEFORE UPDATE ON public.class_instructors
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_schedule_overrides_updated_at
  BEFORE UPDATE ON public.schedule_overrides
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();