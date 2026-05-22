import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface Profile {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  is_superadmin: boolean;
  created_at?: string;
}

export const ProfilesDebug: React.FC = () => {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const testProfilesAccess = async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        setCurrentUser(user);

        // Try to fetch profiles
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) {
          setError(`Error fetching profiles: ${error.message}`);
          console.error('Profiles fetch error:', error);
        } else {
          setProfiles(data || []);
          console.log('Profiles fetched successfully:', data);
        }
      } catch (err) {
        setError(`Unexpected error: ${err}`);
        console.error('Unexpected error:', err);
      }
    };

    testProfilesAccess();
  }, []);

  return (
    <div className="bg-[#181B20] border border-[#22262F] rounded-lg p-4 mb-6">
      <h3 className="text-[#F7F7F7] font-semibold mb-3">Profiles Debug Info</h3>
      
      <div className="space-y-2 text-sm">
        <div>
          <span className="text-[#94979C]">Current User ID: </span>
          <span className="text-[#F7F7F7]">{currentUser?.id || 'None'}</span>
        </div>
        
        <div>
          <span className="text-[#94979C]">Current User Email: </span>
          <span className="text-[#F7F7F7]">{currentUser?.email || 'None'}</span>
        </div>
        
        {error && (
          <div className="text-red-400 bg-red-400/10 p-2 rounded">
            {error}
          </div>
        )}
        
        <div>
          <span className="text-[#94979C]">Profiles Found: </span>
          <span className="text-[#F7F7F7]">{profiles.length}</span>
        </div>
        
        {profiles.length > 0 && (
          <div className="mt-3">
            <div className="text-[#94979C] mb-2">Profile List:</div>
            {profiles.map((profile, index) => (
              <div key={profile.id} className="text-xs bg-[#0F1117] p-2 rounded mb-1">
                <div>#{index + 1}: {profile.email}</div>
                <div>Admin: {profile.is_admin ? 'Yes' : 'No'}, Superadmin: {profile.is_superadmin ? 'Yes' : 'No'}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};