import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Clock, FlaskConical, ChevronRight, CheckCircle2 } from 'lucide-react';

interface InlineEvidenceProps {
  verse: string;
  arabicVerse: string;
  verseRef: string;
  whatWasKnown: string;
  modernDiscovery: string;
  discoveredBy: string;
  yearsBefore: number;
  onVerified?: () => void;
}

type Phase = 'verse' | 'context' | 'discovery' | 'complete';

export default function InlineEvidence({
  verse,
  arabicVerse,
  verseRef,
  whatWasKnown,
  modernDiscovery,
  discoveredBy,
  yearsBefore,
  onVerified,
}: InlineEvidenceProps) {
  const [phase, setPhase] = useState<Phase>('verse');
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  const advance = useCallback(() => {
    if (phase === 'verse') setPhase('context');
    else if (phase === 'context') setPhase('discovery');
    else if (phase === 'discovery') {
      setPhase('complete');
      onVerified?.();
    }
  }, [phase, onVerified]);

  // Keyboard support
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (phase === 'complete') return;
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        advance();
      }
    };

    const el = containerRef.current;
    if (el) {
      el.addEventListener('keydown', handleKeyDown);
      return () => el.removeEventListener('keydown', handleKeyDown);
    }
  }, [advance, phase]);

  // Touch swipe support
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null || phase === 'complete') return;
    const deltaX = e.changedTouches[0].clientX - touchStartX.current;
    // Swipe left to advance (threshold 50px)
    if (deltaX < -50) {
      advance();
    }
    touchStartX.current = null;
  };

  return (
    <div
      ref={containerRef}
      tabIndex={0}
      role="region"
      aria-label={`Evidence: ${verseRef}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="w-full max-w-2xl mx-auto space-y-4 outline-none focus:ring-2 focus:ring-emerald-500/30 rounded-2xl"
    >
      {/* The Verse — always visible */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/60 rounded-2xl p-5 border border-amber-700/30"
      >
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-amber-400" />
          <span className="text-amber-400 text-xs font-semibold uppercase tracking-wide">The Verse</span>
        </div>
        <p className="text-xl text-center font-arabic text-amber-100 leading-loose mb-3" dir="rtl">
          {arabicVerse}
        </p>
        <p className="text-slate-200 text-center italic leading-relaxed">
          "{verse}"
        </p>
        <p className="text-slate-500 text-center text-sm mt-2">
          — {verseRef}
        </p>
      </motion.div>

      {/* The Context — revealed on second tap */}
      <AnimatePresence>
        {(phase === 'context' || phase === 'discovery' || phase === 'complete') && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-slate-800/60 rounded-2xl p-5 border border-blue-700/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-blue-400" />
              <span className="text-blue-400 text-xs font-semibold uppercase tracking-wide">7th Century Context</span>
            </div>
            <p className="text-slate-300 leading-relaxed">
              {whatWasKnown}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The Discovery — revealed on third tap */}
      <AnimatePresence>
        {(phase === 'discovery' || phase === 'complete') && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
            className="bg-slate-800/60 rounded-2xl p-5 border border-emerald-700/30"
          >
            <div className="flex items-center gap-2 mb-3">
              <FlaskConical className="w-4 h-4 text-emerald-400" />
              <span className="text-emerald-400 text-xs font-semibold uppercase tracking-wide">Modern Science Confirms</span>
            </div>
            <p className="text-slate-200 leading-relaxed mb-3">
              {modernDiscovery}
            </p>
            <div className="flex items-center justify-between bg-slate-900/60 rounded-xl px-4 py-3">
              <div>
                <p className="text-slate-400 text-xs">Discovered by</p>
                <p className="text-white font-medium text-sm">{discoveredBy}</p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">Quran was first</p>
                <p className="text-emerald-400 font-bold text-lg">{yearsBefore}+ years</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Verify button */}
      {phase !== 'complete' && (
        <motion.button
          key={phase}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={advance}
          className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-all"
        >
          {phase === 'verse' && (
            <>What did people know back then? <ChevronRight className="w-4 h-4" /></>
          )}
          {phase === 'context' && (
            <>What does modern science say? <FlaskConical className="w-4 h-4" /></>
          )}
          {phase === 'discovery' && (
            <>Verified <CheckCircle2 className="w-4 h-4" /></>
          )}
        </motion.button>
      )}

      {/* Verified badge */}
      {phase === 'complete' && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex items-center justify-center gap-2 py-3 bg-emerald-900/30 border border-emerald-700/30 rounded-xl"
        >
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="text-emerald-300 font-medium">Claim Verified</span>
        </motion.div>
      )}

      {/* Mobile swipe hint — only on first phase */}
      {phase === 'verse' && (
        <p className="text-center text-slate-600 text-xs md:hidden">
          Swipe left or tap the button to reveal
        </p>
      )}
    </div>
  );
}
