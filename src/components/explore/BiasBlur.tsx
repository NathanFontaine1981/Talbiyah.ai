import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Eye, EyeOff, Brain, CheckCircle2, Scale, Gavel } from 'lucide-react';

interface BiasBlurProps {
  onComplete: () => void;
}

// Jury oath - declare biases before serving
const biasStatements = [
  {
    id: 'good-person',
    statement: "I assumed being a good person was enough.",
    insight: "Follow your conscience, do more good than bad, and you'll be okay. That was my assumption before examining the evidence. A jury must set aside assumptions.",
  },
  {
    id: 'pick-religion',
    statement: "I assumed all religions were equally valid personal choices.",
    insight: "Like shopping. Pick whatever feels right. I didn't know any religion claimed to have verifiable proof of its divine origin. The evidence will speak for itself.",
  },
  {
    id: 'unaware',
    statement: "I was unaware of the Quran's existence as a serious document.",
    insight: "21 years. I didn't know there was a book claiming to be directly from the Creator with evidence to support it. A court cannot rule on what it hasn't examined.",
  },
];

export const BiasBlur = ({ onComplete }: BiasBlurProps) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [relatedTo, setRelatedTo] = useState<string[]>([]); // Biases user related to
  const [reviewed, setReviewed] = useState<string[]>([]); // All biases user has seen
  const [blurLevel, setBlurLevel] = useState(20); // Start very blurry
  const [showInsight, setShowInsight] = useState(false);

  const currentBias = biasStatements[currentIndex];
  const isComplete = currentIndex >= biasStatements.length;

  const handleRelate = (id: string) => {
    // User relates to this statement
    if (!relatedTo.includes(id)) {
      setRelatedTo([...relatedTo, id]);
    }
    if (!reviewed.includes(id)) {
      setReviewed([...reviewed, id]);
    }
    // Reduce blur with each statement (20 / 3 statements ≈ 7 per step)
    setBlurLevel(prev => Math.max(0, prev - 7));
    setShowInsight(true);
  };

  const handleNotMe = (id: string) => {
    // User doesn't relate, but still reviewed
    if (!reviewed.includes(id)) {
      setReviewed([...reviewed, id]);
    }
    // Still reduce blur
    setBlurLevel(prev => Math.max(0, prev - 5));
    setShowInsight(true);
  };

  const handleContinue = () => {
    setShowInsight(false);
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
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>

          <h2 className="text-3xl font-serif text-white mb-4">
            Jury Oath Complete
          </h2>

          <p className="text-slate-300 text-lg mb-8">
            You have acknowledged your starting position.
            <br />
            <span className="text-emerald-300">The court may now present the evidence.</span>
          </p>

          <div className="bg-amber-900/30 rounded-xl p-6 border border-amber-700/50 mb-8">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Gavel className="w-5 h-5 text-amber-400" />
              <p className="text-amber-300 font-medium">Witness Statement</p>
            </div>
            <p className="text-slate-300 italic">
              "I was in the same position. Unaware. Not looking for anything. Then the evidence changed everything."
            </p>
          </div>

          <button
            onClick={onComplete}
            className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
          >
            Present the Evidence
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
                ? relatedTo.includes(biasStatements[i].id)
                  ? 'bg-emerald-500'  // Related to this bias
                  : 'bg-amber-500'     // Reviewed but didn't relate
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
            <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-amber-400" />
            </div>
            <h2 className="text-2xl font-serif text-white mb-2">
              Jury Selection: Acknowledge Your Biases
            </h2>
            <p className="text-slate-400">
              Statement {currentIndex + 1} of {biasStatements.length}
            </p>
          </div>

          {/* Nathan's Perspective Card */}
          <div className="bg-slate-900/80 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-6">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-10 h-10 bg-slate-700 rounded-full flex items-center justify-center flex-shrink-0">
                <EyeOff className="w-5 h-5 text-slate-400" />
              </div>
              <div>
                <p className="text-xs text-amber-400 font-medium mb-1 uppercase tracking-wide">
                  What I used to think:
                </p>
                <p className="text-xl text-white font-medium">
                  "{currentBias.statement}"
                </p>
              </div>
            </div>

            {/* Two buttons - user can relate or not */}
            {!showInsight && (
              <div className="flex gap-3">
                <button
                  onClick={() => handleRelate(currentBias.id)}
                  className="flex-1 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition"
                >
                  That was me too
                </button>
                <button
                  onClick={() => handleNotMe(currentBias.id)}
                  className="flex-1 px-6 py-4 border border-slate-600 text-slate-300 hover:bg-slate-700 rounded-xl font-medium transition"
                >
                  Not really me
                </button>
              </div>
            )}
          </div>

          {/* Nathan's insight appears after clicking either button */}
          <AnimatePresence>
            {showInsight && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-amber-900/20 rounded-xl p-5 border border-amber-700/50"
              >
                <p className="text-xs text-amber-400 font-medium mb-2 uppercase tracking-wide">
                  Looking back now:
                </p>
                <p className="text-amber-100 mb-4">
                  "{currentBias.insight}"
                </p>
                <button
                  onClick={handleContinue}
                  className="w-full px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-medium transition flex items-center justify-center gap-2"
                >
                  Next
                  <ArrowRight className="w-4 h-4" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default BiasBlur;
