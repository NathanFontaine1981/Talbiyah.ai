import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import OnboardingChecklist from '../../components/teacher/OnboardingChecklist';
import {
  DollarSign,
  Clock,
  Award,
  Calendar,
  Users,
  TrendingUp,
  Settings,
  CreditCard,
  ArrowRight,
  ArrowLeft,
  Loader2,
  ClipboardCheck,
  XCircle,
  Zap,
  BarChart3,
} from 'lucide-react';
import { TEACHER_TYPES, type TeacherType } from '../../constants/teacherConstants';
import PendingLessonsList from '../../components/teacher/PendingLessonsList';
import WeeklyCalendar from '../../components/teacher/WeeklyCalendar';
import DiagnosticSessionsCard from '../../components/teacher/DiagnosticSessionsCard';
import CancelLessonModal from '../../components/teacher/CancelLessonModal';
import AcknowledgeLessonModal from '../../components/teacher/AcknowledgeLessonModal';
import DeclineLessonModal from '../../components/teacher/DeclineLessonModal';

interface TeacherStats {
  tier: string;
  tier_name: string;
  tier_icon: string;
  teacher_hourly_rate: number;
  hours_taught: number;
  average_rating: number;
  retention_rate: number;
  returning_students: number;
  total_unique_students: number;
  total_students: number;
  next_auto_tier: string | null;
  hours_to_next_tier: number | null;
  min_retention_for_next: number | null;
  min_students_for_next: number | null;
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
  student_id: string;
  subject: string;
  confirmation_status: string;
}

