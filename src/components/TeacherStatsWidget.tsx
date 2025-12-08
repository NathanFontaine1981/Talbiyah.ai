import { useEffect, useState } from 'react';
import { Clock, Users, BookOpen, DollarSign, Star, TrendingUp, Award } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface TeacherStats {
  totalHours: number;
  totalStudents: number;
  completedLessons: number;
  upcomingLessons: number;
  averageRating: number;
  totalEarnings: number;
  tier: string;
  tierName: string;
  tierIcon: string;
  teacherHourlyRate: number;
}

export default function TeacherStatsWidget() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<TeacherStats>({
    totalHours: 0,
    totalStudents: 0,
    completedLessons: 0,
    upcomingLessons: 0,
    averageRating: 5.0,
    totalEarnings: 0,
    tier: 'newcomer',
    tierName: 'Newcomer',
    tierIcon: '🌱',
    teacherHourlyRate: 5.0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  async function loadStats() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacherProfile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching teacher profile:', profileError);
        setLoading(false);
        return;
      }

      if (!teacherProfile) {
        setLoading(false);
        return;
      }

      // Get tier stats from the teacher_tier_stats view
      const { data: tierStats, error: tierError } = await supabase
        .from('teacher_tier_stats')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .single();

      if (tierError) {
        console.error('Error fetching tier stats:', tierError);
        console.log('Attempting to query teacher_profile_id:', teacherProfile.id);
      }

      const { data: upcomingLessons } = await supabase
        .from('lessons')
        .select('id')
        .eq('teacher_id', teacherProfile.id)
        .eq('status', 'booked')
        .gte('scheduled_time', new Date().toISOString());

      if (tierStats) {
        const totalEarnings = tierStats.hours_taught * tierStats.teacher_hourly_rate;

        setStats({
          totalHours: Math.floor(tierStats.hours_taught || 0),
          totalStudents: tierStats.total_students || 0,
          completedLessons: tierStats.completed_lessons || 0,
          upcomingLessons: upcomingLessons?.length || 0,
          averageRating: tierStats.average_rating || 0,
          totalEarnings,
          tier: tierStats.tier || 'bronze',
          tierName: tierStats.tier_name || 'Bronze',
          tierIcon: tierStats.tier_icon || '🥉',
          teacherHourlyRate: tierStats.teacher_hourly_rate || 15.0
        });
      } else {
        console.warn('No tier stats found for teacher:', teacherProfile.id);
      }
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
      value: (stats.completedLessons ?? 0).toString(),
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
      value: `£${stats.totalEarnings.toFixed(0)}`,
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/10',
      borderColor: 'border-emerald-500/20'
    }
  ];

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <h3 className="text-xl font-bold text-white mb-6">Teaching Stats</h3>

      {/* Teacher Tier Badge */}
      <div
        onClick={() => navigate('/teacher/tiers')}
        className="bg-gradient-to-r from-cyan-500/10 to-blue-600/10 rounded-xl p-4 border border-cyan-500/30 mb-4 cursor-pointer hover:border-cyan-500/50 transition"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="text-3xl">{stats.tierIcon}</div>
            <div>
              <p className="text-xs text-slate-400">Current Tier</p>
              <p className="text-lg font-bold text-white">{stats.tierName}</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-slate-400">Hourly Rate</p>
            <p className="text-lg font-bold text-emerald-400">£{stats.teacherHourlyRate.toFixed(2)}</p>
          </div>
        </div>
        <div className="mt-2 flex items-center justify-center">
          <button className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center space-x-1">
            <Award className="w-3 h-3" />
            <span>View Tier Progress</span>
          </button>
        </div>
      </div>

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
