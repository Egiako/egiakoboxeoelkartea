BEGIN;

-- Limpiar clases existentes y crear las clases fijas
DELETE FROM public.classes WHERE title IN ('Clase Matutina', 'Clase Vespertina');

-- Insertar las clases fijas: lunes a jueves, 9:00-10:00 y 18:00-19:00, aforo 10 alumnos
INSERT INTO public.classes (title, instructor, description, day_of_week, start_time, end_time, max_students, is_active) VALUES
-- Lunes (1)
('Clase Matutina', 'Instructor Principal', 'Clase de boxeo matutina', 1, '09:00:00', '10:00:00', 10, true),
('Clase Vespertina', 'Instructor Principal', 'Clase de boxeo vespertina', 1, '18:00:00', '19:00:00', 10, true),
-- Martes (2)  
('Clase Matutina', 'Instructor Principal', 'Clase de boxeo matutina', 2, '09:00:00', '10:00:00', 10, true),
('Clase Vespertina', 'Instructor Principal', 'Clase de boxeo vespertina', 2, '18:00:00', '19:00:00', 10, true),
-- Miércoles (3)
('Clase Matutina', 'Instructor Principal', 'Clase de boxeo matutina', 3, '09:00:00', '10:00:00', 10, true),
('Clase Vespertina', 'Instructor Principal', 'Clase de boxeo vespertina', 3, '18:00:00', '19:00:00', 10, true),
-- Jueves (4)
('Clase Matutina', 'Instructor Principal', 'Clase de boxeo matutina', 4, '09:00:00', '10:00:00', 10, true),
('Clase Vespertina', 'Instructor Principal', 'Clase de boxeo vespertina', 4, '18:00:00', '19:00:00', 10, true);

COMMIT;