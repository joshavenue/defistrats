
-- First let's see what check constraint exists on risk_level
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.staking_assets'::regclass 
AND contype = 'c';
