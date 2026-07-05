import { useState } from 'react';
import { Video, Mic, BookOpen, MessageCircle, Hand, Heart, ChevronRight, CheckCircle, X } from 'lucide-react';

interface Step {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    icon: Video,
    title: 'It’s a live video lesson',
    body: 'You and your teacher meet face-to-face over video. Allow your camera and microphone when your browser asks, so your teacher can see and hear your recitation.',
  },
  {
    icon: BookOpen,
    title: 'Follow along with the materials',
    body: 'Your teacher can share the muṣḥaf, notes, or PDFs on screen. You’ll see them in the lesson — just follow where your teacher points.',
  },
  {
    icon: Mic,
    title: 'You’ll recite, they’ll guide you',
    body: 'Your teacher will model the recitation, then listen as you repeat. They’ll gently correct your pronunciation (makhārij) and tajwīd — mistakes are part of learning!',
  },
  {
    icon: MessageCircle,
    title: 'Ask anything',
    body: 'Use the chat or just speak up if you don’t understand something. There’s also a homework task at the end to practise before next time.',
  },
  {
    icon: Hand,
    title: 'A little etiquette (adab)',
    body: 'Find a quiet, clean space, be on time, and begin with the intention to learn the Book of Allah. Your teacher will begin with Bismillāh.',
  },
];

export default function StudentLessonIntroModal({
  open,
  onClose,
  teacherName,
}: {
  open: boolean;
  onClose: () => void;
  teacherName?: string | null;
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
        <div className="relative bg-gradient-to-br from-emerald-500 to-teal-600 px-6 pt-8 pb-6 text-center">
          <button
            onClick={onClose}
            aria-label="Skip"
            className="absolute top-4 right-4 p-1.5 rounded-full text-white/80 hover:text-white hover:bg-white/20 transition"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/20 mb-3">
            <Heart className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {step === 0 ? 'Welcome to your lesson!' : current.title}
          </h2>
          {step === 0 && (
            <p className="text-emerald-50 text-sm mt-1">
              Here’s how your{teacherName ? ` lesson with ${teacherName}` : ' lesson'} will work.
            </p>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-6">
          <div className="flex items-start gap-4">
            <div className="p-3 rounded-xl bg-emerald-50 flex-shrink-0">
              <Icon className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="min-w-0">
              {step !== 0 && <h3 className="font-semibold text-gray-900 mb-1">{current.title}</h3>}
              {step === 0 && <h3 className="font-semibold text-gray-900 mb-1">{current.title}</h3>}
              <p className="text-sm leading-6 text-gray-600">{current.body}</p>
            </div>
          </div>

          {/* Dots */}
          <div className="flex items-center justify-center gap-1.5 mt-6">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === step ? 'w-6 bg-emerald-500' : 'w-1.5 bg-gray-200'
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
