import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Video, User, ArrowRight, Calendar, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO } from 'date-fns';

interface NextLesson {
  id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  subject_name: string;
  scheduled_time: string;
  duration_minutes: number;
}

export default function NextLessonWidget() {
  const navigate = useNavigate();
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
      <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-6 border border-emerald-500/30 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-32 mb-4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!nextLesson) {
    return (
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-200 backdrop-blur-sm shadow-xl">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
          <Calendar className="w-5 h-5 text-emerald-600" />
          <span>Next Lesson</span>
        </h3>
        <div className="text-center py-6">
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/30">
            <Calendar className="w-10 h-10 text-white" />
          </div>
          <p className="text-gray-600 dark:text-gray-300 mb-2 text-lg font-medium">No upcoming lessons</p>
          <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">Book your next session with a teacher</p>
          <a
            href="/teachers"
            className="inline-block px-8 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-bold rounded-xl transition shadow-xl shadow-emerald-500/30 text-lg animate-pulse hover:animate-none"
          >
            📚 Book a Lesson Now
          </a>
        </div>
      </div>
    );
  }

  const lessonDate = parseISO(nextLesson.scheduled_time);
  const isToday = format(lessonDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  return (
    <div className="bg-gradient-to-br from-emerald-500/10 to-blue-500/10 rounded-2xl p-6 border border-emerald-500/30 backdrop-blur-sm shadow-xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl"></div>

      <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2 relative z-10">
        <Calendar className="w-5 h-5 text-emerald-600" />
        <span>Next Lesson</span>
        {isToday && (
          <span className="ml-auto px-2 py-1 bg-emerald-500/20 text-emerald-600 text-xs font-bold rounded-full animate-pulse">
            TODAY
          </span>
        )}
      </h3>

      <div className="relative z-10 space-y-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center overflow-hidden border-2 border-emerald-500/30">
            {nextLesson.teacher_avatar ? (
              <img
                src={nextLesson.teacher_avatar}
                alt={nextLesson.teacher_name}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-6 h-6 text-gray-500" />
            )}
          </div>

          <div className="flex-1">
            <p className="text-sm text-emerald-600 font-medium mb-1">{nextLesson.subject_name}</p>
            <p className="text-lg font-semibold text-gray-900 dark:text-gray-200">with {nextLesson.teacher_name}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Calendar className="w-4 h-4" />
              <span className="text-xs font-medium">Date</span>
            </div>
            <p className="text-gray-900 dark:text-gray-200 font-semibold">
              {format(lessonDate, 'MMM d, yyyy')}
            </p>
          </div>

          <div className="bg-gray-50 rounded-lg p-3">
            <div className="flex items-center space-x-2 text-gray-500 mb-1">
              <Clock className="w-4 h-4" />
              <span className="text-xs font-medium">Time</span>
            </div>
            <p className="text-gray-900 dark:text-gray-200 font-semibold">
              {format(lessonDate, 'h:mm a')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate(`/lesson/${nextLesson.id}`)}
            className="px-4 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold rounded-lg transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
          >
            <Video className="w-5 h-5" />
            <span>Join</span>
          </button>
          <button
            onClick={() => navigate('/my-classes')}
            className="px-4 py-3 bg-gray-200 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition flex items-center justify-center space-x-2"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-center text-gray-500">
          Duration: {nextLesson.duration_minutes} minutes
        </p>
      </div>
    </div>
  );
}
