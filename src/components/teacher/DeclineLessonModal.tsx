import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { X, AlertCircle } from 'lucide-react';

interface DeclineLessonModalProps {
  lesson: {
    lesson_id: string;
    student_name: string;
    scheduled_time: string;
    duration_minutes: number;
    subject_name?: string;
  };
  teacherId: string;
  onClose: () => void;
  onComplete: () => void;
}

const DECLINE_REASONS = [
  { value: 'scheduling_conflict', label: 'I have a scheduling conflict' },
  { value: 'personal_emergency', label: 'Personal/family emergency' },
  { value: 'insufficient_notice', label: 'Not enough notice time' },
  { value: 'technical_issues', label: 'Technical issues' },
  { value: 'unavailable', label: 'No longer available to teach' },
  { value: 'other', label: 'Other reason' },
];

export default function DeclineLessonModal({
  lesson,
  onClose,
  onComplete,
}: DeclineLessonModalProps) {
  const [declineReason, setDeclineReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!declineReason) {
      toast.warning('Please select a reason for declining');
      return;
    }

    if (declineReason === 'other' && !customReason.trim()) {
      toast.warning('Please provide a reason');
      return;
    }

    const finalReason =
      declineReason === 'other'
        ? customReason.trim()
        : DECLINE_REASONS.find((r) => r.value === declineReason)?.label || declineReason;

    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke('decline-lesson', {
        body: {
          lesson_id: lesson.lesson_id,
          decline_reason: finalReason,
          suggested_times: null, // TODO: Allow teacher to suggest alternative times
        },
      });

      if (error) throw error;

      onComplete();
    } catch (error: any) {
      console.error('Error declining lesson:', error);
      toast.error('Failed to decline lesson. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <AlertCircle className="w-6 h-6 text-orange-600" />
            Decline Lesson
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
              Why are you declining? <span className="text-red-500">*</span>
            </label>
            <select
              value={declineReason}
              onChange={(e) => setDeclineReason(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
            >
              <option value="">Select a reason...</option>
              {DECLINE_REASONS.map((reason) => (
                <option key={reason.value} value={reason.value}>
                  {reason.label}
                </option>
              ))}
            </select>
          </div>

          {declineReason === 'other' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Please explain <span className="text-red-500">*</span>
              </label>
              <textarea
                value={customReason}
                onChange={(e) => setCustomReason(e.target.value)}
                placeholder="Please provide details..."
                className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={3}
                maxLength={300}
              />
              <p className="text-xs text-gray-500 mt-1">
                {customReason.length}/300 characters
              </p>
            </div>
          )}

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
            <p className="text-sm text-orange-800">
              <strong>Note:</strong> The student will be refunded 1 credit automatically.
              They will receive a notification with your reason.
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
            disabled={submitting || !declineReason}
            className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 transition"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin inline-block mr-2"></div>
                Declining...
              </>
            ) : (
              'Decline & Refund'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
