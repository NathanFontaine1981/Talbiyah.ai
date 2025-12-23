import { useEffect, useState } from 'react';
import { Search, Filter, Shield, AlertTriangle, Users as UsersIcon, GraduationCap, User } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  roles: string[];
  created_at: string;
  avatar_url: string | null;
}

export default function UsersManagement() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'teacher' | 'student'>('all');
  const [stats, setStats] = useState({ totalUsers: 0, totalAdmins: 0, totalTeachers: 0, totalStudents: 0 });

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [searchQuery, roleFilter, users]);

  async function fetchUsers() {
    try {
      setLoading(true);

      // Fetch profiles with email
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email, roles, created_at, avatar_url')
        .order('created_at', { ascending: false });

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        throw profilesError;
      }

      const usersData = profilesData?.map(user => ({
        id: user.id,
        full_name: user.full_name || 'Unknown User',
        email: user.email || 'No email',
        roles: user.roles || ['student'],
        created_at: user.created_at || new Date().toISOString(),
        avatar_url: user.avatar_url,
      })) || [];

      setUsers(usersData);

      const admins = usersData.filter(u => u.roles.includes('admin')).length;
      const teachers = usersData.filter(u => u.roles.includes('teacher')).length;
      const students = usersData.filter(u => u.roles.includes('student')).length;

      setStats({
        totalUsers: usersData.length,
        totalAdmins: admins,
        totalTeachers: teachers,
        totalStudents: students,
      });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterUsers() {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered.filter(user =>
        user.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (roleFilter !== 'all') {
      filtered = filtered.filter(user => user.roles.includes(roleFilter));
    }

    setFilteredUsers(filtered);
  }

  async function toggleRole(userId: string, role: 'admin' | 'teacher' | 'student') {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const currentRoles = user.roles || [];
      let newRoles: string[];

      if (currentRoles.includes(role)) {
        newRoles = currentRoles.filter(r => r !== role);
        if (newRoles.length === 0) {
          newRoles = ['student'];
        }
      } else {
        newRoles = [...currentRoles, role];
      }

      const isAdmin = newRoles.includes('admin');

      const { error } = await supabase
        .from('profiles')
        .update({ roles: newRoles, is_admin: isAdmin })
        .eq('id', userId);

      if (error) throw error;

      await fetchUsers();
    } catch (error) {
      console.error('Error updating user role:', error);
      toast.error('Failed to update user role. Please try again.');
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Users Management</h2>
        <p className="text-gray-600 dark:text-gray-400">Manage platform users and their roles</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <UsersIcon className="w-6 h-6 text-emerald-600" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Users</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalUsers}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Shield className="w-6 h-6 text-amber-400" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Admins</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalAdmins}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <GraduationCap className="w-6 h-6 text-emerald-400" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Teachers</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalTeachers}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <User className="w-6 h-6 text-blue-400" />
            <p className="text-gray-600 dark:text-gray-400 text-sm">Total Students</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats.totalStudents}</p>
        </div>
      </div>

      <div className="bg-red-500/10 border-2 border-red-500/30 rounded-xl p-6 mb-8">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-red-400 font-bold text-lg mb-2">Admin Access Warning</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed mb-3">
              <strong>CRITICAL:</strong> Granting admin access provides unrestricted platform control, including user management, data modification, and system configuration. Only assign admin roles to trusted personnel.
            </p>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              <strong>Best Practice:</strong> Use the principle of least privilege. Grant only the minimum permissions necessary for each user's responsibilities. Regularly audit admin access and revoke when no longer needed.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as 'all' | 'admin' | 'teacher' | 'student')}
              className="px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="teacher">Teacher</option>
              <option value="student">Student</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Email</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Join Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Roles</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-blue-500 flex items-center justify-center">
                        {user.avatar_url ? (
                          <img src={user.avatar_url} alt={user.full_name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                          <User className="w-5 h-5 text-white" />
                        )}
                      </div>
                      <p className="text-gray-900 dark:text-white font-medium">{user.full_name}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm">{new Date(user.created_at).toLocaleDateString()}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-2">
                      {user.roles.map(role => (
                        <span
                          key={role}
                          className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            role === 'admin' ? 'bg-amber-500/20 text-amber-400' :
                            role === 'teacher' ? 'bg-emerald-500/20 text-emerald-400' :
                            'bg-blue-500/20 text-blue-400'
                          }`}
                        >
                          {role}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleRole(user.id, 'admin')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          user.roles.includes('admin')
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }`}
                      >
                        Admin
                      </button>
                      <button
                        onClick={() => toggleRole(user.id, 'teacher')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          user.roles.includes('teacher')
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }`}
                      >
                        Teacher
                      </button>
                      <button
                        onClick={() => toggleRole(user.id, 'student')}
                        className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                          user.roles.includes('student')
                            ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                            : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-500'
                        }`}
                      >
                        Student
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredUsers.length === 0 && (
          <div className="text-center py-12">
            <UsersIcon className="w-12 h-12 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">No users found</p>
          </div>
        )}
      </div>
    </div>
  );
}
