
-- Find the name of the check constraint on "risk_level"
DO $$
DECLARE 
  constraint_name text;
BEGIN
  SELECT conname INTO constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.staking_assets'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%risk_level%';

  IF constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.staking_assets DROP CONSTRAINT %I;', constraint_name);
  END IF;
END $$;

-- Optionally, ensure the column is plain TEXT, not an enum
ALTER TABLE public.staking_assets
  ALTER COLUMN risk_level TYPE TEXT;
