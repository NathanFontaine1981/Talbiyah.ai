import { useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '../lib/supabaseClient';
import { Star, Send, X } from 'lucide-react';

interface DetailedTeacherRatingProps {
  teacherId: string;
  teacherName: string;
  studentId: string;
  milestoneType: string;
  lessonCount: number;
  onComplete: () => void;
}

export default function DetailedTeacherRating({
  teacherId,
  teacherName,
  studentId,
  milestoneType,
  lessonCount,
  onComplete
}: DetailedTeacherRatingProps) {
  const [ratings, setRatings] = useState({
    teaching_quality: 0,
    punctuality: 0,
    communication: 0,
    goal_progress: 0
  });
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [positiveFeedback, setPositiveFeedback] = useState('');
  const [improvementFeedback, setImprovementFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleRatingClick = (category: keyof typeof ratings, value: number) => {
    setRatings(prev => ({ ...prev, [category]: value }));
  };

  const handleSubmit = async () => {
    if (Object.values(ratings).some(r => r === 0) || wouldRecommend === null) {
      toast.warning('Please complete all ratings');
      return;
    }

    setSubmitting(true);
    try {
      const overallRating = (
        ratings.teaching_quality +
        ratings.punctuality +
        ratings.communication +
        ratings.goal_progress
      ) / 4;

      const { error } = await supabase
        .from('teacher_ratings')
        .insert({
          teacher_id: teacherId,
          student_id: studentId,
          milestone_type: milestoneType,
          lesson_count_at_rating: lessonCount,
          ...ratings,
          overall_rating: Number(overallRating.toFixed(1)),
          would_recommend: wouldRecommend,
          positive_feedback: positiveFeedback || null,
          improvement_feedback: improvementFeedback || null
        });

      if (error) throw error;
      onComplete();
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error('Failed to submit rating');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (category: keyof typeof ratings, currentRating: number) => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => handleRatingClick(category, star)}
            className="transition transform hover:scale-110"
            type="button"
          >
            <Star
              className={`w-10 h-10 ${
                star <= currentRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'text-gray-600 hover:text-gray-500'
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  const milestoneMessages = {
    lesson_1: "Great start! Share your first impression",
    lesson_5: "5 lessons down! How's it going?",
    lesson_10: "10 lessons! You're building a habit",
    lesson_20: "20 lessons! You're a dedicated learner",
    exit: "Thanks for your time with us"
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 max-w-2xl w-full my-8 border border-gray-200 shadow-2xl">
        <div className="flex justify-between items-start mb-6">
          <div className="text-center flex-1">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-white mb-2">
              {lessonCount} {lessonCount === 1 ? 'Lesson' : 'Lessons'} Complete!
            </h2>
            <p className="text-emerald-600 font-medium mb-1">
              {milestoneMessages[milestoneType as keyof typeof milestoneMessages]}
            </p>
            <p className="text-gray-500">
              Rate your experience with {teacherName}
            </p>
          </div>
          <button
            onClick={onComplete}
            className="text-gray-500 hover:text-white transition"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Teaching Quality */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">📚</span>
              Teaching Quality
            </label>
            <p className="text-sm text-gray-500 mb-3">How well does the teacher explain concepts?</p>
            {renderStars('teaching_quality', ratings.teaching_quality)}
          </div>

          {/* Punctuality */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">⏰</span>
              Punctuality
            </label>
            <p className="text-sm text-gray-500 mb-3">Does the teacher start lessons on time?</p>
            {renderStars('punctuality', ratings.punctuality)}
          </div>

          {/* Communication */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">🗣️</span>
              Communication
            </label>
            <p className="text-sm text-gray-500 mb-3">How clear and responsive is the teacher?</p>
            {renderStars('communication', ratings.communication)}
          </div>

          {/* Goal Progress */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-lg font-semibold text-white mb-3 flex items-center gap-2">
              <span className="text-2xl">🎯</span>
              Helping You Reach Your Goals
            </label>
            <p className="text-sm text-gray-500 mb-3">Are you making progress toward your learning goals?</p>
            {renderStars('goal_progress', ratings.goal_progress)}
          </div>

          {/* Recommendation */}
          <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
            <label className="block text-lg font-semibold text-white mb-3">
              Would you recommend this teacher to others?
            </label>
            <div className="flex gap-4">
              <button
                onClick={() => setWouldRecommend(true)}
                type="button"
                className={`flex-1 py-4 rounded-lg border-2 font-bold transition ${
                  wouldRecommend === true
                    ? 'border-green-500 bg-green-500/20 text-green-400'
                    : 'border-gray-200 hover:border-green-500 text-gray-500'
                }`}
              >
                👍 Yes, Definitely
              </button>
              <button
                onClick={() => setWouldRecommend(false)}
                type="button"
                className={`flex-1 py-4 rounded-lg border-2 font-bold transition ${
                  wouldRecommend === false
                    ? 'border-red-500 bg-red-500/20 text-red-400'
                    : 'border-gray-200 hover:border-red-500 text-gray-500'
                }`}
              >
                👎 Not Really
              </button>
            </div>
          </div>

          {/* Positive Feedback */}
          <div>
            <label className="block text-lg font-semibold text-white mb-2">
              💚 What's going well? <span className="text-gray-500 text-sm font-normal">(optional)</span>
            </label>
            <textarea
              value={positiveFeedback}
              onChange={(e) => setPositiveFeedback(e.target.value)}
              placeholder="Share what you appreciate about this teacher..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {positiveFeedback.length}/500 characters
            </p>
          </div>

          {/* Improvement Feedback */}
          <div>
            <label className="block text-lg font-semibold text-white mb-2">
              💡 What could improve? <span className="text-gray-500 text-sm font-normal">(optional)</span>
            </label>
            <textarea
              value={improvementFeedback}
              onChange={(e) => setImprovementFeedback(e.target.value)}
              placeholder="Constructive feedback helps teachers grow..."
              className="w-full bg-gray-50 border border-gray-200 rounded-lg p-4 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              rows={3}
              maxLength={500}
            />
            <p className="text-xs text-gray-500 mt-1">
              {improvementFeedback.length}/500 characters
            </p>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={onComplete}
            className="flex-1 px-6 py-4 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-700 transition font-semibold"
            type="button"
          >
            Skip for now
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || Object.values(ratings).some(r => r === 0) || wouldRecommend === null}
            className="flex-1 px-6 py-4 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-lg hover:from-cyan-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-bold flex items-center justify-center gap-2"
            type="button"
          >
            {submitting ? (
              'Submitting...'
            ) : (
              <>
                <Send className="w-5 h-5" />
                Submit Rating
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
