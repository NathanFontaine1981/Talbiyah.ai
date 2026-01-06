import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart, BookOpen, Users, Sparkles } from 'lucide-react';

interface TheFirstStepProps {
  onTakeStep: () => void;
  onNeedMoreTime: () => void;
  onLearnMore: () => void;
}

export const TheFirstStep = ({ onTakeStep, onNeedMoreTime, onLearnMore }: TheFirstStepProps) => {
  const [stage, setStage] = useState<'intro' | 'acknowledgment' | 'paths'>('intro');
  const [acknowledged, setAcknowledged] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950 flex items-center justify-center p-4"
    >
      <div className="max-w-xl w-full">
        <AnimatePresence mode="wait">
          {/* Stage 1: Intro - What you've seen */}
          {stage === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-amber-400" />
              </div>

              <h2 className="text-3xl font-serif text-white mb-6">
                The First Step
              </h2>

              <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8">
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  You've seen the evidence. You understand there's a <span className="text-amber-400 font-semibold">Creator</span>.
                </p>
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  That's not a small thing—most people never get this far.
                </p>
                <p className="text-lg text-white leading-relaxed">
                  The question now is: <span className="text-amber-300">what will you do with this knowledge?</span>
                </p>
              </div>

              <button
                onClick={() => setStage('acknowledgment')}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Stage 2: The Acknowledgment - Articles of Faith */}
          {stage === 'acknowledgment' && (
            <motion.div
              key="acknowledgment"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="w-10 h-10 text-emerald-400" />
              </div>

              <h2 className="text-3xl font-serif text-white mb-2">
                The Articles of Faith
              </h2>
              <p className="text-slate-400 text-sm mb-6">
                What a Muslim believes
              </p>

              <div className="bg-slate-900/70 rounded-2xl p-6 border border-slate-700 mb-6">
                <div className="space-y-3 text-left">
                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">1.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in Allah</p>
                      <p className="text-slate-300 text-sm">One God—the Creator, with no partners</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">2.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in the Angels</p>
                      <p className="text-slate-300 text-sm">Beings of light who carry out Allah's commands</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">3.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in the Books</p>
                      <p className="text-slate-300 text-sm">The Quran, Torah, Gospel, Psalms—all originally from Allah</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">4.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in the Prophets</p>
                      <p className="text-slate-300 text-sm">From Adam to Muhammad ﷺ—all sent with the same message</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">5.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in the Day of Judgment</p>
                      <p className="text-slate-300 text-sm">We will all be held accountable for our choices</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-slate-800/70 rounded-lg border border-slate-700">
                    <span className="text-amber-400 font-bold text-lg">6.</span>
                    <div>
                      <p className="text-white font-semibold">Belief in Divine Decree</p>
                      <p className="text-slate-300 text-sm">Allah's knowledge encompasses all—past, present, and future</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50 mb-6">
                <p className="text-amber-200 text-sm">
                  If you believe these, you already have <span className="text-white font-semibold">Iman</span> (faith) in your heart. The shahada is simply the <span className="text-white font-semibold">declaration</span> of what you already believe.
                </p>
              </div>

              <div className="space-y-3">
                <button
                  onClick={() => {
                    setAcknowledged(true);
                    setStage('paths');
                  }}
                  className="w-full px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-lg font-semibold transition"
                >
                  Yes, I believe this
                </button>

                <button
                  onClick={() => setStage('paths')}
                  className="w-full px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-xl transition"
                >
                  I'm still thinking
                </button>
              </div>
            </motion.div>
          )}

          {/* Stage 3: Paths forward */}
          {stage === 'paths' && (
            <motion.div
              key="paths"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              {acknowledged && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="text-center mb-8"
                >
                  <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-emerald-400" />
                  </div>
                  <p className="text-emerald-300 text-lg">
                    That's a beautiful first step.
                  </p>
                </motion.div>
              )}

              <h2 className="text-2xl font-serif text-white text-center mb-6">
                {acknowledged ? "What's Next?" : "Take Your Time"}
              </h2>

              <div className="space-y-4">
                {/* Path 1: Learn more about the messenger */}
                <button
                  onClick={onLearnMore}
                  className="w-full bg-slate-900/70 hover:bg-slate-800/70 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-6 h-6 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        Learn About the Messenger
                      </h3>
                      <p className="text-slate-400 text-sm">
                        Continue to the curriculum and learn about Muhammad ﷺ and the complete path
                      </p>
                    </div>
                  </div>
                </button>

                {/* Path 2: Practical guidance */}
                <button
                  onClick={onNeedMoreTime}
                  className="w-full bg-slate-900/70 hover:bg-slate-800/70 rounded-xl p-5 border border-slate-700 hover:border-slate-600 transition text-left group"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                      <Users className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        Practical Life Guidance
                      </h3>
                      <p className="text-slate-400 text-sm">
                        See how the Quran's wisdom applies to everyday life challenges
                      </p>
                    </div>
                  </div>
                </button>

                {/* Path 3: Return to dashboard */}
                <button
                  onClick={onTakeStep}
                  className="w-full bg-slate-800/50 hover:bg-slate-800/70 rounded-xl p-4 border border-slate-700 hover:border-slate-600 transition text-center"
                >
                  <p className="text-slate-400">
                    Return to Dashboard
                  </p>
                </button>
              </div>

              <p className="text-center text-slate-500 text-sm mt-6">
                When you're ready to learn about the full shahada, we'll be here.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default TheFirstStep;
