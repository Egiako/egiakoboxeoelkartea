-- Crear tabla de excepciones para clases periódicas
CREATE TABLE IF NOT EXISTS public.class_exceptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  exception_date date NOT NULL,
  override_start_time time,
  override_end_time time,
  override_instructor text,
  override_max_students integer,
  is_cancelled boolean DEFAULT false,
  migrate_bookings boolean DEFAULT true,
  created_by uuid NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  notes text,
  UNIQUE(class_id, exception_date)
);

-- Índice para búsquedas rápidas
CREATE INDEX idx_class_exceptions_lookup ON public.class_exceptions(class_id, exception_date);
CREATE INDEX idx_class_exceptions_date ON public.class_exceptions(exception_date);

-- Trigger para updated_at
CREATE TRIGGER update_class_exceptions_updated_at
  BEFORE UPDATE ON public.class_exceptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Habilitar RLS
ALTER TABLE public.class_exceptions ENABLE ROW LEVEL SECURITY;

-- Política: Trainers y admins pueden gestionar excepciones
CREATE POLICY "Trainers and admins can manage exceptions"
  ON public.class_exceptions
  FOR ALL
  USING (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- Política: Usuarios autenticados pueden ver excepciones
CREATE POLICY "Authenticated users can view exceptions"
  ON public.class_exceptions
  FOR SELECT
  USING (true);

-- Función para crear excepción con migración de reservas
CREATE OR REPLACE FUNCTION public.create_class_exception(
  p_class_id uuid,
  p_exception_date date,
  p_override_start_time time DEFAULT NULL,
  p_override_end_time time DEFAULT NULL,
  p_override_instructor text DEFAULT NULL,
  p_override_max_students integer DEFAULT NULL,
  p_is_cancelled boolean DEFAULT false,
  p_migrate_bookings boolean DEFAULT true,
  p_notes text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exception class_exceptions;
  v_existing_bookings integer;
  v_migrated_count integer := 0;
  v_failed_count integer := 0;
  v_new_capacity integer;
  v_class_record classes;
  v_result json;
BEGIN
  -- Verificar permisos
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden crear excepciones';
  END IF;

  -- Obtener información de la clase
  SELECT * INTO v_class_record FROM public.classes WHERE id = p_class_id;
  IF v_class_record IS NULL THEN
    RAISE EXCEPTION 'Clase no encontrada';
  END IF;

  -- Determinar capacidad
  v_new_capacity := COALESCE(p_override_max_students, v_class_record.max_students);

  -- Contar reservas existentes para esta clase y fecha
  SELECT COUNT(*) INTO v_existing_bookings
  FROM public.bookings
  WHERE class_id = p_class_id
    AND booking_date = p_exception_date
    AND status = 'confirmed';

  -- Crear la excepción
  INSERT INTO public.class_exceptions (
    class_id,
    exception_date,
    override_start_time,
    override_end_time,
    override_instructor,
    override_max_students,
    is_cancelled,
    migrate_bookings,
    created_by,
    notes
  ) VALUES (
    p_class_id,
    p_exception_date,
    p_override_start_time,
    p_override_end_time,
    p_override_instructor,
    p_override_max_students,
    p_is_cancelled,
    p_migrate_bookings,
    auth.uid(),
    p_notes
  )
  ON CONFLICT (class_id, exception_date)
  DO UPDATE SET
    override_start_time = EXCLUDED.override_start_time,
    override_end_time = EXCLUDED.override_end_time,
    override_instructor = EXCLUDED.override_instructor,
    override_max_students = EXCLUDED.override_max_students,
    is_cancelled = EXCLUDED.is_cancelled,
    migrate_bookings = EXCLUDED.migrate_bookings,
    notes = EXCLUDED.notes,
    updated_at = now()
  RETURNING * INTO v_exception;

  -- Manejar reservas según el tipo de excepción
  IF p_is_cancelled THEN
    -- Cancelar todas las reservas sin penalización
    UPDATE public.bookings
    SET status = 'cancelled',
        updated_at = now()
    WHERE class_id = p_class_id
      AND booking_date = p_exception_date
      AND status = 'confirmed';
    
    GET DIAGNOSTICS v_migrated_count = ROW_COUNT;
    
    -- Devolver clases a los usuarios (sin penalización)
    UPDATE public.user_monthly_classes umc
    SET remaining_classes = remaining_classes + 1,
        updated_at = now()
    FROM public.bookings b
    WHERE b.user_id = umc.user_id
      AND b.class_id = p_class_id
      AND b.booking_date = p_exception_date
      AND b.status = 'cancelled'
      AND umc.month = EXTRACT(month FROM p_exception_date)
      AND umc.year = EXTRACT(year FROM p_exception_date);

  ELSIF p_migrate_bookings AND v_existing_bookings > 0 THEN
    -- Migrar reservas si hay cambio de horario
    IF v_existing_bookings <= v_new_capacity THEN
      -- Todas las reservas caben en la nueva capacidad
      v_migrated_count := v_existing_bookings;
    ELSE
      -- No todas caben, marcar las que no caben para revisión
      v_migrated_count := v_new_capacity;
      v_failed_count := v_existing_bookings - v_new_capacity;
      
      -- Las reservas que no caben se mantienen pero podrían requerir revisión manual
      -- Por ahora las dejamos como están
    END IF;
  END IF;

  -- Construir resultado
  v_result := json_build_object(
    'exception', row_to_json(v_exception),
    'existing_bookings', v_existing_bookings,
    'migrated_count', v_migrated_count,
    'failed_count', v_failed_count,
    'message', CASE
      WHEN p_is_cancelled THEN format('Clase cancelada. %s reservas canceladas sin penalización.', v_migrated_count)
      WHEN v_failed_count > 0 THEN format('Excepción creada. %s reservas migradas, %s requieren revisión.', v_migrated_count, v_failed_count)
      WHEN v_migrated_count > 0 THEN format('Excepción creada. %s reservas migradas exitosamente.', v_migrated_count)
      ELSE 'Excepción creada exitosamente.'
    END
  );

  RETURN v_result;
END;
$$;

-- Función para eliminar excepción (restaurar a periodicidad original)
CREATE OR REPLACE FUNCTION public.delete_class_exception(
  p_exception_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar permisos
  IF NOT (has_role(auth.uid(), 'trainer'::app_role) OR has_role(auth.uid(), 'admin'::app_role)) THEN
    RAISE EXCEPTION 'Solo los entrenadores y administradores pueden eliminar excepciones';
  END IF;

  DELETE FROM public.class_exceptions WHERE id = p_exception_id;
  
  RETURN FOUND;
END;
$$;

-- Función para obtener horario con excepciones aplicadas
CREATE OR REPLACE FUNCTION public.get_schedule_with_exceptions(
  p_start_date date,
  p_end_date date
)
RETURNS TABLE(
  class_id uuid,
  title text,
  exception_date date,
  start_time time,
  end_time time,
  instructor text,
  max_students integer,
  day_of_week integer,
  is_cancelled boolean,
  is_exception boolean,
  exception_id uuid,
  notes text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Verificar autenticación
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  RETURN QUERY
  WITH date_series AS (
    SELECT generate_series(p_start_date, p_end_date, '1 day'::interval)::date AS date
  ),
  class_occurrences AS (
    SELECT
      c.id as class_id,
      c.title,
      ds.date as occurrence_date,
      c.start_time,
      c.end_time,
      c.instructor,
      c.max_students,
      c.day_of_week,
      EXTRACT(DOW FROM ds.date)::integer as date_dow
    FROM public.classes c
    CROSS JOIN date_series ds
    WHERE c.is_active = true
      AND EXTRACT(DOW FROM ds.date) = c.day_of_week
  )
  SELECT
    co.class_id,
    co.title,
    co.occurrence_date,
    COALESCE(ce.override_start_time, co.start_time) as start_time,
    COALESCE(ce.override_end_time, co.end_time) as end_time,
    COALESCE(ce.override_instructor, co.instructor, 'Sin asignar') as instructor,
    COALESCE(ce.override_max_students, co.max_students) as max_students,
    co.day_of_week,
    COALESCE(ce.is_cancelled, false) as is_cancelled,
    (ce.id IS NOT NULL) as is_exception,
    ce.id as exception_id,
    ce.notes
  FROM class_occurrences co
  LEFT JOIN public.class_exceptions ce 
    ON ce.class_id = co.class_id 
    AND ce.exception_date = co.occurrence_date
  WHERE COALESCE(ce.is_cancelled, false) = false
  ORDER BY co.occurrence_date, start_time;
END;
$$;