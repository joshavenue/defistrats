-- Create a storage bucket for asset logos
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit)
VALUES (
  'asset-logos',
  'asset-logos',
  true,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'],
  5242880  -- 5MB limit
);

-- Create RLS policies for the asset-logos bucket

-- Allow authenticated users to upload files
CREATE POLICY "Allow authenticated users to upload asset logos" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'asset-logos');

-- Allow public read access to asset logos
CREATE POLICY "Allow public read access to asset logos" ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'asset-logos');

-- Allow authenticated users to update their uploaded files
CREATE POLICY "Allow authenticated users to update asset logos" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'asset-logos');

-- Allow authenticated users to delete files (optional, for cleanup)
CREATE POLICY "Allow authenticated users to delete asset logos" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'asset-logos');