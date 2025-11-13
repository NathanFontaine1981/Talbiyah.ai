import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Gift, Users, Trophy, Copy, Check, ArrowRight, Send, Share2,
  TrendingUp, Award, Crown, Star, Sparkles, Clock, DollarSign, Info, HelpCircle, ChevronDown, ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface ReferralCredits {
  tier: string;
  total_referrals: number;
  active_referrals: number;
  total_earned: number;
  available_balance: number;
  earned_hours: number;
  available_hours: number;
  referred_hours: number;
  transfer_limit_monthly: number;
  transfers_this_month: number;
  transferred_hours: number;
}

interface TierInfo {
  tier: string;
  min_referrals: number;
  max_referrals: number | null;
  unlock_bonus: number;
  conversion_bonus: number;
  hourly_multiplier: number;
  transfer_limit_monthly: number;
  benefits: Record<string, boolean>;
  color: string;
  icon: string;
}

interface Referral {
  id: string;
  referred_user_id: string;
  status: string;
  completed_lessons: number;
  total_hours: number;
  credits_earned: number;
  conversion_paid: boolean;
  created_at: string;
  last_lesson_date: string | null;
  referred_user: {
    full_name: string;
    email: string;
  };
}

interface Transaction {
  id: string;
  type: string;
  credit_amount: number;
  hours_amount: number;
  description: string;
  created_at: string;
  transfer_from_user_id: string | null;
  transfer_to_user_id: string | null;
}

