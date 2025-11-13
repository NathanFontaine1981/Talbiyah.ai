import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Gift, Trophy, CheckCircle, Copy, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import UpcomingSessionsCard from './UpcomingSessionsCard';
import RecentRecordingsCard from './RecentRecordingsCard';
import LearningStatsWidget from './LearningStatsWidget';
import RecommendedActionsCard from './RecommendedActionsCard';
import AnnouncementsCard from './AnnouncementsCard';
import MyLearningJourneyCard from './MyLearningJourneyCard';
import PrayerTimesWidget from './PrayerTimesWidget';
import PointsRedemption from './PointsRedemption';
import DashboardHeader from './DashboardHeader';
import MyTeachersWidget from './MyTeachersWidget';

interface StudentDashboardContentProps {
  learnerId: string;
  isParentView?: boolean;
  onRefresh?: () => void;
}

interface LearnerData {
  id: string;
  name: string;
  total_xp: number;
  current_level: number;
  current_streak: number;
  referral_code?: string;
  learning_credits?: number;
  parent_id: string;
}

export default function StudentDashboardContent({
  learnerId,
  isParentView = false,
  onRefresh
}: StudentDashboardContentProps) {
  const navigate = useNavigate();
  const [learner, setLearner] = useState<LearnerData | null>(null);
  const [loading, setLoading] = useState(true);
  const [referralCopied, setReferralCopied] = useState(false);

  useEffect(() => {
    loadLearnerData();
  }, [learnerId]);

  async function loadLearnerData() {
    try {
      const { data: learnerData, error } = await supabase
        .from('learners')
        .select('id, name, total_xp, current_level, current_streak, referral_code, learning_credits, parent_id')
        .eq('id', learnerId)
        .single();

      if (error) throw error;

      // Generate referral code if it doesn't exist
      if (learnerData && !learnerData.referral_code) {
        const newCode = await generateReferralCode(learnerData.id, learnerData.name);
        if (newCode) {
          learnerData.referral_code = newCode;
        }
      }

      setLearner(learnerData);
    } catch (err) {
      console.error('Error loading learner data:', err);
    } finally {
      setLoading(false);
    }
  }

  async function generateReferralCode(learnerId: string, learnerName: string) {
    try {
      const name = (learnerName || 'student').toLowerCase().replace(/[^a-z0-9]/g, '').substring(0, 8);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      const code = `${name || 'student'}-${random}`;

      const { error } = await supabase
        .from('learners')
        .update({ referral_code: code })
        .eq('id', learnerId);

      if (error) throw error;
      return code;
    } catch (error) {
      console.error('Error generating referral code:', error);
      return null;
    }
  }

  function copyReferralLink() {
    if (!learner?.referral_code) return;

    const referralLink = `${window.location.origin}/signup?ref=${learner.referral_code}`;
    navigator.clipboard.writeText(referralLink);
    setReferralCopied(true);
    setTimeout(() => setReferralCopied(false), 2000);
  }

  async function handleRefresh() {
    await loadLearnerData();
    if (onRefresh) {
      onRefresh();
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!learner) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-slate-600">Unable to load student data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-[1600px] mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2">
          <DashboardHeader
            userName={learner.name.split(' ')[0]}
            userRole="Student"
            userLevel={learner.current_level || 1}
            userPoints={learner.total_xp || 0}
          />
        </div>

        <div className="lg:col-span-1">
          <PrayerTimesWidget userRole="Student" />
        </div>
      </div>

      {learner.referral_code && (
        <div className="bg-white rounded-2xl p-8 mb-6 border border-slate-200 shadow-lg">
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-3">
                <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-xl flex items-center justify-center">
                  <Gift className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-slate-900">Earn Free Lessons</h3>
              </div>
              <p className="text-slate-700 mb-3 text-lg">
                Share Talbiyah.ai with friends and earn 1 free hour for every 10 hours they complete!
              </p>
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg">
                  <Trophy className="w-5 h-5 text-amber-600" />
                  <span className="font-semibold text-slate-900">{learner.learning_credits?.toFixed(1) || 0} Free Hours Earned</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-6 min-w-[320px] border border-slate-200">
              <label className="text-sm font-semibold text-slate-700 mb-2 block">Your Referral Code</label>
              <div className="flex items-center space-x-2 mb-3">
                <div className="flex-1 px-4 py-3 bg-white border border-slate-300 rounded-lg font-mono text-xl font-bold text-emerald-600 text-center">
                  {learner.referral_code}
                </div>
                <button
                  onClick={copyReferralLink}
                  className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center space-x-2"
                >
                  {referralCopied ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : (
                    <Copy className="w-5 h-5" />
                  )}
                </button>
              </div>
              <div className="mb-3 p-2 bg-white border border-slate-200 rounded text-xs text-slate-600 break-all">
                {`${window.location.origin}/signup?ref=${learner.referral_code}`}
              </div>
              <button
                onClick={() => navigate('/refer')}
                className="w-full px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
              >
                <span>View Full Details</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
        <div className="lg:col-span-3 space-y-6">
          <UpcomingSessionsCard learnerId={learner.id} />
          <RecentRecordingsCard learnerId={learner.id} />
          <MyLearningJourneyCard learnerId={learner.id} />
        </div>

        <div className="lg:col-span-1 space-y-6">
          <LearningStatsWidget learnerId={learner.id} />
          <MyTeachersWidget learnerId={learner.id} />
          <PointsRedemption
            learnerId={learner.id}
            currentPoints={learner.total_xp || 0}
            onRedemption={handleRefresh}
          />
          <RecommendedActionsCard />
          <AnnouncementsCard />
        </div>
      </div>
    </div>
  );
}
