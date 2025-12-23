import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Crown, Medal, ArrowLeft, TrendingUp, Users, Gift } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface LeaderboardEntry {
  id: string;
  full_name: string;
  avatar_url: string | null;
  total_referrals: number;
  tier_name: string;
  badge_icon: string;
  badge_color: string;
  total_rewards: number;
  total_achievements: number;
  rank: number;
}

export default function ReferralLeaderboard() {
  const navigate = useNavigate();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentUserRank, setCurrentUserRank] = useState<LeaderboardEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'month' | 'week'>('all');

  useEffect(() => {
    loadLeaderboard();
  }, [filter]);

  async function loadLeaderboard() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Load leaderboard
      const { data: leaderboardData, error } = await supabase
        .from('referral_leaderboard')
        .select('*')
        .limit(100);

      if (error) throw error;

      setLeaderboard(leaderboardData || []);

      // Find current user's rank
      if (user) {
        const userEntry = leaderboardData?.find(entry => entry.id === user.id);
        setCurrentUserRank(userEntry || null);
      }

    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  }

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-8 h-8 text-yellow-400" />;
      case 2:
        return <Medal className="w-8 h-8 text-gray-500" />;
      case 3:
        return <Medal className="w-8 h-8 text-amber-600" />;
      default:
        return <span className="text-2xl font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border-yellow-500/50';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-gray-600/20 border-gray-400/50';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-amber-800/20 border-amber-600/50';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-pink-600 py-12 px-6">
        <div className="max-w-7xl mx-auto">
          <button
            onClick={() => navigate('/refer')}
            className="text-white/80 hover:text-white mb-4 flex items-center space-x-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center space-x-4">
            <Trophy className="w-12 h-12 text-yellow-400" />
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">Referral Leaderboard</h1>
              <p className="text-purple-100">Top referrers making the biggest impact</p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Filter Tabs */}
        <div className="flex items-center justify-center space-x-2 mb-8">
          <button
            onClick={() => setFilter('all')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              filter === 'all'
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-gray-900'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            All Time
          </button>
          <button
            onClick={() => setFilter('month')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              filter === 'month'
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-gray-900'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            This Month
          </button>
          <button
            onClick={() => setFilter('week')}
            className={`px-6 py-3 rounded-lg font-semibold transition ${
              filter === 'week'
                ? 'bg-gradient-to-r from-emerald-500 to-blue-500 text-gray-900'
                : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
            }`}
          >
            This Week
          </button>
        </div>

        {/* Current User Rank */}
        {currentUserRank && (
          <div className="bg-gradient-to-r from-emerald-500/20 to-teal-600/20 rounded-2xl p-6 border border-emerald-500/30 mb-8">
            <h2 className="text-xl font-bold mb-4">Your Position</h2>
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-full flex items-center justify-center text-gray-900 text-2xl font-bold">
                #{currentUserRank.rank}
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold">{currentUserRank.full_name}</p>
                <p className="text-gray-600">
                  {currentUserRank.total_referrals} referrals · {currentUserRank.tier_name} tier
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-500">Credits Earned</p>
                <p className="text-2xl font-bold text-emerald-400">
                  {currentUserRank.total_rewards?.toFixed(0) || '0'} credits
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Podium */}
        {leaderboard.length >= 3 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            {/* Second Place */}
            <div className="flex flex-col items-center pt-8">
              <Medal className="w-12 h-12 text-gray-500 mb-2" />
              <div className="w-20 h-20 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center text-gray-900 text-3xl font-bold mb-2">
                {leaderboard[1]?.full_name?.[0] || '2'}
              </div>
              <p className="font-bold text-center">{leaderboard[1]?.full_name}</p>
              <p className="text-sm text-gray-500">{leaderboard[1]?.total_referrals} referrals</p>
              <div className="w-full bg-gradient-to-t from-gray-600 to-gray-700 rounded-t-xl p-6 mt-4 text-center">
                <span className="text-4xl font-bold text-white">#2</span>
              </div>
            </div>

            {/* First Place */}
            <div className="flex flex-col items-center">
              <Crown className="w-16 h-16 text-yellow-400 mb-2 animate-pulse" />
              <div className="w-24 h-24 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-full flex items-center justify-center text-gray-900 text-4xl font-bold mb-2 ring-4 ring-yellow-400/50">
                {leaderboard[0]?.full_name?.[0] || '1'}
              </div>
              <p className="font-bold text-center text-xl">{leaderboard[0]?.full_name}</p>
              <p className="text-sm text-gray-500">{leaderboard[0]?.total_referrals} referrals</p>
              <div className="w-full bg-gradient-to-t from-yellow-500 to-amber-600 rounded-t-xl p-8 mt-4 text-center">
                <span className="text-5xl font-bold text-white">#1</span>
              </div>
            </div>

            {/* Third Place */}
            <div className="flex flex-col items-center pt-12">
              <Medal className="w-10 h-10 text-amber-600 mb-2" />
              <div className="w-18 h-18 bg-gradient-to-br from-amber-600 to-amber-800 rounded-full flex items-center justify-center text-gray-900 text-2xl font-bold mb-2">
                {leaderboard[2]?.full_name?.[0] || '3'}
              </div>
              <p className="font-bold text-center">{leaderboard[2]?.full_name}</p>
              <p className="text-sm text-gray-500">{leaderboard[2]?.total_referrals} referrals</p>
              <div className="w-full bg-gradient-to-t from-amber-700 to-amber-800 rounded-t-xl p-4 mt-4 text-center">
                <span className="text-3xl font-bold text-white">#3</span>
              </div>
            </div>
          </div>
        )}

        {/* Rest of Leaderboard */}
        <div className="bg-white rounded-2xl p-6 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Full Rankings</h2>
          <div className="space-y-3">
            {leaderboard.slice(3).map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center space-x-4 p-4 rounded-xl border-2 transition hover:scale-102 ${getRankBg(entry.rank)}`}
              >
                <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                  {getRankIcon(entry.rank)}
                </div>

                <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-600 rounded-full flex items-center justify-center text-gray-900 text-xl font-bold flex-shrink-0">
                  {entry.full_name?.[0] || '?'}
                </div>

                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <p className="font-bold text-lg">{entry.full_name}</p>
                    <span className="text-2xl">{entry.badge_icon}</span>
                  </div>
                  <p className="text-sm text-gray-500">{entry.tier_name} tier</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center space-x-1 text-emerald-600">
                    <Users className="w-4 h-4" />
                    <span className="font-bold">{entry.total_referrals}</span>
                  </div>
                  <p className="text-xs text-gray-500">Referrals</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center space-x-1 text-emerald-400">
                    <Gift className="w-4 h-4" />
                    <span className="font-bold">{entry.total_rewards?.toFixed(0) || 0}</span>
                  </div>
                  <p className="text-xs text-gray-500">Credits</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center space-x-1 text-amber-400">
                    <Trophy className="w-4 h-4" />
                    <span className="font-bold">{entry.total_achievements}</span>
                  </div>
                  <p className="text-xs text-gray-500">Achievements</p>
                </div>
              </div>
            ))}
          </div>

          {leaderboard.length === 0 && (
            <div className="text-center py-12">
              <Trophy className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500">No rankings yet. Be the first to refer!</p>
            </div>
          )}
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-6 mt-8">
          <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
            <Users className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <p className="text-3xl font-bold">
              {leaderboard.reduce((sum, entry) => sum + entry.total_referrals, 0)}
            </p>
            <p className="text-sm text-gray-500">Total Referrals</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
            <Gift className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-3xl font-bold">
              {leaderboard.reduce((sum, entry) => sum + (entry.total_rewards || 0), 0).toFixed(0)}
            </p>
            <p className="text-sm text-gray-500">Credits Distributed</p>
          </div>

          <div className="bg-gray-50 rounded-xl p-6 text-center border border-gray-200">
            <TrendingUp className="w-8 h-8 text-purple-400 mx-auto mb-2" />
            <p className="text-3xl font-bold">{leaderboard.length}</p>
            <p className="text-sm text-gray-500">Active Referrers</p>
          </div>
        </div>
      </div>
    </div>
  );
}
