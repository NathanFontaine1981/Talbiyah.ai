import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, MessageCircle, Scale, Gavel, CheckCircle2, Search, Sparkles, BookOpen } from 'lucide-react';

interface ProbabilityMomentProps {
  verifiedCount: number;
  onComplete: () => void;
  onConvinced?: () => void; // Fast track for convinced users
  onBack?: () => void;
}

// Secondary miracles to show if they want more evidence
const secondaryMiracles = [
  {
    id: 'word-symmetry',
    title: 'Word Count Symmetry',
    category: 'Linguistic',
    icon: <BookOpen className="w-5 h-5" />,
    description: '"Day" (yawm) appears 365 times. "Month" (shahr) appears 12 times. "Man" and "Woman" each appear 23 times (chromosomes). Mathematical precision in a book revealed over 23 years.',
    verse: 'Throughout',
  },
  {
    id: 'iron-sent-down',
    title: 'Iron Sent Down',
    category: 'Scientific',
    icon: <Sparkles className="w-5 h-5" />,
    description: 'The Quran says iron was "sent down" (57:25). Scientists confirm iron came from space—meteorites and supernova explosions. The word "sent down" is scientifically accurate.',
    verse: '57:25',
  },
];

export const ProbabilityMoment = ({ verifiedCount, onComplete, onConvinced, onBack }: ProbabilityMomentProps) => {
  const [stage, setStage] = useState<'counting' | 'pause' | 'nathan' | 'checkpoint' | 'more-evidence'>('counting');
  const [expandedMiracle, setExpandedMiracle] = useState<string | null>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [canContinue, setCanContinue] = useState(false);

  // Calculate probability stages based on verified count
  // Each verified fact has roughly a 1 in 10 chance of being correct by coincidence
  // (being generous - most scientific facts would be 1 in 100 or less)
  // Cumulative probability = (1/10)^n
  const probabilitySteps: { count: number; probability: number; label: string; explanation: string }[] = [];

  for (let i = 0; i < Math.min(verifiedCount, 20); i++) {
    // Calculate 1 in 10^(i+1) - each fact multiplies by 10
    const oneIn = Math.pow(10, i + 1);
    const prob = 100 / oneIn; // As a percentage

    // Convert to human-readable format
    let label: string;
    let explanation: string;

    if (oneIn >= 1000000000) {
      label = `1 in ${(oneIn / 1000000000).toFixed(0)} billion`;
      explanation = `Virtually impossible by chance`;
    } else if (oneIn >= 1000000) {
      label = `1 in ${(oneIn / 1000000).toFixed(0)} million`;
      explanation = `Virtually impossible by chance`;
    } else if (oneIn >= 1000) {
      label = `1 in ${(oneIn / 1000).toFixed(0)},000`;
      explanation = `Extremely unlikely by chance`;
    } else if (oneIn >= 100) {
      label = `1 in ${oneIn}`;
      explanation = `Very unlikely by chance`;
    } else {
      label = `1 in ${oneIn}`;
      explanation = `${oneIn} in ${oneIn * 10} chance`;
    }

    probabilitySteps.push({
      count: i + 1,
      probability: prob,
      label,
      explanation,
    });
  }

  // Auto-advance through counting steps (but stop at the end)
  useEffect(() => {
    if (stage === 'counting' && currentStep < probabilitySteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 300); // 300ms per step
      return () => clearTimeout(timer);
    }
    // No auto-advance to pause - user must click button
  }, [stage, currentStep, probabilitySteps.length]);

  const countingComplete = stage === 'counting' && currentStep >= probabilitySteps.length;

  // Allow continue immediately when reaching Nathan's message
  useEffect(() => {
    if (stage === 'nathan') {
      setCanContinue(true);
    }
  }, [stage]);

  const currentProb = probabilitySteps[currentStep - 1];
  const finalProb = probabilitySteps[probabilitySteps.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative"
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-20 md:top-4 left-6 flex items-center gap-1 text-slate-400 hover:text-white transition z-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      )}

      <div className="max-w-xl w-full text-center">
        <AnimatePresence mode="wait">
          {/* Stage 1: Counting animation */}
          {stage === 'counting' && (
            <motion.div
              key="counting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Scale className="w-10 h-10 text-amber-400" />
              </div>

              <h2 className="text-2xl font-serif text-white mb-2">
                Weighing the Evidence
              </h2>
              <p className="text-slate-400 mb-8">
                With each sustained testimony, reasonable doubt diminishes...
              </p>

              {/* Probability display */}
              <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-6">
                <p className="text-slate-400 text-sm mb-2">Chance of coincidence:</p>
                <motion.div
                  key={currentStep}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-5xl sm:text-6xl font-bold text-blue-400 mb-2"
                >
                  {currentProb ? currentProb.label : '50%'}
                </motion.div>
                <p className="text-slate-500 text-xs mb-4">
                  {currentProb?.explanation || '50 in 100'}
                </p>

                {/* Progress bar */}
                <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden mb-4">
                  <motion.div
                    className="h-full bg-gradient-to-r from-blue-500 to-emerald-500"
                    animate={{
                      width: `${100 - (currentStep / probabilitySteps.length) * 100}%`,
                    }}
                    transition={{ duration: 0.3 }}
                  />
                </div>

                <p className="text-slate-400 text-sm">
                  {currentStep} of {verifiedCount} testimonies sustained
                </p>
              </div>

              {/* Button appears when counting is complete */}
              {countingComplete && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <button
                    onClick={() => setStage('pause')}
                    className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
                  >
                    See the Verdict
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Stage 2: Forced pause */}
          {stage === 'pause' && (
            <motion.div
              key="pause"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="mb-8">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200 }}
                  className="text-5xl sm:text-6xl font-bold text-emerald-400 mb-4"
                >
                  {finalProb?.label || '1 in 1 million'}
                </motion.div>

                <h2 className="text-2xl font-serif text-white mb-2">
                  Chance of all this being coincidence
                </h2>
                <p className="text-slate-400 text-sm">
                  {finalProb?.explanation || 'Virtually impossible by chance'}
                </p>
              </div>

              <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8">
                <p className="text-xl text-slate-300 leading-relaxed">
                  {verifiedCount} exhibits. {verifiedCount} testimonies sustained.{' '}
                  <span className="text-emerald-400 font-semibold">Zero overruled.</span>
                </p>
              </div>

              <div className="bg-amber-900/30 rounded-xl p-6 border border-amber-700/50 mb-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gavel className="w-5 h-5 text-amber-400" />
                  <p className="text-amber-300 font-medium">Court Adjourned</p>
                </div>
                <p className="text-amber-200 text-lg">
                  Take a moment to consider the weight of this evidence.
                </p>
              </div>

              <button
                onClick={() => setStage('nathan')}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Stage 3: Nathan's commentary */}
          {stage === 'nathan' && (
            <motion.div
              key="nathan"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <MessageCircle className="w-10 h-10 text-amber-400" />
              </div>

              <h2 className="text-2xl font-serif text-white mb-6">
                Witness Statement
              </h2>

              <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-4">
                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  "The evidence doesn't lie. Each sustained testimony makes reasonable doubt less and less defensible."
                </p>
                <p className="text-xl text-white leading-relaxed font-medium">
                  "At this point, the jury must ask—if this book's testimony has been verified on all of this, <span className="text-amber-300">what grounds remain to doubt what it says about everything else?</span>"
                </p>
              </div>

              {/* Tip of the iceberg */}
              <div className="bg-purple-900/30 rounded-xl p-6 border border-purple-700/50 mb-8">
                <p className="text-purple-200 leading-relaxed mb-3">
                  "And this is just <span className="text-white font-semibold">the tip of the iceberg</span>."
                </p>
                <p className="text-slate-300 leading-relaxed mb-3">
                  "No matter what subject I explored—cosmology, biology, history, psychology, law, ethics—the Quran spoke on it with authority. Like learning from the original source."
                </p>
                <p className="text-slate-300 leading-relaxed">
                  "Most people spend a <span className="text-purple-300">lifetime</span> mastering just one or two fields to become an expert. Yet this book—revealed to someone who couldn't read or write, over 1,400 years ago—demonstrates mastery across <span className="text-purple-300">every domain of human knowledge</span>. How?"
                </p>
              </div>

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: canContinue ? 1 : 0.3 }}
                transition={{ duration: 0.5 }}
              >
                <button
                  onClick={() => setStage('checkpoint')}
                  disabled={!canContinue}
                  className={`px-8 py-4 rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto ${
                    canContinue
                      ? 'bg-amber-600 hover:bg-amber-500 text-white'
                      : 'bg-slate-700 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              </motion.div>
            </motion.div>
          )}

          {/* Stage 4: Checkpoint - Are you convinced? */}
          {stage === 'checkpoint' && (
            <motion.div
              key="checkpoint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle2 className="w-10 h-10 text-emerald-400" />
              </div>

              <h1 className="text-4xl sm:text-5xl font-serif text-white mb-4">
                Checkpoint
              </h1>

              <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8">
                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  You've verified <span className="text-emerald-400 font-semibold">{verifiedCount} facts</span> that the Quran stated accurately—
                  centuries before modern science discovered them.
                </p>

                <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50 mb-6">
                  <p className="text-xl text-white font-medium mb-2">
                    Are you convinced?
                  </p>
                  <p className="text-emerald-200">
                    That this book could only come from the One who created everything?
                  </p>
                </div>

                <p className="text-slate-400 text-sm">
                  There's no pressure. Take your time.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => onConvinced ? onConvinced() : onComplete()}
                  className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Yes, I Believe
                </button>
                <button
                  onClick={() => setStage('more-evidence')}
                  className="px-8 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full text-lg font-medium transition flex items-center justify-center gap-2"
                >
                  <Search className="w-5 h-5" />
                  Show Me More
                </button>
              </div>
            </motion.div>
          )}

          {/* Stage 5: More Evidence */}
          {stage === 'more-evidence' && (
            <motion.div
              key="more-evidence"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-indigo-400" />
              </div>
              <h2 className="text-2xl font-serif text-white mb-2">Additional Evidence</h2>
              <p className="text-slate-400 mb-8">Here are more miracles to consider</p>

              <div className="space-y-4 mb-8">
                {secondaryMiracles.map((miracle, index) => (
                  <motion.div
                    key={miracle.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-slate-900/70 rounded-xl border border-slate-700 overflow-hidden"
                  >
                    <button
                      onClick={() => setExpandedMiracle(expandedMiracle === miracle.id ? null : miracle.id)}
                      className="w-full p-4 text-left hover:bg-slate-800/50 transition"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 bg-indigo-500/20 rounded-full flex items-center justify-center flex-shrink-0 text-indigo-400">
                          {miracle.icon}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-white font-medium">{miracle.title}</span>
                            <span className="text-xs px-2 py-0.5 bg-slate-700 rounded text-slate-400">{miracle.category}</span>
                          </div>
                          <p className="text-slate-500 text-sm">Surah {miracle.verse}</p>
                        </div>
                      </div>
                    </button>

                    <AnimatePresence>
                      {expandedMiracle === miracle.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-2 border-t border-slate-700">
                            <p className="text-slate-300 text-sm leading-relaxed">
                              {miracle.description}
                            </p>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>

              <div className="text-center">
                <p className="text-slate-400 mb-4">
                  Seen enough? Or continue to explore more.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => onConvinced ? onConvinced() : onComplete()}
                    className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    I'm Convinced
                  </button>
                  <button
                    onClick={onComplete}
                    className="px-8 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full text-lg font-medium transition"
                  >
                    Continue Journey
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProbabilityMoment;
