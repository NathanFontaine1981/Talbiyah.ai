import { Link } from 'react-router-dom';
import { Gift, Star } from 'lucide-react';

// Episode Card (for Exploring Islam)
export function EpisodeCard({ number, title, description }: { number: number; title: string; description: string }) {
  return (
    <div className="bg-teal-50 dark:bg-teal-900/30 rounded-xl p-3 text-center hover:bg-teal-100 dark:hover:bg-teal-900/50 transition">
      <div className="w-8 h-8 bg-teal-500 text-white rounded-full flex items-center justify-center mx-auto mb-2 font-bold text-sm">
        {number}
      </div>
      <h4 className="font-semibold text-gray-900 dark:text-white text-xs mb-0.5">{title}</h4>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// Mini Pillar Card
export function PillarMini({ title, icon }: { title: string; icon: string }) {
  return (
    <div className="bg-amber-100 dark:bg-amber-900/30 rounded-lg p-2 text-center">
      <div className="text-xl mb-1">{icon}</div>
      <div className="text-xs font-medium text-gray-700 dark:text-gray-300">{title}</div>
    </div>
  );
}

// Game Type Card
export function GameTypeCard({ icon, title, description, color, badge }: { icon: string; title: string; description: string; color: string; badge?: string }) {
  const colorClasses: Record<string, string> = {
    pink: 'bg-pink-50 dark:bg-pink-900/20 border-pink-200 dark:border-pink-800',
    purple: 'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800',
    indigo: 'bg-indigo-50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-800',
    blue: 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800',
    teal: 'bg-teal-50 dark:bg-teal-900/20 border-teal-200 dark:border-teal-800',
    emerald: 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800',
  };

  return (
    <div className={`${colorClasses[color]} border rounded-2xl p-6 text-center hover:shadow-lg transition-all cursor-pointer group relative`}>
      {badge && (
        <span className="absolute -top-2 -right-2 px-2 py-1 bg-gradient-to-r from-pink-500 to-purple-500 text-white text-xs font-bold rounded-full shadow-lg">
          {badge}
        </span>
      )}
      <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">{icon}</div>
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// Gamification Card
export function GamificationCard({ icon, title, description, color, emoji }: { icon: React.ComponentType<{ className?: string }> | string; title: string; description: string; color: string; emoji?: boolean }) {
  const colorClasses: Record<string, string> = {
    yellow: 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800 text-yellow-600 dark:text-yellow-400',
    orange: 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800 text-orange-600 dark:text-orange-400',
    red: 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400',
    amber: 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400',
  };

  const Icon = icon as React.ComponentType<{ className?: string }>;

  return (
    <div className={`${colorClasses[color]} border rounded-2xl p-6 text-center hover:shadow-lg transition-all`}>
      {emoji ? (
        <div className="text-4xl mb-3">{icon as string}</div>
      ) : (
        <Icon className="w-10 h-10 mx-auto mb-3" />
      )}
      <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{title}</h3>
      <p className="text-xs text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}

// CTA Banner
export function CTABanner() {
  return (
    <div className="bg-gradient-to-r from-emerald-500 to-teal-600 py-8 px-4">
      <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-center sm:text-left">
          <p className="text-white text-lg font-medium">
            Ready to start learning? Most features are completely FREE.
          </p>
          <p className="text-emerald-100 text-sm">No credit card required to get started.</p>
        </div>
        <Link
          to="/signup"
          className="px-6 py-3 bg-white text-emerald-700 rounded-full font-semibold hover:bg-gray-100 transition whitespace-nowrap flex items-center space-x-2"
        >
          <Gift className="w-4 h-4" />
          <span>Sign Up</span>
        </Link>
      </div>
    </div>
  );
}

// Teacher Preview Card
export function TeacherPreviewCard({
  initials,
  name,
  specialty,
  rating,
  lessons,
  tier
}: {
  initials: string;
  name: string;
  specialty: string;
  rating: number;
  lessons: number;
  tier: 'Standard' | 'Elite';
}) {
  const tierColors = tier === 'Elite'
    ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400';

  return (
    <div className="flex-shrink-0 w-48 bg-white dark:bg-gray-800 rounded-2xl p-4 border border-emerald-200 dark:border-emerald-800 shadow-md hover:shadow-lg transition-all">
      <div className="flex flex-col items-center">
        <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full flex items-center justify-center text-white text-xl font-bold mb-3">
          {initials}
        </div>
        <h5 className="font-semibold text-gray-900 dark:text-white text-sm text-center">{name}</h5>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-2">{specialty}</p>
        <div className="flex items-center space-x-1 mb-2">
          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
          <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{rating}</span>
          <span className="text-xs text-gray-400">({lessons})</span>
        </div>
        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${tierColors}`}>
          {tier}
        </span>
      </div>
    </div>
  );
}
