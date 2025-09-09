BEGIN;

-- Backfill missing profiles for existing auth users (with proper enum casting)
WITH u AS (
  SELECT u.id, u.email, u.raw_user_meta_data
  FROM auth.users u
  LEFT JOIN public.profiles p ON p.user_id = u.id
  WHERE p.user_id IS NULL
)
INSERT INTO public.profiles (
  user_id, first_name, last_name, phone, email, is_active, is_reregistration, previous_status, approval_status
)
SELECT
  u.id,
  COALESCE(u.raw_user_meta_data ->> 'first_name', 'Sin nombre'),
  COALESCE(u.raw_user_meta_data ->> 'last_name', 'Sin apellido'),
  COALESCE(u.raw_user_meta_data ->> 'phone', ''),
  u.email,
  CASE WHEN u.email = 'etius93.xb@gmail.com' THEN true ELSE false END,
  false,
  NULL,
  CASE WHEN u.email = 'etius93.xb@gmail.com' THEN 'approved'::approval_status ELSE 'pending'::approval_status END
FROM u;

-- Ensure roles exist for users without profiles
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'::app_role
FROM auth.users u
WHERE u.email = 'egiakobe@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'trainer'::app_role
FROM auth.users u
WHERE u.email = 'etius93.xb@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'trainer'
  );

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'::app_role
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'user'
);

COMMIT;