-- Update class titles based on time schedule
UPDATE public.classes 
SET title = 'Boxeo mañana' 
WHERE start_time = '09:00:00';

UPDATE public.classes 
SET title = 'Boxeo tarde' 
WHERE start_time = '18:00:00';