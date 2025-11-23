import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FileText, PlayCircle, ChevronRight, Calendar, RefreshCw, Clock } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, differenceInDays, addDays } from 'date-fns';

interface RecentRecording {
  id: string;
  subject_name: string;
  teacher_name: string;
  scheduled_time: string;
  recording_url: string | null;
  has_insights: boolean;
  duration_minutes: number;
}

interface RecentRecordingsCardProps {
  learnerId?: string;
}

export default function RecentRecordingsCard({ learnerId }: RecentRecordingsCardProps) {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<RecentRecording[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRecentRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerId]);

  async function loadRecentRecordings() {
    try {
      let targetLearnerId = learnerId;

      // If no learnerId provided, get current user's learner
      if (!targetLearnerId) {
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

        targetLearnerId = learner.id;
      }

      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          recording_url,
          status,
          duration_minutes,
          teacher_profiles!inner(
            user_id,
            profiles!inner(
              full_name
            )
          ),
          subjects!inner(
            name
          )
        `)
        .eq('learner_id', targetLearnerId)
        .eq('status', 'completed')
        .order('scheduled_time', { ascending: false })
        .limit(10);

      if (error) throw error;

      // Get insights for these lessons
      const lessonIds = lessonsData?.map(l => l.id) || [];
      const { data: insightsData } = await supabase
        .from('lesson_insights')
        .select('lesson_id, id')
        .in('lesson_id', lessonIds);

      if (error) throw error;

      const insightLessonIds = new Set(insightsData?.map(i => i.lesson_id) || []);

      if (lessonsData) {
        const formattedRecordings: RecentRecording[] = lessonsData
          .map((lesson: any) => ({
            id: lesson.id,
            subject_name: lesson.subjects.name,
            teacher_name: lesson.teacher_profiles.profiles.full_name || 'Teacher',
            scheduled_time: lesson.scheduled_time,
            recording_url: lesson.recording_url,
            has_insights: insightLessonIds.has(lesson.id),
            duration_minutes: lesson.duration_minutes
          }))
          .filter((recording) => {
            // Calculate when the lesson ended
            const lessonDate = parseISO(recording.scheduled_time);
            const lessonEndTime = new Date(lessonDate.getTime() + recording.duration_minutes * 60 * 1000);
            const hoursSinceEnd = (new Date().getTime() - lessonEndTime.getTime()) / (1000 * 60 * 60);

            // Only show recordings that have:
            // 1. A recording URL, OR
            // 2. Insights available, OR
            // 3. Are recent enough to still be processing (< 24 hours since lesson ended)
            return recording.recording_url || recording.has_insights || hoursSinceEnd < 24;
          })
          .slice(0, 5); // Limit to 5 most recent after filtering

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
          <p className="text-slate-400">You don't have any recordings yet</p>
          <p className="text-slate-500 text-sm mt-2">Complete a lesson to get your first recording</p>
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
        {recordings.map((recording) => {
          const lessonDate = parseISO(recording.scheduled_time);
          const lessonEndDate = new Date(lessonDate.getTime() + recording.duration_minutes * 60 * 1000);
          const recordingExpiryDate = addDays(lessonEndDate, 7);
          const daysUntilExpiry = differenceInDays(recordingExpiryDate, new Date());
          const isRecordingExpired = daysUntilExpiry < 0;
          const isRecordingExpiringSoon = daysUntilExpiry >= 0 && daysUntilExpiry <= 2;

          return (
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
                    <span>{format(lessonDate, 'MMM d, yyyy')}</span>
                  </div>

                  {/* Recording expiry warning */}
                  {recording.recording_url && !isRecordingExpired && isRecordingExpiringSoon && (
                    <div className="flex items-center space-x-1 mt-2 text-xs text-amber-400">
                      <Clock className="w-3 h-3" />
                      <span>Video expires in {daysUntilExpiry} {daysUntilExpiry === 1 ? 'day' : 'days'}</span>
                    </div>
                  )}

                  {recording.recording_url && isRecordingExpired && (
                    <div className="flex items-center space-x-1 mt-2 text-xs text-red-400">
                      <Clock className="w-3 h-3" />
                      <span>Video expired</span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-3">
                {/* Insights button - always available when insights exist */}
                {recording.has_insights && (
                  <button
                    onClick={() => navigate(`/lesson/${recording.id}/insights`)}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 hover:from-emerald-500/30 hover:to-cyan-500/30 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2 border border-emerald-500/30"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Insights</span>
                  </button>
                )}

                {/* Watch video button - available for 7 days */}
                {recording.recording_url && !isRecordingExpired ? (
                  <button
                    onClick={() => window.open(recording.recording_url!, '_blank')}
                    className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2 border border-cyan-500/30"
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Watch Video</span>
                  </button>
                ) : recording.recording_url && isRecordingExpired ? (
                  <div className="flex-1 px-4 py-2.5 bg-red-500/10 text-red-400 rounded-lg font-medium flex items-center justify-center space-x-2 border border-red-500/30">
                    <PlayCircle className="w-4 h-4" />
                    <span>Video Expired</span>
                  </div>
                ) : !recording.has_insights ? (
                  <div className="flex-1 px-4 py-2.5 bg-amber-500/10 text-amber-400 rounded-lg font-medium flex items-center justify-center space-x-2 border border-amber-500/30">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Processing (up to 24h)</span>
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
