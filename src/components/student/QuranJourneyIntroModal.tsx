import { useState } from 'react';
import { BookOpen, Layers, TrendingUp, MessageCircle, FileText, ChevronRight, CheckCircle, X, Sparkles } from 'lucide-react';

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Sparkles,
    title: 'A different way to learn Qur’an',
    body: 'At Talbiyah we are not chasing speed of memorisation. We focus on the quality of your learning — understanding what you recite, reciting it beautifully, and then committing it to heart so it stays with you.',
  },
  {
    icon: Layers,
    title: 'Understanding → Fluency → Memorisation',
    body: 'Your teacher takes a theme — a small block of āyāt — through all three layers before moving to the next. You understand the meaning first, recite it fluently, then memorise what you already understand.',
  },
  {
    icon: TrendingUp,
    title: '“Read and ascend”',
    body: 'The Prophet ﷺ taught that the companion of the Qur’an will be told: “Read and ascend…” — rising in rank by what they carried of the Qur’an. That is why we memorise with contemplation, so that what you learn raises you, in shā’ Allāh.',
  },
  {
    icon: MessageCircle,
    title: 'Ask your teacher today',
    body: 'Begin by asking your teacher: “How will I be taught?” They will gladly explain how this method works and what makes it different from simply racing through pages.',
  },
  {
    icon: FileText,
    title: 'Your study notes come to you',
    body: 'About 10–15 minutes after each lesson ends, your personalised study notes are generated automatically — you’ll get an email when they’re ready. Visit them for at least 10 minutes a day; by your next lesson it will be firm in your mind and heart.',
  },
];

export default function QuranJourneyIntroModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState(0);
  if (!open) return null;

  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];
  const Icon = current.icon;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="relative bg-gradient-to-br from-amber-500 to-emerald-600 px-6 pt-8 pb-6 text-center">
          <button
            onClick={onClose}
            aria-label="Skip"
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-3">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {step === 0 ? 'Welcome to your Qur’an journey' : current.title}
          </h2>
          {step === 0 && (
            <p className="text-amber-50 text-sm mt-1">
              A minute on how we teach — it’s worth knowing before you begin.
            </p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-amber-50 flex-shrink-0">
              <Icon className="w-6 h-6 text-amber-600" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900 mb-1">{current.title}</h3>
              <p className="text-sm leading-6 text-gray-600">{current.body}</p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-amber-500' : 'w-1.5 bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="text-sm font-medium text-gray-400 hover:text-gray-600 transition"
          >
            Skip
          </button>
          {isLast ? (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition"
            >
              <CheckCircle className="w-5 h-5" /> I’m ready
            </button>
          ) : (
            <button
              onClick={() => setStep((s) => s + 1)}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition"
            >
              Next <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
