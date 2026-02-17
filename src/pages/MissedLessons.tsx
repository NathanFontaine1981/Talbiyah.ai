import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, User, ArrowLeft, AlertCircle, XCircle, Info } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO } from 'date-fns';

interface MissedLesson {
  id: string;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  subject_id: string;
  subject_name: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  cancelled_at: string | null;
  is_late_cancellation: boolean;
  price: number;
}

export default function MissedLessons() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<MissedLesson[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMissedLessons();
  }, []);

  async function loadMissedLessons() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signup');
        return;
      }

      // Get the user's learner profiles (parent may have multiple children)
      const { data: learners } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id);

      const learnerIds = learners?.map(l => l.id) || [];

      if (learnerIds.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch all missed and cancelled lessons
      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          status,
          teacher_id,
          subject_id,
          cancelled_at,
          is_late_cancellation,
          price,
          teacher_profiles!inner(
            user_id,
            profiles!inner(
              full_name,
              avatar_url
            )
          ),
          subjects!inner(
            name
          )
        `)
        .in('learner_id', learnerIds)
        .in('status', ['missed', 'cancelled_by_student', 'cancelled_by_teacher'])
        .order('scheduled_time', { ascending: false });

      if (error) throw error;

      if (lessonsData) {
        const formattedLessons: MissedLesson[] = lessonsData.map((lesson: any) => ({
          id: lesson.id,
          teacher_id: lesson.teacher_id,
          teacher_name: lesson.teacher_profiles.profiles.full_name || 'Teacher',
          teacher_avatar: lesson.teacher_profiles.profiles.avatar_url,
          subject_id: lesson.subject_id,
          subject_name: lesson.subjects.name,
          scheduled_time: lesson.scheduled_time,
          duration_minutes: lesson.duration_minutes,
          status: lesson.status,
          cancelled_at: lesson.cancelled_at,
          is_late_cancellation: lesson.is_late_cancellation || false,
          price: lesson.price || 0
        }));
        setLessons(formattedLessons);
      }
    } catch (error) {
      console.error('Error loading missed lessons:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string, isLateCancellation: boolean) {
    switch (status) {
      case 'missed':
        return (
          <span className="px-3 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full flex items-center space-x-1">
            <XCircle className="w-3 h-3" />
            <span>NO-SHOW</span>
          </span>
        );
      case 'cancelled_by_student':
        return (
          <span className={`px-3 py-1 ${isLateCancellation ? 'bg-orange-500/20 text-orange-400' : 'bg-gray-600/20 text-gray-500'} text-xs font-bold rounded-full flex items-center space-x-1`}>
            <XCircle className="w-3 h-3" />
            <span>{isLateCancellation ? 'LATE CANCELLATION' : 'CANCELLED'}</span>
          </span>
        );
      case 'cancelled_by_teacher':
        return (
          <span className="px-3 py-1 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full flex items-center space-x-1">
            <Info className="w-3 h-3" />
            <span>TEACHER CANCELLED</span>
          </span>
        );
      default:
        return null;
    }
  }

  function getChargedInfo(status: string, isLateCancellation: boolean, price: number) {
    if (status === 'missed') {
      return (
        <div className="mt-3 bg-red-500/10 border border-red-500/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-400 font-semibold text-sm">You were charged for this lesson</p>
              <p className="text-red-300 text-xs mt-1">
                No-shows result in full payment to the teacher (£{price.toFixed(2)})
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'cancelled_by_student' && isLateCancellation) {
      return (
        <div className="mt-3 bg-orange-500/10 border border-orange-500/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-orange-400 font-semibold text-sm">You were charged for this lesson</p>
              <p className="text-orange-300 text-xs mt-1">
                Cancelled within 30 minutes of start time (£{price.toFixed(2)})
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'cancelled_by_student' && !isLateCancellation) {
      return (
        <div className="mt-3 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 font-semibold text-sm">No charge for this cancellation</p>
              <p className="text-green-300 text-xs mt-1">
                Cancelled more than 30 minutes before the lesson
              </p>
            </div>
          </div>
        </div>
      );
    }

    if (status === 'cancelled_by_teacher') {
      return (
        <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
          <div className="flex items-start space-x-2">
            <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-blue-400 font-semibold text-sm">No charge - teacher cancelled</p>
              <p className="text-blue-300 text-xs mt-1">
                You were not charged for this lesson
              </p>
            </div>
          </div>
        </div>
      );
    }

    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your missed lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 py-8 px-4">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to missed lessons
      </a>

      <main id="main-content" className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            aria-label="Go back to dashboard"
            className="flex items-center space-x-2 text-emerald-400 hover:text-emerald-300 transition mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="mb-6">
            <h1 className="text-4xl font-bold text-white mb-2">Missed & Cancelled Lessons</h1>
            <p className="text-gray-400 text-lg">Track your missed lessons and cancellations</p>
          </div>

          {/* Cancellation Policy Info */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border border-emerald-500/20 rounded-xl p-6">
            <div className="flex items-start space-x-3">
              <Info className="w-6 h-6 text-emerald-400 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-white font-bold text-lg mb-2">Cancellation Policy</h3>
                <ul className="space-y-2 text-gray-300 text-sm">
                  <li className="flex items-start space-x-2">
                    <span className="text-emerald-400 mt-1">•</span>
                    <span>Cancel <span className="font-semibold text-white">more than 30 minutes</span> before your lesson to avoid charges</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-orange-400 mt-1">•</span>
                    <span>Cancellations <span className="font-semibold text-white">within 30 minutes</span> of the lesson will result in full payment to the teacher</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-red-400 mt-1">•</span>
                    <span><span className="font-semibold text-white">No-shows</span> will result in full payment to the teacher</span>
                  </li>
                  <li className="flex items-start space-x-2">
                    <span className="text-green-400 mt-1">•</span>
                    <span>If the teacher cancels, you will <span className="font-semibold text-white">not be charged</span></span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        {lessons.length === 0 ? (
          <div className="bg-gray-50 backdrop-blur-sm rounded-2xl p-12 text-center border border-gray-200">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-600" />
            </div>
            <p className="text-xl text-gray-600 mb-2">No missed or cancelled lessons</p>
            <p className="text-gray-500 mb-8">
              Keep attending your lessons to maintain a perfect record!
            </p>
            <button
              onClick={() => navigate('/my-classes')}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition shadow-lg shadow-emerald-500/20"
            >
              View My Lessons
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => {
              const lessonDate = parseISO(lesson.scheduled_time);

              return (
                <div
                  key={lesson.id}
                  className="bg-gray-50 backdrop-blur-sm rounded-2xl p-6 border border-gray-200 hover:border-red-500/30 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                        {lesson.teacher_avatar ? (
                          <img
                            src={lesson.teacher_avatar}
                            alt={lesson.teacher_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-gray-500" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-xl font-bold text-white">{lesson.subject_name}</h4>
                          {getStatusBadge(lesson.status, lesson.is_late_cancellation)}
                        </div>
                        <p className="text-sm text-gray-500">with {lesson.teacher_name}</p>

                        {lesson.cancelled_at && (
                          <p className="text-xs text-gray-500 mt-1">
                            Cancelled on {format(parseISO(lesson.cancelled_at), 'MMM d, yyyy \'at\' h:mm a')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">
                          {format(lessonDate, 'MMM d, yyyy')}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-500 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-sm">
                          {format(lessonDate, 'h:mm a')}
                        </span>
                      </div>
                      <div className="flex items-center justify-end space-x-1">
                        <span className="px-2 py-1 bg-gray-100 text-gray-600 text-sm font-semibold rounded-lg border border-gray-300">
                          {lesson.duration_minutes} min
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Charge Information */}
                  {getChargedInfo(lesson.status, lesson.is_late_cancellation, lesson.price)}
                </div>
              );
            })}
          </div>
        )}

        {/* Help Section */}
        {lessons.length > 0 && (
          <div className="mt-8 bg-white border border-gray-200 rounded-xl p-6">
            <h3 className="text-white font-bold text-lg mb-3">Need Help?</h3>
            <p className="text-gray-500 text-sm mb-4">
              If you believe there was an error with any of these charges, or if you have questions about the cancellation policy, please contact our support team.
            </p>
            <button
              onClick={() => navigate('/account/settings')}
              className="px-6 py-2 bg-gray-200 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
            >
              Contact Support
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
