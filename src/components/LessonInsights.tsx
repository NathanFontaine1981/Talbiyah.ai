import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Star,
  TrendingUp,
  Target,
  Lightbulb,
  Play,
  Download,
  Clock,
  Calendar,
  User,
  AlertCircle,
  CheckCircle,
  Loader
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, differenceInDays } from 'date-fns';

interface LessonInsight {
  id: string;
  lesson_id: string;
  summary: string;
  key_topics: string[];
  areas_of_strength: string[];
  areas_for_improvement: string[];
  homework_suggestions: string[];
  next_lesson_recommendations: string;
  teacher_notes?: string;
  student_participation_score?: number;
  comprehension_level?: string;
}

interface LessonRecording {
  id: string;
  lesson_id: string;
  recording_url: string;
  duration_seconds?: number;
  expires_at?: string;
  status: string;
}

interface LessonDetails {
  id: string;
  scheduled_time: string;
  duration_minutes: number;
  subject_name: string;
  teacher_name: string;
  learner_name: string;
}

export default function LessonInsights() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState<LessonDetails | null>(null);
  const [insights, setInsights] = useState<LessonInsight | null>(null);
  const [recording, setRecording] = useState<LessonRecording | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadLessonData();
  }, [lessonId]);

  async function loadLessonData() {
    if (!lessonId) return;

    try {
      setLoading(true);

      // Load lesson details
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          subjects(name),
          teacher_profiles(
            profiles(full_name)
          ),
          learners(name)
        `)
        .eq('id', lessonId)
        .single();

      if (lessonError) throw lessonError;

      setLesson({
        id: lessonData.id,
        scheduled_time: lessonData.scheduled_time,
        duration_minutes: lessonData.duration_minutes,
        subject_name: lessonData.subjects?.name || 'Unknown Subject',
        teacher_name: lessonData.teacher_profiles?.profiles?.full_name || 'Teacher',
        learner_name: lessonData.learners?.name || 'Student'
      });

      // Load insights
      const { data: insightsData } = await supabase
        .from('lesson_insights')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (insightsData) {
        setInsights(insightsData);
      }

      // Load recording
      const { data: recordingData } = await supabase
        .from('lesson_recordings')
        .select('*')
        .eq('lesson_id', lessonId)
        .maybeSingle();

      if (recordingData) {
        setRecording(recordingData);
      }

    } catch (err: any) {
      console.error('Error loading lesson data:', err);
      setError(err.message || 'Failed to load lesson data');
    } finally {
      setLoading(false);
    }
  }

  function formatDuration(seconds?: number): string {
    if (!seconds) return 'Unknown';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  function getDaysUntilExpiry(expiresAt?: string): number {
    if (!expiresAt) return 0;
    return differenceInDays(parseISO(expiresAt), new Date());
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader className="w-16 h-16 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Loading lesson insights...</p>
        </div>
      </div>
    );
  }

  if (error || !lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-6">
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 max-w-md text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Unable to Load</h2>
          <p className="text-slate-400 mb-6">{error || 'Lesson not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-semibold transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const daysUntilExpiry = recording?.expires_at ? getDaysUntilExpiry(recording.expires_at) : 0;
  const isRecordingExpired = daysUntilExpiry <= 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="bg-gradient-to-r from-emerald-600/20 to-cyan-600/20 rounded-2xl p-6 border border-emerald-500/30">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white mb-2">{lesson.subject_name}</h1>
                <div className="flex items-center space-x-4 text-slate-300">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-4 h-4" />
                    <span>{format(parseISO(lesson.scheduled_time), 'MMM d, yyyy')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="w-4 h-4" />
                    <span>{format(parseISO(lesson.scheduled_time), 'h:mm a')}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <User className="w-4 h-4" />
                    <span>{lesson.learner_name}</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Duration</div>
                <div className="text-2xl font-bold text-white">{lesson.duration_minutes} min</div>
              </div>
            </div>
          </div>
        </div>

        {/* Recording Section */}
        {recording && (
          <div className="mb-8">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
              <Play className="w-5 h-5 text-cyan-400" />
              <span>Lesson Recording</span>
            </h2>

            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              {isRecordingExpired ? (
                <div className="text-center py-8">
                  <AlertCircle className="w-12 h-12 text-amber-400 mx-auto mb-3" />
                  <p className="text-slate-300 font-medium">Recording has expired</p>
                  <p className="text-slate-500 text-sm">Recordings are available for 7 days after the lesson</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-slate-300">
                        Duration: {formatDuration(recording.duration_seconds)}
                      </p>
                      {recording.expires_at && (
                        <p className="text-amber-400 text-sm flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>Expires in {daysUntilExpiry} days</span>
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-3">
                      <a
                        href={recording.recording_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg font-medium transition flex items-center space-x-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>Watch</span>
                      </a>
                      <a
                        href={recording.recording_url}
                        download
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-medium transition flex items-center space-x-2"
                      >
                        <Download className="w-4 h-4" />
                        <span>Download</span>
                      </a>
                    </div>
                  </div>

                  <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                    <p className="text-amber-300 text-sm">
                      Download the recording to keep it permanently. After {daysUntilExpiry} days, it will no longer be available online.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* Insights Section */}
        {insights ? (
          <div className="space-y-6">
            {/* Summary */}
            <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                <span>Lesson Summary</span>
              </h2>
              <p className="text-slate-300 leading-relaxed">{insights.summary}</p>

              {insights.student_participation_score && (
                <div className="mt-4 flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-slate-400">Participation:</span>
                    <span className="text-emerald-400 font-bold">{insights.student_participation_score}%</span>
                  </div>
                  {insights.comprehension_level && (
                    <div className="flex items-center space-x-2">
                      <span className="text-slate-400">Level:</span>
                      <span className="px-2 py-1 bg-cyan-500/20 text-cyan-300 rounded text-sm font-medium capitalize">
                        {insights.comprehension_level}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Key Topics */}
            {insights.key_topics && insights.key_topics.length > 0 && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Target className="w-5 h-5 text-purple-400" />
                  <span>Key Topics Covered</span>
                </h2>
                <div className="flex flex-wrap gap-2">
                  {insights.key_topics.map((topic, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1.5 bg-purple-500/20 text-purple-300 rounded-lg text-sm font-medium"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Strengths & Improvements */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* Strengths */}
              {insights.areas_of_strength && insights.areas_of_strength.length > 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-emerald-500/30">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <Star className="w-5 h-5 text-emerald-400" />
                    <span>Strengths</span>
                  </h2>
                  <ul className="space-y-2">
                    {insights.areas_of_strength.map((strength, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{strength}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Areas for Improvement */}
              {insights.areas_for_improvement && insights.areas_for_improvement.length > 0 && (
                <div className="bg-slate-800/50 rounded-2xl p-6 border border-amber-500/30">
                  <h2 className="text-lg font-bold text-white mb-4 flex items-center space-x-2">
                    <TrendingUp className="w-5 h-5 text-amber-400" />
                    <span>Areas to Improve</span>
                  </h2>
                  <ul className="space-y-2">
                    {insights.areas_for_improvement.map((area, idx) => (
                      <li key={idx} className="flex items-start space-x-2">
                        <Target className="w-4 h-4 text-amber-400 mt-0.5 flex-shrink-0" />
                        <span className="text-slate-300">{area}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Homework Suggestions */}
            {insights.homework_suggestions && insights.homework_suggestions.length > 0 && (
              <div className="bg-slate-800/50 rounded-2xl p-6 border border-slate-700/50">
                <h2 className="text-xl font-bold text-white mb-4 flex items-center space-x-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" />
                  <span>Suggested Practice</span>
                </h2>
                <ul className="space-y-3">
                  {insights.homework_suggestions.map((suggestion, idx) => (
                    <li key={idx} className="flex items-start space-x-3 bg-slate-700/30 rounded-lg p-3">
                      <span className="w-6 h-6 bg-yellow-500/20 text-yellow-400 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-slate-300">{suggestion}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Next Lesson Recommendations */}
            {insights.next_lesson_recommendations && (
              <div className="bg-gradient-to-r from-cyan-600/20 to-blue-600/20 rounded-2xl p-6 border border-cyan-500/30">
                <h2 className="text-xl font-bold text-white mb-3">Next Steps</h2>
                <p className="text-slate-300">{insights.next_lesson_recommendations}</p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-2xl p-12 text-center border border-slate-700/50">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-white mb-2">Insights Coming Soon</h3>
            <p className="text-slate-400">
              Lesson insights are being generated. Check back shortly for a detailed analysis of this lesson.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
