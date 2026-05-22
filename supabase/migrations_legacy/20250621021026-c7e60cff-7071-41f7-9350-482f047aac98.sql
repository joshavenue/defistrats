
-- Create the asset-logos storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'asset-logos',
  'asset-logos', 
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
);

-- Create RLS policies for the asset-logos bucket
CREATE POLICY "Allow authenticated users to upload asset logos" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'asset-logos');

CREATE POLICY "Allow public read access to asset logos" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'asset-logos');

CREATE POLICY "Allow authenticated users to update asset logos" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'asset-logos');

CREATE POLICY "Allow authenticated users to delete asset logos" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'asset-logos');
