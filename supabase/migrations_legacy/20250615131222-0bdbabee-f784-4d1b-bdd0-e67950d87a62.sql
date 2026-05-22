
-- Enable RLS if not already enabled (should already be enabled if you're seeing this error, but harmless to run)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: allow authenticated users to insert profiles (adjust later if you want finer control)
CREATE POLICY "Allow authenticated insert" ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (true);
