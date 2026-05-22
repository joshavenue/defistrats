-- Add text pattern fields to store extracted selection patterns for future fetches
ALTER TABLE public.apy_tvl_configs 
ADD COLUMN apy_text_pattern TEXT,
ADD COLUMN tvl_text_pattern TEXT,
ADD COLUMN apy_context_before TEXT,
ADD COLUMN apy_context_after TEXT,
ADD COLUMN tvl_context_before TEXT,
ADD COLUMN tvl_context_after TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.apy_tvl_configs.apy_text_pattern IS 'The exact text pattern selected for APY extraction';
COMMENT ON COLUMN public.apy_tvl_configs.tvl_text_pattern IS 'The exact text pattern selected for TVL extraction';
COMMENT ON COLUMN public.apy_tvl_configs.apy_context_before IS 'Text context before APY value for pattern matching';
COMMENT ON COLUMN public.apy_tvl_configs.apy_context_after IS 'Text context after APY value for pattern matching';
COMMENT ON COLUMN public.apy_tvl_configs.tvl_context_before IS 'Text context before TVL value for pattern matching';
COMMENT ON COLUMN public.apy_tvl_configs.tvl_context_after IS 'Text context after TVL value for pattern matching';