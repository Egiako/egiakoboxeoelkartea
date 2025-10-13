-- Add consent fields to profiles table
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS consent_signature_url text,
ADD COLUMN IF NOT EXISTS consent_method text,
ADD COLUMN IF NOT EXISTS consent_signed_ip inet,
ADD COLUMN IF NOT EXISTS consent_user_agent text,
ADD COLUMN IF NOT EXISTS consent_text_version text DEFAULT 'v1';

-- Create storage bucket for consent signatures
INSERT INTO storage.buckets (id, name, public)
VALUES ('consents', 'consents', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for consents bucket
CREATE POLICY "Authenticated users can upload their own consent signatures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'consents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own consent signatures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'consents' 
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Admins can view all consent signatures"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'consents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Service role can manage all consents"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'consents')
WITH CHECK (bucket_id = 'consents');