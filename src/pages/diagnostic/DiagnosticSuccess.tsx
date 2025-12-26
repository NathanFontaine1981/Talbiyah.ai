import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  CheckCircle,
  Calendar,
  Clock,
  User,
  Video,
  ArrowRight,
  Sparkles,
  Loader2,
  Mail
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';

export default function DiagnosticSuccess() {
  const navigate = useNavigate();
  const { assessmentId } = useParams<{ assessmentId: string }>();
  const [loading, setLoading] = useState(true);
  const [assessment, setAssessment] = useState<any>(null);
  const [lesson, setLesson] = useState<any>(null);
  const [teacher, setTeacher] = useState<any>(null);

  useEffect(() => {
    loadDetails();
  }, [assessmentId]);

  async function loadDetails() {
    try {
      // Load assessment
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('diagnostic_assessments')
        .select('*, lessons(*)')
        .eq('id', assessmentId)
        .single();

      if (assessmentError) throw assessmentError;
      setAssessment(assessmentData);

      if (assessmentData.lesson_id) {
        // Load lesson with teacher info
        const { data: lessonData } = await supabase
          .from('lessons')
          .select(`
            *,
            teacher_profiles!lessons_teacher_id_fkey(
              id,
              profiles!teacher_profiles_user_id_fkey(full_name, avatar_url)
            )
          `)
          .eq('id', assessmentData.lesson_id)
          .single();

        setLesson(lessonData);
        setTeacher(lessonData?.teacher_profiles);
      }
    } catch (err) {
      console.error('Error loading details:', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-lg p-8 text-center">
          {/* Success Animation */}
          <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
            <CheckCircle className="w-12 h-12 text-white" />
          </div>

          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Diagnostic Booked!
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Your FREE assessment session has been scheduled
          </p>

          {/* Booking Details */}
          {lesson && teacher && (
            <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Session Details</h2>

              <div className="space-y-4">
                {/* Teacher */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                    {teacher.profiles?.avatar_url ? (
                      <img
                        src={teacher.profiles.avatar_url}
                        alt={teacher.profiles.full_name}
                        className="w-12 h-12 rounded-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-emerald-600" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{teacher.profiles?.full_name}</p>
                    <p className="text-sm text-gray-500">Your Teacher</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200">
                  <div className="flex items-center gap-3">
                    <Calendar className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(lesson.scheduled_time), 'EEEE, MMM d')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="w-5 h-5 text-emerald-500" />
                    <div>
                      <p className="text-sm text-gray-500">Time</p>
                      <p className="font-medium text-gray-900">
                        {format(new Date(lesson.scheduled_time), 'h:mm a')}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
                  <Video className="w-5 h-5 text-emerald-500" />
                  <div>
                    <p className="text-sm text-gray-500">Session Type</p>
                    <p className="font-medium text-gray-900">20-minute FREE Diagnostic Assessment</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* AI Assessment Preview */}
          {assessment?.ai_preliminary_assessment && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6 mb-8 text-left">
              <div className="flex items-start gap-3 mb-4">
                <Sparkles className="w-6 h-6 text-emerald-500 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">AI Preliminary Assessment</h3>
                  <p className="text-sm text-gray-600">
                    {assessment.ai_preliminary_assessment.personalized_message}
                  </p>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="px-3 py-1 bg-white border border-emerald-200 rounded-full text-sm text-emerald-700">
                  Estimated Level: {assessment.ai_preliminary_assessment.estimated_level}
                </span>
                <span className="px-3 py-1 bg-white border border-emerald-200 rounded-full text-sm text-emerald-700">
                  Start Phase: {assessment.ai_preliminary_assessment.recommended_phase}
                </span>
              </div>
            </div>
          )}

          {/* What's Next */}
          <div className="bg-gray-50 rounded-xl p-6 mb-8 text-left">
            <h3 className="font-bold text-gray-900 mb-4">What Happens Next?</h3>

            <div className="space-y-4">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Mail className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Check Your Email</p>
                  <p className="text-sm text-gray-500">
                    We've sent you a confirmation email with session details and calendar invite.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Video className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Join the Session</p>
                  <p className="text-sm text-gray-500">
                    On the day, join from your dashboard. The teacher will evaluate the student's current level.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 mb-1">Receive Your Report</p>
                  <p className="text-sm text-gray-500">
                    After the session, you'll receive a detailed assessment report with personalised recommendations.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Questions? Contact us at contact@talbiyah.ai
        </p>
      </div>
    </div>
  );
}
