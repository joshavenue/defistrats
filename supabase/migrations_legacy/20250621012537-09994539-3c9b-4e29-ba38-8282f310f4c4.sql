
-- Create scraper_configs table to store scraping configurations for each asset
CREATE TABLE public.scraper_configs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.staking_assets(id) ON DELETE CASCADE NOT NULL,
  target_website TEXT NOT NULL,
  apy_selector TEXT,
  tvl_selector TEXT,
  scraping_interval_hours INTEGER NOT NULL DEFAULT 24,
  is_active BOOLEAN NOT NULL DEFAULT false,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create scraper_logs table to track scraping history and changes
CREATE TABLE public.scraper_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  asset_id UUID REFERENCES public.staking_assets(id) ON DELETE CASCADE NOT NULL,
  scraping_type TEXT NOT NULL CHECK (scraping_type IN ('APY', 'TVL')),
  old_value NUMERIC,
  new_value NUMERIC,
  scraped_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  success BOOLEAN NOT NULL DEFAULT false,
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_scraper_configs_asset_id ON public.scraper_configs(asset_id);
CREATE INDEX idx_scraper_configs_active ON public.scraper_configs(is_active);
CREATE INDEX idx_scraper_logs_asset_id ON public.scraper_logs(asset_id);
CREATE INDEX idx_scraper_logs_scraped_at ON public.scraper_logs(scraped_at);

-- Add trigger to update updated_at column
CREATE TRIGGER update_scraper_configs_updated_at 
  BEFORE UPDATE ON public.scraper_configs 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE public.scraper_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scraper_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for scraper_configs (allow all operations for now since this is admin functionality)
CREATE POLICY "Allow all operations on scraper_configs" ON public.scraper_configs FOR ALL USING (true);

-- Create policies for scraper_logs (allow all operations for now since this is admin functionality)
CREATE POLICY "Allow all operations on scraper_logs" ON public.scraper_logs FOR ALL USING (true);
