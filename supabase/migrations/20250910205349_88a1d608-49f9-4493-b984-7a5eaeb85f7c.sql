-- Ensure profiles are created on new auth users and realtime updates are reliable
BEGIN;

-- 1) Create trigger to run handle_new_user() on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2) Ensure updates deliver full OLD row in realtime (needed to know previous approval_status)
ALTER TABLE public.profiles REPLICA IDENTITY FULL;

COMMIT;