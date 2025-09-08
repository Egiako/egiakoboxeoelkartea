-- Crear tabla de clases/horarios disponibles
CREATE TABLE public.classes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Domingo, 1 = Lunes, etc.
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  max_students INTEGER NOT NULL DEFAULT 10,
  instructor TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Crear tabla de reservas
CREATE TABLE public.bookings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  booking_date DATE NOT NULL, -- Fecha específica de la clase
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'attended')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, class_id, booking_date) -- Un usuario no puede reservar la misma clase el mismo día dos veces
);

-- Habilitar RLS
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

-- Políticas para classes (visible para todos los usuarios autenticados)
CREATE POLICY "Classes are viewable by authenticated users" 
ON public.classes 
FOR SELECT 
TO authenticated
USING (is_active = true);

-- Políticas para bookings
CREATE POLICY "Users can view their own bookings" 
ON public.bookings 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own bookings" 
ON public.bookings 
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own bookings" 
ON public.bookings 
FOR UPDATE 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own bookings" 
ON public.bookings 
FOR DELETE 
TO authenticated
USING (auth.uid() = user_id);

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Triggers para updated_at
CREATE TRIGGER update_classes_updated_at
  BEFORE UPDATE ON public.classes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Función para verificar límite de estudiantes por clase
CREATE OR REPLACE FUNCTION public.check_class_capacity()
RETURNS TRIGGER AS $$
DECLARE
  current_bookings INTEGER;
  max_capacity INTEGER;
BEGIN
  -- Obtener capacidad máxima de la clase
  SELECT max_students INTO max_capacity
  FROM public.classes
  WHERE id = NEW.class_id;

  -- Contar reservas confirmadas para esa clase y fecha
  SELECT COUNT(*)
  INTO current_bookings
  FROM public.bookings
  WHERE class_id = NEW.class_id
    AND booking_date = NEW.booking_date
    AND status = 'confirmed'
    AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid);

  -- Verificar si hay cupo disponible
  IF current_bookings >= max_capacity THEN
    RAISE EXCEPTION 'La clase está completa. Máximo % estudiantes permitidos.', max_capacity;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Trigger para verificar capacidad antes de insertar/actualizar
CREATE TRIGGER check_booking_capacity
  BEFORE INSERT OR UPDATE ON public.bookings
  FOR EACH ROW
  WHEN (NEW.status = 'confirmed')
  EXECUTE FUNCTION public.check_class_capacity();

-- Insertar algunas clases de ejemplo
INSERT INTO public.classes (title, description, day_of_week, start_time, end_time, instructor) VALUES
('Boxeo Principiantes', 'Clase ideal para personas que se inician en el boxeo', 1, '18:00', '19:00', 'Carlos Mendez'),
('Boxeo Intermedio', 'Para alumnos con experiencia básica en boxeo', 1, '19:30', '20:30', 'Carlos Mendez'),
('Boxeo Avanzado', 'Clase de alto nivel técnico y físico', 2, '20:00', '21:00', 'Ana Rodriguez'),
('Boxeo Femenino', 'Clase exclusiva para mujeres', 3, '19:00', '20:00', 'Ana Rodriguez'),
('Boxeo Fitness', 'Entrenamiento de boxeo enfocado en fitness', 4, '18:30', '19:30', 'Miguel Santos'),
('Técnica de Boxeo', 'Perfeccionamiento de técnicas y movimientos', 5, '19:00', '20:00', 'Carlos Mendez'),
('Sparring', 'Práctica de combate controlado (nivel avanzado)', 6, '17:00', '18:00', 'Ana Rodriguez');