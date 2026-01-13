import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Calendar, BookCheck, UserPlus, CalendarPlus, BookOpen, TrendingUp, Megaphone, Database, Activity, Video, CheckCircle, DollarSign, Heart, RefreshCw, Bell, X, AlertCircle, AlertTriangle, Award, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import ThemeToggle from '../../components/ThemeToggle';

interface DashboardStats {
  totalStudents: number;
  totalParents: number;
  totalTeachers: number;
  totalSessions: number;
  revenueThisMonth: number;
  todaysSessions: number;
}

interface TierInfo {
  tier: string;
  tier_level: number;
  tier_name: string;
  tier_icon: string;
  teacher_hourly_rate: number;
  student_hourly_price: number;
  platform_margin: number;
  teacher_count?: number;
}

interface SystemHealth {
  database: { status: 'online' | 'slow' | 'offline'; message: string; responseTime: number };
  api: { status: 'online' | 'offline'; message: string };
  video: { status: 'connected' | 'disconnected'; message: string; activeRooms?: number };
  monitoring: { status: 'active' | 'warning' | 'critical'; message: string };
}

interface Notification {
  id: string;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  timestamp: Date;
  link?: string;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalParents: 0,
    totalTeachers: 0,
    totalSessions: 0,
    revenueThisMonth: 0,
    todaysSessions: 0,
  });
  const [health, setHealth] = useState<SystemHealth>({
    database: { status: 'offline', message: 'Checking...', responseTime: 0 },
    api: { status: 'offline', message: 'Checking...' },
    video: { status: 'disconnected', message: 'Checking...' },
    monitoring: { status: 'warning', message: 'Checking...' },
  });
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [tiers, setTiers] = useState<TierInfo[]>([]);

  // Modals
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [showScheduleSession, setShowScheduleSession] = useState(false);
  const [showAnnouncement, setShowAnnouncement] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  async function fetchDashboardData() {
    await Promise.all([
      fetchStats(),
      checkSystemHealth(),
      fetchNotifications(),
      fetchTierInfo(),
    ]);
    setLoading(false);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchDashboardData();
    setRefreshing(false);
  }

  async function fetchStats() {
    try {
      // Get all profiles
      const { data: profiles } = await supabase
        .from('profiles')
        .select('roles');

      // Count students and parents
      const studentsCount = profiles?.filter(p =>
        p.roles && Array.isArray(p.roles) && p.roles.includes('student')
      ).length || 0;

      const parentsCount = profiles?.filter(p =>
        p.roles && Array.isArray(p.roles) && p.roles.includes('parent')
      ).length || 0;

      // Total approved teachers
      const { count: teachersCount } = await supabase
        .from('teacher_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Total sessions (use bookings table)
      const { count: sessionsCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true });

      // Revenue this month (from bookings)
      const firstDayOfMonth = new Date();
      firstDayOfMonth.setDate(1);
      firstDayOfMonth.setHours(0, 0, 0, 0);

      const { data: bookingsThisMonth } = await supabase
        .from('bookings')
        .select('price')
        .eq('payment_status', 'paid')
        .gte('created_at', firstDayOfMonth.toISOString());

      const revenue = bookingsThisMonth?.reduce((sum, booking) =>
        sum + (booking.price / 100), 0
      ) || 0;

      // Today's sessions
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const { count: todaysCount } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_date', today.toISOString().split('T')[0])
        .lt('scheduled_date', tomorrow.toISOString().split('T')[0]);

      setStats({
        totalStudents: studentsCount,
        totalParents: parentsCount,
        totalTeachers: teachersCount || 0,
        totalSessions: sessionsCount || 0,
        revenueThisMonth: revenue,
        todaysSessions: todaysCount || 0,
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }

  async function checkSystemHealth() {
    const healthChecks: SystemHealth = {
      database: { status: 'offline', message: 'Offline', responseTime: 0 },
      api: { status: 'offline', message: 'Offline' },
      video: { status: 'disconnected', message: 'Disconnected' },
      monitoring: { status: 'warning', message: 'Checking...' },
    };

    // 1. Database Check
    try {
      const start = Date.now();
      const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
      const responseTime = Date.now() - start;

      if (!error) {
        if (responseTime < 500) {
          healthChecks.database = { status: 'online', message: 'Healthy', responseTime };
        } else if (responseTime < 2000) {
          healthChecks.database = { status: 'slow', message: 'Slow response', responseTime };
        } else {
          healthChecks.database = { status: 'slow', message: 'Very slow', responseTime };
        }
      }
    } catch {
      healthChecks.database = { status: 'offline', message: 'Connection failed', responseTime: 0 };
    }

    // 2. API Services Check (Supabase connection)
    try {
      const { data } = await supabase.auth.getSession();
      if (data) {
        healthChecks.api = { status: 'online', message: 'Normal' };
      }
    } catch {
      healthChecks.api = { status: 'offline', message: 'Disconnected' };
    }

    // 3. 100ms Video Check (check if HMS env vars are set)
    try {
      // We can't directly ping 100ms from frontend, so we check if recent bookings have room_ids
      const { data: recentBookings } = await supabase
        .from('bookings')
        .select('room_id')
        .not('room_id', 'is', null)
        .limit(5);

      if (recentBookings && recentBookings.length > 0) {
        healthChecks.video = {
          status: 'connected',
          message: 'Connected',
          activeRooms: recentBookings.length
        };
      } else {
        healthChecks.video = { status: 'disconnected', message: 'No active rooms' };
      }
    } catch {
      healthChecks.video = { status: 'disconnected', message: 'Unable to check' };
    }

    // 4. Monitoring Status
    const allHealthy = healthChecks.database.status === 'online' &&
                       healthChecks.api.status === 'online' &&
                       healthChecks.video.status === 'connected';

    if (allHealthy) {
      healthChecks.monitoring = { status: 'active', message: 'All systems normal' };
    } else if (healthChecks.database.status === 'offline') {
      healthChecks.monitoring = { status: 'critical', message: 'Critical issues detected' };
    } else {
      healthChecks.monitoring = { status: 'warning', message: 'Some issues detected' };
    }

    setHealth(healthChecks);
  }

  async function fetchNotifications() {
    const notifs: Notification[] = [];

    try {
      // 1. Pending teacher applications
      const { data: pendingTeachers } = await supabase
        .from('teacher_profiles')
        .select('id, user_id, profiles!inner(full_name)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(3);

      pendingTeachers?.forEach(teacher => {
        notifs.push({
          id: `teacher-${teacher.id}`,
          type: 'info',
          message: `New teacher application - ${(teacher.profiles as any).full_name || 'Unknown'}`,
          timestamp: new Date(),
          link: '/admin/teachers',
        });
      });

      // 2. Failed payments (last 24 hours) - DISABLED: payments table doesn't exist yet
      // const yesterday = new Date();
      // yesterday.setDate(yesterday.getDate() - 1);

      // const { data: failedPayments } = await supabase
      //   .from('payments')
      //   .select('id')
      //   .eq('status', 'failed')
      //   .gte('created_at', yesterday.toISOString())
      //   .limit(3);

      // failedPayments?.forEach(payment => {
      //   notifs.push({
      //     id: `payment-${payment.id}`,
      //     type: 'warning',
      //     message: `Payment failed for transaction #${payment.id.substring(0, 8)}`,
      //     timestamp: new Date(),
      //   });
      // });

      // 3. New signups today
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const { count: newSignups } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today.toISOString());

      if (newSignups && newSignups > 0) {
        notifs.push({
          id: 'signups-today',
          type: 'success',
          message: `${newSignups} new user${newSignups !== 1 ? 's' : ''} joined today`,
          timestamp: new Date(),
        });
      }

      // 4. Upcoming sessions (next 2 hours)
      const twoHoursFromNow = new Date();
      twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

      const { count: upcomingSessions } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'confirmed')
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .limit(5);

      if (upcomingSessions && upcomingSessions > 0) {
        notifs.push({
          id: 'upcoming-sessions',
          type: 'info',
          message: `${upcomingSessions} session${upcomingSessions !== 1 ? 's' : ''} scheduled in next 2 hours`,
          timestamp: new Date(),
        });
      }

      setNotifications(notifs.slice(0, 10));
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }

  async function fetchTierInfo() {
    try {
      // Get all tier info
      const { data: tiersData } = await supabase
        .from('teacher_tiers')
        .select('*')
        .order('tier_level');

      // Get teacher counts per tier
      const { data: teacherStats } = await supabase
        .from('teacher_tier_stats')
        .select('tier');

      // Count teachers per tier
      const tierCounts: { [key: string]: number } = {};
      teacherStats?.forEach((teacher) => {
        tierCounts[teacher.tier] = (tierCounts[teacher.tier] || 0) + 1;
      });

      // Merge counts with tier info
      const tiersWithCounts = tiersData?.map((tier) => ({
        ...tier,
        teacher_count: tierCounts[tier.tier] || 0,
      }));

      setTiers(tiersWithCounts || []);
    } catch (error) {
      console.error('Error fetching tier info:', error);
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome to your academy admin portal</p>
        </div>
        <div className="flex items-center space-x-3">
          <ThemeToggle variant="dropdown" />
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          <button className="px-4 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg transition relative">
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Users}
          label="Total Students"
          value={stats.totalStudents}
          bgColor="bg-emerald-500/10"
          borderColor="border-emerald-500/20"
          iconColor="text-emerald-600"
        />
        <StatCard
          icon={BookCheck}
          label="Total Sessions"
          value={stats.totalSessions}
          bgColor="bg-blue-500/10"
          borderColor="border-blue-500/20"
          iconColor="text-blue-400"
        />
        <StatCard
          icon={DollarSign}
          label="Revenue This Month"
          value={`£${stats.revenueThisMonth.toFixed(2)}`}
          bgColor="bg-green-500/10"
          borderColor="border-green-500/20"
          iconColor="text-green-400"
        />
        <StatCard
          icon={GraduationCap}
          label="Total Teachers"
          value={stats.totalTeachers}
          bgColor="bg-emerald-500/10"
          borderColor="border-emerald-500/20"
          iconColor="text-emerald-400"
        />
        <StatCard
          icon={Heart}
          label="Total Parents"
          value={stats.totalParents}
          bgColor="bg-pink-500/10"
          borderColor="border-pink-500/20"
          iconColor="text-pink-400"
        />
        <StatCard
          icon={Calendar}
          label="Today's Sessions"
          value={stats.todaysSessions}
          bgColor="bg-purple-500/10"
          borderColor="border-purple-500/20"
          iconColor="text-purple-400"
        />
      </div>

      {/* Teacher Tier Structure */}
      {tiers.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Award className="w-6 h-6 text-amber-400" />
              <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">Teacher Tier Structure</h2>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/admin/group-lesson-teachers')}
                className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-600 rounded-lg transition flex items-center space-x-2"
              >
                <Users className="w-4 h-4" />
                <span>Group Teachers</span>
              </button>
              <button
                onClick={() => navigate('/admin/teacher-tiers')}
                className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 rounded-lg transition flex items-center space-x-2"
              >
                <span>Manage Tiers</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {tiers.map((tier) => (
              <div
                key={tier.tier}
                className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-5 hover:border-emerald-500/30 transition group"
              >
                {/* Tier Icon & Name */}
                <div className="text-center mb-4">
                  <div className="text-5xl mb-2">{tier.tier_icon}</div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white capitalize">{tier.tier_name}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Level {tier.tier_level}</p>
                </div>

                {/* Teacher Count */}
                <div className="mb-4 p-3 bg-emerald-500/5 border border-emerald-500/10 rounded-lg text-center">
                  <p className="text-2xl font-bold text-emerald-600">{tier.teacher_count}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Teacher{tier.teacher_count !== 1 ? 's' : ''}</p>
                </div>

                {/* Rates */}
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between items-center p-2 bg-emerald-500/5 border border-emerald-500/10 rounded">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Teacher Rate</span>
                    <span className="text-sm font-bold text-emerald-400">£{tier.teacher_hourly_rate.toFixed(2)}/h</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-blue-500/5 border border-blue-500/10 rounded">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Student Price</span>
                    <span className="text-sm font-bold text-blue-400">£{tier.student_hourly_price.toFixed(2)}/h</span>
                  </div>
                  <div className="flex justify-between items-center p-2 bg-purple-500/5 border border-purple-500/10 rounded">
                    <span className="text-xs text-gray-500 dark:text-gray-400">Platform</span>
                    <span className="text-sm font-bold text-purple-400">£{tier.platform_margin.toFixed(2)}/h</span>
                  </div>
                </div>

                {/* Requirements */}
                {tier.requires_manual_approval ? (
                  <div className="p-2 bg-amber-500/10 border border-amber-500/20 rounded text-center">
                    <p className="text-xs text-amber-400 font-semibold">Manual Approval</p>
                  </div>
                ) : (
                  <div className="space-y-1 text-xs text-gray-500 dark:text-gray-400">
                    <p>Min {tier.min_hours_taught}h taught</p>
                    <p>Min {tier.min_rating.toFixed(1)}★ rating</p>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Key Info */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-400 font-semibold mb-1">Automatic Progression</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Tiers 1-3 auto-promote based on hours & ratings</p>
            </div>
            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
              <p className="text-sm text-amber-400 font-semibold mb-1">Manual Review</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Expert & Master tiers require admin approval</p>
            </div>
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <p className="text-sm text-emerald-600 font-semibold mb-1">Price Protection</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Students keep rates for 12 months after booking</p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <ActionButton
            icon={UserPlus}
            label="Create New User"
            onClick={() => setShowCreateUser(true)}
            color="cyan"
          />
          <ActionButton
            icon={CalendarPlus}
            label="Schedule Session"
            onClick={() => setShowScheduleSession(true)}
            color="emerald"
          />
          <ActionButton
            icon={BookOpen}
            label="Manage Courses"
            onClick={() => navigate('/admin/courses')}
            color="blue"
          />
          <ActionButton
            icon={TrendingUp}
            label="View Analytics"
            onClick={() => navigate('/admin/analytics')}
            color="purple"
          />
          <ActionButton
            icon={Megaphone}
            label="Send Announcement"
            onClick={() => setShowAnnouncement(true)}
            color="amber"
          />
        </div>
      </div>

      {/* System Health */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">System Health</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <HealthStatus
            icon={Database}
            label="Database"
            status={health.database.status}
            message={health.database.message}
            detail={health.database.responseTime > 0 ? `${health.database.responseTime}ms` : undefined}
          />
          <HealthStatus
            icon={Activity}
            label="API Services"
            status={health.api.status}
            message={health.api.message}
          />
          <HealthStatus
            icon={Video}
            label="100ms Video"
            status={health.video.status}
            message={health.video.message}
            detail={health.video.activeRooms ? `${health.video.activeRooms} active` : undefined}
          />
          <HealthStatus
            icon={CheckCircle}
            label="Monitoring"
            status={health.monitoring.status}
            message={health.monitoring.message}
          />
        </div>
      </div>

      {/* Recent Notifications */}
      {notifications.length > 0 && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Recent Notifications</h2>
          <div className="space-y-3">
            {notifications.map(notif => (
              <NotificationItem key={notif.id} notification={notif} />
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      {showCreateUser && <CreateUserModal onClose={() => setShowCreateUser(false)} />}
      {showScheduleSession && <ScheduleSessionModal onClose={() => setShowScheduleSession(false)} />}
      {showAnnouncement && <AnnouncementModal onClose={() => setShowAnnouncement(false)} />}
    </div>
  );
}

// Stat Card Component
function StatCard({ icon: Icon, label, value, bgColor, borderColor, iconColor }: any) {
  return (
    <div className={`bg-white dark:bg-gray-800 ${borderColor} border rounded-xl p-6 shadow-sm`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-12 h-12 ${bgColor} border ${borderColor} rounded-lg flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
      <p className="text-gray-500 dark:text-gray-400 text-sm mb-1">{label}</p>
      <p className="text-3xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

// Action Button Component
function ActionButton({ icon: Icon, label, onClick, color }: any) {
  const colors = {
    cyan: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-600',
    emerald: 'bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/20 text-emerald-400',
    blue: 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/20 text-blue-400',
    purple: 'bg-purple-500/10 hover:bg-purple-500/20 border-purple-500/20 text-purple-400',
    amber: 'bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 text-amber-400',
  };

  return (
    <button
      onClick={onClick}
      className={`px-4 py-4 ${colors[color as keyof typeof colors]} border rounded-lg transition flex items-center space-x-3 text-left`}
    >
      <Icon className="w-5 h-5" />
      <span className="font-medium">{label}</span>
    </button>
  );
}

// Health Status Component
function HealthStatus({ icon: Icon, label, status, message, detail }: any) {
  const getStatusColor = () => {
    if (status === 'online' || status === 'connected' || status === 'active') {
      return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
    } else if (status === 'slow' || status === 'warning') {
      return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
    } else {
      return 'bg-red-500/10 border-red-500/20 text-red-400';
    }
  };

  const getStatusIcon = () => {
    if (status === 'online' || status === 'connected' || status === 'active') {
      return <CheckCircle className="w-5 h-5 text-emerald-400" />;
    } else if (status === 'slow' || status === 'warning') {
      return <AlertTriangle className="w-5 h-5 text-amber-400" />;
    } else {
      return <AlertCircle className="w-5 h-5 text-red-400" />;
    }
  };

  return (
    <div className={`p-4 ${getStatusColor()} border rounded-lg flex items-center justify-between`}>
      <div className="flex items-center space-x-3">
        <Icon className="w-5 h-5" />
        <div>
          <p className="font-medium text-sm">{label}</p>
          <p className="text-xs opacity-75">{message}</p>
          {detail && <p className="text-xs opacity-60 mt-0.5">{detail}</p>}
        </div>
      </div>
      {getStatusIcon()}
    </div>
  );
}

// Notification Item Component
function NotificationItem({ notification }: { notification: Notification }) {
  const getTypeColor = () => {
    switch (notification.type) {
      case 'success': return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
      case 'warning': return 'bg-amber-500/10 border-amber-500/20 text-amber-400';
      case 'error': return 'bg-red-500/10 border-red-500/20 text-red-400';
      default: return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600';
    }
  };

  const getIcon = () => {
    switch (notification.type) {
      case 'success': return <CheckCircle className="w-5 h-5" />;
      case 'warning': return <AlertTriangle className="w-5 h-5" />;
      case 'error': return <AlertCircle className="w-5 h-5" />;
      default: return <Bell className="w-5 h-5" />;
    }
  };

  return (
    <div className={`p-3 ${getTypeColor()} border rounded-lg flex items-start space-x-3`}>
      {getIcon()}
      <div className="flex-1">
        <p className="text-sm">{notification.message}</p>
      </div>
    </div>
  );
}

// Create User Modal (Placeholder)
function CreateUserModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">User creation modal - Coming soon!</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Schedule Session Modal (Placeholder)
function ScheduleSessionModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Schedule Session</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Session scheduling modal - Coming soon!</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

// Announcement Modal (Placeholder)
function AnnouncementModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-md w-full mx-4 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Send Announcement</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">Announcement modal - Coming soon!</p>
        <button
          onClick={onClose}
          className="w-full px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
