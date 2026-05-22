-- Add earn and points fields to staking_assets table
ALTER TABLE staking_assets 
ADD COLUMN earn text[],
ADD COLUMN points text;