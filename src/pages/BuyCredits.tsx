import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CreditCard, Check, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CreditPack {
  type: 'light' | 'standard' | 'intensive';
  name: string;
  credits: number;
  price: number;
  pricePerLesson: number;
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
    description: '1 lesson/week for 1 month',
  },
  {
    type: 'standard',
    name: 'Standard Pack',
    credits: 8,
    price: 104,
    pricePerLesson: 13,
    description: '2 lessons/week for 1 month OR 1 lesson/week for 2 months',
    popular: true,
  },
  {
    type: 'intensive',
    name: 'Intensive Pack',
    credits: 16,
    price: 192,
    pricePerLesson: 12,
    description: '4 lessons/week for 1 month OR 2 lessons/week for 2 months',
  },
];

export default function BuyCredits() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [selectedPack, setSelectedPack] = useState<string | null>(null);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [error, setError] = useState('');
  const cancelled = searchParams.get('cancelled');

  useEffect(() => {
    loadCurrentCredits();
  }, []);

  async function loadCurrentCredits() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading credits:', error);
        return;
      }

      setCurrentCredits(data?.credits_remaining || 0);
    } catch (err) {
      console.error('Error:', err);
    }
  }

  async function handlePurchase(packType: string) {
    setLoading(true);
    setError('');
    setSelectedPack(packType);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      // Call the create-credit-pack-checkout edge function
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
        // Redirect to Stripe Checkout
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

  return (
    <div className="min-h-screen bg-slate-950 py-16 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Buy Lesson Credits</h1>
          <p className="text-xl text-slate-300 mb-6">
            Purchase credits and use them to book lessons anytime
          </p>

          {/* Current Balance */}
          <div className="inline-block bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border border-cyan-500/20 rounded-xl px-6 py-4">
            <p className="text-sm text-slate-400 mb-1">Your Current Balance</p>
            <p className="text-3xl font-bold text-cyan-400">
              {currentCredits} {currentCredits === 1 ? 'Credit' : 'Credits'}
            </p>
          </div>
        </div>

        {/* Cancellation Notice */}
        {cancelled && (
          <div className="mb-8 bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 text-center">
            <p className="text-yellow-400">
              Your payment was cancelled. No charges were made.
            </p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-8 bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center flex items-center justify-center space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        {/* Credit Packs */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {creditPacks.map((pack) => (
            <div
              key={pack.type}
              className={`relative bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border ${
                pack.popular
                  ? 'border-cyan-500/50 shadow-lg shadow-cyan-500/20'
                  : 'border-slate-700/50'
              } transition hover:border-cyan-500/30`}
            >
              {/* Popular Badge */}
              {pack.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-cyan-500 to-blue-500 text-white text-xs font-bold px-4 py-1 rounded-full">
                    MOST POPULAR
                  </span>
                </div>
              )}

              {/* Pack Name */}
              <h3 className="text-2xl font-bold text-white mb-2">{pack.name}</h3>
              <p className="text-slate-400 text-sm mb-6">{pack.description}</p>

              {/* Credits */}
              <div className="mb-6">
                <div className="flex items-baseline space-x-2">
                  <span className="text-5xl font-bold text-white">{pack.credits}</span>
                  <span className="text-slate-400">Credits</span>
                </div>
              </div>

              {/* Price */}
              <div className="mb-6">
                <div className="flex items-baseline space-x-2 mb-1">
                  <span className="text-3xl font-bold text-cyan-400">£{pack.price}</span>
                </div>
                <p className="text-sm text-slate-400">
                  £{pack.pricePerLesson} per lesson
                </p>
              </div>

              {/* Features */}
              <div className="space-y-3 mb-8">
                <div className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Book anytime</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">Choose any teacher</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">All subjects included</span>
                </div>
                <div className="flex items-start space-x-2">
                  <Check className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-slate-300">7-day refund policy</span>
                </div>
              </div>

              {/* Purchase Button */}
              <button
                onClick={() => handlePurchase(pack.type)}
                disabled={loading}
                className={`w-full py-4 rounded-xl font-semibold transition flex items-center justify-center space-x-2 ${
                  pack.popular
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white'
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

        {/* Info Section */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50">
          <h3 className="text-xl font-bold text-white mb-4">How Credits Work</h3>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="text-cyan-400 font-semibold mb-2">Purchase & Use</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• 1 credit = 60-minute lesson, 0.5 credits = 30-minute lesson</li>
                <li>• Credits never expire</li>
                <li>• Use credits for any subject or teacher</li>
                <li>• Book multiple lessons at once</li>
              </ul>
            </div>

            <div>
              <h4 className="text-cyan-400 font-semibold mb-2">Refund Policy</h4>
              <ul className="space-y-2 text-sm text-slate-300">
                <li>• 7-day refund for unused credits</li>
                <li>• Partial refunds for unused portions</li>
                <li>• Contact support for refund requests</li>
                <li>• Refunds processed within 5-7 days</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => navigate('/dashboard')}
            className="text-slate-400 hover:text-white transition"
          >
            ← Back to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
}
