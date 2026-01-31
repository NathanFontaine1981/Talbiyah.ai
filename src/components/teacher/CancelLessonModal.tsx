import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { X, AlertTriangle, Loader2, Plus, Trash2 } from 'lucide-react';

interface CancelLessonModalProps {
  lesson: {
    id: string;
    student_name: string;
    scheduled_time: string;
    duration_minutes: number;
    subject?: string;
  };
  onClose: () => void;
  onComplete: () => void;
}

const CANCEL_REASONS = [
  { value: 'scheduling_conflict', label: 'I have a scheduling conflict' },
  { value: 'personal_emergency', label: 'Personal/family emergency' },
  { value: 'illness', label: 'Illness' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'unavailable', label: 'No longer available' },
  { value: 'other', label: 'Other reason' },
];

export default function CancelLessonModal({
  lesson,
  onClose,
  onComplete,
}: CancelLessonModalProps) {
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [suggestNewTime, setSuggestNewTime] = useState(false);
  const [suggestedTimes, setSuggestedTimes] = useState<string[]>(['']);

  const handleSubmit = async () => {
    if (!cancelReason) {
      toast.warning('Please select a reason for cancelling');
      return;
    }

    if (cancelReason === 'other' && !customReason.trim()) {
      toast.warning('Please provide a reason');
      return;
    }

    const finalReason =
      cancelReason === 'other'
        ? customReason.trim()
        : CANCEL_REASONS.find((r) => r.value === cancelReason)?.label || cancelReason;

    setSubmitting(true);
    try {
      // Filter out empty suggested times and convert to ISO strings
      const validSuggestedTimes = suggestNewTime
        ? suggestedTimes.filter(t => t.trim()).map(t => new Date(t).toISOString())
        : null;

      // Reuse decline-lesson function as it handles cancellation and credit refund
      const { error } = await supabase.functions.invoke('decline-lesson', {
        body: {
          lesson_id: lesson.id,
          decline_reason: `[Teacher Cancelled] ${finalReason}`,
          suggested_times: validSuggestedTimes,
        },
      });

      if (error) throw error;

      toast.success('Lesson cancelled. The student has been refunded.');
      onComplete();
    } catch (error: any) {
      console.error('Error cancelling lesson:', error);
      toast.error('Failed to cancel lesson. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const scheduledDate = new Date(lesson.scheduled_time);
  const hoursUntilLesson = (scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60);
  const isShortNotice = hoursUntilLesson < 24;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-red-600" />
            Cancel Lesson
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
            <p className="text-sm text-gray-600 mb-1">Student:</p>
            <p className="font-semibold text-gray-900 mb-3">{lesson.student_name}</p>

            <p className="text-sm text-gray-600 mb-1">Scheduled:</p>
            <p className="font-semibold text-gray-900 mb-1">
              {scheduledDate.toLocaleString('en-GB', {
                weekday: 'long',
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
            <p className="text-sm text-gray-600">
              {lesson.duration_minutes} minutes{lesson.subject && ` • ${lesson.subject}`}
            </p>
          </div>

          {isShortNotice && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-amber-800">
                <strong>Short Notice:</strong> This lesson is in less than 24 hours.
                Frequent short-notice cancellations may affect your rating.
              </p>
            </div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Why are you cancelling? <span className="text-red-500">*</span>
            </label>
            <select
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              {CANCEL_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {cancelReason === 'other' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please explain <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please provide details..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">
                {customReason.length}/300 characters
              </p>
            </div>
          )}

          {/* Suggest Alternative Times */}
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={suggestNewTime}
                onChange={(e) => setSuggestNewTime(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded border-gray-300 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Suggest alternative times to the student
              </span>
            </label>
          </div>

          {suggestNewTime && (
            <div className="mb-4 bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-sm text-emerald-800 mb-3">
                Suggest up to 3 alternative times for rescheduling:
              </p>
              <div className="space-y-2">
                {suggestedTimes.map((time, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <input
                      type="datetime-local"
                      value={time}
                      onChange={(e) => {
                        const newTimes = [...suggestedTimes];
                        newTimes[index] = e.target.value;
                        setSuggestedTimes(newTimes);
                      }}
                      min={new Date().toISOString().slice(0, 16)}
                      className="flex-1 border border-gray-300 rounded-lg p-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                    {suggestedTimes.length > 1 && (
                      <button
                        onClick={() => {
                          setSuggestedTimes(suggestedTimes.filter((_, i) => i !== index));
                        }}
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
                {suggestedTimes.length < 3 && (
                  <button
                    onClick={() => setSuggestedTimes([...suggestedTimes, ''])}
                    className="flex items-center gap-2 text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add another time
                  </button>
                )}
              </div>
            </div>
          )}

          <div className="bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">
              <strong>Note:</strong> The student will be automatically refunded 1 credit
              and notified of this cancellation.
              {suggestNewTime && suggestedTimes.some(t => t.trim()) && (
                <span className="block mt-1">
                  Your suggested times will be included in the notification.
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={submitting}
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition disabled:opacity-50"
          >
            Keep Lesson
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || !cancelReason}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 transition flex items-center justify-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Cancelling...
              </>
            ) : (
              'Cancel & Refund'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
