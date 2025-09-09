-- Create a new system for manual class scheduling
-- Drop the old constraint-based system and create a flexible one

-- Create a new table for manual class schedules
CREATE TABLE IF NOT EXISTS public.manual_class_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  instructor_name TEXT NOT NULL,
  class_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 10,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(class_date, start_time, end_time)
);

-- Enable RLS
ALTER TABLE public.manual_class_schedules ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view manual schedules"
ON public.manual_class_schedules
FOR SELECT
USING (true);

CREATE POLICY "Trainers and admins can manage manual schedules"
ON public.manual_class_schedules
FOR ALL
USING (
  has_role(auth.uid(), 'trainer'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
)
WITH CHECK (
  has_role(auth.uid(), 'trainer'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Function to create/update manual class schedule
CREATE OR REPLACE FUNCTION public.create_manual_class_schedule(
  p_title TEXT,
  p_instructor_name TEXT,
  p_class_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_max_students INTEGER DEFAULT 10,
  p_is_enabled BOOLEAN DEFAULT true,
  p_notes TEXT DEFAULT NULL
)
RETURNS manual_class_schedules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result manual_class_schedules;
BEGIN
  -- Check if user is trainer or admin
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden crear horarios manuales';
  END IF;
  
  -- Validate times
  IF p_start_time >= p_end_time THEN
    RAISE EXCEPTION 'La hora de inicio debe ser anterior a la hora de fin';
  END IF;
  
  -- Insert or update manual schedule
  INSERT INTO public.manual_class_schedules 
    (title, instructor_name, class_date, start_time, end_time, max_students, is_enabled, notes, created_by)
  VALUES 
    (p_title, p_instructor_name, p_class_date, p_start_time, p_end_time, p_max_students, p_is_enabled, p_notes, auth.uid())
  ON CONFLICT (class_date, start_time, end_time)
  DO UPDATE SET
    title = EXCLUDED.title,
    instructor_name = EXCLUDED.instructor_name,
    max_students = EXCLUDED.max_students,
    is_enabled = EXCLUDED.is_enabled,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Function to disable/enable a specific class
CREATE OR REPLACE FUNCTION public.toggle_manual_class_schedule(
  p_class_date DATE,
  p_start_time TIME,
  p_end_time TIME,
  p_is_enabled BOOLEAN,
  p_notes TEXT DEFAULT NULL
)
RETURNS manual_class_schedules
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  result manual_class_schedules;
BEGIN
  -- Check if user is trainer or admin
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden modificar horarios';
  END IF;
  
  -- Update existing schedule or create a disabled entry
  INSERT INTO public.manual_class_schedules 
    (title, instructor_name, class_date, start_time, end_time, is_enabled, notes, created_by)
  VALUES 
    ('Clase cancelada', 'N/A', p_class_date, p_start_time, p_end_time, p_is_enabled, p_notes, auth.uid())
  ON CONFLICT (class_date, start_time, end_time)
  DO UPDATE SET
    is_enabled = EXCLUDED.is_enabled,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Function to get available classes for a date range (for student booking)
CREATE OR REPLACE FUNCTION public.get_available_classes_for_date_range(
  start_date DATE,
  end_date DATE
)
RETURNS TABLE(
  id UUID,
  title TEXT,
  instructor_name TEXT,
  class_date DATE,
  start_time TIME,
  end_time TIME,
  max_students INTEGER,
  is_enabled BOOLEAN,
  notes TEXT,
  current_bookings BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mcs.id,
    mcs.title,
    mcs.instructor_name,
    mcs.class_date,
    mcs.start_time,
    mcs.end_time,
    mcs.max_students,
    mcs.is_enabled,
    mcs.notes,
    COALESCE(b.booking_count, 0) as current_bookings
  FROM public.manual_class_schedules mcs
  LEFT JOIN (
    SELECT 
      mcs_sub.id,
      COUNT(b_sub.id) as booking_count
    FROM public.manual_class_schedules mcs_sub
    LEFT JOIN public.bookings b_sub ON (
      b_sub.booking_date = mcs_sub.class_date 
      AND b_sub.status = 'confirmed'
      -- We'll need to modify bookings table to reference manual schedules
    )
    GROUP BY mcs_sub.id
  ) b ON mcs.id = b.id
  WHERE mcs.class_date BETWEEN start_date AND end_date
    AND mcs.is_enabled = true
  ORDER BY mcs.class_date, mcs.start_time;
END;
$$;

-- Add trigger for updated_at
CREATE TRIGGER update_manual_class_schedules_updated_at
  BEFORE UPDATE ON public.manual_class_schedules
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to delete a manual schedule
CREATE OR REPLACE FUNCTION public.delete_manual_class_schedule(schedule_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Check if user is trainer or admin
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden eliminar horarios';
  END IF;
  
  DELETE FROM public.manual_class_schedules WHERE id = schedule_id;
  
  RETURN FOUND;
END;
$$;