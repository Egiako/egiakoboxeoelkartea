ALTER FUNCTION public.recompute_class_capacity(uuid) SET search_path = public;
DROP POLICY IF EXISTS "Allow authenticated upload to signatures" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read signatures" ON storage.objects;