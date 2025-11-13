import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Video, FileText, Clock, Calendar, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO } from 'date-fns';

interface Recording {
  id: string;
  scheduled_time: string;
  duration_minutes: number;
  subject_name: string;
  teacher_name: string;
  has_insights: boolean;
  recording_url: string | null;
}

export default function RecordingsHistory() {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);

  useEffect(() => {
    loadRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRecordings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Check if user is a teacher
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacherProfile) {
        // Load recordings as teacher
        setIsTeacher(true);

        const { data: lessonsData, error } = await supabase
          .from('lessons')
          .select(`
            id,
            scheduled_time,
            duration_minutes,
            recording_url,
            learners!inner(
              parent_id,
              profiles!inner(
                full_name
              )
            ),
            subjects!inner(
              name
            ),
            talbiyah_insights(id)
          `)
          .eq('teacher_id', teacherProfile.id)
          .eq('status', 'completed')
          .order('scheduled_time', { ascending: false });

        if (error) throw error;

        if (lessonsData) {
          const formattedRecordings: Recording[] = lessonsData.map((lesson: any) => ({
            id: lesson.id,
            scheduled_time: lesson.scheduled_time,
            duration_minutes: lesson.duration_minutes,
            subject_name: lesson.subjects.name,
            teacher_name: lesson.learners.profiles.full_name || 'Student',
            has_insights: lesson.talbiyah_insights && lesson.talbiyah_insights.length > 0,
            recording_url: lesson.recording_url
          }));
          setRecordings(formattedRecordings);
        }
      } else {
        // Load recordings as student
        setIsTeacher(false);

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
            recording_url,
            teacher_profiles!inner(
              user_id,
              profiles!inner(
                full_name
              )
            ),
            subjects!inner(
              name
            ),
            talbiyah_insights(id)
          `)
          .eq('learner_id', learner.id)
          .eq('status', 'completed')
          .order('scheduled_time', { ascending: false });

        if (error) throw error;

        if (lessonsData) {
          const formattedRecordings: Recording[] = lessonsData.map((lesson: any) => ({
            id: lesson.id,
            scheduled_time: lesson.scheduled_time,
            duration_minutes: lesson.duration_minutes,
            subject_name: lesson.subjects.name,
            teacher_name: lesson.teacher_profiles.profiles.full_name || 'Teacher',
            has_insights: lesson.talbiyah_insights && lesson.talbiyah_insights.length > 0,
            recording_url: lesson.recording_url
          }));
          setRecordings(formattedRecordings);
        }
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-center">
          <Loader2 className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading recordings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-600 hover:text-slate-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <h1 className="text-xl font-bold text-slate-900 flex items-center space-x-2">
              <Video className="w-6 h-6 text-cyan-500" />
              <span>My Recordings</span>
            </h1>

            <div className="w-40"></div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
        <div className="mb-6">
          <p className="text-slate-600">
            {recordings.length} {recordings.length === 1 ? 'recording' : 'recordings'} available
          </p>
        </div>

        {recordings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
            <Video className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">No recordings yet</h3>
            <p className="text-slate-600 mb-6">
              {isTeacher
                ? 'Your completed lessons will appear here with recordings'
                : 'Complete some lessons to see your recordings here'
              }
            </p>
            {!isTeacher && (
              <button
                onClick={() => navigate('/subjects')}
                className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition"
              >
                Book a Lesson
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="bg-white rounded-2xl p-6 border border-slate-200 hover:border-slate-300 transition shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{recording.subject_name}</h3>
                        <p className="text-sm text-slate-600">
                          {isTeacher ? `Student: ${recording.teacher_name}` : `with ${recording.teacher_name}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-slate-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-slate-400" />
                        <span>{format(parseISO(recording.scheduled_time), 'MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span>{recording.duration_minutes} minutes</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {recording.has_insights && (
                        <button
                          onClick={() => navigate(`/lesson/${recording.id}/insights`)}
                          className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-medium transition flex items-center space-x-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View AI Notes</span>
                        </button>
                      )}

                      {recording.recording_url ? (
                        <button
                          onClick={() => window.open(recording.recording_url!, '_blank')}
                          className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition flex items-center space-x-2"
                        >
                          <Video className="w-4 h-4" />
                          <span>Watch Video</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-slate-200 text-slate-500 rounded-lg font-medium cursor-not-allowed flex items-center space-x-2"
                        >
                          <Video className="w-4 h-4" />
                          <span>Video Processing</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