export default function MyReferrals() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [credits, setCredits] = useState<ReferralCredits | null>(null);
  const [tierInfo, setTierInfo] = useState<TierInfo | null>(null);
  const [nextTier, setNextTier] = useState<TierInfo | null>(null);
  const [referralCode, setReferralCode] = useState('');
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [copied, setCopied] = useState(false);

  // Transfer state
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferEmail, setTransferEmail] = useState('');
  const [transferHours, setTransferHours] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [transferring, setTransferring] = useState(false);
  const [hoveredTooltip, setHoveredTooltip] = useState<string | null>(null);

  // FAQ state
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);

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

      // Get user's referral code
      const { data: profile } = await supabase
        .from('profiles')
        .select('referral_code')
        .eq('id', user.id)
        .single();

      setReferralCode(profile?.referral_code || '');

      // Get or create referral credits
      let { data: creditsData } = await supabase
        .from('referral_credits')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (!creditsData) {
        // Create default credits
        const { data: newCredits } = await supabase
          .from('referral_credits')
          .insert({ user_id: user.id })
          .select()
          .single();
        creditsData = newCredits;
      }

      setCredits(creditsData);

      // Get tier info
      const { data: tierData } = await supabase
        .from('referral_tiers')
        .select('*')
        .eq('tier', creditsData.tier)
        .single();

      setTierInfo(tierData);

      // Get next tier
      const { data: nextTierData } = await supabase
        .from('referral_tiers')
        .select('*')
        .gt('min_referrals', creditsData.active_referrals)
        .order('min_referrals', { ascending: true })
        .limit(1)
        .single();

      setNextTier(nextTierData);

      // Get all referrals
      const { data: referralsData } = await supabase
        .from('referrals')
        .select(`
          *,
          referred_user:profiles!referrals_referred_user_id_fkey(full_name, email)
        `)
        .eq('referrer_id', user.id)
        .order('created_at', { ascending: false });

      setReferrals(referralsData || []);

      // Get recent transactions
      const { data: transactionsData } = await supabase
        .from('referral_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      setTransactions(transactionsData || []);

    } catch (error) {
      console.error('Error loading referral data:', error);
    } finally {
      setLoading(false);
    }
  }

  function getReferralUrl() {
    if (!referralCode) return '';
    return `${window.location.origin}/signup?ref=${referralCode}`;
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

  function shareOnWhatsApp() {
    const url = encodeURIComponent(getReferralUrl());
    const text = encodeURIComponent(
      `🕌 Join me on Talbiyah.ai - Learn Islam with expert teachers!\n\n✨ Sign up with my link and get started with Islamic learning today.\n\n`
    );
    window.open(`https://wa.me/?text=${text}${url}`, '_blank');
  }

  async function handleTransfer() {
    if (!transferEmail || !transferHours) return;

    setTransferring(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/transfer-hours`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            to_email: transferEmail,
            hours_amount: parseFloat(transferHours),
            message: transferMessage,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Transfer failed');
      }

      alert(`✅ Successfully transferred ${transferHours}h to ${result.recipient}!\n\nYou have ${result.remaining}h remaining.`);

      // Reset form and reload data
      setShowTransferModal(false);
      setTransferEmail('');
      setTransferHours('');
      setTransferMessage('');
      loadReferralData();

    } catch (error: any) {
      alert(`❌ Transfer failed: ${error.message}`);
    } finally {
      setTransferring(false);
    }
  }

  function getTierColor(tier: string) {
    const colors: Record<string, string> = {
      bronze: '#CD7F32',
      silver: '#C0C0C0',
      gold: '#FFD700',
      platinum: '#E5E4E2',
    };
    return colors[tier] || '#CD7F32';
  }

  function getTierGradient(tier: string) {
    const gradients: Record<string, string> = {
      bronze: 'from-amber-600 to-amber-800',
      silver: 'from-slate-400 to-slate-600',
      gold: 'from-yellow-400 to-yellow-600',
      platinum: 'from-purple-400 to-purple-600',
    };
    return gradients[tier] || 'from-amber-600 to-amber-800';
  }

  // Tooltip component
  const Tooltip = ({ id, text, children }: { id: string; text: string; children: React.ReactNode }) => (
    <div
      className="relative"
      onMouseEnter={() => setHoveredTooltip(id)}
      onMouseLeave={() => setHoveredTooltip(null)}
    >
      {children}
      {hoveredTooltip === id && (
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-slate-900 border border-slate-700 rounded-lg shadow-xl w-64">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-300 leading-relaxed">{text}</p>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-slate-700"></div>
        </div>
      )}
    </div>
  );

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
      <div className={`bg-gradient-to-r ${getTierGradient(credits?.tier || 'bronze')} py-12 px-6`}>
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
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-5xl">{tierInfo?.icon || '🥉'}</span>
                <div>
                  <h1 className="text-4xl font-bold">
                    {tierInfo?.tier ? `${tierInfo.tier.charAt(0).toUpperCase()}${tierInfo.tier.slice(1)}` : 'Bronze'} Tier
                  </h1>
                  <p className="text-white/90 text-lg">Referral Dashboard</p>
                </div>
              </div>
              <p className="text-white/80 mt-2">
                Earn rewards by sharing Talbiyah.ai with friends and family
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/20">
              <div className="text-center">
                <p className="text-sm text-white/70 mb-1">Available Balance</p>
                <p className="text-4xl font-bold">£{credits?.available_balance.toFixed(2)}</p>
                <p className="text-lg text-white/80 mt-1">{credits?.available_hours.toFixed(1)}h free lessons</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-6 h-6 text-cyan-400" />
              <span className="text-slate-400">Total Referrals</span>
            </div>
            <p className="text-4xl font-bold">{credits?.total_referrals || 0}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="w-6 h-6 text-emerald-400" />
              <span className="text-slate-400">Active Referrals</span>
            </div>
            <p className="text-4xl font-bold text-emerald-400">{credits?.active_referrals || 0}</p>
            <p className="text-xs text-slate-400 mt-1">Completed ≥1 lesson</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-2">
              <DollarSign className="w-6 h-6 text-amber-400" />
              <span className="text-slate-400">Total Earned</span>
            </div>
            <p className="text-4xl font-bold text-amber-400">£{credits?.total_earned.toFixed(2)}</p>
          </div>

          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="w-6 h-6 text-purple-400" />
              <span className="text-slate-400">Referred Hours</span>
            </div>
            <p className="text-4xl font-bold text-purple-400">{credits?.referred_hours.toFixed(1)}h</p>
            <p className="text-xs text-slate-400 mt-1">Total lessons completed</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-8">
            {/* Share Referral Link */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-teal-600/10 rounded-2xl p-8 border border-emerald-500/30">
              <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                <Share2 className="w-6 h-6 text-emerald-400" />
                <span>Share Your Referral Link</span>
              </h2>

              <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700/50">
                <h3 className="text-sm font-bold text-emerald-400 mb-3">How You Earn:</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-400 font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Conversion Bonus</p>
                      <p className="text-sm text-slate-300">£{tierInfo?.conversion_bonus} when they complete their first paid lesson</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-cyan-400 font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-white">Lifetime Learning Hours</p>
                      <p className="text-sm text-slate-300">
                        £15 × {tierInfo?.hourly_multiplier}x = £{(15 * (tierInfo?.hourly_multiplier || 1)).toFixed(2)} per 10 hours they complete
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Every 10h milestone = 1 free lesson hour for you!</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={getReferralUrl()}
                  readOnly
                  className="flex-1 px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-lg text-slate-300 text-sm"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg font-semibold transition flex items-center space-x-2"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <button
                onClick={shareOnWhatsApp}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Share on WhatsApp</span>
              </button>
            </div>

            {/* All Tiers Overview */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
              <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <span>Tier System & Requirements</span>
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                Unlock higher tiers by getting more active referrals (users who complete at least 1 paid lesson)
              </p>

              <div className="space-y-4">
                {/* Bronze Tier */}
                <div className={`relative overflow-hidden rounded-xl border-2 transition ${
                  credits?.tier === 'bronze'
                    ? 'border-amber-600/50 bg-gradient-to-r from-amber-600/20 to-amber-800/20'
                    : 'border-slate-700 bg-slate-800/30'
                }`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-5xl">🥉</span>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Bronze Tier</h3>
                          <p className="text-sm text-slate-400">0-4 Active Referrals</p>
                        </div>
                      </div>
                      {credits?.tier === 'bronze' && (
                        <span className="px-4 py-2 bg-amber-500/20 text-amber-400 rounded-full text-sm font-semibold">
                          Current Tier
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <Tooltip
                        id="bronze-unlock"
                        text="One-time bonus you receive when you first reach this tier. This is awarded instantly when you hit the required number of active referrals."
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Unlock Bonus</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-white">£0</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="bronze-conversion"
                        text="The amount you earn when each referred user completes their FIRST paid lesson. This is a one-time reward per referral."
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Conversion</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-emerald-400">£5</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="bronze-per10h"
                        text="Ongoing reward! You earn this amount for every 10 hours of lessons your referral completes. This continues for the lifetime of their learning journey."
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Per 10h</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-cyan-400">£15</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="bronze-transfer"
                        text="Monthly limit of free lesson hours you can gift to friends and family. Bronze tier does not have transfer privileges - reach Silver to unlock!"
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Transfer</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-red-400">✗</p>
                        </div>
                      </Tooltip>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-slate-700/50 rounded-full text-xs text-slate-300">
                        Referral dashboard access
                      </span>
                    </div>
                  </div>
                </div>

                {/* Silver Tier */}
                <div className={`relative overflow-hidden rounded-xl border-2 transition ${
                  credits?.tier === 'silver'
                    ? 'border-slate-400/50 bg-gradient-to-r from-slate-400/20 to-slate-600/20'
                    : 'border-slate-700 bg-slate-800/30'
                }`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-5xl">🥈</span>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Silver Tier</h3>
                          <p className="text-sm text-slate-400">5-9 Active Referrals</p>
                        </div>
                      </div>
                      {credits?.tier === 'silver' && (
                        <span className="px-4 py-2 bg-slate-400/20 text-slate-300 rounded-full text-sm font-semibold">
                          Current Tier
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <Tooltip
                        id="silver-unlock"
                        text="One-time bonus you receive when you first reach this tier. This is awarded instantly when you hit the required number of active referrals."
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Unlock Bonus</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-amber-400">£25</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="silver-conversion"
                        text="The amount you earn when each referred user completes their FIRST paid lesson. This is a one-time reward per referral."
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Conversion</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-emerald-400">£7</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="silver-per10h"
                        text="Ongoing reward! You earn this amount for every 10 hours of lessons your referral completes. This continues for the lifetime of their learning journey. (1.1x multiplier)"
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Per 10h</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-cyan-400">£16.50</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="silver-transfer"
                        text="Monthly limit of free lesson hours you can gift to friends and family. You can transfer up to 10 hours per month at Silver tier."
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Transfer</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-purple-400">10h/mo</p>
                        </div>
                      </Tooltip>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                        ✓ Priority booking
                      </span>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                        ✓ Transfer hours
                      </span>
                    </div>
                  </div>
                </div>

                {/* Gold Tier */}
                <div className={`relative overflow-hidden rounded-xl border-2 transition ${
                  credits?.tier === 'gold'
                    ? 'border-yellow-400/50 bg-gradient-to-r from-yellow-400/20 to-yellow-600/20'
                    : 'border-slate-700 bg-slate-800/30'
                }`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-5xl">🥇</span>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Gold Tier</h3>
                          <p className="text-sm text-slate-400">10-19 Active Referrals</p>
                        </div>
                      </div>
                      {credits?.tier === 'gold' && (
                        <span className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-full text-sm font-semibold">
                          Current Tier
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <Tooltip
                        id="gold-unlock"
                        text="One-time bonus you receive when you first reach this tier. This is awarded instantly when you hit the required number of active referrals."
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Unlock Bonus</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-amber-400">£75</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="gold-conversion"
                        text="The amount you earn when each referred user completes their FIRST paid lesson. This is a one-time reward per referral."
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Conversion</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-emerald-400">£10</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="gold-per10h"
                        text="Ongoing reward! You earn this amount for every 10 hours of lessons your referral completes. This continues for the lifetime of their learning journey. (1.2x multiplier)"
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Per 10h</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-cyan-400">£18</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="gold-transfer"
                        text="Monthly limit of free lesson hours you can gift to friends and family. You can transfer up to 20 hours per month at Gold tier."
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Transfer</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-purple-400">20h/mo</p>
                        </div>
                      </Tooltip>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                        ✓ Priority booking
                      </span>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                        ✓ Transfer hours
                      </span>
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
                        ✓ Featured referrer
                      </span>
                      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-semibold">
                        ✓ Free group sessions
                      </span>
                    </div>
                  </div>
                </div>

                {/* Platinum Tier */}
                <div className={`relative overflow-hidden rounded-xl border-2 transition ${
                  credits?.tier === 'platinum'
                    ? 'border-purple-400/50 bg-gradient-to-r from-purple-400/20 to-purple-600/20'
                    : 'border-slate-700 bg-slate-800/30'
                }`}>
                  <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <span className="text-5xl">💎</span>
                        <div>
                          <h3 className="text-2xl font-bold text-white">Platinum Tier</h3>
                          <p className="text-sm text-slate-400">20+ Active Referrals</p>
                        </div>
                      </div>
                      {credits?.tier === 'platinum' && (
                        <span className="px-4 py-2 bg-purple-500/20 text-purple-400 rounded-full text-sm font-semibold">
                          Current Tier
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      <Tooltip
                        id="platinum-unlock"
                        text="One-time bonus you receive when you first reach this tier. This is awarded instantly when you hit the required number of active referrals. Congratulations on reaching Platinum!"
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Unlock Bonus</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-amber-400">£200</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="platinum-conversion"
                        text="The amount you earn when each referred user completes their FIRST paid lesson. This is a one-time reward per referral. Maximum conversion rate!"
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Conversion</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-emerald-400">£15</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="platinum-per10h"
                        text="Ongoing reward! You earn this amount for every 10 hours of lessons your referral completes. This continues for the lifetime of their learning journey. (1.3x multiplier - highest tier!)"
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Per 10h</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-cyan-400">£19.50</p>
                        </div>
                      </Tooltip>
                      <Tooltip
                        id="platinum-transfer"
                        text="Monthly limit of free lesson hours you can gift to friends and family. You can transfer up to 50 hours per month at Platinum tier - our highest limit!"
                      >
                        <div className="bg-slate-900/50 rounded-lg p-3 cursor-help hover:bg-slate-800/50 transition">
                          <p className="text-xs text-slate-400 mb-1 flex items-center space-x-1">
                            <span>Transfer</span>
                            <Info className="w-3 h-3" />
                          </p>
                          <p className="text-lg font-bold text-purple-400">50h/mo</p>
                        </div>
                      </Tooltip>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded-full text-xs font-semibold">
                        ✓ Priority booking
                      </span>
                      <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-xs font-semibold">
                        ✓ Transfer hours
                      </span>
                      <span className="px-3 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
                        ✓ Featured referrer
                      </span>
                      <span className="px-3 py-1 bg-cyan-500/20 text-cyan-400 rounded-full text-xs font-semibold">
                        ✓ Free group sessions
                      </span>
                      <span className="px-3 py-1 bg-pink-500/20 text-pink-400 rounded-full text-xs font-semibold">
                        ✓ Dedicated support
                      </span>
                      <span className="px-3 py-1 bg-green-500/20 text-green-400 rounded-full text-xs font-semibold">
                        ✓ Cash withdrawal
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress Indicator */}
              {nextTier && (
                <div className="mt-6 p-4 bg-cyan-500/10 border border-cyan-500/30 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-semibold text-cyan-300">
                      Your Progress to {nextTier.tier.toUpperCase()}
                    </p>
                    <p className="text-sm text-cyan-400">
                      {credits?.active_referrals} / {nextTier.min_referrals} Active Referrals
                    </p>
                  </div>
                  <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden">
                    <div
                      className={`bg-gradient-to-r ${getTierGradient(nextTier.tier)} h-full transition-all duration-500`}
                      style={{
                        width: `${Math.min(100, ((credits?.active_referrals || 0) / nextTier.min_referrals) * 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-2">
                    {nextTier.min_referrals - (credits?.active_referrals || 0)} more active referrals needed
                  </p>
                </div>
              )}
            </div>

            {/* My Referrals List */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 border border-slate-700">
              <h2 className="text-2xl font-bold mb-6">My Referrals ({referrals.length})</h2>

              {referrals.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
                  <p className="text-slate-400">No referrals yet. Start sharing your link!</p>
                </div>
              )}

              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-white font-bold text-lg">
                        {referral.referred_user?.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold">{referral.referred_user?.full_name || 'New User'}</p>
                        <p className="text-sm text-slate-400">
                          Joined {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-400">
                        {referral.completed_lessons} lessons • {referral.total_hours.toFixed(1)}h
                      </p>
                      <p className="font-semibold text-emerald-400">
                        £{referral.credits_earned.toFixed(2)} earned
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column */}
          <div className="space-y-8">
            {/* How to Earn Card */}
            <div className="bg-gradient-to-br from-emerald-500/10 to-cyan-600/10 rounded-2xl p-6 border border-emerald-500/30">
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-emerald-400" />
                <span>How You Earn</span>
              </h2>

              <div className="space-y-5">
                {/* Way 1: Conversion Bonus */}
                <div className="bg-slate-800/50 rounded-xl p-5 border border-emerald-500/20">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">Conversion Bonus</h3>
                      <p className="text-2xl font-bold text-emerald-400 mb-2">
                        £{tierInfo?.conversion_bonus || 5}
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        One-time reward when your referral completes their <strong>first paid lesson</strong>
                      </p>
                    </div>
                  </div>

                  <div className="bg-emerald-500/10 rounded-lg p-3 mt-3 border border-emerald-500/20">
                    <p className="text-xs font-semibold text-emerald-300 mb-2">Example:</p>
                    <p className="text-sm text-slate-300">
                      Sarah signs up with your link → Takes her first lesson → You earn <strong className="text-emerald-400">£{tierInfo?.conversion_bonus || 5}</strong>
                    </p>
                  </div>
                </div>

                {/* Way 2: Lifetime Learning Hours */}
                <div className="bg-slate-800/50 rounded-xl p-5 border border-cyan-500/20">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-white text-lg mb-1">Lifetime Rewards</h3>
                      <p className="text-2xl font-bold text-cyan-400 mb-2">
                        £{(15 * (tierInfo?.hourly_multiplier || 1)).toFixed(2)} <span className="text-base text-slate-400">per 10h</span>
                      </p>
                      <p className="text-sm text-slate-300 leading-relaxed">
                        Ongoing earnings for <strong>every 10 lesson hours</strong> they complete
                      </p>
                    </div>
                  </div>

                  <div className="bg-cyan-500/10 rounded-lg p-3 mt-3 border border-cyan-500/20">
                    <p className="text-xs font-semibold text-cyan-300 mb-2">Example:</p>
                    <p className="text-sm text-slate-300">
                      Sarah continues learning → Completes 10 hours → You earn <strong className="text-cyan-400">£{(15 * (tierInfo?.hourly_multiplier || 1)).toFixed(2)}</strong> → She does another 10h → You earn again!
                    </p>
                    <p className="text-xs text-slate-400 mt-2 italic">
                      ♾️ This continues for their entire learning journey
                    </p>
                  </div>
                </div>

                {/* Total Potential */}
                <div className="bg-gradient-to-r from-amber-500/10 to-orange-600/10 rounded-xl p-4 border border-amber-500/30">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-amber-300 font-semibold mb-1">Potential Per Active Referral:</p>
                      <p className="text-slate-300 text-sm">
                        1st lesson: <strong className="text-emerald-400">£{tierInfo?.conversion_bonus || 5}</strong>
                      </p>
                      <p className="text-slate-300 text-sm">
                        + 50 hours: <strong className="text-cyan-400">£{((15 * (tierInfo?.hourly_multiplier || 1)) * 5).toFixed(2)}</strong>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-amber-300 mb-1">Total</p>
                      <p className="text-3xl font-bold text-amber-400">
                        £{((tierInfo?.conversion_bonus || 5) + ((15 * (tierInfo?.hourly_multiplier || 1)) * 5)).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Free Lesson Hours Info */}
                <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/20">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-purple-400 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-purple-300 font-semibold mb-1">Every £15 = 1 Hour of Free Lessons</p>
                      <p className="text-xs text-slate-400">
                        Your earnings automatically convert to free lesson hours that you can use yourself or gift to others (Silver+ tier)
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer Hours (Silver+ only) */}
            {tierInfo?.benefits?.can_transfer && (
              <div className="bg-gradient-to-br from-purple-500/10 to-pink-600/10 rounded-2xl p-6 border border-purple-500/30">
                <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                  <Send className="w-5 h-5 text-purple-400" />
                  <span>Transfer Hours</span>
                </h2>

                <div className="bg-slate-800/50 rounded-lg p-4 mb-4">
                  <p className="text-sm text-slate-300 mb-2">
                    <strong>Available:</strong> {credits?.available_hours.toFixed(1)}h
                  </p>
                  <p className="text-sm text-slate-300">
                    <strong>Monthly Limit:</strong> {credits?.transfer_limit_monthly}h
                  </p>
                  <p className="text-sm text-slate-300">
                    <strong>Used This Month:</strong> {credits?.transfers_this_month}h
                  </p>
                </div>

                <button
                  onClick={() => setShowTransferModal(true)}
                  className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-semibold transition"
                >
                  Transfer Hours
                </button>
              </div>
            )}

            {/* Recent Transactions */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
              <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>

              {transactions.length === 0 && (
                <p className="text-slate-400 text-center py-8">No transactions yet</p>
              )}

              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-3 bg-slate-800/50 rounded-lg border border-slate-700/50"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        transaction.type === 'conversion_bonus' ? 'bg-emerald-500/20 text-emerald-400' :
                        transaction.type === 'hourly_reward' ? 'bg-cyan-500/20 text-cyan-400' :
                        transaction.type === 'tier_unlock' ? 'bg-amber-500/20 text-amber-400' :
                        transaction.type === 'transfer_out' ? 'bg-red-500/20 text-red-400' :
                        transaction.type === 'transfer_in' ? 'bg-green-500/20 text-green-400' :
                        'bg-slate-500/20 text-slate-400'
                      }`}>
                        {transaction.type.replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold">
                        {transaction.credit_amount > 0 ? '+' : ''}£{transaction.credit_amount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">{transaction.description}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-6 border border-slate-700">
              <div className="flex items-center space-x-2 mb-4">
                <HelpCircle className="w-5 h-5 text-cyan-400" />
                <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
              </div>

              <div className="space-y-3">
                {/* FAQ 1: Can I withdraw money? */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/70 transition"
                  >
                    <span className="font-semibold text-white">Can I withdraw my earnings as cash?</span>
                    {openFaqIndex === 0 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === 0 && (
                    <div className="px-4 pb-4 text-sm text-slate-300 leading-relaxed">
                      <p className="mb-3">
                        For <strong className="text-white">Bronze, Silver, and Gold tiers</strong>, you cannot directly withdraw earnings as cash. However, you have a flexible option:
                      </p>
                      <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-3 mb-3">
                        <p className="font-semibold text-cyan-300 mb-2">💡 Swap Credits for Cash</p>
                        <p className="text-slate-300">
                          You can arrange with someone who was going to pay for lessons anyway. They use your free lesson hours, and they give you the equivalent cash value. It's a win-win!
                        </p>
                      </div>
                      <p className="mb-2"><strong className="text-emerald-400">Example:</strong></p>
                      <p className="text-slate-300 mb-3">
                        Your referral Sarah was going to pay £30 for 2 hours of lessons. Instead, you transfer 2 free hours to her, and she gives you £30 directly. She saves money on transaction fees, and you get cash!
                      </p>
                      <p className="text-amber-300 font-semibold">
                        ⭐ <strong>Platinum Tier</strong> users can withdraw directly to their bank account!
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 2: How do I transfer hours? */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/70 transition"
                  >
                    <span className="font-semibold text-white">How do I transfer free hours to someone?</span>
                    {openFaqIndex === 1 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === 1 && (
                    <div className="px-4 pb-4 text-sm text-slate-300 leading-relaxed">
                      <p className="mb-3">
                        Transferring hours is easy! Available for <strong className="text-purple-400">Silver tier and above</strong>.
                      </p>
                      <ol className="list-decimal list-inside space-y-2 mb-3">
                        <li>Click the <strong>"Transfer Hours"</strong> button above</li>
                        <li>Enter the recipient's email address (they must have a Talbiyah account)</li>
                        <li>Choose how many hours to transfer (minimum 0.5 hours)</li>
                        <li>Add an optional message</li>
                        <li>Confirm the transfer</li>
                      </ol>
                      <div className="bg-slate-700/50 rounded-lg p-3">
                        <p className="text-xs text-slate-400">
                          <strong>Monthly limits:</strong> Silver (5h), Gold (15h), Platinum (50h)
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ 3: When do I get paid? */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/70 transition"
                  >
                    <span className="font-semibold text-white">When do I receive my earnings?</span>
                    {openFaqIndex === 2 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === 2 && (
                    <div className="px-4 pb-4 text-sm text-slate-300 leading-relaxed">
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-emerald-400 mb-1">✅ Conversion Bonus</p>
                          <p>Credited immediately after your referral completes their <strong>first paid lesson</strong></p>
                        </div>
                        <div>
                          <p className="font-semibold text-cyan-400 mb-1">✅ Hourly Rewards</p>
                          <p>Credited automatically every time your referral completes <strong>10 lesson hours</strong></p>
                        </div>
                        <div>
                          <p className="font-semibold text-amber-400 mb-1">✅ Tier Unlock Bonus</p>
                          <p>Credited instantly when you reach the required number of <strong>active referrals</strong></p>
                        </div>
                        <p className="text-xs text-slate-400 mt-3">
                          All earnings are automatically tracked and appear in your Recent Transactions above.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ 4: What counts as an active referral? */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === 3 ? null : 3)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/70 transition"
                  >
                    <span className="font-semibold text-white">What counts as an "active" referral?</span>
                    {openFaqIndex === 3 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === 3 && (
                    <div className="px-4 pb-4 text-sm text-slate-300 leading-relaxed">
                      <p className="mb-3">
                        A referral is considered <strong className="text-emerald-400">"active"</strong> if they meet these criteria:
                      </p>
                      <ul className="space-y-2 mb-3">
                        <li className="flex items-start space-x-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          <span>Have completed at least <strong>one paid lesson</strong></span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-emerald-400 mt-0.5">✓</span>
                          <span>Have taken a lesson in the <strong>last 60 days</strong></span>
                        </li>
                      </ul>
                      <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                        <p className="text-xs text-amber-300">
                          <strong>Note:</strong> If a referral becomes inactive (no lessons for 60 days), they won't count toward your tier status, but you'll still earn from them when they resume lessons!
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ 5: How do lifetime rewards work? */}
                <div className="bg-slate-800/50 rounded-lg border border-slate-700/50 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === 4 ? null : 4)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-slate-800/70 transition"
                  >
                    <span className="font-semibold text-white">How do lifetime rewards work?</span>
                    {openFaqIndex === 4 ? (
                      <ChevronUp className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === 4 && (
                    <div className="px-4 pb-4 text-sm text-slate-300 leading-relaxed">
                      <p className="mb-3">
                        You earn ongoing rewards for <strong className="text-cyan-400">every 10 hours</strong> your referral completes - <strong>forever</strong>! ♾️
                      </p>
                      <div className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 border border-cyan-500/30 rounded-lg p-4 mb-3">
                        <p className="font-semibold text-cyan-300 mb-2">Example with Bronze Tier (1.0x multiplier):</p>
                        <ul className="space-y-1.5 text-sm">
                          <li>• First 10 hours → Earn £15</li>
                          <li>• Next 10 hours → Earn £15</li>
                          <li>• Next 10 hours → Earn £15</li>
                          <li className="text-cyan-300 font-semibold">• After 100 hours → You've earned £150!</li>
                        </ul>
                      </div>
                      <p className="text-slate-300 mb-2">
                        <strong className="text-purple-400">Higher tiers = Higher multipliers:</strong>
                      </p>
                      <ul className="text-sm space-y-1">
                        <li>• Bronze: £15 per 10h (1.0x)</li>
                        <li>• Silver: £16.50 per 10h (1.1x)</li>
                        <li>• Gold: £18 per 10h (1.2x)</li>
                        <li>• Platinum: £19.50 per 10h (1.3x)</li>
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 rounded-2xl p-8 max-w-md w-full border border-slate-700">
            <h2 className="text-2xl font-bold mb-6">Transfer Hours</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label className="text-sm text-slate-400 mb-2 block">Recipient Email</label>
                <input
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">
                  Hours to Transfer (Available: {credits?.available_hours.toFixed(1)}h)
                </label>
                <input
                  type="number"
                  value={transferHours}
                  onChange={(e) => setTransferHours(e.target.value)}
                  placeholder="1.0"
                  step="0.5"
                  min="0.5"
                  max={credits?.available_hours}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white"
                />
              </div>

              <div>
                <label className="text-sm text-slate-400 mb-2 block">Message (Optional)</label>
                <textarea
                  value={transferMessage}
                  onChange={(e) => setTransferMessage(e.target.value)}
                  placeholder="Enjoy these free lessons!"
                  rows={3}
                  className="w-full px-4 py-3 bg-slate-800 border border-slate-700 rounded-lg text-white resize-none"
                />
              </div>

              {transferHours && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-sm text-purple-300">
                    Value: £{(parseFloat(transferHours) * 15).toFixed(2)}
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowTransferModal(false)}
                disabled={transferring}
                className="flex-1 px-4 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferring || !transferEmail || !transferHours}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {transferring ? 'Transferring...' : 'Transfer'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
