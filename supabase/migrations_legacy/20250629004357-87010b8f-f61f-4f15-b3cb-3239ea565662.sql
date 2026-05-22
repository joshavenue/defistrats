
-- Add TVL suffix column to apy_tvl_configs table
ALTER TABLE public.apy_tvl_configs 
ADD COLUMN IF NOT EXISTS tvl_suffix TEXT;
