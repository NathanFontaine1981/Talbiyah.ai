import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { X, Send } from 'lucide-react';

interface AcknowledgeLessonModalProps {
  lesson: {
    lesson_id: string;
    student_name: string;
    scheduled_time: string;
    duration_minutes: number;
    subject_name?: string;
  };
  onClose: () => void;
  onComplete: () => void;
}

export default function AcknowledgeLessonModal({
  lesson,
  onClose,
  onComplete,
}: AcknowledgeLessonModalProps) {
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('acknowledge-lesson', {
        body: {
          lesson_id: lesson.lesson_id,
          teacher_message: message.trim() || null,
        },
      });

      if (error) throw error;

      onComplete();
    } catch (error: any) {
      console.error('Error acknowledging lesson:', error);
      toast.error('Failed to acknowledge lesson. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            Acknowledge Lesson
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-4 mb-4 border border-green-200">
            <p className="text-sm text-gray-600 mb-1">Student:</p>
            <p className="font-semibold text-gray-900 mb-3">{lesson.student_name}</p>

            <p className="text-sm text-gray-600 mb-1">Scheduled:</p>
            <p className="font-semibold text-gray-900 mb-1">
              {new Date(lesson.scheduled_time).toLocaleString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-sm text-gray-600">
              {lesson.duration_minutes} minutes{lesson.subject_name && ` • ${lesson.subject_name}`}
            </p>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Add a message to the student <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., Looking forward to our lesson! I'll prepare some great materials for you."
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              rows={3}
              maxLength={300}
            />
            <div className="flex items-center justify-between mt-1">
              <p className="text-xs text-gray-500">
                {message.length}/300 characters
              </p>
              {message.length > 0 && (
                <p className="text-xs text-green-600">
                  ✓ Student will see this message
                </p>
              )}
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>Reminder:</strong> The video room will open 6 hours before the lesson.
              You can join early if you'd like to prepare.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Acknowledging...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Acknowledge Lesson
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
