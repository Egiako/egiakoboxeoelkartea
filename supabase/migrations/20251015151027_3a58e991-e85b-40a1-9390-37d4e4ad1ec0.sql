-- 1. Crear bucket público 'signatures' para firmas de consentimiento
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signatures',
  'signatures',
  true,
  5242880, -- 5MB limit
  ARRAY['image/png', 'image/jpeg', 'image/jpg']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg'];

-- 2. Eliminar políticas antiguas si existen para poder recrearlas
DROP POLICY IF EXISTS "Allow authenticated upload to signatures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read signatures" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update own signatures" ON storage.objects;
DROP POLICY IF EXISTS "Allow admin delete signatures" ON storage.objects;

-- 3. Crear políticas de Storage para bucket signatures

-- Política: Permitir INSERT (upload) de firmas a usuarios autenticados
CREATE POLICY "Allow authenticated upload to signatures"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'signatures');

-- Política: Permitir SELECT (lectura) pública de firmas
CREATE POLICY "Allow public read signatures"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'signatures');

-- Política: Permitir UPDATE a usuarios autenticados de sus propias firmas
CREATE POLICY "Allow authenticated update own signatures"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'signatures' AND owner = auth.uid());

-- Política: Permitir DELETE solo a admins
CREATE POLICY "Allow admin delete signatures"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'signatures' 
  AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() 
    AND role = 'admin'
  )
);