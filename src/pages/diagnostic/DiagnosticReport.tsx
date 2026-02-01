import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Download,
  Sparkles,
  User,
  Calendar,
  Clock,
  Star,
  CheckCircle,
  AlertTriangle,
  ChevronLeft,
  Loader2,
  ArrowRight,
  Target,
  TrendingUp,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';

export default function DiagnosticReport() {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{ assessmentId: string }>();

  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    loadReport();
  }, [assessmentId]);

  async function loadReport() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      // Load assessment
      const { data, error: fetchError } = await supabase
        .from('diagnostic_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (fetchError) throw fetchError;

      // Verify ownership
      if (data.student_id !== user.id) {
        setError('Unauthorized');
        setLoading(false);
        return;
      }

      setAssessment(data);

      // Load lesson and teacher info
      if (data.lesson_id) {
        const { data: lessonData } = await supabase
          .from('lessons')
          .select(`
            *,
            teacher_profiles!lessons_teacher_id_fkey(
              id,
              profiles!teacher_profiles_user_id_fkey(full_name, avatar_url)
            )
          `)
          .eq('id', data.lesson_id)
          .single();

        setLesson(lessonData);
        setTeacher(lessonData?.teacher_profiles);
      }

    } catch (err: any) {
      console.error('Error loading report:', err);
      setError(err.message || 'Failed to load report');
    } finally {
      setLoading(false);
    }
  }

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !assessment) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 text-center">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Report Not Available</h1>
          <p className="text-gray-600 mb-6">{error || 'Assessment not found'}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  const aiAssessment = assessment.ai_preliminary_assessment;
  const teacherAssessment = assessment.teacher_assessment;
  const preResponses = assessment.pre_assessment_responses;
  const isComplete = assessment.status === 'report_complete';

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      {/* Header - Hide on print */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50 print:hidden">
        <div className="max-w-5xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Diagnostic Assessment Report</h1>
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
            >
              <Download className="w-5 h-5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8 print:px-0 print:py-0">
        {/* Report Status Banner */}
        {!isComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex items-center gap-3 print:hidden">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            <div>
              <p className="font-medium text-amber-800">Assessment In Progress</p>
              <p className="text-sm text-amber-600">
                Your full report will be available after the teacher completes their evaluation.
              </p>
            </div>
          </div>
        )}

        {/* Report Cover */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8 print:border-0 print:shadow-none print:rounded-none">
          {/* Header Banner */}
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 px-8 py-6 text-white">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                <BookOpen className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">Talbiyah.ai</h1>
                <p className="text-emerald-100">Diagnostic Assessment Report</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 mt-6">
              <div>
                <p className="text-emerald-200 text-sm">Student</p>
                <p className="font-semibold text-lg">{preResponses?.student_name || 'Student'}</p>
              </div>
              <div>
                <p className="text-emerald-200 text-sm">Assessment Date</p>
                <p className="font-semibold text-lg">
                  {lesson?.scheduled_time
                    ? format(new Date(lesson.scheduled_time), 'MMM d, yyyy')
                    : format(new Date(assessment.created_at), 'MMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-emerald-200 text-sm">Subject</p>
                <p className="font-semibold text-lg capitalize">
                  {assessment.subject_area?.replace(/_/g, ' ') || 'Quran'}
                </p>
              </div>
            </div>
          </div>

          {/* Teacher Info */}
          {teacher && (
            <div className="px-8 py-6 border-b border-gray-200">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center">
                  {teacher.profiles?.avatar_url ? (
                    <img
                      src={teacher.profiles.avatar_url}
                      alt={teacher.profiles.full_name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <User className="w-8 h-8 text-emerald-600" />
                  )}
                </div>
                <div>
                  <p className="text-sm text-gray-500">Assessed by</p>
                  <p className="text-xl font-bold text-gray-900">{teacher.profiles?.full_name}</p>
                  <p className="text-sm text-gray-500">Talbiyah Certified Teacher</p>
                </div>
              </div>
            </div>
          )}

          {/* Assessment Summary */}
          <div className="px-8 py-6">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-500" />
              Assessment Summary
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {/* Estimated Level */}
              <div className="bg-gray-50 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-2">Current Level</p>
                <p className="text-2xl font-bold text-gray-900">
                  {teacherAssessment?.observed_level?.replace(/_/g, ' ') ||
                    aiAssessment?.estimated_level ||
                    'Pending Assessment'}
                </p>
                {teacherAssessment?.level_notes && (
                  <p className="text-sm text-gray-600 mt-2">{teacherAssessment.level_notes}</p>
                )}
              </div>

              {/* Recommended Phase */}
              <div className="bg-emerald-50 rounded-xl p-5">
                <p className="text-sm text-gray-500 mb-2">Recommended Starting Phase</p>
                <p className="text-2xl font-bold text-emerald-600 capitalize">
                  {teacherAssessment?.confirmed_phase ||
                    assessment.recommended_phase ||
                    'Pending Assessment'}
                </p>
                {teacherAssessment?.phase_reasoning && (
                  <p className="text-sm text-gray-600 mt-2">{teacherAssessment.phase_reasoning}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Methodology Breakdown */}
        {teacherAssessment && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8 print:border-0 print:shadow-none">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <BookOpen className="w-6 h-6 text-emerald-500" />
              Talbiyah Methodology Assessment
            </h2>

            <div className="grid md:grid-cols-3 gap-6">
              {/* Understanding */}
              <div className="bg-blue-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
                  <h3 className="font-bold text-gray-900">Understanding (Fahm)</h3>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= (teacherAssessment.understanding_level || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {teacherAssessment.understanding_level}/5
                  </span>
                </div>
                {teacherAssessment.understanding_notes && (
                  <p className="text-sm text-gray-600">{teacherAssessment.understanding_notes}</p>
                )}
              </div>

              {/* Fluency */}
              <div className="bg-purple-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
                  <h3 className="font-bold text-gray-900">Fluency (Itqan)</h3>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= (teacherAssessment.fluency_level || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {teacherAssessment.fluency_level}/5
                  </span>
                </div>
                {teacherAssessment.fluency_notes && (
                  <p className="text-sm text-gray-600">{teacherAssessment.fluency_notes}</p>
                )}
              </div>

              {/* Memorization */}
              <div className="bg-amber-50 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="w-8 h-8 bg-amber-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
                  <h3 className="font-bold text-gray-900">Memorization (Hifz)</h3>
                </div>
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <Star
                      key={star}
                      className={`w-5 h-5 ${
                        star <= (teacherAssessment.memorization_level || 0)
                          ? 'text-amber-400 fill-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                  <span className="ml-2 text-sm text-gray-600">
                    {teacherAssessment.memorization_level}/5
                  </span>
                </div>
                {teacherAssessment.memorization_notes && (
                  <p className="text-sm text-gray-600">{teacherAssessment.memorization_notes}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Strengths & Areas for Improvement */}
        <div className="grid md:grid-cols-2 gap-8 mb-8">
          {/* Strengths */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 print:border-0 print:shadow-none">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <CheckCircle className="w-6 h-6 text-emerald-500" />
              Strengths Observed
            </h2>

            <div className="space-y-3">
              {(teacherAssessment?.observed_strengths || aiAssessment?.identified_strengths || []).map((strength: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  </div>
                  <p className="text-gray-700">{strength}</p>
                </div>
              ))}
              {(!teacherAssessment?.observed_strengths && !aiAssessment?.identified_strengths) && (
                <p className="text-gray-500 italic">Pending teacher assessment</p>
              )}
            </div>
          </div>

          {/* Areas for Improvement */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 print:border-0 print:shadow-none">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <TrendingUp className="w-6 h-6 text-orange-500" />
              Areas for Growth
            </h2>

            <div className="space-y-3">
              {(teacherAssessment?.areas_for_improvement || aiAssessment?.potential_challenges || []).map((area: string, i: number) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <TrendingUp className="w-4 h-4 text-orange-500" />
                  </div>
                  <p className="text-gray-700">{area}</p>
                </div>
              ))}
              {(!teacherAssessment?.areas_for_improvement && !aiAssessment?.potential_challenges) && (
                <p className="text-gray-500 italic">Pending teacher assessment</p>
              )}
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8 print:border-0 print:shadow-none">
          <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-emerald-500" />
            Personalised Recommendations
          </h2>

          <div className="space-y-6">
            {/* Starting Point */}
            <div className="bg-emerald-50 rounded-xl p-5">
              <h3 className="font-bold text-gray-900 mb-2">Where to Start</h3>
              <p className="text-gray-700">
                {teacherAssessment?.specific_starting_point ||
                  aiAssessment?.recommended_starting_point ||
                  'Pending teacher assessment'}
              </p>
            </div>

            {/* Suggested Approach */}
            {(teacherAssessment?.recommended_approach || aiAssessment?.suggested_approach) && (
              <div className="bg-blue-50 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-2">Recommended Teaching Approach</h3>
                <p className="text-gray-700">
                  {teacherAssessment?.recommended_approach || aiAssessment?.suggested_approach}
                </p>
              </div>
            )}

            {/* Lesson Frequency */}
            {teacherAssessment?.lesson_frequency_recommendation && (
              <div className="bg-purple-50 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-2">Recommended Lesson Frequency</h3>
                <p className="text-gray-700 capitalize">
                  {teacherAssessment.lesson_frequency_recommendation.replace(/_/g, ' ')}
                </p>
              </div>
            )}

            {/* Timeline */}
            {aiAssessment?.realistic_timeline && (
              <div className="bg-amber-50 rounded-xl p-5">
                <h3 className="font-bold text-gray-900 mb-2">Realistic Timeline</h3>
                <p className="text-gray-700">{aiAssessment.realistic_timeline}</p>
              </div>
            )}
          </div>
        </div>

        {/* Teacher's Personal Message */}
        {teacherAssessment?.personalized_feedback && (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-8 print:border-0 print:shadow-none">
            <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-500" />
              Message from Your Teacher
            </h2>

            <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6 border border-emerald-100">
              <p className="text-gray-700 text-lg leading-relaxed italic">
                "{teacherAssessment.personalized_feedback}"
              </p>
              {teacher && (
                <p className="text-right text-gray-500 mt-4">
                  — {teacher.profiles?.full_name}
                </p>
              )}
            </div>
          </div>
        )}

        {/* CTA Section - Hide on print */}
        {isComplete && (
          <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-8 text-white text-center print:hidden">
            <h2 className="text-2xl font-bold mb-4">Ready to Begin Your Learning Journey?</h2>
            <p className="mb-6 text-emerald-100">
              Book your first lesson and start making progress with Talbiyah.ai
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => navigate('/buy-credits')}
                className="px-8 py-4 bg-white text-emerald-600 font-semibold rounded-full hover:bg-emerald-50 transition flex items-center justify-center gap-2"
              >
                <span>Buy Credits & Book Lessons</span>
                <ArrowRight className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate('/teachers')}
                className="px-8 py-4 bg-emerald-400 text-white font-semibold rounded-full hover:bg-emerald-300 transition"
              >
                Browse Teachers
              </button>
            </div>
          </div>
        )}

        {/* Pending Status CTA */}
        {!isComplete && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center print:hidden">
            <Clock className="w-12 h-12 text-amber-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Assessment In Progress</h2>
            <p className="text-gray-600 mb-6">
              Your teacher will complete the assessment after your diagnostic session.
              You'll receive the full report once it's ready.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
            >
              Return to Dashboard
            </button>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm mt-8 print:mt-16">
          <p>This report was generated by Talbiyah.ai</p>
          <p>For questions, contact us at support@talbiyah.ai</p>
        </div>
      </div>
    </div>
  );
}
