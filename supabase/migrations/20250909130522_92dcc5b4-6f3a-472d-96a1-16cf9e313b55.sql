BEGIN;

-- Crear perfil para el administrador egiakobe@gmail.com
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
  '8ec449fd-2365-4c18-9903-b8d3116d0b27'::uuid,
  'egiako',
  'boxeo elkartea', 
  '669339812',
  'egiakobe@gmail.com',
  true,
  false,
  NULL,
  'approved'::approval_status
) ON CONFLICT (user_id) DO UPDATE SET
  is_active = true,
  approval_status = 'approved'::approval_status,
  updated_at = now();

-- Asegurar que tiene rol de admin (eliminar otros roles primero para limpiar)
DELETE FROM public.user_roles WHERE user_id = '8ec449fd-2365-4c18-9903-b8d3116d0b27'::uuid;

-- Asignar rol de admin
INSERT INTO public.user_roles (user_id, role) VALUES 
('8ec449fd-2365-4c18-9903-b8d3116d0b27'::uuid, 'admin'::app_role);

-- También darle rol de user para que pueda acceder a funciones básicas
INSERT INTO public.user_roles (user_id, role) VALUES 
('8ec449fd-2365-4c18-9903-b8d3116d0b27'::uuid, 'user'::app_role);

COMMIT;