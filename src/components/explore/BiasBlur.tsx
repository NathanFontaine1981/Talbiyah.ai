import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  Scale,
  Lightbulb,
  BookOpen,
  Search,
  ChevronRight,
  Church,
  Moon,
  HelpCircle,
} from 'lucide-react';

interface BiasBlurProps {
  onComplete: () => void;
  onBack?: () => void;
}

type Phase =
  | 'background'
  | 'turning-point'
  | 'possibilities'
  | 'struggle'
  | 'lightbulb'
  | 'method'
  | 'ask';

const PHASES: Phase[] = [
  'background',
  'turning-point',
  'possibilities',
  'struggle',
  'lightbulb',
  'method',
  'ask',
];

export const BiasBlur = ({ onComplete, onBack }: BiasBlurProps) => {
  const [phase, setPhase] = useState<Phase>('background');
  const [scaleAngle, setScaleAngle] = useState(0);

  const phaseIndex = PHASES.indexOf(phase);
  const isLastPhase = phaseIndex === PHASES.length - 1;

  const advance = () => {
    if (isLastPhase) {
      onComplete();
    } else {
      setPhase(PHASES[phaseIndex + 1]);
    }
  };

  const goBack = () => {
    if (phaseIndex > 0) {
      setPhase(PHASES[phaseIndex - 1]);
    } else {
      onBack?.();
    }
  };

  // Animate the swaying scale on the struggle phase
  useEffect(() => {
    if (phase !== 'struggle') return;
    let frame = 0;
    const interval = setInterval(() => {
      frame++;
      // Sway: right, left, right, left, then settle at center
      if (frame <= 8) {
        setScaleAngle(Math.sin(frame * 0.8) * (20 - frame * 2));
      } else {
        setScaleAngle(0);
      }
    }, 400);
    return () => clearInterval(interval);
  }, [phase]);

  const fadeUp = {
    initial: { opacity: 0, y: 25 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, y: -15 },
    transition: { duration: 0.45, ease: 'easeOut' },
  };

  const stagger = (delay: number) => ({
    initial: { opacity: 0, y: 15 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, delay, ease: 'easeOut' },
  });

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col relative">
      {/* Back button */}
      <button
        onClick={goBack}
        className="fixed top-20 md:top-4 left-6 flex items-center gap-1 text-slate-400 hover:text-white transition z-40"
      >
        <ArrowLeft className="w-4 h-4" />
        <span className="text-sm">Back</span>
      </button>

      {/* Phase dots */}
      <div className="fixed top-20 md:top-4 right-6 flex items-center gap-1.5 z-40">
        {PHASES.map((p, i) => (
          <div
            key={p}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              i === phaseIndex
                ? 'w-6 bg-amber-400'
                : i < phaseIndex
                ? 'w-1.5 bg-amber-600'
                : 'w-1.5 bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-4 pt-24 md:pt-16 pb-32">
        <div className="max-w-lg w-full">
          <AnimatePresence mode="wait">
            {/* === Phase 1: Background === */}
            {phase === 'background' && (
              <motion.div key="background" {...fadeUp} className="space-y-6">
                <div className="text-center mb-2">
                  <motion.div
                    {...stagger(0.1)}
                    className="w-20 h-20 bg-amber-500/15 rounded-full flex items-center justify-center mx-auto mb-5"
                  >
                    <Scale className="w-10 h-10 text-amber-400" />
                  </motion.div>
                  <motion.h2 {...stagger(0.2)} className="text-3xl font-serif text-white">
                    Where I Started
                  </motion.h2>
                </div>

                <motion.div {...stagger(0.4)} className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700">
                  <p className="text-slate-300 leading-relaxed text-lg">
                    I was raised with <span className="text-white font-medium">Christian values</span>.
                  </p>
                  <p className="text-slate-400 leading-relaxed mt-3">
                    Saturday school. Sunday school. The <span className="text-white font-medium">70th London Boys' Brigade</span> in Tooting, London. I learned good manners, respect, and values I still hold today.
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* === Phase 2: Turning Point === */}
            {phase === 'turning-point' && (
              <motion.div key="turning-point" {...fadeUp} className="space-y-6">
                <motion.div {...stagger(0.1)} className="text-center">
                  <p className="text-amber-400 text-sm font-semibold uppercase tracking-wider mb-2">Age 23</p>
                  <h2 className="text-2xl font-serif text-white">The Turning Point</h2>
                </motion.div>

                <motion.div {...stagger(0.3)} className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700">
                  <p className="text-slate-300 leading-relaxed text-lg">
                    I discovered that some of my beliefs actually <span className="text-amber-400 font-medium">aligned with Islam</span> — and <span className="text-amber-400 font-medium">contradicted</span> my own religion.
                  </p>
                  <p className="text-slate-400 leading-relaxed mt-3">
                    This prompted me to research both.
                  </p>
                </motion.div>

                <motion.div
                  {...stagger(0.5)}
                  className="bg-slate-900/80 rounded-2xl p-6 border-l-4 border-amber-500"
                >
                  <p className="text-white text-xl leading-relaxed font-medium italic">
                    "I'm an adult now. I can surely work out for myself whether these books were really man-made — invented to control the masses — or genuinely from the Creator."
                  </p>
                  <p className="text-slate-400 mt-3 leading-relaxed">
                    It should become clear if I do enough analysis.
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* === Phase 3: The Possibilities === */}
            {phase === 'possibilities' && (
              <motion.div key="possibilities" {...fadeUp} className="space-y-6">
                <motion.div {...stagger(0.1)} className="text-center">
                  <h2 className="text-2xl font-serif text-white mb-2">The Possibilities</h2>
                  <p className="text-slate-400">When I looked at it, it came down to three outcomes:</p>
                </motion.div>

                <div className="space-y-3">
                  {[
                    { icon: <Moon className="w-5 h-5" />, label: 'Islam is correct', color: 'emerald', delay: 0.3 },
                    { icon: <Church className="w-5 h-5" />, label: 'Christianity is correct', color: 'blue', delay: 0.5 },
                    { icon: <HelpCircle className="w-5 h-5" />, label: 'Both are incorrect — and the search goes on', color: 'slate', delay: 0.7 },
                  ].map(option => (
                    <motion.div
                      key={option.label}
                      {...stagger(option.delay)}
                      className={`rounded-2xl p-5 border flex items-center gap-4 ${
                        option.color === 'emerald'
                          ? 'bg-emerald-900/20 border-emerald-700/40'
                          : option.color === 'blue'
                          ? 'bg-blue-900/20 border-blue-700/40'
                          : 'bg-slate-800/40 border-slate-700/40'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          option.color === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : option.color === 'blue'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-slate-700 text-slate-400'
                        }`}
                      >
                        {option.icon}
                      </div>
                      <p className="text-white font-medium text-lg">{option.label}</p>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* === Phase 4: The Struggle === */}
            {phase === 'struggle' && (
              <motion.div key="struggle" {...fadeUp} className="space-y-6">
                <motion.div {...stagger(0.1)} className="text-center">
                  <h2 className="text-2xl font-serif text-white mb-2">Back and Forth</h2>
                </motion.div>

                {/* Animated swaying scale */}
                <motion.div {...stagger(0.2)} className="flex justify-center py-4">
                  <div className="relative w-48 h-32">
                    {/* Fulcrum */}
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-4 bg-amber-500 rotate-45" />
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-1 h-12 bg-slate-600" />

                    {/* Beam */}
                    <motion.div
                      className="absolute top-4 left-0 right-0 flex items-center justify-between px-2"
                      style={{ originX: 0.5, originY: 0.5 }}
                      animate={{ rotate: scaleAngle }}
                      transition={{ duration: 0.35, ease: 'easeInOut' }}
                    >
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-14 h-14 rounded-xl bg-emerald-900/40 border border-emerald-700/50 flex items-center justify-center">
                          <Moon className="w-6 h-6 text-emerald-400" />
                        </div>
                      </div>
                      <div className="flex-1 h-0.5 bg-slate-600 mx-2" />
                      <div className="flex flex-col items-center gap-1">
                        <div className="w-14 h-14 rounded-xl bg-blue-900/40 border border-blue-700/50 flex items-center justify-center">
                          <Church className="w-6 h-6 text-blue-400" />
                        </div>
                      </div>
                    </motion.div>
                  </div>
                </motion.div>

                <motion.div {...stagger(0.4)} className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700">
                  <p className="text-slate-300 leading-relaxed text-lg mb-3">
                    I'd read about one and <span className="text-amber-400 font-medium">sway that way</span>. Then read about the other and <span className="text-amber-400 font-medium">sway back</span>.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    I couldn't reach anything conclusive. Not this way.
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* === Phase 5: The Lightbulb === */}
            {phase === 'lightbulb' && (
              <motion.div key="lightbulb" {...fadeUp} className="space-y-6">
                <motion.div {...stagger(0.1)} className="text-center">
                  <motion.div
                    initial={{ opacity: 0, scale: 0.5 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-20 h-20 bg-amber-400/20 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_40px_rgba(251,191,36,0.2)]"
                  >
                    <Lightbulb className="w-10 h-10 text-amber-400" />
                  </motion.div>
                  <h2 className="text-2xl font-serif text-white">The Lightbulb Moment</h2>
                </motion.div>

                <motion.div
                  {...stagger(0.4)}
                  className="bg-amber-900/25 rounded-2xl p-6 border border-amber-700/40"
                >
                  <p className="text-white text-xl leading-relaxed font-medium text-center mb-4">
                    Go to the sources.
                  </p>
                  <p className="text-slate-300 leading-relaxed text-center">
                    The <span className="text-white font-medium">Quran</span> and the <span className="text-white font-medium">Bible</span>. Where did they actually come from? Are they preserved?
                  </p>
                </motion.div>

                <motion.div {...stagger(0.6)} className="bg-slate-800/60 rounded-2xl p-6 border border-slate-700">
                  <p className="text-slate-300 leading-relaxed text-lg">
                    Once I can establish the <span className="text-amber-400 font-medium">authenticity</span> of the source, <em>then</em> I can start looking into the content.
                  </p>
                </motion.div>
              </motion.div>
            )}

            {/* === Phase 6: The Method === */}
            {phase === 'method' && (
              <motion.div key="method" {...fadeUp} className="space-y-6">
                <motion.div {...stagger(0.1)} className="text-center">
                  <h2 className="text-2xl font-serif text-white mb-2">The Method</h2>
                  <p className="text-slate-400">What I found was eye-opening — very surprising, actually.</p>
                </motion.div>

                {/* Three source pillars */}
                <div className="space-y-3">
                  {[
                    {
                      icon: <Church className="w-5 h-5" />,
                      label: 'Christian Sources',
                      detail: 'What do Christian scholars say about the Bible?',
                      color: 'blue',
                      delay: 0.3,
                    },
                    {
                      icon: <BookOpen className="w-5 h-5" />,
                      label: 'Islamic Sources',
                      detail: 'What do Islamic scholars say about the Quran?',
                      color: 'emerald',
                      delay: 0.5,
                    },
                    {
                      icon: <Search className="w-5 h-5" />,
                      label: 'Independent Sources',
                      detail: 'What do neutral historians and academics say?',
                      color: 'amber',
                      delay: 0.7,
                    },
                  ].map(source => (
                    <motion.div
                      key={source.label}
                      {...stagger(source.delay)}
                      className={`rounded-2xl p-5 border flex items-start gap-4 ${
                        source.color === 'blue'
                          ? 'bg-blue-900/20 border-blue-700/40'
                          : source.color === 'emerald'
                          ? 'bg-emerald-900/20 border-emerald-700/40'
                          : 'bg-amber-900/20 border-amber-700/40'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                          source.color === 'blue'
                            ? 'bg-blue-500/20 text-blue-400'
                            : source.color === 'emerald'
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-amber-500/20 text-amber-400'
                        }`}
                      >
                        {source.icon}
                      </div>
                      <div>
                        <p className="text-white font-medium text-lg">{source.label}</p>
                        <p className="text-slate-400 text-sm mt-1">{source.detail}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <motion.p {...stagger(0.9)} className="text-slate-400 text-center leading-relaxed">
                  Gather the evidence — and see what conclusion I could come to.
                </motion.p>
              </motion.div>
            )}

            {/* === Phase 7: The Ask === */}
            {phase === 'ask' && (
              <motion.div key="ask" {...fadeUp} className="space-y-6">
                <motion.div {...stagger(0.1)} className="text-center">
                  <h2 className="text-2xl font-serif text-white">Before We Begin</h2>
                </motion.div>

                <motion.div
                  {...stagger(0.3)}
                  className="bg-amber-900/25 rounded-2xl p-8 border border-amber-700/40 text-center"
                >
                  <p className="text-amber-200 text-xl leading-relaxed mb-5">
                    I'm not asking you to believe anything yet.
                  </p>
                  <p className="text-slate-300 leading-relaxed text-lg">
                    I'm asking you to <span className="text-white font-medium">temporarily set aside what you've been told</span> — just as I had to — and examine the evidence honestly.
                  </p>
                  <div className="flex items-center justify-center gap-6 mt-6 text-sm">
                    <span className="text-slate-500">Not blind acceptance.</span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-500">Not stubborn rejection.</span>
                  </div>
                  <p className="text-white font-semibold text-lg mt-4">
                    Just honest consideration.
                  </p>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Bottom continue bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 pb-6 bg-gradient-to-t from-slate-950 via-slate-950/95 to-transparent">
        <div className="max-w-lg mx-auto">
          <motion.button
            key={phase}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isLastPhase ? 0.6 : 0.8 }}
            onClick={advance}
            className={`w-full py-4 rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 ${
              isLastPhase
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
            }`}
          >
            {isLastPhase ? (
              <>
                Present the Evidence
                <ArrowRight className="w-5 h-5" />
              </>
            ) : (
              <>
                Continue
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
};

export default BiasBlur;
