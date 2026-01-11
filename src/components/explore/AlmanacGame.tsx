import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Plane, BookOpen, TrendingUp, DollarSign, Brain, AlertTriangle } from 'lucide-react';

interface AlmanacGameProps {
  onComplete: () => void;
}

type GamePhase = 'intro' | 'millionaire' | 'biff-mind' | 'belief-growth' | 'plane-question' | 'answer' | 'revelation';

export default function AlmanacGame({ onComplete }: AlmanacGameProps) {
  const [phase, setPhase] = useState<GamePhase>('intro');
  const [beliefLevel, setBeliefLevel] = useState(0);
  const [userAnswer, setUserAnswer] = useState<'yes' | 'no' | null>(null);
  const [showingResults, setShowingResults] = useState(false);

  const advancePhase = (nextPhase: GamePhase) => {
    setPhase(nextPhase);
  };

  // Belief growth animation
  const simulateBeliefGrowth = () => {
    setShowingResults(true);
    let level = 0;
    const interval = setInterval(() => {
      level += 1;
      setBeliefLevel(level);
      if (level >= 5) {
        clearInterval(interval);
        // Don't auto-advance - wait for user click
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {/* Phase 1: Intro */}
          {phase === 'intro' && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-amber-400" />
                </div>
              </div>

              <h1 className="text-3xl font-serif text-white mb-2">The Almanac Moment</h1>
              <p className="text-slate-400 text-sm mb-8">(A publication of data and statistics - in the movie, sports results)</p>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  Have you ever seen <span className="text-white font-medium">Back to the Future 2</span>?
                </p>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 space-y-3">
                  <p className="text-slate-300 leading-relaxed">
                    In the movie, old Biff travels to the future—<span className="text-amber-400 font-medium">the year 2015</span>—and finds a <span className="text-white font-medium">Sports Almanac</span>.
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    This book contains all the results of every sporting event from 1950-2000.
                  </p>
                  <p className="text-slate-300 leading-relaxed">
                    He then takes the almanac <span className="text-amber-400 font-medium">back in time</span> and gives it to his <span className="text-white font-medium">younger self</span> in 1955.
                  </p>
                  <p className="text-slate-400 leading-relaxed">
                    Young Biff now knows the results of every game—<span className="text-white">before they happen</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => advancePhase('millionaire')}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Phase 2: Multi-millionaire */}
          {phase === 'millionaire' && (
            <motion.div
              key="millionaire"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <DollarSign className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-8">The Result?</h2>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  Biff bets on <span className="text-white font-medium">every single result</span>.
                </p>

                <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
                  <p className="text-2xl text-emerald-300 font-bold text-center mb-2">
                    He becomes a multi-millionaire.
                  </p>
                  <p className="text-emerald-400 text-center text-sm">
                    Every bet wins. Every time.
                  </p>
                </div>

                <p className="text-slate-400 mt-4 leading-relaxed">
                  But here's what I found interesting...
                </p>
              </div>

              <button
                onClick={() => advancePhase('biff-mind')}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                What was going through Biff's mind?
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Phase 3: Biff's Mind */}
          {phase === 'biff-mind' && (
            <motion.div
              key="biff-mind"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <Brain className="w-10 h-10 text-purple-400" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-8">What was Biff thinking?</h2>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  When Biff was <span className="text-white font-medium">first given</span> the book...
                </p>

                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
                  <p className="text-slate-400">
                    He would have had <span className="text-amber-400 font-medium">zero belief</span> in it.
                  </p>
                  <p className="text-slate-500 text-sm mt-1 italic">
                    "A book from the future? Yeah right..."
                  </p>
                </div>

                <p className="text-slate-300 leading-relaxed">
                  But then the <span className="text-white font-medium">first result</span> came in correct...
                </p>
              </div>

              <button
                onClick={() => advancePhase('belief-growth')}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                Watch his belief grow
                <TrendingUp className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Phase 4: Belief Growth Animation */}
          {phase === 'belief-growth' && (
            <motion.div
              key="belief-growth"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <h2 className="text-2xl font-serif text-white mb-8">Biff's Belief Level</h2>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8">
                {/* Belief meter */}
                <div className="mb-8">
                  <div className="flex justify-between text-sm text-slate-400 mb-2">
                    <span>Doubt</span>
                    <span>Certainty</span>
                  </div>
                  <div className="h-6 bg-slate-800 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-amber-600 to-emerald-500"
                      initial={{ width: '0%' }}
                      animate={{ width: `${beliefLevel * 20}%` }}
                      transition={{ duration: 0.5 }}
                    />
                  </div>
                </div>

                {/* Results stacking */}
                <div className="space-y-3">
                  {beliefLevel >= 1 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 bg-emerald-900/30 rounded-lg p-3 border border-emerald-700/50"
                    >
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300">Result #1: Correct</span>
                      <span className="text-slate-500 text-sm ml-auto">"Hmm, interesting..."</span>
                    </motion.div>
                  )}
                  {beliefLevel >= 2 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 bg-emerald-900/30 rounded-lg p-3 border border-emerald-700/50"
                    >
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300">Result #2: Correct</span>
                      <span className="text-slate-500 text-sm ml-auto">"That's lucky..."</span>
                    </motion.div>
                  )}
                  {beliefLevel >= 3 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 bg-emerald-900/30 rounded-lg p-3 border border-emerald-700/50"
                    >
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300">Result #3: Correct</span>
                      <span className="text-slate-500 text-sm ml-auto">"Wait a minute..."</span>
                    </motion.div>
                  )}
                  {beliefLevel >= 4 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 bg-emerald-900/30 rounded-lg p-3 border border-emerald-700/50"
                    >
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300">Result #4: Correct</span>
                      <span className="text-slate-500 text-sm ml-auto">"This is real..."</span>
                    </motion.div>
                  )}
                  {beliefLevel >= 5 && (
                    <motion.div
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="flex items-center gap-3 bg-emerald-900/30 rounded-lg p-3 border border-emerald-700/50"
                    >
                      <Check className="w-5 h-5 text-emerald-400" />
                      <span className="text-emerald-300">Result #5: Correct</span>
                      <span className="text-white text-sm ml-auto font-medium">"No doubt."</span>
                    </motion.div>
                  )}
                </div>

                {beliefLevel >= 5 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="mt-6 p-4 bg-amber-900/30 rounded-xl border border-amber-700/50"
                  >
                    <p className="text-amber-200 text-center">
                      The <span className="text-white font-semibold">only way</span> doubt would creep back in?
                    </p>
                    <p className="text-amber-300 text-center mt-1">
                      One result goes wrong.
                    </p>
                  </motion.div>
                )}
              </div>

              {!showingResults ? (
                <button
                  onClick={simulateBeliefGrowth}
                  className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
                >
                  Start the Results
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : beliefLevel >= 5 ? (
                <button
                  onClick={() => advancePhase('plane-question')}
                  className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
                >
                  Continue
                  <ArrowRight className="w-5 h-5" />
                </button>
              ) : (
                <p className="text-slate-400">Results coming in...</p>
              )}
            </motion.div>
          )}

          {/* Phase 5: Plane Question */}
          {phase === 'plane-question' && (
            <motion.div
              key="plane-question"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                  <Plane className="w-10 h-10 text-red-400" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-8">Let me ask you a question...</h2>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  Imagine <span className="text-white font-medium">you</span> had this Almanac.
                </p>

                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  Every prediction it made came true. You've seen it work <span className="text-emerald-400 font-medium">dozens of times</span>.
                </p>

                <div className="bg-red-900/30 rounded-xl p-5 border border-red-700/50 mb-6">
                  <p className="text-red-200 leading-relaxed">
                    Then you notice it contains a <span className="text-white font-semibold">plane crash</span>.
                  </p>
                  <p className="text-red-300 mt-2">
                    Flight <span className="text-white font-bold">BA287</span>. Crashes on landing.
                  </p>
                  <p className="text-red-400 mt-2 text-sm">
                    You check your ticket. That's <span className="text-white">your flight</span>.
                  </p>
                </div>

                <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
                  <p className="text-xl text-amber-200 text-center font-medium">
                    Would you still board the plane?
                  </p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <button
                  onClick={() => {
                    setUserAnswer('yes');
                    advancePhase('answer');
                  }}
                  className="px-8 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-full text-lg font-semibold transition"
                >
                  Yes, I'd board
                </button>
                <button
                  onClick={() => {
                    setUserAnswer('no');
                    advancePhase('answer');
                  }}
                  className="px-8 py-4 bg-red-600 hover:bg-red-500 text-white rounded-full text-lg font-semibold transition"
                >
                  No way
                </button>
              </div>
            </motion.div>
          )}

          {/* Phase 6: Answer */}
          {phase === 'answer' && (
            <motion.div
              key="answer"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-amber-400" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-8">
                {userAnswer === 'no' ? "Exactly." : "Really?"}
              </h2>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                {userAnswer === 'no' ? (
                  <>
                    <p className="text-lg text-slate-300 leading-relaxed mb-4">
                      You wouldn't board that plane.
                    </p>

                    <p className="text-xl text-white leading-relaxed mb-6">
                      Why not?
                    </p>

                    <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
                      <p className="text-emerald-200 leading-relaxed">
                        Because the book has <span className="text-white font-semibold">proven itself</span> to you.
                      </p>
                      <p className="text-emerald-300 mt-2">
                        You've seen the evidence stack up. You <span className="text-white">trust it</span>.
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-lg text-slate-300 leading-relaxed mb-4">
                      After seeing the book be right <span className="text-white font-medium">every single time</span>?
                    </p>

                    <p className="text-slate-400 leading-relaxed mb-4">
                      I think if you're honest with yourself, you'd at least hesitate. Maybe change flights.
                    </p>

                    <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
                      <p className="text-amber-200 leading-relaxed">
                        Because deep down, you'd <span className="text-white font-semibold">trust</span> what the evidence showed you.
                      </p>
                    </div>
                  </>
                )}
              </div>

              <button
                onClick={() => advancePhase('revelation')}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                So here's my point...
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Phase 7: Revelation */}
          {phase === 'revelation' && (
            <motion.div
              key="revelation"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-8">The Quran</h2>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  When I started examining the Quran, I had a <span className="text-amber-400 font-semibold">lightbulb moment</span>.
                </p>

                <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50 mb-4">
                  <p className="text-emerald-200 leading-relaxed">
                    This book read like an <span className="text-white font-semibold">Almanac</span>.
                  </p>
                  <p className="text-emerald-300 mt-2">
                    It contained information that <span className="text-white">couldn't have been known</span> 1,400 years ago—but we've since discovered to be true.
                  </p>
                </div>

                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  And just like with Biff's Almanac...
                </p>

                <p className="text-xl text-white leading-relaxed">
                  The more results that checked out, the harder it became to dismiss.
                </p>
              </div>

              <button
                onClick={onComplete}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                Let me show you what I found
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
