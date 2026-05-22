
-- Check what the constraint allows for risk_level
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.staking_assets'::regclass 
AND contype = 'c'
AND conname LIKE '%risk_level%';
