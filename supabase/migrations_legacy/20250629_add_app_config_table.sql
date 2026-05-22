-- Create app_config table to store application configuration values
CREATE TABLE IF NOT EXISTS public.app_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key_name TEXT NOT NULL UNIQUE,
  key_value TEXT,
  description TEXT,
  is_secret BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the Moralis API key
INSERT INTO public.app_config (key_name, key_value, description, is_secret)
VALUES (
  'VITE_MORALIS_API_KEY',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJub25jZSI6ImJlY2Q4MTJmLTMyYzAtNDUxNS1hZmRlLTU2YWNiODgyOTBlYyIsIm9yZ0lkIjoiNDU2MDg1IiwidXNlcklkIjoiNDY5MjUxIiwidHlwZUlkIjoiYzBiYTNmM2ItY2VhYS00NDZmLWI3NGItOWMyY2E2MTQwZDZhIiwidHlwZSI6IlBST0pFQ1QiLCJpYXQiOjE3NTEwMzkwNTksImV4cCI6NDkwNjc5OTA1OX0.j4DonZQpDLuM9-qmqaAHHQMDfR0AcaU1_ZKCo_quuCQ',
  'Moralis Web3 API key for blockchain data fetching',
  true
)
ON CONFLICT (key_name) 
DO UPDATE SET 
  key_value = EXCLUDED.key_value,
  updated_at = NOW();

-- Set up RLS (Row Level Security)
ALTER TABLE public.app_config ENABLE ROW LEVEL SECURITY;

-- Create policy to allow admin users to read config
CREATE POLICY "Admin users can read app config" ON public.app_config
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.is_superadmin = true)
    )
  );

-- Create policy to allow superadmin users to modify config
CREATE POLICY "Superadmin users can modify app config" ON public.app_config
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.is_superadmin = true
    )
  );

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_app_config_updated_at 
  BEFORE UPDATE ON public.app_config 
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();