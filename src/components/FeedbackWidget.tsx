import { useState } from 'react';
import { MessageSquarePlus, Send, X, CheckCircle, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

type FeedbackCategory = 'suggestion' | 'bug' | 'feature_request' | 'complaint' | 'praise' | 'other';

const categoryLabels: Record<FeedbackCategory, string> = {
  suggestion: 'Suggestion',
  bug: 'Bug Report',
  feature_request: 'Feature Request',
  complaint: 'Complaint',
  praise: 'Praise',
  other: 'Other'
};

const categoryEmojis: Record<FeedbackCategory, string> = {
  suggestion: '💡',
  bug: '🐛',
  feature_request: '✨',
  complaint: '😔',
  praise: '🌟',
  other: '💬'
};

export default function FeedbackWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('You must be logged in to submit feedback');
        return;
      }

      const { error: insertError } = await supabase
        .from('user_feedback')
        .insert({
          user_id: user.id,
          category,
          subject: subject.trim(),
          message: message.trim()
        });

      if (insertError) throw insertError;

      setSubmitted(true);
      setSubject('');
      setMessage('');
      setCategory('suggestion');

      // Reset after showing success
      setTimeout(() => {
        setSubmitted(false);
        setIsOpen(false);
      }, 2000);

    } catch (err) {
      console.error('Error submitting feedback:', err);
      setError('Failed to submit feedback. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      {/* Floating Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-40 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white p-4 rounded-full shadow-lg shadow-purple-500/30 transition-all hover:scale-105 flex items-center space-x-2 group"
        title="Send Feedback"
      >
        <MessageSquarePlus className="w-6 h-6" />
        <span className="max-w-0 overflow-hidden group-hover:max-w-[100px] transition-all duration-300 whitespace-nowrap">
          Feedback
        </span>
      </button>

      {/* Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => !submitting && setIsOpen(false)}
          />

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl flex items-center justify-center">
                  <MessageSquarePlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-white">Send Feedback</h2>
                  <p className="text-sm text-gray-500">Help us improve Talbiyah</p>
                </div>
              </div>
              <button
                onClick={() => !submitting && setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-white transition rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Thank You!</h3>
                <p className="text-gray-500">Your feedback has been submitted. We appreciate your input!</p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Category Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Category
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {(Object.keys(categoryLabels) as FeedbackCategory[]).map((cat) => (
                      <button
                        key={cat}
                        type="button"
                        onClick={() => setCategory(cat)}
                        className={`p-3 rounded-xl text-center transition border ${
                          category === cat
                            ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                            : 'bg-gray-50 border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        <span className="text-lg block mb-1">{categoryEmojis[cat]}</span>
                        <span className="text-xs font-medium">{categoryLabels[cat]}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Subject
                  </label>
                  <input
                    type="text"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Brief summary of your feedback"
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
                    maxLength={100}
                  />
                </div>

                {/* Message */}
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">
                    Message
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Tell us more about your suggestion, issue, or feedback..."
                    rows={4}
                    className="w-full px-4 py-3 bg-gray-100 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:border-purple-500 transition resize-none"
                    maxLength={1000}
                  />
                  <p className="text-xs text-gray-500 mt-1 text-right">
                    {message.length}/1000
                  </p>
                </div>

                {/* Error */}
                {error && (
                  <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={submitting || !subject.trim() || !message.trim()}
                  className="w-full px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-xl font-semibold transition shadow-lg shadow-purple-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5" />
                      <span>Submit Feedback</span>
                    </>
                  )}
                </button>

                <p className="text-xs text-center text-gray-500">
                  Your feedback helps us build a better learning platform for the Muslim community
                </p>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}
