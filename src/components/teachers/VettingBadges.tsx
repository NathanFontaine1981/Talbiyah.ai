import { CheckCircle, Shield, Award, GraduationCap, UserCheck, BookOpen } from 'lucide-react';
import { VETTING_BADGES, type VettingBadge } from '../../constants/teacherConstants';

interface VettingBadgesProps {
  badges: string[];
  maxVisible?: number;
  variant?: 'default' | 'compact' | 'detailed' | 'inline';
  showLabels?: boolean;
  className?: string;
}

export default function VettingBadges({
  badges,
  maxVisible = 4,
  variant = 'default',
  showLabels = true,
  className = ''
}: VettingBadgesProps) {
  // Get badge info and sort by priority
  const validBadges = badges
    .map(id => VETTING_BADGES.find(b => b.id === id))
    .filter((badge): badge is VettingBadge => badge !== undefined)
    .sort((a, b) => a.priority - b.priority);

  if (validBadges.length === 0) return null;

  const visibleBadges = validBadges.slice(0, maxVisible);
  const hiddenCount = validBadges.length - maxVisible;

  // Get icon component based on badge
  const getIconComponent = (badgeId: string) => {
    switch (badgeId) {
      case 'identity_verified':
        return <UserCheck className="w-4 h-4" />;
      case 'credentials_verified':
        return <GraduationCap className="w-4 h-4" />;
      case 'ijazah_holder':
        return <BookOpen className="w-4 h-4" />;
      case 'talbiyah_certified':
        return <Award className="w-4 h-4" />;
      case 'safeguarding_trained':
        return <Shield className="w-4 h-4" />;
      default:
        return <CheckCircle className="w-4 h-4" />;
    }
  };

  // Inline variant - just icons in a row
  if (variant === 'inline') {
    return (
      <div className={`flex items-center gap-1 ${className}`}>
        {visibleBadges.map((badge) => (
          <div
            key={badge.id}
            className="w-6 h-6 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center"
            title={`${badge.name}: ${badge.description}`}
          >
            {getIconComponent(badge.id)}
          </div>
        ))}
        {hiddenCount > 0 && (
          <span
            className="text-xs text-emerald-600 font-medium"
            title={validBadges.slice(maxVisible).map(b => b.name).join(', ')}
          >
            +{hiddenCount}
          </span>
        )}
      </div>
    );
  }

  // Compact variant - small pill badges
  if (variant === 'compact') {
    return (
      <div className={`flex flex-wrap gap-1.5 ${className}`}>
        {visibleBadges.map((badge) => (
          <div
            key={badge.id}
            className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full text-xs font-medium border border-emerald-200"
            title={badge.description}
          >
            <span className="text-emerald-500">{getIconComponent(badge.id)}</span>
            {showLabels && <span>{badge.name}</span>}
          </div>
        ))}
        {hiddenCount > 0 && (
          <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
            +{hiddenCount} more
          </span>
        )}
      </div>
    );
  }

  // Detailed variant - full cards with descriptions
  if (variant === 'detailed') {
    return (
      <div className={`space-y-3 ${className}`}>
        <h4 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
          <Shield className="w-4 h-4 text-emerald-500" />
          Verified by Talbiyah
        </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {validBadges.map((badge) => (
            <div
              key={badge.id}
              className="flex items-start gap-3 p-3 bg-emerald-50 rounded-lg border border-emerald-200"
            >
              <div className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0">
                {getIconComponent(badge.id)}
              </div>
              <div>
                <h5 className="font-semibold text-emerald-900 text-sm">{badge.name}</h5>
                <p className="text-xs text-emerald-700">{badge.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Default variant - badges with icons and labels
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {visibleBadges.map((badge) => (
        <div
          key={badge.id}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-sm font-medium border border-emerald-200"
          title={badge.description}
        >
          <span className="text-emerald-500">{getIconComponent(badge.id)}</span>
          {showLabels && <span>{badge.name}</span>}
        </div>
      ))}
      {hiddenCount > 0 && (
        <span
          className="px-2.5 py-1 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium cursor-help"
          title={validBadges.slice(maxVisible).map(b => b.name).join(', ')}
        >
          +{hiddenCount} more
        </span>
      )}
    </div>
  );
}

// Trust banner - shows all vetting for a teacher profile
interface TrustBannerProps {
  badges: string[];
  isTalbiyahCertified?: boolean;
  className?: string;
}

export function TrustBanner({
  badges,
  isTalbiyahCertified = false,
  className = ''
}: TrustBannerProps) {
  const validBadges = badges
    .map(id => VETTING_BADGES.find(b => b.id === id))
    .filter((badge): badge is VettingBadge => badge !== undefined)
    .sort((a, b) => a.priority - b.priority);

  return (
    <div className={`bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl p-4 ${className}`}>
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center">
          <Shield className="w-5 h-5" />
        </div>
        <div>
          <h4 className="font-bold text-emerald-900">Vetted & Verified</h4>
          <p className="text-xs text-emerald-700">This teacher has been checked by Talbiyah</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {validBadges.map((badge) => (
          <div
            key={badge.id}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-white rounded-full text-sm border border-emerald-200"
          >
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span className="text-emerald-800 font-medium">{badge.name}</span>
          </div>
        ))}
        {isTalbiyahCertified && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500 text-white rounded-full text-sm">
            <Award className="w-3.5 h-3.5" />
            <span className="font-semibold">Talbiyah Certified</span>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple verified checkmark for teacher cards
export function VerifiedBadge({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1 text-emerald-600 ${className}`}
      title="Verified by Talbiyah"
    >
      <CheckCircle className="w-4 h-4 fill-emerald-500 text-white" />
      <span className="text-xs font-medium">Verified</span>
    </div>
  );
}
