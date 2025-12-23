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

      if (error) throw error;

      let insightLessonIds = new Set();
      if (lessonIds.length > 0) {
        const { data: insightsData } = await supabase
          .from('lesson_insights')
          .select('lesson_id, id')
          .in('lesson_id', lessonIds);
        insightLessonIds = new Set(insightsData?.map(i => i.lesson_id) || []);
      }

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
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48"></div>
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-100 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (recordings.length === 0) {
    return (
      <div className="bg-white rounded-2xl p-6 border border-gray-200">
        <h3 className="text-xl font-bold text-gray-900 mb-6">Recent Recordings</h3>
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="w-8 h-8 text-gray-400" />
          </div>
          <p className="text-gray-500">You don't have any recordings yet</p>
          <p className="text-gray-400 text-sm mt-2">Complete a lesson to get your first recording</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900">Recent Recordings</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={loadRecentRecordings}
            className="p-2 text-gray-500 hover:text-emerald-600 transition"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
          <button
            onClick={() => navigate('/recordings/history')}
            className="text-sm text-emerald-600 hover:text-cyan-300 font-medium transition flex items-center space-x-1"
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
          const isQuran = recording.subject_name?.toLowerCase().includes('quran');

          return (
            <div
              key={recording.id}
              className={`bg-gray-50 rounded-xl p-5 border border-gray-200 transition group ${
                isQuran ? 'hover:border-emerald-500/30' : 'hover:border-blue-500/30'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h4 className={`text-lg font-semibold text-gray-900 mb-1 transition ${
                    isQuran ? 'group-hover:text-emerald-600' : 'group-hover:text-blue-600'
                  }`}>
                    {recording.subject_name}
                  </h4>
                  <p className="text-sm text-gray-500 mb-2">with {recording.teacher_name}</p>
                  <div className="flex items-center space-x-2 text-xs text-gray-500">
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
                {/* Insights button - color based on subject */}
                {recording.has_insights && (
                  <button
                    onClick={() => navigate(`/lesson/${recording.id}/insights`)}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition flex items-center justify-center space-x-2 border ${
                      isQuran
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                        : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Insights</span>
                  </button>
                )}

                {/* Watch video button - color based on subject */}
                {recording.recording_url && !isRecordingExpired ? (
                  <button
                    onClick={() => window.open(recording.recording_url!, '_blank')}
                    className={`flex-1 px-4 py-2.5 rounded-lg font-medium transition flex items-center justify-center space-x-2 border ${
                      isQuran
                        ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100'
                        : 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100'
                    }`}
                  >
                    <PlayCircle className="w-4 h-4" />
                    <span>Watch Video</span>
                  </button>
                ) : recording.recording_url && isRecordingExpired ? (
                  <div className="flex-1 px-4 py-2.5 bg-red-50 text-red-600 rounded-lg font-medium flex items-center justify-center space-x-2 border border-red-200">
                    <PlayCircle className="w-4 h-4" />
                    <span>Video Expired</span>
                  </div>
                ) : !recording.has_insights ? (
                  <div className="flex-1 px-4 py-2.5 bg-amber-50 text-amber-600 rounded-lg font-medium flex items-center justify-center space-x-2 border border-amber-200">
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
