import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ChevronLeft,
  Loader2,
  AlertCircle,
  User,
  Calendar,
  Clock,
  BookOpen,
  Sparkles,
  Video
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';
import TeacherAssessmentForm from '../../components/diagnostic/TeacherAssessmentForm';

export default function DiagnosticAssessment() {
  const navigate = useNavigate();
  const { lessonId } = useParams<{ lessonId: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [showAssessmentForm, setShowAssessmentForm] = useState(false);

  useEffect(() => {
    loadAssessmentData();
  }, [lessonId]);

  async function loadAssessmentData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      // Verify teacher owns this lesson
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherProfile) {
        setError('Teacher profile not found');
        setLoading(false);
        return;
      }

      // Load lesson
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          *,
          learners(name, age, gender, parent_id),
          subjects(name)
        `)
        .eq('id', lessonId)
        .eq('lesson_type', 'diagnostic_assessment')
        .single();

      if (lessonError || !lessonData) {
        setError('Diagnostic lesson not found');
        setLoading(false);
        return;
      }

      // Verify teacher owns this lesson
      if (lessonData.teacher_id !== teacherProfile.id) {
        setError('Unauthorized');
        setLoading(false);
        return;
      }

      setLesson(lessonData);

      // Load student/parent info
      if (lessonData.learners?.parent_id) {
        const { data: parentProfile } = await supabase
          .from('profiles')
          .select('full_name, email')
          .eq('id', lessonData.learners.parent_id)
          .single();

        setStudent({
          name: lessonData.learners?.name || 'Student',
          age: lessonData.learners?.age,
          gender: lessonData.learners?.gender,
          parent: parentProfile
        });
      }

      // Load diagnostic assessment
      const { data: assessmentData } = await supabase
        .from('diagnostic_assessments')
        .select('*')
        .eq('lesson_id', lessonId)
        .single();

      if (assessmentData) {
        setAssessment(assessmentData);
      }

    } catch (err: any) {
      console.error('Error loading assessment:', err);
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }

  const handleAssessmentComplete = () => {
    // Refresh data and show success
    loadAssessmentData();
    setShowAssessmentForm(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 border border-red-200 text-center">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/teacher/hub')}
            className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
          >
            Go to Teacher Hub
          </button>
        </div>
      </div>
    );
  }

  // Show assessment form
  if (showAssessmentForm && assessment) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => setShowAssessmentForm(false)}
            className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition mb-6"
          >
            <ChevronLeft className="w-5 h-5" />
            <span>Back to Overview</span>
          </button>

          <TeacherAssessmentForm
            assessmentId={assessment.id}
            lessonId={lessonId!}
            studentName={student?.name || 'Student'}
            aiAssessment={assessment.ai_preliminary_assessment}
            preAssessmentResponses={assessment.pre_assessment_responses}
            onComplete={handleAssessmentComplete}
            onClose={() => setShowAssessmentForm(false)}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/teacher/hub')}
              className="flex items-center gap-2 text-gray-500 hover:text-emerald-600 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Teacher Hub</span>
            </button>
            <h1 className="text-xl font-bold text-gray-900">Diagnostic Assessment</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Student Info Card */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-start gap-6">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
              <User className="w-10 h-10 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-2xl font-bold text-gray-900 mb-1">
                {student?.name || 'Student'}
              </h2>
              <p className="text-gray-500 mb-4">
                {student?.age ? `Age ${student.age}` : ''}
                {student?.age && student?.gender ? ' • ' : ''}
                {student?.gender ? (student.gender === 'male' ? 'Male' : 'Female') : ''}
              </p>

              <div className="grid grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    <span>Session Date</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(lesson.scheduled_time), 'MMM d, yyyy')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <Clock className="w-4 h-4" />
                    <span>Session Time</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {format(new Date(lesson.scheduled_time), 'h:mm a')}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center gap-2 text-gray-500 text-sm mb-1">
                    <BookOpen className="w-4 h-4" />
                    <span>Subject</span>
                  </div>
                  <p className="font-semibold text-gray-900">
                    {lesson.subjects?.name || 'Quran'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Assessment Status */}
        {assessment?.status === 'report_complete' ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-bold text-gray-900 text-lg mb-1">Assessment Complete</h3>
                <p className="text-gray-600">
                  You have completed this diagnostic assessment. The report has been generated and sent to the parent.
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
                <Clock className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-gray-900 text-lg mb-1">Pending Assessment</h3>
                <p className="text-gray-600 mb-4">
                  After completing the session, fill out the assessment form to generate the student's report.
                </p>
                <button
                  onClick={() => setShowAssessmentForm(true)}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white font-semibold rounded-full transition"
                >
                  Complete Assessment
                </button>
              </div>
            </div>
          </div>
        )}

        {/* AI Preliminary Assessment */}
        {assessment?.ai_preliminary_assessment && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
            <h3 className="font-bold text-gray-900 text-lg mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              AI Preliminary Assessment
            </h3>

            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Estimated Level</p>
                <p className="font-semibold text-gray-900">
                  {assessment.ai_preliminary_assessment.estimated_level}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {assessment.ai_preliminary_assessment.level_reasoning}
                </p>
              </div>

              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-sm text-gray-500 mb-1">Recommended Phase</p>
                <p className="font-semibold text-gray-900 capitalize">
                  {assessment.ai_preliminary_assessment.recommended_phase}
                </p>
                <p className="text-sm text-gray-600 mt-2">
                  {assessment.ai_preliminary_assessment.phase_reasoning}
                </p>
              </div>
            </div>

            {assessment.ai_preliminary_assessment.questions_for_teacher && (
              <div className="mt-6">
                <h4 className="font-semibold text-gray-900 mb-3">Questions to Explore</h4>
                <ul className="space-y-2">
                  {assessment.ai_preliminary_assessment.questions_for_teacher.map((q: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-gray-600">
                      <span className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-sm font-medium flex-shrink-0">
                        {i + 1}
                      </span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {assessment.ai_preliminary_assessment.red_flags && assessment.ai_preliminary_assessment.red_flags.length > 0 && (
              <div className="mt-6 bg-red-50 rounded-xl p-4">
                <h4 className="font-semibold text-red-800 mb-2">Potential Concerns</h4>
                <ul className="space-y-1">
                  {assessment.ai_preliminary_assessment.red_flags.map((flag: string, i: number) => (
                    <li key={i} className="flex items-start gap-2 text-red-700 text-sm">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Pre-Assessment Responses */}
        {assessment?.pre_assessment_responses && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="font-bold text-gray-900 text-lg mb-4">Questionnaire Responses</h3>

            <div className="space-y-4">
              <div className="border-b border-gray-100 pb-4">
                <p className="text-sm text-gray-500">Subject</p>
                <p className="font-medium text-gray-900 capitalize">
                  {assessment.pre_assessment_responses.primary_subject?.replace(/_/g, ' ')}
                </p>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <p className="text-sm text-gray-500">Goals</p>
                <p className="text-gray-900">{assessment.pre_assessment_responses.specific_goals}</p>
              </div>

              <div className="border-b border-gray-100 pb-4">
                <p className="text-sm text-gray-500">Current Level</p>
                <p className="font-medium text-gray-900 capitalize">
                  {assessment.pre_assessment_responses.current_level?.replace(/_/g, ' ')}
                </p>
              </div>

              {assessment.pre_assessment_responses.can_read_arabic && (
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-sm text-gray-500">Arabic Reading</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {assessment.pre_assessment_responses.can_read_arabic?.replace(/_/g, ' ')}
                  </p>
                </div>
              )}

              {assessment.pre_assessment_responses.previous_experience && (
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-sm text-gray-500">Previous Experience</p>
                  <p className="text-gray-900">{assessment.pre_assessment_responses.previous_experience}</p>
                </div>
              )}

              {assessment.pre_assessment_responses.main_challenges && (
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-sm text-gray-500">Challenges</p>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {assessment.pre_assessment_responses.main_challenges.map((c: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {assessment.pre_assessment_responses.learning_priority && (
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-sm text-gray-500">Learning Priority</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {assessment.pre_assessment_responses.learning_priority?.replace(/_/g, ' ')}
                  </p>
                </div>
              )}

              {assessment.pre_assessment_responses.additional_notes && (
                <div>
                  <p className="text-sm text-gray-500">Additional Notes</p>
                  <p className="text-gray-900">{assessment.pre_assessment_responses.additional_notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Join Lesson Button */}
        {lesson.status === 'booked' && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate(`/lesson/${lessonId}`)}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition flex items-center gap-2 mx-auto"
            >
              <Video className="w-5 h-5" />
              Join Diagnostic Session
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
