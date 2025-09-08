-- The trigger already exists, let's verify it's working correctly
-- Check trigger details
SELECT 
  t.trigger_name,
  t.event_manipulation,
  t.event_object_schema,
  t.event_object_table,
  t.action_statement,
  t.action_timing,
  t.action_orientation
FROM information_schema.triggers t
WHERE t.event_object_table = 'users' 
  AND t.event_object_schema = 'auth'
ORDER BY t.trigger_name;

-- Also check if there are any existing profiles with expelled users
SELECT 
  id,
  user_id,
  email,
  first_name,
  last_name,
  approval_status,
  is_active,
  is_reregistration,
  previous_status,
  created_at
FROM public.profiles 
WHERE approval_status = 'rejected' OR is_active = false
ORDER BY created_at DESC
LIMIT 10;