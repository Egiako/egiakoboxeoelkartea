BEGIN;

-- Eliminar todas las clases existentes
DELETE FROM public.classes;

-- Crear solo las 8 clases necesarias: lunes a jueves, mañanas y tardes
INSERT INTO public.classes (title, description, day_of_week, start_time, end_time, max_students, is_active) VALUES
-- Lunes (1)
('Boxeo de Mañanas', 'Clase de boxeo matutina', 1, '09:00:00', '10:00:00', 10, true),
('Boxeo de Tardes', 'Clase de boxeo vespertina', 1, '18:00:00', '19:00:00', 10, true),
-- Martes (2)  
('Boxeo de Mañanas', 'Clase de boxeo matutina', 2, '09:00:00', '10:00:00', 10, true),
('Boxeo de Tardes', 'Clase de boxeo vespertina', 2, '18:00:00', '19:00:00', 10, true),
-- Miércoles (3)
('Boxeo de Mañanas', 'Clase de boxeo matutina', 3, '09:00:00', '10:00:00', 10, true),
('Boxeo de Tardes', 'Clase de boxeo vespertina', 3, '18:00:00', '19:00:00', 10, true),
-- Jueves (4)
('Boxeo de Mañanas', 'Clase de boxeo matutina', 4, '09:00:00', '10:00:00', 10, true),
('Boxeo de Tardes', 'Clase de boxeo vespertina', 4, '18:00:00', '19:00:00', 10, true);

COMMIT;