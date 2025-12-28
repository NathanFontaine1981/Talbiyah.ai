import { useState, useEffect } from 'react';
import { Clock, Calendar, TrendingUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ProgressStats {
  totalHours: number;
  completedLessons: number;
  lessonsThisMonth: number;
  currentStreak: number;
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtext?: string;
  trend?: {
    value: number;
    label: string;
    positive: boolean;
  };
  color: 'emerald' | 'blue' | 'purple' | 'amber';
}

const colorClasses = {
  emerald: {
    bg: 'bg-emerald-50',
    icon: 'text-emerald-600',
    border: 'border-emerald-200',
  },
  blue: {
    bg: 'bg-blue-50',
    icon: 'text-blue-600',
    border: 'border-blue-200',
  },
  purple: {
    bg: 'bg-purple-50',
    icon: 'text-purple-600',
    border: 'border-purple-200',
  },
  amber: {
    bg: 'bg-amber-50',
    icon: 'text-amber-600',
    border: 'border-amber-200',
  },
};

function StatCard({ icon, label, value, subtext, trend, color }: StatCardProps) {
  const classes = colorClasses[color];

  return (
    <div className={`rounded-xl border ${classes.border} ${classes.bg} p-5`}>
      <div className="flex items-start justify-between">
        <div className={`p-2 rounded-lg bg-white shadow-sm ${classes.icon}`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center gap-1 text-xs font-medium ${trend.positive ? 'text-emerald-600' : 'text-gray-500'}`}>
            {trend.positive && <TrendingUp className="w-3 h-3" />}
            <span>{trend.value > 0 ? '+' : ''}{trend.value} {trend.label}</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <p className="text-2xl font-bold text-gray-900">{value}</p>
        <p className="text-sm text-gray-600 mt-1">{label}</p>
        {subtext && (
          <p className="text-xs text-gray-500 mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );
}

interface ProgressOverviewProps {
  studentId?: string;
  variant?: 'student' | 'teacher-view';
}

export default function ProgressOverview({ studentId, variant = 'student' }: ProgressOverviewProps) {
  const [stats, setStats] = useState<ProgressStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [targetUserId, setTargetUserId] = useState<string | null>(null);

  // Fetch stats function - extracted so it can be called on demand
  const fetchStats = async (targetId: string) => {
    try {
      // Fetch lesson stats
      const { data: lessons } = await supabase
        .from('lessons')
        .select('id, duration_minutes, status, scheduled_time')
        .eq('learner_id', targetId)
        .eq('status', 'completed');

      const totalMinutes = lessons?.reduce((acc, l) => acc + (l.duration_minutes || 0), 0) || 0;
      const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
      const completedLessons = lessons?.length || 0;

      // Calculate lessons this month
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const lessonsThisMonth = lessons?.filter(l =>
        new Date(l.scheduled_time) >= startOfMonth
      ).length || 0;

      // Calculate streak (lessons in consecutive weeks)
      let currentStreak = 0;
      if (lessons && lessons.length > 0) {
        const sortedLessons = [...lessons].sort(
          (a, b) => new Date(b.scheduled_time).getTime() - new Date(a.scheduled_time).getTime()
        );

        const now = new Date();
        const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

        // Check if there was a lesson in the past week
        const hasRecentLesson = sortedLessons.some(
          l => new Date(l.scheduled_time) >= oneWeekAgo
        );

        if (hasRecentLesson) {
          currentStreak = 1;
          // Count consecutive weeks with lessons
          let checkDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          for (let i = 0; i < 52; i++) { // Max 1 year streak
            const weekStart = new Date(checkDate.getTime() - 7 * 24 * 60 * 60 * 1000);
            const hasLessonInWeek = sortedLessons.some(l => {
              const lessonDate = new Date(l.scheduled_time);
              return lessonDate >= weekStart && lessonDate < checkDate;
            });
            if (hasLessonInWeek) {
              currentStreak++;
              checkDate = weekStart;
            } else {
              break;
            }
          }
        }
      }

      setStats({
        totalHours,
        completedLessons,
        lessonsThisMonth,
        currentStreak,
      });
    } catch (error) {
      console.error('Error fetching progress stats:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch and setup realtime subscription
  useEffect(() => {
    async function init() {
      // Get current user if studentId not provided
      let targetId = studentId;
      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // First try to find learner by parent_id (parent viewing child)
        const { data: learner } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)
          .maybeSingle();

        if (learner) {
          targetId = learner.id;
        } else {
          // Fallback: check if user has lessons directly as learner_id
          // This handles student accounts where user.id is used as learner_id
          const { data: directLessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('learner_id', user.id)
            .eq('status', 'completed')
            .limit(1);

          if (directLessons && directLessons.length > 0) {
            targetId = user.id;
          } else {
            setLoading(false);
            return;
          }
        }
      }
      if (!targetId) {
        setLoading(false);
        return;
      }

      setTargetUserId(targetId);
      await fetchStats(targetId);
    }

    init();
  }, [studentId]);

  // Set up realtime subscription for live updates
  useEffect(() => {
    if (!targetUserId) return;

    // Subscribe to changes on the lessons table for this learner
    const channel = supabase
      .channel('progress-stats-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'lessons',
          filter: `learner_id=eq.${targetUserId}`,
        },
        () => {
          // Refetch stats when lessons change
          fetchStats(targetUserId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [targetUserId]);

  if (loading) {
    return (
      <div className="grid grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="rounded-xl border border-gray-200 bg-gray-50 p-5 animate-pulse">
            <div className="w-10 h-10 bg-gray-200 rounded-lg" />
            <div className="mt-4 space-y-2">
              <div className="h-6 bg-gray-200 rounded w-16" />
              <div className="h-4 bg-gray-200 rounded w-24" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-4">
      {variant === 'student' && (
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">Your Progress</h2>
          <span className="text-sm text-gray-500">
            {stats.currentStreak > 0 ? `${stats.currentStreak} week streak!` : 'Start your streak!'}
          </span>
        </div>
      )}

      <div className="grid grid-cols-3 gap-4">
        <StatCard
          icon={<Clock className="w-5 h-5" />}
          label="Hours Studied"
          value={stats.totalHours}
          subtext={`${stats.completedLessons} lessons total`}
          color="emerald"
        />

        <StatCard
          icon={<Calendar className="w-5 h-5" />}
          label="Lessons This Month"
          value={stats.lessonsThisMonth}
          subtext={new Date().toLocaleDateString('en-GB', { month: 'long' })}
          color="blue"
        />

        <StatCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Week Streak"
          value={stats.currentStreak}
          subtext={stats.currentStreak > 0 ? 'Keep it going!' : 'Book a lesson to start'}
          color="amber"
        />
      </div>
    </div>
  );
}

// Compact version for embedding in other components
export function ProgressOverviewCompact({ stats }: { stats: ProgressStats }) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <Clock className="w-4 h-4 text-emerald-600" />
        <span className="font-medium">{stats.totalHours}h</span>
        <span className="text-gray-500">studied</span>
      </div>
      <div className="flex items-center gap-2">
        <Calendar className="w-4 h-4 text-blue-600" />
        <span className="font-medium">{stats.lessonsThisMonth}</span>
        <span className="text-gray-500">this month</span>
      </div>
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-amber-600" />
        <span className="font-medium">{stats.currentStreak}</span>
        <span className="text-gray-500">week streak</span>
      </div>
    </div>
  );
}
