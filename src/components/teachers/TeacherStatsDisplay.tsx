import { Star, Clock, Users, Award, ThumbsUp } from 'lucide-react';
import { formatHoursTaught, getRatingDisplay } from '../../constants/teacherConstants';

interface TeacherStatsDisplayProps {
  hoursTaught: number;
  averageRating: number;
  ratingCount: number;
  completedLessons: number;
  thumbsUpPercentage?: number;
  totalFeedback?: number;
  variant?: 'compact' | 'full' | 'inline';
  className?: string;
}

export default function TeacherStatsDisplay({
  hoursTaught,
  averageRating,
  ratingCount,
  completedLessons,
  thumbsUpPercentage,
  totalFeedback,
  variant = 'compact',
  className = ''
}: TeacherStatsDisplayProps) {
  const ratingDisplay = getRatingDisplay(averageRating, ratingCount);

  // Inline variant - single line of stats
  if (variant === 'inline') {
    return (
      <div className={`flex items-center flex-wrap gap-3 text-sm ${className}`}>
        {ratingCount > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="font-semibold text-gray-900">{averageRating.toFixed(1)}</span>
            <span className="text-gray-500">({ratingCount})</span>
          </div>
        )}
        {hoursTaught > 0 && (
          <div className="flex items-center gap-1 text-gray-600">
            <Clock className="w-4 h-4" />
            <span>{formatHoursTaught(hoursTaught)}</span>
          </div>
        )}
        {completedLessons > 0 && (
          <div className="flex items-center gap-1 text-gray-600">
            <Award className="w-4 h-4" />
            <span>{completedLessons} lessons</span>
          </div>
        )}
        {thumbsUpPercentage !== undefined && totalFeedback !== undefined && totalFeedback > 0 && (
          <div className="flex items-center gap-1 bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
            <ThumbsUp className="w-3 h-3" />
            <span className="font-semibold">{thumbsUpPercentage}%</span>
          </div>
        )}
      </div>
    );
  }

  // Full variant - detailed stats with labels
  if (variant === 'full') {
    return (
      <div className={`grid grid-cols-2 sm:grid-cols-4 gap-4 ${className}`}>
        {/* Rating */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
              <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
            </div>
          </div>
          {ratingCount > 0 ? (
            <>
              <div className="text-2xl font-bold text-gray-900">{averageRating.toFixed(1)}</div>
              <div className="text-xs text-gray-500">{ratingCount} reviews</div>
            </>
          ) : (
            <>
              <div className="text-lg font-semibold text-gray-500">New</div>
              <div className="text-xs text-gray-400">No reviews yet</div>
            </>
          )}
        </div>

        {/* Hours Taught */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5 text-blue-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{formatHoursTaught(hoursTaught)}</div>
          <div className="text-xs text-gray-500">Teaching experience</div>
        </div>

        {/* Completed Lessons */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
              <Award className="w-5 h-5 text-purple-500" />
            </div>
          </div>
          <div className="text-2xl font-bold text-gray-900">{completedLessons}</div>
          <div className="text-xs text-gray-500">Lessons completed</div>
        </div>

        {/* Thumbs Up / Student Satisfaction */}
        <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
          <div className="flex justify-center mb-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <ThumbsUp className="w-5 h-5 text-green-500" />
            </div>
          </div>
          {totalFeedback !== undefined && totalFeedback > 0 ? (
            <>
              <div className="text-2xl font-bold text-gray-900">{thumbsUpPercentage}%</div>
              <div className="text-xs text-gray-500">Student satisfaction</div>
            </>
          ) : (
            <>
              <div className="text-lg font-semibold text-gray-500">-</div>
              <div className="text-xs text-gray-400">No feedback yet</div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Compact variant (default) - small stat badges
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {/* Star Rating */}
      {ratingCount > 0 && (
        <div className="flex items-center gap-1 bg-yellow-50 text-yellow-700 px-2.5 py-1 rounded-full text-sm">
          <Star className="w-3.5 h-3.5 fill-yellow-500 text-yellow-500" />
          <span className="font-semibold">{averageRating.toFixed(1)}</span>
          <span className="text-yellow-600/70">({ratingCount})</span>
        </div>
      )}

      {/* Hours Taught */}
      {hoursTaught > 0 && (
        <div className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2.5 py-1 rounded-full text-sm">
          <Clock className="w-3.5 h-3.5" />
          <span className="font-medium">{formatHoursTaught(hoursTaught)}</span>
        </div>
      )}

      {/* Lessons Completed */}
      {completedLessons > 0 && (
        <div className="flex items-center gap-1 bg-purple-50 text-purple-700 px-2.5 py-1 rounded-full text-sm">
          <Award className="w-3.5 h-3.5" />
          <span className="font-medium">{completedLessons} lessons</span>
        </div>
      )}

      {/* Thumbs Up Percentage */}
      {thumbsUpPercentage !== undefined && totalFeedback !== undefined && totalFeedback > 0 && (
        <div className="flex items-center gap-1 bg-green-500 text-white px-2.5 py-1 rounded-full text-sm">
          <ThumbsUp className="w-3.5 h-3.5" />
          <span className="font-semibold">{thumbsUpPercentage}%</span>
        </div>
      )}
    </div>
  );
}

// Compact stat for card headers
interface StatBadgeProps {
  icon: React.ReactNode;
  value: string | number;
  label?: string;
  color?: 'yellow' | 'blue' | 'green' | 'purple' | 'gray';
}

export function StatBadge({ icon, value, label, color = 'gray' }: StatBadgeProps) {
  const colorClasses = {
    yellow: 'bg-yellow-50 text-yellow-700',
    blue: 'bg-blue-50 text-blue-700',
    green: 'bg-green-50 text-green-700',
    purple: 'bg-purple-50 text-purple-700',
    gray: 'bg-gray-100 text-gray-700'
  };

  return (
    <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs ${colorClasses[color]}`}>
      {icon}
      <span className="font-semibold">{value}</span>
      {label && <span className="opacity-70">{label}</span>}
    </div>
  );
}
