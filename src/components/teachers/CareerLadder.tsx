import { Check, Lock } from 'lucide-react';
import { TEACHER_TIERS, getTierInfo } from '../../constants/teacherConstants';

interface CareerLadderProps {
  currentTier: 'newcomer' | 'apprentice' | 'skilled' | 'expert' | 'master';
  totalHours: number;
  retentionRate: number;
  variant?: 'horizontal' | 'vertical' | 'compact';
  className?: string;
}

// Define tier order and requirements
const TIER_ORDER = ['newcomer', 'apprentice', 'skilled', 'expert', 'master'] as const;

const TIER_REQUIREMENTS: Record<string, { minHours: number; minRetention: number }> = {
  newcomer: { minHours: 0, minRetention: 0 },
  apprentice: { minHours: 50, minRetention: 65 },
  skilled: { minHours: 150, minRetention: 75 },
  expert: { minHours: 250, minRetention: 80 },
  master: { minHours: 500, minRetention: 85 }
};

export default function CareerLadder({
  currentTier,
  totalHours,
  retentionRate,
  variant = 'horizontal',
  className = ''
}: CareerLadderProps) {
  const currentIndex = TIER_ORDER.indexOf(currentTier);
  const nextTier = currentIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentIndex + 1] : null;
  const nextTierInfo = nextTier ? getTierInfo(nextTier) : null;
  const nextTierReqs = nextTier ? TIER_REQUIREMENTS[nextTier] : null;

  // Calculate progress to next tier
  const calculateProgress = () => {
    if (!nextTierReqs) return { hoursProgress: 100, retentionProgress: 100, overall: 100 };

    const hoursNeeded = nextTierReqs.minHours;
    const hoursProgress = Math.min(100, (totalHours / hoursNeeded) * 100);

    const retentionNeeded = nextTierReqs.minRetention;
    const retentionProgress = Math.min(100, (retentionRate / retentionNeeded) * 100);

    // Overall is the minimum of both (you need both to advance)
    const overall = Math.min(hoursProgress, retentionProgress);

    return { hoursProgress, retentionProgress, overall };
  };

  const progress = calculateProgress();
  const hoursRemaining = nextTierReqs ? Math.max(0, nextTierReqs.minHours - totalHours) : 0;
  const retentionGap = nextTierReqs ? Math.max(0, nextTierReqs.minRetention - retentionRate) : 0;

  // Compact variant - single line for teacher cards
  if (variant === 'compact') {
    const currentTierInfo = getTierInfo(currentTier);

    if (!nextTier || !nextTierInfo) {
      return (
        <div className={`flex items-center gap-2 text-sm ${className}`}>
          <span>{currentTierInfo.icon} {currentTierInfo.name}</span>
          <span className="text-emerald-600 font-medium">🎉 Maximum tier reached!</span>
        </div>
      );
    }

    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <div className="flex items-center gap-1 text-sm">
          <span>{currentTierInfo.icon} {currentTierInfo.name}</span>
          <span className="text-gray-400">→</span>
          <span>{nextTierInfo.icon} {nextTierInfo.name}</span>
        </div>
        <div className="flex-1 flex items-center gap-2">
          <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
              style={{ width: `${progress.overall}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 whitespace-nowrap">
            {hoursRemaining > 0 ? `${Math.round(hoursRemaining)}h to go` : 'Ready!'}
          </span>
        </div>
      </div>
    );
  }

  // Vertical variant - for teacher dashboard
  if (variant === 'vertical') {
    return (
      <div className={`space-y-6 ${className}`}>
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          📈 Your Progress
        </h3>

        <div className="relative">
          {/* Vertical line */}
          <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-gray-200" />

          {/* Tier nodes */}
          <div className="space-y-6">
            {[...TIER_ORDER].reverse().map((tier, reverseIndex) => {
              const index = TIER_ORDER.length - 1 - reverseIndex;
              const tierInfo = getTierInfo(tier);
              const isPast = index < currentIndex;
              const isCurrent = tier === currentTier;
              const isFuture = index > currentIndex;
              const reqs = TIER_REQUIREMENTS[tier];

              return (
                <div key={tier} className="relative flex items-start gap-4 pl-1">
                  {/* Node */}
                  <div className={`
                    relative z-10 w-10 h-10 rounded-full flex items-center justify-center
                    ${isPast ? 'bg-emerald-500 text-white' : ''}
                    ${isCurrent ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white ring-4 ring-emerald-200' : ''}
                    ${isFuture ? 'bg-gray-100 text-gray-400 border-2 border-dashed border-gray-300' : ''}
                  `}>
                    {isPast ? (
                      <Check className="w-5 h-5" />
                    ) : isFuture ? (
                      <Lock className="w-4 h-4" />
                    ) : (
                      <span className="text-lg">{tierInfo.icon}</span>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-2">
                    <div className="flex items-center gap-2">
                      <span className={`font-semibold ${isFuture ? 'text-gray-400' : 'text-gray-900'}`}>
                        {tierInfo.icon} {tierInfo.name}
                      </span>
                      {isCurrent && (
                        <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium">
                          You are here
                        </span>
                      )}
                    </div>
                    <p className={`text-sm ${isFuture ? 'text-gray-400' : 'text-gray-600'}`}>
                      {tier === 'newcomer'
                        ? 'Starting tier'
                        : `${reqs.minHours}+ hours, ${reqs.minRetention}%+ retention`
                      }
                    </p>
                    {isPast && (
                      <p className="text-xs text-emerald-600 mt-1">✓ Achieved</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier && nextTierInfo && nextTierReqs && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-4">
            <h4 className="font-medium text-gray-900">
              Progress to {nextTierInfo.icon} {nextTierInfo.name}
            </h4>

            <div className="space-y-3">
              {/* Hours progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Hours taught</span>
                  <span className="font-medium">
                    {Math.round(totalHours)} / {nextTierReqs.minHours}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-blue-500 transition-all duration-500"
                    style={{ width: `${progress.hoursProgress}%` }}
                  />
                </div>
                {hoursRemaining > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    {Math.round(hoursRemaining)} more hours needed
                  </p>
                )}
              </div>

              {/* Retention progress */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Retention rate</span>
                  <span className="font-medium">
                    {retentionRate.toFixed(1)}% / {nextTierReqs.minRetention}%
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      retentionRate >= nextTierReqs.minRetention
                        ? 'bg-emerald-500'
                        : 'bg-amber-500'
                    }`}
                    style={{ width: `${progress.retentionProgress}%` }}
                  />
                </div>
                {retentionGap > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Need {retentionGap.toFixed(1)}% improvement
                  </p>
                )}
              </div>
            </div>

            {/* Tip */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-800">
                💡 <strong>Tip:</strong> Focus on student retention. Follow up with students who haven't booked in 2+ weeks.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Horizontal variant - default, for profile modal
  return (
    <div className={`space-y-6 ${className}`}>
      <h3 className="font-semibold text-gray-900 flex items-center gap-2">
        📈 Teaching Journey at Talbiyah
      </h3>

      {/* Horizontal tier visualization */}
      <div className="relative">
        {/* Background line */}
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200" />

        {/* Tier nodes */}
        <div className="relative flex justify-between">
          {TIER_ORDER.map((tier, index) => {
            const tierInfo = getTierInfo(tier);
            const isPast = index < currentIndex;
            const isCurrent = tier === currentTier;
            const isFuture = index > currentIndex;

            return (
              <div key={tier} className="flex flex-col items-center">
                {/* Node */}
                <div className={`
                  relative z-10 w-10 h-10 rounded-full flex items-center justify-center transition-all
                  ${isPast ? 'bg-emerald-500 text-white' : ''}
                  ${isCurrent ? 'bg-gradient-to-br from-emerald-500 to-green-500 text-white ring-4 ring-emerald-200 scale-110' : ''}
                  ${isFuture ? 'bg-white text-gray-400 border-2 border-dashed border-gray-300' : ''}
                `}>
                  {isPast ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-lg">{tierInfo.icon}</span>
                  )}
                </div>

                {/* Label */}
                <span className={`mt-2 text-xs font-medium ${
                  isCurrent ? 'text-emerald-600' : isFuture ? 'text-gray-400' : 'text-gray-600'
                }`}>
                  {tierInfo.name}
                </span>

                {/* Current indicator */}
                {isCurrent && (
                  <span className="mt-1 text-[10px] text-emerald-600 font-medium">
                    ● YOU
                  </span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress line overlay */}
        <div
          className="absolute top-5 left-0 h-0.5 bg-gradient-to-r from-emerald-500 to-emerald-400"
          style={{ width: `${(currentIndex / (TIER_ORDER.length - 1)) * 100}%` }}
        />
      </div>

      {/* Progress details */}
      {nextTier && nextTierInfo && nextTierReqs && (
        <div className="bg-gradient-to-r from-gray-50 to-emerald-50 rounded-xl p-4 border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-gray-700">
              Progress to {nextTierInfo.icon} {nextTierInfo.name}
            </span>
            <span className="text-sm font-bold text-emerald-600">
              {Math.round(progress.overall)}%
            </span>
          </div>

          <div className="h-3 bg-gray-200 rounded-full overflow-hidden mb-3">
            <div
              className="h-full bg-gradient-to-r from-emerald-500 to-green-500 transition-all duration-500"
              style={{ width: `${progress.overall}%` }}
            />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Hours: </span>
              <span className="font-medium">{Math.round(totalHours)} / {nextTierReqs.minHours}</span>
              {hoursRemaining > 0 && (
                <span className="text-gray-400 text-xs ml-1">({Math.round(hoursRemaining)} more)</span>
              )}
            </div>
            <div>
              <span className="text-gray-500">Retention: </span>
              <span className="font-medium">{retentionRate.toFixed(0)}% / {nextTierReqs.minRetention}%</span>
            </div>
          </div>
        </div>
      )}

      {/* Max tier reached message */}
      {!nextTier && (
        <div className="bg-gradient-to-r from-pink-50 to-purple-50 rounded-xl p-4 border border-pink-200 text-center">
          <span className="text-2xl">🎉</span>
          <p className="font-semibold text-gray-900 mt-1">You've reached Master tier!</p>
          <p className="text-sm text-gray-600">You're among the elite educators at Talbiyah.</p>
        </div>
      )}
    </div>
  );
}

// Compact progress bar for inline use
export function TierProgressBar({
  currentTier,
  totalHours,
  className = ''
}: {
  currentTier: string;
  totalHours: number;
  className?: string;
}) {
  const currentIndex = TIER_ORDER.indexOf(currentTier as typeof TIER_ORDER[number]);
  const nextTier = currentIndex < TIER_ORDER.length - 1 ? TIER_ORDER[currentIndex + 1] : null;
  const nextTierReqs = nextTier ? TIER_REQUIREMENTS[nextTier] : null;

  if (!nextTierReqs) return null;

  const progress = Math.min(100, (totalHours / nextTierReqs.minHours) * 100);
  const hoursRemaining = Math.max(0, nextTierReqs.minHours - totalHours);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-emerald-500 transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="text-xs text-gray-500 whitespace-nowrap">
        {hoursRemaining > 0 ? `${Math.round(hoursRemaining)}h left` : '✓'}
      </span>
    </div>
  );
}
