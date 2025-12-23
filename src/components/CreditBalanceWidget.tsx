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
  const [hasUnlimitedCredits, setHasUnlimitedCredits] = useState(false);

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

      // Check if user has unlimited credits
      const { data: profileData } = await supabase
        .from('profiles')
        .select('unlimited_credits')
        .eq('id', user.id)
        .single();

      if (profileData?.unlimited_credits) {
        setHasUnlimitedCredits(true);
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
      <div className="bg-white rounded-2xl p-6 border border-gray-200 animate-pulse">
        <div className="h-8 bg-gray-100 rounded w-32 mb-4"></div>
        <div className="h-12 bg-gray-100 rounded w-20"></div>
      </div>
    );
  }

  const creditsRemaining = balance?.credits_remaining || 0;
  const totalPurchased = balance?.total_credits_purchased || 0;

  // Render special UI for unlimited credits (Gold account)
  if (hasUnlimitedCredits) {
    return (
      <div className="relative overflow-hidden bg-gradient-to-br from-amber-900 via-yellow-800 to-orange-900 rounded-2xl p-6 border-2 border-amber-400 hover:border-amber-300 transition-all shadow-xl shadow-amber-500/40">
        {/* Shimmer effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400/15 to-transparent -translate-x-full animate-pulse" style={{ animationDuration: '3s' }} />

        <div className="relative flex items-start justify-between mb-4">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-2xl">👑</span>
              <h3 className="text-sm font-semibold text-amber-100 uppercase tracking-wider">Gold Member</h3>
            </div>
            <div className="flex items-baseline space-x-2">
              <span className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-100 to-amber-200">Unlimited</span>
            </div>
            <p className="text-amber-100 text-sm mt-2 font-medium">Free lessons forever</p>
          </div>

          <div className="bg-gradient-to-br from-amber-600 to-yellow-600 border-2 border-amber-300 rounded-xl px-4 py-2 shadow-lg">
            <span className="text-white text-sm font-black tracking-widest">GOLD</span>
          </div>
        </div>

        {/* Action Button */}
        <button
          onClick={() => navigate('/teachers')}
          className="relative w-full bg-gradient-to-r from-amber-400 via-yellow-400 to-amber-400 hover:from-amber-300 hover:via-yellow-300 hover:to-amber-300 text-gray-900 py-3 rounded-xl font-black text-lg transition-all shadow-lg shadow-amber-400/50 hover:shadow-amber-300/60 flex items-center justify-center space-x-2"
        >
          <span className="text-xl">📚</span>
          <span>Book a Lesson</span>
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-emerald-300 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-medium text-gray-500">Lesson Credits</h3>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-gray-900">{creditsRemaining}</span>
            <span className="text-gray-500 text-sm">
              {creditsRemaining === 1 ? 'credit' : 'credits'}
            </span>
          </div>
        </div>

        {creditsRemaining > 0 && (
          <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-1">
            <span className="text-green-600 text-xs font-medium">Active</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {totalPurchased > 0 && (
        <div className="flex items-center space-x-2 text-xs text-gray-500 mb-4">
          <TrendingUp className="w-4 h-4" />
          <span>{totalPurchased} credits purchased total</span>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => navigate('/buy-credits')}
          className="flex-1 bg-emerald-500 hover:bg-emerald-600 text-white py-2.5 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Buy Credits</span>
        </button>

        <button
          onClick={() => navigate('/teachers')}
          className="flex-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 py-2.5 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
        >
          <span>📚</span>
          <span>Book Lesson</span>
        </button>
      </div>

      {/* Low Balance Warning */}
      {creditsRemaining > 0 && creditsRemaining <= 2 && (
        <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
          <p className="text-amber-700 text-xs">
            Running low on credits! Buy more to keep learning.
          </p>
        </div>
      )}

      {/* No Credits Message */}
      {creditsRemaining === 0 && (
        <div className="mt-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-3">
          <p className="text-emerald-600 text-xs">
            Get started by purchasing your first credit pack!
          </p>
        </div>
      )}
    </div>
  );
}
