import { useEffect, useState } from 'react';
import { TrendingUp, Lock, Award, Clock, Star, Users, CheckCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TierInfo {
  tier: string;
  tier_order: number;
  hourly_rate: number;
  student_price: number;
  platform_margin: number;
  icon: string;
  color: string;
  description: string;
  min_hours?: number;
  min_rating?: number;
  min_retention_rate?: number;
  min_completed_lessons?: number;
  requires_manual_approval?: boolean;
}

interface TeacherStats {
  current_tier: string;
  hourly_rate: number;
  total_hours_taught: number;
  total_lessons_completed: number;
  average_rating: number;
  student_retention_rate: number;
  tier_locked: boolean;
  eligible_for_promotion: boolean;
  promotion_blocked_reason: string | null;
}

export default function TeacherTierProgressWidget() {
  const [currentTierInfo, setCurrentTierInfo] = useState<TierInfo | null>(null);
  const [nextTierInfo, setNextTierInfo] = useState<TierInfo | null>(null);
  const [teacherStats, setTeacherStats] = useState<TeacherStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [bonuses, setBonuses] = useState<any[]>([]);

  useEffect(() => {
    loadTierProgress();
  }, []);

  async function loadTierProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get teacher profile with stats
      const { data: teacher } = await supabase
        .from('teacher_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!teacher) return;

      setTeacherStats({
        current_tier: teacher.current_tier || 'newcomer',
        hourly_rate: teacher.hourly_rate,
        total_hours_taught: teacher.total_hours_taught || 0,
        total_lessons_completed: teacher.total_lessons_completed || 0,
        average_rating: teacher.average_rating || 0,
        student_retention_rate: teacher.student_retention_rate || 0,
        tier_locked: teacher.tier_locked || false,
        eligible_for_promotion: teacher.eligible_for_promotion || false,
        promotion_blocked_reason: teacher.promotion_blocked_reason
      });

      // Get current tier info
      const { data: currentTier } = await supabase
        .from('teacher_tiers')
        .select('*')
        .eq('tier', teacher.current_tier || 'newcomer')
        .single();

      setCurrentTierInfo(currentTier);

      // Get next tier info
      if (currentTier) {
        const { data: nextTier } = await supabase
          .from('teacher_tiers')
          .select('*')
          .eq('tier_order', currentTier.tier_order + 1)
          .maybeSingle();

        setNextTierInfo(nextTier);
      }

      // Get unpaid bonuses
      const { data: unpaidBonuses } = await supabase
        .from('teacher_bonus_payments')
        .select(`
          *,
          tier_milestone_bonuses(*)
        `)
        .eq('teacher_id', teacher.id)
        .eq('paid', false);

      setBonuses(unpaidBonuses || []);

    } catch (error) {
      console.error('Error loading tier progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl p-6 animate-pulse">
        <div className="h-8 bg-white/20 rounded mb-2 w-1/2"></div>
        <div className="h-4 bg-white/20 rounded w-1/3"></div>
      </div>
    );
  }

  if (!currentTierInfo || !teacherStats) {
    return null;
  }

  const progressToNext = nextTierInfo ? {
    hours: Math.min((teacherStats.total_hours_taught / (nextTierInfo.min_hours || 1)) * 100, 100),
    rating: teacherStats.average_rating >= (nextTierInfo.min_rating || 0),
    retention: teacherStats.student_retention_rate >= (nextTierInfo.min_retention_rate || 0),
    lessons: Math.min((teacherStats.total_lessons_completed / (nextTierInfo.min_completed_lessons || 1)) * 100, 100)
  } : null;

  return (
    <div className="space-y-4">
      {/* Current Tier Card */}
      <div className="bg-gradient-to-br from-purple-600 to-purple-700 text-white rounded-2xl p-6 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <span className="text-5xl">{currentTierInfo.icon}</span>
            <div>
              <h3 className="text-2xl font-bold capitalize">{currentTierInfo.tier}</h3>
              <p className="text-purple-100 text-sm">{currentTierInfo.description}</p>
            </div>
          </div>
          {teacherStats.tier_locked && (
            <div className="bg-yellow-400 text-yellow-900 px-3 py-1 rounded-full text-xs font-semibold flex items-center space-x-1">
              <Lock className="w-3 h-3" />
              <span>Locked</span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-purple-100 text-xs mb-1">You Earn</p>
            <p className="text-2xl font-bold">£{teacherStats.hourly_rate.toFixed(2)}/hr</p>
          </div>
          <div className="bg-white/10 rounded-lg p-3 backdrop-blur-sm">
            <p className="text-purple-100 text-xs mb-1">Student Pays</p>
            <p className="text-2xl font-bold">£{currentTierInfo.student_price.toFixed(2)}/hr</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Clock className="w-4 h-4 text-purple-200" />
              <p className="text-xs text-purple-100">Hours</p>
            </div>
            <p className="text-lg font-bold">{teacherStats.total_hours_taught.toFixed(1)}</p>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Star className="w-4 h-4 text-purple-200" />
              <p className="text-xs text-purple-100">Rating</p>
            </div>
            <p className="text-lg font-bold">{teacherStats.average_rating.toFixed(1)}</p>
          </div>
          <div>
            <div className="flex items-center justify-center space-x-1 mb-1">
              <Users className="w-4 h-4 text-purple-200" />
              <p className="text-xs text-purple-100">Retention</p>
            </div>
            <p className="text-lg font-bold">{teacherStats.student_retention_rate}%</p>
          </div>
        </div>
      </div>

      {/* Unpaid Bonuses Alert */}
      {bonuses.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-600 text-white rounded-xl p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <Award className="w-6 h-6" />
            <div>
              <p className="font-bold">Congratulations! You've earned bonuses!</p>
              <p className="text-sm text-amber-100">
                Total pending: £{bonuses.reduce((sum, b) => sum + parseFloat(b.amount), 0).toFixed(2)}
              </p>
            </div>
          </div>
          <div className="mt-3 space-y-2">
            {bonuses.map(bonus => (
              <div key={bonus.id} className="bg-white/20 rounded-lg p-2 text-sm">
                <p className="font-semibold">{bonus.tier_milestone_bonuses?.icon} {bonus.description}</p>
                <p className="text-amber-100 text-xs">£{parseFloat(bonus.amount).toFixed(2)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Eligible for Promotion Alert */}
      {teacherStats.eligible_for_promotion && nextTierInfo?.requires_manual_approval && (
        <div className="bg-gradient-to-r from-yellow-500 to-amber-600 text-yellow-900 rounded-xl p-4 shadow-lg">
          <div className="flex items-center space-x-3">
            <TrendingUp className="w-6 h-6" />
            <div>
              <p className="font-bold">You're eligible for {nextTierInfo.tier}!</p>
              <p className="text-sm">
                An admin will review your qualifications soon to approve your promotion to {nextTierInfo.icon} {nextTierInfo.tier}.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Progress to Next Tier */}
      {nextTierInfo && !teacherStats.tier_locked && progressToNext && (
        <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="font-bold text-gray-900 flex items-center space-x-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                <span>Progress to {nextTierInfo.icon} {nextTierInfo.tier}</span>
              </h4>
              <p className="text-sm text-gray-600">
                Earn £{nextTierInfo.hourly_rate.toFixed(2)}/hour
                {nextTierInfo.requires_manual_approval && ' (requires admin approval)'}
              </p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Hours Progress */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700 flex items-center space-x-1">
                  <Clock className="w-4 h-4" />
                  <span>Teaching Hours</span>
                </span>
                <span className="font-semibold text-gray-900">
                  {teacherStats.total_hours_taught.toFixed(1)} / {nextTierInfo.min_hours}
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressToNext.hours}%` }}
                />
              </div>
            </div>

            {/* Rating */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 flex items-center space-x-1">
                <Star className="w-4 h-4" />
                <span>Average Rating</span>
              </span>
              <span className={`font-semibold flex items-center space-x-1 ${progressToNext.rating ? 'text-green-600' : 'text-gray-900'}`}>
                <span>{teacherStats.average_rating.toFixed(1)} / {nextTierInfo.min_rating}</span>
                {progressToNext.rating && <CheckCircle className="w-4 h-4" />}
              </span>
            </div>

            {/* Retention */}
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-700 flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Student Retention</span>
              </span>
              <span className={`font-semibold flex items-center space-x-1 ${progressToNext.retention ? 'text-green-600' : 'text-gray-900'}`}>
                <span>{teacherStats.student_retention_rate}% / {nextTierInfo.min_retention_rate}%</span>
                {progressToNext.retention && <CheckCircle className="w-4 h-4" />}
              </span>
            </div>

            {/* Lessons */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-700">Lessons Completed</span>
                <span className="font-semibold text-gray-900">
                  {teacherStats.total_lessons_completed} / {nextTierInfo.min_completed_lessons}
                </span>
              </div>
              <div className="bg-gray-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                  style={{ width: `${progressToNext.lessons}%` }}
                />
              </div>
            </div>
          </div>

          {nextTierInfo.requires_manual_approval && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                <strong>Note:</strong> {nextTierInfo.tier} tier requires admin review and approval.
                Once you meet the requirements, an admin will review your application.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Max Tier Achieved */}
      {!nextTierInfo && (
        <div className="bg-gradient-to-r from-emerald-500 to-purple-600 text-white rounded-xl p-6 text-center shadow-lg">
          <div className="text-6xl mb-3">🏆</div>
          <h4 className="text-2xl font-bold mb-2">Highest Tier Achieved!</h4>
          <p className="text-purple-100">
            You're a top-tier teacher on Talbiyah.ai! Keep up the excellent work.
          </p>
        </div>
      )}

      {/* Tier Locked Message */}
      {teacherStats.tier_locked && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
          <div className="flex items-center space-x-3 text-yellow-900">
            <Lock className="w-5 h-5" />
            <div>
              <p className="font-semibold">Your tier is locked by an admin</p>
              {teacherStats.promotion_blocked_reason && (
                <p className="text-sm text-yellow-800 mt-1">{teacherStats.promotion_blocked_reason}</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
