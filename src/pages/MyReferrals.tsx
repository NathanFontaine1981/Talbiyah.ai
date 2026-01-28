import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users, Trophy, Copy, Check, ArrowRight, Send, Share2,
  TrendingUp, Clock, Info, HelpCircle, ChevronDown, ChevronUp, Award, Sparkles
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';

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

      toast.success(`Successfully transferred ${transferHours}h to ${result.recipient}! You have ${result.remaining}h remaining.`);

      // Reset form and reload data
      setShowTransferModal(false);
      setTransferEmail('');
      setTransferHours('');
      setTransferMessage('');
      loadReferralData();

    } catch (error: any) {
      toast.error(`Transfer failed: ${error.message}`);
    } finally {
      setTransferring(false);
    }
  }

  function getTierGradient(tier: string) {
    const gradients: Record<string, string> = {
      bronze: 'from-amber-600 to-amber-800',
      silver: 'from-gray-400 to-gray-600',
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
        <div className="absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-white border border-gray-200 rounded-lg shadow-xl w-64">
          <div className="flex items-start space-x-2">
            <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-600 leading-relaxed">{text}</p>
          </div>
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-1 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-700"></div>
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to referral content
      </a>

      {/* Header */}
      <div className={`bg-gradient-to-r ${getTierGradient(credits?.tier || 'bronze')} py-12 px-6`}>
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-900/80 hover:text-gray-900 mb-4 flex items-center space-x-2"
          >
            <ArrowRight className="w-4 h-4 rotate-180" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-5xl">🎁</span>
                <div>
                  <h1 className="text-4xl font-bold">Referral Rewards</h1>
                  <p className="text-gray-900/90 text-lg">Earn free lessons by sharing</p>
                </div>
              </div>
              <p className="text-gray-900/80 mt-2">
                1 Credit = 1 Free Lesson Hour. Credits never expire!
              </p>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-2xl px-8 py-6 border border-white/20">
              <div className="text-center">
                <p className="text-sm text-gray-900/70 mb-1">Available Credits</p>
                <p className="text-4xl font-bold">{Math.floor(credits?.available_hours || 0)}</p>
                <p className="text-lg text-gray-900/80 mt-1">free credits</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <main id="main-content" className="max-w-7xl mx-auto px-6 py-8">
        {/* How It Works - Overview Section */}
        <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-emerald-600" />
            </div>
            <span>How the Referral Programme Works</span>
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {/* Step 1 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-200 h-full">
                <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  1
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Share Your Link</h3>
                <p className="text-gray-600 text-sm">
                  Copy your unique referral link and share it with friends, family, or on social media. When someone signs up using your link, they become your referral.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-emerald-400">
                <ArrowRight className="w-6 h-6" />
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200 h-full">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  2
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">They Start Learning</h3>
                <p className="text-gray-600 text-sm">
                  When your referral completes their first paid lesson, you earn a <strong className="text-emerald-600">conversion bonus</strong>. This is a one-time reward for each person you refer.
                </p>
              </div>
              <div className="hidden md:block absolute top-1/2 -right-3 transform -translate-y-1/2 text-blue-400">
                <ArrowRight className="w-6 h-6" />
              </div>
            </div>

            {/* Step 3 */}
            <div>
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200 h-full">
                <div className="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xl mb-4">
                  3
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">Earn Forever</h3>
                <p className="text-gray-600 text-sm">
                  For every <strong>10 hours</strong> of lessons your referrals complete, you earn additional credits. This continues for their <strong className="text-purple-600">entire learning journey</strong>!
                </p>
              </div>
            </div>
          </div>

          {/* Key Benefits */}
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl p-6 border border-amber-200">
            <h3 className="font-bold text-gray-900 mb-4 flex items-center space-x-2">
              <span className="text-2xl">🎁</span>
              <span>What You Get</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Trophy className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">1 Credit = 1 Free Lesson Hour</p>
                  <p className="text-sm text-gray-600">Use credits to book lessons without paying</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Milestone Bonuses</p>
                  <p className="text-sm text-gray-600">Earn bonus credits at 5, 10, and 20 referrals</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Send className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Gift Credits</p>
                  <p className="text-sm text-gray-600">Transfer credits to friends and family</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-8 h-8 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Clock className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Lifetime Earnings</p>
                  <p className="text-sm text-gray-600">Keep earning as long as your referrals learn</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <Users className="w-6 h-6 text-emerald-600" />
              <span className="text-gray-500">Total Referrals</span>
            </div>
            <p className="text-4xl font-bold text-gray-900">{credits?.total_referrals || 0}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="w-6 h-6 text-emerald-400" />
              <span className="text-gray-500">Active Referrals</span>
            </div>
            <p className="text-4xl font-bold text-emerald-400">{credits?.active_referrals || 0}</p>
            <p className="text-xs text-gray-500 mt-1">Completed ≥1 lesson</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <Trophy className="w-6 h-6 text-amber-400" />
              <span className="text-gray-500">Total Earned</span>
            </div>
            <p className="text-4xl font-bold text-amber-400">{Math.floor(credits?.earned_hours ?? credits?.available_hours ?? 0)}</p>
            <p className="text-xs text-gray-500 mt-1">credits total</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
            <div className="flex items-center space-x-3 mb-2">
              <Clock className="w-6 h-6 text-purple-400" />
              <span className="text-gray-500">Referrals Active</span>
            </div>
            <p className="text-4xl font-bold text-purple-400">{credits?.active_referrals ?? 0}</p>
            <p className="text-xs text-gray-500 mt-1">people learning</p>
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

              <div className="bg-gray-50 rounded-lg p-4 mb-6 border border-gray-200">
                <h3 className="text-sm font-bold text-emerald-600 mb-3">How You Earn:</h3>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-600 font-bold">1</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">First Lesson Bonus</p>
                      <p className="text-sm text-gray-600"><strong className="text-emerald-600">1 Credit</strong> when they complete their first paid lesson</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-emerald-600 font-bold">2</span>
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900">Ongoing Rewards</p>
                      <p className="text-sm text-gray-600">
                        <strong className="text-emerald-600">1 Credit</strong> for every 10 hours they complete
                      </p>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-3 text-center">1 Credit = 1 Free Lesson Hour • Credits never expire</p>
              </div>

              <div className="flex items-center space-x-2 mb-4">
                <input
                  type="text"
                  value={getReferralUrl()}
                  readOnly
                  className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 text-sm"
                />
                <button
                  onClick={copyReferralLink}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-gray-900 rounded-lg font-semibold transition flex items-center space-x-2"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>

              <button
                onClick={shareOnWhatsApp}
                className="w-full px-6 py-3 bg-green-600 hover:bg-green-700 text-gray-900 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                </svg>
                <span>Share on WhatsApp</span>
              </button>
            </div>

            {/* Milestone Bonuses */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold mb-4 flex items-center space-x-2">
                <Trophy className="w-6 h-6 text-amber-400" />
                <span>Milestone Bonuses</span>
              </h2>
              <p className="text-gray-500 text-sm mb-6">
                The more you share, the more you unlock
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Milestone 1: 5 Students */}
                <div className={`relative overflow-hidden rounded-xl border-2 p-6 text-center transition ${
                  (credits?.active_referrals || 0) >= 5
                    ? 'border-emerald-400 bg-gradient-to-br from-emerald-50 to-teal-50'
                    : 'border-gray-200 bg-white'
                }`}>
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Refer 5 Students</h3>
                  <div className={`rounded-full px-4 py-2 inline-block mt-2 ${
                    (credits?.active_referrals || 0) >= 5
                      ? 'bg-emerald-500 text-white'
                      : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    <span className="font-bold">5 Bonus Credits</span>
                  </div>
                  {(credits?.active_referrals || 0) >= 5 && (
                    <p className="text-emerald-600 font-semibold mt-3 text-sm">✓ Unlocked!</p>
                  )}
                </div>

                {/* Milestone 2: 10 Students */}
                <div className={`relative overflow-hidden rounded-xl border-2 p-6 text-center transition ${
                  (credits?.active_referrals || 0) >= 10
                    ? 'border-amber-400 bg-gradient-to-br from-amber-50 to-yellow-50'
                    : 'border-gray-200 bg-white'
                }`}>
                  <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Award className="w-8 h-8 text-amber-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Refer 10 Students</h3>
                  <div className="space-y-2 mt-2">
                    <div className={`rounded-full px-4 py-2 inline-block ${
                      (credits?.active_referrals || 0) >= 10
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-100 text-amber-700'
                    }`}>
                      <span className="font-bold">10 Bonus Credits</span>
                    </div>
                    <p className={`font-semibold text-sm ${
                      (credits?.active_referrals || 0) >= 10 ? 'text-amber-600' : 'text-amber-700'
                    }`}>+ 'Community Leader' Badge</p>
                  </div>
                  {(credits?.active_referrals || 0) >= 10 && (
                    <p className="text-amber-600 font-semibold mt-3 text-sm">✓ Unlocked!</p>
                  )}
                </div>

                {/* Milestone 3: 20 Students */}
                <div className={`relative overflow-hidden rounded-xl border-2 p-6 text-center transition ${
                  (credits?.active_referrals || 0) >= 20
                    ? 'border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50'
                    : 'border-gray-200 bg-white'
                }`}>
                  <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Sparkles className="w-8 h-8 text-purple-600" />
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2">Refer 20 Students</h3>
                  <div className={`rounded-full px-4 py-2 inline-block mt-2 ${
                    (credits?.active_referrals || 0) >= 20
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
                      : 'bg-purple-100 text-purple-700'
                  }`}>
                    <span className="font-bold">Lifetime Platinum Status</span>
                  </div>
                  {(credits?.active_referrals || 0) >= 20 && (
                    <p className="text-purple-600 font-semibold mt-3 text-sm">✓ Unlocked!</p>
                  )}
                </div>
              </div>

              {/* Progress */}
              <div className="mt-6 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-semibold text-emerald-700">
                    Your Progress
                  </p>
                  <p className="text-sm text-emerald-600">
                    {credits?.active_referrals || 0} Active Referrals
                  </p>
                </div>
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <span className={(credits?.active_referrals || 0) >= 5 ? 'text-emerald-600 font-semibold' : ''}>
                    5 → {(credits?.active_referrals || 0) >= 5 ? '✓' : `${5 - (credits?.active_referrals || 0)} more`}
                  </span>
                  <span className={(credits?.active_referrals || 0) >= 10 ? 'text-amber-600 font-semibold' : ''}>
                    10 → {(credits?.active_referrals || 0) >= 10 ? '✓' : `${10 - (credits?.active_referrals || 0)} more`}
                  </span>
                  <span className={(credits?.active_referrals || 0) >= 20 ? 'text-purple-600 font-semibold' : ''}>
                    20 → {(credits?.active_referrals || 0) >= 20 ? '✓' : `${20 - (credits?.active_referrals || 0)} more`}
                  </span>
                </div>
              </div>
            </div>

            {/* My Referrals List */}
            <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold mb-6">My Referrals ({referrals.length})</h2>

              {referrals.length === 0 && (
                <div className="text-center py-12">
                  <Users className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                  <p className="text-gray-500">No referrals yet. Start sharing your link!</p>
                </div>
              )}

              <div className="space-y-4">
                {referrals.map((referral) => (
                  <div
                    key={referral.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-blue-600 flex items-center justify-center text-gray-900 font-bold text-lg">
                        {referral.referred_user?.full_name?.[0] || '?'}
                      </div>
                      <div>
                        <p className="font-semibold">{referral.referred_user?.full_name || 'New User'}</p>
                        <p className="text-sm text-gray-500">
                          Joined {new Date(referral.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        {referral.completed_lessons || 0} lessons
                      </p>
                      <p className="font-semibold text-emerald-400">
                        {Math.floor((referral.credits_earned || 0) / 15)} credits earned
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
            <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/10 rounded-2xl p-6 border border-emerald-500/30">
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-emerald-400" />
                <span>How You Earn Credits</span>
              </h2>

              <div className="space-y-5">
                {/* Way 1: First Lesson Bonus */}
                <div className="bg-gray-50 rounded-xl p-5 border border-emerald-500/20">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <Trophy className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">First Lesson Bonus</h3>
                      <p className="text-2xl font-bold text-emerald-600 mb-2">
                        1 Credit
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        One-time reward when your referral completes their <strong>first paid lesson</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Way 2: Ongoing Rewards */}
                <div className="bg-gray-50 rounded-xl p-5 border border-emerald-500/20">
                  <div className="flex items-start space-x-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center flex-shrink-0">
                      <TrendingUp className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900 text-lg mb-1">Ongoing Rewards</h3>
                      <p className="text-2xl font-bold text-emerald-600 mb-2">
                        1 Credit <span className="text-base text-gray-500">per 10 hours</span>
                      </p>
                      <p className="text-sm text-gray-600 leading-relaxed">
                        Every 10 hours they learn, you earn another credit. <strong>No limits!</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Credit Info */}
                <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200">
                  <div className="flex items-start space-x-2">
                    <Info className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-1" />
                    <div>
                      <p className="text-sm text-emerald-700 font-semibold mb-1">1 Credit = 1 Free Lesson Hour</p>
                      <p className="text-xs text-gray-600">
                        Use your credits for free lessons, gift to friends, or donate to the Revert Scholarship Fund
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Transfer Credits */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 border border-emerald-200">
              <h2 className="text-xl font-bold mb-4 flex items-center space-x-2 text-gray-900">
                <Send className="w-5 h-5 text-emerald-600" />
                <span>Transfer Credits</span>
              </h2>

              <div className="bg-white rounded-lg p-4 mb-4 border border-gray-200">
                <p className="text-sm text-gray-600 mb-2">
                  <strong>Available:</strong> {Math.floor(credits?.available_hours || 0)} credits
                </p>
                <p className="text-sm text-gray-500">
                  Gift credits to friends and family who have a Talbiyah account.
                </p>
              </div>

              <button
                onClick={() => setShowTransferModal(true)}
                className="w-full px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white rounded-lg font-semibold transition"
              >
                Transfer Credits
              </button>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-bold mb-4">Recent Transactions</h2>

              {transactions.length === 0 && (
                <p className="text-gray-500 text-center py-8">No transactions yet</p>
              )}

              <div className="space-y-3">
                {transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs px-2 py-1 rounded font-semibold ${
                        transaction.type === 'conversion_bonus' ? 'bg-emerald-500/20 text-emerald-400' :
                        transaction.type === 'hourly_reward' ? 'bg-emerald-500/20 text-emerald-600' :
                        transaction.type === 'tier_unlock' ? 'bg-amber-500/20 text-amber-400' :
                        transaction.type === 'transfer_out' ? 'bg-red-500/20 text-red-400' :
                        transaction.type === 'transfer_in' ? 'bg-green-500/20 text-green-400' :
                        'bg-gray-500/20 text-gray-500'
                      }`}>
                        {(transaction.type || '').replace('_', ' ').toUpperCase()}
                      </span>
                      <span className="text-sm font-semibold">
                        {(transaction.hours_amount || 0) > 0 ? '+' : ''}{Math.floor(transaction.hours_amount || 0)} credits
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{transaction.description}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(transaction.created_at).toLocaleString()}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Section */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-sm">
              <div className="flex items-center space-x-2 mb-4">
                <HelpCircle className="w-5 h-5 text-emerald-600" />
                <h2 className="text-xl font-bold">Frequently Asked Questions</h2>
              </div>

              <div className="space-y-3">
                {/* FAQ 1: Can I withdraw credits? */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === 0 ? null : 0)}
                    aria-expanded={openFaqIndex === 0}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100/70 transition"
                  >
                    <span className="font-semibold text-gray-900">Can I convert my credits to cash?</span>
                    {openFaqIndex === 0 ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === 0 && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                      <p className="mb-3">
                        Credits are designed to be used for <strong className="text-emerald-600">free lesson hours</strong>. Each credit equals one free hour of learning!
                      </p>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3 mb-3">
                        <p className="font-semibold text-emerald-700 mb-2">💡 Flexible Option</p>
                        <p className="text-gray-600">
                          You can transfer credits to friends or family. If they were going to pay for lessons anyway, they can use your credits and give you the equivalent value. It's a win-win!
                        </p>
                      </div>
                      <p className="mb-2"><strong className="text-emerald-600">Example:</strong></p>
                      <p className="text-gray-600">
                        Your friend Sarah was going to pay for 2 lessons. You transfer 2 credits to her - she gets free lessons and can thank you however you both agree!
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 2: How do I transfer credits? */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === 1 ? null : 1)}
                    aria-expanded={openFaqIndex === 1}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100/70 transition"
                  >
                    <span className="font-semibold text-gray-900">How do I transfer credits to someone?</span>
                    {openFaqIndex === 1 ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === 1 && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                      <p className="mb-3">
                        Transferring credits is easy!
                      </p>
                      <ol className="list-decimal list-inside space-y-2 mb-3">
                        <li>Click the <strong className="text-emerald-600">"Transfer Credits"</strong> button above</li>
                        <li>Enter the recipient's email address (they must have a Talbiyah account)</li>
                        <li>Choose how many credits to transfer (minimum 1)</li>
                        <li>Add an optional message</li>
                        <li>Confirm the transfer</li>
                      </ol>
                      <p className="text-gray-500 text-sm">
                        Credits transfer instantly and can be used for any lesson booking.
                      </p>
                    </div>
                  )}
                </div>

                {/* FAQ 3: When do I receive credits? */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === 2 ? null : 2)}
                    aria-expanded={openFaqIndex === 2}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100/70 transition"
                  >
                    <span className="font-semibold text-gray-900">When do I receive my credits?</span>
                    {openFaqIndex === 2 ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === 2 && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                      <div className="space-y-3">
                        <div>
                          <p className="font-semibold text-emerald-400 mb-1">✅ Conversion Bonus</p>
                          <p>Credited immediately after your referral completes their <strong>first paid lesson</strong></p>
                        </div>
                        <div>
                          <p className="font-semibold text-emerald-600 mb-1">✅ Ongoing Rewards</p>
                          <p>Credited automatically every time your referral completes <strong>10 lesson hours</strong></p>
                        </div>
                        <div>
                          <p className="font-semibold text-amber-400 mb-1">✅ Tier Unlock Bonus</p>
                          <p>Credited instantly when you reach the required number of <strong>active referrals</strong></p>
                        </div>
                        <p className="text-xs text-gray-500 mt-3">
                          All credits are automatically tracked and appear in your Recent Transactions above.
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* FAQ 4: What counts as an active referral? */}
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === 3 ? null : 3)}
                    aria-expanded={openFaqIndex === 3}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100/70 transition"
                  >
                    <span className="font-semibold text-gray-900">What counts as an "active" referral?</span>
                    {openFaqIndex === 3 ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === 3 && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
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
                <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                  <button
                    onClick={() => setOpenFaqIndex(openFaqIndex === 4 ? null : 4)}
                    aria-expanded={openFaqIndex === 4}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-gray-100/70 transition"
                  >
                    <span className="font-semibold text-gray-900">How do lifetime rewards work?</span>
                    {openFaqIndex === 4 ? (
                      <ChevronUp className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500 flex-shrink-0" />
                    )}
                  </button>
                  {openFaqIndex === 4 && (
                    <div className="px-4 pb-4 text-sm text-gray-600 leading-relaxed">
                      <p className="mb-3">
                        You earn ongoing credits for <strong className="text-emerald-600">every 10 hours</strong> your referral completes - <strong>forever</strong>!
                      </p>
                      <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-3">
                        <p className="font-semibold text-emerald-700 mb-2">Example:</p>
                        <ul className="space-y-1.5 text-sm text-gray-700">
                          <li>• First 10 hours → Earn <strong className="text-emerald-600">1 credit</strong></li>
                          <li>• Next 10 hours → Earn <strong className="text-emerald-600">1 credit</strong></li>
                          <li>• Next 10 hours → Earn <strong className="text-emerald-600">1 credit</strong></li>
                          <li className="text-emerald-700 font-semibold">• After 100 hours → You've earned <strong>10 credits</strong>!</li>
                        </ul>
                      </div>
                      <p className="text-gray-600">
                        <strong className="text-emerald-600">1 Credit = 1 Free Lesson Hour.</strong> Credits never expire!
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div role="dialog" aria-modal="true" aria-labelledby="transfer-modal-title" className="bg-white rounded-2xl p-8 max-w-md w-full border border-gray-200">
            <h2 id="transfer-modal-title" className="text-2xl font-bold mb-6">Transfer Credits</h2>

            <div className="space-y-4 mb-6">
              <div>
                <label htmlFor="recipient-email" className="text-sm text-gray-500 mb-2 block">Recipient Email</label>
                <input
                  id="recipient-email"
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="credits-amount" className="text-sm text-gray-500 mb-2 block">
                  Credits to Transfer (Available: {Math.floor(credits?.available_hours || 0)})
                </label>
                <input
                  id="credits-amount"
                  type="number"
                  value={transferHours}
                  onChange={(e) => setTransferHours(e.target.value)}
                  placeholder="1"
                  step="1"
                  min="1"
                  max={Math.floor(credits?.available_hours || 0)}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900"
                />
              </div>

              <div>
                <label htmlFor="transfer-message" className="text-sm text-gray-500 mb-2 block">Message (Optional)</label>
                <textarea
                  id="transfer-message"
                  value={transferMessage}
                  onChange={(e) => setTransferMessage(e.target.value)}
                  placeholder="Enjoy these free lessons!"
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-lg text-gray-900 resize-none"
                />
              </div>

              {transferHours && (
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                  <p className="text-sm text-purple-300">
                    Transferring {parseInt(transferHours)} credits = {parseInt(transferHours)} free lesson hours
                  </p>
                </div>
              )}
            </div>

            <div className="flex space-x-3">
              <button
                onClick={() => setShowTransferModal(false)}
                disabled={transferring}
                className="flex-1 px-4 py-3 bg-gray-200 hover:bg-gray-200 text-gray-900 rounded-lg font-semibold transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTransfer}
                disabled={transferring || !transferEmail || !transferHours}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-cyan-700 text-gray-900 rounded-lg font-semibold transition disabled:opacity-50 disabled:cursor-not-allowed"
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
