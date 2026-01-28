import { Check, Minus, Gift, Sparkles } from 'lucide-react';
import { PricingBadge, PricingType } from './PricingBadge';

interface Feature {
  name: string;
  free: boolean;
  freeLabel?: string;
  premium: { type: PricingType; cost: number } | null;
}

const features: Feature[] = [
  { name: 'Dua Builder (text)', free: true, freeLabel: 'Unlimited', premium: null },
  { name: 'Dua Audio Download', free: false, premium: { type: 'tokens', cost: 10 } },
  { name: 'Exploring Islam', free: true, freeLabel: '13 episodes', premium: null },
  { name: 'Foundations Course', free: true, freeLabel: 'All 6 modules', premium: null },
  { name: 'Qunut Practice', free: true, freeLabel: 'Full access', premium: null },
  { name: 'Salah Tutorial', free: true, freeLabel: 'Full guide', premium: null },
  { name: 'Progress Tracking', free: true, freeLabel: 'Full', premium: null },
  { name: 'Learning Games', free: true, freeLabel: 'All 8 types', premium: null },
  { name: 'Gamification (XP, badges)', free: true, freeLabel: 'Full', premium: null },
  { name: 'Lesson Insights (text)', free: true, freeLabel: 'Every lesson', premium: null },
  { name: 'Khutbah Creator', free: true, freeLabel: '2/month', premium: { type: 'tokens', cost: 20 } },
  { name: 'Khutbah Audio', free: false, premium: { type: 'tokens', cost: 25 } },
  { name: 'Insight Audio', free: false, premium: { type: 'tokens', cost: 15 } },
  { name: 'Insight PDF', free: false, premium: { type: 'tokens', cost: 10 } },
  { name: 'Live 1-on-1 Lessons', free: false, premium: { type: 'credits', cost: 1 } },
];

export function ComparisonTable() {
  return (
    <>
      {/* Mobile Card Layout */}
      <div className="md:hidden space-y-3 p-4">
        {features.map((feature) => (
          <div
            key={feature.name}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-100 dark:border-gray-700"
          >
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">{feature.name}</h4>
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Free</span>
                {feature.free ? (
                  <div className="flex items-center space-x-1">
                    <Check className="w-4 h-4 text-green-500" />
                    {feature.freeLabel && (
                      <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                        {feature.freeLabel}
                      </span>
                    )}
                  </div>
                ) : (
                  <Minus className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-xs text-gray-500 dark:text-gray-400 uppercase">Premium</span>
                {feature.premium ? (
                  <PricingBadge type={feature.premium.type} cost={feature.premium.cost} />
                ) : feature.free ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Minus className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full" role="table" aria-label="Feature comparison between Free and Premium tiers">
          <thead>
            <tr className="border-b-2 border-gray-200 dark:border-gray-700">
              <th scope="col" className="text-left py-4 px-4 font-semibold text-gray-900 dark:text-white">Feature</th>
              <th scope="col" className="text-center py-4 px-4 font-semibold text-green-600 dark:text-green-400">
                <div className="flex items-center justify-center space-x-2">
                  <Gift className="w-5 h-5" aria-hidden="true" />
                  <span>FREE</span>
                </div>
              </th>
              <th scope="col" className="text-center py-4 px-4 font-semibold text-violet-600 dark:text-violet-400">
                <div className="flex items-center justify-center space-x-2">
                  <Sparkles className="w-5 h-5" aria-hidden="true" />
                  <span>Premium</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {features.map((feature, index) => (
              <tr
                key={feature.name}
                className={`border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors ${
                  index % 2 === 0 ? 'bg-gray-50/50 dark:bg-gray-800/30' : ''
                }`}
              >
                <td className="py-3 px-4 text-gray-700 dark:text-gray-300 font-medium">
                  {feature.name}
                </td>
                <td className="py-3 px-4 text-center">
                  {feature.free ? (
                    <div className="flex items-center justify-center space-x-2">
                      <Check className="w-5 h-5 text-green-500" />
                      {feature.freeLabel && (
                        <span className="text-sm text-green-600 dark:text-green-400 font-medium">
                          {feature.freeLabel}
                        </span>
                      )}
                    </div>
                  ) : (
                    <Minus className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                  )}
                </td>
                <td className="py-3 px-4 text-center">
                  {feature.premium ? (
                    <PricingBadge type={feature.premium.type} cost={feature.premium.cost} />
                  ) : feature.free ? (
                    <Check className="w-5 h-5 text-green-500 mx-auto" />
                  ) : (
                    <Minus className="w-5 h-5 text-gray-300 dark:text-gray-600 mx-auto" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
