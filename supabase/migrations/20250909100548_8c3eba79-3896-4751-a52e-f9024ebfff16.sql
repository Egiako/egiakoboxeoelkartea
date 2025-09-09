BEGIN;

-- Actualizar títulos de las clases para que sean más descriptivos
UPDATE public.classes 
SET title = 'Boxeo de Mañanas',
    instructor = NULL
WHERE title = 'Clase Matutina';

UPDATE public.classes 
SET title = 'Boxeo de Tardes',
    instructor = NULL  
WHERE title = 'Clase Vespertina';

COMMIT;