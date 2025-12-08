import { useEffect, useState } from 'react';
import { Copy, Check, Gift, Users, Share2, DollarSign } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface ReferralStats {
  referralCode: string;
  tier: string;
  tierIcon: string;
  totalReferrals: number;
  activeReferrals: number;
  availableBalance: number;
  availableHours: number;
  referredHours: number;
  conversionBonus: number;
  hourlyMultiplier: number;
}

export default function ReferralWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    loadReferralStats();
  }, []);

  async function loadReferralStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is a teacher - teachers cannot participate in referrals
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code, roles')
        .eq('id', user.id)
        .single();

      if (profile?.roles && profile.roles.includes('teacher')) {
        setIsTeacher(true);
        setLoading(false);
        return;
      }

      // Get or create referral credits
      let credits;
      const { data: existingCredits, error: creditsError } = await supabase
        .from('referral_credits')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      credits = existingCredits;

      if (!credits && !creditsError) {
        const { data: newCredits, error: insertError } = await supabase
          .from('referral_credits')
          .insert({ user_id: user.id })
          .select()
          .single();

        if (!insertError) {
          credits = newCredits;
        }
      }

      // If credits still null or table doesn't exist, exit silently
      if (!credits) {
        setLoading(false);
        return;
      }

      // Get tier info
      const { data: tierInfo } = await supabase
        .from('referral_tiers')
        .select('*')
        .eq('tier', credits.tier)
        .single();

      // Count referrals
      const { data: referrals } = await supabase
        .from('referrals')
        .select('id')
        .eq('referrer_id', user.id);

      setStats({
        referralCode: profile?.referral_code || '',
        tier: credits.tier,
        tierIcon: tierInfo?.icon || '🥉',
        totalReferrals: referrals?.length || 0,
        activeReferrals: credits.active_referrals || 0,
        availableBalance: credits.available_balance || 0,
        availableHours: credits.available_hours || 0,
        referredHours: credits.referred_hours || 0,
        conversionBonus: tierInfo?.conversion_bonus || 5,
        hourlyMultiplier: tierInfo?.hourly_multiplier || 1.0,
      });
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoading(false);
    }
  }

  function getReferralUrl() {
    if (!stats?.referralCode) return '';
    return `${window.location.origin}/signup?ref=${stats.referralCode}`;
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

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700/50 rounded w-32"></div>
          <div className="h-20 bg-slate-700/50 rounded"></div>
        </div>
      </div>
    );
  }

  // Don't show referral widget to teachers
  if (isTeacher) return null;

  if (!stats) return null;

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center">
            <span className="text-3xl">{stats.tierIcon}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-white">Referral Rewards</h3>
            <p className="text-xs text-emerald-300 uppercase font-semibold">{stats.tier} Tier</p>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-slate-400">Available Balance</span>
          <DollarSign className="w-4 h-4 text-emerald-400" />
        </div>
        <p className="text-3xl font-bold text-white mb-1">£{stats.availableBalance.toFixed(2)}</p>
        <p className="text-sm text-emerald-400">{stats.availableHours.toFixed(1)} free lessons</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Referrals</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.totalReferrals}</p>
          <p className="text-xs text-emerald-400">{stats.activeReferrals} active</p>
        </div>

        <div className="bg-slate-800/30 rounded-xl p-3 border border-slate-700/50">
          <div className="flex items-center space-x-2 mb-2">
            <Gift className="w-4 h-4 text-cyan-400" />
            <span className="text-xs text-slate-400">Referred Hours</span>
          </div>
          <p className="text-2xl font-bold text-white">{stats.referredHours.toFixed(1)}</p>
          <p className="text-xs text-slate-400">total hours learned</p>
        </div>
      </div>

      {/* Quick Link */}
      <div className="mb-6">
        <label className="text-xs text-slate-400 mb-2 block">Your Link</label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={getReferralUrl()}
            readOnly
            className="flex-1 px-3 py-2 bg-slate-800/50 border border-slate-700 rounded-lg text-xs text-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
          />
          <button
            onClick={copyReferralLink}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center space-x-1"
          >
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* How it Works */}
      <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-4">
        <h4 className="text-sm font-bold text-emerald-300 mb-3 flex items-center space-x-2">
          <Share2 className="w-4 h-4" />
          <span>How It Works</span>
        </h4>
        <div className="space-y-2 text-sm">
          <p className="text-white font-semibold leading-relaxed">
            • Get <span className="text-emerald-400">£15 discount</span> for every 10 hours your referrals complete
          </p>
          <p className="text-slate-300 text-xs leading-relaxed">
            Your balance automatically applies at checkout - no codes needed!
          </p>
          <div className="bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-lg p-3 border border-emerald-500/30 mt-3">
            <p className="text-emerald-200 font-semibold text-xs">
              📊 Track: {stats.referredHours.toFixed(1)} / {Math.ceil(stats.referredHours / 10) * 10} hours to next reward
            </p>
          </div>
          <div className="bg-gradient-to-r from-cyan-500/10 to-emerald-500/10 rounded-lg p-3 border border-cyan-500/30 mt-2">
            <p className="text-cyan-200 font-semibold text-xs text-center">
              🎁 Share your link and start earning!
            </p>
          </div>
        </div>
      </div>

      {/* View Full Dashboard */}
      <button
        onClick={() => navigate('/my-referrals')}
        className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
      >
        <span>View Full Dashboard</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
