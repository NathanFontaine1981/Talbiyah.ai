import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { Clock, User, Calendar, AlertCircle } from 'lucide-react';
import AcknowledgeLessonModal from './AcknowledgeLessonModal';
import DeclineLessonModal from './DeclineLessonModal';

interface PendingLesson {
  lesson_id: string;
  student_name: string;
  student_id: string;
  scheduled_time: string;
  duration_minutes: number;
  subject_name: string;
  hours_until_lesson: number;
  requested_hours_ago: number;
}

interface PendingLessonsListProps {
  teacherId: string;
}

export default function PendingLessonsList({ teacherId }: PendingLessonsListProps) {
  const [pendingLessons, setPendingLessons] = useState<PendingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedLesson, setSelectedLesson] = useState<PendingLesson | null>(null);
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false);
  const [showDeclineModal, setShowDeclineModal] = useState(false);

  useEffect(() => {
    fetchPendingLessons();

    // Subscribe to real-time updates
    const subscription = supabase
      .channel('pending_lessons')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'lessons',
        filter: `teacher_id=eq.${teacherId}`,
      }, () => {
        fetchPendingLessons();
      })
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [teacherId]);

  const fetchPendingLessons = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_teacher_pending_lessons', { p_teacher_id: teacherId });

      if (error) throw error;
      setPendingLessons(data || []);
    } catch (error) {
      console.error('Error fetching pending lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAcknowledge = (lesson: PendingLesson) => {
    setSelectedLesson(lesson);
    setShowAcknowledgeModal(true);
  };

  const handleDecline = (lesson: PendingLesson) => {
    setSelectedLesson(lesson);
    setShowDeclineModal(true);
  };

  const handleDismiss = async (lesson: PendingLesson) => {
    try {
      // For past sessions, just auto-acknowledge silently
      const { error } = await supabase
        .from('lessons')
        .update({
          confirmation_status: 'auto_acknowledged',
          acknowledged_at: new Date().toISOString(),
          auto_acknowledged: true
        })
        .eq('id', lesson.lesson_id);

      if (error) throw error;

      // Refresh the list
      fetchPendingLessons();
    } catch (error) {
      console.error('Error dismissing lesson:', error);
      alert('Failed to dismiss notification. Please try again.');
    }
  };

  const onComplete = () => {
    setShowAcknowledgeModal(false);
    setShowDeclineModal(false);
    setSelectedLesson(null);
    fetchPendingLessons();
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-20 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (pendingLessons.length === 0) {
    return null;
  }

  return (
    <>
      <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl shadow-sm p-6 mb-6 border-2 border-orange-200">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-orange-600" />
            <span className="bg-orange-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-sm">
              {pendingLessons.length}
            </span>
            Pending Acknowledgments
          </h3>
          <span className="text-sm text-orange-600 font-medium">
            ⏰ Respond within 24 hours
          </span>
        </div>

        <div className="space-y-3">
          {pendingLessons.map((lesson) => {
            const isUrgent = lesson.requested_hours_ago > 20;
            const isOverdue = lesson.hours_until_lesson < 0;

            return (
              <div
                key={lesson.lesson_id}
                className={`bg-white rounded-lg p-4 border-2 ${
                  isUrgent ? 'border-red-300 bg-red-50' : 'border-orange-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-gray-600" />
                      <span className="font-semibold text-gray-900">
                        {lesson.student_name}
                      </span>
                      {isUrgent && (
                        <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full font-medium">
                          URGENT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(lesson.scheduled_time).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        {new Date(lesson.scheduled_time).toLocaleTimeString('en-GB', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </div>
                      <span>• {lesson.duration_minutes} min</span>
                      {lesson.subject_name && <span>• {lesson.subject_name}</span>}
                    </div>
                  </div>

                  <div className="text-right text-sm">
                    <div className={`font-medium ${isOverdue ? 'text-red-600' : 'text-orange-600'}`}>
                      {lesson.hours_until_lesson > 0
                        ? `In ${Math.round(lesson.hours_until_lesson)}h`
                        : 'Overdue'}
                    </div>
                    <div className="text-gray-500 text-xs">
                      Requested {Math.round(lesson.requested_hours_ago)}h ago
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  {isOverdue ? (
                    <button
                      onClick={() => handleDismiss(lesson)}
                      className="flex-1 bg-gray-600 text-white py-2 rounded-lg hover:bg-gray-700 font-medium transition"
                    >
                      ✓ Dismiss (Past Session)
                    </button>
                  ) : (
                    <>
                      <button
                        onClick={() => handleAcknowledge(lesson)}
                        className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 font-medium transition"
                      >
                        ✓ Acknowledge
                      </button>
                      <button
                        onClick={() => handleDecline(lesson)}
                        className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 font-medium transition"
                      >
                        ✗ Decline
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>💡 Note:</strong> Video rooms are already created and will open 6 hours before each lesson.
            Acknowledgment confirms you've seen the booking.
          </p>
        </div>
      </div>

      {selectedLesson && showAcknowledgeModal && (
        <AcknowledgeLessonModal
          lesson={selectedLesson}
          onClose={() => setShowAcknowledgeModal(false)}
          onComplete={onComplete}
        />
      )}

      {selectedLesson && showDeclineModal && (
        <DeclineLessonModal
          lesson={selectedLesson}
          teacherId={teacherId}
          onClose={() => setShowDeclineModal(false)}
          onComplete={onComplete}
        />
      )}
    </>
  );
}
