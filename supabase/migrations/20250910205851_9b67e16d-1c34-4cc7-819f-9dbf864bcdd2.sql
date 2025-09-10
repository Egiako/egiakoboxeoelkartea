-- Crear usuario entrenador egiakoxb@gmail.com manualmente
BEGIN;

-- Insertar directamente en la tabla profiles con el rol de entrenador
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
  gen_random_uuid(), -- Generar UUID temporal hasta que se registre realmente
  'Xabi',
  'Entrenador',
  '',
  'egiakoxb@gmail.com',
  true,
  false,
  NULL,
  'approved'::approval_status
) ON CONFLICT (email) DO UPDATE SET
  approval_status = 'approved'::approval_status,
  is_active = true,
  updated_at = now();

-- Crear solicitud de registro pendiente para que aparezca en admin
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
) ON CONFLICT DO NOTHING;

COMMIT;