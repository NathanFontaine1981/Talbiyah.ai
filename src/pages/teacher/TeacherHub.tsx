import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  DollarSign,
  Clock,
  Award,
  Calendar,
  Users,
  TrendingUp,
  Settings,
  BookOpen,
  CreditCard,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ClipboardCheck,
} from 'lucide-react';
import PendingLessonsList from '../../components/teacher/PendingLessonsList';
import WeeklyCalendar from '../../components/teacher/WeeklyCalendar';

interface TeacherStats {
  tier: string;
  tier_name: string;
  tier_icon: string;
  teacher_hourly_rate: number;
  hours_taught: number;
  average_rating: number;
  total_students: number;
  next_auto_tier: string | null;
  hours_to_next_tier: number | null;
}

interface EarningsSummary {
  total_earnings: number;
  this_month_earnings: number;
  held_amount: number;
  cleared_amount: number;
}

interface UpcomingLesson {
  id: string;
  scheduled_time: string;
  duration_minutes: number;
  student_name: string;
  subject: string;
}

export default function TeacherHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Get teacher profile
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, status')
        .eq('user_id', user.id)
        .single();

      if (!teacherProfile || teacherProfile.status !== 'approved') {
        navigate('/teacher/pending-approval');
        return;
      }

      setTeacherProfileId(teacherProfile.id);

      // Get tier stats
      const { data: tierStats } = await supabase
        .from('teacher_tier_stats')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .single();

      setStats(tierStats);

      // Get earnings summary (optional - table may not exist yet)
      const { data: earningsData, error: earningsError } = await supabase
        .from('teacher_earnings')
        .select('amount_earned, status, created_at')
        .eq('teacher_id', teacherProfile.id);

      if (!earningsError && earningsData) {
        const now = new Date();
        const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const summary = {
          total_earnings: earningsData.reduce((sum, e) => sum + Number(e.amount_earned), 0),
          this_month_earnings: earningsData
            .filter(e => new Date(e.created_at) >= thisMonthStart)
            .reduce((sum, e) => sum + Number(e.amount_earned), 0),
          held_amount: earningsData
            .filter(e => e.status === 'held')
            .reduce((sum, e) => sum + Number(e.amount_earned), 0),
          cleared_amount: earningsData
            .filter(e => e.status === 'cleared')
            .reduce((sum, e) => sum + Number(e.amount_earned), 0),
        };
        setEarnings(summary);
      } else if (earningsError) {
        console.warn('teacher_earnings table not available yet:', earningsError.message);
        // Set default earnings to prevent errors
        setEarnings({
          total_earnings: 0,
          this_month_earnings: 0,
          held_amount: 0,
          cleared_amount: 0,
        });
      }

      // Get upcoming lessons
      const { data: lessonsData, error: lessonsError } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          subjects(name),
          student:learners!lessons_learner_id_fkey(name)
        `)
        .eq('teacher_id', teacherProfile.id)
        .in('status', ['booked', 'scheduled'])
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(5);

      if (lessonsError) {
        console.error('Error loading lessons:', lessonsError);
      } else if (lessonsData) {
        const formattedLessons = lessonsData.map(lesson => ({
          id: lesson.id,
          scheduled_time: lesson.scheduled_time,
          duration_minutes: lesson.duration_minutes,
          student_name: (lesson.student as any)?.name || 'Unknown Student',
          subject: (lesson.subjects as any)?.name || 'General',
        }));
        setUpcomingLessons(formattedLessons);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const navItems = [
    {
      icon: Calendar,
      label: 'My Schedule',
      path: '/teacher/schedule',
      iconBg: 'bg-cyan-500/20',
      iconColor: 'text-cyan-400'
    },
    {
      icon: Users,
      label: 'My Students',
      path: '/teacher/my-students',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-400'
    },
    {
      icon: DollarSign,
      label: 'My Earnings',
      path: '/teacher/earnings',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-400'
    },
    {
      icon: ClipboardCheck,
      label: 'Homework Review',
      path: '/teacher/homework-review',
      iconBg: 'bg-teal-500/20',
      iconColor: 'text-teal-400'
    },
    {
      icon: Clock,
      label: 'Availability',
      path: '/teacher/availability',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-400'
    },
    {
      icon: CreditCard,
      label: 'Payment Settings',
      path: '/teacher/payment-settings',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400'
    },
    {
      icon: Settings,
      label: 'Edit Profile',
      path: '/teacher/edit-profile',
      iconBg: 'bg-slate-500/20',
      iconColor: 'text-slate-400'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center gap-2 text-slate-400 hover:text-white transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
          <span>Back to Main Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Teacher Account</h1>
          <p className="text-slate-400">Manage your teaching activities and track your performance.</p>
        </div>

        {/* Current Tier Badge */}
        {stats && (
          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">{stats.tier_icon}</div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{stats.tier_name} Teacher</h2>
                  <p className="text-slate-300">£{stats.teacher_hourly_rate.toFixed(2)}/hour</p>
                </div>
              </div>
              {stats.next_auto_tier && (
                <button
                  onClick={() => navigate('/teacher/tiers')}
                  className="px-6 py-3 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 font-semibold transition flex items-center space-x-2"
                >
                  <TrendingUp className="w-5 h-5" />
                  <span>View Progress</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Pending Lessons - Acknowledgment Required */}
        {teacherProfileId && (
          <PendingLessonsList teacherId={teacherProfileId} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Earnings</p>
                <p className="text-2xl font-bold text-white">
                  £{earnings?.total_earnings.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              This month: £{earnings?.this_month_earnings.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Hours Taught */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-cyan-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Hours Taught</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.hours_taught.toFixed(1) || '0.0'}h
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">All time</p>
          </div>

          {/* Rating */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Average Rating</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.average_rating.toFixed(1) || '0.0'} ★
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">From student reviews</p>
          </div>

          {/* Students */}
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-slate-400">Total Students</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.total_students || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-slate-500">Unique students taught</p>
          </div>
        </div>

        {/* Quick Navigation */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-4">Quick Access</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {navItems.map((item) => (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className="group bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-slate-700/50 hover:border-cyan-500/50 transition text-center"
              >
                <div className={`w-12 h-12 mx-auto mb-3 ${item.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <p className="text-sm font-semibold text-white group-hover:text-cyan-400 transition">
                  {item.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Upcoming Lessons Details */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-cyan-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-cyan-400" />
              </div>
              Upcoming Lessons
            </h2>
            <button
              onClick={() => navigate('/teacher/schedule')}
              className="text-cyan-400 hover:text-cyan-300 font-semibold text-sm flex items-center gap-2"
            >
              View Full Calendar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {upcomingLessons.length === 0 ? (
            <div className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-8 border border-slate-700/50 text-center">
              <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-400 mb-4">No upcoming lessons scheduled</p>
              <button
                onClick={() => navigate('/teacher/availability')}
                className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 font-semibold transition"
              >
                Set Your Availability
              </button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingLessons.map((lesson) => {
                const lessonDate = new Date(lesson.scheduled_time);
                const isToday = new Date().toDateString() === lessonDate.toDateString();
                const isTomorrow = new Date(Date.now() + 86400000).toDateString() === lessonDate.toDateString();

                return (
                  <div
                    key={lesson.id}
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                    className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-5 border border-slate-700/50 hover:border-cyan-500/50 cursor-pointer transition group"
                  >
                    {/* Date Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isToday
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : isTomorrow
                          ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                          : 'bg-slate-700/50 text-slate-300 border border-slate-600/30'
                      }`}>
                        {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : lessonDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-white">
                        {lessonDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {lesson.student_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-white group-hover:text-cyan-400 transition">
                          {lesson.student_name}
                        </p>
                        <p className="text-sm text-slate-400">{lesson.subject}</p>
                      </div>
                    </div>

                    {/* Duration */}
                    <div className="flex items-center gap-2 text-sm text-slate-400">
                      <Clock className="w-4 h-4" />
                      <span>{lesson.duration_minutes} minutes</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Weekly Calendar */}
        {teacherProfileId && (
          <div className="mb-8">
            <WeeklyCalendar teacherId={teacherProfileId} />
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
            <h3 className="text-xl font-bold text-white mb-3">💰 Earnings Overview</h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Cleared</span>
                <span className="font-semibold text-emerald-400">
                  £{earnings?.cleared_amount.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">On Hold</span>
                <span className="font-semibold text-amber-400">
                  £{earnings?.held_amount.toFixed(2) || '0.00'}
                </span>
              </div>
            </div>
            <button
              onClick={() => navigate('/teacher/earnings')}
              className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-lg text-emerald-400 font-semibold transition"
            >
              View Full Earnings
            </button>
          </div>

          <div className="bg-gradient-to-br from-cyan-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-6 border border-cyan-500/30">
            <h3 className="text-xl font-bold text-white mb-3">🎯 Tier Progress</h3>
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Current Tier</span>
                <span className="font-semibold text-cyan-400">{stats?.tier_name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Hours Taught</span>
                <span className="font-semibold text-white">{stats?.hours_taught?.toFixed(1) || '0.0'}h</span>
              </div>
              {stats?.next_auto_tier && stats?.hours_to_next_tier !== null && stats.hours_to_next_tier > 0 && (
                <>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Next Tier</span>
                    <span className="font-semibold text-blue-400 capitalize">
                      {stats.next_auto_tier}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Hours to Promotion</span>
                    <span className="font-semibold text-amber-400">
                      {stats.hours_to_next_tier.toFixed(1)}h remaining
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500"
                        style={{
                          width: `${Math.min(100, ((stats.hours_taught || 0) / ((stats.hours_taught || 0) + stats.hours_to_next_tier)) * 100)}%`
                        }}
                      />
                    </div>
                  </div>
                </>
              )}
            </div>
            <button
              onClick={() => navigate('/teacher/tiers')}
              className="w-full px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg text-cyan-400 font-semibold transition"
            >
              View Tier Details
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
