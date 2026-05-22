-- Add wait delay column to apy_tvl_configs table
ALTER TABLE public.apy_tvl_configs 
ADD COLUMN wait_delay_seconds INTEGER DEFAULT 0;

-- Add constraint to ensure reasonable wait times (0-30 seconds)
ALTER TABLE public.apy_tvl_configs 
ADD CONSTRAINT check_wait_delay_range 
CHECK (wait_delay_seconds >= 0 AND wait_delay_seconds <= 30);