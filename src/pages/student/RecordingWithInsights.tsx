import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  X,
  BookOpen,
  ChevronDown,
  ChevronRight
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import ReactMarkdown from 'react-markdown';
import { format } from 'date-fns';

interface LessonInsight {
  id: string;
  lesson_id: string;
  insight_type: string;
  title: string;
  summary: string;
  detailed_insights: {
    content: string;
    subject: string;
    metadata: {
      surah_name?: string;
      surah_number?: number;
      ayah_range?: string;
      teacher_name: string;
      student_names: string[];
      lesson_date: string;
      duration_minutes?: number;
    };
  };
}

interface Recording {
  id: string;
  lesson_id: string;
  recording_url: string;
  duration_seconds: number;
  created_at: string;
  lessons: {
    scheduled_time: string;
    duration_minutes: number;
    subjects: { name: string };
    teacher_profiles: {
      profiles: { full_name: string };
    };
  };
}

export default function RecordingWithInsights() {
  const { recordingId } = useParams<{ recordingId: string }>();
  const navigate = useNavigate();
  const [recording, setRecording] = useState<Recording | null>(null);
  const [insight, setInsight] = useState<LessonInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSections, setExpandedSections] = useState<Set<number>>(new Set([0, 1])); // First two sections expanded by default

  useEffect(() => {
    loadRecordingAndInsights();
  }, [recordingId]);

  async function loadRecordingAndInsights() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('Please sign in to view recordings');
        setLoading(false);
        return;
      }

      // Get recording with lesson info
      const { data: recordingData, error: recordingError } = await supabase
        .from('lesson_recordings')
        .select(`
          id,
          lesson_id,
          recording_url,
          duration_seconds,
          created_at,
          lessons!inner(
            scheduled_time,
            duration_minutes,
            subjects(name),
            teacher_profiles!inner(
              profiles!inner(full_name)
            )
          )
        `)
        .eq('id', recordingId)
        .single();

      if (recordingError) throw recordingError;
      setRecording(recordingData);

      // Try to get insights for this lesson - prefer real AI over auto_generated
      const { data: insightResults } = await supabase
        .from('lesson_insights')
        .select('*')
        .eq('lesson_id', recordingData.lesson_id)
        .order('created_at', { ascending: false });

      const realInsight = insightResults?.find(i => i.ai_model && i.ai_model !== 'auto_generated');
      const insightData = realInsight || insightResults?.[0] || null;

      if (insightData) {
        setInsight(insightData);
      }

    } catch (err: any) {
      console.error('Error loading recording:', err);
      setError(err.message || 'Failed to load recording');
    } finally {
      setLoading(false);
    }
  }

  function toggleSection(index: number) {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSections(newExpanded);
  }

  function parseInsightsIntoSections(content: string) {
    // Split by major headings (**, ###, or numbered sections)
    const sections = [];
    const lines = content.split('\n');
    let currentSection: { title: string; content: string } | null = null;

    for (const line of lines) {
      // Check if this is a heading
      if (line.match(/^(#{1,3}\s|(\*\*\d+\.|\*\*\d+️⃣))/)) {
        if (currentSection) {
          sections.push(currentSection);
        }
        currentSection = {
          title: line.replace(/^#+\s*/, '').replace(/\*\*/g, '').trim(),
          content: ''
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    }

    if (currentSection) {
      sections.push(currentSection);
    }

    return sections;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-white text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-400 mx-auto mb-4"></div>
          <p>Loading recording...</p>
        </div>
      </div>
    );
  }

  if (error || !recording) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-6">
        <div className="bg-gray-100 rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {error || 'Recording not found'}
          </h2>
          <button
            onClick={() => navigate('/dashboard')}
            className="mt-6 px-6 py-3 bg-emerald-600 hover:bg-cyan-700 text-white font-semibold rounded-lg transition"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const sections = insight ? parseInsightsIntoSections(insight.detailed_insights.content) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Header */}
      <header className="bg-gray-50 border-b border-gray-200 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-[1920px] mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center space-x-2">
                <span>{recording.lessons.subjects.name} Session - Recording</span>
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {recording.lessons.subjects.name} • {format(new Date(recording.lessons.scheduled_time), 'MMMM d, yyyy')}
              </p>
            </div>
            <button
              onClick={() => navigate('/dashboard')}
              className="p-2 text-gray-500 hover:text-white transition rounded-lg hover:bg-gray-100"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-[1920px] mx-auto px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left: Video Player */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 overflow-hidden">
            <div className="aspect-video bg-black relative">
              <video
                controls
                className="w-full h-full"
                src={recording.recording_url}
              >
                Your browser does not support the video tag.
              </video>
            </div>
          </div>

          {/* Right: Interactive Study Notes */}
          <div className="bg-gray-50 rounded-2xl border border-gray-200 p-6 max-h-[calc(100vh-200px)] overflow-y-auto">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-500 rounded-lg flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Interactive Study Notes</h2>
                <p className="text-sm text-emerald-600">Talbiyah Insights AI</p>
              </div>
            </div>

            {insight ? (
              <>
                {/* Lesson Info Card */}
                <div className="bg-emerald-50 rounded-xl p-4 mb-6 border border-emerald-200">
                  <h3 className="text-sm font-semibold text-emerald-700 mb-3">Lesson Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-start">
                      <span className="text-gray-500 w-24">Lesson:</span>
                      <span className="text-gray-900 font-medium">{recording.lessons.subjects.name} Session</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-gray-500 w-24">Date:</span>
                      <span className="text-gray-900">{format(new Date(recording.lessons.scheduled_time), 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-start">
                      <span className="text-gray-500 w-24">Class Type:</span>
                      <span className="text-gray-900">Qur'an with Tadabbur (Understanding & Reflection)</span>
                    </div>
                  </div>
                </div>

                {/* Accordion Sections */}
                <div className="space-y-3">
                  {sections.map((section, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-xl border border-gray-300 overflow-hidden"
                    >
                      <button
                        onClick={() => toggleSection(index)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-100 transition"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500/20 to-emerald-500/20 rounded-lg flex items-center justify-center">
                            <BookOpen className="w-4 h-4 text-emerald-600" />
                          </div>
                          <h3 className="text-left font-semibold text-gray-900">
                            {section.title}
                          </h3>
                        </div>
                        {expandedSections.has(index) ? (
                          <ChevronDown className="w-5 h-5 text-gray-500" />
                        ) : (
                          <ChevronRight className="w-5 h-5 text-gray-500" />
                        )}
                      </button>

                      {expandedSections.has(index) && (
                        <div className="px-4 pb-4 pt-2">
                          <div className="prose prose-sm max-w-none prose-headings:text-emerald-700 prose-p:text-gray-700 prose-li:text-gray-700 prose-strong:text-gray-900">
                            <ReactMarkdown>{section.content}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-500">No study notes available for this recording yet</p>
                <p className="text-sm text-gray-500 mt-2">Insights will be generated after the lesson</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
