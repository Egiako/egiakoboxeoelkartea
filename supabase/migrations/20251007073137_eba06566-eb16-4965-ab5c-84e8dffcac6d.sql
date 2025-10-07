-- Drop the insecure trainer_user_view as it cannot have RLS policies
-- The existing trainer_get_profiles() function already provides secure access
DROP VIEW IF EXISTS public.trainer_user_view;

-- Verify that trainer_get_profiles function has proper security
-- (This function already exists and is secure, this is just documentation)

-- The function trainer_get_profiles():
-- ✅ Uses SECURITY DEFINER with explicit role checks
-- ✅ Verifies caller is an active trainer
-- ✅ Only returns non-sensitive data (first_name, last_name, user_id)
-- ✅ Filters to only show active and approved users

-- No further action needed - all trainer access should go through
-- the secure RPC function trainer_get_profiles() instead of the view