-- Ensure trigger exists for creating/updating profiles on user signup
-- This enables re-registro flow to create a pending profile automatically

-- Drop trigger if it already exists to avoid duplicates
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create the trigger to invoke our handler after a new auth user is created
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Safety: ensure profiles table has required columns (idempotent adds guarded)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'is_reregistration'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN is_reregistration boolean DEFAULT false;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'profiles' AND column_name = 'previous_status'
  ) THEN
    ALTER TABLE public.profiles ADD COLUMN previous_status text;
  END IF;
END $$;

-- Clarify: keep RLS insert policy allowing users to insert their own profile
-- (trigger runs as SECURITY DEFINER and is not restricted by RLS)
