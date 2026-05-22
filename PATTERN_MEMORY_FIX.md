# Pattern Memory Fix

The text pattern memory feature requires database migrations to be applied. Here's how to fix the issue where patterns are forgotten after refresh:

## Step 1: Apply Database Migrations

Run these SQL commands in your Supabase SQL Editor to add the missing columns:

```sql
-- Add wait delay column if not exists
ALTER TABLE public.apy_tvl_configs 
ADD COLUMN IF NOT EXISTS wait_delay_seconds INTEGER DEFAULT 0;

-- Add constraint for wait delay
ALTER TABLE public.apy_tvl_configs 
ADD CONSTRAINT IF NOT EXISTS check_wait_delay_range 
CHECK (wait_delay_seconds >= 0 AND wait_delay_seconds <= 30);

-- Add text pattern fields for storing selected patterns
ALTER TABLE public.apy_tvl_configs 
ADD COLUMN IF NOT EXISTS apy_text_pattern TEXT,
ADD COLUMN IF NOT EXISTS tvl_text_pattern TEXT,
ADD COLUMN IF NOT EXISTS apy_context_before TEXT,
ADD COLUMN IF NOT EXISTS apy_context_after TEXT,
ADD COLUMN IF NOT EXISTS tvl_context_before TEXT,
ADD COLUMN IF NOT EXISTS tvl_context_after TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.apy_tvl_configs.apy_text_pattern IS 'The exact text pattern selected for APY extraction';
COMMENT ON COLUMN public.apy_tvl_configs.tvl_text_pattern IS 'The exact text pattern selected for TVL extraction';
COMMENT ON COLUMN public.apy_tvl_configs.apy_context_before IS 'Text context before APY value for pattern matching';
COMMENT ON COLUMN public.apy_tvl_configs.apy_context_after IS 'Text context after APY value for pattern matching';
COMMENT ON COLUMN public.apy_tvl_configs.tvl_context_before IS 'Text context before TVL value for pattern matching';
COMMENT ON COLUMN public.apy_tvl_configs.tvl_context_after IS 'Text context after TVL value for pattern matching';
```

## Step 2: Regenerate Types (Optional)

If you have Supabase CLI set up, regenerate the TypeScript types:

```bash
npx supabase gen types typescript --project-id YOUR_PROJECT_ID > src/integrations/supabase/types.ts
```

## Step 3: Test the Fix

1. Go to `/admin/add` page
2. Configure APY & TVL Fetcher
3. Run "Test Fetch"
4. Go to HTML tab and highlight the exact APY/TVL values
5. Click "Extract APY" and "Extract TVL"
6. Save the configuration
7. Refresh the page - patterns should now be remembered!

## How It Works Now

When you highlight text like `<span style="font-weight: 500;">$10,994,463.73</span>`:

1. **Text Cleaning**: Removes HTML tags and CSS to get `$10,994,463.73`
2. **Pattern Storage**: Saves the clean pattern + surrounding context to database
3. **Smart Matching**: Future fetches look for the exact value `10994463.73` in multiple formats:
   - `$10,994,463.73` (with commas)
   - `$10994463.73` (without commas) 
   - `10994463.73` (plain number)
   - `10,994,463.73` (formatted)
4. **Context Matching**: Uses surrounding text to pinpoint exact location
5. **Fallback Strategy**: Falls back to field-based parsing if pattern doesn't match

The system will now remember your exact selections and use them for all future automatic fetches!