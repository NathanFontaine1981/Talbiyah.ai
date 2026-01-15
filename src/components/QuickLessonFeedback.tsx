import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { ThumbsUp, ThumbsDown, X, Loader2, Sparkles, Eye } from 'lucide-react';

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
  const navigate = useNavigate();
  const [showIssueForm, setShowIssueForm] = useState(false);
  const [issueType, setIssueType] = useState('');
  const [issueDetail, setIssueDetail] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  // Insights generation state
  const [insightsReady, setInsightsReady] = useState(false);
  const [checkingInsights, setCheckingInsights] = useState(true);
  const [insightId, setInsightId] = useState<string | null>(null);

  // Poll for insights after feedback is submitted
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let attempts = 0;
    const maxAttempts = 30; // Check for 30 seconds

    const checkForInsights = async () => {
      try {
        const { data, error } = await supabase
          .from('lesson_insights')
          .select('id')
          .eq('lesson_id', lessonId)
          .maybeSingle();

        if (data && !error) {
          setInsightsReady(true);
          setInsightId(data.id);
          setCheckingInsights(false);
          if (interval) clearInterval(interval);
        } else {
          attempts++;
          if (attempts >= maxAttempts) {
            setCheckingInsights(false);
            if (interval) clearInterval(interval);
          }
        }
      } catch (err) {
        console.error('Error checking insights:', err);
      }
    };

    // Start checking immediately
    checkForInsights();

    // Then check every second
    interval = setInterval(checkForInsights, 1000);

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [lessonId]);

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
      setFeedbackSubmitted(true);
      toast.success('Thanks for your feedback!');
    } catch (error) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback');
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewInsights = () => {
    navigate(`/student/lesson-insights/${lessonId}`);
  };

  // Show insights ready screen after feedback
  if (feedbackSubmitted) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-200 shadow-2xl">
          <div className="mb-6">
            {checkingInsights ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Generating Lesson Insights
                </h3>
                <p className="text-gray-400">
                  AI is analyzing your lesson to create personalized insights...
                </p>
                <div className="mt-4 flex items-center justify-center gap-2 text-emerald-400 text-sm">
                  <Sparkles className="w-4 h-4" />
                  <span>This usually takes 10-20 seconds</span>
                </div>
              </>
            ) : insightsReady ? (
              <>
                <div className="w-16 h-16 mx-auto mb-4 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Sparkles className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Insights Ready!
                </h3>
                <p className="text-gray-400">
                  Your personalized lesson insights have been generated.
                </p>
              </>
            ) : (
              <>
                <div className="text-5xl mb-4">✅</div>
                <h3 className="text-2xl font-bold text-white mb-2">
                  Thanks for the feedback!
                </h3>
                <p className="text-gray-400">
                  Insights will be available soon in your dashboard.
                </p>
              </>
            )}
          </div>

          <div className="space-y-3">
            {insightsReady && (
              <button
                onClick={handleViewInsights}
                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl hover:from-emerald-600 hover:to-emerald-700 transition font-semibold text-lg"
              >
                <Eye className="w-5 h-5" />
                View Lesson Insights
              </button>
            )}
            <button
              onClick={onComplete}
              className={`w-full px-6 py-3 ${insightsReady ? 'text-gray-400 hover:text-white' : 'bg-gray-700 text-white rounded-xl hover:bg-gray-600'} transition`}
            >
              {insightsReady ? 'Skip for now' : 'Go to Dashboard'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showIssueForm) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 border border-gray-200 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-white">
              What went wrong?
            </h3>
            <button
              onClick={() => setShowIssueForm(false)}
              className="text-gray-500 hover:text-white transition"
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
                    ? 'border-emerald-500 bg-emerald-500/10'
                    : 'border-gray-200 hover:border-gray-300 bg-gray-50'
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
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                rows={3}
                maxLength={200}
              />
              <p className="text-xs text-gray-500 mt-1">
                {issueDetail.length}/200 characters
              </p>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => setShowIssueForm(false)}
              className="flex-1 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-700 transition"
            >
              Back
            </button>
            <button
              onClick={handleIssueSubmit}
              disabled={submitting || !issueType}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-semibold"
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
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-md w-full mx-4 text-center border border-gray-200 shadow-2xl">
        <div className="mb-6">
          <div className="text-5xl mb-4">💭</div>
          <h3 className="text-3xl font-bold text-white mb-2">
            How was today's lesson?
          </h3>
          <p className="text-gray-500">
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
          className="text-gray-500 hover:text-white text-sm transition"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
