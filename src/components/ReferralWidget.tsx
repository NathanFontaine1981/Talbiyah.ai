import { useEffect, useState } from 'react';
import { Copy, Check, Gift, Users, Share2 } from 'lucide-react';
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
    if (!url) {
      console.error('No referral URL to copy');
      return;
    }

    try {
      // Try the modern clipboard API first
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(url);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = url;
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        textArea.style.top = '-9999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
      // Last resort fallback
      const textArea = document.createElement('textarea');
      textArea.value = url;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (e) {
        console.error('Fallback copy failed:', e);
      }
      document.body.removeChild(textArea);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 backdrop-blur-sm rounded-2xl p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-32"></div>
          <div className="h-20 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  // Don't show referral widget to teachers
  if (isTeacher) return null;

  if (!stats) return null;

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-lg">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center">
            <span className="text-3xl">{stats.tierIcon}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">Referral Rewards</h3>
            <p className="text-xs text-emerald-600 uppercase font-semibold">{stats.tier} Tier</p>
          </div>
        </div>
      </div>

      {/* Balance Display */}
      <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-200">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-600">Available Credits</span>
          <Gift className="w-4 h-4 text-emerald-600" />
        </div>
        <p className="text-3xl font-bold text-emerald-600 mb-1">{Math.floor(stats.availableHours)}</p>
        <p className="text-sm text-gray-600">free credits</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Users className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-gray-500">Referrals</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalReferrals}</p>
          <p className="text-xs text-emerald-600">{stats.activeReferrals} active</p>
        </div>

        <div className="bg-gray-50 rounded-xl p-3 border border-gray-200">
          <div className="flex items-center space-x-2 mb-2">
            <Gift className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-gray-500">Credits Earned</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{Math.floor(stats.referredHours / 10)}</p>
          <p className="text-xs text-gray-500">from referrals</p>
        </div>
      </div>

      {/* Quick Link */}
      <div className="mb-6">
        <label className="text-xs text-gray-600 mb-2 block font-medium">Your Referral Link</label>
        <div className="flex items-center space-x-2">
          <input
            type="text"
            value={getReferralUrl()}
            readOnly
            className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
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
      <div className="bg-gray-50 rounded-xl p-4 border border-gray-200 mb-4">
        <h4 className="text-sm font-bold text-emerald-600 mb-3 flex items-center space-x-2">
          <Share2 className="w-4 h-4" />
          <span>How It Works</span>
        </h4>
        <div className="space-y-2 text-sm">
          <p className="text-gray-700 font-medium leading-relaxed">
            • <span className="text-emerald-600 font-bold">1 Credit</span> when they complete their first lesson
          </p>
          <p className="text-gray-700 font-medium leading-relaxed">
            • <span className="text-emerald-600 font-bold">1 Credit</span> for every 10 hours they learn
          </p>
          <p className="text-gray-500 text-xs leading-relaxed mt-2">
            1 Credit = 1 Free Lesson Hour. Credits never expire!
          </p>
        </div>
      </div>

      {/* View Full Dashboard */}
      <button
        onClick={() => navigate('/my-referrals')}
        className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-green-600 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
      >
        <span>View Full Dashboard</span>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
    </div>
  );
}
