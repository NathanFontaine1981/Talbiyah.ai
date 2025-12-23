import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Star, ThumbsUp, TrendingUp, Users, Award, BarChart3 } from 'lucide-react';

interface TeacherRatingDisplayProps {
  teacherId: string;
}

interface RatingSummary {
  avg_rating: number;
  total_detailed_ratings: number;
  thumbs_up_percentage: number;
  total_quick_feedback: number;
  avg_teaching_quality: number;
  avg_punctuality: number;
  avg_communication: number;
  avg_goal_progress: number;
  recommendation_rate: number;
  total_unique_students: number;
  rebook_rate: number;
  completion_rate: number;
}

interface Review {
  rating: number;
  would_recommend: boolean;
  positive_feedback: string;
  created_at: string;
  milestone: string;
}

export default function TeacherRatingDisplay({ teacherId }: TeacherRatingDisplayProps) {
  const [summary, setSummary] = useState<RatingSummary | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRatingData();
  }, [teacherId]);

  const fetchRatingData = async () => {
    try {
      const { data, error } = await supabase
        .rpc('get_teacher_rating_display', { p_teacher_id: teacherId });

      if (error) throw error;

      if (data) {
        setSummary(data.summary);
        setReviews(data.recent_reviews || []);
      }
    } catch (error) {
      console.error('Error fetching ratings:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating: number, size: 'sm' | 'md' | 'lg' = 'md') => {
    const sizeClass = size === 'sm' ? 'w-4 h-4' : size === 'lg' ? 'w-6 h-6' : 'w-5 h-5';

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`${sizeClass} ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-700'
            }`}
          />
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-6 border border-gray-200 shadow-xl animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="h-8 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!summary) {
    return null;
  }

  const hasRatings = summary.total_detailed_ratings > 0 || summary.total_quick_feedback > 0;

  return (
    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl p-8 border border-gray-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <Award className="w-6 h-6 text-emerald-600" />
        <h3 className="text-2xl font-bold text-white">Teacher Ratings</h3>
      </div>

      {!hasRatings ? (
        <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
          <div className="text-5xl mb-4">🌟</div>
          <p className="text-lg text-white font-semibold mb-2">New Teacher</p>
          <p className="text-gray-500 text-sm">No ratings yet - Be the first to book and review!</p>
        </div>
      ) : (
        <>
          {/* Overall Rating Section */}
          <div className="flex items-start gap-6 mb-8 bg-gradient-to-r from-emerald-500/10 to-blue-600/10 rounded-xl p-6 border border-emerald-500/30">
            <div className="flex flex-col items-center">
              <div className="text-6xl font-bold text-white mb-2">
                {summary.avg_rating > 0 ? summary.avg_rating.toFixed(1) : 'New'}
              </div>
              {summary.avg_rating > 0 && (
                <>
                  {renderStars(summary.avg_rating, 'lg')}
                  <p className="text-sm text-gray-500 mt-2">
                    {summary.total_detailed_ratings} {summary.total_detailed_ratings === 1 ? 'review' : 'reviews'}
                  </p>
                </>
              )}
            </div>

            <div className="flex-1 space-y-3">
              {/* Quick Feedback */}
              {summary.total_quick_feedback > 0 && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <ThumbsUp className="w-5 h-5 text-green-400" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-gray-600">Student Satisfaction</span>
                      <span className="text-lg font-bold text-green-400">
                        {summary.thumbs_up_percentage}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                        style={{ width: `${summary.thumbs_up_percentage}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      Based on {summary.total_quick_feedback} lesson{summary.total_quick_feedback !== 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
              )}

              {/* Recommendation Rate */}
              {summary.total_detailed_ratings > 0 && (
                <div className="flex items-center gap-3 bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <Award className="w-5 h-5 text-emerald-600" />
                  <div>
                    <span className="text-sm text-gray-600">Would Recommend: </span>
                    <span className="text-lg font-bold text-emerald-600">
                      {summary.recommendation_rate}%
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Category Breakdown */}
          {summary.total_detailed_ratings > 0 && (
            <div className="mb-8">
              <h4 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-emerald-600" />
                Rating Breakdown
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: 'Teaching Quality', value: summary.avg_teaching_quality, icon: '📚', color: 'cyan' },
                  { label: 'Punctuality', value: summary.avg_punctuality, icon: '⏰', color: 'blue' },
                  { label: 'Communication', value: summary.avg_communication, icon: '🗣️', color: 'purple' },
                  { label: 'Meeting Goals', value: summary.avg_goal_progress, icon: '🎯', color: 'green' }
                ].map(category => (
                  <div key={category.label} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600 flex items-center gap-2">
                        <span className="text-xl">{category.icon}</span>
                        {category.label}
                      </span>
                      <span className="text-lg font-bold text-white">{category.value.toFixed(1)}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(category.value, 'sm')}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Behavioral Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-gradient-to-br from-emerald-500/10 to-blue-600/10 rounded-xl p-4 border border-emerald-500/30">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="w-5 h-5 text-emerald-600" />
                <span className="text-sm text-gray-600">Rebook Rate</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {summary.rebook_rate}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Students return for more lessons</p>
            </div>

            <div className="bg-gradient-to-br from-green-500/10 to-emerald-600/10 rounded-xl p-4 border border-green-500/30">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-5 h-5 text-green-400" />
                <span className="text-sm text-gray-600">Total Students</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {summary.total_unique_students}
              </div>
              <p className="text-xs text-gray-500 mt-1">Unique students taught</p>
            </div>

            <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/10 rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-5 h-5 text-purple-400" />
                <span className="text-sm text-gray-600">Completion Rate</span>
              </div>
              <div className="text-3xl font-bold text-white">
                {summary.completion_rate}%
              </div>
              <p className="text-xs text-gray-500 mt-1">Lessons completed successfully</p>
            </div>
          </div>

          {/* Recent Reviews */}
          {reviews && reviews.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-white mb-4">Recent Reviews</h4>
              <div className="space-y-4">
                {reviews.slice(0, 3).map((review, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 rounded-lg p-4 border-l-4 border-emerald-500"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      {renderStars(review.rating, 'sm')}
                      <span className="text-xs text-gray-500">
                        {new Date(review.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric'
                        })}
                      </span>
                      {review.would_recommend && (
                        <span className="ml-auto px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          Recommended
                        </span>
                      )}
                    </div>
                    <p className="text-gray-600 leading-relaxed">{review.positive_feedback}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