export default function TeacherHub() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [teacherProfileId, setTeacherProfileId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [upcomingLessons, setUpcomingLessons] = useState<UpcomingLesson[]>([]);
  const [cancellingLesson, setCancellingLesson] = useState<UpcomingLesson | null>(null);
  const [acknowledgingLesson, setAcknowledgingLesson] = useState<UpcomingLesson | null>(null);
  const [decliningLesson, setDecliningLesson] = useState<UpcomingLesson | null>(null);
  const [teacherType, setTeacherType] = useState<TeacherType>('platform');
  const [independentRate, setIndependentRate] = useState<number>(0);
  const [paymentCollection, setPaymentCollection] = useState<'external' | 'platform'>('external');
  const [insightsStats, setInsightsStats] = useState({ total: 0, withInsights: 0 });

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

      // Get teacher profile with retention data and teacher type
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, status, retention_rate, returning_students, total_unique_students, teacher_type, independent_rate, payment_collection')
        .eq('user_id', user.id)
        .single();

      if (!teacherProfile || teacherProfile.status !== 'approved') {
        navigate('/teacher/pending-approval');
        return;
      }

      setTeacherProfileId(teacherProfile.id);
      setUserId(user.id);
      setTeacherType(teacherProfile.teacher_type || 'platform');
      setIndependentRate(teacherProfile.independent_rate || 0);
      setPaymentCollection(teacherProfile.payment_collection || 'external');

      // For independent teachers, fetch insights usage stats
      if (teacherProfile.teacher_type === 'independent') {
        const { count: totalLessons } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .eq('teacher_id', teacherProfile.id)
          .eq('is_independent', true);

        const { count: insightsLessons } = await supabase
          .from('lessons')
          .select('id', { count: 'exact', head: true })
          .eq('teacher_id', teacherProfile.id)
          .eq('is_independent', true)
          .eq('insights_addon', true);

        setInsightsStats({
          total: totalLessons || 0,
          withInsights: insightsLessons || 0,
        });
      }

      // Get tier stats
      const { data: tierStats } = await supabase
        .from('teacher_tier_stats')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .single();

      // Get tiers to calculate hours_to_next_tier and retention requirements
      const { data: tiersData } = await supabase
        .from('teacher_tiers')
        .select('tier, tier_name, min_hours_taught, min_retention_rate, min_students_for_retention, requires_manual_approval')
        .order('tier_level');

      // Calculate hours_to_next_tier and retention requirements
      if (tierStats && tiersData) {
        const hoursTaught = tierStats.hours_taught || 0;
        const autoTiers = tiersData.filter(t => !t.requires_manual_approval);
        const nextTier = autoTiers.find(t => t.min_hours_taught > hoursTaught);

        // Add retention data from teacher_profiles
        tierStats.retention_rate = teacherProfile.retention_rate || 0;
        tierStats.returning_students = teacherProfile.returning_students || 0;
        tierStats.total_unique_students = teacherProfile.total_unique_students || 0;

        if (nextTier) {
          tierStats.next_auto_tier = nextTier.tier;
          tierStats.hours_to_next_tier = Math.max(0, nextTier.min_hours_taught - hoursTaught);
          tierStats.min_retention_for_next = nextTier.min_retention_rate || 0;
          tierStats.min_students_for_next = nextTier.min_students_for_retention || 5;
        }
      }

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
        // Set default earnings if table not available
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
          confirmation_status,
          learner_id,
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
          student_id: lesson.learner_id,
          subject: (lesson.subjects as any)?.name || 'General',
          confirmation_status: lesson.confirmation_status || 'pending',
        }));
        setUpcomingLessons(formattedLessons);
      }
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const isIndependent = teacherType === 'independent';
  const isExternalPayment = isIndependent && paymentCollection === 'external';

  const navItems = [
    {
      icon: Calendar,
      label: 'My Schedule',
      path: '/teacher/schedule',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-600'
    },
    {
      icon: Users,
      label: 'My Students',
      path: '/teacher/my-students',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-600'
    },
    {
      icon: Users,
      label: 'Group Lessons',
      path: '/teacher/group-lessons',
      iconBg: 'bg-blue-500/20',
      iconColor: 'text-blue-600'
    },
    // Only show earnings for platform teachers or independent with platform payment
    ...(!isExternalPayment ? [{
      icon: DollarSign,
      label: 'My Earnings',
      path: '/teacher/earnings',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-600'
    }] : []),
    {
      icon: ClipboardCheck,
      label: 'Homework Review',
      path: '/teacher/homework-review',
      iconBg: 'bg-green-500/20',
      iconColor: 'text-green-600'
    },
    {
      icon: Clock,
      label: 'Availability',
      path: '/teacher/availability',
      iconBg: 'bg-purple-500/20',
      iconColor: 'text-purple-600'
    },
    // Only show payment settings for platform teachers or independent with platform payment
    ...(!isExternalPayment ? [{
      icon: CreditCard,
      label: 'Payment Settings',
      path: '/teacher/payment-settings',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-400'
    }] : []),
    {
      icon: Settings,
      label: 'Edit Profile',
      path: '/teacher/edit-profile',
      iconBg: 'bg-gray-500/20',
      iconColor: 'text-gray-500'
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Back to Dashboard Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center gap-2 text-gray-500 hover:text-white transition group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
          <span>Back to Main Dashboard</span>
        </button>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Teacher Account</h1>
          <p className="text-gray-500">Manage your teaching activities and track your performance.</p>
        </div>

        {/* Onboarding Checklist - shown until complete */}
        {teacherProfileId && userId && (
          <OnboardingChecklist teacherProfileId={teacherProfileId} userId={userId} />
        )}

        {/* Current Tier Badge / Independent Teacher Badge */}
        {isIndependent ? (
          <div className="bg-gradient-to-r from-blue-500/10 to-indigo-600/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">🎓</div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Independent Teacher</h2>
                  <p className="text-gray-400">
                    {independentRate > 0 ? `£${independentRate.toFixed(2)}/hour` : 'Rate set by you'}
                    {' · '}
                    Platform payment
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="flex items-center space-x-2 text-blue-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm font-medium">
                      {insightsStats.withInsights}/{insightsStats.total} lessons with Insights
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {insightsStats.total > 0
                      ? `${Math.round((insightsStats.withInsights / insightsStats.total) * 100)}% adoption rate`
                      : 'No lessons yet'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ) : stats && (
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30 mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="text-5xl">{stats.tier_icon}</div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{stats.tier_name} Teacher</h2>
                  <p className="text-gray-600">£{stats.teacher_hourly_rate.toFixed(2)}/hour</p>
                </div>
              </div>
              {stats.next_auto_tier && (
                <button
                  onClick={() => navigate('/teacher/tiers')}
                  className="px-6 py-3 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-lg text-emerald-600 font-semibold transition flex items-center space-x-2"
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

        {/* Diagnostic Assessments */}
        {teacherProfileId && (
          <DiagnosticSessionsCard teacherId={teacherProfileId} />
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Earnings */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Earnings</p>
                <p className="text-2xl font-bold text-white">
                  £{earnings?.total_earnings.toFixed(2) || '0.00'}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              This month: £{earnings?.this_month_earnings.toFixed(2) || '0.00'}
            </p>
          </div>

          {/* Hours Taught */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Hours Taught</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.hours_taught?.toFixed(1) || '0.0'}h
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">All time</p>
          </div>

          {/* Rating */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                <Award className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Average Rating</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.average_rating?.toFixed(1) || '0.0'} ★
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">From student reviews</p>
          </div>

          {/* Students */}
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
            <div className="flex items-center space-x-3 mb-3">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Total Students</p>
                <p className="text-2xl font-bold text-white">
                  {stats?.total_students || 0}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Unique students taught</p>
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
                className="group bg-gray-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-700 hover:border-emerald-500/50 transition text-center"
              >
                <div className={`w-12 h-12 mx-auto mb-3 ${item.iconBg} rounded-xl flex items-center justify-center group-hover:scale-110 transition`}>
                  <item.icon className={`w-6 h-6 ${item.iconColor}`} />
                </div>
                <p className="text-sm font-semibold text-white group-hover:text-emerald-400 transition">
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
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600" />
              </div>
              Upcoming Lessons
            </h2>
            <button
              onClick={() => navigate('/teacher/schedule')}
              className="text-emerald-600 hover:text-blue-400 font-semibold text-sm flex items-center gap-2"
            >
              View Full Calendar
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          {upcomingLessons.length === 0 ? (
            <div className="bg-white rounded-xl p-8 border border-gray-200 shadow-sm text-center">
              <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-3" />
              <p className="text-gray-600 mb-4">No upcoming lessons scheduled</p>
              <button
                onClick={() => navigate('/teacher/availability')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 rounded-lg text-white font-semibold transition"
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
                    className="bg-white rounded-xl p-5 border border-gray-200 shadow-sm hover:border-emerald-500 hover:shadow-md cursor-pointer transition group"
                  >
                    {/* Date Badge */}
                    <div className="flex items-center justify-between mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        isToday
                          ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                          : isTomorrow
                          ? 'bg-amber-100 text-amber-700 border border-amber-200'
                          : 'bg-gray-100 text-gray-700 border border-gray-200'
                      }`}>
                        {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : lessonDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </span>
                      <span className="text-lg font-bold text-gray-900">
                        {lessonDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Student Info */}
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                        {lesson.student_name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 group-hover:text-emerald-600 transition">
                          {lesson.student_name}
                        </p>
                        <p className="text-sm text-gray-600">{lesson.subject}</p>
                      </div>
                    </div>

                    {/* Status Badge */}
                    {lesson.confirmation_status === 'pending' && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs font-medium rounded-full border border-orange-200">
                          ⏳ Awaiting Acknowledgment
                        </span>
                      </div>
                    )}
                    {lesson.confirmation_status === 'acknowledged' && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-medium rounded-full border border-green-200">
                          ✓ Confirmed
                        </span>
                      </div>
                    )}

                    {/* Duration */}
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
                      <Clock className="w-4 h-4" />
                      <span>{lesson.duration_minutes} minutes</span>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap gap-2">
                      {lesson.confirmation_status === 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAcknowledgingLesson(lesson);
                            }}
                            className="flex-1 text-xs bg-green-600 text-white hover:bg-green-700 px-3 py-2 rounded-lg transition font-medium"
                          >
                            ✓ Confirm
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDecliningLesson(lesson);
                            }}
                            className="flex-1 text-xs bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-2 rounded-lg transition font-medium"
                          >
                            ✗ Decline
                          </button>
                        </>
                      )}
                      {lesson.confirmation_status !== 'pending' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/reschedule-lesson?lessonId=${lesson.id}`);
                            }}
                            className="flex-1 text-xs bg-blue-100 text-blue-700 hover:bg-blue-200 px-3 py-2 rounded-lg transition font-medium flex items-center justify-center gap-1"
                          >
                            <Calendar className="w-3 h-3" />
                            Reschedule
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setCancellingLesson(lesson);
                            }}
                            className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50 px-3 py-2 rounded-lg transition flex items-center gap-1"
                          >
                            <XCircle className="w-3 h-3" />
                            Cancel
                          </button>
                        </>
                      )}
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
          {isIndependent ? (
            <>
              {/* Insights Stats for Independent Teachers */}
              <div className="bg-gradient-to-br from-blue-500/10 to-indigo-600/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <Zap className="w-5 h-5 text-blue-400" />
                  Insights Stats
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Lessons</span>
                    <span className="font-semibold text-white">{insightsStats.total}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">With AI Insights</span>
                    <span className="font-semibold text-blue-400">{insightsStats.withInsights}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Adoption Rate</span>
                    <span className="font-semibold text-emerald-400">
                      {insightsStats.total > 0
                        ? `${Math.round((insightsStats.withInsights / insightsStats.total) * 100)}%`
                        : '-'}
                    </span>
                  </div>
                  {/* Progress bar */}
                  {insightsStats.total > 0 && (
                    <div className="mt-3">
                      <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                          style={{
                            width: `${Math.min(100, (insightsStats.withInsights / insightsStats.total) * 100)}%`
                          }}
                        />
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Students who add AI Insights get study notes, quizzes & revision materials after each lesson
                </p>
              </div>

              {/* Teaching Summary for Independent Teachers */}
              <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
                <h3 className="text-xl font-bold text-white mb-3 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-400" />
                  Teaching Summary
                </h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Hours Taught</span>
                    <span className="font-semibold text-white">{stats?.hours_taught?.toFixed(1) || '0.0'}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Total Students</span>
                    <span className="font-semibold text-white">{stats?.total_students || 0}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Average Rating</span>
                    <span className="font-semibold text-amber-400">
                      {stats?.average_rating ? `${stats.average_rating.toFixed(1)} ★` : 'No reviews yet'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Your Rate</span>
                    <span className="font-semibold text-emerald-400">
                      £{independentRate.toFixed(2)}/hour
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => navigate('/teacher/edit-profile')}
                  className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-lg text-emerald-400 font-semibold transition"
                >
                  Edit Profile
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="bg-gradient-to-br from-emerald-500/10 to-green-600/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
                <h3 className="text-xl font-bold text-white mb-3">💰 Earnings Overview</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Cleared</span>
                    <span className="font-semibold text-emerald-400">
                      £{earnings?.cleared_amount.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">On Hold</span>
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

              <div className="bg-gradient-to-br from-emerald-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-6 border border-emerald-500/30">
                <h3 className="text-xl font-bold text-white mb-3">🎯 Tier Progress</h3>
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Current Tier</span>
                    <span className="font-semibold text-emerald-400">{stats?.tier_name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Hours Taught</span>
                    <span className="font-semibold text-white">{stats?.hours_taught?.toFixed(1) || '0.0'}h</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">Student Retention</span>
                    <span className="font-semibold text-emerald-400">
                      {(stats?.total_unique_students || 0) >= 5
                        ? `${(stats?.retention_rate || 0).toFixed(0)}%`
                        : 'Need 5+ students'}
                    </span>
                  </div>
                  {stats?.next_auto_tier && stats?.hours_to_next_tier !== null && stats.hours_to_next_tier > 0 && (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Next Tier</span>
                        <span className="font-semibold text-blue-400 capitalize">
                          {stats.next_auto_tier}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Hours to Promotion</span>
                        <span className="font-semibold text-amber-400">
                          {stats.hours_to_next_tier.toFixed(1)}h remaining
                        </span>
                      </div>
                      {stats.min_retention_for_next && stats.min_retention_for_next > 0 && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Retention Required</span>
                          <span className="font-semibold text-emerald-400">
                            {stats.min_retention_for_next}% ({stats.min_students_for_next}+ students)
                          </span>
                        </div>
                      )}
                      {/* Progress bar */}
                      <div className="mt-3">
                        <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 transition-all duration-500"
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
                  className="w-full px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-lg text-emerald-400 font-semibold transition"
                >
                  View Tier Details
                </button>
              </div>
            </>
          )}
        </div>

        {/* Cancel Lesson Modal */}
        {cancellingLesson && (
          <CancelLessonModal
            lesson={cancellingLesson}
            onClose={() => setCancellingLesson(null)}
            onComplete={() => {
              setCancellingLesson(null);
              loadDashboardData(); // Refresh the lessons list
            }}
          />
        )}

        {/* Acknowledge Lesson Modal */}
        {acknowledgingLesson && (
          <AcknowledgeLessonModal
            lesson={{
              lesson_id: acknowledgingLesson.id,
              student_name: acknowledgingLesson.student_name,
              scheduled_time: acknowledgingLesson.scheduled_time,
              duration_minutes: acknowledgingLesson.duration_minutes,
              subject_name: acknowledgingLesson.subject,
            }}
            onClose={() => setAcknowledgingLesson(null)}
            onComplete={() => {
              setAcknowledgingLesson(null);
              loadDashboardData();
            }}
          />
        )}

        {/* Decline Lesson Modal */}
        {decliningLesson && teacherProfileId && (
          <DeclineLessonModal
            lesson={{
              lesson_id: decliningLesson.id,
              student_name: decliningLesson.student_name,
              scheduled_time: decliningLesson.scheduled_time,
              duration_minutes: decliningLesson.duration_minutes,
              subject_name: decliningLesson.subject,
            }}
            teacherId={teacherProfileId}
            onClose={() => setDecliningLesson(null)}
            onComplete={() => {
              setDecliningLesson(null);
              loadDashboardData();
            }}
          />
        )}
      </div>
    </div>
  );
}
