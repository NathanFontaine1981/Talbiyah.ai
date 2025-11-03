import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, RefreshCw, User, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO } from 'date-fns';

interface TeacherSession {
  id: string;
  student_name: string;
  student_avatar: string | null;
  subject_name: string;
  scheduled_time: string;
  duration_minutes: number;
}

export default function TeacherSessionsCard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUpcomingSessions();
  }, []);

  async function loadUpcomingSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!teacherProfile) {
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
          learners!inner(
            parent_id,
            profiles!inner(
              full_name,
              avatar_url
            )
          ),
          subjects!inner(
            name
          )
        `)
        .eq('teacher_id', teacherProfile.id)
        .eq('status', 'booked')
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(5);

      if (error) throw error;

      if (lessonsData) {
        const formattedSessions: TeacherSession[] = lessonsData.map((lesson: any) => ({
          id: lesson.id,
          student_name: lesson.learners.profiles.full_name || 'Student',
          student_avatar: lesson.learners.profiles.avatar_url,
          subject_name: lesson.subjects.name,
          scheduled_time: lesson.scheduled_time,
          duration_minutes: lesson.duration_minutes
        }));
        setSessions(formattedSessions);
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

  if (sessions.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-6">Upcoming Classes</h3>

        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-slate-600" />
          </div>
          <p className="text-xl text-slate-300 mb-2">No upcoming classes scheduled yet.</p>
          <p className="text-slate-500 mb-8">Students will be able to book sessions based on your availability</p>

          <button
            onClick={loadUpcomingSessions}
            className="px-6 py-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition flex items-center space-x-2 mx-auto"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Upcoming Classes</h3>
        <button
          onClick={loadUpcomingSessions}
          className="p-2 text-slate-400 hover:text-cyan-400 transition"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      <div className="space-y-4">
        {sessions.map((session) => {
          const sessionDate = parseISO(session.scheduled_time);
          const isToday = format(sessionDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

          return (
            <div
              key={session.id}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-blue-500/30 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                    {session.student_avatar ? (
                      <img
                        src={session.student_avatar}
                        alt={session.student_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-lg font-semibold text-white">{session.subject_name}</h4>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                          TODAY
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">with {session.student_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-slate-300 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {format(sessionDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {format(sessionDate, 'h:mm a')}
                      </span>
                    </div>
                  </div>

                  <button className="px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-semibold rounded-lg transition shadow-lg shadow-blue-500/20 flex items-center space-x-2">
                    <Video className="w-5 h-5" />
                    <span>Start</span>
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
