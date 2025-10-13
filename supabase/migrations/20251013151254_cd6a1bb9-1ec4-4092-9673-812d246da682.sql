-- Add new fields to profiles table for consent and identity verification
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS dni text,
ADD COLUMN IF NOT EXISTS birth_date date,
ADD COLUMN IF NOT EXISTS consent_signed boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS consent_signed_at timestamp with time zone;

-- Add index for efficient consent lookups
CREATE INDEX IF NOT EXISTS idx_profiles_consent_signed ON public.profiles(consent_signed);

COMMENT ON COLUMN public.profiles.dni IS 'Documento Nacional de Identidad o documento de identidad equivalente';
COMMENT ON COLUMN public.profiles.birth_date IS 'Fecha de nacimiento del usuario';
COMMENT ON COLUMN public.profiles.consent_signed IS 'Indica si el usuario ha firmado el consentimiento informado';
COMMENT ON COLUMN public.profiles.consent_signed_at IS 'Fecha y hora en que se firmó el consentimiento informado';