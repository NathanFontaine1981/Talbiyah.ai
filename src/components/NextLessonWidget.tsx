import { useEffect, useState } from 'react';
import { Calendar, Clock, Video, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, isFuture } from 'date-fns';

interface NextLesson {
  id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  subject_name: string;
  scheduled_time: string;
  duration_minutes: number;
}

export default function NextLessonWidget() {
  const [nextLesson, setNextLesson] = useState<NextLesson | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNextLesson();
  }, []);

  async function loadNextLesson() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: learner } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (!learner) {
        setLoading(false);
        return;
      }

      const { data: lessons, error } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          status,
          teacher_profiles!inner(
            user_id,
            profiles!inner(
              full_name,
              avatar_url
            )
          ),
          subjects!inner(
            name
          )
        `)
        .eq('learner_id', learner.id)
        .eq('status', 'booked')
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(1);

      if (error) throw error;

      if (lessons && lessons.length > 0) {
        const lesson = lessons[0];
        setNextLesson({
          id: lesson.id,
          teacher_name: (lesson.teacher_profiles as any).profiles.full_name || 'Teacher',
          teacher_avatar: (lesson.teacher_profiles as any).profiles.avatar_url,
          subject_name: (lesson.subjects as any).name,
          scheduled_time: lesson.scheduled_time,
          duration_minutes: lesson.duration_minutes
        });
      }
    } catch (error) {
      console.error('Error loading next lesson:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/30 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-slate-700 rounded w-32 mb-4"></div>
          <div className="h-20 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (!nextLesson) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-cyan-400" />
          <span>Next Lesson</span>
        </h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <Calendar className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400 mb-4">No upcoming lessons scheduled</p>
          <a
            href="/teachers"
            className="inline-block px-6 py-3 bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-lg transition shadow-lg shadow-cyan-500/20"
          >
            Book a Lesson
          </a>
        </div>
      </div>
    );
  }

  const lessonDate = parseISO(nextLesson.scheduled_time);
  const isToday = format(lessonDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 rounded-2xl p-6 border border-cyan-500/30 backdrop-blur-sm shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-3xl"></div>

      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2 relative z-10">
        <Calendar className="w-5 h-5 text-cyan-400" />
        <span>Next Lesson</span>
        {isToday && (
          <span className="ml-auto px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-full animate-pulse">
            TODAY
          </span>
        )}
      </h3>

      <div className="relative z-10 space-y-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center overflow-hidden border-2 border-cyan-500/30">
            {nextLesson.teacher_avatar ? (
              <img
                src={nextLesson.teacher_avatar}
                alt={nextLesson.teacher_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-slate-400" />
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-cyan-400 font-medium mb-1">{nextLesson.subject_name}</p>
            <p className="text-lg font-semibold text-white">with {nextLesson.teacher_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-slate-400 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Date</span>
            </div>
            <p className="text-white font-semibold">
              {format(lessonDate, 'MMM d, yyyy')}
            </p>
          </div>

          <div className="bg-slate-800/50 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-slate-400 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Time</span>
            </div>
            <p className="text-white font-semibold">
              {format(lessonDate, 'h:mm a')}
            </p>
          </div>
        </div>

        <button className="w-full px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2">
          <Video className="w-5 h-5" />
          <span>Join Lesson</span>
        </button>

        <p className="text-xs text-center text-slate-500">
          Duration: {nextLesson.duration_minutes} minutes
        </p>
      </div>
    </div>
  );
}
