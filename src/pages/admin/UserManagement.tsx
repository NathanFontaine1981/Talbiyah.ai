import { useEffect, useState } from 'react';
import { Search, Plus, RefreshCw, ChevronDown, Eye, Edit, Key, Ban, Trash2, Mail, UserCheck, X, Users, GraduationCap, Heart, Shield, RotateCcw, AlertTriangle, UserPlus, FileText, ToggleLeft, ToggleRight, Star, Crown } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import UserProfileModal from '../../components/admin/UserProfileModal';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  roles: string[];
  created_at: string;
  last_sign_in_at?: string;
  deleted_at?: string;
  hard_delete_at?: string;
  deletion_reason?: string;
  is_legacy_student?: boolean;
  teacher_profile?: {
    id: string;
    status: string;
    is_legacy_teacher?: boolean;
  };
}

interface LegacyTeacherAssignment {
  id: string;
  teacher_id: string;
  teacher_name: string;
}

interface AvailableTeacher {
  id: string;
  user_id: string;
  full_name: string;
  is_legacy_teacher: boolean;
}

interface UserStats {
  total: number;
  students: number;
  teachers: number;
  parents: number;
  admins: number;
  legacyStudents: number;
  legacyTeachers: number;
}

type RoleFilter = 'all' | 'student' | 'teacher' | 'parent' | 'admin';
type StatusFilter = 'all' | 'active' | 'inactive' | 'pending';
type TierFilter = 'all' | 'legacy' | 'standard';
type SortOption = 'newest' | 'oldest' | 'name';

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    students: 0,
    teachers: 0,
    parents: 0,
    admins: 0,
    legacyStudents: 0,
    legacyTeachers: 0,
  });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('all');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [tierFilter, setTierFilter] = useState<TierFilter>('all');
  const [sortOption, setSortOption] = useState<SortOption>('newest');

  // Modals
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showEditUser, setShowEditUser] = useState(false);
  const [showUserDetails, setShowUserDetails] = useState(false);

  // Bulk actions
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);

  // Legacy student management
  const [showLegacyAssignment, setShowLegacyAssignment] = useState(false);
  const [legacyAssignmentUser, setLegacyAssignmentUser] = useState<User | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, roleFilter, statusFilter, tierFilter, sortOption, users]);

  async function fetchUsers() {
    try {
      setLoading(true);

      // Use admin function to get users with auth emails
      const { data, error } = await supabase.rpc('get_admin_users_list');

      if (error) throw error;

      // Transform data to match expected User interface
      const transformedData = (data || []).map((u: any) => ({
        id: u.id,
        full_name: u.full_name,
        email: u.email,
        phone: u.phone || u.phone_number, // Use phone_number as fallback
        roles: u.roles || [],
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        deleted_at: u.deleted_at,
        hard_delete_at: u.hard_delete_at,
        deletion_reason: u.deletion_reason,
        is_legacy_student: u.is_legacy_student,
        teacher_profile: u.teacher_profile_id ? {
          id: u.teacher_profile_id,
          status: u.teacher_status,
          is_legacy_teacher: u.is_legacy_teacher,
        } : null,
      }));

      setUsers(transformedData);

      // Calculate stats from transformed data
      const total = transformedData.length;
      const students = transformedData.filter((u: User) => u.roles?.includes('student')).length;
      const teachers = transformedData.filter((u: User) => u.roles?.includes('teacher')).length;
      const parents = transformedData.filter((u: User) => u.roles?.includes('parent')).length;
      const admins = transformedData.filter((u: User) => u.roles?.includes('admin')).length;
      const legacyStudents = transformedData.filter((u: User) => u.is_legacy_student).length;
      const legacyTeachers = transformedData.filter((u: User) => u.teacher_profile?.is_legacy_teacher).length;

      setStats({ total, students, teachers, parents, admins, legacyStudents, legacyTeachers });
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchUsers();
    setRefreshing(false);
  }

  function applyFilters() {
    let filtered = [...users];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(user =>
        user.full_name?.toLowerCase().includes(query) ||
        user.email?.toLowerCase().includes(query) ||
        user.phone?.toLowerCase().includes(query)
      );
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(user =>
        user.roles && Array.isArray(user.roles) && user.roles.includes(roleFilter)
      );
    }

    // Status filter
    if (statusFilter === 'active') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(user =>
        user.last_sign_in_at && new Date(user.last_sign_in_at) > thirtyDaysAgo
      );
    } else if (statusFilter === 'inactive') {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      filtered = filtered.filter(user =>
        !user.last_sign_in_at || new Date(user.last_sign_in_at) <= thirtyDaysAgo
      );
    } else if (statusFilter === 'pending') {
      filtered = filtered.filter(user =>
        user.teacher_profile && (user.teacher_profile as any).status === 'pending'
      );
    }

    // Tier filter
    if (tierFilter === 'legacy') {
      filtered = filtered.filter(user =>
        user.is_legacy_student || user.teacher_profile?.is_legacy_teacher
      );
    } else if (tierFilter === 'standard') {
      filtered = filtered.filter(user =>
        !user.is_legacy_student && !user.teacher_profile?.is_legacy_teacher
      );
    }

    // Sort
    if (sortOption === 'newest') {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortOption === 'oldest') {
      filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortOption === 'name') {
      filtered.sort((a, b) => (a.full_name || '').localeCompare(b.full_name || ''));
    }

    setFilteredUsers(filtered);
  }

  async function handleRoleChange(userId: string, newRoles: string[]) {
    try {
      const user = users.find(u => u.id === userId);
      if (!user) return;

      const oldRoles = user.roles || [];

      // Update roles in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ roles: newRoles })
        .eq('id', userId);

      if (profileError) throw profileError;

      // If adding teacher role and no teacher profile exists
      if (newRoles.includes('teacher') && !oldRoles.includes('teacher')) {
        const { error: teacherError } = await supabase
          .from('teacher_profiles')
          .upsert([{
            user_id: userId,
            status: 'approved',
            bio: '',
            specializations: [],
          }]);

        if (teacherError) throw teacherError;
      }

      // Refresh users
      await fetchUsers();

      // Show success message
      toast.success(`Roles updated successfully for ${user.full_name}`);
    } catch (error) {
      console.error('Error updating roles:', error);
      toast.error('Failed to update roles. Please try again.');
    }
  }

  function handleViewUser(user: User) {
    setSelectedUser(user);
    setShowUserDetails(true);
  }

  function handleEditUser(user: User) {
    setSelectedUser(user);
    setShowEditUser(true);
  }

  async function handleResetPassword(user: User) {
    if (!confirm(`Send password reset email to ${user.email}?`)) return;

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email);
      if (error) throw error;
      toast.success(`Password reset email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending reset email:', error);
      toast.error('Failed to send password reset email');
    }
  }

  async function handleSoftDeleteUser(user: User) {
    const reason = prompt(`Enter reason for deleting ${user.full_name} (optional):`);

    if (!confirm(`Are you sure you want to delete ${user.full_name}?\n\nThe account will be suspended and scheduled for permanent deletion in 1 year. You can restore it before then.`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('soft-delete-user', {
        body: { user_id: user.id, reason: reason || undefined }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await fetchUsers();
      toast.success(`User ${user.full_name} has been deleted. Scheduled for permanent removal in 1 year.`);
    } catch (error: any) {
      console.error('Error soft-deleting user:', error);
      toast.error(error.message || 'Failed to delete user. Please try again.');
    }
  }

  async function handleHardDeleteUser(user: User) {
    const confirmText = prompt(
      `⚠️ PERMANENT DELETION ⚠️\n\nThis will permanently delete ${user.full_name} and ALL their data.\nThis action CANNOT be undone.\n\nType "PERMANENTLY DELETE" to confirm:`
    );

    if (confirmText !== 'PERMANENTLY DELETE') {
      toast.error('Deletion cancelled - confirmation text did not match');
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke('hard-delete-user', {
        body: { user_id: user.id, confirm: 'PERMANENTLY_DELETE' }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await fetchUsers();
      toast.success(`User ${user.full_name} has been permanently deleted`);
    } catch (error: any) {
      console.error('Error hard-deleting user:', error);
      toast.error(error.message || 'Failed to delete user. Please try again.');
    }
  }

  async function handleRestoreUser(user: User) {
    if (!confirm(`Are you sure you want to restore ${user.full_name}?`)) return;

    try {
      const { data, error } = await supabase.functions.invoke('restore-user', {
        body: { user_id: user.id }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      await fetchUsers();
      toast.success(`User ${user.full_name} has been restored`);
    } catch (error: any) {
      console.error('Error restoring user:', error);
      toast.error(error.message || 'Failed to restore user. Please try again.');
    }
  }

  async function handleSendEmail(user: User) {
    const subject = prompt('Enter email subject:');
    if (!subject) return;

    const body = prompt('Enter email message:');
    if (!body) return;

    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'admin_notification',
          recipient_email: user.email,
          recipient_name: user.full_name || 'User',
          data: {
            subject,
            message: body,
          }
        }
      });

      if (error) throw error;
      toast.success(`Email sent to ${user.email}`);
    } catch (error) {
      console.error('Error sending email:', error);
      toast.error('Failed to send email. Please try again.');
    }
  }

  async function handleSuspendUser(user: User) {
    const isSuspended = user.roles?.includes('suspended');
    const action = isSuspended ? 'unsuspend' : 'suspend';

    if (!confirm(`Are you sure you want to ${action} ${user.full_name}?`)) return;

    try {
      let newRoles: string[];
      if (isSuspended) {
        newRoles = (user.roles || []).filter(r => r !== 'suspended');
      } else {
        newRoles = [...(user.roles || []), 'suspended'];
      }

      const { error } = await supabase
        .from('profiles')
        .update({ roles: newRoles })
        .eq('id', user.id);

      if (error) throw error;

      await fetchUsers();
      toast.success(`User ${user.full_name} has been ${action}ed`);
    } catch (error) {
      console.error(`Error ${action}ing user:`, error);
      toast.error(`Failed to ${action} user. Please try again.`);
    }
  }

  async function handleToggleLegacyStudent(user: User) {
    const newStatus = !user.is_legacy_student;
    const action = newStatus ? 'mark as legacy' : 'remove legacy status from';

    if (!confirm(`Are you sure you want to ${action} ${user.full_name}?\n\n${newStatus ? 'Legacy students pay via monthly invoice instead of upfront payment.' : 'This student will need to pay upfront like regular students.'}`)) return;

    try {
      console.log('Updating legacy status for:', user.id, 'to:', newStatus);

      const { error, count } = await supabase
        .from('profiles')
        .update({ is_legacy_student: newStatus })
        .eq('id', user.id);

      if (error) throw error;

      console.log('Update completed, rows affected:', count);

      // Verify the update worked by fetching the user
      const { data: verifyData } = await supabase
        .from('profiles')
        .select('is_legacy_student')
        .eq('id', user.id)
        .single();

      console.log('Verified is_legacy_student:', verifyData?.is_legacy_student);

      if (verifyData?.is_legacy_student !== newStatus) {
        throw new Error('Update did not persist - check RLS policies in Supabase');
      }

      await fetchUsers();
      toast.success(`${user.full_name} is now ${newStatus ? 'a legacy student' : 'a regular student'}`);
    } catch (error: any) {
      console.error('Error toggling legacy status:', error);
      toast.error(error.message || 'Failed to update legacy status. Check RLS policies.');
    }
  }

  async function handleToggleLegacyTeacher(user: User) {
    if (!user.teacher_profile) return;

    const newStatus = !user.teacher_profile.is_legacy_teacher;
    const action = newStatus ? 'mark as legacy teacher' : 'remove legacy teacher status from';

    if (!confirm(`Are you sure you want to ${action} ${user.full_name}?\n\n${newStatus ? 'Legacy teachers have grandfathered rates and billing terms.' : 'This teacher will use standard rates and billing.'}`)) return;

    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ is_legacy_teacher: newStatus })
        .eq('user_id', user.id);

      if (error) throw error;

      await fetchUsers();
      toast.success(`${user.full_name} is now ${newStatus ? 'a legacy teacher' : 'a standard teacher'}`);
    } catch (error) {
      console.error('Error toggling legacy teacher status:', error);
      toast.error('Failed to update legacy teacher status. Please try again.');
    }
  }

  function handleManageLegacyTeachers(user: User) {
    setLegacyAssignmentUser(user);
    setShowLegacyAssignment(true);
  }

  function handleExportUsers() {
    const usersToExport = selectedUserIds.length > 0
      ? users.filter(u => selectedUserIds.includes(u.id))
      : filteredUsers;

    const csvContent = [
      ['ID', 'Name', 'Email', 'Phone', 'Roles', 'Joined', 'Last Sign In'].join(','),
      ...usersToExport.map(u => [
        u.id,
        `"${u.full_name || ''}"`,
        u.email,
        u.phone || '',
        `"${(u.roles || []).join(', ')}"`,
        format(new Date(u.created_at), 'yyyy-MM-dd'),
        u.last_sign_in_at ? format(new Date(u.last_sign_in_at), 'yyyy-MM-dd') : '',
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success(`Exported ${usersToExport.length} users`);
  }

  async function handleBulkSendEmail() {
    if (selectedUserIds.length === 0) {
      toast.warning('Please select at least one user');
      return;
    }

    const subject = prompt('Enter email subject:');
    if (!subject) return;

    const body = prompt('Enter email message:');
    if (!body) return;

    const selectedUsers = users.filter(u => selectedUserIds.includes(u.id));

    try {
      let successCount = 0;
      let failCount = 0;

      for (const user of selectedUsers) {
        try {
          await supabase.functions.invoke('send-notification-email', {
            body: {
              type: 'admin_notification',
              recipient_email: user.email,
              recipient_name: user.full_name || 'User',
              data: {
                subject,
                message: body,
              }
            }
          });
          successCount++;
        } catch {
          failCount++;
        }
      }

      toast.success(`Emails sent: ${successCount} successful, ${failCount} failed`);
    } catch (error) {
      console.error('Error sending bulk emails:', error);
      toast.error('Failed to send emails. Please try again.');
    }
  }

  async function handleClearAllExceptAdmin() {
    const confirmText = 'DELETE ALL USERS';
    const userConfirm = prompt(
      `⚠️ DANGER: This will delete ALL users except admins!\n\n` +
      `This will delete:\n` +
      `- All student accounts\n` +
      `- All teacher accounts\n` +
      `- All parent accounts\n` +
      `- All lessons and bookings\n` +
      `- All related data\n\n` +
      `Type "${confirmText}" to confirm:`
    );

    if (userConfirm !== confirmText) {
      toast.info('Action cancelled');
      return;
    }

    try {
      setLoading(true);

      // Get all non-admin user IDs
      const nonAdminUsers = users.filter(u => !u.roles?.includes('admin'));

      if (nonAdminUsers.length === 0) {
        toast.info('No non-admin users to delete');
        return;
      }

      // Delete all related data for non-admin users
      const nonAdminIds = nonAdminUsers.map(u => u.id);

      // Get all learner IDs for these users
      const { data: learnersData } = await supabase
        .from('learners')
        .select('id')
        .in('parent_id', nonAdminIds);

      const learnerIds = learnersData?.map(l => l.id) || [];

      // Delete in order to respect foreign key constraints
      if (learnerIds.length > 0) {
        await supabase.from('lessons').delete().in('learner_id', learnerIds);
        await supabase.from('student_teacher_relationships').delete().in('student_id', learnerIds);
      }

      await supabase.from('teacher_availability').delete().in('teacher_id', nonAdminIds);
      await supabase.from('teacher_profiles').delete().in('user_id', nonAdminIds);

      await supabase.from('pending_bookings').delete().in('user_id', nonAdminIds);
      await supabase.from('credit_transactions').delete().in('user_id', nonAdminIds);
      await supabase.from('credit_purchases').delete().in('user_id', nonAdminIds);
      await supabase.from('user_credits').delete().in('user_id', nonAdminIds);

      if (learnerIds.length > 0) {
        await supabase.from('learners').delete().in('id', learnerIds);
      }
      // Delete both as parent and as child
      const { error: parentChildError1 } = await supabase
        .from('parent_children')
        .delete()
        .in('parent_id', nonAdminIds);

      const { error: parentChildError2 } = await supabase
        .from('parent_children')
        .delete()
        .in('child_id', nonAdminIds);

      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .in('id', nonAdminIds);

      if (profileError) {
        console.error('Profile deletion error:', profileError);
        throw profileError;
      }

      await fetchUsers();
      toast.success(`Successfully deleted ${nonAdminUsers.length} users! Note: You still need to delete these users from Supabase Authentication.`);
    } catch (error) {
      console.error('Error clearing users:', error);
      toast.error('Failed to clear users. Please check console for details.');
    } finally {
      setLoading(false);
    }
  }

  function toggleUserSelection(userId: string) {
    setSelectedUserIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(userId)) {
        newSet.delete(userId);
      } else {
        newSet.add(userId);
      }
      return Array.from(newSet);
    });
  }

  function selectAllUsers() {
    if (selectedUserIds.length === filteredUsers.length) {
      setSelectedUserIds([]);
    } else {
      setSelectedUserIds(filteredUsers.map(u => u.id));
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
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">User Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage users and their roles</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button
            onClick={handleClearAllExceptAdmin}
            className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg transition flex items-center space-x-2"
          >
            <Trash2 className="w-4 h-4" />
            <span>Clear All Users</span>
          </button>
          <button
            onClick={() => setShowCreateUser(true)}
            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create User</span>
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 mb-4">
        <StatCard icon={Users} label="Total Users" value={stats.total} color="blue" />
        <StatCard icon={Users} label="Students" value={stats.students} color="cyan" />
        <StatCard icon={GraduationCap} label="Teachers" value={stats.teachers} color="emerald" />
        <StatCard icon={Heart} label="Parents" value={stats.parents} color="pink" />
        <StatCard icon={Shield} label="Admins" value={stats.admins} color="purple" />
        <StatCard icon={FileText} label="Legacy Students" value={stats.legacyStudents} color="amber" />
        <StatCard icon={FileText} label="Legacy Teachers" value={stats.legacyTeachers} color="orange" />
      </div>

      {/* Legacy Quick Actions */}
      {(stats.legacyStudents > 0 || stats.legacyTeachers > 0) && (
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center space-x-3">
              <FileText className="w-6 h-6 text-amber-400" />
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">Legacy Users</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {stats.legacyStudents} legacy student{stats.legacyStudents !== 1 ? 's' : ''}, {stats.legacyTeachers} legacy teacher{stats.legacyTeachers !== 1 ? 's' : ''} (billed monthly at £12/hour)
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setTierFilter('legacy');
                  setRoleFilter('all');
                }}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition flex items-center space-x-2 ${
                  tierFilter === 'legacy'
                    ? 'bg-amber-500 text-white'
                    : 'bg-amber-500/20 text-amber-600 dark:text-amber-400 hover:bg-amber-500/30'
                }`}
              >
                <Users className="w-4 h-4" />
                <span>View All Legacy Users</span>
              </button>
              {tierFilter === 'legacy' && (
                <button
                  onClick={() => setTierFilter('all')}
                  className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium transition"
                >
                  Clear Filter
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name, email, or phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Filter by Role</label>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value as RoleFilter)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Users</option>
              <option value="student">Students</option>
              <option value="teacher">Teachers</option>
              <option value="parent">Parents</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="pending">Pending Approval</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Filter by Tier</label>
            <select
              value={tierFilter}
              onChange={(e) => setTierFilter(e.target.value as TierFilter)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Tiers</option>
              <option value="legacy">Legacy Only</option>
              <option value="standard">Standard Only</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Sort by</label>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
              <option value="name">Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUserIds.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-4 flex items-center justify-between">
          <p className="text-emerald-600">
            {selectedUserIds.length} user{selectedUserIds.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleExportUsers}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 rounded-lg text-sm transition"
            >
              Export
            </button>
            <button
              onClick={handleBulkSendEmail}
              className="px-3 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 rounded-lg text-sm transition"
            >
              Send Email
            </button>
            <button
              onClick={() => setSelectedUserIds([])}
              className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm transition"
            >
              Clear Selection
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 text-gray-600 dark:text-gray-400">
        Showing {filteredUsers.length} of {users.length} users
      </div>

      {/* User Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={selectAllUsers}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Name</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Email</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Phone</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Role(s)</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">
                  <div className="flex items-center space-x-1">
                    <span>Tier</span>
                    <span className="text-amber-400">★</span>
                  </div>
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Joined</th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-600 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <UserRow
                    key={user.id}
                    user={user}
                    isSelected={selectedUserIds.includes(user.id)}
                    onToggleSelect={() => toggleUserSelection(user.id)}
                    onRoleChange={handleRoleChange}
                    onView={() => handleViewUser(user)}
                    onEdit={() => handleEditUser(user)}
                    onResetPassword={() => handleResetPassword(user)}
                    onSoftDelete={() => handleSoftDeleteUser(user)}
                    onHardDelete={() => handleHardDeleteUser(user)}
                    onRestore={() => handleRestoreUser(user)}
                    onSendEmail={() => handleSendEmail(user)}
                    onSuspend={() => handleSuspendUser(user)}
                    onToggleLegacy={() => handleToggleLegacyStudent(user)}
                    onToggleLegacyTeacher={() => handleToggleLegacyTeacher(user)}
                    onManageLegacyTeachers={() => handleManageLegacyTeachers(user)}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      {showCreateUser && (
        <CreateUserModal
          onClose={() => setShowCreateUser(false)}
          onSuccess={fetchUsers}
        />
      )}
      {showEditUser && selectedUser && (
        <EditUserModal
          user={selectedUser}
          onClose={() => {
            setShowEditUser(false);
            setSelectedUser(null);
          }}
          onSuccess={fetchUsers}
        />
      )}
      {showUserDetails && selectedUser && (
        <UserProfileModal
          userId={selectedUser.id}
          onClose={() => {
            setShowUserDetails(false);
            setSelectedUser(null);
          }}
        />
      )}
      {showLegacyAssignment && legacyAssignmentUser && (
        <LegacyTeacherAssignmentModal
          user={legacyAssignmentUser}
          onClose={() => {
            setShowLegacyAssignment(false);
            setLegacyAssignmentUser(null);
          }}
          onSuccess={fetchUsers}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, color }: any) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    cyan: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    pink: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
    orange: 'bg-orange-500/10 border-orange-500/20 text-orange-400',
  };

  return (
    <div className={`${colors[color as keyof typeof colors]} border rounded-xl p-4`}>
      <div className="flex items-center justify-between mb-2">
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// User Row Component
function UserRow({ user, isSelected, onToggleSelect, onRoleChange, onView, onEdit, onResetPassword, onSoftDelete, onHardDelete, onRestore, onSendEmail, onSuspend, onToggleLegacy, onToggleLegacyTeacher, onManageLegacyTeachers }: any) {
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showActionsDropdown, setShowActionsDropdown] = useState(false);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user.roles || []);

  const roleOptions = [
    { value: 'student', label: 'Student', icon: Users },
    { value: 'teacher', label: 'Teacher', icon: GraduationCap },
    { value: 'parent', label: 'Parent', icon: Heart },
    { value: 'admin', label: 'Admin', icon: Shield },
  ];

  function toggleRole(role: string) {
    const newRoles = selectedRoles.includes(role)
      ? selectedRoles.filter(r => r !== role)
      : [...selectedRoles, role];
    setSelectedRoles(newRoles);
  }

  function saveRoles() {
    onRoleChange(user.id, selectedRoles);
    setShowRoleDropdown(false);
  }

  function getRoleBadgeColor(role: string) {
    const colors = {
      student: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
      teacher: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      parent: 'bg-pink-500/10 border-pink-500/20 text-pink-400',
      admin: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-500/10 border-gray-300/20 text-gray-500';
  }

  const isDeleted = !!user.deleted_at;
  const isLegacy = user.is_legacy_student || user.teacher_profile?.is_legacy_teacher;
  const isLegacyStudent = user.is_legacy_student;
  const isLegacyTeacher = user.teacher_profile?.is_legacy_teacher;

  // Determine tier styling
  const getTierInfo = () => {
    if (isLegacyStudent && isLegacyTeacher) {
      return {
        label: 'Legacy',
        sublabel: 'Student & Teacher',
        icon: Crown,
        bgClass: 'bg-gradient-to-r from-amber-500/20 to-purple-500/20',
        borderClass: 'border-amber-400',
        textClass: 'text-amber-500',
        iconClass: 'text-amber-400',
      };
    }
    if (isLegacyStudent) {
      return {
        label: 'Legacy',
        sublabel: 'Student',
        icon: Star,
        bgClass: 'bg-amber-500/15',
        borderClass: 'border-amber-400',
        textClass: 'text-amber-500',
        iconClass: 'text-amber-400',
      };
    }
    if (isLegacyTeacher) {
      return {
        label: 'Legacy',
        sublabel: 'Teacher',
        icon: Crown,
        bgClass: 'bg-purple-500/15',
        borderClass: 'border-purple-400',
        textClass: 'text-purple-500',
        iconClass: 'text-purple-400',
      };
    }
    return {
      label: 'Standard',
      sublabel: null,
      icon: null,
      bgClass: '',
      borderClass: '',
      textClass: 'text-gray-400',
      iconClass: '',
    };
  };

  const tierInfo = getTierInfo();

  // Row classes with premium highlighting for legacy users
  const rowClasses = [
    'transition relative',
    isDeleted ? 'opacity-60 bg-red-500/5' : '',
    isLegacy && !isDeleted ? 'bg-amber-500/[0.03] dark:bg-amber-500/[0.05]' : '',
    'hover:bg-gray-50 dark:hover:bg-gray-700/50',
  ].filter(Boolean).join(' ');

  return (
    <tr className={rowClasses}>
      {/* Gold left border for legacy users */}
      {isLegacy && !isDeleted && (
        <td className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-400 to-amber-500"></td>
      )}
      <td className={`px-4 py-4 ${isLegacy ? 'pl-5' : ''}`}>
        <input
          type="checkbox"
          checked={isSelected}
          onChange={onToggleSelect}
          className="w-4 h-4 rounded border-gray-300 bg-gray-100 text-emerald-500 focus:ring-emerald-500"
        />
      </td>
      <td className="px-4 py-4">
        <div className="flex items-center space-x-2">
          {/* Legacy star icon next to name */}
          {isLegacy && !isDeleted && (
            <Star className="w-4 h-4 text-amber-400 fill-amber-400 flex-shrink-0" />
          )}
          <p className={`font-medium ${isDeleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
            {user.full_name || 'Unnamed User'}
          </p>
          {isDeleted && (
            <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-xs flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3" />
              <span>Deleted</span>
            </span>
          )}
        </div>
        {isDeleted && user.hard_delete_at && (
          <p className="text-xs text-red-400 mt-1">
            Permanent deletion: {format(new Date(user.hard_delete_at), 'MMM d, yyyy')}
          </p>
        )}
      </td>
      <td className="px-4 py-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm">{user.email}</p>
      </td>
      <td className="px-4 py-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm">{user.phone || '-'}</p>
      </td>
      <td className="px-4 py-4">
        <div className="relative">
          <button
            onClick={() => setShowRoleDropdown(!showRoleDropdown)}
            className="flex items-center space-x-1 px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm transition"
          >
            <div className="flex flex-wrap gap-1">
              {(user.roles || []).map((role: string) => (
                <span key={role} className={`px-2 py-0.5 ${getRoleBadgeColor(role)} border rounded text-xs capitalize`}>
                  {role}
                </span>
              ))}
              {(!user.roles || user.roles.length === 0) && (
                <span className="text-gray-500 dark:text-gray-400 text-xs">No roles</span>
              )}
            </div>
            <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
          </button>

          {showRoleDropdown && (
            <div className="absolute top-full left-0 mt-2 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
              <div className="p-3">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Select roles (can be multiple):</p>
                <div className="space-y-2 mb-3">
                  {roleOptions.map((option) => (
                    <label key={option.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
                      <input
                        type="checkbox"
                        checked={selectedRoles.includes(option.value)}
                        onChange={() => toggleRole(option.value)}
                        className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-emerald-500 focus:ring-emerald-500"
                      />
                      <option.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                      <span className="text-gray-900 dark:text-white text-sm">{option.label}</span>
                    </label>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setSelectedRoles(user.roles || []);
                      setShowRoleDropdown(false);
                    }}
                    className="flex-1 px-3 py-1.5 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-sm transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveRoles}
                    className="flex-1 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-sm transition"
                  >
                    Save
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </td>
      {/* NEW: Tier Column */}
      <td className="px-4 py-4">
        {isLegacy ? (
          <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${tierInfo.bgClass} ${tierInfo.borderClass}`}>
            {tierInfo.icon && <tierInfo.icon className={`w-4 h-4 ${tierInfo.iconClass} ${isLegacyStudent ? 'fill-current' : ''}`} />}
            <div className="flex flex-col">
              <span className={`text-sm font-semibold ${tierInfo.textClass}`}>{tierInfo.label}</span>
              {tierInfo.sublabel && (
                <span className="text-[10px] text-gray-500 dark:text-gray-400 -mt-0.5">{tierInfo.sublabel}</span>
              )}
            </div>
          </div>
        ) : (
          <span className="text-sm text-gray-400 dark:text-gray-500">Standard</span>
        )}
      </td>
      <td className="px-4 py-4">
        <p className="text-gray-600 dark:text-gray-400 text-sm">
          {format(new Date(user.created_at), 'MMM d, yyyy')}
        </p>
      </td>
      <td className="px-4 py-4">
        <div className="relative">
          <button
            onClick={() => setShowActionsDropdown(!showActionsDropdown)}
            className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-700 dark:text-gray-300 transition flex items-center space-x-1"
          >
            <span>Actions</span>
            <ChevronDown className="w-4 h-4" />
          </button>

          {showActionsDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl z-50">
              <div className="py-1">
                <button
                  onClick={() => {
                    onView();
                    setShowActionsDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Profile</span>
                </button>
                <button
                  onClick={() => {
                    onEdit();
                    setShowActionsDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit User</span>
                </button>
                <button
                  onClick={() => {
                    onResetPassword();
                    setShowActionsDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Key className="w-4 h-4" />
                  <span>Reset Password</span>
                </button>
                <button
                  onClick={() => {
                    onSendEmail();
                    setShowActionsDropdown(false);
                  }}
                  className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Send Email</span>
                </button>
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    onToggleLegacy();
                    setShowActionsDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 ${
                    user.is_legacy_student ? 'text-amber-500 dark:text-amber-400' : 'text-blue-500 dark:text-blue-400'
                  }`}
                >
                  {user.is_legacy_student ? (
                    <>
                      <ToggleRight className="w-4 h-4" />
                      <span>Remove Legacy Status</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-4 h-4" />
                      <span>Mark as Legacy Student</span>
                    </>
                  )}
                </button>
                {user.is_legacy_student && (
                  <button
                    onClick={() => {
                      onManageLegacyTeachers();
                      setShowActionsDropdown(false);
                    }}
                    className="w-full px-4 py-2 text-left text-sm text-emerald-500 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Assign Legacy Teachers</span>
                  </button>
                )}
                {user.teacher_profile && (
                  <button
                    onClick={() => {
                      onToggleLegacyTeacher();
                      setShowActionsDropdown(false);
                    }}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 ${
                      user.teacher_profile?.is_legacy_teacher ? 'text-purple-500 dark:text-purple-400' : 'text-indigo-500 dark:text-indigo-400'
                    }`}
                  >
                    {user.teacher_profile?.is_legacy_teacher ? (
                      <>
                        <ToggleRight className="w-4 h-4" />
                        <span>Remove Legacy Teacher</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="w-4 h-4" />
                        <span>Mark as Legacy Teacher</span>
                      </>
                    )}
                  </button>
                )}
                <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                <button
                  onClick={() => {
                    onSuspend();
                    setShowActionsDropdown(false);
                  }}
                  className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2 ${
                    user.roles?.includes('suspended') ? 'text-emerald-500 dark:text-emerald-400' : 'text-amber-500 dark:text-amber-400'
                  }`}
                >
                  {user.roles?.includes('suspended') ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Unsuspend Account</span>
                    </>
                  ) : (
                    <>
                      <Ban className="w-4 h-4" />
                      <span>Suspend Account</span>
                    </>
                  )}
                </button>
                {isDeleted ? (
                  <>
                    <button
                      onClick={() => {
                        onRestore();
                        setShowActionsDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-emerald-500 dark:text-emerald-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <RotateCcw className="w-4 h-4" />
                      <span>Restore Account</span>
                    </button>
                    <button
                      onClick={() => {
                        onHardDelete();
                        setShowActionsDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Permanently</span>
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        onSoftDelete();
                        setShowActionsDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Delete Account</span>
                    </button>
                    <button
                      onClick={() => {
                        onHardDelete();
                        setShowActionsDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center space-x-2"
                    >
                      <AlertTriangle className="w-4 h-4" />
                      <span>Delete Permanently</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </td>
    </tr>
  );
}

// Create User Modal
function CreateUserModal({ onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    password: '',
    autoGeneratePassword: true,
    roles: [] as string[],
    sendWelcomeEmail: true,
  });

  function toggleRole(role: string) {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter(r => r !== role)
        : [...prev.roles, role]
    }));
  }

  function generatePassword() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const password = formData.autoGeneratePassword ? generatePassword() : formData.password;

      // Create auth user (Note: This requires admin privileges)
      // In production, this should be done via a Supabase Edge Function
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: password,
        options: {
          data: {
            full_name: formData.full_name,
            phone: formData.phone,
          }
        }
      });

      if (authError) throw authError;

      if (authData.user) {
        // Update profile with roles
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            phone: formData.phone,
            roles: formData.roles,
          })
          .eq('id', authData.user.id);

        if (profileError) throw profileError;

        // If teacher role, create teacher profile
        if (formData.roles.includes('teacher')) {
          await supabase
            .from('teacher_profiles')
            .insert([{
              user_id: authData.user.id,
              status: 'approved',
              bio: '',
              specializations: [],
            }]);
        }

        await onSuccess();
        onClose();
        toast.success(`User created successfully! ${formData.sendWelcomeEmail ? 'Welcome email sent to ' + formData.email : ''}`);
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New User</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              placeholder="John Doe"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Email</label>
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              placeholder="john@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Phone (optional)</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              placeholder="+44 123 456 7890"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Password</label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={formData.autoGeneratePassword}
                  onChange={(e) => setFormData({ ...formData, autoGeneratePassword: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-emerald-500"
                />
                <span className="text-sm text-gray-600 dark:text-gray-400">Auto-generate secure password</span>
              </label>
              {!formData.autoGeneratePassword && (
                <input
                  type="password"
                  required={!formData.autoGeneratePassword}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
                  placeholder="Enter password"
                />
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Assign Roles</label>
            <div className="space-y-2">
              {[
                { value: 'student', label: 'Student', icon: Users },
                { value: 'teacher', label: 'Teacher', icon: GraduationCap },
                { value: 'parent', label: 'Parent', icon: Heart },
                { value: 'admin', label: 'Admin', icon: Shield },
              ].map((role) => (
                <label key={role.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-emerald-500"
                  />
                  <role.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white text-sm">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.sendWelcomeEmail}
                onChange={(e) => setFormData({ ...formData, sendWelcomeEmail: e.target.checked })}
                className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-emerald-500"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Send welcome email with login credentials</span>
            </label>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition"
            >
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Edit User Modal
function EditUserModal({ user, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: user.full_name || '',
    email: user.email || '',
    phone: user.phone || '',
    roles: user.roles || [],
  });

  function toggleRole(role: string) {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(role)
        ? prev.roles.filter((r: string) => r !== role)
        : [...prev.roles, role]
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
          roles: formData.roles,
        })
        .eq('id', user.id);

      if (error) throw error;

      // If adding teacher role and no teacher profile exists
      if (formData.roles.includes('teacher') && !(user.roles || []).includes('teacher')) {
        await supabase
          .from('teacher_profiles')
          .upsert([{
            user_id: user.id,
            status: 'approved',
            bio: '',
            specializations: [],
          }]);
      }

      await onSuccess();
      onClose();
      toast.success('User updated successfully');
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit User</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Full Name</label>
            <input
              type="text"
              required
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Email</label>
            <input
              type="email"
              disabled
              value={formData.email}
              className="w-full px-4 py-2 bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-500 cursor-not-allowed"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Email cannot be changed here</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Roles</label>
            <div className="space-y-2">
              {[
                { value: 'student', label: 'Student', icon: Users },
                { value: 'teacher', label: 'Teacher', icon: GraduationCap },
                { value: 'parent', label: 'Parent', icon: Heart },
                { value: 'admin', label: 'Admin', icon: Shield },
              ].map((role) => (
                <label key={role.value} className="flex items-center space-x-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 p-2 rounded">
                  <input
                    type="checkbox"
                    checked={formData.roles.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                    className="w-4 h-4 rounded border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-emerald-500"
                  />
                  <role.icon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                  <span className="text-gray-900 dark:text-white text-sm">{role.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg transition"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Legacy Teacher Assignment Modal
function LegacyTeacherAssignmentModal({ user, onClose, onSuccess }: { user: User; onClose: () => void; onSuccess: () => void }) {
  const [assignments, setAssignments] = useState<LegacyTeacherAssignment[]>([]);
  const [availableTeachers, setAvailableTeachers] = useState<AvailableTeacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState('');

  useEffect(() => {
    fetchAssignments();
    fetchAvailableTeachers();
  }, []);

  async function fetchAssignments() {
    try {
      const { data, error } = await supabase
        .from('legacy_teacher_students')
        .select(`
          id,
          teacher_id,
          teacher_profiles!inner(
            id,
            user_id,
            profiles!inner(full_name)
          )
        `)
        .eq('student_id', user.id);

      if (error) throw error;

      const formattedAssignments = (data || []).map((a: any) => ({
        id: a.id,
        teacher_id: a.teacher_profiles.id,
        teacher_name: a.teacher_profiles.profiles.full_name,
      }));

      setAssignments(formattedAssignments);
    } catch (error) {
      console.error('Error fetching assignments:', error);
      toast.error('Failed to load assigned teachers');
    } finally {
      setLoading(false);
    }
  }

  async function fetchAvailableTeachers() {
    try {
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          is_legacy_teacher,
          profiles!inner(full_name)
        `)
        .eq('status', 'approved');

      if (error) throw error;

      const formattedTeachers = (data || []).map((t: any) => ({
        id: t.id,
        user_id: t.user_id,
        full_name: t.profiles.full_name,
        is_legacy_teacher: t.is_legacy_teacher || false,
      }));

      setAvailableTeachers(formattedTeachers);
    } catch (error) {
      console.error('Error fetching teachers:', error);
    }
  }

  async function handleAddTeacher() {
    if (!selectedTeacherId) return;

    setAdding(true);
    try {
      // Also mark the teacher as legacy if not already
      const teacher = availableTeachers.find(t => t.id === selectedTeacherId);
      if (teacher && !teacher.is_legacy_teacher) {
        await supabase
          .from('teacher_profiles')
          .update({ is_legacy_teacher: true })
          .eq('id', selectedTeacherId);
      }

      const { error } = await supabase
        .from('legacy_teacher_students')
        .insert({
          teacher_id: selectedTeacherId,
          student_id: user.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error('This teacher is already assigned to this student');
        } else {
          throw error;
        }
      } else {
        toast.success('Teacher assigned successfully');
        setSelectedTeacherId('');
        await fetchAssignments();
        await fetchAvailableTeachers();
      }
    } catch (error) {
      console.error('Error assigning teacher:', error);
      toast.error('Failed to assign teacher');
    } finally {
      setAdding(false);
    }
  }

  async function handleRemoveTeacher(assignmentId: string, teacherName: string) {
    if (!confirm(`Remove ${teacherName} from ${user.full_name}'s assigned teachers?`)) return;

    try {
      const { error } = await supabase
        .from('legacy_teacher_students')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      toast.success('Teacher removed successfully');
      await fetchAssignments();
    } catch (error) {
      console.error('Error removing teacher:', error);
      toast.error('Failed to remove teacher');
    }
  }

  // Filter out already assigned teachers
  const unassignedTeachers = availableTeachers.filter(
    t => !assignments.some(a => a.teacher_id === t.id)
  );

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-xl border border-gray-700 p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-white">Assign Legacy Teachers</h3>
            <p className="text-sm text-gray-400 mt-1">{user.full_name}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>

        {/* Add Teacher */}
        <div className="mb-6">
          <label className="block text-sm text-gray-400 mb-2">Add Teacher</label>
          <div className="flex gap-2">
            <select
              value={selectedTeacherId}
              onChange={(e) => setSelectedTeacherId(e.target.value)}
              className="flex-1 px-4 py-2 bg-gray-700/50 border border-gray-600 rounded-lg text-white focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select a teacher...</option>
              {unassignedTeachers.map((teacher) => (
                <option key={teacher.id} value={teacher.id}>
                  {teacher.full_name} {teacher.is_legacy_teacher ? '(Legacy)' : ''}
                </option>
              ))}
            </select>
            <button
              onClick={handleAddTeacher}
              disabled={!selectedTeacherId || adding}
              className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {adding ? (
                <RefreshCw size={16} className="animate-spin" />
              ) : (
                <UserPlus size={16} />
              )}
              Add
            </button>
          </div>
        </div>

        {/* Current Assignments */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Assigned Teachers</label>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <RefreshCw className="w-5 h-5 animate-spin text-emerald-400" />
            </div>
          ) : assignments.length === 0 ? (
            <p className="text-gray-500 text-sm py-4 text-center">No teachers assigned yet</p>
          ) : (
            <div className="space-y-2">
              {assignments.map((assignment) => (
                <div
                  key={assignment.id}
                  className="flex items-center justify-between px-4 py-3 bg-gray-700/30 rounded-lg border border-gray-600"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <GraduationCap size={16} className="text-emerald-400" />
                    </div>
                    <span className="text-white">{assignment.teacher_name}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveTeacher(assignment.id, assignment.teacher_name)}
                    className="text-red-400 hover:text-red-300 p-1"
                    title="Remove teacher"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="mt-6 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500">
            Legacy students can only book lessons with their assigned teachers.
            Lessons are billed monthly at £12/hour.
          </p>
        </div>
      </div>
    </div>
  );
}

// User Details Modal
function UserDetailsModal({ user, onClose }: any) {
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userCredits, setUserCredits] = useState<number | null>(null);
  const [learners, setLearners] = useState<any[]>([]);

  useEffect(() => {
    fetchUserDetails();
  }, []);

  async function fetchUserDetails() {
    try {
      // Fetch user's sessions
      const { data: sessionData } = await supabase
        .from('bookings')
        .select('*')
        .or(`teacher_id.eq.${user.id},student_id.eq.${user.id}`)
        .order('created_at', { ascending: false })
        .limit(10);

      setSessions(sessionData || []);

      // Fetch user credits
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('balance')
        .eq('user_id', user.id)
        .single();

      if (creditsData) {
        setUserCredits(creditsData.balance);
      }

      // Fetch learners if parent
      if (user.roles?.includes('parent')) {
        const { data: learnersData } = await supabase
          .from('learners')
          .select('id, name, age, quran_level')
          .eq('parent_id', user.id);

        setLearners(learnersData || []);
      }
    } catch (error) {
      console.error('Error fetching user details:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">User Details</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Info */}
        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">{user.full_name || 'Unnamed User'}</h4>
              <div className="flex flex-wrap gap-1 mt-2">
                {(user.roles || []).map((role: string) => (
                  <span key={role} className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-xs capitalize">
                    {role}
                  </span>
                ))}
                {user.is_legacy_student && (
                  <span className="px-2 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-400 rounded text-xs">
                    Legacy Student
                  </span>
                )}
                {user.teacher_profile?.is_legacy_teacher && (
                  <span className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded text-xs">
                    Legacy Teacher
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Contact Details - Clickable */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center space-x-3">
              <Mail className="w-5 h-5 text-gray-400" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Email</p>
                <a
                  href={`mailto:${user.email}`}
                  className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                >
                  {user.email}
                </a>
              </div>
              <a
                href={`mailto:${user.email}`}
                className="px-3 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-lg text-sm transition flex items-center space-x-1"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </a>
            </div>

            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
              <div className="flex-1">
                <p className="text-xs text-gray-500 dark:text-gray-400">Phone / Mobile</p>
                {user.phone ? (
                  <a
                    href={`tel:${user.phone}`}
                    className="text-emerald-600 dark:text-emerald-400 hover:underline font-medium"
                  >
                    {user.phone}
                  </a>
                ) : (
                  <p className="text-gray-400 italic">Not provided</p>
                )}
              </div>
              {user.phone && (
                <a
                  href={`tel:${user.phone}`}
                  className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 dark:text-blue-400 rounded-lg text-sm transition flex items-center space-x-1"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span>Call</span>
                </a>
              )}
            </div>
          </div>

          {/* Account Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm border-t border-gray-200 dark:border-gray-600 pt-4">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">User ID</p>
              <p className="text-gray-900 dark:text-white font-mono text-xs truncate" title={user.id}>{user.id.slice(0, 8)}...</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Joined</p>
              <p className="text-gray-900 dark:text-white">{format(new Date(user.created_at), 'MMM d, yyyy')}</p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Last Sign In</p>
              <p className="text-gray-900 dark:text-white">
                {user.last_sign_in_at ? format(new Date(user.last_sign_in_at), 'MMM d, yyyy') : 'Never'}
              </p>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-xs">Credits Balance</p>
              <p className="text-gray-900 dark:text-white font-semibold">
                {userCredits !== null ? `${userCredits} credits` : '-'}
              </p>
            </div>
          </div>

          {/* Deletion info if applicable */}
          {user.deleted_at && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm font-medium">Account Deleted</p>
              <p className="text-gray-400 text-xs mt-1">
                Deleted on: {format(new Date(user.deleted_at), 'MMM d, yyyy')}
                {user.deletion_reason && ` - Reason: ${user.deletion_reason}`}
              </p>
              {user.hard_delete_at && (
                <p className="text-gray-400 text-xs">
                  Permanent deletion scheduled: {format(new Date(user.hard_delete_at), 'MMM d, yyyy')}
                </p>
              )}
            </div>
          )}
        </div>

        {/* Learners (if parent) */}
        {user.roles?.includes('parent') && learners.length > 0 && (
          <div className="mb-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Children / Learners</h4>
            <div className="space-y-2">
              {learners.map((learner) => (
                <div key={learner.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 dark:text-white font-medium">{learner.name}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">
                        Age: {learner.age || 'N/A'} | Level: {learner.quran_level || 'Not set'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sessions */}
        <div className="mb-6">
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Recent Sessions</h4>
          {loading ? (
            <p className="text-gray-500 dark:text-gray-400">Loading...</p>
          ) : sessions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">No sessions found</p>
          ) : (
            <div className="space-y-2">
              {sessions.map((session) => (
                <div key={session.id} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 dark:text-white text-sm">Session on {session.scheduled_date}</p>
                      <p className="text-gray-500 dark:text-gray-400 text-xs">{session.scheduled_time} - {session.duration_minutes}min</p>
                    </div>
                    <span className="px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded text-xs">
                      {session.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
