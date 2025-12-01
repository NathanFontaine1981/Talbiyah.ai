import { useEffect, useState } from 'react';
import {
  CreditCard,
  Clock,
  CheckCircle,
  XCircle,
  RefreshCw,
  Package,
  DollarSign,
  Calendar,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Purchase {
  id: string;
  created_at: string;
  amount: number;
  credits_purchased: number;
  stripe_payment_intent_id: string | null;
  status: string;
  pack_name?: string;
}

interface PaymentHistoryWidgetProps {
  parentId: string;
}

export default function PaymentHistoryWidget({ parentId }: PaymentHistoryWidgetProps) {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    loadPaymentHistory();
  }, [parentId]);

  async function loadPaymentHistory() {
    try {
      const { data, error } = await supabase
        .from('credit_purchases')
        .select('*')
        .eq('user_id', parentId)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setPurchases(data || []);
    } catch (error) {
      console.error('Error loading payment history:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  function formatAmount(amount: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100);
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-amber-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'refunded':
        return <RefreshCw className="w-4 h-4 text-blue-500" />;
      default:
        return <Clock className="w-4 h-4 text-slate-400" />;
    }
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      completed: 'bg-emerald-100 text-emerald-700 border-emerald-200',
      pending: 'bg-amber-100 text-amber-700 border-amber-200',
      failed: 'bg-red-100 text-red-700 border-red-200',
      refunded: 'bg-blue-100 text-blue-700 border-blue-200'
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium border ${styles[status] || 'bg-slate-100 text-slate-700 border-slate-200'}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Calculate totals
  const totalSpent = purchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);
  const totalCredits = purchases
    .filter(p => p.status === 'completed')
    .reduce((sum, p) => sum + p.credits_purchased, 0);

  const displayPurchases = expanded ? purchases : purchases.slice(0, 3);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
            <CreditCard className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Payment History</h3>
            <p className="text-sm text-slate-500">{purchases.length} transactions</p>
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center space-x-2 mb-2">
            <DollarSign className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">Total Spent</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{formatAmount(totalSpent)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <Package className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Credits Purchased</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{totalCredits}</p>
        </div>
      </div>

      {/* Transactions List */}
      {purchases.length === 0 ? (
        <div className="text-center py-8">
          <CreditCard className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">No purchases yet</p>
          <p className="text-sm text-slate-400">Your payment history will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayPurchases.map((purchase) => (
            <div
              key={purchase.id}
              className="bg-slate-50 rounded-xl p-4 border border-slate-200 hover:border-slate-300 transition"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(purchase.status)}
                  <div>
                    <p className="font-semibold text-slate-900">
                      {purchase.pack_name || `${purchase.credits_purchased} Credits`}
                    </p>
                    <div className="flex items-center space-x-2 text-sm text-slate-500">
                      <Calendar className="w-3 h-3" />
                      <span>{formatDate(purchase.created_at)}</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">{formatAmount(purchase.amount)}</p>
                  {getStatusBadge(purchase.status)}
                </div>
              </div>
              {purchase.stripe_payment_intent_id && purchase.status === 'completed' && (
                <div className="mt-2 pt-2 border-t border-slate-200">
                  <p className="text-xs text-slate-400 font-mono truncate">
                    ID: {purchase.stripe_payment_intent_id.slice(-12)}
                  </p>
                </div>
              )}
            </div>
          ))}

          {purchases.length > 3 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full py-3 text-center text-purple-600 hover:text-purple-700 font-medium transition flex items-center justify-center space-x-2"
            >
              {expanded ? (
                <>
                  <span>Show Less</span>
                  <ChevronUp className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>View All ({purchases.length - 3} more)</span>
                  <ChevronDown className="w-4 h-4" />
                </>
              )}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
