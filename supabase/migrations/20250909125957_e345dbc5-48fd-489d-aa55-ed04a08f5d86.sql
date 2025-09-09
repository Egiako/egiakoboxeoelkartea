BEGIN;

-- Ensure trigger to create profiles on new signups
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_trigger t
    JOIN pg_class c ON c.oid = t.tgrelid
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE t.tgname = 'on_auth_user_created'
      AND n.nspname = 'auth'
      AND c.relname = 'users'
  ) THEN
    CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
  END IF;
END $$;

-- Backfill missing profiles for existing auth users
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
  CASE WHEN u.email = 'etius93.xb@gmail.com' THEN 'approved' ELSE 'pending' END
FROM u;

-- Ensure roles exist
-- Admin role for owner
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'admin'
FROM auth.users u
WHERE u.email = 'egiakobe@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'admin'
  );

-- Trainer role for specific trainer
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'trainer'
FROM auth.users u
WHERE u.email = 'etius93.xb@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'trainer'
  );

-- User role for everyone
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'user'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id AND ur.role = 'user'
);

COMMIT;