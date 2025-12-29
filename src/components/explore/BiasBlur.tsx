import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Brain, CheckCircle2 } from 'lucide-react';

interface BiasBlurProps {
  onComplete: () => void;
}

const biasStatements = [
  {
    id: 'open-to-truth',
    statement: 'Are you open to accepting the truth if the evidence is undeniable?',
    acknowledgment: 'This is the only question that matters. People once believed talking to someone across the world was impossible—until technology proved otherwise. The impossible became possible. Superior evidence changes everything.',
  },
  {
    id: 'guard-down',
    statement: 'I am willing to let my guard down and change my stance if I come across evidence superior to what I currently know',
    acknowledgment: 'We all carry assumptions. The wise person updates their beliefs when better evidence arrives—not when it feels comfortable.',
  },
  {
    id: 'truth-seeking',
    statement: 'To find the truth, I must put aside what I want to be true and look at what IS true',
    acknowledgment: 'Honest inquiry requires intellectual honesty. Truth exists independent of our preferences.',
  },
  {
    id: 'media',
    statement: 'Most of what I know about Islam comes from news media, not primary sources',
    acknowledgment: 'Media often focuses on negative events. Direct sources give a fuller picture.',
  },
  {
    id: 'never-read',
    statement: "I've never read the Quran or Islamic texts directly",
    acknowledgment: 'Primary sources are always more accurate than secondhand accounts.',
  },
];

export const BiasBlur = ({ onComplete }: BiasBlurProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const [blurLevel, setBlurLevel] = useState(20); // Start very blurry

  const currentBias = biasStatements[currentIndex];
  const isComplete = currentIndex >= biasStatements.length;

  const handleAcknowledge = (id: string) => {
    if (!acknowledged.includes(id)) {
      setAcknowledged([...acknowledged, id]);
      // Reduce blur with each acknowledgment (20 / 5 statements = 4 per step)
      setBlurLevel(prev => Math.max(0, prev - 4));
    }

    // Give user time to read the acknowledgment insight (5 seconds)
    setTimeout(() => {
      setCurrentIndex(prev => prev + 1);
    }, 5000);
  };

  const handleSkip = () => {
    setCurrentIndex(prev => prev + 1);
  };

  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="max-w-xl w-full text-center"
        >
          <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Eye className="w-10 h-10 text-emerald-400" />
          </div>

          <h2 className="text-3xl font-serif text-white mb-4">
            Vision Cleared
          </h2>

          <p className="text-slate-300 text-lg mb-8">
            You've acknowledged {acknowledged.length} potential bias{acknowledged.length !== 1 ? 'es' : ''}.
            <br />
            <span className="text-emerald-300">Now you're ready to see clearly.</span>
          </p>

          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 mb-8">
            <p className="text-slate-400 italic">
              "The truth does not fear examination. Let's examine together."
            </p>
          </div>

          <button
            onClick={onComplete}
            className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
          >
            Continue Journey
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Blurred background text representing "unclear vision" */}
      <div
        className="absolute inset-0 flex items-center justify-center pointer-events-none select-none"
        style={{ filter: `blur(${blurLevel}px)` }}
      >
        <div className="text-[200px] font-serif text-blue-500/10">
          ﷲ
        </div>
      </div>

      {/* Progress indicator */}
      <div className="fixed top-6 left-6 flex items-center gap-2 z-50">
        {biasStatements.map((_, i) => (
          <div
            key={i}
            className={`w-3 h-3 rounded-full transition-colors ${
              i < currentIndex
                ? acknowledged.includes(biasStatements[i].id)
                  ? 'bg-emerald-500'
                  : 'bg-slate-600'
                : i === currentIndex
                ? 'bg-blue-500'
                : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentBias.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="relative z-10 max-w-xl w-full"
        >
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Brain className="w-8 h-8 text-blue-400" />
            </div>
            <h2 className="text-2xl font-serif text-white mb-2">
              Before We Begin...
            </h2>
            <p className="text-slate-400">
              Honest exploration requires acknowledging our starting point
            </p>
          </div>

          {/* Bias Card */}
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <EyeOff className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-xl text-white font-medium mb-2">
                  "{currentBias.statement}"
                </p>
                <p className="text-slate-400">
                  Does this apply to you?
                </p>
              </div>
            </div>

            {/* Response buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleAcknowledge(currentBias.id)}
                className="flex-1 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                Yes, I acknowledge this
              </button>
              <button
                onClick={handleSkip}
                className="flex-1 px-6 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl font-medium transition"
              >
                This doesn't apply to me
              </button>
            </div>
          </div>

          {/* Insight that appears after acknowledgment */}
          <AnimatePresence>
            {acknowledged.includes(currentBias.id) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50"
              >
                <p className="text-emerald-200 text-sm">
                  {currentBias.acknowledgment}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BiasBlur;
