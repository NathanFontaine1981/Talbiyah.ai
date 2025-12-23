import { Heart, CheckCircle, Shield, RefreshCw } from 'lucide-react';
import { GENTLENESS_GUARANTEE } from '../../constants/teacherConstants';

interface GentlenessGuaranteeProps {
  variant?: 'full' | 'compact' | 'banner' | 'badge';
  className?: string;
}

export default function GentlenessGuarantee({
  variant = 'compact',
  className = ''
}: GentlenessGuaranteeProps) {
  const { title, tagline, icon, description, commitments, guarantee } = GENTLENESS_GUARANTEE;

  // Badge variant - small inline badge
  if (variant === 'badge') {
    return (
      <div
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium border border-emerald-200 ${className}`}
        title={tagline}
      >
        <span>{icon}</span>
        <span>Gentleness Guarantee</span>
        <Shield className="w-3.5 h-3.5" />
      </div>
    );
  }

  // Banner variant - horizontal full-width
  if (variant === 'banner') {
    return (
      <div className={`bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 shadow-sm border border-emerald-200">
            <span className="text-2xl">{icon}</span>
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              {title}
              <Shield className="w-4 h-4 text-emerald-500" />
            </h3>
            <p className="text-sm text-gray-600 mb-2">{tagline}</p>
            <div className="flex flex-wrap gap-2">
              {commitments.slice(0, 3).map((commitment, index) => (
                <span
                  key={index}
                  className="inline-flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full border border-emerald-200 text-emerald-700"
                >
                  <CheckCircle className="w-3 h-3" />
                  {commitment}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact variant - smaller card
  if (variant === 'compact') {
    return (
      <div className={`bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm border border-emerald-200">
            <span className="text-xl">{icon}</span>
          </div>
          <div>
            <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
              {title}
              <Shield className="w-3.5 h-3.5 text-emerald-500" />
            </h4>
            <p className="text-xs text-emerald-600">{tagline}</p>
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-3">{description}</p>
        <div className="flex items-center gap-2 text-xs text-emerald-700 bg-white/60 rounded-lg p-2">
          <RefreshCw className="w-3.5 h-3.5 flex-shrink-0" />
          <span>{guarantee}</span>
        </div>
      </div>
    );
  }

  // Full variant - detailed card with all information
  return (
    <div className={`bg-gradient-to-br from-emerald-50 via-white to-green-50 border border-emerald-200 rounded-2xl overflow-hidden shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
            <span className="text-3xl">{icon}</span>
          </div>
          <div>
            <h3 className="text-xl font-bold flex items-center gap-2">
              {title}
              <Shield className="w-5 h-5" />
            </h3>
            <p className="text-emerald-100">{tagline}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <div className="px-6 py-4">
        <p className="text-gray-700 mb-4">{description}</p>

        {/* Commitments */}
        <div className="mb-4">
          <h4 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
            <Heart className="w-4 h-4 text-emerald-500" />
            Every Talbiyah teacher commits to:
          </h4>
          <ul className="space-y-2">
            {commitments.map((commitment, index) => (
              <li key={index} className="flex items-center gap-3 text-sm">
                <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </div>
                <span className="text-gray-700">{commitment}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Guarantee */}
        <div className="bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-5 h-5 text-white" />
            </div>
            <div>
              <h5 className="font-bold text-emerald-900 mb-1">Our Promise</h5>
              <p className="text-sm text-emerald-700">{guarantee}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mini badge for teacher cards
export function GentlenessBadge({ className = '' }: { className?: string }) {
  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded-full text-xs font-medium ${className}`}
      title="Committed to patient, kind teaching"
    >
      <span className="text-xs">🤲</span>
      <span>Gentle approach</span>
    </div>
  );
}
