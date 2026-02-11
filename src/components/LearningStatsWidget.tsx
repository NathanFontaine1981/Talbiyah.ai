import { useEffect, useState } from 'react';
import { Clock, CheckCircle, Flame, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface LearningStats {
  totalHours: number;
  quizzesPassed: number;
  currentStreak: number;
  totalLessons: number;
}

interface LearningStatsWidgetProps {
  learnerId?: string;
}

export default function LearningStatsWidget({ learnerId }: LearningStatsWidgetProps) {
  const [stats, setStats] = useState<LearningStats>({
    totalHours: 0,
    quizzesPassed: 0,
    currentStreak: 0,
    totalLessons: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, [learnerId]);

  async function loadStats() {
    try {
      let targetLearnerId = learnerId;
      let learnerData;
      let allLearnerIds: string[] = learnerId ? [learnerId] : [];

      // If no learnerId provided, get current user's learner
      if (!targetLearnerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get all learners for this parent
        const { data: learners } = await supabase
          .from('learners')
          .select('id, current_streak, total_xp, current_level')
          .eq('parent_id', user.id);

        if (learners && learners.length > 0) {
          // Use first learner for display data, but aggregate lessons across all
          targetLearnerId = learners[0].id;
          learnerData = learners[0];
          allLearnerIds = learners.map(l => l.id);
        } else {
          // Fallback: check if user has completed lessons directly as learner_id
          // This handles student accounts where user.id is used as learner_id
          const { data: directLessons } = await supabase
            .from('lessons')
            .select('duration_minutes, status')
            .eq('learner_id', user.id)
            .eq('status', 'completed');

          if (directLessons && directLessons.length > 0) {
            targetLearnerId = user.id;
            learnerData = { current_streak: 0 }; // No learner record, use defaults
          } else {
            setLoading(false);
            return;
          }
        }
      } else {
        // Fetch learner data for provided learnerId
        const { data: learner } = await supabase
          .from('learners')
          .select('id, current_streak, total_xp, current_level')
          .eq('id', targetLearnerId)
          .maybeSingle();

        learnerData = learner || { current_streak: 0 };
      }

      const { data: lessons } = await supabase
        .from('lessons')
        .select('duration_minutes, status')
        .in('learner_id', allLearnerIds.length > 0 ? allLearnerIds : [targetLearnerId])
        .eq('status', 'completed');

      const totalMinutes = lessons?.reduce((sum, lesson) => sum + lesson.duration_minutes, 0) || 0;
      const totalHours = Math.floor(totalMinutes / 60);

      // Count quizzes passed from homework_submissions
      const { count: quizzesCount } = await supabase
        .from('homework_submissions')
        .select('id', { count: 'exact', head: true })
        .eq('learner_id', targetLearnerId)
        .not('quiz_score', 'is', null);

      setStats({
        totalHours,
        quizzesPassed: quizzesCount || 0,
        currentStreak: learnerData?.current_streak || 0,
        totalLessons: lessons?.length || 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-100 rounded w-32"></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: Clock,
      label: 'Total Hours',
      value: stats.totalHours.toString(),
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200'
    },
    {
      icon: BookOpen,
      label: 'Lessons Completed',
      value: stats.totalLessons.toString(),
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    {
      icon: CheckCircle,
      label: 'Quizzes Passed',
      value: stats.quizzesPassed.toString(),
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    {
      icon: Flame,
      label: 'Current Streak',
      value: `${stats.currentStreak} days`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    }
  ];

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <h3 className="text-lg font-bold text-gray-900 mb-6">Learning Stats</h3>

      <div className="space-y-3">
        {statItems.map((item, index) => (
          <div
            key={index}
            className={`${item.bgColor} rounded-xl p-3 border ${item.borderColor}`}
          >
            <div className="flex items-center space-x-3">
              <div className={`w-10 h-10 rounded-lg ${item.bgColor} border ${item.borderColor} flex items-center justify-center flex-shrink-0`}>
                <item.icon className={`w-5 h-5 ${item.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-500 mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
