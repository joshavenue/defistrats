# APY & TVL Fetcher Edge Function Deployment

## Current Status
The APY & TVL fetcher has been implemented with a fallback mechanism:
1. **Primary**: Tries to use the new `scrape-apy-tvl` Edge Function
2. **Fallback**: Uses the existing `scrape-data` function if the new one isn't deployed

## To Complete the Deployment

### 1. Deploy the Edge Function
```bash
# Login to Supabase (if not already logged in)
npx supabase login

# Deploy the new Edge Function
npx supabase functions deploy scrape-apy-tvl

# Set the Firecrawl API key as a secret
npx supabase secrets set FIRECRAWL_API_KEY=your_firecrawl_api_key_here
```

### 2. Apply Database Migration
```bash
# Apply the migration to create the apy_tvl_configs table
npx supabase db push
```

### 3. Alternative Manual Deployment
If you prefer to deploy manually through the Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to Edge Functions
3. Create a new function named `scrape-apy-tvl`
4. Copy the contents from `supabase/functions/scrape-apy-tvl/index.ts`
5. Set the `FIRECRAWL_API_KEY` environment variable in Project Settings > API

## Current Implementation
- ✅ APYTVLFetcher component created and integrated
- ✅ New Edge Function code written
- ✅ Database migration created
- ✅ Fallback mechanism implemented
- ✅ Integration with AdminAdd page complete
- ⏳ Edge Function deployment pending
- ⏳ Database migration application pending

## How It Works
1. **User Input**: Target website, asset name, custom APY/TVL field names
2. **Firecrawl Integration**: Crawls the website and extracts structured data
3. **Smart Extraction**: Finds tables containing the specified asset and extracts values
4. **Auto-parsing**: Handles percentages, currency symbols, and abbreviations (K, M, B)
5. **Fallback Support**: Uses existing infrastructure until new function is deployed

The system is fully functional with the fallback mechanism. Once the Edge Function is deployed, it will automatically use the optimized version.