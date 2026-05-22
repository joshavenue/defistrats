-- Add APY decimals field to apy_tvl_configs table
-- This field allows admins to specify decimal places for APY calculations
-- when the fetched APY data includes decimal values that need to be converted

ALTER TABLE public.apy_tvl_configs 
ADD COLUMN IF NOT EXISTS apy_decimals INTEGER DEFAULT NULL;

-- Add comment to explain the field usage
COMMENT ON COLUMN public.apy_tvl_configs.apy_decimals IS 'Number of decimal places to consider when converting fetched APY values. For example, if API returns APY as 88852200338910530 with 18 decimals, this would be ~8.89% APY';