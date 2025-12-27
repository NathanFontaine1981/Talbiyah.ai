import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flame, Brain, ChevronRight, Calendar, Target, Sparkles } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface DailyPracticeWidgetProps {
  learnerId?: string;
}

export default function DailyPracticeWidget({ learnerId }: DailyPracticeWidgetProps) {
  const navigate = useNavigate();
  const [streak, setStreak] = useState(0);
  const [todayComplete, setTodayComplete] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [learnerId]);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get learner stats
      const { data: learner } = await supabase
        .from('learners')
        .select('current_streak, last_maintenance_date')
        .eq(learnerId ? 'id' : 'parent_id', learnerId || user.id)
        .maybeSingle();

      if (learner) {
        setStreak(learner.current_streak || 0);
        const today = new Date().toISOString().split('T')[0];
        setTodayComplete(learner.last_maintenance_date === today);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32"></div>
          <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-500" />
          Daily Practice
        </h3>

        {/* Streak display */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
              streak > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'
            }`}>
              <Flame className={`w-6 h-6 ${streak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{streak}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Day Streak</p>
            </div>
          </div>
          {todayComplete && (
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-sm font-medium rounded-full">
              Done Today
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div className="space-y-3">
          <button
            onClick={() => navigate('/daily-review')}
            className={`w-full p-4 rounded-xl border-2 flex items-center justify-between transition ${
              todayComplete
                ? 'border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/20'
                : 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/30'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-800 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-emerald-900 dark:text-emerald-100">Daily Quran Review</p>
                <p className="text-sm text-emerald-700 dark:text-emerald-400">
                  {todayComplete ? 'Completed for today' : 'Maintain your memorization'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          </button>

          <button
            onClick={() => navigate('/homework')}
            className="w-full p-4 rounded-xl border-2 border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 flex items-center justify-between transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="text-left">
                <p className="font-medium text-purple-900 dark:text-purple-100">Smart Homework</p>
                <p className="text-sm text-purple-700 dark:text-purple-400">Practice your weak areas</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-purple-600 dark:text-purple-400" />
          </button>
        </div>
      </div>
    </div>
  );
}
