
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to extract the first valid IP address from a comma-separated list
function extractClientIP(forwardedFor: string | null, realIP: string | null): string | null {
  if (forwardedFor) {
    // Split by comma and get the first IP (client IP)
    const ips = forwardedFor.split(',').map(ip => ip.trim());
    const firstIP = ips[0];
    
    // Basic validation to ensure it looks like an IP address
    if (firstIP && /^[\d.:a-f]+$/.test(firstIP)) {
      return firstIP;
    }
  }
  
  if (realIP && /^[\d.:a-f]+$/.test(realIP)) {
    return realIP;
  }
  
  return null;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    )

    const { type, data } = await req.json()
    
    // Extract client IP properly from headers
    const forwardedFor = req.headers.get('x-forwarded-for');
    const realIP = req.headers.get('x-real-ip');
    const clientIP = extractClientIP(forwardedFor, realIP);
    
    console.log('IP extraction:', { forwardedFor, realIP, clientIP });

    if (type === 'page_view') {
      const { error } = await supabase
        .from('page_views')
        .insert({
          session_id: data.session_id,
          page_path: data.page_path,
          user_agent: data.user_agent,
          referrer: data.referrer,
          ip_address: clientIP
        });

      if (error) {
        console.error('Error inserting page view:', error);
        throw error;
      }
      
      console.log('Page view tracked successfully:', { session_id: data.session_id, page_path: data.page_path });
    } else if (type === 'link_click') {
      const { error } = await supabase
        .from('link_clicks')
        .insert({
          session_id: data.session_id,
          link_url: data.link_url,
          link_type: data.link_type,
          page_path: data.page_path,
          user_agent: data.user_agent,
          ip_address: clientIP
        });

      if (error) {
        console.error('Error inserting link click:', error);
        throw error;
      }
      
      console.log('Link click tracked successfully:', { session_id: data.session_id, link_url: data.link_url, link_type: data.link_type });
    }

    return new Response(
      JSON.stringify({ success: true }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  } catch (error) {
    console.error('Analytics tracking error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          ...corsHeaders 
        } 
      }
    )
  }
})
