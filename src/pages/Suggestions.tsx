import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Lightbulb,
  Send,
  CheckCircle,
  ArrowLeft,
  Sparkles,
  Bug,
  BookOpen,
  Palette,
  GraduationCap,
  HelpCircle
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';
import type { User } from '@supabase/supabase-js';

const CATEGORIES = [
  { value: 'feature_request', label: 'Feature Request', icon: Sparkles, color: 'text-purple-500' },
  { value: 'bug_report', label: 'Bug Report', icon: Bug, color: 'text-red-500' },
  { value: 'content_suggestion', label: 'Content Suggestion', icon: BookOpen, color: 'text-blue-500' },
  { value: 'ui_improvement', label: 'UI/UX Improvement', icon: Palette, color: 'text-pink-500' },
  { value: 'teacher_feedback', label: 'Teacher/Lesson Feedback', icon: GraduationCap, color: 'text-emerald-500' },
  { value: 'other', label: 'Other', icon: HelpCircle, color: 'text-gray-500' },
];

export default function Suggestions() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    category: '',
    title: '',
    description: '',
    name: '',
    email: '',
  });

  // Check auth and redirect if not logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        navigate('/login?redirect=/suggestions');
      } else {
        setUser(data.user);
        setForm(prev => ({ ...prev, email: data.user.email || '' }));
      }
      setCheckingAuth(false);
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!form.category || !form.title || !form.description) {
      return;
    }

    setLoading(true);

    try {
      const suggestionData = {
        user_id: user?.id || null,
        name: form.name || null,
        email: form.email || null,
        category: form.category,
        title: form.title,
        description: form.description,
      };

      const { error } = await supabase.from('suggestions').insert(suggestionData);

      if (error) throw error;

      // Send notification email to admin (non-blocking)
      supabase.functions.invoke('notify-suggestion', {
        body: {
          suggestion: {
            ...suggestionData,
            user_name: user?.user_metadata?.full_name,
            user_email: user?.email,
          }
        }
      }).catch(console.error);

      setSubmitted(true);
    } catch (err) {
      console.error('Error submitting suggestion:', err);
      alert('Failed to submit suggestion. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl p-8 max-w-md w-full text-center shadow-lg"
        >
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            JazakAllah Khair!
          </h2>
          <p className="text-gray-600 mb-6">
            Your suggestion has been received. We truly value your input and will give it great consideration.
          </p>
          <div className="space-y-3">
            <button
              onClick={() => {
                setSubmitted(false);
                setForm({
                  category: '',
                  title: '',
                  description: '',
                  name: form.name,
                  email: form.email,
                });
              }}
              className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition"
            >
              Submit Another Suggestion
            </button>
            <button
              onClick={() => navigate(-1)}
              className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-semibold transition"
            >
              Go Back
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white">
        <div className="max-w-3xl mx-auto px-4 py-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back</span>
          </button>

          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
              <Lightbulb className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Share Your Ideas</h1>
              <p className="text-white/80">Help us make Talbiyah.ai better for everyone</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-3xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6"
        >
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                What type of suggestion is this? *
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = form.category === cat.value;

                  return (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setForm({ ...form, category: cat.value })}
                      className={`p-4 rounded-xl border-2 transition text-left ${
                        isSelected
                          ? 'border-amber-500 bg-amber-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <Icon className={`w-5 h-5 mb-2 ${cat.color}`} />
                      <p className={`text-sm font-medium ${isSelected ? 'text-amber-700' : 'text-gray-700'}`}>
                        {cat.label}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Title / Summary *
              </label>
              <input
                type="text"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="A brief title for your suggestion"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                required
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Please describe your suggestion in detail. The more information you provide, the better we can understand and implement your idea."
                rows={6}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition resize-none"
                required
              />
            </div>

            {/* Contact Info (optional for logged-in users) */}
            {!user && (
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Your Name (optional)
                  </label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="Your name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="your@email.com"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 transition"
                  />
                </div>
              </div>
            )}

            {/* Info Box */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
              <p className="text-amber-800 text-sm">
                <strong>Your voice matters!</strong> Every suggestion is read personally and given great consideration.
                We're committed to building the best Islamic learning platform together with our community.
              </p>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || !form.category || !form.title || !form.description}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-amber-500 hover:bg-amber-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  <span>Submit Suggestion</span>
                </>
              )}
            </button>
          </form>
        </motion.div>

        {/* Additional Info */}
        <p className="text-center text-gray-500 text-sm mt-6">
          Have an urgent issue? Email us directly at{' '}
          <a href="mailto:support@talbiyah.ai" className="text-amber-600 hover:underline">
            support@talbiyah.ai
          </a>
        </p>
      </div>
    </div>
  );
}
