import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, CreditCard, Calendar, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface PurchaseDetails {
  id: string;
  pack_size: number;
  pack_price: number;
  credits_added: number;
  purchase_date: string;
  refund_deadline: string;
}

export default function CreditPurchaseSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [verifying, setVerifying] = useState(true);

  // Store interval ID for cleanup
  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    verifyPurchaseAndLoadDetails();

    // Cleanup function to clear polling interval on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyPurchaseAndLoadDetails() {
    try {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('No session ID found');
        setVerifying(false);
        setLoading(false);
        return;
      }

      // Query purchase directly by stripe_checkout_session_id
      const { data: purchase, error: purchaseError } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('stripe_checkout_session_id', sessionId)
        .maybeSingle();

      if (purchaseError) {
        console.error('❌ Error loading purchase:', purchaseError);
        setError('Could not load purchase details');
        setVerifying(false);
        setLoading(false);
        return;
      }

      if (!purchase) {
        // Purchase not found yet - webhook might still be processing
        // Poll for purchase creation (webhook might be delayed)
        let attempts = 0;
        const maxAttempts = 15; // 30 seconds (15 attempts * 2 seconds)

        pollIntervalRef.current = setInterval(async () => {
          attempts++;

          const { data: polledPurchase } = await supabase
            .from('credit_purchases')
            .select('*')
            .eq('stripe_checkout_session_id', sessionId)
            .maybeSingle();

          if (polledPurchase) {
            // Get current credit balance
            const { data: balance } = await supabase
              .from('user_credits')
              .select('credits_remaining')
              .eq('user_id', polledPurchase.user_id)
              .single();

            setPurchaseDetails(polledPurchase);
            setNewBalance(balance?.credits_remaining || 0);
            setVerifying(false);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          } else if (attempts >= maxAttempts) {
            console.error('❌ Purchase not found after polling');
            setError('Purchase not found. Please check your dashboard.');
            setVerifying(false);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }, 2000);

        return; // Exit early, polling will continue
      }

      // Purchase found - get current credit balance
      const { data: balance } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', purchase.user_id)
        .single();

      setPurchaseDetails(purchase);
      setNewBalance(balance?.credits_remaining || 0);
      setVerifying(false);

    } catch (err: any) {
      console.error('Error verifying purchase:', err);
      setError(err.message || 'Failed to verify purchase');
      setVerifying(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-12 border border-red-500/30 backdrop-blur-sm shadow-xl text-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-14 h-14 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Oops!</h1>
          <p className="text-slate-300 mb-8">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-12 border border-slate-700/50 backdrop-blur-sm shadow-xl text-center">
          {verifying ? (
            <>
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                <Loader2 className="w-14 h-14 text-white animate-spin" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Verifying Payment...</h1>
              <p className="text-xl text-slate-300 mb-8">
                Please wait while we confirm your purchase
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>

              <h1 className="text-4xl font-bold text-white mb-4">Purchase Successful!</h1>
              <p className="text-xl text-slate-300 mb-8">
                Your credits have been added to your account
              </p>

              {purchaseDetails && (
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8 text-left">
                  <h2 className="text-lg font-semibold text-white mb-4">Purchase Details</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Credits Purchased:</span>
                      <span className="text-white font-medium">{purchaseDetails.credits_added} credits</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Pack Size:</span>
                      <span className="text-white font-medium">{purchaseDetails.pack_size} lessons</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">New Balance:</span>
                      <span className="text-cyan-400 font-bold text-lg">{newBalance} credits</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-700 pt-3 mt-3">
                      <span className="text-slate-400">Amount Paid:</span>
                      <span className="text-emerald-400 font-bold text-lg">£{purchaseDetails.pack_price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8 text-left">
            <h2 className="text-lg font-semibold text-white mb-4">What's Next?</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">Book Your Lessons</p>
                  <p className="text-sm text-slate-400">
                    Browse our teachers and use your credits to book lessons anytime. Each booking uses 1 credit.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                  <CreditCard className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">Credits Never Expire</p>
                  <p className="text-sm text-slate-400">
                    Your credits are valid forever. Use them at your own pace without any time pressure.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">7-Day Refund Policy</p>
                  <p className="text-sm text-slate-400">
                    You have 7 days to request a refund for unused credits. Contact support if needed.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/20 mb-8">
            <p className="text-sm text-slate-300 mb-2">
              Need help or have questions?
            </p>
            <p className="text-cyan-400 font-medium">
              Contact us at contact@talbiyah.ai
            </p>
          </div>

          <button
            onClick={() => navigate('/teachers')}
            className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
          >
            <span>Browse Teachers & Book Lessons</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-4 px-8 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Thank you for choosing Talbiyah.ai for your Islamic learning journey
          </p>
        </div>
      </div>
    </div>
  );
}
