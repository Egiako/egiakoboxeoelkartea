-- Update class descriptions to "Entrenamiento de boxeo"
UPDATE public.classes 
SET description = 'Entrenamiento de boxeo'
WHERE description IS NOT NULL;