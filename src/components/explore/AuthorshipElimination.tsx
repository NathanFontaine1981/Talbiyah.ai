import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ChevronRight, X, UserX, CheckCircle2 } from 'lucide-react';

interface AuthorshipEliminationProps {
  onComplete: () => void;
}

interface Suspect {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  theCase: string;
  evidenceAgainst: string[];
  elimination: string;
}

const suspects: Suspect[] = [
  {
    id: 'muhammad',
    icon: '👤',
    title: 'Muhammad Himself',
    subtitle: 'Could the Prophet have authored it?',
    theCase: 'As the one who recited the Quran, some might suggest Muhammad wrote it himself.',
    evidenceAgainst: [
      'He was illiterate — he could not read or write. This is confirmed in both Islamic and non-Islamic historical records.',
      'He was a shepherd and trader with no formal education, no access to scientific instruments, microscopes, or astronomical tools.',
      'The Quran challenged the greatest Arab poets of his time, and none could match even a single chapter.',
      'He gained no wealth or power from it — he died with barely any possessions, having given everything away.',
      'He could not have known about embryology, the expanding universe, fingerprint uniqueness, or ocean barriers.',
    ],
    elimination: 'An illiterate man in 7th century Arabia, with no scientific tools or formal education, could not have produced a book containing knowledge that wouldn\'t be discovered for over a thousand years.',
  },
  {
    id: 'arabs',
    icon: '🖋️',
    title: 'Other Arabs or Poets',
    subtitle: 'Could the poets of his time have written it?',
    theCase: 'Arabia was known for its master poets. Perhaps another skilled writer composed the Quran.',
    evidenceAgainst: [
      'The Quran itself challenged anyone to produce even one chapter like it (Surah Al-Baqarah 2:23). 1400 years later, no one has met that challenge.',
      'The greatest Arab poets of the time acknowledged its linguistic superiority — it was unlike anything they had ever heard.',
      'No contemporary had scientific knowledge beyond their era — no one knew about embryonic stages, expanding universes, or deep-sea barriers.',
      'The Quran\'s style is entirely unique — it\'s neither poetry nor prose, but something that has never been replicated. Even the most advanced AI models today, trained on the entire internet, cannot produce anything that matches its linguistic structure, rhythm, and meaning simultaneously.',
    ],
    elimination: 'If the best poets in history couldn\'t match its language, and the most powerful technology humanity has ever built still can\'t replicate it, no human — past or present — could have written it.',
  },
  {
    id: 'scholars',
    icon: '📜',
    title: 'Later Scholars Who Edited It',
    subtitle: 'Could it have been altered over time?',
    theCase: 'Perhaps the Quran was modified by later scholars who inserted scientific knowledge after the fact.',
    evidenceAgainst: [
      'The Quran was memorised word-for-word by thousands of people during Muhammad\'s own lifetime — a living chain of preservation. It was compiled into a single written text within 2 years of his death, and every copy on Earth is letter-for-letter identical.',
      'Compare this to previous scriptures. The Torah was given to Moses as written scripture, but was lost, rewritten, and edited over centuries by different hands. The Gospel was the spoken word of Jesus — never written down in his lifetime. Decades later, various scribes wrote their own accounts from memory, and naturally their versions contradicted each other.',
      'The Quran itself addresses this directly. It says: "Indeed, it is We who sent down the Reminder, and indeed, We will be its Guardian." (Al-Hijr 15:9). Every previous revelation was sent for a specific people at a specific time — and none were promised divine protection. The Quran, as the final and complete revelation, was.',
      'This promise has been fulfilled. 1400 years, billions of copies, every continent — not a single letter has changed. The preservation itself is a sign.',
    ],
    elimination: 'No opportunity to alter the Quran ever existed. But more than that — its perfect preservation across 1400 years is itself a fulfilled prophecy. The Quran promised it would be guarded, and it has been — unlike any scripture before it.',
  },
  {
    id: 'bible',
    icon: '📖',
    title: 'Borrowed from the Bible or Torah',
    subtitle: 'Could it have been copied from earlier scriptures?',
    theCase: 'The Quran shares some stories with the Bible and Torah. Perhaps Muhammad copied from them.',
    evidenceAgainst: [
      'The Quran corrects specific errors found in the Bible — for example, it states that Pharaoh\'s body would be preserved. The Bible doesn\'t mention this, yet the mummy was discovered in 1898.',
      'Many scientific details in the Quran appear in no previous scripture — the expanding universe, embryonic stages, and ocean barriers are found nowhere in the Bible or Torah.',
      'Where the Quran and Bible differ on scientific matters, modern science consistently sides with the Quran.',
      'Muhammad had no known access to, or ability to read, previous scriptures — he was illiterate and the Bible had not been translated into Arabic.',
    ],
    elimination: 'The Quran contains unique knowledge not found in any prior text, and corrects previous scriptures where they diverge from science. It cannot be a copy.',
  },
  {
    id: 'coincidence',
    icon: '🎲',
    title: 'A Lucky Guess',
    subtitle: 'Could it all be coincidence?',
    theCase: 'Perhaps Muhammad made random claims and some happened to be correct by chance.',
    evidenceAgainst: [
      'One correct guess is luck. But ten precise scientific claims across embryology, cosmology, oceanography, geology, anatomy, forensics, and history? That\'s not luck.',
      'Zero contradictions across 6,236 verses revealed over 23 years — on topics ranging from law to science to prophecy.',
      'The probability of guessing all of these correctly, across so many unrelated fields, is statistically impossible.',
      'Each claim is not vague — they are specific, detailed, and have been confirmed with precision by modern instruments.',
    ],
    elimination: 'The consistency and precision across so many different scientific fields, with zero errors across thousands of verses, rules out chance entirely.',
  },
];

