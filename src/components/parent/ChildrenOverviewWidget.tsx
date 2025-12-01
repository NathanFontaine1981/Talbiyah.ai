import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Users,
  Trophy,
  Flame,
  BookOpen,
  Clock,
  TrendingUp,
  Calendar,
  ChevronRight,
  Star
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { calculateAge } from '../../utils/ageCalculations';

interface ChildProgress {
  id: string;
  name: string;
  age: number | null;
  date_of_birth: string | null;
  gender: string | null;
  total_xp: number;
  current_level: number;
  current_streak: number;
  completedLessons: number;
  totalHours: number;
  upcomingLessons: number;
  lastLessonDate: string | null;
}

interface ChildrenOverviewWidgetProps {
  parentId: string;
  onSelectChild?: (childId: string) => void;
}

export default function ChildrenOverviewWidget({ parentId, onSelectChild }: ChildrenOverviewWidgetProps) {
  const navigate = useNavigate();
  const [children, setChildren] = useState<ChildProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChildrenProgress();
  }, [parentId]);

  async function loadChildrenProgress() {
    try {
      // Get all children for this parent
      const { data: learners, error: learnersError } = await supabase
        .from('learners')
        .select('id, name, age, date_of_birth, gender, total_xp, current_level, current_streak')
        .eq('parent_id', parentId);

      if (learnersError) throw learnersError;

      if (!learners || learners.length === 0) {
        setChildren([]);
        setLoading(false);
        return;
      }

      // For each child, get their lesson stats
      const childrenWithProgress = await Promise.all(
        learners.map(async (learner) => {
          // Get completed lessons
          const { data: completedLessons } = await supabase
            .from('lessons')
            .select('id, duration_minutes, scheduled_start')
            .eq('learner_id', learner.id)
            .eq('status', 'completed')
            .order('scheduled_start', { ascending: false });

          // Get upcoming lessons
          const now = new Date().toISOString();
          const { data: upcomingLessons } = await supabase
            .from('lessons')
            .select('id')
            .eq('learner_id', learner.id)
            .in('status', ['scheduled', 'confirmed'])
            .gte('scheduled_start', now);

          const totalMinutes = completedLessons?.reduce((sum, l) => sum + (l.duration_minutes || 0), 0) || 0;
          const lastLesson = completedLessons?.[0]?.scheduled_start || null;

          return {
            ...learner,
            age: learner.date_of_birth ? calculateAge(learner.date_of_birth) : learner.age,
            completedLessons: completedLessons?.length || 0,
            totalHours: Math.round(totalMinutes / 60 * 10) / 10,
            upcomingLessons: upcomingLessons?.length || 0,
            lastLessonDate: lastLesson
          };
        })
      );

      setChildren(childrenWithProgress);
    } catch (error) {
      console.error('Error loading children progress:', error);
    } finally {
      setLoading(false);
    }
  }

  function formatLastLesson(dateStr: string | null): string {
    if (!dateStr) return 'No lessons yet';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return date.toLocaleDateString();
  }

  function getLevelTitle(level: number): string {
    if (level <= 3) return 'Beginner';
    if (level <= 6) return 'Intermediate';
    if (level <= 10) return 'Advanced';
    return 'Expert';
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-200 rounded w-48"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[1, 2].map(i => (
              <div key={i} className="h-48 bg-slate-100 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (children.length === 0) {
    return null;
  }

  // Calculate totals
  const totalXP = children.reduce((sum, c) => sum + (c.total_xp || 0), 0);
  const totalHours = children.reduce((sum, c) => sum + c.totalHours, 0);
  const totalLessons = children.reduce((sum, c) => sum + c.completedLessons, 0);
  const totalUpcoming = children.reduce((sum, c) => sum + c.upcomingLessons, 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-lg mb-6">
      {/* Header with Family Stats */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-violet-600 rounded-xl flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-slate-900">Family Overview</h3>
            <p className="text-sm text-slate-500">{children.length} {children.length === 1 ? 'child' : 'children'} learning</p>
          </div>
        </div>
      </div>

      {/* Family Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl p-4 border border-amber-200">
          <div className="flex items-center space-x-2 mb-2">
            <Trophy className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-800">Total XP</span>
          </div>
          <p className="text-2xl font-bold text-amber-600">{totalXP.toLocaleString()}</p>
        </div>
        <div className="bg-gradient-to-br from-cyan-50 to-blue-50 rounded-xl p-4 border border-cyan-200">
          <div className="flex items-center space-x-2 mb-2">
            <Clock className="w-5 h-5 text-cyan-600" />
            <span className="text-sm font-medium text-cyan-800">Hours Learned</span>
          </div>
          <p className="text-2xl font-bold text-cyan-600">{totalHours}</p>
        </div>
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-4 border border-emerald-200">
          <div className="flex items-center space-x-2 mb-2">
            <BookOpen className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-emerald-800">Lessons Done</span>
          </div>
          <p className="text-2xl font-bold text-emerald-600">{totalLessons}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl p-4 border border-purple-200">
          <div className="flex items-center space-x-2 mb-2">
            <Calendar className="w-5 h-5 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">Upcoming</span>
          </div>
          <p className="text-2xl font-bold text-purple-600">{totalUpcoming}</p>
        </div>
      </div>

      {/* Individual Child Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {children.map((child) => (
          <div
            key={child.id}
            onClick={() => onSelectChild?.(child.id)}
            className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-xl p-5 border border-slate-200 hover:border-purple-300 hover:shadow-md transition cursor-pointer group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl font-bold ${
                  child.gender === 'Female'
                    ? 'bg-gradient-to-br from-pink-400 to-rose-500 text-white'
                    : 'bg-gradient-to-br from-blue-400 to-indigo-500 text-white'
                }`}>
                  {child.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h4 className="font-bold text-slate-900 text-lg">{child.name}</h4>
                  <p className="text-sm text-slate-500">
                    {child.age ? `Age ${child.age}` : ''}
                    {child.age && child.current_level ? ' • ' : ''}
                    Level {child.current_level || 1} ({getLevelTitle(child.current_level || 1)})
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-purple-500 transition" />
            </div>

            {/* Child Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">XP</p>
                  <p className="font-semibold text-slate-900">{(child.total_xp || 0).toLocaleString()}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Flame className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Streak</p>
                  <p className="font-semibold text-slate-900">{child.current_streak || 0} days</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <BookOpen className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Lessons</p>
                  <p className="font-semibold text-slate-900">{child.completedLessons}</p>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-cyan-100 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-cyan-600" />
                </div>
                <div>
                  <p className="text-xs text-slate-500">Hours</p>
                  <p className="font-semibold text-slate-900">{child.totalHours}h</p>
                </div>
              </div>
            </div>

            {/* Last Lesson / Upcoming */}
            <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between text-sm">
              <span className="text-slate-500">
                Last lesson: <span className="text-slate-700 font-medium">{formatLastLesson(child.lastLessonDate)}</span>
              </span>
              {child.upcomingLessons > 0 && (
                <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-semibold">
                  {child.upcomingLessons} upcoming
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
