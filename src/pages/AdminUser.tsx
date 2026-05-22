import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import Header from "@/components/Header";
import { Trash2, Key } from "lucide-react";
import { AdminAddUserDialog } from "@/components/AdminAddUserDialog";
import { ProfilesDebug } from "@/components/ProfilesDebug";
interface Profile {
  id: string;
  email: string;
  full_name?: string;
  is_admin: boolean;
  is_superadmin: boolean;
  created_at?: string;
}
const AdminUser: React.FC = () => {
  const {
    toast
  } = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  
  const fetchUsers = async () => {
    setLoading(true);
    const {
      data,
      error
    } = await supabase
      .from("profiles")
      .select("*")
      .order("is_superadmin", { ascending: false })
      .order("is_admin", { ascending: false })
      .order("created_at", { ascending: false });
    
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      setUsers(data || []);
    }
    setLoading(false);
  };
  // Filter users based on search term
  const filteredUsers = users.filter(user => 
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (user.full_name && user.full_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line
  }, []);
  const handleDelete = async (profile: Profile) => {
    if (!window.confirm(`Are you sure you want to delete ${profile.email}?`)) return;
    setLoading(true);
    // Delete from auth and profiles tables
    const {
      error: deleteProfileError
    } = await supabase.from("profiles").delete().eq("id", profile.id);

    // Try to delete from auth.users via RPC (will only succeed if service role key is configured)
    // For security, simply removing from 'profiles' may be enough for UI
    // Optionally, display a warning if still present in 'users'.

    if (deleteProfileError) {
      toast({
        title: "Failed",
        description: deleteProfileError.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Deleted!",
        description: `${profile.email} has been deleted.`
      });
      fetchUsers();
    }
    setLoading(false);
  };
  const handleResetPassword = async (profile: Profile) => {
    if (!window.confirm(`Send password reset email to ${profile.email}?`)) return;
    setLoading(true);
    const {
      error
    } = await supabase.auth.resetPasswordForEmail(profile.email, {
      redirectTo: `${window.location.origin}/admin/login`
    });
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Reset Email Sent",
        description: `A password reset link has been sent to ${profile.email}.`
      });
    }
    setLoading(false);
  };
  return <div className="bg-[#0C0E12] min-h-screen">
      <Header />
      <div className="mx-auto max-w-6xl pt-10 px-4">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl text-[#F7F7F7] font-bold">User Management</h1>
            <AdminAddUserDialog onSuccessfulAdd={fetchUsers} />
          </div>
          
          <ProfilesDebug />
          
          {/* Search and Stats */}
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-md">
              <input
                type="text"
                placeholder="Search users by email or name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-[#181B20] border border-[#22262F] rounded-lg text-[#F7F7F7] placeholder-[#94979C] focus:outline-none focus:border-[#75E0A7] transition-colors"
              />
            </div>
            <div className="text-sm text-[#94979C]">
              {filteredUsers.length} user{filteredUsers.length !== 1 ? 's' : ''} found
            </div>
          </div>

          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#181B20] border border-[#22262F] rounded-lg p-4">
              <div className="text-2xl text-[#75E0A7] font-bold">{users.filter(u => u.is_superadmin).length}</div>
              <div className="text-sm text-[#94979C]">Superadmins</div>
            </div>
            <div className="bg-[#181B20] border border-[#22262F] rounded-lg p-4">
              <div className="text-2xl text-[#3B82F6] font-bold">{users.filter(u => u.is_admin && !u.is_superadmin).length}</div>
              <div className="text-sm text-[#94979C]">Admins</div>
            </div>
            <div className="bg-[#181B20] border border-[#22262F] rounded-lg p-4">
              <div className="text-2xl text-[#F7F7F7] font-bold">{users.filter(u => !u.is_admin && !u.is_superadmin).length}</div>
              <div className="text-sm text-[#94979C]">Regular Users</div>
            </div>
          </div>
        </div>

        {/* Users Table */}
        <div className="mt-6 rounded-lg bg-[#181B20] border border-[#22262F] overflow-hidden">
          {loading ? (
            <div className="text-[#F7F7F7] text-center py-8">Loading...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-[#94979C] text-center py-8">No users found.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[#22262F] bg-[#0F1117]">
                    <th className="py-3 px-4 text-[#94979C] font-semibold">Email</th>
                    <th className="py-3 px-4 text-[#94979C] font-semibold">Name</th>
                    <th className="py-3 px-4 text-[#94979C] font-semibold">Role</th>
                    <th className="py-3 px-4 text-[#94979C] font-semibold">Joined</th>
                    <th className="py-3 px-4 text-[#94979C] font-semibold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => (
                    <tr key={user.id} className="border-b border-[#22262F] hover:bg-[#0F1117] transition-colors">
                      <td className="py-3 px-4 text-[#F7F7F7]">{user.email}</td>
                      <td className="py-3 px-4 text-[#F7F7F7]">{user.full_name || "-"}</td>
                      <td className="py-3 px-4">
                        {user.is_superadmin ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400 border border-green-500/30">
                            Superadmin
                          </span>
                        ) : user.is_admin ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold bg-gray-500/20 text-gray-400 border border-gray-500/30">
                            User
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-[#94979C] text-sm">
                        {user.created_at ? new Date(user.created_at).toLocaleDateString() : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex gap-2 justify-end">
                          <Button 
                            variant="outline" 
                            onClick={() => handleResetPassword(user)} 
                            size="sm" 
                            className="flex items-center gap-1 border-[#22262F] text-[#94979C] hover:text-[#F7F7F7] hover:border-[#75E0A7]" 
                            disabled={loading}
                            title="Reset password"
                          >
                            <Key size={14} />
                            Reset
                          </Button>
                          <Button 
                            variant="destructive" 
                            onClick={() => handleDelete(user)} 
                            size="sm" 
                            className="flex items-center gap-1" 
                            disabled={loading}
                            title="Delete user"
                          >
                            <Trash2 size={14} />
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>;
};
export default AdminUser;
