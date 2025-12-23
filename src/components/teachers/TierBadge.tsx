import { getTierInfo, type TeacherTier } from '../../constants/teacherConstants';
import { Award, CheckCircle, Shield } from 'lucide-react';

interface TierBadgeProps {
  tier: string;
  size?: 'sm' | 'md' | 'lg';
  showDescription?: boolean;
  showBenefits?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

export default function TierBadge({
  tier,
  size = 'md',
  showDescription = false,
  showBenefits = false,
  variant = 'default',
  className = ''
}: TierBadgeProps) {
  const tierInfo = getTierInfo(tier);

  const sizeClasses = {
    sm: {
      icon: 'text-lg',
      text: 'text-xs',
      padding: 'px-2 py-1',
      container: 'gap-1'
    },
    md: {
      icon: 'text-2xl',
      text: 'text-sm',
      padding: 'px-3 py-1.5',
      container: 'gap-2'
    },
    lg: {
      icon: 'text-3xl',
      text: 'text-base',
      padding: 'px-4 py-2',
      container: 'gap-3'
    }
  };

  const s = sizeClasses[size];

  // Get tier-specific colors
  const getTierStyles = (tierInfo: TeacherTier) => {
    switch (tierInfo.tier) {
      case 'master':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-amber-600',
          text: 'text-white',
          border: 'border-amber-300',
          glow: 'shadow-amber-500/30',
          bgLight: 'bg-amber-50',
          textDark: 'text-amber-700'
        };
      case 'expert':
        return {
          bg: 'bg-gradient-to-r from-amber-500 to-orange-500',
          text: 'text-white',
          border: 'border-amber-300',
          glow: 'shadow-amber-500/30',
          bgLight: 'bg-amber-50',
          textDark: 'text-amber-700'
        };
      case 'skilled':
        return {
          bg: 'bg-gradient-to-r from-purple-500 to-purple-600',
          text: 'text-white',
          border: 'border-purple-300',
          glow: 'shadow-purple-500/30',
          bgLight: 'bg-purple-50',
          textDark: 'text-purple-700'
        };
      case 'apprentice':
        return {
          bg: 'bg-gradient-to-r from-blue-500 to-blue-600',
          text: 'text-white',
          border: 'border-blue-300',
          glow: 'shadow-blue-500/30',
          bgLight: 'bg-blue-50',
          textDark: 'text-blue-700'
        };
      default: // newcomer
        return {
          bg: 'bg-gradient-to-r from-emerald-500 to-emerald-600',
          text: 'text-white',
          border: 'border-emerald-300',
          glow: 'shadow-emerald-500/30',
          bgLight: 'bg-emerald-50',
          textDark: 'text-emerald-700'
        };
    }
  };

  const styles = getTierStyles(tierInfo);

  // Compact variant - just icon and name
  if (variant === 'compact') {
    return (
      <span
        className={`inline-flex items-center ${s.container} ${s.padding} ${styles.bg} ${styles.text} rounded-full font-semibold shadow-md ${styles.glow} ${className}`}
      >
        <span className={s.icon}>{tierInfo.icon}</span>
        <span className={s.text}>{tierInfo.name}</span>
      </span>
    );
  }

  // Detailed variant - full card with benefits
  if (variant === 'detailed') {
    return (
      <div className={`rounded-xl overflow-hidden border ${styles.border} ${className}`}>
        {/* Header */}
        <div className={`${styles.bg} ${styles.text} p-4`}>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{tierInfo.icon}</span>
            <div>
              <h3 className="text-xl font-bold">{tierInfo.name} Teacher</h3>
              <p className="text-white/80 text-sm">{tierInfo.description}</p>
            </div>
          </div>
        </div>

        {/* Benefits */}
        {showBenefits && tierInfo.benefits.length > 0 && (
          <div className={`${styles.bgLight} p-4`}>
            <h4 className={`text-sm font-semibold ${styles.textDark} mb-2 flex items-center gap-2`}>
              <Award className="w-4 h-4" />
              What this means for you
            </h4>
            <ul className="space-y-2">
              {tierInfo.benefits.map((benefit, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <CheckCircle className={`w-4 h-4 mt-0.5 flex-shrink-0 ${styles.textDark}`} />
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  // Default variant
  return (
    <div className={`inline-flex items-center ${s.container} ${className}`}>
      <span
        className={`inline-flex items-center ${s.container} ${s.padding} ${styles.bg} ${styles.text} rounded-full font-semibold shadow-md ${styles.glow}`}
      >
        <span className={s.icon}>{tierInfo.icon}</span>
        <span className={s.text}>{tierInfo.name}</span>
      </span>
      {showDescription && (
        <span className="text-gray-600 text-sm ml-2">{tierInfo.shortDescription}</span>
      )}
    </div>
  );
}

// Separate component for tier explanation tooltip
interface TierTooltipProps {
  tier: string;
}

export function TierTooltip({ tier }: TierTooltipProps) {
  const tierInfo = getTierInfo(tier);

  return (
    <div className="bg-white rounded-xl shadow-2xl border border-gray-200 p-4 max-w-xs">
      <div className="flex items-center gap-3 mb-3">
        <span className="text-3xl">{tierInfo.icon}</span>
        <div>
          <h4 className="font-bold text-gray-900">{tierInfo.name}</h4>
          <p className="text-xs text-gray-500">Level {tierInfo.level} Teacher</p>
        </div>
      </div>
      <p className="text-sm text-gray-600 mb-3">{tierInfo.description}</p>
      <div className="flex items-center gap-2 text-xs text-gray-500">
        <Shield className="w-3 h-3" />
        <span>All teachers are vetted by Talbiyah</span>
      </div>
    </div>
  );
}
