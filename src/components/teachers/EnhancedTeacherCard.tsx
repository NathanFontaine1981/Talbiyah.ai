import { User, Play, MessageCircle, Calendar, ExternalLink } from 'lucide-react';
import TierBadge from './TierBadge';
import TeacherStatsDisplay from './TeacherStatsDisplay';
import SpecializationTags from './SpecializationTags';
import { GentlenessBadge } from './GentlenessGuarantee';
import { VerifiedBadge } from './VettingBadges';
import { getTierInfo } from '../../constants/teacherConstants';

interface EnhancedTeacherCardProps {
  teacher: {
    id: string;
    user_id: string;
    full_name: string;
    bio: string | null;
    avatar_url: string | null;
    tier: string;
    tier_name: string;
    tier_icon: string;
    student_hourly_price: number;
    hours_taught: number;
    average_rating: number;
    completed_lessons: number;
    rating_avg?: number;
    rating_count?: number;
    thumbs_up_percentage?: number;
    total_feedback?: number;
    video_intro_url?: string | null;
    is_talbiyah_certified?: boolean;
    specializations?: string[];
    vetting_badges?: string[];
  };
  onViewProfile?: (teacherId: string) => void;
  onBook?: (teacherId: string) => void;
  onMessage?: (teacherId: string) => void;
  onWatchIntro?: (videoUrl: string) => void;
  showBookButton?: boolean;
  showMessageButton?: boolean;
  isMyTeacher?: boolean;
  className?: string;
}

