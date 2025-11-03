import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, PlayCircle, ChevronRight, Calendar, RefreshCw } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO } from 'date-fns';

interface RecentRecording {
  id: string;
  subject_name: string;
  teacher_name: string;
  scheduled_time: string;
  recording_url: string | null;
  has_insights: boolean;
}

export default function RecentRecordingsCard() {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<RecentRecording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentRecordings();
  }, []);

  async function loadRecentRecordings() {
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
          recording_url,
          status,
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
        .in('status', ['completed', 'in_progress'])
        .order('scheduled_time', { ascending: false })
        .limit(3);

      if (error) throw error;

      if (lessonsData) {
        const formattedRecordings: RecentRecording[] = lessonsData.map((lesson: any) => ({
          id: lesson.id,
          subject_name: lesson.subjects.name,
          teacher_name: lesson.teacher_profiles.profiles.full_name || 'Teacher',
          scheduled_time: lesson.scheduled_time,
          recording_url: lesson.recording_url,
          has_insights: lesson.talbiyah_insights && lesson.talbiyah_insights.length > 0
        }));
        setRecordings(formattedRecordings);
      }
    } catch (error) {
      console.error('Error loading recent recordings:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-48"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-slate-700 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-6">Recent Recordings</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="w-8 h-8 text-slate-600" />
          </div>
          <p className="text-slate-400">No recordings available yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">Recent Recordings</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadRecentRecordings}
            className="p-2 text-slate-400 hover:text-cyan-400 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/recordings/history')}
            className="text-sm text-cyan-400 hover:text-cyan-300 font-medium transition flex items-center space-x-1"
          >
            <span>View All</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="space-y-3">
        {recordings.map((recording) => (
          <div
            key={recording.id}
            className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-cyan-500/30 transition group"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h4 className="text-lg font-semibold text-white mb-1 group-hover:text-cyan-400 transition">
                  {recording.subject_name}
                </h4>
                <p className="text-sm text-slate-400 mb-2">with {recording.teacher_name}</p>
                <div className="flex items-center space-x-2 text-xs text-slate-500">
                  <Calendar className="w-3 h-3" />
                  <span>{format(parseISO(recording.scheduled_time), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {recording.has_insights && (
                <button
                  onClick={() => navigate(`/insights/${recording.id}`)}
                  className="flex-1 px-4 py-2.5 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg font-medium transition flex items-center justify-center space-x-2 border border-cyan-500/20"
                >
                  <FileText className="w-4 h-4" />
                  <span>View Notes</span>
                </button>
              )}

              {recording.recording_url ? (
                <button
                  onClick={() => window.open(recording.recording_url!, '_blank')}
                  className="flex-1 px-4 py-2.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg font-medium transition flex items-center justify-center space-x-2 border border-blue-500/20"
                >
                  <PlayCircle className="w-4 h-4" />
                  <span>Watch Recording</span>
                </button>
              ) : (
                <div className="flex-1 px-4 py-2.5 bg-slate-700/30 text-slate-500 rounded-lg font-medium flex items-center justify-center space-x-2 border border-slate-700/50">
                  <PlayCircle className="w-4 h-4" />
                  <span>Processing...</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
