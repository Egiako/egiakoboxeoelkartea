-- Let's test the complete flow by checking recent activity and profiles
-- First, check recent profiles to see registration activity
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
  created_at,
  updated_at
FROM public.profiles 
ORDER BY created_at DESC
LIMIT 10;

-- Check recent auth users to see if registrations are happening
-- We can't query auth.users directly, so let's look at user_roles instead
SELECT 
  ur.user_id,
  ur.role,
  ur.created_at,
  p.email,
  p.first_name,
  p.last_name,
  p.approval_status
FROM public.user_roles ur
LEFT JOIN public.profiles p ON ur.user_id = p.user_id
ORDER BY ur.created_at DESC
LIMIT 10;