export default function EnhancedTeacherCard({
  teacher,
  onViewProfile,
  onBook,
  onMessage,
  onWatchIntro,
  showBookButton = true,
  showMessageButton = false,
  isMyTeacher = false,
  className = ''
}: EnhancedTeacherCardProps) {
  const tierInfo = getTierInfo(teacher.tier);

  // Get tier-specific gradient for buttons
  const getTierGradient = (tier: string) => {
    switch (tier) {
      case 'master':
        return 'from-pink-500 to-purple-600';
      case 'expert':
        return 'from-amber-500 to-orange-500';
      case 'skilled':
        return 'from-purple-500 to-indigo-500';
      case 'apprentice':
        return 'from-blue-500 to-cyan-500';
      default:
        return 'from-emerald-500 to-teal-500';
    }
  };

  const getTierBgLight = (tier: string) => {
    switch (tier) {
      case 'master':
        return 'bg-pink-50 border-pink-200';
      case 'expert':
        return 'bg-amber-50 border-amber-200';
      case 'skilled':
        return 'bg-purple-50 border-purple-200';
      case 'apprentice':
        return 'bg-blue-50 border-blue-200';
      default:
        return 'bg-emerald-50 border-emerald-200';
    }
  };

  return (
    <div
      className={`bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-gray-200 ${className}`}
    >
      {/* Tier Badge Header */}
      <div className={`px-4 py-3 ${getTierBgLight(teacher.tier)} border-b`}>
        <div className="flex items-center justify-between">
          <TierBadge tier={teacher.tier} size="sm" />
          <div className="flex items-center gap-2">
            {teacher.is_talbiyah_certified && <VerifiedBadge />}
            <TeacherStatsDisplay
              hoursTaught={teacher.hours_taught}
              averageRating={teacher.rating_avg || teacher.average_rating}
              ratingCount={teacher.rating_count || 0}
              completedLessons={teacher.completed_lessons}
              thumbsUpPercentage={teacher.thumbs_up_percentage}
              totalFeedback={teacher.total_feedback}
              variant="inline"
            />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-5">
        {/* Teacher Info Row */}
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-cyan-100 border-2 border-white shadow-md">
              {teacher.avatar_url ? (
                <img
                  src={teacher.avatar_url}
                  alt={teacher.full_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="w-8 h-8 text-emerald-600" />
                </div>
              )}
            </div>
            {/* Video intro indicator */}
            {teacher.video_intro_url && (
              <button
                onClick={() => onWatchIntro?.(teacher.video_intro_url!)}
                className="absolute -bottom-1 -right-1 w-7 h-7 bg-white rounded-full shadow-md border-2 border-emerald-500 flex items-center justify-center hover:scale-110 transition"
                title="Watch intro video"
              >
                <Play className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600" />
              </button>
            )}
          </div>

          {/* Name and Bio */}
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-gray-900 mb-1 truncate">
              {teacher.full_name}
            </h3>
            <p className="text-sm text-gray-600 line-clamp-2 mb-2">
              {teacher.bio || tierInfo.description}
            </p>
            <GentlenessBadge />
          </div>
        </div>

        {/* Specializations */}
        {teacher.specializations && teacher.specializations.length > 0 && (
          <div className="mb-4">
            <SpecializationTags
              specializations={teacher.specializations}
              maxVisible={3}
              size="sm"
              variant="compact"
            />
          </div>
        )}

        {/* Pricing */}
        <div className="flex items-end justify-between pt-4 border-t border-gray-100">
          <div>
            <div className="text-xs text-gray-500 mb-0.5">Starting from</div>
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold text-gray-900">
                £{(teacher.student_hourly_price / 2).toFixed(2)}
              </span>
              <span className="text-sm text-gray-500">/ 30 min</span>
            </div>
            <div className="text-xs text-gray-400">
              £{teacher.student_hourly_price.toFixed(2)}/hour
            </div>
          </div>

          {/* My Teacher indicator */}
          {isMyTeacher && (
            <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-xs font-semibold">
              My Teacher
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 space-y-2">
          {/* Primary row */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onViewProfile?.(teacher.id)}
              className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              Profile
            </button>
            {showBookButton && (
              <button
                onClick={() => onBook?.(teacher.id)}
                className={`px-4 py-2.5 bg-gradient-to-r ${getTierGradient(teacher.tier)} text-white rounded-xl font-semibold transition hover:opacity-90 shadow-md flex items-center justify-center gap-2`}
              >
                <Calendar className="w-4 h-4" />
                Book Now
              </button>
            )}
          </div>

          {/* Message button */}
          {showMessageButton && (
            <button
              onClick={() => onMessage?.(teacher.id)}
              className="w-full px-4 py-2.5 border-2 border-blue-500 text-blue-600 hover:bg-blue-50 rounded-xl font-semibold transition flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Send Message
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// Compact variant for lists
interface CompactTeacherCardProps {
  teacher: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    tier: string;
    student_hourly_price: number;
    rating_avg?: number;
    rating_count?: number;
    hours_taught?: number;
  };
  onSelect?: (teacherId: string) => void;
  selected?: boolean;
  className?: string;
}

export function CompactTeacherCard({
  teacher,
  onSelect,
  selected = false,
  className = ''
}: CompactTeacherCardProps) {
  return (
    <button
      onClick={() => onSelect?.(teacher.id)}
      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
        selected
          ? 'border-emerald-500 bg-emerald-50 shadow-md'
          : 'border-gray-200 bg-white hover:border-emerald-300 hover:shadow-sm'
      } ${className}`}
    >
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-full overflow-hidden bg-gradient-to-br from-emerald-100 to-cyan-100 flex-shrink-0">
          {teacher.avatar_url ? (
            <img
              src={teacher.avatar_url}
              alt={teacher.full_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <User className="w-6 h-6 text-emerald-600" />
            </div>
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-gray-900 truncate">{teacher.full_name}</span>
            <TierBadge tier={teacher.tier} size="sm" variant="compact" />
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-600">
            <span className="font-medium">£{teacher.student_hourly_price}/hr</span>
            {teacher.rating_avg && teacher.rating_count && teacher.rating_count > 0 && (
              <span className="flex items-center gap-1">
                <span className="text-yellow-500">★</span>
                {teacher.rating_avg.toFixed(1)}
              </span>
            )}
            {teacher.hours_taught && teacher.hours_taught > 0 && (
              <span>{teacher.hours_taught}h taught</span>
            )}
          </div>
        </div>
        {selected && (
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}
      </div>
    </button>
  );
}
