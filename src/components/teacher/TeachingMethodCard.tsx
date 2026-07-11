import { useNavigate } from 'react-router-dom';
import { Sparkles, BookOpen, Volume2, Brain, ArrowRight } from 'lucide-react';

const LAYERS = [
  {
    n: 1,
    icon: BookOpen,
    title: 'Understanding',
    arabic: 'tadabbur',
    blurb: 'Meaning first — the student learns what the passage says before anything else.',
  },
  {
    n: 2,
    icon: Volume2,
    title: 'Fluency',
    arabic: 'tilāwah',
    blurb: 'Then beautiful, correct recitation — makhārij and tajwīd until it flows.',
  },
  {
    n: 3,
    icon: Brain,
    title: 'Memorisation',
    arabic: 'ḥifẓ',
    blurb: 'Finally it’s memorised — and it lasts, because it’s understood and fluent.',
  },
];

/**
 * Prominent hero card showcasing the Talbiyah teaching method (the platform USP),
 * shown at the top of the Teacher Hub so teachers never miss it.
 */
export default function TeachingMethodCard() {
  const navigate = useNavigate();

  return (
    <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-teal-50 to-white shadow-sm p-6 sm:p-8 mb-8">
      <div className="flex items-center gap-2 mb-1">
        <Sparkles className="w-4 h-4 text-emerald-600" />
        <span className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
          How we teach at Talbiyah
        </span>
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">The Talbiyah Method</h2>
      <p className="text-gray-600 mt-1 max-w-2xl">
        Every student learns the Qur’an in <strong>three layers</strong>, in this order — taught
        <strong> theme by theme</strong>. This is what makes Talbiyah different.
      </p>

      {/* Three layers */}
      <div className="grid sm:grid-cols-3 gap-3 mt-5">
        {LAYERS.map((l, i) => {
          const Icon = l.icon;
          return (
            <div key={l.n} className="relative rounded-xl bg-white border border-emerald-100 p-4">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <Icon className="w-4 h-4 text-emerald-600" />
                </div>
                <span className="text-xs font-bold text-emerald-600">LAYER {l.n}</span>
              </div>
              <p className="font-bold text-gray-900">
                {l.title} <span className="font-normal italic text-gray-400">({l.arabic})</span>
              </p>
              <p className="text-sm text-gray-600 mt-0.5">{l.blurb}</p>
              {/* arrow between cards on desktop */}
              {i < LAYERS.length - 1 && (
                <ArrowRight className="hidden sm:block absolute -right-2.5 top-1/2 -translate-y-1/2 w-5 h-5 text-emerald-300 z-10" />
              )}
            </div>
          );
        })}
      </div>

      <p className="text-sm text-gray-600 mt-4">
        Take a <strong>theme</strong> — a block of āyāt (often the first 10–11 of a sūrah) — through
        all three layers, then move to the next theme and repeat.
      </p>

      <button
        onClick={() => navigate('/teacher/resources?open=how%20to%20teach')}
        className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors"
      >
        See the full method &amp; a worked example
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}
