import { useEffect, useState } from 'react';
import { Clock, Users, BookOpen, DollarSign, Star, TrendingUp } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TeacherStats {
  totalHours: number;
  totalStudents: number;
  completedLessons: number;
  upcomingLessons: number;
  averageRating: number;
  totalEarnings: number;
}

export default function TeacherStatsWidget() {
  const [stats, setStats] = useState<TeacherStats>({
    totalHours: 0,
    totalStudents: 0,
    completedLessons: 0,
    upcomingLessons: 0,
    averageRating: 5.0,
    totalEarnings: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, hourly_rate')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!teacherProfile) {
        setLoading(false);
        return;
      }

      const { data: completedLessons } = await supabase
        .from('lessons')
        .select('duration_minutes, learner_id')
        .eq('teacher_id', teacherProfile.id)
        .eq('status', 'completed');

      const { data: upcomingLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('teacher_id', teacherProfile.id)
        .eq('status', 'booked')
        .gte('scheduled_time', new Date().toISOString());

      const totalMinutes = completedLessons?.reduce((sum, lesson) => sum + lesson.duration_minutes, 0) || 0;
      const totalHours = Math.floor(totalMinutes / 60);

      const uniqueStudents = new Set(completedLessons?.map(lesson => lesson.learner_id) || []);

      const hourlyRate = teacherProfile.hourly_rate || 0;
      const totalEarnings = (totalMinutes / 60) * hourlyRate;

      setStats({
        totalHours,
        totalStudents: uniqueStudents.size,
        completedLessons: completedLessons?.length || 0,
        upcomingLessons: upcomingLessons?.length || 0,
        averageRating: 5.0,
        totalEarnings
      });
    } catch (error) {
      console.error('Error loading teacher stats:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-slate-700 rounded w-32"></div>
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-16 bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  const statItems = [
    {
      icon: Clock,
      label: 'Total Hours Taught',
      value: stats.totalHours.toString(),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      icon: Users,
      label: 'Total Students',
      value: stats.totalStudents.toString(),
      color: 'text-cyan-400',
      bgColor: 'bg-cyan-500/10',
      borderColor: 'border-cyan-500/20'
    },
    {
      icon: BookOpen,
      label: 'Lessons Completed',
      value: stats.completedLessons.toString(),
      color: 'text-green-400',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    },
    {
      icon: TrendingUp,
      label: 'Upcoming Classes',
      value: stats.upcomingLessons.toString(),
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/10',
      borderColor: 'border-amber-500/20'
    },
    {
      icon: Star,
      label: 'Average Rating',
      value: stats.averageRating.toFixed(1),
      color: 'text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20'
    },
    {
      icon: DollarSign,
      label: 'Total Earnings',
      value: `$${stats.totalEarnings.toFixed(0)}`,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <h3 className="text-xl font-bold text-white mb-6">Teaching Stats</h3>

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
                <p className="text-xs text-slate-400 mb-1">{item.label}</p>
                <p className={`text-lg font-bold ${item.color}`}>{item.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
