import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import {
  TrendingUp,
  Award,
  Clock,
  Users,
  CheckCircle,
  AlertCircle,
  Info,
  Send,
  X,
  BookOpen,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface TierInfo {
  tier: string;
  tier_level: number;
  tier_name: string;
  tier_icon: string;
  teacher_hourly_rate: number;
  student_hourly_price: number;
  platform_margin: number;
  margin_percentage: number;
  min_hours_taught: number;
  min_rating: number;
  min_retention_rate: number;
  min_students_for_retention: number;
  requires_manual_approval: boolean;
  qualifications_required: string[];
  benefits: any;
  color: string;
  badge_color: string;
}

interface TeacherStats {
  teacher_id: string;
  tier: string;
  tier_name: string;
  tier_icon: string;
  teacher_hourly_rate: number;
  student_hourly_price: number;
  platform_margin: number;
  hours_taught: number;
  average_rating: number;
  retention_rate: number;
  returning_students: number;
  total_unique_students: number;
  total_lessons: number;
  completed_lessons: number;
  tier_assigned_at: string;
  next_auto_tier: string | null;
  hours_to_next_tier: number | null;
  total_students: number;
  grandfathered_students: number;
}

interface TierHistory {
  id: string;
  from_tier: string;
  to_tier: string;
  promotion_type: string;
  promotion_reason: string;
  hours_at_promotion: number;
  rating_at_promotion: number;
  promoted_at: string;
}

interface Application {
  id: string;
  requested_tier: string;
  status: string;
  review_notes: string;
  created_at: string;
}

export default function TeacherTierDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeacherStats | null>(null);
  const [allTiers, setAllTiers] = useState<TierInfo[]>([]);
  const [history, setHistory] = useState<TierHistory[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [applicationTier, setApplicationTier] = useState<'expert' | 'master'>('expert');
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  // Application form state
  const [formData, setFormData] = useState({
    application_reason: '',
    years_experience: 0,
    english_proficiency: 'intermediate',
    intro_video_url: '',
    recitation_sample_url: '',
    certificates: [] as string[],
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Get all tiers (public info)
      const { data: tiersData } = await supabase
        .from('teacher_tiers')
        .select('*')
        .order('tier_level');

      setAllTiers(tiersData || []);

      // If user is logged in, try to get their teacher stats
      if (!user) {
        setLoading(false);
        return;
      }

      // First, get the teacher profile to get the teacher_id and retention data
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, retention_rate, returning_students, total_unique_students')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .single();

      if (!teacherProfile) {
        setLoading(false);
        return;
      }

      // Get teacher stats using the teacher_profile.id
      const { data: statsData } = await supabase
        .from('teacher_tier_stats')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .single();

      // The view may return NULL for next_auto_tier and hours_to_next_tier
      // Calculate them from the tiers data if needed
      // Also add retention data from teacher_profiles
      if (statsData && tiersData) {
        const hoursTaught = statsData.hours_taught || 0;

        // Add retention data from teacher_profiles
        statsData.retention_rate = teacherProfile.retention_rate || 0;
        statsData.returning_students = teacherProfile.returning_students || 0;
        statsData.total_unique_students = teacherProfile.total_unique_students || 0;

        // Find next auto-promotable tier
        const autoTiers = tiersData.filter(t => !t.requires_manual_approval);
        const nextTier = autoTiers.find(t => t.min_hours_taught > hoursTaught);

        if (nextTier) {
          statsData.next_auto_tier = nextTier.tier;
          statsData.hours_to_next_tier = Math.max(0, nextTier.min_hours_taught - hoursTaught);
        }
      }

      setStats(statsData);

      // Get tier history
      const { data: historyData } = await supabase
        .from('teacher_tier_history')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .order('promoted_at', { ascending: false });

      setHistory(historyData || []);

      // Get applications
      const { data: appsData } = await supabase
        .from('teacher_tier_applications')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .order('created_at', { ascending: false });

      setApplications(appsData || []);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function submitApplication() {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-teacher-application`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            requested_tier: applicationTier,
            ...formData,
          }),
        }
      );

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        setShowApplicationModal(false);
        loadData();
      } else {
        toast.error(result.error || 'Application failed');
      }
    } catch (error) {
      console.error('Error submitting application:', error);
      toast.error('Failed to submit application');
    }
  }

  const Tooltip = ({ id, text, children }: { id: string; text: string; children: React.ReactNode }) => (
    <div
      className="relative"
      onMouseEnter={() => setHoveredTooltip(id)}
      onMouseLeave={() => setHoveredTooltip(null)}
    >
      {children}
      {hoveredTooltip === id && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-xl w-64">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1">
            <div className="border-8 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );

  function getProgressToNextTier() {
    if (!stats || !stats.next_auto_tier || !allTiers.length) return null;

    const nextTier = allTiers.find((t) => t.tier === stats.next_auto_tier);
    if (!nextTier) return null;

    const hoursProgress = Math.min(100, (stats.hours_taught / nextTier.min_hours_taught) * 100);

    // Calculate retention progress - only counts if teacher has enough students
    const hasEnoughStudents = stats.total_unique_students >= (nextTier.min_students_for_retention || 5);
    const currentRetention = hasEnoughStudents ? (stats.retention_rate || 0) : 0;
    const retentionProgress = hasEnoughStudents
      ? Math.min(100, (currentRetention / nextTier.min_retention_rate) * 100)
      : 0;

    return {
      nextTier,
      hoursProgress,
      retentionProgress,
      hoursNeeded: Math.max(0, nextTier.min_hours_taught - stats.hours_taught),
      retentionNeeded: Math.max(0, nextTier.min_retention_rate - currentRetention),
      hasEnoughStudents,
      studentsNeeded: Math.max(0, (nextTier.min_students_for_retention || 5) - stats.total_unique_students),
    };
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center px-4">
        <div className="text-white text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold mb-4">Teacher Profile Required</h2>
          <p className="text-gray-600 mb-6">
            You need to be an approved teacher to view this page.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => window.location.href = '/apply-to-teach'}
              className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-lg font-semibold transition shadow-lg"
            >
              Apply to Teach
            </button>
            <button
              onClick={() => window.location.href = '/teacher/tier-info'}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 rounded-lg font-semibold transition"
            >
              View Tier Information
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = getProgressToNextTier();
  const currentTierInfo = allTiers.find((t) => t.tier === stats.tier);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to tier dashboard
      </a>

      <main id="main-content" className="max-w-7xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-6 flex items-center space-x-2 text-gray-500 hover:text-emerald-600 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Back to Dashboard</span>
        </button>

        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-500/10 to-blue-600/10 backdrop-blur-sm rounded-2xl p-8 border border-emerald-500/30 shadow-xl mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-center space-x-4">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl"
                style={{ backgroundColor: currentTierInfo?.color + '20' }}
              >
                {stats.tier_icon}
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  {stats.tier_name} Teacher
                </h1>
                <p className="text-gray-600">
                  Your current earnings rate and tier status
                </p>
                <button
                  onClick={() => navigate('/teacher/tier-info')}
                  className="mt-3 inline-flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 rounded-lg text-emerald-600 text-sm font-medium transition"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Learn About All Tiers</span>
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Your Hourly Rate</p>
              <p className="text-4xl font-bold text-emerald-400">
                £{stats.teacher_hourly_rate.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Earnings per hour taught
              </p>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Tooltip
            id="hours-taught"
            text="Total hours you've taught on the platform. More hours = higher tier eligibility."
          >
            <div className="bg-white backdrop-blur-sm rounded-xl p-6 border border-gray-200 cursor-help hover:border-emerald-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-6 h-6 text-emerald-600" />
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.hours_taught.toFixed(1)}h
              </p>
              <p className="text-sm text-gray-500">Hours Taught</p>
            </div>
          </Tooltip>

          <Tooltip
            id="retention-rate"
            text="Percentage of students who return for 2+ lessons. Higher retention unlocks advanced tiers. Requires 5+ unique students to count."
          >
            <div className="bg-white backdrop-blur-sm rounded-xl p-6 border border-gray-200 cursor-help hover:border-emerald-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">
                {stats.total_unique_students >= 5 ? `${stats.retention_rate.toFixed(0)}%` : 'N/A'}
              </p>
              <p className="text-sm text-gray-500">Student Retention</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.returning_students} of {stats.total_unique_students} students return
              </p>
            </div>
          </Tooltip>

          <Tooltip
            id="total-students"
            text="Number of unique students you've taught. Some may have locked pricing from when you were a lower tier."
          >
            <div className="bg-white backdrop-blur-sm rounded-xl p-6 border border-gray-200 cursor-help hover:border-purple-500/50 transition">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-6 h-6 text-purple-600" />
                <Info className="w-4 h-4 text-gray-400" />
              </div>
              <p className="text-3xl font-bold text-gray-900 mb-1">{stats.total_students}</p>
              <p className="text-sm text-gray-500">Total Students</p>
              <p className="text-xs text-gray-500 mt-1">
                {stats.grandfathered_students} with locked pricing
              </p>
            </div>
          </Tooltip>
        </div>

        {/* Progress to Next Tier */}
        {progress && (
          <div className="bg-gradient-to-br from-blue-500/10 to-purple-600/10 backdrop-blur-sm rounded-2xl p-6 border border-blue-500/30 shadow-xl mb-8">
            <div className="flex items-center space-x-3 mb-6">
              <TrendingUp className="w-6 h-6 text-blue-400" />
              <h2 className="text-2xl font-bold text-white">
                Progress to {progress.nextTier.tier_name}
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Hours Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Hours Taught</span>
                  <span className="text-sm font-semibold text-white">
                    {stats.hours_taught.toFixed(1)} / {progress.nextTier.min_hours_taught}h
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress.hoursProgress}%` }}
                  ></div>
                </div>
                {progress.hoursNeeded > 0 && (
                  <p className="text-xs text-gray-500">
                    {progress.hoursNeeded.toFixed(1)}h more needed
                  </p>
                )}
              </div>

              {/* Retention Progress */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Student Retention</span>
                  <span className="text-sm font-semibold text-white">
                    {progress.hasEnoughStudents
                      ? `${stats.retention_rate.toFixed(0)}% / ${progress.nextTier.min_retention_rate}%`
                      : `Need ${progress.studentsNeeded} more students`}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-gradient-to-r from-emerald-500 to-green-600 h-3 rounded-full transition-all duration-500"
                    style={{ width: `${progress.retentionProgress}%` }}
                  ></div>
                </div>
                {progress.hasEnoughStudents ? (
                  progress.retentionNeeded > 0 && (
                    <p className="text-xs text-gray-500">
                      {progress.retentionNeeded.toFixed(0)}% more retention needed
                    </p>
                  )
                ) : (
                  <p className="text-xs text-amber-400">
                    Teach {progress.studentsNeeded} more unique students to unlock retention tracking
                  </p>
                )}
              </div>
            </div>

            {progress.hoursNeeded <= 0 && progress.hasEnoughStudents && progress.retentionNeeded <= 0 && (
              <div className="mt-4 flex items-center space-x-2 text-emerald-400">
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">
                  You qualify for automatic promotion! It will happen on your next lesson.
                </span>
              </div>
            )}
          </div>
        )}

        {/* All Tiers Breakdown */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-white mb-6 flex items-center space-x-3">
            <Award className="w-6 h-6 text-emerald-600" />
            <span>All Teacher Tiers</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allTiers.map((tier) => {
              const isCurrent = tier.tier === stats.tier;
              const benefits = tier.benefits || {};

              return (
                <div
                  key={tier.tier}
                  className={`rounded-xl p-6 border-2 transition ${
                    isCurrent
                      ? 'bg-gradient-to-br from-emerald-500/20 to-blue-600/20 border-emerald-500 shadow-xl'
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  {/* Tier Header */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <span className="text-4xl">{tier.tier_icon}</span>
                      <div>
                        <h3 className={`text-xl font-bold ${isCurrent ? 'text-white' : 'text-gray-900'}`}>{tier.tier_name}</h3>
                        <p className="text-xs text-gray-500">
                          {tier.requires_manual_approval ? 'Manual Approval' : 'Auto-Promotion'}
                        </p>
                      </div>
                    </div>
                    {isCurrent && (
                      <div className="px-3 py-1 bg-emerald-500/20 border border-emerald-500 rounded-full">
                        <span className="text-xs font-bold text-emerald-600">CURRENT</span>
                      </div>
                    )}
                  </div>

                  {/* Earnings */}
                  <div className={`rounded-lg p-4 mb-4 ${isCurrent ? 'bg-white/10' : 'bg-gray-100'}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-500">Hourly Rate</span>
                      <span className="text-3xl font-bold text-emerald-600">
                        £{tier.teacher_hourly_rate.toFixed(2)}
                      </span>
                    </div>
                    <div className="text-xs text-gray-500 text-center mt-1">
                      Your earnings per hour taught
                    </div>
                  </div>

                  {/* Requirements */}
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-gray-600 mb-2">Requirements</h4>
                    <div className="space-y-2">
                      {!tier.requires_manual_approval && (
                        <>
                          <div className="flex items-center space-x-2 text-xs">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <span className="text-gray-600">{tier.min_hours_taught}+ hours taught</span>
                          </div>
                          {tier.min_retention_rate > 0 && (
                            <div className="flex items-center space-x-2 text-xs">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              <span className="text-gray-600">
                                {tier.min_retention_rate}% retention ({tier.min_students_for_retention}+ students)
                              </span>
                            </div>
                          )}
                        </>
                      )}
                      {tier.qualifications_required.slice(0, 2).map((qual, idx) => (
                        <div key={idx} className="flex items-start space-x-2 text-xs">
                          <CheckCircle className="w-3 h-3 text-emerald-400 flex-shrink-0 mt-0.5" />
                          <span className="text-gray-600">{qual}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="flex flex-wrap gap-2">
                    {benefits.priority_support && (
                      <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs text-purple-300">
                        Priority Support
                      </span>
                    )}
                    {benefits.featured_profile && (
                      <span className="px-2 py-1 bg-emerald-500/20 border border-emerald-500/30 rounded text-xs text-cyan-300">
                        Featured Profile
                      </span>
                    )}
                    {benefits.elite_teacher_badge && (
                      <span className="px-2 py-1 bg-amber-500/20 border border-amber-500/30 rounded text-xs text-amber-300">
                        Elite Badge
                      </span>
                    )}
                  </div>

                  {/* Apply Button for Expert/Master */}
                  {tier.requires_manual_approval && !isCurrent && (
                    <button
                      onClick={() => {
                        setApplicationTier(tier.tier as 'expert' | 'master');
                        setShowApplicationModal(true);
                      }}
                      className="w-full mt-4 px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                    >
                      <Send className="w-4 h-4" />
                      <span>Apply for {tier.tier_name}</span>
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Pending Applications */}
        {applications.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-white mb-4">Your Applications</h2>
            <div className="space-y-4">
              {applications.map((app) => (
                <div
                  key={app.id}
                  className="bg-gray-50 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-white capitalize">
                      {app.requested_tier} Tier Application
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        app.status === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                          : app.status === 'rejected'
                          ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  {app.review_notes && (
                    <p className="text-sm text-gray-600 mb-2">{app.review_notes}</p>
                  )}
                  <p className="text-xs text-gray-500">
                    Applied: {new Date(app.created_at).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tier History */}
        {history.length > 0 && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Tier History</h2>
            <div className="space-y-4">
              {history.map((item) => (
                <div
                  key={item.id}
                  className="bg-gray-50 backdrop-blur-sm rounded-xl p-6 border border-gray-200"
                >
                  <div className="flex items-center space-x-4 mb-2">
                    <TrendingUp className="w-5 h-5 text-emerald-400" />
                    <h3 className="text-lg font-semibold text-white">
                      {item.from_tier} → {item.to_tier}
                    </h3>
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        item.promotion_type === 'automatic'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-emerald-500/20 text-emerald-600'
                      }`}
                    >
                      {item.promotion_type}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{item.promotion_reason}</p>
                  <div className="flex items-center space-x-6 text-xs text-gray-500">
                    <span>{item.hours_at_promotion.toFixed(1)}h taught</span>
                    <span>{item.rating_at_promotion.toFixed(1)} ★ rating</span>
                    <span>{new Date(item.promoted_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="application-modal-title" className="bg-gray-100 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 id="application-modal-title" className="text-2xl font-bold text-white capitalize">
                Apply for {applicationTier} Tier
              </h2>
              <button
                onClick={() => setShowApplicationModal(false)}
                aria-label="Close application modal"
                className="text-gray-500 hover:text-white transition"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Reason */}
              <div>
                <label htmlFor="application-reason" className="block text-sm font-semibold text-gray-600 mb-2">
                  Why do you want to apply for this tier?
                </label>
                <textarea
                  id="application-reason"
                  value={formData.application_reason}
                  onChange={(e) =>
                    setFormData({ ...formData, application_reason: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  rows={4}
                  placeholder="Explain your qualifications and teaching experience..."
                />
              </div>

              {/* Years Experience */}
              <div>
                <label htmlFor="years-experience" className="block text-sm font-semibold text-gray-600 mb-2">
                  Years of Teaching Experience
                </label>
                <input
                  id="years-experience"
                  type="number"
                  value={formData.years_experience}
                  onChange={(e) =>
                    setFormData({ ...formData, years_experience: parseInt(e.target.value) })
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  min="0"
                />
              </div>

              {/* English Proficiency */}
              <div>
                <label htmlFor="english-proficiency" className="block text-sm font-semibold text-gray-600 mb-2">
                  English Proficiency
                </label>
                <select
                  id="english-proficiency"
                  value={formData.english_proficiency}
                  onChange={(e) =>
                    setFormData({ ...formData, english_proficiency: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="basic">Basic (A1-A2)</option>
                  <option value="intermediate">Intermediate (B1-B2)</option>
                  <option value="fluent">Fluent (C1+)</option>
                  <option value="native">Native/Near-Native</option>
                </select>
              </div>

              {/* Video URLs */}
              <div>
                <label htmlFor="intro-video-url" className="block text-sm font-semibold text-gray-600 mb-2">
                  Introduction Video URL (Optional)
                </label>
                <input
                  id="intro-video-url"
                  type="url"
                  value={formData.intro_video_url}
                  onChange={(e) =>
                    setFormData({ ...formData, intro_video_url: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://youtube.com/..."
                />
              </div>

              <div>
                <label htmlFor="recitation-sample-url" className="block text-sm font-semibold text-gray-600 mb-2">
                  Quran Recitation Sample URL (Optional)
                </label>
                <input
                  id="recitation-sample-url"
                  type="url"
                  value={formData.recitation_sample_url}
                  onChange={(e) =>
                    setFormData({ ...formData, recitation_sample_url: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="https://youtube.com/..."
                />
              </div>

              {/* Submit */}
              <div className="flex space-x-4">
                <button
                  onClick={submitApplication}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                >
                  <Send className="w-5 h-5" />
                  <span>Submit Application</span>
                </button>
                <button
                  onClick={() => setShowApplicationModal(false)}
                  className="px-6 py-3 bg-gray-200 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
