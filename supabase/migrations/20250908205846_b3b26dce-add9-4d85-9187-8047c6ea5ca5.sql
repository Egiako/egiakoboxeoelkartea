-- Fix missing profile for oieralberdi95@gmail.com
-- First, let's get the user_id from auth.users and create the missing profile

DO $$
DECLARE
    target_user_id uuid;
    user_email text := 'oieralberdi95@gmail.com';
BEGIN
    -- Get the user_id from auth.users
    SELECT id INTO target_user_id 
    FROM auth.users 
    WHERE email = user_email;
    
    -- If user exists in auth but not in profiles, create the profile
    IF target_user_id IS NOT NULL THEN
        INSERT INTO public.profiles (
            user_id, 
            first_name, 
            last_name, 
            phone, 
            email,
            approval_status
        ) VALUES (
            target_user_id,
            COALESCE((SELECT raw_user_meta_data ->> 'first_name' FROM auth.users WHERE id = target_user_id), 'Usuario'),
            COALESCE((SELECT raw_user_meta_data ->> 'last_name' FROM auth.users WHERE id = target_user_id), ''),
            COALESCE((SELECT raw_user_meta_data ->> 'phone' FROM auth.users WHERE id = target_user_id), ''),
            user_email,
            'pending'
        )
        ON CONFLICT (user_id) DO NOTHING; -- Avoid duplicates if profile already exists
        
        RAISE NOTICE 'Profile created/checked for user: %', user_email;
    ELSE
        RAISE NOTICE 'User % not found in auth.users', user_email;
    END IF;
END $$;