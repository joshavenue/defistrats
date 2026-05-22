
-- Add strategy_description column to staking_assets table
ALTER TABLE public.staking_assets 
ADD COLUMN strategy_description TEXT;
