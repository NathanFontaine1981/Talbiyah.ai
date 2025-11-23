import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Calendar, TrendingDown, CheckCircle, ArrowRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

export default function BookingOptions() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [creditBalance, setCreditBalance] = useState(0);

  useEffect(() => {
    loadCreditBalance();
  }, []);

  async function loadCreditBalance() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      const { data } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      const balance = data?.credits_remaining || 0;
      setCreditBalance(balance);

      // Smart routing: If user has credits, skip this page and go directly to teachers
      if (balance > 0) {
        navigate('/teachers');
        return;
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading credit balance:', err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-cyan-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            How Would You Like to Book?
          </h1>
          <p className="text-xl text-slate-300">
            Choose the option that works best for you
          </p>
        </div>

        {/* Options Grid */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Option 1: Buy Credit Pack (Recommended) */}
          <div className="relative bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-2 border-cyan-500 rounded-2xl p-8 hover:border-cyan-400 transition shadow-xl">
            {/* Recommended Badge */}
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <div className="bg-gradient-to-r from-cyan-500 to-blue-500 px-4 py-1.5 rounded-full">
                <span className="text-white font-bold text-sm">RECOMMENDED</span>
              </div>
            </div>

            <div className="text-center mt-4">
              <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <CreditCard className="w-10 h-10 text-white" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">Buy Credit Pack</h2>
              <p className="text-slate-300 mb-6 text-lg">
                Prepay for multiple lessons and save money
              </p>

              {/* Benefits */}
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-start space-x-3">
                  <TrendingDown className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-medium">Save up to £40 with Intensive Pack</p>
                    <p className="text-slate-400 text-sm">£13/credit with Intensive Pack vs £15/credit</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-medium">Credits never expire</p>
                    <p className="text-slate-400 text-sm">Use them at your own pace</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-medium">7-day refund policy</p>
                    <p className="text-slate-400 text-sm">Get refund for unused credits within 7 days</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-medium">Faster booking</p>
                    <p className="text-slate-400 text-sm">One-click booking with your credits</p>
                  </div>
                </div>
              </div>

              {/* Pricing Preview */}
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
                <p className="text-slate-400 text-sm mb-2">Available packs:</p>
                <div className="space-y-1 text-sm">
                  <p className="text-slate-300">Starter Pack: 4 credits for £58 (£14.50/credit, save £2)</p>
                  <p className="text-cyan-400 font-medium">Standard Pack: 8 credits for £108 (£13.50/credit, save £12)</p>
                  <p className="text-slate-300">Intensive Pack: 16 credits for £208 (£13/credit, save £32)</p>
                </div>
              </div>

              <button
                onClick={() => navigate('/buy-credits')}
                className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-bold rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
              >
                <span>View Credit Packs</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Option 2: Book Single Lesson */}
          <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 border border-slate-700/50 rounded-2xl p-8 hover:border-slate-600 transition shadow-xl">
            <div className="text-center mt-8">
              <div className="w-20 h-20 bg-slate-700/50 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-slate-600">
                <Calendar className="w-10 h-10 text-slate-300" />
              </div>

              <h2 className="text-3xl font-bold text-white mb-4">Book Single Lesson</h2>
              <p className="text-slate-300 mb-6 text-lg">
                Pay as you go for individual lessons
              </p>

              {/* Benefits */}
              <div className="space-y-3 mb-8 text-left">
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-medium">No commitment required</p>
                    <p className="text-slate-400 text-sm">Try one lesson at a time</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-medium">Pay per lesson</p>
                    <p className="text-slate-400 text-sm">Standard rate of £15 per lesson</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <CheckCircle className="w-5 h-5 text-slate-400 flex-shrink-0 mt-1" />
                  <div>
                    <p className="text-white font-medium">Flexible scheduling</p>
                    <p className="text-slate-400 text-sm">Book when you're ready</p>
                  </div>
                </div>
              </div>

              {/* Pricing */}
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6 border border-slate-700/50">
                <p className="text-slate-400 text-sm mb-2">Single lesson pricing:</p>
                <p className="text-white text-2xl font-bold">£15 <span className="text-sm font-normal text-slate-400">per lesson</span></p>
              </div>

              <button
                onClick={() => navigate('/teachers')}
                className="w-full px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white font-semibold rounded-xl transition flex items-center justify-center space-x-2"
              >
                <span>Browse Teachers</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-gradient-to-r from-purple-500/10 to-violet-500/10 border border-purple-500/20 rounded-xl p-6 text-center">
          <p className="text-slate-300 mb-2">
            Need help choosing? Our Standard Pack (8 credits for £108) is our most popular option!
          </p>
          <p className="text-slate-400 text-sm">
            Perfect for 2 lessons per week for a month, or 1 lesson per week for 2 months.
          </p>
        </div>
      </div>
    </div>
  );
}
