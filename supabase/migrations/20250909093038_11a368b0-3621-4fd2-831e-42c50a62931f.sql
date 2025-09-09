-- Check and remove any overly permissive policies on profiles table
-- First, let's see what policies exist and remove any that allow public access

-- Remove any policy that might allow public access without authentication
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Public can view profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

-- Ensure we have proper authenticated-only policies
-- Add policy to ensure only authenticated users can see their own profile (if not exists)
DO $$ 
BEGIN
    -- Check if the policy exists before creating
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' 
        AND policyname = 'Authenticated users can view their own profile'
    ) THEN
        CREATE POLICY "Authenticated users can view their own profile" 
        ON public.profiles 
        FOR SELECT 
        USING (auth.uid() = user_id);
    END IF;
END $$;

-- Ensure profiles table has RLS enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;