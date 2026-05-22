-- Create livestream_videos table for managing video collections
CREATE TABLE IF NOT EXISTS livestream_videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  x_broadcast_url TEXT NOT NULL,
  preview_image_url TEXT,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Create index for ordering and filtering
CREATE INDEX IF NOT EXISTS idx_livestream_videos_active_order ON livestream_videos(is_active, order_index);
CREATE INDEX IF NOT EXISTS idx_livestream_videos_created_at ON livestream_videos(created_at DESC);

-- Enable RLS
ALTER TABLE livestream_videos ENABLE ROW LEVEL SECURITY;

-- Public can read active videos
CREATE POLICY "Public read access for active livestream videos" 
ON livestream_videos FOR SELECT 
USING (is_active = true);

-- Admin users can manage all videos
CREATE POLICY "Admin users can manage livestream videos" 
ON livestream_videos FOR ALL 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.is_superadmin = true)
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.is_superadmin = true)
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_livestream_videos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.updated_by = auth.uid();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_livestream_videos_updated_at
  BEFORE UPDATE ON livestream_videos
  FOR EACH ROW
  EXECUTE FUNCTION update_livestream_videos_updated_at();