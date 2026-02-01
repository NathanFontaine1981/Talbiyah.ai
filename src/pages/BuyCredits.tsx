import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { CreditCard, Check, Loader2, AlertCircle, Send, Sparkles, Zap, Shield, Lock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CreditPack {
  type: 'light' | 'standard' | 'intensive';
  name: string;
  credits: number;
  price: number;
  pricePerLesson: number;
  description: string;
  bonusTokens: number;
  popular?: boolean;
}

interface TokenPack {
  type: 'starter' | 'standard' | 'best_value';
  name: string;
  tokens: number;
  price: number;
  pricePerToken: number;
  description: string;
  popular?: boolean;
}

const creditPacks: CreditPack[] = [
  {
    type: 'light',
    name: 'Starter Pack',
    credits: 4,
    price: 56,
    pricePerLesson: 14,
    description: '4 hours: 4 × 60min or 8 × 30min lessons',
    bonusTokens: 100,
  },
  {
    type: 'standard',
    name: 'Standard Pack',
    credits: 8,
    price: 104,
    pricePerLesson: 13,
    description: '8 hours: 8 × 60min or 16 × 30min lessons',
    bonusTokens: 300,
    popular: true,
  },
  {
    type: 'intensive',
    name: 'Intensive Pack',
    credits: 16,
    price: 192,
    pricePerLesson: 12,
    description: '16 hours: 16 × 60min or 32 × 30min lessons',
    bonusTokens: 700,
  },
];

// Calculate savings percentage (baseline £15/lesson for single lessons)
const BASELINE_CREDIT_PRICE = 15;
function getCreditSavingsPercent(pricePerLesson: number): number {
  return Math.round((1 - pricePerLesson / BASELINE_CREDIT_PRICE) * 100);
}

// Calculate token savings (baseline £0.05/token)
const BASELINE_TOKEN_PRICE = 0.05;
function getTokenSavingsPercent(pricePerToken: number): number {
  return Math.round((1 - pricePerToken / BASELINE_TOKEN_PRICE) * 100);
}

const tokenPacks: TokenPack[] = [
  {
    type: 'starter',
    name: 'Starter',
    tokens: 100,
    price: 5,
    pricePerToken: 0.05,
    description: 'Try out AI features',
  },
  {
    type: 'standard',
    name: 'Standard',
    tokens: 250,
    price: 10,
    pricePerToken: 0.04,
    description: 'Regular AI usage',
    popular: true,
  },
  {
    type: 'best_value',
    name: 'Best Value',
    tokens: 500,
    price: 18,
    pricePerToken: 0.036,
    description: 'Maximum savings',
  },
];

export default function BuyCredits() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [currentTokens, setCurrentTokens] = useState<number>(0);
  const [error, setError] = useState('');
  const cancelled = searchParams.get('cancelled');
  const initialTab = searchParams.get('tab') === 'tokens' ? 'tokens' : 'credits';
  const [activeTab, setActiveTab] = useState<'credits' | 'tokens'>(initialTab);

  useEffect(() => {
    loadCurrentBalances();
  }, []);

  async function loadCurrentBalances() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load credits
      const { data: creditData } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      setCurrentCredits(creditData?.credits_remaining || 0);

      // Load tokens
      const { data: tokenData } = await supabase
        .from('user_tokens')
        .select('tokens_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      setCurrentTokens(tokenData?.tokens_remaining || 0);
    } catch (err) {
      console.error('Error:', err);
    }
  }

  async function handleCreditPurchase(packType: string) {
    setLoading(true);
    setError('');
    setSelectedPack(packType);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-credit-pack-checkout', {
        body: { pack_type: packType },
      });

      if (error) {
        console.error('Error creating checkout:', error);
        setError('Failed to create checkout session. Please try again.');
        setLoading(false);
        setSelectedPack(null);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to get checkout URL');
        setLoading(false);
        setSelectedPack(null);
      }
    } catch (err: any) {
      console.error('Purchase error:', err);
      setError(err.message || 'An error occurred');
      setLoading(false);
      setSelectedPack(null);
    }
  }

  async function handleTokenPurchase(packageType: string) {
    setLoading(true);
    setError('');
    setSelectedPack(packageType);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data, error } = await supabase.functions.invoke('create-token-purchase-checkout', {
        body: { package_type: packageType },
      });

      if (error) {
        console.error('Error creating token checkout:', error);
        setError('Failed to create checkout session. Please try again.');
        setLoading(false);
        setSelectedPack(null);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      } else {
        setError('Failed to get checkout URL');
        setLoading(false);
        setSelectedPack(null);
      }
    } catch (err: any) {
      console.error('Token purchase error:', err);
      setError(err.message || 'An error occurred');
      setLoading(false);
      setSelectedPack(null);
    }
  }

  function handleTabChange(tab: 'credits' | 'tokens') {
    setActiveTab(tab);
    setSearchParams(tab === 'tokens' ? { tab: 'tokens' } : {});
    setError('');
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-16 px-6">
      {/* Skip link for accessibility */}
      <a
        href="#purchase-options"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to purchase options
      </a>

      <main className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Buy Credits & Tokens</h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-6">
            Credits for lessons, tokens for AI features
          </p>

          {/* Current Balances */}
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-200 dark:border-emerald-700 rounded-xl px-6 py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Lesson Credits</p>
              <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
                {currentCredits}
              </p>
            </div>
            <div className="bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-xl px-6 py-4">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">AI Tokens</p>
              <p className="text-3xl font-bold text-violet-600 dark:text-violet-400">
                {currentTokens}
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-6" role="tablist" aria-label="Purchase options">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex">
            <button
              onClick={() => handleTabChange('credits')}
              role="tab"
              aria-selected={activeTab === 'credits'}
              aria-controls="credits-panel"
              className={`px-6 py-3 rounded-lg font-semibold transition flex items-center space-x-2 ${
                activeTab === 'credits'
                  ? 'bg-white dark:bg-gray-700 text-emerald-600 dark:text-emerald-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <CreditCard className="w-5 h-5" />
              <span>Lesson Credits</span>
            </button>
            <button
              onClick={() => handleTabChange('tokens')}
              role="tab"
              aria-selected={activeTab === 'tokens'}
              aria-controls="tokens-panel"
              className={`px-6 py-3 rounded-lg font-semibold transition flex items-center space-x-2 ${
                activeTab === 'tokens'
                  ? 'bg-white dark:bg-gray-700 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              <span>AI Tokens</span>
            </button>
          </div>
        </div>

        {/* Trust Indicators */}
        <div className="flex items-center justify-center gap-6 mb-6 flex-wrap">
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Shield className="w-5 h-5 text-emerald-500" />
            <span className="text-sm">7-day money-back guarantee</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <Lock className="w-5 h-5 text-emerald-500" />
            <span className="text-sm">Secure checkout</span>
          </div>
          <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
            <CreditCard className="w-5 h-5 text-emerald-500" />
            <span className="text-sm">Powered by Stripe</span>
          </div>
        </div>

        {/* Social Proof */}
        <div className="text-center mb-8">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">1,247</span> credit packs purchased by happy learners
          </p>
        </div>

        {/* Testimonial */}
        <div className="max-w-2xl mx-auto mb-10 bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold flex-shrink-0">
              AH
            </div>
            <div>
              <div className="flex items-center gap-1 mb-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <svg key={star} className="w-4 h-4 text-yellow-400 fill-yellow-400" viewBox="0 0 20 20">
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <p className="text-gray-600 dark:text-gray-300 text-sm italic mb-2">
                "The Standard Pack was perfect for our family. My two kids share the credits and the bonus tokens are great for the AI features. Already bought our second pack!"
              </p>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                <strong className="text-gray-700 dark:text-gray-300">Ahmed H.</strong> — Parent, purchased 2 packs
              </p>
            </div>
          </div>
        </div>

        {/* Cancellation Notice */}
        {cancelled && (
          <div className="mb-8 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 text-center">
            <p className="text-amber-700 dark:text-amber-300">
              Your payment was cancelled. No charges were made.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-xl p-4 text-center flex items-center justify-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Credit Packs */}
        {activeTab === 'credits' && (
          <div id="purchase-options" role="tabpanel" aria-labelledby="credits-tab">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {creditPacks.map((pack) => (
                <div
                  key={pack.type}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl p-8 border shadow-sm ${
                    pack.popular
                      ? 'border-emerald-500 shadow-lg ring-2 ring-emerald-500/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } transition hover:border-emerald-300 hover:shadow-md`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-emerald-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                        MOST POPULAR
                      </span>
                    </div>
                  )}

                  {/* Savings Badge */}
                  {getCreditSavingsPercent(pack.pricePerLesson) > 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                        Save {getCreditSavingsPercent(pack.pricePerLesson)}%
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{pack.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{pack.description}</p>

                  <div className="mb-4">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">{pack.credits}</span>
                      <span className="text-gray-500 dark:text-gray-400">Credits</span>
                    </div>
                  </div>

                  {/* Bonus Tokens Badge */}
                  <div className="mb-4 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-lg px-3 py-2 inline-flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">
                      +{pack.bonusTokens} FREE tokens
                    </span>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">£{pack.price}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      £{pack.pricePerLesson} per lesson
                    </p>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Book anytime</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Choose any teacher</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">All subjects included</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">7-day refund policy</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleCreditPurchase(pack.type)}
                    disabled={loading}
                    className={`w-full py-4 rounded-full font-semibold transition flex items-center justify-center space-x-2 ${
                      pack.popular
                        ? 'bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-500/20'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 hover:text-gray-900'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading && selectedPack === pack.type ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <CreditCard className="w-5 h-5" />
                        <span>Purchase Now</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How Credits Work</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2">Purchase & Use</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• 1 credit = 60-minute lesson, 0.5 credits = 30-minute lesson</li>
                    <li>• Credits never expire</li>
                    <li>• Use credits for any subject or teacher</li>
                    <li>• Every pack includes FREE AI tokens</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-emerald-600 dark:text-emerald-400 font-semibold mb-2">Refund & Transfer Policy</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• 7-day refund for unused credits</li>
                    <li>• After 7 days, transfer credits to others</li>
                    <li>• Partial refunds for unused portions</li>
                    <li>• Refunds processed within 5-7 days</li>
                  </ul>
                  <Link
                    to="/transfer-credits"
                    className="mt-4 inline-flex items-center gap-2 text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 dark:hover:text-emerald-300 font-medium text-sm transition-colors"
                  >
                    <Send className="w-4 h-4" />
                    Transfer credits to someone
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Token Packs */}
        {activeTab === 'tokens' && (
          <div id="purchase-options" role="tabpanel" aria-labelledby="tokens-tab">
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              {tokenPacks.map((pack) => (
                <div
                  key={pack.type}
                  className={`relative bg-white dark:bg-gray-800 rounded-2xl p-8 border shadow-sm ${
                    pack.popular
                      ? 'border-violet-500 shadow-lg ring-2 ring-violet-500/20'
                      : 'border-gray-200 dark:border-gray-700'
                  } transition hover:border-violet-300 hover:shadow-md`}
                >
                  {pack.popular && (
                    <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                      <span className="bg-violet-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                        BEST VALUE
                      </span>
                    </div>
                  )}

                  {/* Savings Badge */}
                  {getTokenSavingsPercent(pack.pricePerToken) > 0 && (
                    <div className="absolute top-4 right-4">
                      <span className="bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-400 text-xs font-bold px-2 py-1 rounded-full">
                        Save {getTokenSavingsPercent(pack.pricePerToken)}%
                      </span>
                    </div>
                  )}

                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{pack.name}</h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">{pack.description}</p>

                  <div className="mb-6">
                    <div className="flex items-baseline space-x-2">
                      <span className="text-5xl font-bold text-gray-900 dark:text-white">{pack.tokens}</span>
                      <span className="text-gray-500 dark:text-gray-400">Tokens</span>
                    </div>
                  </div>

                  <div className="mb-6">
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="text-3xl font-bold text-violet-600 dark:text-violet-400">£{pack.price}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      £{pack.pricePerToken.toFixed(3)} per token
                    </p>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-start space-x-2">
                      <Zap className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Dua audio downloads (10 tokens)</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Zap className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Khutbah creation (20 tokens)</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Zap className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Khutbah audio (25 tokens)</span>
                    </div>
                    <div className="flex items-start space-x-2">
                      <Zap className="w-5 h-5 text-violet-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-600 dark:text-gray-300">Insight audio/PDF (10-15 tokens)</span>
                    </div>
                  </div>

                  <button
                    onClick={() => handleTokenPurchase(pack.type)}
                    disabled={loading}
                    className={`w-full py-4 rounded-full font-semibold transition flex items-center justify-center space-x-2 ${
                      pack.popular
                        ? 'bg-violet-500 hover:bg-violet-600 text-white shadow-lg shadow-violet-500/20'
                        : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 hover:text-gray-900'
                    } ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {loading && selectedPack === pack.type ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Processing...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-5 h-5" />
                        <span>Purchase Now</span>
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">How Tokens Work</h3>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-violet-600 dark:text-violet-400 font-semibold mb-2">What You Can Do</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Download AI-generated Dua audio (10 tokens)</li>
                    <li>• Create Khutbahs (first 2/month FREE, then 20 tokens)</li>
                    <li>• Download Khutbah audio (25 tokens)</li>
                    <li>• Access Insight audio summaries (15 tokens)</li>
                    <li>• Download Insight PDFs (10 tokens)</li>
                  </ul>
                </div>
                <div>
                  <h4 className="text-violet-600 dark:text-violet-400 font-semibold mb-2">Free Features</h4>
                  <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
                    <li>• Dua text generation is always FREE</li>
                    <li>• 2 Khutbahs per month FREE</li>
                    <li>• Text insights with lessons are FREE</li>
                    <li>• Tokens from credit purchases never expire</li>
                  </ul>
                  <div className="mt-4 bg-violet-50 dark:bg-violet-900/30 border border-violet-200 dark:border-violet-700 rounded-lg p-3">
                    <p className="text-violet-700 dark:text-violet-300 text-sm font-medium">
                      Tip: Buy lesson credits to get FREE bonus tokens!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="mt-12 bg-white dark:bg-gray-800 rounded-2xl p-8 border border-gray-200 dark:border-gray-700 shadow-sm">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Frequently Asked Questions</h3>
          <div className="space-y-4">
            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer list-none p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <span className="font-medium text-gray-900 dark:text-white">Do credits expire?</span>
                <span className="text-emerald-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 px-4 pb-4 text-gray-600 dark:text-gray-300 text-sm">
                No, credits never expire. Use them whenever you're ready to book lessons.
              </p>
            </details>

            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer list-none p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <span className="font-medium text-gray-900 dark:text-white">Can I get a refund?</span>
                <span className="text-emerald-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 px-4 pb-4 text-gray-600 dark:text-gray-300 text-sm">
                Yes! We offer a 7-day money-back guarantee for unused credits. After 7 days, you can transfer credits to family or friends instead.
              </p>
            </details>

            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer list-none p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <span className="font-medium text-gray-900 dark:text-white">What's the difference between credits and tokens?</span>
                <span className="text-emerald-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 px-4 pb-4 text-gray-600 dark:text-gray-300 text-sm">
                Credits are for booking live 1-on-1 lessons with teachers. Tokens are for AI features like dua audio downloads, khutbah creation, and insight summaries.
              </p>
            </details>

            <details className="group">
              <summary className="flex justify-between items-center cursor-pointer list-none p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition">
                <span className="font-medium text-gray-900 dark:text-white">Can I share credits with family?</span>
                <span className="text-emerald-500 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <p className="mt-2 px-4 pb-4 text-gray-600 dark:text-gray-300 text-sm">
                Yes! Parents can use credits across all their children's accounts. You can also transfer credits to anyone using our transfer feature.
              </p>
            </details>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-gray-500 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </main>
    </div>
  );
}
