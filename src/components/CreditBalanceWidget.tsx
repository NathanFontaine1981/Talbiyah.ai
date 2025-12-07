import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { CreditCard, Plus, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface CreditBalance {
  credits_remaining: number;
  total_credits_purchased: number;
}

export default function CreditBalanceWidget() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();

    // Set up real-time subscription for credit changes
    const channel = supabase
      .channel('credit-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_credits',
        },
        () => {
          loadBalance();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  async function loadBalance() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_credits')
        .select('credits_remaining, total_credits_purchased')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading credit balance:', error);
        setLoading(false);
        return;
      }

      setBalance(data || { credits_remaining: 0, total_credits_purchased: 0 });
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 animate-pulse">
        <div className="h-8 bg-slate-700 rounded w-32 mb-4"></div>
        <div className="h-12 bg-slate-700 rounded w-20"></div>
      </div>
    );
  }

  const creditsRemaining = balance?.credits_remaining || 0;
  const totalPurchased = balance?.total_credits_purchased || 0;

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 hover:border-cyan-500/30 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <CreditCard className="w-5 h-5 text-cyan-400" />
            <h3 className="text-sm font-medium text-slate-400">Lesson Credits</h3>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-white">{creditsRemaining}</span>
            <span className="text-slate-400 text-sm">
              {creditsRemaining === 1 ? 'credit' : 'credits'}
            </span>
          </div>
        </div>

        {creditsRemaining > 0 && (
          <div className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-lg px-3 py-1">
            <span className="text-green-400 text-xs font-medium">Active</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {totalPurchased > 0 && (
        <div className="flex items-center space-x-2 text-xs text-slate-400 mb-4">
          <TrendingUp className="w-4 h-4" />
          <span>{totalPurchased} credits purchased total</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => navigate('/buy-credits')}
          className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white py-2.5 rounded-lg font-semibold transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Buy Credits</span>
        </button>

        {creditsRemaining > 0 && (
          <button
            onClick={() => navigate('/teachers')}
            className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white py-2.5 rounded-lg font-semibold transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
          >
            <span>📚</span>
            <span>Book Lesson</span>
          </button>
        )}
      </div>

      {/* Low Balance Warning */}
      {creditsRemaining > 0 && creditsRemaining <= 2 && (
        <div className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
          <p className="text-yellow-400 text-xs">
            Running low on credits! Buy more to keep learning.
          </p>
        </div>
      )}

      {/* No Credits Message */}
      {creditsRemaining === 0 && (
        <div className="mt-4 bg-cyan-500/10 border border-cyan-500/20 rounded-lg p-3">
          <p className="text-cyan-400 text-xs">
            Get started by purchasing your first credit pack!
          </p>
        </div>
      )}
    </div>
  );
}
