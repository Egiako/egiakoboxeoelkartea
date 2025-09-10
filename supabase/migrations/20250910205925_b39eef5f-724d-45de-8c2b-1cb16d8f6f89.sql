-- Crear solicitud pendiente de prueba
BEGIN;

-- Crear solicitud de registro pendiente para demostrar el sistema
INSERT INTO public.profiles (
  user_id,
  first_name,
  last_name,  
  phone,
  email,
  is_active,
  is_reregistration,
  previous_status,
  approval_status
) VALUES (
  gen_random_uuid(),
  'Usuario',
  'Pendiente Test',
  '123456789',
  'test.pending@example.com',
  true,
  false,
  NULL,
  'pending'::approval_status
);

COMMIT;