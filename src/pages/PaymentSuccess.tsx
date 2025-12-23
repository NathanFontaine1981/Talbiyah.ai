import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle, Calendar, Mail, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
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
  const [, setLessonDetails] = useState<LessonDetails | null>(null);
  const [lessons, setLessons] = useState<LessonDetails[]>([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [verifying, setVerifying] = useState(true);

  // Store interval ID for cleanup
  const pollIntervalRef = React.useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    verifyPaymentAndLoadDetails();
    clearCart();

    // Cleanup function to clear polling interval on unmount
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function verifyPaymentAndLoadDetails() {
    try {
      const sessionId = searchParams.get('session_id');

      if (!sessionId) {
        setError('No session ID found');
        setVerifying(false);
        setLoading(false);
        return;
      }

      // Query ALL lessons for this checkout session (could be multiple)
      const { data: lessonsData, error: lessonError } = await supabase
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
        .eq('stripe_checkout_session_id', sessionId);

      if (lessonError) {
        console.error('❌ Error loading lessons:', lessonError);
        setError('Could not load lesson details');
        setVerifying(false);
        setLoading(false);
        return;
      }

      if (!lessonsData || lessonsData.length === 0) {
        // Lessons not found yet - webhook might still be processing
        // Poll for lesson creation (webhook might be delayed)
        let attempts = 0;
        const maxAttempts = 15; // 30 seconds (15 attempts * 2 seconds)

        pollIntervalRef.current = setInterval(async () => {
          attempts++;

          const { data: polledLessons } = await supabase
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
            .eq('stripe_checkout_session_id', sessionId);

          if (polledLessons && polledLessons.length > 0) {

            // Fetch teacher and subject details for all lessons
            const enrichedLessons = await Promise.all(polledLessons.map(async (lesson) => {
              const { data: subject } = await supabase
                .from('subjects')
                .select('name')
                .eq('id', lesson.subject_id)
                .maybeSingle();

              const { data: teacherProfile } = await supabase
                .from('profiles')
                .select('full_name')
                .eq('id', lesson.teacher_id)
                .maybeSingle();

              return {
                ...lesson,
                subjects: subject,
                teacher_profiles: teacherProfile ? {
                  id: lesson.teacher_id,
                  profiles: {
                    full_name: teacherProfile.full_name
                  }
                } : null
              };
            }));

            setLessons(enrichedLessons as any);
            setLessonDetails(enrichedLessons[0] as any); // Keep first for backward compat
            setTotalAmount(enrichedLessons.reduce((sum, l) => sum + l.total_cost_paid, 0));
            setVerifying(false);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          } else if (attempts >= maxAttempts) {
            console.error('❌ Lessons not found after polling');
            setError('Lessons not found. Please check your dashboard.');
            setVerifying(false);
            if (pollIntervalRef.current) {
              clearInterval(pollIntervalRef.current);
              pollIntervalRef.current = null;
            }
          }
        }, 2000);

        return; // Exit early, polling will continue
      }

      // Lessons found! Fetch teacher and subject details for all

      const enrichedLessons = await Promise.all(lessonsData.map(async (lesson) => {
        const { data: subject } = await supabase
          .from('subjects')
          .select('name')
          .eq('id', lesson.subject_id)
          .maybeSingle();

        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', lesson.teacher_id)
          .maybeSingle();

        return {
          ...lesson,
          subjects: subject,
          teacher_profiles: teacherProfile ? {
            id: lesson.teacher_id,
            profiles: {
              full_name: teacherProfile.full_name
            }
          } : null
        };
      }));

      setLessons(enrichedLessons as any);
      setLessonDetails(enrichedLessons[0] as any); // Keep first for backward compat
      setTotalAmount(enrichedLessons.reduce((sum, l) => sum + l.total_cost_paid, 0));
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="text-center">
          <Loader2 className="w-16 h-16 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 text-lg">Loading booking details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-12 border border-red-200 shadow-lg text-center">
          <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-14 h-14 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Oops!</h1>
          <p className="text-gray-600 mb-8">{error}</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-6">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl p-12 border border-gray-200 shadow-lg text-center">
          {verifying ? (
            <>
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                <Loader2 className="w-14 h-14 text-white animate-spin" />
              </div>
              <h1 className="text-4xl font-bold text-gray-900 mb-4">Verifying Payment...</h1>
              <p className="text-xl text-gray-600 mb-8">
                Please wait while we confirm your payment
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
                <CheckCircle className="w-14 h-14 text-white" />
              </div>

              <h1 className="text-4xl font-bold text-gray-900 mb-4">Payment Successful!</h1>
              <p className="text-xl text-gray-600 mb-8">
                {lessons.length === 1
                  ? 'Your lesson has been booked successfully'
                  : `${lessons.length} lessons have been booked successfully`}
              </p>

              {lessons.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8 text-left">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {lessons.length === 1 ? 'Booking Details' : 'Booking Details (All Lessons)'}
                  </h2>

                  {lessons.length === 1 ? (
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Teacher:</span>
                        <span className="text-gray-900 font-medium">{lessons[0].teacher_profiles?.profiles?.full_name}</span>
                      </div>
                      {lessons[0].subjects && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Subject:</span>
                          <span className="text-gray-900 font-medium">{lessons[0].subjects.name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-gray-500">Date & Time:</span>
                        <span className="text-gray-900 font-medium">
                          {format(new Date(lessons[0].scheduled_time), 'PPP p')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Duration:</span>
                        <span className="text-gray-900 font-medium">{lessons[0].duration_minutes} minutes</span>
                      </div>
                      <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
                        <span className="text-gray-500">Amount Paid:</span>
                        <span className="text-emerald-600 font-bold text-lg">£{lessons[0].total_cost_paid.toFixed(2)}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {lessons.map((lesson, index) => (
                        <div key={lesson.id} className="pb-4 border-b border-gray-200 last:border-0 last:pb-0">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-semibold text-gray-400">LESSON {index + 1}</span>
                            <span className="text-xs text-emerald-600 font-medium">£{lesson.total_cost_paid.toFixed(2)}</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Teacher:</span>
                              <span className="text-gray-900 font-medium">{lesson.teacher_profiles?.profiles?.full_name}</span>
                            </div>
                            {lesson.subjects && (
                              <div className="flex justify-between">
                                <span className="text-gray-500">Subject:</span>
                                <span className="text-gray-900 font-medium">{lesson.subjects.name}</span>
                              </div>
                            )}
                            <div className="flex justify-between">
                              <span className="text-gray-500">When:</span>
                              <span className="text-gray-900 font-medium">
                                {format(new Date(lesson.scheduled_time), 'PPP p')}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Duration:</span>
                              <span className="text-gray-900 font-medium">{lesson.duration_minutes} min</span>
                            </div>
                          </div>
                        </div>
                      ))}
                      <div className="flex justify-between border-t border-gray-200 pt-3 mt-3">
                        <span className="text-gray-500 font-semibold">Total Amount Paid:</span>
                        <span className="text-emerald-600 font-bold text-xl">£{totalAmount.toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 mb-8 text-left">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What's Next?</h2>

            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-emerald-200">
                  <Calendar className="w-5 h-5 text-emerald-500" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-1">Check Your Dashboard</p>
                  <p className="text-sm text-gray-500">
                    View all your upcoming sessions and join them when it's time. You'll find everything you need on your dashboard.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-blue-200">
                  <Mail className="w-5 h-5 text-blue-500" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-1">Check Your Email</p>
                  <p className="text-sm text-gray-500">
                    We've sent you a confirmation email with all your session details and calendar invites.
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center flex-shrink-0 border border-purple-200">
                  <CheckCircle className="w-5 h-5 text-purple-500" />
                </div>
                <div className="flex-1">
                  <p className="text-gray-900 font-medium mb-1">Prepare for Your Sessions</p>
                  <p className="text-sm text-gray-500">
                    Make sure you have a quiet space and good internet connection. You'll receive a reminder 15 minutes before each session. You can reschedule anytime up to 30 mins before the session starts.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-200 mb-8">
            <p className="text-sm text-gray-600 mb-2">
              Need help or have questions?
            </p>
            <p className="text-emerald-600 font-medium">
              Contact us at contact@talbiyah.ai
            </p>
          </div>

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition shadow-lg shadow-emerald-500/20 flex items-center justify-center space-x-2"
          >
            <span>Go to Dashboard</span>
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={() => navigate('/teachers')}
            className="w-full mt-4 px-8 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 hover:text-gray-900 font-medium rounded-full transition"
          >
            Book More Sessions
          </button>
        </div>

        <div className="mt-8 text-center">
          <p className="text-gray-500 text-sm">
            Thank you for choosing Talbiyah.ai for your Islamic learning journey
          </p>
        </div>
      </div>
    </div>
  );
}
