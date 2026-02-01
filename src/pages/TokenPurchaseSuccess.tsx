import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Sparkles, ArrowRight, Loader2, AlertCircle, Zap } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

interface PurchaseDetails {
  id: string;
  package_type: string;
  tokens_amount: number;
  price_paid: number;
  completed_at: string;
}

export default function TokenPurchaseSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [purchaseDetails, setPurchaseDetails] = useState<PurchaseDetails | null>(null);
  const [newBalance, setNewBalance] = useState<number>(0);
  const [verifying, setVerifying] = useState(true);

  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    verifyPurchaseAndLoadDetails();

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
        .from('token_purchases')
        .select('*')
        .eq('stripe_checkout_session_id', sessionId)
        .eq('status', 'completed')
        .maybeSingle();

      if (purchaseError) {
        console.error('Error loading token purchase:', purchaseError);
        setError('Could not load purchase details');
        setVerifying(false);
        setLoading(false);
        return;
      }

      if (!purchase) {
        // Purchase not found yet - webhook might still be processing
        let attempts = 0;
        const maxAttempts = 15; // 30 seconds (15 attempts * 2 seconds)

        pollIntervalRef.current = setInterval(async () => {
          attempts++;

          const { data: polledPurchase } = await supabase
            .from('token_purchases')
            .select('*')
            .eq('stripe_checkout_session_id', sessionId)
            .eq('status', 'completed')
            .maybeSingle();

          if (polledPurchase) {
            // Get current token balance
            const { data: balance } = await supabase
              .from('user_tokens')
              .select('tokens_remaining')
              .eq('user_id', polledPurchase.user_id)
              .single();

            setPurchaseDetails(polledPurchase);
            setNewBalance(balance?.tokens_remaining || 0);
            setVerifying(false);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          } else if (attempts >= maxAttempts) {
            console.error('Token purchase not found after polling');
            setError('Purchase not found. Please check your dashboard.');
            setVerifying(false);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }, 2000);

        return;
      }

      // Purchase found - get current token balance
      const { data: balance } = await supabase
        .from('user_tokens')
        .select('tokens_remaining')
        .eq('user_id', purchase.user_id)
        .single();

      setPurchaseDetails(purchase);
      setNewBalance(balance?.tokens_remaining || 0);
      setVerifying(false);

    } catch (err: any) {
      console.error('Error verifying token purchase:', err);
      setError(err.message || 'Failed to verify purchase');
      setVerifying(false);
    } finally {
      setLoading(false);
    }
  }

  const getPackageName = (type: string) => {
    switch (type) {
      case 'starter': return 'Starter';
      case 'standard': return 'Standard';
      case 'best_value': return 'Best Value';
      default: return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-violet-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-300 text-lg">Loading purchase details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl p-12 border border-red-200 dark:border-red-500/30 shadow-xl text-center">
          <div className="w-24 h-24 bg-red-100 dark:bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-14 h-14 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">Oops!</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-8">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-violet-500 hover:bg-violet-600 text-white font-semibold rounded-xl transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-12 border border-gray-200 dark:border-gray-700 shadow-xl text-center">
          {verifying ? (
            <>
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/20">
                <Loader2 className="w-14 h-14 text-white animate-spin" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Verifying Payment...</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Please wait while we confirm your purchase
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-gradient-to-br from-violet-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-violet-500/20">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>

              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">Tokens Added!</h1>
              <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
                Your AI tokens are ready to use
              </p>

              {purchaseDetails && (
                <div className="bg-violet-50 dark:bg-violet-900/30 rounded-xl p-6 border border-violet-200 dark:border-violet-700 mb-8 text-left">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Purchase Details</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Package:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{getPackageName(purchaseDetails.package_type)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">Tokens Purchased:</span>
                      <span className="text-gray-900 dark:text-white font-medium">{purchaseDetails.tokens_amount} tokens</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-400">New Balance:</span>
                      <span className="text-violet-600 dark:text-violet-400 font-bold text-lg">{newBalance} tokens</span>
                    </div>
                    <div className="flex justify-between border-t border-violet-200 dark:border-violet-600 pt-3 mt-3">
                      <span className="text-gray-500 dark:text-gray-400">Amount Paid:</span>
                      <span className="text-violet-600 dark:text-violet-400 font-bold text-lg">£{purchaseDetails.price_paid.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6 border border-gray-200 dark:border-gray-600 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Use Your Tokens For</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-violet-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-violet-500/20">
                  <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium mb-1">Dua Builder</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Generate personalized duas with AI-powered Arabic audio downloads (10 tokens per audio)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                  <Zap className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium mb-1">Khutbah Creator</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Create custom khutbahs (2 free/month, then 20 tokens) with audio downloads (25 tokens)
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-indigo-500/20">
                  <CheckCircle className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 dark:text-white font-medium mb-1">Talbiyah Insights</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Access audio summaries (15 tokens) and PDF downloads (10 tokens) of your lesson insights
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-violet-500/10 to-purple-500/10 rounded-xl p-6 border border-violet-500/20 mb-8">
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">
              Need help or have questions?
            </p>
            <p className="text-violet-600 dark:text-violet-400 font-medium">
              Contact us at support@talbiyah.ai
            </p>
          </div>

          <button
            onClick={() => navigate('/dua-builder')}
            className="w-full px-8 py-4 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 text-white font-semibold rounded-xl transition shadow-lg shadow-violet-500/20 flex items-center justify-center space-x-2"
          >
            <Sparkles className="w-5 h-5" />
            <span>Try Dua Builder</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full mt-4 px-8 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white font-medium rounded-xl transition"
          >
            Go to Dashboard
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Thank you for choosing Talbiyah.ai for your Islamic learning journey
          </p>
        </div>
      </div>
    </div>
  );
}
