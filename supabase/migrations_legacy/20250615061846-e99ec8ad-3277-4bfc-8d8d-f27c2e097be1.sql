
-- Add featured column to staking_assets table
ALTER TABLE public.staking_assets 
ADD COLUMN featured boolean NOT NULL DEFAULT false;

-- Update a few existing records to be featured for testing
UPDATE public.staking_assets 
SET featured = true 
WHERE id IN (
  SELECT id FROM public.staking_assets 
  LIMIT 3
);
