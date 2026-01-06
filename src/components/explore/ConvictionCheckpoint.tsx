import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, CheckCircle2, Search, Sparkles, BookOpen } from 'lucide-react';

interface ConvictionCheckpointProps {
  verifiedCount: number;
  onConvinced: () => void;
  onShowMore: () => void;
}

// Secondary miracles to show if they want more
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

export const ConvictionCheckpoint = ({ verifiedCount, onConvinced, onShowMore }: ConvictionCheckpointProps) => {
  const [showMore, setShowMore] = useState(false);
  const [expandedMiracle, setExpandedMiracle] = useState<string | null>(null);

  if (showMore) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4"
      >
        {/* Back button */}
        <button
          onClick={() => setShowMore(false)}
          className="fixed top-6 left-6 flex items-center gap-2 text-slate-400 hover:text-white transition z-50"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>

        <div className="max-w-2xl w-full">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Search className="w-8 h-8 text-indigo-400" />
            </div>
            <h2 className="text-2xl font-serif text-white mb-2">Additional Evidence</h2>
            <p className="text-slate-400">Here are more miracles to consider</p>
          </div>

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
                onClick={onConvinced}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                I'm Convinced
              </button>
              <button
                onClick={onShowMore}
                className="px-8 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full text-lg font-medium transition"
              >
                Continue Journey
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-950 flex items-center justify-center p-4"
    >
      <div className="max-w-2xl w-full text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
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
              onClick={onConvinced}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              Yes, I Believe
            </button>
            <button
              onClick={() => setShowMore(true)}
              className="px-8 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full text-lg font-medium transition flex items-center justify-center gap-2"
            >
              <Search className="w-5 h-5" />
              Show Me More
            </button>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ConvictionCheckpoint;
