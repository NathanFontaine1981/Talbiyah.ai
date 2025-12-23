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
  CheckCircle,
  AlertTriangle,
  Target,
  Video,
  MessageSquare
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';

interface DiagnosticPrepViewProps {
  assessmentId?: string;
}

export default function DiagnosticPrepView({ assessmentId: propAssessmentId }: DiagnosticPrepViewProps) {
  const navigate = useNavigate();
  const { assessmentId: paramAssessmentId } = useParams<{ assessmentId: string }>();
  const assessmentId = propAssessmentId || paramAssessmentId;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [assessment, setAssessment] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [student, setStudent] = useState<any>(null);
  const [isPrepared, setIsPrepared] = useState(false);

  useEffect(() => {
    loadPrepData();
  }, [assessmentId]);

  async function loadPrepData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      // Verify teacher owns this assessment
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

      // Load assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('diagnostic_assessments')
        .select('*')
        .eq('id', assessmentId)
        .single();

      if (assessmentError || !assessmentData) {
        setError('Assessment not found');
        setLoading(false);
        return;
      }

      // Verify teacher owns this assessment
      if (assessmentData.teacher_id !== teacherProfile.id) {
        setError('You are not authorized to view this assessment');
        setLoading(false);
        return;
      }

      setAssessment(assessmentData);

      // Load lesson info
      if (assessmentData.lesson_id) {
        const { data: lessonData } = await supabase
          .from('lessons')
          .select(`
            *,
            learners(name, age, gender, parent_id),
            subjects(name)
          `)
          .eq('id', assessmentData.lesson_id)
          .single();

        if (lessonData) {
          setLesson(lessonData);

          // Load parent info
          if (lessonData.learners?.parent_id) {
            const { data: parentProfile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', lessonData.learners.parent_id)
              .single();

            setStudent({
              name: lessonData.learners.name,
              age: lessonData.learners.age,
              gender: lessonData.learners.gender,
              parent: parentProfile
            });
          }
        }
      }

    } catch (err: any) {
      console.error('Error loading prep data:', err);
      setError(err.message || 'Failed to load assessment');
    } finally {
      setLoading(false);
    }
  }

  const handleMarkPrepared = () => {
    setIsPrepared(true);
  };

  const handleJoinSession = () => {
    if (lesson) {
      navigate(`/lesson/${lesson.id}`);
    }
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

  const preResponses = assessment?.pre_assessment_responses;
  const aiAssessment = assessment?.ai_preliminary_assessment;

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
            <h1 className="text-xl font-bold text-gray-900">Diagnostic Assessment Preparation</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Student Overview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6 mb-8">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-6">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                <User className="w-10 h-10 text-emerald-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-1">
                  {student?.name || preResponses?.student_name || 'Student'}
                </h2>
                <p className="text-gray-500 mb-4">
                  {student?.age ? `Age ${student.age}` : preResponses?.student_age ? `Age ${preResponses.student_age}` : ''}
                  {(student?.age || preResponses?.student_age) && (student?.gender || preResponses?.student_gender) ? ' • ' : ''}
                  {student?.gender || preResponses?.student_gender ? (
                    (student?.gender || preResponses?.student_gender) === 'male' ? 'Male' : 'Female'
                  ) : ''}
                </p>

                {lesson && (
                  <div className="flex flex-wrap gap-4">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Calendar className="w-4 h-4 text-emerald-500" />
                      <span>{format(new Date(lesson.scheduled_time), 'EEEE, MMMM d, yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <Clock className="w-4 h-4 text-emerald-500" />
                      <span>{format(new Date(lesson.scheduled_time), 'h:mm a')} ({lesson.duration_minutes} min)</span>
                    </div>
                    <div className="flex items-center gap-2 text-gray-600">
                      <BookOpen className="w-4 h-4 text-emerald-500" />
                      <span>{lesson.subjects?.name || 'Quran'}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              {lesson && (
                <button
                  onClick={handleJoinSession}
                  className="px-6 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition flex items-center gap-2"
                >
                  <Video className="w-5 h-5" />
                  Join Session
                </button>
              )}
              {!isPrepared ? (
                <button
                  onClick={handleMarkPrepared}
                  className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-full transition flex items-center gap-2"
                >
                  <CheckCircle className="w-5 h-5" />
                  Mark as Prepared
                </button>
              ) : (
                <div className="px-6 py-3 bg-emerald-100 text-emerald-700 font-semibold rounded-full flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Ready
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Questionnaire Responses */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <MessageSquare className="w-6 h-6 text-emerald-500" />
              What the Student Shared
            </h3>

            <div className="space-y-4">
              {/* Subject */}
              <div className="border-b border-gray-100 pb-4">
                <p className="text-sm text-gray-500 mb-1">Subject</p>
                <p className="font-medium text-gray-900 capitalize">
                  {preResponses?.primary_subject?.replace(/_/g, ' ') || 'Not specified'}
                </p>
              </div>

              {/* Goals */}
              <div className="border-b border-gray-100 pb-4">
                <p className="text-sm text-gray-500 mb-1">Goals</p>
                <p className="text-gray-900">{preResponses?.specific_goals || 'Not specified'}</p>
              </div>

              {/* Current Level */}
              <div className="border-b border-gray-100 pb-4">
                <p className="text-sm text-gray-500 mb-1">Current Level</p>
                <p className="font-medium text-gray-900 capitalize">
                  {preResponses?.current_level?.replace(/_/g, ' ') || 'Not specified'}
                </p>
              </div>

              {/* Timeline */}
              <div className="border-b border-gray-100 pb-4">
                <p className="text-sm text-gray-500 mb-1">Timeline Expectation</p>
                <p className="font-medium text-gray-900 capitalize">
                  {preResponses?.timeline_expectation?.replace(/_/g, ' ') || 'Not specified'}
                </p>
              </div>

              {/* Learning Priority */}
              <div className="border-b border-gray-100 pb-4">
                <p className="text-sm text-gray-500 mb-1">Learning Priority</p>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-gray-900 capitalize">
                    {preResponses?.learning_priority?.replace(/_/g, ' ') || 'Not specified'}
                  </p>
                  {assessment?.methodology_alignment === 'strong' && (
                    <span className="px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                      Strong Alignment
                    </span>
                  )}
                </div>
              </div>

              {/* Arabic Reading */}
              {preResponses?.can_read_arabic && (
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-sm text-gray-500 mb-1">Can Read Arabic</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {preResponses.can_read_arabic.replace(/_/g, ' ')}
                  </p>
                </div>
              )}

              {/* Challenges */}
              {preResponses?.main_challenges && preResponses.main_challenges.length > 0 && (
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-sm text-gray-500 mb-2">Challenges</p>
                  <div className="flex flex-wrap gap-2">
                    {preResponses.main_challenges.map((c: string, i: number) => (
                      <span key={i} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                        {c.replace(/_/g, ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Learning Style */}
              {preResponses?.learning_style && (
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-sm text-gray-500 mb-1">Learning Style</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {preResponses.learning_style.replace(/_/g, ' ')}
                  </p>
                </div>
              )}

              {/* Lesson Frequency */}
              {preResponses?.lesson_frequency && (
                <div className="border-b border-gray-100 pb-4">
                  <p className="text-sm text-gray-500 mb-1">Preferred Frequency</p>
                  <p className="font-medium text-gray-900 capitalize">
                    {preResponses.lesson_frequency.replace(/_/g, ' ')}
                  </p>
                </div>
              )}

              {/* Additional Notes */}
              {preResponses?.additional_notes && (
                <div>
                  <p className="text-sm text-gray-500 mb-1">Additional Notes</p>
                  <p className="text-gray-900">{preResponses.additional_notes}</p>
                </div>
              )}
            </div>
          </div>

          {/* AI Assessment */}
          <div className="space-y-6">
            {/* AI Analysis */}
            {aiAssessment && (
              <div className="bg-white rounded-2xl border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-emerald-500" />
                  AI Preliminary Assessment
                </h3>

                {/* Level & Phase */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-blue-50 rounded-xl p-4">
                    <p className="text-sm text-blue-600 mb-1">Estimated Level</p>
                    <p className="font-bold text-gray-900">{aiAssessment.estimated_level}</p>
                    <p className="text-sm text-gray-600 mt-1">{aiAssessment.level_reasoning}</p>
                  </div>
                  <div className="bg-emerald-50 rounded-xl p-4">
                    <p className="text-sm text-emerald-600 mb-1">Recommended Phase</p>
                    <p className="font-bold text-gray-900 capitalize">{aiAssessment.recommended_phase}</p>
                    <p className="text-sm text-gray-600 mt-1">{aiAssessment.phase_reasoning}</p>
                  </div>
                </div>

                {/* Methodology Fit */}
                <div className={`rounded-xl p-4 mb-6 ${
                  aiAssessment.methodology_fit === 'strong' ? 'bg-emerald-50' :
                  aiAssessment.methodology_fit === 'moderate' ? 'bg-blue-50' :
                  aiAssessment.methodology_fit === 'needs_education' ? 'bg-amber-50' :
                  'bg-red-50'
                }`}>
                  <p className="text-sm text-gray-500 mb-1">Methodology Fit</p>
                  <p className={`font-bold capitalize ${
                    aiAssessment.methodology_fit === 'strong' ? 'text-emerald-700' :
                    aiAssessment.methodology_fit === 'moderate' ? 'text-blue-700' :
                    aiAssessment.methodology_fit === 'needs_education' ? 'text-amber-700' :
                    'text-red-700'
                  }`}>
                    {aiAssessment.methodology_fit?.replace(/_/g, ' ')}
                  </p>
                  {aiAssessment.methodology_notes && (
                    <p className="text-sm text-gray-600 mt-1">{aiAssessment.methodology_notes}</p>
                  )}
                </div>

                {/* Strengths & Challenges */}
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Identified Strengths</p>
                    <ul className="space-y-1">
                      {aiAssessment.identified_strengths?.map((s: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Potential Challenges</p>
                    <ul className="space-y-1">
                      {aiAssessment.potential_challenges?.map((c: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                          <span>{c}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Recommended Approach */}
                {aiAssessment.suggested_approach && (
                  <div className="bg-gray-50 rounded-xl p-4 mb-6">
                    <p className="font-semibold text-gray-900 mb-2">Suggested Teaching Approach</p>
                    <p className="text-sm text-gray-600">{aiAssessment.suggested_approach}</p>
                  </div>
                )}

                {/* Questions for Teacher */}
                {aiAssessment.questions_for_teacher && aiAssessment.questions_for_teacher.length > 0 && (
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                    <p className="font-semibold text-gray-900 mb-3">Questions to Explore During Session</p>
                    <ul className="space-y-2">
                      {aiAssessment.questions_for_teacher.map((q: string, i: number) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                          <span className="w-6 h-6 bg-amber-500 text-white rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span>{q}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Red Flags */}
                {aiAssessment.red_flags && aiAssessment.red_flags.length > 0 && aiAssessment.red_flags[0] !== '' && (
                  <div className="bg-red-50 border border-red-200 rounded-xl p-4 mt-4">
                    <p className="font-semibold text-red-800 mb-2">Potential Concerns</p>
                    <ul className="space-y-1">
                      {aiAssessment.red_flags.map((flag: string, i: number) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-red-700">
                          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                          <span>{flag}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {/* Assessment Checklist */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                <Target className="w-6 h-6 text-emerald-500" />
                Assessment Checklist (20 Minutes)
              </h3>

              <div className="space-y-6">
                {/* Foundations */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Foundations (if applicable)</h4>
                  <div className="space-y-2">
                    {[
                      'Can they recognise Arabic letters?',
                      'Can they distinguish similar-looking letters?',
                      'Can they read any words, even slowly?'
                    ].map((item, i) => (
                      <label key={i} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Understanding */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Understanding Assessment</h4>
                  <div className="space-y-2">
                    {[
                      'Do they know the meaning of Al-Fatiha (or any surah)?',
                      'Can they explain what they\'re reciting?',
                      'Do they show emotional connection to meaning?'
                    ].map((item, i) => (
                      <label key={i} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Fluency */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Fluency Assessment</h4>
                  <div className="space-y-2">
                    {[
                      'If they can read, how is their pronunciation?',
                      'Any obvious Tajweed errors?',
                      'Reading speed and confidence?'
                    ].map((item, i) => (
                      <label key={i} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Engagement */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">Learning Style & Engagement</h4>
                  <div className="space-y-2">
                    {[
                      'How do they respond to instruction?',
                      'Confidence level?',
                      'Attention span?',
                      'Parent involvement quality?'
                    ].map((item, i) => (
                      <label key={i} className="flex items-center gap-3 text-sm text-gray-600 cursor-pointer">
                        <input type="checkbox" className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500" />
                        <span>{item}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Complete Assessment Button */}
        {assessment?.status === 'lesson_complete' || assessment?.status === 'lesson_scheduled' && (
          <div className="mt-8 text-center">
            <button
              onClick={() => navigate(`/teacher/diagnostic/${lesson?.id}`)}
              className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
            >
              Complete Assessment Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
