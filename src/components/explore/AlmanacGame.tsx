import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Plane, BookOpen, TrendingUp, DollarSign, Brain, AlertTriangle } from 'lucide-react';

interface AlmanacGameProps {
  onComplete: () => void;
}

type GamePhase = 'personal-story' | 'movie-scene' | 'millionaire' | 'biff-mind' | 'belief-growth' | 'plane-question' | 'answer' | 'revelation' | 'two-destinations';

export default function AlmanacGame({ onComplete }: AlmanacGameProps) {
  const [phase, setPhase] = useState<GamePhase>('personal-story');
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
          {/* Phase 0a: Personal Story */}
          {phase === 'personal-story' && (
            <motion.div
              key="personal-story"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Brain className="w-10 h-10 text-amber-400" />
                </div>
              </div>

              <h1 className="text-3xl font-serif text-white mb-2">The Almanac Moment</h1>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  We've just ruled out every possible human author. So let me share something that helped it click for me.
                </p>

                <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50 mb-4">
                  <p className="text-amber-200 leading-relaxed">
                    I always used to think about this — <span className="text-white font-medium">imagine you could go forward in time</span>, see everything that's going to happen, get all the information...
                  </p>
                  <p className="text-amber-200 leading-relaxed mt-3">
                    Then come <span className="text-white font-medium">back in time</span> with all of that knowledge.
                  </p>
                </div>

                <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
                  <p className="text-emerald-200 leading-relaxed text-lg text-center">
                    I'd do exactly that — and I'd become a <span className="text-white font-semibold">millionaire</span>.
                  </p>
                  <p className="text-emerald-300 text-center mt-2 text-sm">
                    You'd know every result before it happens. Every stock, every game, every event.
                  </p>
                </div>

                <p className="text-slate-400 leading-relaxed mt-4">
                  Then I saw a movie that played out this exact scenario...
                </p>
              </div>

              <button
                onClick={() => advancePhase('movie-scene')}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                The Movie
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Phase 0b: Movie Scene */}
          {phase === 'movie-scene' && (
            <motion.div
              key="movie-scene"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🎬</span>
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-8">Back to the Future 2</h2>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  This is <span className="text-white font-medium">exactly</span> what happens in the movie.
                </p>

                <p className="text-slate-300 leading-relaxed mb-6">
                  Old Biff travels to <span className="text-amber-400 font-medium">the year 2015</span>, grabs a Sports Almanac containing every result from 1950-2000, then takes it <span className="text-amber-400 font-medium">back in time</span> and gives it to his younger self.
                </p>

                {/* Movie scene card */}
                <a
                  href="https://www.youtube.com/watch?v=zorz3SXqjv0"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-slate-800/80 rounded-xl p-5 border border-slate-600 hover:border-amber-600/50 transition group mb-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-600/30 transition">
                      <span className="text-3xl">▶️</span>
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium group-hover:text-amber-400 transition">Watch the scene</p>
                      <p className="text-slate-400 text-sm mt-0.5">Back to the Future 2 — Biff's Almanac</p>
                      <p className="text-slate-500 text-xs mt-1">Opens YouTube in a new tab</p>
                    </div>
                  </div>
                </a>

                <p className="text-slate-500 text-sm italic">
                  If you've seen the movie, you'll know exactly what happens next. If not, it's worth a quick watch. Please excuse the mild language and some scenes with women — it's a Hollywood movie, but the concept is what matters.
                </p>
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

                {/* Almanac detail clip */}
                <a
                  href="https://www.youtube.com/watch?v=bRLtif9h0HQ"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block bg-slate-800/80 rounded-xl p-5 border border-slate-600 hover:border-amber-600/50 transition group mt-5 mb-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-red-600/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-red-600/30 transition">
                      <span className="text-3xl">▶️</span>
                    </div>
                    <div className="text-left">
                      <p className="text-white font-medium group-hover:text-amber-400 transition">Watch the almanac scene</p>
                      <p className="text-slate-400 text-sm mt-0.5">Back to the Future 2 — The Almanac Detail</p>
                      <p className="text-slate-500 text-xs mt-1">Opens YouTube in a new tab</p>
                    </div>
                  </div>
                </a>

                <p className="text-slate-500 text-sm italic mb-4">
                  Please excuse the mild language and some scenes with women — it's a Hollywood movie, but the concept is what matters.
                </p>

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

          {/* Phase 7: Revelation — Fiction vs Reality */}
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

              <h2 className="text-2xl font-serif text-white mb-8">Now Consider the Parallels</h2>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  Biff's Almanac was <span className="text-white font-medium">fiction</span>. A movie prop about sports results and gambling.
                </p>

                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  You've examined a handful of claims from the Qur'an — embryology, the expanding universe, fingerprints, ocean barriers, the lowest land, Pharaoh's preserved body — <span className="text-white font-medium">all confirmed by modern science</span>.
                </p>

                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  And that was just the <span className="text-white font-semibold">tip of the iceberg</span>. The Qur'an contains countless more signs spread throughout the entire book. Every result that checked out <span className="text-white font-semibold">compounded</span> the case — one after another.
                </p>

                <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50 mb-6">
                  <p className="text-amber-200 leading-relaxed">
                    The Almanac knew the future because it came <span className="text-white font-medium">from</span> the future.
                  </p>
                  <p className="text-amber-300 mt-3 leading-relaxed">
                    The Qur'an's author claims to know <span className="text-white font-medium">"what is before them and what is behind them"</span> <span className="text-slate-500 text-sm">(Al-Baqarah, 2:255)</span> — because He <span className="text-white font-medium">created</span> time itself, and is not subject to it.
                  </p>
                </div>

                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  If that claim holds, it changes everything. It means the Qur'an isn't predicting the future — it's authored by someone who already sees the full timeline, and is informing us <span className="text-white font-medium">in advance</span> of what is coming and how to prepare.
                </p>

                <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
                  <p className="text-emerald-200 leading-relaxed">
                    This book contained information that <span className="text-white font-semibold">couldn't have been known</span> 1,400 years ago — and no human could have authored it.
                  </p>
                  <p className="text-emerald-300 mt-3">
                    It reads like an Almanac — except it's not about sport scores. It's about <span className="text-white font-medium">your life, your purpose, and what happens after you die</span>.
                  </p>
                </div>
              </div>

              <button
                onClick={() => advancePhase('two-destinations')}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Phase 8: Two Destinations */}
          {phase === 'two-destinations' && (
            <motion.div
              key="two-destinations"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-10 h-10 text-red-400" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-8">What the Evidence Points To</h2>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  A source that has <span className="text-white font-medium">demonstrated its credibility</span> — across science, history, and prophecy — also makes a claim about the future that hasn't arrived yet.
                </p>

                <p className="text-lg text-slate-300 leading-relaxed mb-6">
                  It states that every human being is heading towards one of <span className="text-white font-semibold">two outcomes</span>:
                </p>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50 text-center">
                    <p className="text-emerald-300 font-bold text-lg mb-1">Paradise</p>
                    <p className="text-slate-400 text-sm">For those who recognise the evidence and submit willingly</p>
                  </div>
                  <div className="bg-red-900/30 rounded-xl p-5 border border-red-700/50 text-center">
                    <p className="text-red-300 font-bold text-lg mb-1">Hellfire</p>
                    <p className="text-slate-400 text-sm">For those who see the evidence and still turn away</p>
                  </div>
                </div>

                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  The same source also tells you exactly <span className="text-white font-medium">how to reach one and avoid the other</span>. It doesn't leave you guessing.
                </p>

                <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-600 mb-6">
                  <p className="text-slate-400 italic leading-relaxed text-center">
                    "Not a leaf falls but that He knows it."
                  </p>
                  <p className="text-slate-500 text-sm text-center mt-2">— Surah Al-An'am, 6:59</p>
                  <p className="text-slate-300 leading-relaxed mt-4">
                    The level of control and knowledge being described here is total. Not a single leaf falls in the darkest of nights without His knowledge and permission. If this is true — and the track record suggests it deserves serious consideration — then nothing in your life is random either.
                  </p>
                </div>

                <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
                  <p className="text-amber-200 leading-relaxed text-lg text-center">
                    The Almanac gave Biff an unfair advantage because he <span className="text-white font-semibold">trusted the source</span>.
                  </p>
                  <p className="text-amber-300 leading-relaxed text-center mt-3">
                    You've now examined the Qur'an's track record. The question is — what will you do with the information it gives you about what's coming next?
                  </p>
                </div>
              </div>

              <button
                onClick={onComplete}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