export default function AuthorshipElimination({ onComplete }: AuthorshipEliminationProps) {
  const [viewingSuspect, setViewingSuspect] = useState<string | null>(null);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [showConclusion, setShowConclusion] = useState(false);

  const allEliminated = eliminated.size === suspects.length;
  const activeSuspect = viewingSuspect ? suspects.find(s => s.id === viewingSuspect) : null;

  function openSuspect(id: string) {
    if (!eliminated.has(id)) {
      setViewingSuspect(id);
    }
  }

  function eliminateSuspect() {
    if (!viewingSuspect) return;
    const newEliminated = new Set(eliminated);
    newEliminated.add(viewingSuspect);
    setEliminated(newEliminated);
    setViewingSuspect(null);

    if (newEliminated.size === suspects.length) {
      setTimeout(() => setShowConclusion(true), 600);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {/* Conclusion Panel */}
          {showConclusion && (
            <motion.div
              key="conclusion"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', delay: 0.3 }}
                  className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center"
                >
                  <span className="text-4xl">🔍</span>
                </motion.div>
              </div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-3xl font-serif text-white mb-6"
              >
                Every Possibility Examined
              </motion.h2>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-amber-700/50 mb-8"
              >
                <p className="text-xl text-amber-200 leading-relaxed mb-4">
                  Every human possibility has been examined and eliminated.
                </p>
                <p className="text-lg text-slate-300 leading-relaxed">
                  If no human could have authored it — and the evidence confirms it contains knowledge no human possessed — then only one possibility remains.
                </p>
              </motion.div>

              {/* Eliminated summary */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.1 }}
                className="flex flex-wrap justify-center gap-2 mb-8"
              >
                {suspects.map(s => (
                  <span
                    key={s.id}
                    className="px-3 py-1.5 bg-red-900/30 border border-red-700/40 rounded-full text-red-400 text-sm flex items-center gap-1.5"
                  >
                    <UserX className="w-3.5 h-3.5" />
                    {s.title}
                  </span>
                ))}
              </motion.div>

              <motion.button
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.4 }}
                onClick={onComplete}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </motion.button>
            </motion.div>
          )}

          {/* Suspect Detail View */}
          {activeSuspect && !showConclusion && (
            <motion.div
              key={`suspect-${activeSuspect.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="flex items-center justify-between mb-6">
                <button
                  onClick={() => setViewingSuspect(null)}
                  className="flex items-center gap-1 text-slate-400 hover:text-white transition"
                >
                  <X className="w-5 h-5" />
                  <span className="text-sm">Close</span>
                </button>
                <span className="text-slate-500 text-sm">
                  {eliminated.size} of {suspects.length} eliminated
                </span>
              </div>

              <div className="text-center mb-6">
                <span className="text-4xl mb-3 block">{activeSuspect.icon}</span>
                <h2 className="text-2xl font-serif text-white">{activeSuspect.title}</h2>
                <p className="text-slate-400 text-sm mt-1">{activeSuspect.subtitle}</p>
              </div>

              {/* The Case */}
              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-700 mb-4">
                <p className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-3">
                  The Case
                </p>
                <p className="text-white/80 leading-relaxed">
                  {activeSuspect.theCase}
                </p>
              </div>

              {/* The Evidence Against */}
              <div className="bg-red-900/15 rounded-2xl p-6 border border-red-700/30 mb-4">
                <p className="text-red-400 text-xs font-medium uppercase tracking-wider mb-4">
                  The Evidence Against
                </p>
                <div className="space-y-3">
                  {activeSuspect.evidenceAgainst.map((point, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * i }}
                      className="flex gap-3"
                    >
                      <span className="text-red-500 mt-1 flex-shrink-0">
                        <X className="w-4 h-4" />
                      </span>
                      <p className="text-red-200/80 text-sm leading-relaxed">{point}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Elimination Summary */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-slate-800/50 rounded-2xl p-6 border border-slate-600/30 mb-6"
              >
                <p className="text-slate-300 leading-relaxed text-sm italic">
                  {activeSuspect.elimination}
                </p>
              </motion.div>

              {/* Eliminate Button */}
              <div className="flex justify-center">
                <button
                  onClick={eliminateSuspect}
                  className="px-8 py-4 bg-red-700 hover:bg-red-600 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
                >
                  <UserX className="w-5 h-5" />
                  Eliminate
                </button>
              </div>
            </motion.div>
          )}

          {/* Suspect List View */}
          {!viewingSuspect && !showConclusion && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <span className="text-3xl">⚖️</span>
                  </div>
                </div>
                <h1 className="text-3xl font-serif text-white mb-2">The Author</h1>
                <p className="text-slate-400 text-sm leading-relaxed max-w-md mx-auto">
                  If the Quran contains knowledge no human had — who wrote it?
                  <br />
                  Examine every possibility. Eliminate them one by one.
                </p>
                <p className="text-slate-500 text-xs mt-2">
                  {eliminated.size} of {suspects.length} examined
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {suspects.map((suspect) => {
                  const isEliminated = eliminated.has(suspect.id);

                  return (
                    <motion.button
                      key={suspect.id}
                      onClick={() => openSuspect(suspect.id)}
                      disabled={isEliminated}
                      className={`w-full text-left rounded-xl border transition-all ${
                        isEliminated
                          ? 'bg-red-900/10 border-red-800/30 opacity-60'
                          : 'bg-slate-900/50 border-slate-700 hover:border-amber-600/50 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                          isEliminated
                            ? 'bg-red-900/20'
                            : 'bg-slate-800/80'
                        }`}>
                          {isEliminated ? (
                            <UserX className="w-6 h-6 text-red-500" />
                          ) : (
                            <span>{suspect.icon}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`font-medium ${isEliminated ? 'text-red-400/60 line-through' : 'text-white'}`}>
                            {suspect.title}
                          </p>
                          <p className={`text-xs mt-0.5 ${isEliminated ? 'text-red-500/50' : 'text-slate-500'}`}>
                            {isEliminated ? 'Eliminated' : suspect.subtitle}
                          </p>
                        </div>
                        {!isEliminated && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <ChevronRight className="w-5 h-5" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {allEliminated && !showConclusion && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <button
                    onClick={() => setShowConclusion(true)}
                    className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
                  >
                    See the Conclusion
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
