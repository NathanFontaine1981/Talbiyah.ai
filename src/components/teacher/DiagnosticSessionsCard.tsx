import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Calendar,
  Clock,
  User,
  ArrowRight,
  FileText,
  AlertCircle,
  Loader2,
  CheckCircle
} from 'lucide-react';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';

interface DiagnosticAssessment {
  id: string;
  lesson_id: string;
  status: string;
  pre_assessment_responses: any;
  ai_preliminary_assessment: any;
  created_at: string;
  lesson?: {
    id: string;
    scheduled_time: string;
    status: string;
    learner?: {
      name: string;
    };
    subjects?: {
      name: string;
    };
  };
}

interface DiagnosticSessionsCardProps {
  teacherId: string;
}

export default function DiagnosticSessionsCard({ teacherId }: DiagnosticSessionsCardProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [upcomingDiagnostics, setUpcomingDiagnostics] = useState<DiagnosticAssessment[]>([]);
  const [pendingReports, setPendingReports] = useState<DiagnosticAssessment[]>([]);

  useEffect(() => {
    loadDiagnostics();
  }, [teacherId]);

  async function loadDiagnostics() {
    try {
      // Get all diagnostic assessments assigned to this teacher
      const { data, error } = await supabase
        .from('diagnostic_assessments')
        .select(`
          id,
          lesson_id,
          status,
          pre_assessment_responses,
          ai_preliminary_assessment,
          created_at,
          lessons!diagnostic_assessments_lesson_id_fkey(
            id,
            scheduled_time,
            status,
            learners(name),
            subjects(name)
          )
        `)
        .eq('teacher_id', teacherId)
        .in('status', ['lesson_scheduled', 'lesson_complete'])
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading diagnostics:', error);
        return;
      }

      // Split into upcoming and pending reports
      const upcoming: DiagnosticAssessment[] = [];
      const pending: DiagnosticAssessment[] = [];

      (data || []).forEach((assessment: any) => {
        const formattedAssessment: DiagnosticAssessment = {
          ...assessment,
          lesson: assessment.lessons ? {
            id: assessment.lessons.id,
            scheduled_time: assessment.lessons.scheduled_time,
            status: assessment.lessons.status,
            learner: assessment.lessons.learners,
            subjects: assessment.lessons.subjects
          } : undefined
        };

        if (assessment.status === 'lesson_scheduled' && assessment.lessons) {
          upcoming.push(formattedAssessment);
        } else if (assessment.status === 'lesson_complete') {
          pending.push(formattedAssessment);
        }
      });

      // Sort upcoming by scheduled time
      upcoming.sort((a, b) => {
        const timeA = new Date(a.lesson?.scheduled_time || 0).getTime();
        const timeB = new Date(b.lesson?.scheduled_time || 0).getTime();
        return timeA - timeB;
      });

      setUpcomingDiagnostics(upcoming);
      setPendingReports(pending);
    } catch (err) {
      console.error('Error loading diagnostics:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-gray-50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 mb-8">
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
        </div>
      </div>
    );
  }

  if (upcomingDiagnostics.length === 0 && pendingReports.length === 0) {
    return null;
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Pending Reports - Show Warning */}
      {pendingReports.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-gray-900">
                Assessment Reports to Complete ({pendingReports.length})
              </h3>
              <p className="text-sm text-amber-700">
                Please complete these diagnostic assessment reports to release payment
              </p>
            </div>
          </div>

          <div className="space-y-3">
            {pendingReports.map((assessment) => (
              <div
                key={assessment.id}
                className="bg-white rounded-xl p-4 border border-amber-200 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {assessment.lesson?.learner?.name || assessment.pre_assessment_responses?.student_name || 'Student'}
                    </p>
                    <p className="text-sm text-gray-500">
                      {assessment.lesson?.subjects?.name || 'Quran'} • Diagnostic Assessment
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/teacher/diagnostic/${assessment.lesson_id}`)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-lg transition flex items-center gap-2"
                >
                  <FileText className="w-4 h-4" />
                  Complete Report
                </button>
              </div>
            ))}
          </div>

          <div className="mt-4 p-3 bg-amber-100 rounded-lg text-sm text-amber-800">
            You'll receive £3 for each completed diagnostic assessment
          </div>
        </div>
      )}

      {/* Upcoming Diagnostic Sessions */}
      {upcomingDiagnostics.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
              <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-emerald-500" />
              </div>
              Upcoming Diagnostic Assessments
            </h3>
          </div>

          <div className="space-y-3">
            {upcomingDiagnostics.map((assessment) => {
              const scheduledTime = assessment.lesson?.scheduled_time
                ? new Date(assessment.lesson.scheduled_time)
                : null;
              const isLessonToday = scheduledTime ? isToday(scheduledTime) : false;
              const isLessonTomorrow = scheduledTime ? isTomorrow(scheduledTime) : false;
              const isLessonPast = scheduledTime ? isPast(scheduledTime) : false;

              return (
                <div
                  key={assessment.id}
                  className="bg-gray-50 rounded-xl p-4 border border-gray-200 hover:border-emerald-300 transition"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                        <User className="w-6 h-6 text-emerald-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-semibold text-gray-900">
                            {assessment.lesson?.learner?.name || assessment.pre_assessment_responses?.student_name || 'Student'}
                          </p>
                          {isLessonToday && !isLessonPast && (
                            <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs font-semibold rounded-full">
                              Today
                            </span>
                          )}
                          {isLessonTomorrow && (
                            <span className="px-2 py-0.5 bg-amber-500 text-white text-xs font-semibold rounded-full">
                              Tomorrow
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">
                          {assessment.lesson?.subjects?.name || 'Quran'} • 20-minute diagnostic
                        </p>
                        {scheduledTime && (
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                {format(scheduledTime, 'EEE, MMM d')}
                              </span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{format(scheduledTime, 'h:mm a')}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <button
                        onClick={() => navigate(`/teacher/diagnostic-prep/${assessment.id}`)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition text-sm flex items-center gap-2"
                      >
                        View Prep
                        <ArrowRight className="w-4 h-4" />
                      </button>
                      {isLessonToday && !isLessonPast && (
                        <button
                          onClick={() => navigate(`/lesson/${assessment.lesson_id}`)}
                          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white font-medium rounded-lg transition text-sm"
                        >
                          Join Session
                        </button>
                      )}
                    </div>
                  </div>

                  {/* AI Assessment Summary Preview */}
                  {assessment.ai_preliminary_assessment && (
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-4 h-4 text-emerald-500" />
                        <span className="text-sm font-medium text-gray-700">AI Assessment Preview</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                          Level: {assessment.ai_preliminary_assessment.estimated_level}
                        </span>
                        <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs capitalize">
                          Phase: {assessment.ai_preliminary_assessment.recommended_phase}
                        </span>
                        {assessment.ai_preliminary_assessment.methodology_fit && (
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            assessment.ai_preliminary_assessment.methodology_fit === 'strong'
                              ? 'bg-emerald-100 text-emerald-700'
                              : assessment.ai_preliminary_assessment.methodology_fit === 'moderate'
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}>
                            Fit: {assessment.ai_preliminary_assessment.methodology_fit.replace(/_/g, ' ')}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
