import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, RefreshCw, BookOpen, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO } from 'date-fns';

interface UpcomingLesson {
  id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  subject_name: string;
  scheduled_time: string;
  duration_minutes: number;
}

export default function UpcomingSessionsCard() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<UpcomingLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingSessions();
  }, []);

  async function loadUpcomingSessions() {
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

      const { data: lessonsData, error } = await supabase
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
        .limit(5);

      if (error) throw error;

      if (lessonsData) {
        const formattedLessons: UpcomingLesson[] = lessonsData.map((lesson: any) => ({
          id: lesson.id,
          teacher_name: lesson.teacher_profiles.profiles.full_name || 'Teacher',
          teacher_avatar: lesson.teacher_profiles.profiles.avatar_url,
          subject_name: lesson.subjects.name,
          scheduled_time: lesson.scheduled_time,
          duration_minutes: lesson.duration_minutes
        }));
        setLessons(formattedLessons);
      }
    } catch (error) {
      console.error('Error loading upcoming sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-48"></div>
          <div className="h-24 bg-slate-700 rounded"></div>
          <div className="h-24 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-6">Upcoming Sessions</h3>

        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-slate-600" />
          </div>
          <p className="text-xl text-slate-300 mb-2">You don't have any sessions scheduled yet.</p>
          <p className="text-slate-500 mb-8">Start your learning journey by booking your first session</p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/choose-course')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
            >
              <BookOpen className="w-5 h-5" />
              <span>Book a Session</span>
            </button>

            <button
              onClick={loadUpcomingSessions}
              className="px-6 py-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Upcoming Sessions</h3>
        <button
          onClick={loadUpcomingSessions}
          className="p-2 text-slate-400 hover:text-cyan-400 transition"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => {
          const lessonDate = parseISO(lesson.scheduled_time);
          const isToday = format(lessonDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <div
              key={lesson.id}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-cyan-500/30 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                    {lesson.teacher_avatar ? (
                      <img
                        src={lesson.teacher_avatar}
                        alt={lesson.teacher_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-lg font-semibold text-white">{lesson.subject_name}</h4>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-full">
                          TODAY
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">with {lesson.teacher_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-slate-300 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {format(lessonDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-cyan-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {format(lessonDate, 'h:mm a')}
                      </span>
                    </div>
                  </div>

                  <button className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-lg transition shadow-lg shadow-cyan-500/20 flex items-center space-x-2">
                    <Video className="w-5 h-5" />
                    <span>Join</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
