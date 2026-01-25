import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Plus, Zap } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TokenBalance {
  tokens_remaining: number;
  total_tokens_purchased: number;
  total_tokens_from_bonuses: number;
  total_tokens_used: number;
}

export default function TokenBalanceWidget() {
  const navigate = useNavigate();
  const [balance, setBalance] = useState<TokenBalance | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBalance();

    // Set up real-time subscription for token changes
    const channel = supabase
      .channel('token-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_tokens',
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
        .from('user_tokens')
        .select('tokens_remaining, total_tokens_purchased, total_tokens_from_bonuses, total_tokens_used')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error loading token balance:', error);
        setLoading(false);
        return;
      }

      setBalance(data || {
        tokens_remaining: 0,
        total_tokens_purchased: 0,
        total_tokens_from_bonuses: 0,
        total_tokens_used: 0
      });
      setLoading(false);
    } catch (err) {
      console.error('Error:', err);
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 animate-pulse">
        <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded w-32 mb-4"></div>
        <div className="h-12 bg-gray-100 dark:bg-gray-700 rounded w-20"></div>
      </div>
    );
  }

  const tokensRemaining = balance?.tokens_remaining || 0;
  const totalUsed = balance?.total_tokens_used || 0;

  return (
    <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-2xl p-6 border border-violet-200 dark:border-violet-700 hover:border-violet-300 dark:hover:border-violet-600 transition">
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center space-x-2 mb-1">
            <Sparkles className="w-5 h-5 text-violet-600 dark:text-violet-400" />
            <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">AI Tokens</h3>
          </div>
          <div className="flex items-baseline space-x-2">
            <span className="text-4xl font-bold text-gray-900 dark:text-white">{tokensRemaining}</span>
            <span className="text-gray-500 dark:text-gray-400 text-sm">
              {tokensRemaining === 1 ? 'token' : 'tokens'}
            </span>
          </div>
        </div>

        {tokensRemaining > 0 && (
          <div className="bg-violet-100 dark:bg-violet-800 border border-violet-200 dark:border-violet-700 rounded-lg px-3 py-1">
            <span className="text-violet-600 dark:text-violet-300 text-xs font-medium">Active</span>
          </div>
        )}
      </div>

      {/* Stats */}
      {totalUsed > 0 && (
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mb-4">
          <Zap className="w-4 h-4" />
          <span>{totalUsed} tokens used on AI features</span>
        </div>
      )}

      {/* What tokens are for */}
      <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
        <p>Use for: Dua audio, Khutbah creation, Insights</p>
      </div>

      {/* Action Buttons */}
      <div className="flex space-x-3">
        <button
          onClick={() => navigate('/buy-credits?tab=tokens')}
          className="flex-1 bg-violet-500 hover:bg-violet-600 text-white py-2.5 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Buy Tokens</span>
        </button>

        <button
          onClick={() => navigate('/dua-builder')}
          className="flex-1 bg-violet-50 dark:bg-violet-900/30 hover:bg-violet-100 dark:hover:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700 py-2.5 rounded-lg font-semibold transition flex items-center justify-center space-x-2"
        >
          <Sparkles className="w-4 h-4" />
          <span>Use AI</span>
        </button>
      </div>

      {/* Low Balance Warning */}
      {tokensRemaining > 0 && tokensRemaining <= 20 && (
        <div className="mt-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg p-3">
          <p className="text-amber-700 dark:text-amber-300 text-xs">
            Running low on tokens! Buy more to keep using AI features.
          </p>
        </div>
      )}

      {/* No Tokens Message */}
      {tokensRemaining === 0 && (
        <div className="mt-4 bg-violet-500/10 border border-violet-500/20 rounded-lg p-3">
          <p className="text-violet-600 dark:text-violet-300 text-xs">
            Get tokens to unlock AI features like Dua audio and Khutbah creation!
          </p>
        </div>
      )}
    </div>
  );
}
