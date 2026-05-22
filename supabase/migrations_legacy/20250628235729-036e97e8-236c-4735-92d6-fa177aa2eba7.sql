
-- Create APY & TVL fetcher configurations table
CREATE TABLE IF NOT EXISTS public.apy_tvl_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    asset_id UUID NOT NULL REFERENCES public.staking_assets(id) ON DELETE CASCADE,
    target_website TEXT NOT NULL,
    target_asset1 TEXT NOT NULL,
    apy_field_name TEXT NOT NULL DEFAULT 'APY',
    tvl_field_name TEXT NOT NULL DEFAULT 'TVL',
    scraping_interval_hours INTEGER NOT NULL DEFAULT 24,
    is_active BOOLEAN NOT NULL DEFAULT false,
    last_scraped_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_apy_tvl_configs_asset_id ON public.apy_tvl_configs(asset_id);
CREATE INDEX IF NOT EXISTS idx_apy_tvl_configs_active ON public.apy_tvl_configs(is_active);

-- Enable RLS
ALTER TABLE public.apy_tvl_configs ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated users with admin role
CREATE POLICY "Admins can view apy_tvl_configs" ON public.apy_tvl_configs
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.is_admin = true OR profiles.is_superadmin = true)
        )
    );

CREATE POLICY "Admins can insert apy_tvl_configs" ON public.apy_tvl_configs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.is_admin = true OR profiles.is_superadmin = true)
        )
    );

CREATE POLICY "Admins can update apy_tvl_configs" ON public.apy_tvl_configs
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.is_admin = true OR profiles.is_superadmin = true)
        )
    );

CREATE POLICY "Admins can delete apy_tvl_configs" ON public.apy_tvl_configs
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.is_admin = true OR profiles.is_superadmin = true)
        )
    );

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_apy_tvl_configs_updated_at
    BEFORE UPDATE ON public.apy_tvl_configs
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_updated_at_column();
