-- First, let's get the current handle_new_user function to see its content
SELECT pg_get_functiondef(oid) as function_definition 
FROM pg_proc 
WHERE proname = 'handle_new_user' 
  AND pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'public');