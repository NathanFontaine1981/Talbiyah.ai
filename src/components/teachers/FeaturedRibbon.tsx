import { Star, Sparkles } from 'lucide-react';

interface FeaturedRibbonProps {
  variant?: 'badge' | 'corner' | 'banner';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function FeaturedRibbon({
  variant = 'badge',
  size = 'md',
  className = ''
}: FeaturedRibbonProps) {
  // Size classes
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  };

  // Corner ribbon variant - absolute positioned
  if (variant === 'corner') {
    return (
      <div className={`absolute -top-1 -right-1 z-10 ${className}`}>
        <div className="relative">
          {/* Ribbon shape */}
          <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white px-3 py-1 rounded-bl-lg rounded-tr-lg shadow-lg flex items-center gap-1">
            <Star className="w-3 h-3 fill-white" />
            <span className="text-xs font-bold">Featured</span>
          </div>
          {/* Fold effect */}
          <div className="absolute -bottom-1 right-0 w-0 h-0 border-l-[6px] border-l-transparent border-t-[6px] border-t-amber-600" />
        </div>
      </div>
    );
  }

  // Banner variant - full width
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-amber-500 via-orange-500 to-amber-500 text-white ${className}`}>
        <div className="flex items-center justify-center gap-2 py-2">
          <Sparkles className="w-4 h-4" />
          <span className="font-semibold text-sm">Featured Teacher</span>
          <Sparkles className="w-4 h-4" />
        </div>
      </div>
    );
  }

  // Badge variant (default) - inline badge
  return (
    <div
      className={`
        inline-flex items-center gap-1 rounded-full font-medium
        bg-gradient-to-r from-amber-100 to-orange-100 text-amber-700
        border border-amber-200
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <Star className={`${size === 'sm' ? 'w-3 h-3' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} fill-amber-500 text-amber-500`} />
      <span>Featured</span>
    </div>
  );
}

// Animated version for highlighting
export function AnimatedFeaturedRibbon({ className = '' }: { className?: string }) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium text-sm animate-pulse ${className}`}>
      <Star className="w-4 h-4 fill-white" />
      <span>Featured Teacher</span>
    </div>
  );
}

// Top Teacher badge - alternative styling
export function TopTeacherBadge({
  rank,
  className = ''
}: {
  rank?: number;
  className?: string;
}) {
  return (
    <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white font-medium text-sm ${className}`}>
      <span className="text-lg">🏅</span>
      <span>Top Teacher{rank ? ` #${rank}` : ''}</span>
    </div>
  );
}
