
-- Create page_views table for visitor tracking
CREATE TABLE public.page_views (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  page_path TEXT NOT NULL,
  user_agent TEXT,
  referrer TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create link_clicks table for click event tracking  
CREATE TABLE public.link_clicks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT NOT NULL,
  link_url TEXT NOT NULL,
  link_type TEXT NOT NULL, -- 'explore', 'video', 'social', etc.
  page_path TEXT NOT NULL,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add indexes for better performance
CREATE INDEX idx_page_views_created_at ON public.page_views(created_at);
CREATE INDEX idx_page_views_session_id ON public.page_views(session_id);
CREATE INDEX idx_page_views_page_path ON public.page_views(page_path);

CREATE INDEX idx_link_clicks_created_at ON public.link_clicks(created_at);
CREATE INDEX idx_link_clicks_session_id ON public.link_clicks(session_id);
CREATE INDEX idx_link_clicks_link_type ON public.link_clicks(link_type);
CREATE INDEX idx_link_clicks_page_path ON public.link_clicks(page_path);

-- Enable Row Level Security
ALTER TABLE public.page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for admin access only
CREATE POLICY "Admins can view all page views" 
  ON public.page_views 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.is_superadmin = true)
    )
  );

CREATE POLICY "Admins can view all link clicks" 
  ON public.link_clicks 
  FOR SELECT 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND (profiles.is_admin = true OR profiles.is_superadmin = true)
    )
  );

-- Allow anonymous inserts for tracking (we'll use edge function for this)
CREATE POLICY "Allow anonymous inserts for page views" 
  ON public.page_views 
  FOR INSERT 
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow anonymous inserts for link clicks" 
  ON public.link_clicks 
  FOR INSERT 
  TO anon
  WITH CHECK (true);
