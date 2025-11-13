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
  payment_status: string;
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

      if (!sessionId) {
        // No session ID - might be coming from promo code checkout
        setVerifying(false);
        setLoading(false);
        return;
      }

      // Find the pending booking to get user ID
      const { data: pendingBooking } = await supabase
        .from('pending_bookings')
        .select('user_id, created_at')
        .eq('stripe_session_id', sessionId)
        .maybeSingle();

      if (!pendingBooking) {
        // Fallback: try to find lesson directly (shouldn't happen normally)
        setError('Could not find booking. Please check your dashboard.');
        setVerifying(false);
        setLoading(false);
        return;
      }

      // Find the most recent lesson for this user (created after the pending booking)
      const { data: lesson, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          total_cost_paid,
          payment_status,
          teacher_profiles!teacher_id (
            id,
            profiles:user_id (
              full_name
            )
          ),
          subjects!subject_id (
            name
          )
        `)
        .eq('student_id', pendingBooking.user_id)
        .gte('created_at', pendingBooking.created_at)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lessonError) {
        console.error('Error loading lesson:', lessonError);
        setError('Could not load booking details');
      } else if (lesson) {
        setLessonDetails(lesson as any);

        // Check payment status (can be 'paid', 'pending', or 'failed')
        if (lesson.payment_status === 'paid' || lesson.payment_status === 'completed') {
          setVerifying(false);
        } else if (lesson.payment_status === 'failed') {
          setError('Payment failed. Please contact support.');
          setVerifying(false);
        } else {
          // Still processing - poll for updates
          const pollInterval = setInterval(async () => {
            const { data: updatedLesson } = await supabase
              .from('lessons')
              .select('payment_status')
              .eq('id', lesson.id)
              .single();

            if (updatedLesson?.payment_status === 'paid' || updatedLesson?.payment_status === 'completed') {
              setVerifying(false);
              clearInterval(pollInterval);
            } else if (updatedLesson?.payment_status === 'failed') {
              setError('Payment failed. Please contact support.');
              setVerifying(false);
              clearInterval(pollInterval);
            }
          }, 2000);

          // Stop polling after 30 seconds
          setTimeout(() => {
            clearInterval(pollInterval);
            setVerifying(false);
          }, 30000);
        }
      } else {
        setError('Booking not found. Please check your dashboard.');
      }
    } catch (err: any) {
      console.error('Error verifying payment:', err);
      setError(err.message || 'Failed to verify payment');
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
                    Make sure you have a quiet space and good internet connection. You'll receive a reminder 15 minutes before each session.
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
