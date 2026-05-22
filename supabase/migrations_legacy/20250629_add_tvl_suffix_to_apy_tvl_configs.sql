-- Add TVL suffix column to apy_tvl_configs table
ALTER TABLE public.apy_tvl_configs 
ADD COLUMN tvl_suffix TEXT;