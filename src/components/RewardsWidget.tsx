import { useState, useEffect } from 'react';
import { Gift, Users, Flame, Copy, CheckCircle, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ReferralStats {
  referralCode: string;
  learningCredits: number;
  loginStreak: number;
  totalPoints: number;
  totalReferrals: number;
  referralProgress: {
    referred_id: string;
    learner_name: string;
    hours_completed: number;
    credits_awarded: number;
  }[];
}

export default function RewardsWidget() {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchRewardsData();
  }, []);

  async function fetchRewardsData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: learner } = await supabase
        .from('learners')
        .select('id, referral_code, learning_credits, login_streak, total_points')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (!learner) {
        setLoading(false);
        return;
      }

      const { data: referrals } = await supabase
        .from('referrals')
        .select(`
          referred_id,
          hours_completed,
          credits_awarded,
          learners!referrals_referred_id_fkey(name)
        `)
        .eq('referrer_id', learner.id);

      const referralProgress = (referrals || []).map((ref: any) => ({
        referred_id: ref.referred_id,
        learner_name: ref.learners?.name || 'Unknown',
        hours_completed: parseFloat(ref.hours_completed),
        credits_awarded: ref.credits_awarded
      }));

      setStats({
        referralCode: learner.referral_code,
        learningCredits: parseFloat(learner.learning_credits),
        loginStreak: learner.login_streak,
        totalPoints: learner.total_points,
        totalReferrals: referralProgress.length,
        referralProgress
      });
    } catch (err) {
      console.error('Error fetching rewards data:', err);
    } finally {
      setLoading(false);
    }
  }

  function copyReferralLink() {
    if (!stats) return;

    const referralLink = `${window.location.origin}/signup?ref=${stats.referralCode}`;
    navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (loading) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/2 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="bg-gradient-to-br from-emerald-50 to-cyan-50 rounded-xl p-6 border border-emerald-200">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl flex items-center justify-center">
          <Gift className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Rewards & Referrals</h3>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center space-x-2 mb-2">
            <Gift className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-gray-600">Free Credits</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {Math.floor(stats.learningCredits)}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-orange-200">
          <div className="flex items-center space-x-2 mb-2">
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="text-sm text-gray-600">Login Streak</span>
          </div>
          <div className="text-2xl font-bold text-orange-600">
            {stats.loginStreak} days
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border border-cyan-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-sm text-gray-600">Referrals</span>
          </div>
          <div className="text-2xl font-bold text-emerald-600">
            {stats.totalReferrals}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg p-4 mb-4 border border-emerald-200">
        <label className="text-sm font-medium text-gray-700 mb-2 block">
          Your Referral Code
        </label>
        <div className="flex items-center space-x-2">
          <div className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg font-mono text-lg font-bold text-emerald-600">
            {stats.referralCode}
          </div>
          <button
            onClick={copyReferralLink}
            className="px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center space-x-2"
          >
            {copied ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span className="hidden sm:inline">Copied!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span className="hidden sm:inline">Copy Link</span>
              </>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Share this link with friends. For every 10 hours they complete, you earn 1 credit!
        </p>
      </div>

      {stats.referralProgress.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-emerald-200">
          <div className="flex items-center space-x-2 mb-3">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <h4 className="font-semibold text-gray-900">Your Referral Progress</h4>
          </div>
          <div className="space-y-3">
            {stats.referralProgress.map((referral) => {
              const hoursToNextCredit = 10 - (referral.hours_completed % 10);
              const progressPercent = (referral.hours_completed % 10) / 10 * 100;

              return (
                <div key={referral.referred_id} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700">
                      {referral.learner_name}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.floor(referral.hours_completed)} hrs completed
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                      ></div>
                    </div>
                    <span className="text-xs font-semibold text-emerald-600">
                      {referral.credits_awarded} credits
                    </span>
                  </div>
                  <p className="text-xs text-gray-500">
                    {Math.ceil(hoursToNextCredit)} more hours to next credit
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
