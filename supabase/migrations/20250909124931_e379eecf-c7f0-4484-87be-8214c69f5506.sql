-- Fix existing users who don't have profiles (created after 2025-09-09 12:00:00)
-- Create profiles for users who registered but don't have them due to missing trigger

DO $$
DECLARE
    user_record RECORD;
BEGIN
    -- Get users who don't have profiles
    FOR user_record IN 
        SELECT u.id, u.email, u.raw_user_meta_data, u.created_at
        FROM auth.users u
        LEFT JOIN public.profiles p ON u.id = p.user_id
        WHERE p.user_id IS NULL
        AND u.created_at > '2025-09-09 12:00:00'
    LOOP
        -- Create profile for each user
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
            user_record.id,
            COALESCE(user_record.raw_user_meta_data ->> 'first_name', 'Sin nombre'),
            COALESCE(user_record.raw_user_meta_data ->> 'last_name', 'Sin apellido'),
            COALESCE(user_record.raw_user_meta_data ->> 'phone', ''),
            user_record.email,
            CASE WHEN user_record.email = 'etius93.xb@gmail.com' THEN true ELSE false END,
            false, -- New registrations are not re-registrations initially
            NULL,
            CASE WHEN user_record.email = 'etius93.xb@gmail.com' THEN 'approved' ELSE 'pending' END
        );

        -- Assign user role (admin for egiakobe@gmail.com, trainer for etius93.xb@gmail.com, else user)
        IF user_record.email = 'egiakobe@gmail.com' THEN
            INSERT INTO public.user_roles (user_id, role) VALUES (user_record.id, 'admin');
        ELSIF user_record.email = 'etius93.xb@gmail.com' THEN
            INSERT INTO public.user_roles (user_id, role) VALUES (user_record.id, 'trainer');
            INSERT INTO public.user_roles (user_id, role) VALUES (user_record.id, 'user');
        ELSE
            INSERT INTO public.user_roles (user_id, role) VALUES (user_record.id, 'user');
        END IF;

        RAISE LOG 'Created profile for user: % (%)', user_record.email, user_record.id;
    END LOOP;
END $$;