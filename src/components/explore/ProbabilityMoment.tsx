import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, TrendingDown, MessageCircle, Scale, Gavel } from 'lucide-react';

interface ProbabilityMomentProps {
  verifiedCount: number;
  onComplete: () => void;
}

export const ProbabilityMoment = ({ verifiedCount, onComplete }: ProbabilityMomentProps) => {
  const [stage, setStage] = useState<'counting' | 'pause' | 'nathan'>('counting');
  const [currentStep, setCurrentStep] = useState(0);
  const [canContinue, setCanContinue] = useState(false);

  // Calculate probability stages based on verified count
  // Each verified fact halves the probability of coincidence
  const probabilitySteps = [];
  let prob = 50; // Start at 50%
  for (let i = 0; i < Math.min(verifiedCount, 20); i++) {
    probabilitySteps.push({
      count: i + 1,
      probability: prob,
      label: prob >= 1 ? `${prob.toFixed(1)}%` : prob >= 0.01 ? `${prob.toFixed(2)}%` : `${prob.toExponential(2)}`,
    });
    prob = prob / 2;
  }

  // Auto-advance through counting steps
  useEffect(() => {
    if (stage === 'counting' && currentStep < probabilitySteps.length) {
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1);
      }, 300); // 300ms per step
      return () => clearTimeout(timer);
    } else if (stage === 'counting' && currentStep >= probabilitySteps.length) {
      // Move to pause stage
      setTimeout(() => setStage('pause'), 500);
    }
  }, [stage, currentStep, probabilitySteps.length]);

  // Force pause for 8 seconds
  useEffect(() => {
    if (stage === 'pause') {
      const timer = setTimeout(() => {
        setStage('nathan');
      }, 8000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  // Allow continue after Nathan's message
  useEffect(() => {
    if (stage === 'nathan') {
      const timer = setTimeout(() => {
        setCanContinue(true);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [stage]);

  const currentProb = probabilitySteps[currentStep - 1];
  const finalProb = probabilitySteps[probabilitySteps.length - 1];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
    >
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
                <motion.div
                  key={currentStep}
                  initial={{ scale: 1.2, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="text-6xl font-bold text-blue-400 mb-4"
                >
                  {currentProb ? currentProb.label : '50%'}
                </motion.div>

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
                  className="text-7xl font-bold text-emerald-400 mb-4"
                >
                  {finalProb?.label || '0.00001%'}
                </motion.div>

                <h2 className="text-2xl font-serif text-white mb-4">
                  Probability of reasonable doubt
                </h2>
              </div>

              <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8">
                <p className="text-xl text-slate-300 leading-relaxed">
                  {verifiedCount} exhibits. {verifiedCount} testimonies sustained.{' '}
                  <span className="text-emerald-400 font-semibold">Zero overruled.</span>
                </p>
              </div>

              <div className="bg-amber-900/30 rounded-xl p-6 border border-amber-700/50">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Gavel className="w-5 h-5 text-amber-400" />
                  <p className="text-amber-300 font-medium">Court Adjourned</p>
                </div>
                <p className="text-amber-200 text-lg">
                  Take a moment to consider the weight of this evidence.
                </p>
              </div>

              {/* Subtle countdown */}
              <p className="text-slate-600 text-sm mt-6 italic">
                Deliberating...
              </p>
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
                  onClick={onComplete}
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
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default ProbabilityMoment;
