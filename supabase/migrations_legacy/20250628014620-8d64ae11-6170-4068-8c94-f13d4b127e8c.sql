
-- Add status field to staking_assets table for draft/publish functionality
ALTER TABLE staking_assets 
ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'published';

-- Add a check constraint to ensure status is either 'draft' or 'published'
-- First drop if exists, then create
DO $$ 
BEGIN
    BEGIN
        ALTER TABLE staking_assets DROP CONSTRAINT staking_assets_status_check;
    EXCEPTION
        WHEN undefined_object THEN NULL;
    END;
    
    ALTER TABLE staking_assets 
    ADD CONSTRAINT staking_assets_status_check 
    CHECK (status IN ('draft', 'published'));
END $$;

-- Create an index for better query performance on status filtering
CREATE INDEX IF NOT EXISTS idx_staking_assets_status ON staking_assets(status);

-- Update existing RLS policies to consider status for public access
-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Public read access for staking assets" ON staking_assets;
DROP POLICY IF EXISTS "Public read access for published staking assets" ON staking_assets;

-- Create new policy that only allows public access to published items
CREATE POLICY "Public read access for published staking assets" 
ON staking_assets FOR SELECT 
USING (status = 'published');

-- Create policy for authenticated users to see all items (for admin)
CREATE POLICY "Authenticated users can read all staking assets" 
ON staking_assets FOR SELECT 
TO authenticated 
USING (true);

-- Update existing insert/update policies to allow status management
DROP POLICY IF EXISTS "Admin users can insert staking assets" ON staking_assets;
DROP POLICY IF EXISTS "Admin users can update staking assets" ON staking_assets;
DROP POLICY IF EXISTS "Admin users can delete staking assets" ON staking_assets;

-- Recreate admin policies
CREATE POLICY "Admin users can insert staking assets" 
ON staking_assets FOR INSERT 
TO authenticated 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.is_superadmin = true)
  )
);

CREATE POLICY "Admin users can update staking assets" 
ON staking_assets FOR UPDATE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.is_superadmin = true)
  )
);

CREATE POLICY "Admin users can delete staking assets" 
ON staking_assets FOR DELETE 
TO authenticated 
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = auth.uid() 
    AND (profiles.is_admin = true OR profiles.is_superadmin = true)
  )
);

-- Comment for documentation
COMMENT ON COLUMN staking_assets.status IS 'Status of the staking asset: draft (not visible to public) or published (visible to public)';
