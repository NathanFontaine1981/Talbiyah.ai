import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { PricingBadge, PricingType } from './PricingBadge';

const colorClasses: Record<string, { bg: string; icon: string; border: string }> = {
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: 'text-purple-600 dark:text-purple-400', border: 'border-purple-200 dark:border-purple-800' },
  indigo: { bg: 'bg-indigo-50 dark:bg-indigo-900/20', icon: 'text-indigo-600 dark:text-indigo-400', border: 'border-indigo-200 dark:border-indigo-800' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', icon: 'text-pink-600 dark:text-pink-400', border: 'border-pink-200 dark:border-pink-800' },
  violet: { bg: 'bg-violet-50 dark:bg-violet-900/20', icon: 'text-violet-600 dark:text-violet-400', border: 'border-violet-200 dark:border-violet-800' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/20', icon: 'text-emerald-600 dark:text-emerald-400', border: 'border-emerald-200 dark:border-emerald-800' },
  teal: { bg: 'bg-teal-50 dark:bg-teal-900/20', icon: 'text-teal-600 dark:text-teal-400', border: 'border-teal-200 dark:border-teal-800' },
  cyan: { bg: 'bg-cyan-50 dark:bg-cyan-900/20', icon: 'text-cyan-600 dark:text-cyan-400', border: 'border-cyan-200 dark:border-cyan-800' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: 'text-blue-600 dark:text-blue-400', border: 'border-blue-200 dark:border-blue-800' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: 'text-amber-600 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-800' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', icon: 'text-orange-600 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-800' },
  rose: { bg: 'bg-rose-50 dark:bg-rose-900/20', icon: 'text-rose-600 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-800' },
  fuchsia: { bg: 'bg-fuchsia-50 dark:bg-fuchsia-900/20', icon: 'text-fuchsia-600 dark:text-fuchsia-400', border: 'border-fuchsia-200 dark:border-fuchsia-800' },
  slate: { bg: 'bg-slate-50 dark:bg-slate-800/50', icon: 'text-slate-600 dark:text-slate-400', border: 'border-slate-200 dark:border-slate-700' },
  gray: { bg: 'bg-gray-50 dark:bg-gray-800/50', icon: 'text-gray-600 dark:text-gray-400', border: 'border-gray-200 dark:border-gray-700' },
  zinc: { bg: 'bg-zinc-50 dark:bg-zinc-800/50', icon: 'text-zinc-600 dark:text-zinc-400', border: 'border-zinc-200 dark:border-zinc-700' },
  neutral: { bg: 'bg-neutral-50 dark:bg-neutral-800/50', icon: 'text-neutral-600 dark:text-neutral-400', border: 'border-neutral-200 dark:border-neutral-700' },
};

interface FeatureCardProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  link?: string;
  compact?: boolean;
}

export function FeatureCard({ icon: Icon, title, description, color, link, compact }: FeatureCardProps) {
  const colors = colorClasses[color] || colorClasses.emerald;

  const content = (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl ${compact ? 'p-4' : 'p-6'} hover:shadow-lg transition-all group`}>
      <div className={`${compact ? 'w-10 h-10 mb-3' : 'w-12 h-12 mb-4'} ${colors.bg} rounded-xl flex items-center justify-center`}>
        <Icon className={`${compact ? 'w-5 h-5' : 'w-6 h-6'} ${colors.icon}`} />
      </div>
      <h3 className={`${compact ? 'text-base' : 'text-lg'} font-semibold text-gray-900 dark:text-white mb-2`}>{title}</h3>
      <p className={`${compact ? 'text-xs' : 'text-sm'} text-gray-600 dark:text-gray-400`}>{description}</p>
      {link && (
        <div className="mt-3 flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700">
          <span>Try it</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );

  return link ? <Link to={link}>{content}</Link> : content;
}

interface FeatureCardWithPricingProps {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  description: string;
  color: string;
  link?: string;
  pricing: Array<{ label: string; type: PricingType; cost?: number }>;
}

export function FeatureCardWithPricing({
  icon: Icon,
  title,
  description,
  color,
  link,
  pricing
}: FeatureCardWithPricingProps) {
  const colors = colorClasses[color] || colorClasses.emerald;

  const content = (
    <div className={`${colors.bg} border ${colors.border} rounded-2xl p-6 hover:shadow-lg transition-all group h-full flex flex-col`}>
      <div className={`w-12 h-12 ${colors.bg} rounded-xl flex items-center justify-center mb-4`}>
        <Icon className={`w-6 h-6 ${colors.icon}`} />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 flex-grow">{description}</p>

      {/* Pricing badges */}
      <div className="space-y-2 pt-2 border-t border-gray-200 dark:border-gray-700">
        {pricing.map((item, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span className="text-gray-600 dark:text-gray-400">{item.label}</span>
            <PricingBadge type={item.type} cost={item.cost} />
          </div>
        ))}
      </div>

      {link && (
        <div className="mt-4 flex items-center text-sm font-medium text-emerald-600 dark:text-emerald-400 group-hover:text-emerald-700">
          <span>Try it</span>
          <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
        </div>
      )}
    </div>
  );

  return link ? <Link to={link} className="block h-full">{content}</Link> : content;
}
