
// Analytics utility functions for tracking page views and link clicks
import { supabase } from '@/integrations/supabase/client';
import { debounce, throttle } from './debounce';

// Generate a session ID that persists for the browser session
const getSessionId = (): string => {
  let sessionId = sessionStorage.getItem('analytics_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('analytics_session_id', sessionId);
  }
  return sessionId;
};

// Track page view with debouncing
const trackPageViewInternal = async (pagePath: string) => {
  try {
    const sessionId = getSessionId();
    const userAgent = navigator.userAgent;
    const referrer = document.referrer || null;
    
    // Non-blocking analytics call
    supabase.functions.invoke('track-analytics', {
      body: {
        type: 'page_view',
        data: {
          session_id: sessionId,
          page_path: pagePath,
          user_agent: userAgent,
          referrer: referrer
        }
      }
    }).catch(error => {
      console.warn('Analytics tracking failed:', error);
    });

    // Also update active session (non-blocking)
    updateActiveSession(pagePath);
  } catch (error) {
    console.warn('Error tracking page view:', error);
  }
};

export const trackPageView = debounce(trackPageViewInternal, 1000);

// Update active session for real-time tracking
export const updateActiveSession = async (pagePath: string) => {
  try {
    const sessionId = getSessionId();
    const userAgent = navigator.userAgent;
    
    await supabase
      .from('active_sessions')
      .upsert({
        session_id: sessionId,
        user_agent: userAgent,
        page_path: pagePath,
        last_seen: new Date().toISOString()
      }, {
        onConflict: 'session_id'
      });
  } catch (error) {
    console.error('Error updating active session:', error);
  }
};

// Send heartbeat to keep session active
export const sendHeartbeat = async () => {
  try {
    const sessionId = getSessionId();
    
    await supabase
      .from('active_sessions')
      .update({ last_seen: new Date().toISOString() })
      .eq('session_id', sessionId);
  } catch (error) {
    console.error('Error sending heartbeat:', error);
  }
};

// Start heartbeat interval (increased to 2 minutes for better performance)
export const startHeartbeat = () => {
  // Send heartbeat every 2 minutes
  return setInterval(() => {
    sendHeartbeat();
  }, 120000);
};

// Get active sessions count
export const getActiveSessions = async () => {
  try {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('active_sessions')
      .select('*', { count: 'exact', head: true })
      .gte('last_seen', fiveMinutesAgo);
    
    return count || 0;
  } catch (error) {
    console.error('Error getting active sessions:', error);
    return 0;
  }
};

// Track link click with throttling
const trackLinkClickInternal = async (linkUrl: string, linkType: string, pagePath: string) => {
  try {
    const sessionId = getSessionId();
    const userAgent = navigator.userAgent;
    
    // Non-blocking analytics call
    supabase.functions.invoke('track-analytics', {
      body: {
        type: 'link_click',
        data: {
          session_id: sessionId,
          link_url: linkUrl,
          link_type: linkType,
          page_path: pagePath,
          user_agent: userAgent
        }
      }
    }).catch(error => {
      console.warn('Link tracking failed:', error);
    });
  } catch (error) {
    console.warn('Error tracking link click:', error);
  }
};

export const trackLinkClick = throttle(trackLinkClickInternal, 2000);
