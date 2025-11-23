import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { ThumbsUp, ThumbsDown, X } from 'lucide-react';

interface QuickLessonFeedbackProps {
  lessonId: string;
  teacherId: string;
  studentId: string;
  onComplete: () => void;
}

export default function QuickLessonFeedback({
  lessonId,
  teacherId,
  studentId,
  onComplete
}: QuickLessonFeedbackProps) {
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [issueDetail, setIssueDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleQuickFeedback = async (thumbsUp: boolean) => {
    if (!thumbsUp) {
      setShowIssueForm(true);
      return;
    }

    await submitFeedback(true, null, null);
  };

  const handleIssueSubmit = async () => {
    await submitFeedback(false, issueType, issueDetail);
  };

  const submitFeedback = async (
    thumbsUp: boolean,
    issue: string | null,
    detail: string | null
  ) => {
    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('lesson_feedback')
        .insert({
          lesson_id: lessonId,
          teacher_id: teacherId,
          student_id: studentId,
          thumbs_up: thumbsUp,
          issue_type: issue,
          issue_detail: detail
        });

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error submitting feedback:', error);
      alert('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  if (showIssueForm) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-slate-700 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">
              What went wrong?
            </h3>
            <button
              onClick={() => setShowIssueForm(false)}
              className="text-slate-400 hover:text-white transition"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-3 mb-6">
            {[
              { value: 'late', label: 'Teacher was late', icon: '⏰' },
              { value: 'too_fast', label: 'Lesson was too fast', icon: '⚡' },
              { value: 'too_slow', label: 'Lesson was too slow', icon: '🐢' },
              { value: 'technical', label: 'Technical issues', icon: '🔧' },
              { value: 'unprepared', label: 'Teacher seemed unprepared', icon: '📝' },
              { value: 'other', label: 'Other', icon: '💬' }
            ].map(option => (
              <label
                key={option.value}
                className={`flex items-center p-4 rounded-lg border-2 cursor-pointer transition ${
                  issueType === option.value
                    ? 'border-cyan-500 bg-cyan-500/10'
                    : 'border-slate-700 hover:border-slate-600 bg-slate-800/50'
                }`}
              >
                <input
                  type="radio"
                  name="issue"
                  value={option.value}
                  checked={issueType === option.value}
                  onChange={(e) => setIssueType(e.target.value)}
                  className="hidden"
                />
                <span className="text-2xl mr-3">{option.icon}</span>
                <span className="text-white font-medium">{option.label}</span>
              </label>
            ))}
          </div>

          {issueType === 'other' && (
            <div className="mb-6">
              <textarea
                value={issueDetail}
                onChange={(e) => setIssueDetail(e.target.value)}
                placeholder="Please tell us more..."
                className="w-full bg-slate-900/50 border border-slate-700 rounded-lg p-4 text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-slate-400 mt-1">
                {issueDetail.length}/200 characters
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowIssueForm(false)}
              className="flex-1 px-4 py-3 border border-slate-700 rounded-lg hover:bg-slate-800 text-white transition"
            >
              Back
            </button>
            <button
              onClick={handleIssueSubmit}
              disabled={submitting || !issueType}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-slate-700 shadow-2xl">
        <div className="mb-6">
          <div className="text-5xl mb-4">💭</div>
          <h3 className="text-3xl font-bold text-white mb-2">
            How was today's lesson?
          </h3>
          <p className="text-slate-400">
            Your quick feedback helps us improve
          </p>
        </div>

        <div className="flex gap-4 justify-center mb-6">
          <button
            onClick={() => handleQuickFeedback(true)}
            disabled={submitting}
            className="flex-1 flex flex-col items-center gap-3 p-6 border-2 border-green-500 bg-green-500/10 rounded-xl hover:bg-green-500/20 transition disabled:opacity-50"
          >
            <ThumbsUp className="w-12 h-12 text-green-400" />
            <span className="font-bold text-white text-lg">Good</span>
          </button>

          <button
            onClick={() => handleQuickFeedback(false)}
            disabled={submitting}
            className="flex-1 flex flex-col items-center gap-3 p-6 border-2 border-red-500 bg-red-500/10 rounded-xl hover:bg-red-500/20 transition disabled:opacity-50"
          >
            <ThumbsDown className="w-12 h-12 text-red-400" />
            <span className="font-bold text-white text-lg">Needs Work</span>
          </button>
        </div>

        <button
          onClick={onComplete}
          className="text-slate-400 hover:text-white text-sm transition"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
