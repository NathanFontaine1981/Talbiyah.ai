import { useState, useEffect } from 'react';
import { GraduationCap, BookOpen, Brain, Target, Flame, Trophy, CheckCircle } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { format } from 'date-fns';
import MetricCard from './charts/MetricCard';
import AreaChartCard from './charts/AreaChartCard';
import BarChartCard from './charts/BarChartCard';
import PieChartCard from './charts/PieChartCard';

interface LearningProgressTabProps {
  startDate: Date;
  endDate: Date;
}

interface LearningData {
  learner_stats: {
    total_learners: number;
    avg_level: number;
    avg_streak: number;
    total_xp: number;
    active_streaks: number;
  };
  learner_level_distribution: Array<{ level: number; count: number }>;
  quran_stats: {
    total_ayahs_tracked: number;
    total_memorized: number;
    total_fluent: number;
    total_understood: number;
    avg_memorization_confidence: number;
    avg_fluency_confidence: number;
  };
  quran_stage_breakdown: Array<{ name: string; value: number }>;
  vocabulary_stats: {
    total_words: number;
    mastered_words: number;
    learning_words: number;
    new_words: number;
    avg_accuracy: number;
  };
  vocabulary_by_level: Array<{ name: string; value: number }>;
  homework_stats: {
    total_sessions: number;
    completed_sessions: number;
    avg_accuracy: number;
    total_time_hours: number;
  };
  homework_by_type: Array<{ name: string; value: number; avg_accuracy: number }>;
  homework_accuracy_trend: Array<{ date: string; accuracy: number; sessions: number }>;
  lesson_completion: {
    total_lessons: number;
    completed: number;
    cancelled: number;
    completion_rate: number;
  };
}

export default function LearningProgressTab({ startDate, endDate }: LearningProgressTabProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<LearningData | null>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: result, error } = await supabase.rpc('get_learning_analytics', {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      setData(result);
    } catch (error) {
      console.error('Error fetching learning data:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Failed to load learning data
      </div>
    );
  }

  const accuracyTrendData = (data.homework_accuracy_trend || []).map((item) => ({
    date: format(new Date(item.date), 'MMM d'),
    accuracy: Number(item.accuracy) || 0,
  }));

  const levelDistribution = (data.learner_level_distribution || []).map((item) => ({
    name: `Level ${item.level}`,
    value: item.count,
  }));

  return (
    <div className="space-y-8">
      {/* Learner Overview */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <GraduationCap className="w-6 h-6 text-emerald-500" />
          Learner Overview
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={GraduationCap}
            label="Total Learners"
            value={data.learner_stats?.total_learners || 0}
            color="emerald"
          />
          <MetricCard
            icon={Flame}
            label="Active Streaks"
            value={data.learner_stats?.active_streaks || 0}
            subtitle={`Avg ${(Number(data.learner_stats?.avg_streak) || 0).toFixed(1)} days`}
            color="amber"
          />
          <MetricCard
            icon={Trophy}
            label="Total XP Earned"
            value={(data.learner_stats?.total_xp || 0).toLocaleString()}
            color="purple"
          />
          <MetricCard
            icon={CheckCircle}
            label="Completion Rate"
            value={`${(Number(data.lesson_completion?.completion_rate) || 0).toFixed(1)}%`}
            subtitle={`${data.lesson_completion?.completed || 0} of ${data.lesson_completion?.total_lessons || 0} lessons`}
            color="blue"
          />
        </div>
      </div>

      {/* Quran Progress Section */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-emerald-500" />
          Quran Progress
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Quran Stats Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Overall Statistics</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Ayahs Tracked</p>
                <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {data.quran_stats?.total_ayahs_tracked || 0}
                </p>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Memorized</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {data.quran_stats?.total_memorized || 0}
                </p>
              </div>
              <div className="bg-purple-500/10 border border-purple-500/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Fluent</p>
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {data.quran_stats?.total_fluent || 0}
                </p>
              </div>
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">Understood</p>
                <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {data.quran_stats?.total_understood || 0}
                </p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Avg Memorization Confidence</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(Number(data.quran_stats?.avg_memorization_confidence) || 0).toFixed(1)}%
                </span>
              </div>
              <div className="flex justify-between text-sm mt-2">
                <span className="text-gray-600 dark:text-gray-400">Avg Fluency Confidence</span>
                <span className="font-medium text-gray-900 dark:text-white">
                  {(Number(data.quran_stats?.avg_fluency_confidence) || 0).toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          <PieChartCard
            title="Progress by Stage"
            data={data.quran_stage_breakdown || []}
            colors={['#10b981', '#8b5cf6', '#f59e0b']}
          />
        </div>
      </div>

      {/* Vocabulary Section */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Brain className="w-6 h-6 text-purple-500" />
          Vocabulary Mastery
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Vocabulary Stats Card */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
            <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Word Statistics</h4>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Total Words</span>
                <span className="text-xl font-bold text-gray-900 dark:text-white">
                  {data.vocabulary_stats?.total_words || 0}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-3 rounded-full"
                  style={{
                    width: `${data.vocabulary_stats?.total_words ?
                      ((data.vocabulary_stats.mastered_words || 0) / data.vocabulary_stats.total_words) * 100 : 0}%`,
                  }}
                />
              </div>
              <div className="grid grid-cols-3 gap-4 pt-2">
                <div className="text-center">
                  <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                    {data.vocabulary_stats?.mastered_words || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Mastered</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                    {data.vocabulary_stats?.learning_words || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Learning</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                    {data.vocabulary_stats?.new_words || 0}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">New</p>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Average Accuracy</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {(Number(data.vocabulary_stats?.avg_accuracy) || 0).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          <PieChartCard
            title="Vocabulary by Mastery Level"
            data={data.vocabulary_by_level || []}
            colors={['#9ca3af', '#f59e0b', '#eab308', '#22c55e', '#10b981', '#059669']}
          />
        </div>
      </div>

      {/* Homework Section */}
      <div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Target className="w-6 h-6 text-blue-500" />
          Homework & Practice
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Sessions</p>
            <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {data.homework_stats?.total_sessions || 0}
            </p>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {data.homework_stats?.completed_sessions || 0}
            </p>
          </div>
          <div className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Avg Accuracy</p>
            <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {(Number(data.homework_stats?.avg_accuracy) || 0).toFixed(1)}%
            </p>
          </div>
          <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Time</p>
            <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {(Number(data.homework_stats?.total_time_hours) || 0).toFixed(1)}h
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <AreaChartCard
            title="Accuracy Trend"
            data={accuracyTrendData}
            dataKey="accuracy"
            color="#8b5cf6"
            valueSuffix="%"
          />
          <BarChartCard
            title="Sessions by Type"
            data={(data.homework_by_type || []).map(h => ({
              name: h.name || 'Unknown',
              value: h.value,
            }))}
            dataKey="value"
            xAxisKey="name"
          />
        </div>
      </div>

      {/* Learner Level Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BarChartCard
          title="Learner Level Distribution"
          data={levelDistribution}
          dataKey="value"
          xAxisKey="name"
          color="#10b981"
        />
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Lesson Summary</h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Completed Lessons</span>
              <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                {data.lesson_completion?.completed || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Cancelled Lessons</span>
              <span className="text-xl font-bold text-red-600 dark:text-red-400">
                {data.lesson_completion?.cancelled || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <span className="text-gray-700 dark:text-gray-300">Total Lessons</span>
              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                {data.lesson_completion?.total_lessons || 0}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
