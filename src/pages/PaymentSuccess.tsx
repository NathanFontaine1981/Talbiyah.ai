import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useCart } from '../contexts/CartContext';
import { supabase } from '../lib/supabaseClient';
import { format } from 'date-fns';

interface LessonDetails {
  id: string;
  scheduled_time: string;
  duration_minutes: number;
  total_cost_paid: number;
  status: string;
  teacher_profiles: {
    id: string;
    profiles: {
      full_name: string;
    };
  };
  subjects: {
    name: string;
  } | null;
}

export default function PaymentSuccess() {
  const navigate = useNavigate();
  const { clearCart } = useCart();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lessonDetails, setLessonDetails] = useState<LessonDetails | null>(null);
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    verifyPaymentAndLoadDetails();
    clearCart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyPaymentAndLoadDetails() {
    try {
      const sessionId = searchParams.get('session_id');
      console.log('🔍 Payment Success - Session ID:', sessionId);

      if (!sessionId) {
        setError('No session ID found');
        setVerifying(false);
        setLoading(false);
        return;
      }

      // Query lessons directly by stripe_checkout_session_id
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          total_cost_paid,
          status,
          teacher_id,
          subject_id,
          student_room_code,
          teacher_room_code,
          100ms_room_id
        `)
        .eq('stripe_checkout_session_id', sessionId)
        .maybeSingle();

      console.log('🔍 Lesson query result:', { lesson, lessonError });

      if (lessonError) {
        console.error('❌ Error loading lesson:', lessonError);
        setError('Could not load lesson details');
        setVerifying(false);
        setLoading(false);
        return;
      }

      if (!lesson) {
        // Lesson not found yet - webhook might still be processing
        console.log('⏳ Lesson not found yet, will poll for updates...');

        // Poll for lesson creation (webhook might be delayed)
        let attempts = 0;
        const maxAttempts = 15; // 30 seconds (15 attempts * 2 seconds)

        const pollInterval = setInterval(async () => {
          attempts++;
          console.log(`🔄 Polling attempt ${attempts}/${maxAttempts}`);

          const { data: polledLesson } = await supabase
            .from('lessons')
            .select(`
              id,
              scheduled_time,
              duration_minutes,
              total_cost_paid,
              status,
              teacher_id,
              subject_id,
              student_room_code,
              teacher_room_code,
              100ms_room_id
            `)
            .eq('stripe_checkout_session_id', sessionId)
            .maybeSingle();

          if (polledLesson) {
            console.log('✅ Lesson found on polling:', polledLesson.id);

            // Fetch teacher and subject details
            const { data: subject } = await supabase
              .from('subjects')
              .select('name')
              .eq('id', polledLesson.subject_id)
              .single();

            const { data: teacherProfile } = await supabase
              .from('profiles')
              .select('full_name')
              .eq('id', polledLesson.teacher_id)
              .single();

            // Merge the data
            polledLesson.subjects = subject;
            polledLesson.teacher_profiles = teacherProfile ? {
              id: polledLesson.teacher_id,
              profiles: {
                full_name: teacherProfile.full_name
              }
            } : null;

            setLessonDetails(polledLesson as any);
            setVerifying(false);
            clearInterval(pollInterval);
          } else if (attempts >= maxAttempts) {
            console.error('❌ Lesson not found after polling');
            setError('Lesson not found. Please check your dashboard.');
            setVerifying(false);
            clearInterval(pollInterval);
          }
        }, 2000);

        return; // Exit early, polling will continue
      }

      // Lesson found! Fetch teacher and subject details
      console.log('✅ Found lesson:', lesson.id, 'Status:', lesson.status);

      const { data: subject } = await supabase
        .from('subjects')
        .select('name')
        .eq('id', lesson.subject_id)
        .single();

      const { data: teacherProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', lesson.teacher_id)
        .single();

      // Merge the data
      lesson.subjects = subject;
      lesson.teacher_profiles = teacherProfile ? {
        id: lesson.teacher_id,
        profiles: {
          full_name: teacherProfile.full_name
        }
      } : null;

      setLessonDetails(lesson as any);
      setVerifying(false);

    } catch (err: any) {
      console.error('Error verifying payment:', err);
      setError(err.message || 'Failed to verify payment');
      setVerifying(false);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-cyan-500 animate-spin mx-auto mb-4" />
          <p className="text-slate-300 text-lg">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-12 border border-red-500/30 backdrop-blur-sm shadow-xl text-center">
          <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-14 h-14 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4">Oops!</h1>
          <p className="text-slate-300 mb-8">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-12 border border-slate-700/50 backdrop-blur-sm shadow-xl text-center">
          {verifying ? (
            <>
              <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/20">
                <Loader2 className="w-14 h-14 text-white animate-spin" />
              </div>
              <h1 className="text-4xl font-bold text-white mb-4">Verifying Payment...</h1>
              <p className="text-xl text-slate-300 mb-8">
                Please wait while we confirm your payment
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-gradient-to-br from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-green-500/20">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>

              <h1 className="text-4xl font-bold text-white mb-4">Payment Successful!</h1>
              <p className="text-xl text-slate-300 mb-8">
                Your lesson has been booked successfully
              </p>

              {lessonDetails && (
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8 text-left">
                  <h2 className="text-lg font-semibold text-white mb-4">Booking Details</h2>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Teacher:</span>
                      <span className="text-white font-medium">{lessonDetails.teacher_profiles?.profiles?.full_name}</span>
                    </div>
                    {lessonDetails.subjects && (
                      <div className="flex justify-between">
                        <span className="text-slate-400">Subject:</span>
                        <span className="text-white font-medium">{lessonDetails.subjects.name}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-slate-400">Date & Time:</span>
                      <span className="text-white font-medium">
                        {format(new Date(lessonDetails.scheduled_time), 'PPP p')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Duration:</span>
                      <span className="text-white font-medium">{lessonDetails.duration_minutes} minutes</span>
                    </div>
                    <div className="flex justify-between border-t border-slate-700 pt-3 mt-3">
                      <span className="text-slate-400">Amount Paid:</span>
                      <span className="text-emerald-400 font-bold text-lg">£{lessonDetails.total_cost_paid.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 mb-8 text-left">
            <h2 className="text-lg font-semibold text-white mb-4">What's Next?</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-cyan-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-cyan-500/20">
                  <Calendar className="w-5 h-5 text-cyan-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">Check Your Dashboard</p>
                  <p className="text-sm text-slate-400">
                    View all your upcoming sessions and join them when it's time. You'll find everything you need on your dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-500/20">
                  <Mail className="w-5 h-5 text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">Check Your Email</p>
                  <p className="text-sm text-slate-400">
                    We've sent you a confirmation email with all your session details and calendar invites.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-500/10 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-500/20">
                  <CheckCircle className="w-5 h-5 text-purple-400" />
                </div>
                <div className="flex-1">
                  <p className="text-white font-medium mb-1">Prepare for Your Sessions</p>
                  <p className="text-sm text-slate-400">
                    Make sure you have a quiet space and good internet connection. You'll receive a reminder 15 minutes before each session. You can reschedule anytime up to 30 mins before the session starts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-cyan-500/10 to-blue-500/10 rounded-xl p-6 border border-cyan-500/20 mb-8">
            <p className="text-sm text-slate-300 mb-2">
              Need help or have questions?
            </p>
            <p className="text-cyan-400 font-medium">
              Contact us at contact@talbiyah.ai
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/teachers')}
            className="w-full mt-4 px-8 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition"
          >
            Book More Sessions
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-slate-500 text-sm">
            Thank you for choosing Talbiyah.ai for your Islamic learning journey
          </p>
        </div>
      </div>
    </div>
  );
}
