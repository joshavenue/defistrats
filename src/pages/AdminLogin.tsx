
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';

const AdminLogin: React.FC = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Redirect if already logged in
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session?.user) return;
      // check if admin
      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin, is_superadmin')
        .eq('id', session.user.id)
        .single();
      if (!error && (data?.is_admin || data?.is_superadmin)) {
        navigate('/admin/database');
      }
    });
  }, [navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error, data } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error || !data.session?.user) {
      toast({
        title: 'Login Failed',
        description: error?.message || 'Could not log in with those credentials',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    // Check role
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('is_admin, is_superadmin')
      .eq('id', data.session.user.id)
      .single();

    if (profileError || !(profile?.is_admin || profile?.is_superadmin)) {
      toast({
        title: 'Access Denied',
        description: 'You do not have admin access.',
        variant: 'destructive',
      });
      setLoading(false);
      return;
    }
    toast({
      title: 'Welcome!',
      description: 'You have successfully logged in.',
    });
    navigate('/admin/database');
    setLoading(false);
  };

  return (
    <div className="bg-[#0C0E12] min-h-screen flex flex-col items-center justify-center">
      <div className="rounded-xl shadow-lg p-8 max-w-md w-full bg-[#181B20] border border-[#22262F]">
        <h1 className="text-2xl font-bold mb-6 text-[#F7F7F7] text-center">Admin Login</h1>
        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <Input
            type="email"
            autoComplete="username"
            required
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="bg-[#23262F] text-[#F7F7F7] border-[#373A41]"
          />
          <Input
            type="password"
            autoComplete="current-password"
            required
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="bg-[#23262F] text-[#F7F7F7] border-[#373A41]"
          />
          <Button
            type="submit"
            className="bg-[#75E0A7] text-[#0C0E12] hover:bg-[#75E0A7]/90"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AdminLogin;
