import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  AlertCircle,
  Loader2,
  Receipt,
  Send,
  Download,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CreditPurchase {
  id: string;
  pack_size: number;
  pack_price: number;
  credits_added: number;
  purchase_date: string;
  refund_deadline: string;
  refunded: boolean;
  refunded_at: string | null;
  refund_amount: number | null;
  refund_type: string | null;
  stripe_payment_id: string;
}

interface CreditTransaction {
  id: string;
  transaction_type: string;
  credits_change: number;
  credits_after: number;
  notes: string | null;
  created_at: string;
}

export default function PaymentHistory() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [purchases, setPurchases] = useState<CreditPurchase[]>([]);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [currentCredits, setCurrentCredits] = useState<number>(0);
  const [refundingId, setRefundingId] = useState<string | null>(null);
  const [refundReason, setRefundReason] = useState<string>('');
  const [showRefundModal, setShowRefundModal] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'purchases' | 'transactions'>('purchases');

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      // Load purchases
      const { data: purchasesData, error: purchasesError } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_date', { ascending: false });

      if (purchasesError) throw purchasesError;
      setPurchases(purchasesData || []);

      // Load transactions
      const { data: transactionsData, error: transactionsError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (transactionsError) throw transactionsError;
      setTransactions(transactionsData || []);

      // Load current balance
      const { data: creditsData } = await supabase
        .from('user_credits')
        .select('credits_remaining')
        .eq('user_id', user.id)
        .maybeSingle();

      setCurrentCredits(creditsData?.credits_remaining || 0);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  }

  async function handleRefundRequest(purchase: CreditPurchase) {
    setRefundingId(purchase.id);
    setError(null);
    setSuccess(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate('/signin');
        return;
      }

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          purchase_id: purchase.id,
          reason: refundReason || 'User requested refund',
        }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        setError(result.error || result.message || 'Refund failed');
        return;
      }

      setSuccess(result.message);
      setShowRefundModal(null);
      setRefundReason('');
      loadData(); // Reload data
    } catch (err: any) {
      console.error('Refund error:', err);
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setRefundingId(null);
    }
  }

  function isRefundEligible(purchase: CreditPurchase): boolean {
    if (purchase.refunded) return false;
    const deadline = new Date(purchase.refund_deadline);
    return new Date() <= deadline;
  }

  function getRefundDaysLeft(purchase: CreditPurchase): number {
    const deadline = new Date(purchase.refund_deadline);
    const now = new Date();
    const diff = deadline.getTime() - now.getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  }

  function getTransactionIcon(type: string) {
    switch (type) {
      case 'purchase':
        return <CreditCard className="w-4 h-4 text-emerald-500" />;
      case 'booking':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'refund':
        return <RefreshCw className="w-4 h-4 text-amber-500" />;
      case 'transfer_out':
        return <Send className="w-4 h-4 text-red-500" />;
      case 'transfer_in':
        return <Send className="w-4 h-4 text-emerald-500 transform rotate-180" />;
      default:
        return <Receipt className="w-4 h-4 text-gray-500" />;
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl flex items-center justify-center">
                <Receipt className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Payment History</h1>
                <p className="text-gray-500 dark:text-gray-400">View purchases, transactions, and request refunds</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Balance</p>
              <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{currentCredits} credits</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-4">
            <button
              onClick={() => navigate('/buy-credits')}
              className="flex-1 py-2 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              Buy Credits
            </button>
            <button
              onClick={() => navigate('/transfer-credits')}
              className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              Transfer Credits
            </button>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-red-800 dark:text-red-300">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
            <p className="text-emerald-800 dark:text-emerald-300">{success}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden">
          <div className="flex border-b border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setActiveTab('purchases')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'purchases'
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              Credit Purchases
            </button>
            <button
              onClick={() => setActiveTab('transactions')}
              className={`flex-1 py-4 px-6 text-center font-medium transition-colors ${
                activeTab === 'transactions'
                  ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              }`}
            >
              All Transactions
            </button>
          </div>

          {/* Purchases Tab */}
          {activeTab === 'purchases' && (
            <div className="p-6">
              {purchases.length === 0 ? (
                <div className="text-center py-12">
                  <CreditCard className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No purchases yet</p>
                  <button
                    onClick={() => navigate('/buy-credits')}
                    className="mt-4 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors"
                  >
                    Buy Credits
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {purchases.map((purchase) => {
                    const daysLeft = getRefundDaysLeft(purchase);
                    const eligible = isRefundEligible(purchase);

                    return (
                      <div
                        key={purchase.id}
                        className="border border-gray-200 dark:border-gray-700 rounded-xl p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-gray-900 dark:text-white">
                                {purchase.credits_added} Credits
                              </h3>
                              {purchase.refunded && (
                                <span className="px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-xs rounded-full">
                                  {purchase.refund_type === 'full' ? 'Fully Refunded' : 'Partially Refunded'}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                              {new Date(purchase.purchase_date).toLocaleDateString('en-GB', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                              })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-gray-900 dark:text-white">£{purchase.pack_price.toFixed(2)}</p>
                            {purchase.refund_amount && (
                              <p className="text-sm text-amber-600 dark:text-amber-400">
                                -£{purchase.refund_amount.toFixed(2)} refunded
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Refund Status / Action */}
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                          {purchase.refunded ? (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                              <CheckCircle className="w-4 h-4" />
                              Refunded on {new Date(purchase.refunded_at!).toLocaleDateString('en-GB')}
                            </div>
                          ) : eligible ? (
                            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-sm">
                              <Clock className="w-4 h-4" />
                              {daysLeft} day{daysLeft !== 1 ? 's' : ''} left to request refund
                            </div>
                          ) : (
                            <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-sm">
                              <XCircle className="w-4 h-4" />
                              Refund window expired
                            </div>
                          )}

                          {eligible && !purchase.refunded && (
                            <button
                              onClick={() => setShowRefundModal(purchase.id)}
                              className="px-3 py-1.5 bg-amber-100 dark:bg-amber-900/30 hover:bg-amber-200 dark:hover:bg-amber-900/50 text-amber-700 dark:text-amber-400 rounded-lg text-sm font-medium transition-colors"
                            >
                              Request Refund
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="p-6">
              {transactions.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">No transactions yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {transactions.map((tx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        {getTransactionIcon(tx.transaction_type)}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">
                            {tx.transaction_type.replace('_', ' ')}
                          </p>
                          {tx.notes && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                              {tx.notes}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {new Date(tx.created_at).toLocaleDateString('en-GB', {
                              day: 'numeric',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-bold ${
                            tx.credits_change > 0
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : 'text-red-600 dark:text-red-400'
                          }`}
                        >
                          {tx.credits_change > 0 ? '+' : ''}
                          {tx.credits_change}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          Balance: {tx.credits_after}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Refund Modal */}
        {showRefundModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Request Refund</h3>

              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Are you sure you want to request a refund? Your credits will be deducted and the amount
                will be refunded to your original payment method within 5-7 business days.
              </p>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Reason (Optional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Why are you requesting a refund?"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white resize-none"
                />
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowRefundModal(null);
                    setRefundReason('');
                  }}
                  className="flex-1 py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const purchase = purchases.find((p) => p.id === showRefundModal);
                    if (purchase) handleRefundRequest(purchase);
                  }}
                  disabled={refundingId === showRefundModal}
                  className="flex-1 py-2 px-4 bg-amber-600 hover:bg-amber-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                >
                  {refundingId === showRefundModal ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Confirm Refund'
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
