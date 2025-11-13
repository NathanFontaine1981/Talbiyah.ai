import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gift, Users, Trophy, TrendingUp, Share2, Copy, Check,
  Award, Target, Zap, Star, Crown, ArrowRight, ExternalLink,
  Facebook, Twitter, MessageCircle as WhatsApp, Mail, Link2
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface Tier {
  id: string;
  tier_name: string;
  tier_level: number;
  min_referrals: number;
  max_referrals: number | null;
  reward_multiplier: number;
  badge_icon: string;
  badge_color: string;
  tier_benefits: string[];
  initial_reward_hours: number;
  ongoing_reward_rate: number;
  hours_per_milestone: number;
}

interface Achievement {
  id: string;
  achievement_name: string;
  achievement_description: string;
  achievement_icon: string;
  achievement_type: string;
  points_reward: number;
  credits_reward: number;
  earned_at?: string;
}

interface ReferralStats {
  total_referrals: number;
  completed_referrals: number;
  pending_referrals: number;
  total_rewards: number;
  current_tier: Tier | null;
  next_tier: Tier | null;
  progress_to_next_tier: number;
  referral_code: string;
  recent_referrals: any[];
  rank: number | null;
}

export default function ReferralDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [tiers, setTiers] = useState<Tier[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<Achievement[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);

  useEffect(() => {
    loadReferralData();
  }, []);

  async function loadReferralData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Load tiers
      const { data: tiersData } = await supabase
        .from('referral_tiers')
        .select('*')
        .order('tier_level');

      setTiers(tiersData || []);

      // Load all achievements
      const { data: achievementsData } = await supabase
        .from('referral_achievements')
        .select('*')
        .eq('is_hidden', false)
        .order('requirement_value');

      setAchievements(achievementsData || []);

      // Load user's earned achievements
      const { data: userAchievementsData } = await supabase
        .from('user_achievements')
        .select(`
          achievement_id,
          earned_at,
          achievement:referral_achievements(*)
        `)
        .eq('user_id', user.id);

      const earnedAchievements = userAchievementsData?.map((ua: any) => ({
        ...ua.achievement,
        earned_at: ua.earned_at
      })) || [];
      setUserAchievements(earnedAchievements);

      // Load referral stats
      const { data: referrals } = await supabase
        .from('referrals')
        .select(`
          *,
          tier:referral_tiers(*),
          referred_user:profiles!referrals_referred_user_id_fkey(full_name, avatar_url)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      const completedReferrals = referrals?.filter(r => r.status === 'completed').length || 0;
      const pendingReferrals = referrals?.filter(r => r.status === 'pending').length || 0;
      const totalRewards = referrals?.filter(r => r.status === 'rewarded')
        .reduce((sum, r) => sum + (r.reward_amount || 0), 0) || 0;

      // Determine current tier
      const currentTier = tiersData?.find(t =>
        completedReferrals >= t.min_referrals &&
        (t.max_referrals === null || completedReferrals <= t.max_referrals)
      ) || null;

      // Determine next tier
      const nextTier = tiersData?.find(t => t.tier_level === (currentTier?.tier_level || 0) + 1) || null;

      // Calculate progress
      let progressToNextTier = 100;
      if (nextTier) {
        const referralsInCurrentTier = completedReferrals - (currentTier?.min_referrals || 0);
        const referralsNeededForNextTier = nextTier.min_referrals - (currentTier?.min_referrals || 0);
        progressToNextTier = Math.min(100, (referralsInCurrentTier / referralsNeededForNextTier) * 100);
      }

      // Get referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      // Get rank from leaderboard
      const { data: leaderboard } = await supabase
        .from('referral_leaderboard')
        .select('id, rank')
        .eq('id', user.id)
        .single();

      setStats({
        total_referrals: referrals?.length || 0,
        completed_referrals: completedReferrals,
        pending_referrals: pendingReferrals,
        total_rewards: totalRewards,
        current_tier: currentTier,
        next_tier: nextTier,
        progress_to_next_tier: progressToNextTier,
        referral_code: profile?.referral_code || '',
        recent_referrals: referrals?.slice(0, 5) || [],
        rank: leaderboard?.rank || null
      });

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getReferralUrl() {
    if (!stats?.referral_code) return '';
    return `${window.location.origin}/signup?ref=${stats.referral_code}`;
  }

  async function copyReferralLink() {
    const url = getReferralUrl();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  }

  function shareVia(platform: string) {
    const url = encodeURIComponent(getReferralUrl());
    const text = encodeURIComponent('Join me on Talbiyah.ai - The future of Islamic learning with AI-powered insights! 🕌');

    const shareUrls: Record<string, string> = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
      twitter: `https://twitter.com/intent/tweet?url=${url}&text=${text}`,
      whatsapp: `https://wa.me/?text=${text}%20${url}`,
      email: `mailto:?subject=Join Talbiyah.ai&body=${text}%20${url}`
    };

    if (shareUrls[platform]) {
      window.open(shareUrls[platform], '_blank');
    }
    setShareMenuOpen(false);
  }

  const getTierColor = (tierName: string) => {
    const colors: Record<string, string> = {
      'Bronze': 'from-amber-600 to-amber-700',
      'Silver': 'from-slate-400 to-slate-600',
      'Gold': 'from-yellow-400 to-yellow-600',
      'Platinum': 'from-cyan-400 to-cyan-600',
      'Diamond': 'from-purple-500 to-purple-700'
    };
    return colors[tierName] || 'from-gray-400 to-gray-600';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-cyan-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-600 to-blue-600 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-white/80 hover:text-white mb-4 flex items-center space-x-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Referral Dashboard</h1>
              <p className="text-cyan-100 mb-1">Share the gift of Islamic learning and earn free lesson hours</p>
              <p className="text-cyan-200/80 text-sm">
                🎁 Initial reward: 1-5h • Ongoing: 1-3h per 10h they complete • Climb tiers for more!
              </p>
            </div>

            {stats?.rank && (
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-6 py-4 border border-white/20">
                <div className="flex items-center space-x-3">
                  <Trophy className="w-8 h-8 text-amber-400" />
                  <div>
                    <p className="text-sm text-cyan-100">Your Rank</p>
                    <p className="text-3xl font-bold">#{stats.rank}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-6 h-6 text-cyan-400" />
              <span className="text-slate-400">Total Referrals</span>
            </div>
            <p className="text-4xl font-bold">{stats?.total_referrals || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-2">
              <Check className="w-6 h-6 text-emerald-400" />
              <span className="text-slate-400">Completed</span>
            </div>
            <p className="text-4xl font-bold text-emerald-400">{stats?.completed_referrals || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-2">
              <TrendingUp className="w-6 h-6 text-amber-400" />
              <span className="text-slate-400">Pending</span>
            </div>
            <p className="text-4xl font-bold text-amber-400">{stats?.pending_referrals || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-2">
              <Gift className="w-6 h-6 text-purple-400" />
              <span className="text-slate-400">Free Hours Earned</span>
            </div>
            <p className="text-4xl font-bold text-purple-400">{stats?.total_rewards.toFixed(1) || '0.0'}h</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Current Tier & Progress */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
              <h2 className="text-2xl font-bold mb-6 flex items-center space-x-2">
                <Crown className="w-6 h-6 text-amber-400" />
                <span>Your Tier Progress</span>
              </h2>

              {stats?.current_tier && (
                <div className={`bg-gradient-to-r ${getTierColor(stats.current_tier.tier_name)} rounded-xl p-6 mb-6`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <span className="text-5xl">{stats.current_tier.badge_icon}</span>
                      <div>
                        <h3 className="text-3xl font-bold">{stats.current_tier.tier_name}</h3>
                        <p className="text-white/90 text-xl font-semibold">
                          {stats.current_tier.initial_reward_hours}h initial + {stats.current_tier.ongoing_reward_rate}h per 10h
                        </p>
                        <p className="text-white/60 text-sm">
                          Free lesson hours for you when they complete lessons
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-white/60">Tier Benefits</p>
                      <p className="text-lg font-semibold">{stats.current_tier.tier_benefits.length} Active</p>
                    </div>
                  </div>
                </div>
              )}

              {stats?.next_tier && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-slate-400">Progress to {stats.next_tier.tier_name}</span>
                    <span className="text-white font-semibold">
                      {stats.completed_referrals} / {stats.next_tier.min_referrals}
                    </span>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-4 mb-4 overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-cyan-500 to-blue-500 h-full rounded-full transition-all duration-500"
                      style={{ width: `${stats.progress_to_next_tier}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <p className="text-slate-400">
                      {stats.next_tier.min_referrals - stats.completed_referrals} more referrals to unlock {stats.next_tier.tier_name}
                    </p>
                    <p className="text-emerald-400 font-semibold">
                      → {stats.next_tier.initial_reward_hours}h initial + {stats.next_tier.ongoing_reward_rate}h per 10h
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Share Section */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-2xl p-8 border border-emerald-500/30">
              <h2 className="text-2xl font-bold mb-4">Share Your Referral Link</h2>
              <p className="text-slate-300 mb-4">
                Invite friends and family to join Talbiyah.ai and earn rewards!
              </p>
              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700/50">
                <p className="text-sm text-slate-300 mb-2">
                  <strong className="text-emerald-400">How it works:</strong>
                </p>
                <ol className="text-sm text-slate-300 space-y-1.5 ml-4 list-decimal">
                  <li>Friend signs up using your link</li>
                  <li>They book and pay for their first lesson</li>
                  <li>They complete the lesson (attend + finish)</li>
                  <li>You earn {stats?.current_tier?.initial_reward_hours || 1}h free lessons! 🎉</li>
                  <li>For every 10h they complete, you earn {stats?.current_tier?.ongoing_reward_rate || 1}h more!</li>
                </ol>
                <p className="text-xs text-slate-400 mt-3">
                  💡 Initial reward after first lesson + ongoing rewards every 10h milestone
                </p>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={getReferralUrl()}
                  readOnly
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition flex items-center space-x-2"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <div className="relative">
                <button
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                  className="w-full px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share on Social Media</span>
                </button>

                {shareMenuOpen && (
                  <div className="absolute top-full mt-2 left-0 right-0 bg-slate-800 border border-slate-700 rounded-lg shadow-xl p-4 z-10">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => shareVia('facebook')}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition"
                      >
                        <Facebook className="w-5 h-5" />
                        <span>Facebook</span>
                      </button>
                      <button
                        onClick={() => shareVia('twitter')}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-sky-500 hover:bg-sky-600 rounded-lg transition"
                      >
                        <Twitter className="w-5 h-5" />
                        <span>Twitter</span>
                      </button>
                      <button
                        onClick={() => shareVia('whatsapp')}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-green-600 hover:bg-green-700 rounded-lg transition"
                      >
                        <WhatsApp className="w-5 h-5" />
                        <span>WhatsApp</span>
                      </button>
                      <button
                        onClick={() => shareVia('email')}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-slate-600 hover:bg-slate-700 rounded-lg transition"
                      >
                        <Mail className="w-5 h-5" />
                        <span>Email</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* All Tiers Overview */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4">All Tiers & Rewards</h2>
              <p className="text-slate-400 text-sm mb-6">
                Earn free lesson hours with our hybrid reward system: initial reward + ongoing rewards every 10 hours!
              </p>
              <div className="space-y-4">
                {tiers.map((tier) => {
                  return (
                    <div
                      key={tier.id}
                      className={`p-6 rounded-xl border-2 transition ${
                        stats?.current_tier?.id === tier.id
                          ? `bg-gradient-to-r ${getTierColor(tier.tier_name)} border-white/30`
                          : 'bg-slate-800/50 border-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-4xl">{tier.badge_icon}</span>
                          <div>
                            <h3 className="text-xl font-bold">{tier.tier_name}</h3>
                            <p className="text-sm text-white/70">
                              {tier.min_referrals} - {tier.max_referrals || '∞'} referrals
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-emerald-400">{tier.initial_reward_hours}h initial</p>
                          <p className="text-lg font-semibold text-cyan-400">+{tier.ongoing_reward_rate}h per 10h</p>
                          <p className="text-xs text-white/50 mt-1">ongoing rewards</p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {tier.tier_benefits.map((benefit, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1 bg-white/10 rounded-full text-xs"
                          >
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* Achievements */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Award className="w-6 h-6 text-amber-400" />
                <span>Achievements</span>
              </h2>
              <p className="text-sm text-slate-400 mb-4">
                {userAchievements.length} of {achievements.length} unlocked
              </p>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {achievements.map((achievement) => {
                  const earned = userAchievements.find(ua => ua.id === achievement.id);
                  return (
                    <div
                      key={achievement.id}
                      className={`p-4 rounded-lg border transition ${
                        earned
                          ? 'bg-gradient-to-r from-amber-500/20 to-yellow-500/20 border-amber-500/50'
                          : 'bg-slate-800/30 border-slate-700/50 opacity-60'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <span className="text-3xl">{achievement.achievement_icon}</span>
                        <div className="flex-1">
                          <h3 className="font-semibold">{achievement.achievement_name}</h3>
                          <p className="text-xs text-slate-400">{achievement.achievement_description}</p>
                          <div className="flex items-center space-x-2 mt-2 text-xs">
                            {achievement.points_reward > 0 && (
                              <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 rounded">
                                +{achievement.points_reward} pts
                              </span>
                            )}
                            {achievement.credits_reward > 0 && (
                              <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 rounded">
                                {achievement.credits_reward}h free
                              </span>
                            )}
                          </div>
                        </div>
                        {earned && <Check className="w-5 h-5 text-emerald-400" />}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent Referrals */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Recent Referrals</h2>
              <div className="space-y-3">
                {stats?.recent_referrals.length === 0 && (
                  <p className="text-slate-400 text-center py-8">No referrals yet. Start sharing!</p>
                )}
                {stats?.recent_referrals.map((referral) => (
                  <div key={referral.id} className="flex items-center space-x-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold">
                      {referral.referred_user?.full_name?.[0] || '?'}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{referral.referred_user?.full_name || 'New User'}</p>
                      <p className="text-xs text-slate-400">
                        {new Date(referral.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      referral.status === 'completed' ? 'bg-emerald-500/20 text-emerald-400' :
                      referral.status === 'pending' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-cyan-500/20 text-cyan-400'
                    }`}>
                      {referral.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* View Leaderboard */}
            <button
              onClick={() => navigate('/referral/leaderboard')}
              className="w-full px-6 py-4 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-xl font-semibold transition flex items-center justify-center space-x-2"
            >
              <Trophy className="w-5 h-5" />
              <span>View Leaderboard</span>
              <ExternalLink className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
