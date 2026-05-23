import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import Index from "./pages/Index";
import AdminAdd from "./pages/AdminAdd";
import AdminDatabase from "./pages/AdminDatabase";
import AdminLogin from "./pages/AdminLogin";
import NotFound from "./pages/NotFound";
import AdminUser from "./pages/AdminUser";
import AdminAnalytics from "./pages/AdminAnalytics";
import StrategyDetail from "./pages/StrategyDetail";
import CMS from "./pages/CMS";
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { trackPageView, startHeartbeat } from "@/lib/analytics";
import { ClarityComponent as MSClarity } from "@/components/Clarity";
import { PrivyWrapper } from "@/components/PrivyProvider";
import { registerServiceWorker } from "@/utils/serviceWorker";

// Analytics wrapper to track page views
function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname);
  }, [location.pathname]);

  useEffect(() => {
    // Start heartbeat for real-time session tracking
    const heartbeatInterval = startHeartbeat();
    
    return () => {
      clearInterval(heartbeatInterval);
    };
  }, []);

  return <>{children}</>;
}

// Helper for protected admin routes
function AdminProtectedRoute({ children }: { children: JSX.Element }) {
  const [allowed, setAllowed] = React.useState<'pending' | 'yes' | 'no'>('pending');
  const location = useLocation();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (!ignore) setAllowed('no');
          return;
        }
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_admin, is_superadmin')
          .eq('id', session.user.id)
          .single();
        if (error || !(profile?.is_admin || profile?.is_superadmin)) {
          if (!ignore) setAllowed('no');
          return;
        }
        if (!ignore) setAllowed('yes');
      } catch (err) {
        console.error('Admin check error:', err);
        if (!ignore) setAllowed('no');
      }
    })();
    return () => { ignore = true; };
  }, [location.pathname]);

  if (allowed === 'pending') {
    return (
      <div className="flex items-center justify-center h-screen text-[#F7F7F7] bg-[#0C0E12]">
        Checking permissions…
      </div>
    );
  }
  return allowed === 'yes'
    ? children
    : <Navigate to="/admin/login" replace />;
}

// Helper for superadmin-only routes
function SuperAdminProtectedRoute({ children }: { children: JSX.Element }) {
  const [allowed, setAllowed] = React.useState<'pending' | 'yes' | 'no'>('pending');
  const location = useLocation();

  useEffect(() => {
    let ignore = false;
    (async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
          if (!ignore) setAllowed('no');
          return;
        }
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('is_superadmin')
          .eq('id', session.user.id)
          .single();
        if (error || !profile?.is_superadmin) {
          if (!ignore) setAllowed('no');
          return;
        }
        if (!ignore) setAllowed('yes');
      } catch (err) {
        console.error('Superadmin check error:', err);
        if (!ignore) setAllowed('no');
      }
    })();
    return () => { ignore = true; };
  }, [location.pathname]);

  if (allowed === 'pending') {
    return (
      <div className="flex items-center justify-center h-screen text-[#F7F7F7] bg-[#0C0E12]">
        Checking permissions…
      </div>
    );
  }
  return allowed === 'yes'
    ? children
    : <Navigate to="/admin/database" replace />;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => {
  useEffect(() => {
    // Register service worker for image caching
    registerServiceWorker();
  }, []);

  return (
    <PrivyWrapper>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <MSClarity projectId="s5vsqbzt2u" />
          <BrowserRouter>
            <AnalyticsWrapper>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/strategy/drip.trade/nft" element={<Navigate to="/strategy/driptrade/nft" replace />} />
                <Route path="/strategy/:protocol/:assets" element={<StrategyDetail />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                {/* Protected admin routes */}
                <Route path="/admin/add" element={
                  <AdminProtectedRoute>
                    <AdminAdd />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/database" element={
                  <AdminProtectedRoute>
                    <AdminDatabase />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/user" element={
                  <SuperAdminProtectedRoute>
                    <AdminUser />
                  </SuperAdminProtectedRoute>
                } />
                <Route path="/admin/analytics" element={
                  <AdminProtectedRoute>
                    <AdminAnalytics />
                  </AdminProtectedRoute>
                } />
                <Route path="/admin/cms" element={
                  <AdminProtectedRoute>
                    <CMS />
                  </AdminProtectedRoute>
                } />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </AnalyticsWrapper>
          </BrowserRouter>
        </TooltipProvider>
      </QueryClientProvider>
    </PrivyWrapper>
  );
};

export default App;
