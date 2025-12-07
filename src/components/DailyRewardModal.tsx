import { useState, useEffect } from 'react';
import {
  Gift,
  Flame,
  Star,
  X,
  Trophy,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import confetti from 'canvas-confetti';

interface DailyRewardModalProps {
  learnerId: string;
  learnerName: string;
  onClose: () => void;
  onRewardClaimed?: (xp: number, streak: number) => void;
}

interface RewardResult {
  success: boolean;
  xpAwarded?: number;
  baseXP?: number;
  streakBonus?: number;
  newStreak?: number;
  totalXP?: number;
  level?: number;
  levelUp?: boolean;
  alreadyClaimed?: boolean;
  message?: string;
}

export default function DailyRewardModal({
  learnerId,
  learnerName,
  onClose,
  onRewardClaimed
}: DailyRewardModalProps) {
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);
  const [result, setResult] = useState<RewardResult | null>(null);
  const [animatingXP, setAnimatingXP] = useState(false);

  async function claimReward() {
    setClaiming(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/claim-daily-reward`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          },
          body: JSON.stringify({ learnerId })
        }
      );

      const data: RewardResult = await response.json();

      if (data.success) {
        setResult(data);
        setClaimed(true);
        setAnimatingXP(true);

        // Trigger confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b']
        });

        // Extra confetti for level up
        if (data.levelUp) {
          setTimeout(() => {
            confetti({
              particleCount: 200,
              spread: 100,
              origin: { y: 0.5 },
              colors: ['#fbbf24', '#f59e0b', '#d97706']
            });
          }, 500);
        }

        if (onRewardClaimed && data.xpAwarded && data.newStreak) {
          onRewardClaimed(data.xpAwarded, data.newStreak);
        }
      } else if (data.alreadyClaimed) {
        setResult(data);
        setClaimed(true);
      }
    } catch (error) {
      console.error('Error claiming reward:', error);
    } finally {
      setClaiming(false);
    }
  }

  // Auto-claim on mount for better UX
  useEffect(() => {
    claimReward();
  }, []);

  function getStreakEmoji(streak: number): string {
    if (streak >= 30) return '🔥🔥🔥';
    if (streak >= 14) return '🔥🔥';
    if (streak >= 7) return '🔥';
    if (streak >= 3) return '✨';
    return '⭐';
  }

  function getStreakMessage(streak: number): string {
    if (streak >= 30) return 'Incredible! 30+ day streak!';
    if (streak >= 14) return 'Amazing! 2 week streak!';
    if (streak >= 7) return 'Great! 1 week streak!';
    if (streak >= 3) return 'Nice! Keep it going!';
    return 'Great start!';
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 rounded-3xl p-8 max-w-md w-full border border-purple-500/30 shadow-2xl shadow-purple-500/20 relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-500/20 rounded-full blur-3xl"></div>
          <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-cyan-500/20 rounded-full blur-3xl"></div>
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white transition z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="relative z-10">
          {claiming ? (
            <div className="text-center py-8">
              <div className="w-20 h-20 mx-auto mb-6 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-400 to-orange-500 rounded-full animate-pulse"></div>
                <Gift className="w-10 h-10 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <p className="text-xl text-white font-semibold">Opening your reward...</p>
            </div>
          ) : claimed && result ? (
            result.alreadyClaimed ? (
              // Already claimed today
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-6 bg-slate-700/50 rounded-full flex items-center justify-center">
                  <Gift className="w-10 h-10 text-slate-400" />
                </div>
                <h2 className="text-2xl font-bold text-white mb-2">Come Back Tomorrow!</h2>
                <p className="text-slate-300 mb-6">
                  You've already claimed today's reward.
                </p>
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <span className="text-2xl font-bold text-orange-400">
                      {result.streak || 0} Day Streak
                    </span>
                  </div>
                  <p className="text-slate-400 text-sm mt-2">
                    Keep logging in daily to build your streak!
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold transition"
                >
                  Got It
                </button>
              </div>
            ) : (
              // Successfully claimed
              <div className="text-center">
                <div className="text-5xl mb-4">{getStreakEmoji(result.newStreak || 1)}</div>
                <h2 className="text-3xl font-bold text-white mb-2">
                  Welcome Back, {learnerName.split(' ')[0]}!
                </h2>
                <p className="text-slate-300 mb-6">{getStreakMessage(result.newStreak || 1)}</p>

                {/* XP Reward Card */}
                <div className={`bg-gradient-to-br from-amber-500/20 to-orange-500/20 rounded-2xl p-6 mb-6 border border-amber-500/30 ${animatingXP ? 'animate-bounce' : ''}`}>
                  <div className="flex items-center justify-center space-x-3 mb-4">
                    <Star className="w-8 h-8 text-amber-400" />
                    <span className="text-4xl font-bold text-amber-400">+{result.xpAwarded} XP</span>
                  </div>

                  <div className="flex items-center justify-center space-x-4 text-sm">
                    <div className="bg-slate-800/50 px-3 py-1.5 rounded-lg">
                      <span className="text-slate-400">Base: </span>
                      <span className="text-amber-400 font-semibold">{result.baseXP} XP</span>
                    </div>
                    {(result.streakBonus || 0) > 0 && (
                      <div className="bg-slate-800/50 px-3 py-1.5 rounded-lg">
                        <span className="text-slate-400">Streak Bonus: </span>
                        <span className="text-orange-400 font-semibold">+{result.streakBonus} XP</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Streak Display */}
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <Flame className="w-6 h-6 text-orange-500" />
                    <span className="text-2xl font-bold text-orange-400">
                      {result.newStreak} Day Streak
                    </span>
                  </div>
                  <div className="flex justify-center space-x-1">
                    {Array.from({ length: Math.min(result.newStreak || 0, 7) }).map((_, i) => (
                      <div
                        key={i}
                        className="w-8 h-2 bg-gradient-to-r from-orange-500 to-amber-400 rounded-full"
                      />
                    ))}
                    {Array.from({ length: Math.max(0, 7 - (result.newStreak || 0)) }).map((_, i) => (
                      <div key={`empty-${i}`} className="w-8 h-2 bg-slate-700 rounded-full" />
                    ))}
                  </div>
                </div>

                {/* Level Up Notification */}
                {result.levelUp && (
                  <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-xl p-4 mb-6 border border-purple-500/30 animate-pulse">
                    <div className="flex items-center justify-center space-x-2">
                      <ChevronUp className="w-6 h-6 text-purple-400" />
                      <span className="text-xl font-bold text-purple-400">
                        Level Up! You're now Level {result.level}
                      </span>
                      <Trophy className="w-6 h-6 text-amber-400" />
                    </div>
                  </div>
                )}

                {/* Total XP */}
                <div className="text-sm text-slate-400 mb-6">
                  Total XP: <span className="text-white font-semibold">{result.totalXP?.toLocaleString()}</span>
                </div>

                <button
                  onClick={onClose}
                  className="w-full py-3 bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-600 hover:to-cyan-700 text-white rounded-xl font-semibold transition shadow-lg shadow-emerald-500/25"
                >
                  Let's Learn!
                </button>
              </div>
            )
          ) : null}
        </div>
      </div>
    </div>
  );
}
