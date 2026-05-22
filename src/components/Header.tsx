
import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@supabase/supabase-js';
import { WalletButton } from '@/components/WalletButton';

const Header: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const location = useLocation();

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user || null);
      if (session?.user) {
        // Fetch admin status
        supabase
          .from('profiles')
          .select('is_admin, is_superadmin')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error) {
              setIsAdmin(data?.is_admin || data?.is_superadmin || false);
              setIsSuperAdmin(data?.is_superadmin || false);
            } else {
              setIsAdmin(false);
              setIsSuperAdmin(false);
            }
          });
      } else {
        setIsAdmin(false);
        setIsSuperAdmin(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      if (session?.user) {
        // Fetch admin status
        supabase
          .from('profiles')
          .select('is_admin, is_superadmin')
          .eq('id', session.user.id)
          .single()
          .then(({ data, error }) => {
            if (!error && (data?.is_admin || data?.is_superadmin)) {
              setIsAdmin(true);
            } else {
              setIsAdmin(false);
            }
          });
      } else {
        setIsAdmin(false);
      }
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // Clear local state first
      setUser(null);
      setIsAdmin(false);
      setIsSuperAdmin(false);
      
      // Clear any cached data
      localStorage.clear();
      sessionStorage.clear();
      
      // Sign out from Supabase with scope: 'global' to clear all sessions
      const { error } = await supabase.auth.signOut({ scope: 'global' });
      
      if (error) {
        console.error('Error signing out:', error);
        // Still try to navigate even if there's an error
      }
      
      // Force a page reload to clear any cached state
      window.location.href = '/';
      
    } catch (error) {
      console.error('Unexpected error during sign out:', error);
      // Force navigation even if there's an error
      window.location.href = '/';
    }
  };

  const isAdminRoute = location.pathname.startsWith('/admin');

  return (
    <header className="w-full bg-[#0C0E12] border-b border-[#22262F] relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center hover:opacity-80 transition-opacity">
              <img 
                src="/assets/f221d606-a350-4353-a6d2-92dd3106c53e.png" 
                alt="DeFiStrats Logo" 
                className="h-12 w-auto"
              />
            </Link>
          </div>

          {/* Navigation - Centered */}
          <div className="flex-1 flex justify-center">
            <nav className="hidden md:flex items-center space-x-8">
              {!isAdminRoute && (
                <>
                  <Link 
                    to="/livestream" 
                    className={`transition-colors ${
                      location.pathname === '/livestream' 
                        ? 'text-[#75E0A7]' 
                        : 'text-[#CECFD2] hover:text-[#F7F7F7]'
                    }`}
                  >
                    Live Streams
                  </Link>
                  <Link 
                    to="/defitesting" 
                    className={`transition-colors ${
                      location.pathname === '/defitesting' 
                        ? 'text-[#75E0A7]' 
                        : 'text-[#CECFD2] hover:text-[#F7F7F7]'
                    }`}
                  >
                    DeFi Testing
                  </Link>
                </>
              )}
              
              {user && isAdmin && (
                <div className="flex items-center space-x-6">
                  <Link 
                    to="/admin/cms" 
                    className={`transition-colors ${
                      location.pathname === '/admin/cms' 
                        ? 'text-[#75E0A7]' 
                        : 'text-[#CECFD2] hover:text-[#F7F7F7]'
                    }`}
                  >
                    CMS
                  </Link>
                  <Link 
                    to="/admin/add" 
                    className={`transition-colors ${
                      location.pathname === '/admin/add' 
                        ? 'text-[#75E0A7]' 
                        : 'text-[#CECFD2] hover:text-[#F7F7F7]'
                    }`}
                  >
                    Add Item
                  </Link>
                  {isSuperAdmin && (
                    <Link 
                      to="/admin/user" 
                      className={`transition-colors ${
                        location.pathname === '/admin/user' 
                          ? 'text-[#75E0A7]' 
                          : 'text-[#CECFD2] hover:text-[#F7F7F7]'
                      }`}
                    >
                      Users
                    </Link>
                  )}
                  <Link 
                    to="/admin/analytics" 
                    className={`transition-colors ${
                      location.pathname === '/admin/analytics' 
                        ? 'text-[#75E0A7]' 
                        : 'text-[#CECFD2] hover:text-[#F7F7F7]'
                    }`}
                  >
                    Analytics
                  </Link>
                </div>
              )}

              {/* X Handle - Hidden for admin users */}
              {!isAdmin && (
                <a 
                  href="https://x.com/defi_strats" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[#75E0A7] hover:text-[#6BC995] font-medium transition-colors duration-200 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                  @Defi_strats
                </a>
              )}
            </nav>
          </div>

          {/* Right Side - Wallet & User Menu */}
          <div className="flex items-center space-x-4">
            {/* Wallet Button - Always visible for non-admin routes */}
            {!isAdminRoute && <WalletButton />}
            
            {/* X Handle for mobile - Hidden for admin users */}
            {!isAdmin && (
              <a 
                href="https://x.com/defi_strats" 
                target="_blank" 
                rel="noopener noreferrer"
                className="md:hidden text-[#75E0A7] hover:text-[#6BC995] transition-colors duration-200"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
            )}

            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-[#CECFD2] text-sm hidden sm:block">
                  {user.email}
                </span>
                <button 
                  onClick={handleSignOut}
                  disabled={isSigningOut}
                  className="bg-[#22262F] text-[#F7F7F7] px-4 py-2 rounded-lg hover:bg-[#2A2F3A] transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isSigningOut && (
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                  )}
                  {isSigningOut ? 'Signing Out...' : 'Sign Out'}
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                {/* Admin Login button is now hidden */}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
