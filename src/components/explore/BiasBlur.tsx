import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, Scale, Gavel } from 'lucide-react';

interface BiasBlurProps {
  onComplete: () => void;
}

// The founder's biases before examining the Quran
const biasStatements = [
  {
    id: 'good-person',
    statement: "I assumed being a good person was enough.",
  },
  {
    id: 'pick-religion',
    statement: "I assumed all religions were equally valid personal choices.",
  },
  {
    id: 'one-life',
    statement: "I assumed you only get one life, so live the way you want.",
  },
  {
    id: 'unaware',
    statement: "I was unaware of the Quran's existence as a serious document.",
  },
];

export const BiasBlur = ({ onComplete }: BiasBlurProps) => {
  const [acknowledged, setAcknowledged] = useState<string[]>([]);
  const allAcknowledged = acknowledged.length === biasStatements.length;

  const toggleBias = (id: string) => {
    if (acknowledged.includes(id)) {
      setAcknowledged(acknowledged.filter(b => b !== id));
    } else {
      setAcknowledged([...acknowledged, id]);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
    >
      <div className="max-w-xl w-full">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Scale className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-2xl font-serif text-white mb-2">
            My Biases Before I Started
          </h2>
          <p className="text-slate-400">
            These were my assumptions before I examined the evidence
          </p>
        </div>

        {/* All biases in one view */}
        <div className="space-y-3 mb-8">
          {biasStatements.map((bias, index) => (
            <motion.button
              key={bias.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => toggleBias(bias.id)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                acknowledged.includes(bias.id)
                  ? 'bg-emerald-900/30 border-emerald-700/50'
                  : 'bg-slate-900/80 border-slate-700 hover:border-slate-600'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                  acknowledged.includes(bias.id)
                    ? 'bg-emerald-500'
                    : 'bg-slate-700'
                }`}>
                  {acknowledged.includes(bias.id) && (
                    <CheckCircle2 className="w-4 h-4 text-white" />
                  )}
                </div>
                <p className={`text-lg ${
                  acknowledged.includes(bias.id)
                    ? 'text-emerald-200'
                    : 'text-slate-300'
                }`}>
                  "{bias.statement}"
                </p>
              </div>
            </motion.button>
          ))}
        </div>

        {/* Summary when all acknowledged */}
        {allAcknowledged && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
              <p className="text-amber-200 leading-relaxed">
                These were the lenses I was looking through. I had to acknowledge them before I could fairly examine the evidence.
              </p>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-600">
              <p className="text-slate-300 leading-relaxed">
                I came to realise there is actually <span className="text-white font-medium">only one book in the world</span> that claims to be our Creator communicating with us directly. That makes things simple.
              </p>
            </div>

            <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50">
              <div className="flex items-center justify-center gap-2">
                <Gavel className="w-5 h-5 text-amber-400" />
                <p className="text-amber-300 font-medium">Let's see what's in this book.</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Continue button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: allAcknowledged ? 1 : 0.3 }}
          className="mt-6"
        >
          <button
            onClick={onComplete}
            disabled={!allAcknowledged}
            className={`w-full px-8 py-4 rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 ${
              allAcknowledged
                ? 'bg-amber-600 hover:bg-amber-500 text-white'
                : 'bg-slate-700 text-slate-500 cursor-not-allowed'
            }`}
          >
            {allAcknowledged ? 'Present the Evidence' : 'Acknowledge all biases to continue'}
            {allAcknowledged && <ArrowRight className="w-5 h-5" />}
          </button>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default BiasBlur;
