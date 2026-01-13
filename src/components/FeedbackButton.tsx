import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageSquarePlus, X, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
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

export default function FeedbackButton() {
  const [isHovered, setIsHovered] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [category, setCategory] = useState<FeedbackCategory>('suggestion');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user);
    });
  }, []);

  // Don't show if user dismissed it this session
  if (dismissed) return null;

  function handleClick() {
    if (user) {
      setIsOpen(true);
    } else {
      navigate('/login?redirect=/suggestions');
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setSubmitting(true);

    try {
      // Insert into suggestions table
      const { error: insertError } = await supabase
        .from('suggestions')
        .insert({
          user_id: user.id,
          category,
          title: subject.trim(),
          description: message.trim()
        });

      if (insertError) throw insertError;

      // Send email notification
      try {
        await supabase.functions.invoke('notify-suggestion', {
          body: {
            category,
            title: subject.trim(),
            description: message.trim(),
            userEmail: user.email
          }
        });
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
      }

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
      console.error('Error submitting suggestion:', err);
      setError('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-50">
        <AnimatePresence>
          {isHovered && !isOpen && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="absolute right-full mr-3 top-1/2 -translate-y-1/2 whitespace-nowrap"
            >
              <div className="bg-gray-900 text-white px-3 py-2 rounded-lg text-sm font-medium shadow-lg">
                Share your ideas
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative group">
          <motion.button
            onClick={handleClick}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="w-14 h-14 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-full shadow-lg flex items-center justify-center transition-all"
          >
            <MessageSquarePlus className="w-6 h-6" />
          </motion.button>

          {/* Dismiss button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setDismissed(true);
            }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-gray-700 hover:bg-gray-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
          >
            <X className="w-3 h-3 text-white" />
          </button>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => !submitting && setIsOpen(false)}
            />

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-2xl border border-gray-200 shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                    <MessageSquarePlus className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Share Your Feedback</h2>
                    <p className="text-sm text-gray-500">Help us improve Talbiyah</p>
                  </div>
                </div>
                <button
                  onClick={() => !submitting && setIsOpen(false)}
                  className="p-2 text-gray-500 hover:text-gray-900 transition rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {submitted ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Thank You!</h3>
                  <p className="text-gray-500">Your feedback has been submitted. We appreciate your input!</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                  {/* Category Selection */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
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
                              ? 'bg-amber-50 border-amber-500 text-amber-700'
                              : 'bg-gray-50 border-gray-200 text-gray-600 hover:border-gray-300'
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
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Subject
                    </label>
                    <input
                      type="text"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Brief summary of your feedback"
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 transition"
                      maxLength={100}
                    />
                  </div>

                  {/* Message */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Message
                    </label>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder="Tell us more about your suggestion, issue, or feedback..."
                      rows={4}
                      className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 transition resize-none"
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-400 mt-1 text-right">
                      {message.length}/1000
                    </p>
                  </div>

                  {/* Error */}
                  {error && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-red-600 text-sm">{error}</p>
                    </div>
                  )}

                  {/* Submit Button */}
                  <button
                    type="submit"
                    disabled={submitting || !subject.trim() || !message.trim()}
                    className="w-full px-6 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white rounded-xl font-semibold transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
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

                  <p className="text-xs text-center text-gray-400">
                    Your feedback helps us build a better learning platform
                  </p>
                </form>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
