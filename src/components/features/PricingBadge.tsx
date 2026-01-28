import { Check, Coins } from 'lucide-react';

export type PricingType = 'free' | 'limited-free' | 'tokens' | 'credits';

interface PricingBadgeProps {
  type: PricingType;
  cost?: number;
  label?: string;
}

export function PricingBadge({ type, cost, label }: PricingBadgeProps) {
  const styles = {
    free: 'bg-green-500 text-white',
    'limited-free': 'bg-blue-500 text-white',
    tokens: 'bg-violet-500 text-white',
    credits: 'bg-emerald-600 text-white',
  };

  const getText = () => {
    if (label) return label;
    switch (type) {
      case 'free': return 'FREE';
      case 'limited-free': return cost ? `${cost} FREE/month` : 'Limited FREE';
      case 'tokens': return cost ? `${cost} tokens` : 'Tokens';
      case 'credits': return cost ? `${cost} credit` : 'Credits';
    }
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[type]}`}>
      {type === 'free' && <Check className="w-3 h-3 mr-1" />}
      {type === 'tokens' && <Coins className="w-3 h-3 mr-1" />}
      {getText()}
    </span>
  );
}
