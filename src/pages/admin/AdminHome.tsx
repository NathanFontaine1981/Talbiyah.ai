import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, GraduationCap, Calendar, BookCheck, UserPlus, CalendarPlus, BookOpen, TrendingUp, Megaphone, Database, Activity, Wifi, Video, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface DashboardStats {
  totalStudents: number;
  totalTeachers: number;
  activeBookings: number;
  completedSessions: number;
}

export default function AdminHome() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudents: 0,
    totalTeachers: 0,
    activeBookings: 0,
    completedSessions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  async function fetchDashboardStats() {
    try {
      const [studentsCount, teachersCount, bookingsCount, completedCount] = await Promise.all([
        supabase.from('learners').select('id', { count: 'exact', head: true }),
        supabase.from('teacher_profiles').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('lessons').select('id', { count: 'exact', head: true }).in('status', ['scheduled', 'confirmed']),
        supabase.from('lessons').select('id', { count: 'exact', head: true }).eq('status', 'completed'),
      ]);

      setStats({
        totalStudents: studentsCount.count || 0,
        totalTeachers: teachersCount.count || 0,
        activeBookings: bookingsCount.count || 0,
        completedSessions: completedCount.count || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  }

  const statCards = [
    { icon: Users, label: 'Total Students', value: stats.totalStudents, bgColor: 'bg-cyan-500/10', borderColor: 'border-cyan-500/20', iconColor: 'text-cyan-400' },
    { icon: GraduationCap, label: 'Total Teachers', value: stats.totalTeachers, bgColor: 'bg-emerald-500/10', borderColor: 'border-emerald-500/20', iconColor: 'text-emerald-400' },
    { icon: Calendar, label: 'Active Bookings', value: stats.activeBookings, bgColor: 'bg-amber-500/10', borderColor: 'border-amber-500/20', iconColor: 'text-amber-400' },
    { icon: BookCheck, label: 'Completed Sessions', value: stats.completedSessions, bgColor: 'bg-blue-500/10', borderColor: 'border-blue-500/20', iconColor: 'text-blue-400' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-2">Dashboard Overview</h2>
        <p className="text-slate-400">Welcome to your academy admin portal</p>
      </div>

      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Stats</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {statCards.map((card, index) => (
            <div
              key={index}
              className={`${card.bgColor} border ${card.borderColor} rounded-xl p-6 transition hover:scale-105 cursor-pointer`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className={`w-12 h-12 ${card.bgColor} border ${card.borderColor} rounded-lg flex items-center justify-center`}>
                  <card.icon className={`w-6 h-6 ${card.iconColor}`} />
                </div>
              </div>
              <p className="text-slate-400 text-sm mb-1">{card.label}</p>
              <p className="text-3xl font-bold text-white">{card.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <button
              onClick={() => navigate('/admin/users')}
              className="w-full px-4 py-3 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-left transition flex items-center space-x-3"
            >
              <UserPlus className="w-5 h-5 text-cyan-400" />
              <div className="flex-1">
                <p className="text-cyan-400 font-medium">Create New User</p>
                <p className="text-slate-400 text-xs mt-1">Add student, teacher, or admin</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/sessions')}
              className="w-full px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-lg text-left transition flex items-center space-x-3"
            >
              <CalendarPlus className="w-5 h-5 text-emerald-400" />
              <div className="flex-1">
                <p className="text-emerald-400 font-medium">Schedule Session</p>
                <p className="text-slate-400 text-xs mt-1">Create private or group session</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/courses')}
              className="w-full px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 rounded-lg text-left transition flex items-center space-x-3"
            >
              <BookOpen className="w-5 h-5 text-blue-400" />
              <div className="flex-1">
                <p className="text-blue-400 font-medium">Manage Courses</p>
                <p className="text-slate-400 text-xs mt-1">View and edit course catalog</p>
              </div>
            </button>
            <button
              onClick={() => navigate('/admin/analytics')}
              className="w-full px-4 py-3 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 rounded-lg text-left transition flex items-center space-x-3"
            >
              <TrendingUp className="w-5 h-5 text-purple-400" />
              <div className="flex-1">
                <p className="text-purple-400 font-medium">View Analytics</p>
                <p className="text-slate-400 text-xs mt-1">Platform performance metrics</p>
              </div>
            </button>
            <button
              className="w-full px-4 py-3 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-lg text-left transition flex items-center space-x-3"
            >
              <Megaphone className="w-5 h-5 text-amber-400" />
              <div className="flex-1">
                <p className="text-amber-400 font-medium">Send Announcement</p>
                <p className="text-slate-400 text-xs mt-1">Broadcast to all users</p>
              </div>
            </button>
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-white mb-4">System Health</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Database className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-medium text-sm">Database</p>
                  <p className="text-slate-400 text-xs">All systems operational</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Activity className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-medium text-sm">API Services</p>
                  <p className="text-slate-400 text-xs">Online and responsive</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Video className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-medium text-sm">100MS Video</p>
                  <p className="text-slate-400 text-xs">Connected and streaming</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <div className="flex items-center space-x-3">
                <Wifi className="w-5 h-5 text-emerald-400" />
                <div>
                  <p className="text-emerald-400 font-medium text-sm">Monitoring</p>
                  <p className="text-slate-400 text-xs">Normal operation</p>
                </div>
              </div>
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
