import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Search, UserX, UserCheck, Check, X, Brain } from 'lucide-react';

interface ReasoningTestProps {
  onComplete: () => void;
}

interface Suspect {
  id: string;
  name: string;
  clue: string;
  detail: string;
  answer: 'eliminate'; // all are either clearly eliminate or clearly possible
  isGuiltyCandidate: boolean; // true = should be kept as "Possible"
}

const suspects: Suspect[] = [
  {
    id: 'A',
    name: 'Suspect A',
    clue: 'Born in 2001',
    detail: 'This person wasn\'t even born when the robbery took place in 2000.',
    answer: 'eliminate',
    isGuiltyCandidate: false,
  },
  {
    id: 'B',
    name: 'Suspect B',
    clue: 'Lived in Jamaica — never been to England',
    detail: 'This person has never set foot in the country where the robbery happened.',
    answer: 'eliminate',
    isGuiltyCandidate: false,
  },
  {
    id: 'C',
    name: 'Suspect C',
    clue: 'Was in hospital in a coma during the robbery',
    detail: 'Medical records confirm this person was unconscious in hospital at the time.',
    answer: 'eliminate',
    isGuiltyCandidate: false,
  },
  {
    id: 'D',
    name: 'Suspect D',
    clue: 'Born 1980, lived in London, had prior convictions',
    detail: 'This person was 20 years old, lived in the same city, and has a criminal record.',
    answer: 'eliminate',
    isGuiltyCandidate: true,
  },
  {
    id: 'E',
    name: 'Suspect E',
    clue: 'Born 1975, lived in London, worked near the location',
    detail: 'This person was 25 years old, lived in the same city, and worked close to the scene.',
    answer: 'eliminate',
    isGuiltyCandidate: true,
  },
  {
    id: 'F',
    name: 'Suspect F',
    clue: 'Died in 1998 — two years before the robbery',
    detail: 'This person passed away before the robbery even took place.',
    answer: 'eliminate',
    isGuiltyCandidate: false,
  },
];

type Phase = 'setup' | 'investigate' | 'summary';

export default function ReasoningTest({ onComplete }: ReasoningTestProps) {
  const [phase, setPhase] = useState<Phase>('setup');
  const [revealedSuspect, setRevealedSuspect] = useState<string | null>(null);
  const [decisions, setDecisions] = useState<Record<string, 'eliminate' | 'possible'>>({});

  const allDecided = Object.keys(decisions).length === suspects.length;
  const correctEliminationsCount = suspects.filter(
    s => !s.isGuiltyCandidate && decisions[s.id] === 'eliminate'
  ).length;
  const correctKeepsCount = suspects.filter(
    s => s.isGuiltyCandidate && decisions[s.id] === 'possible'
  ).length;
  const totalCorrect = correctEliminationsCount + correctKeepsCount;

  const handleDecision = (suspectId: string, decision: 'eliminate' | 'possible') => {
    setDecisions(prev => ({ ...prev, [suspectId]: decision }));
    setRevealedSuspect(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {/* Setup Phase */}
          {phase === 'setup' && (
            <motion.div
              key="setup"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <Search className="w-10 h-10 text-amber-400" />
                </div>
              </div>

              <h1 className="text-3xl font-serif text-white mb-8">The Reasoning Test</h1>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  A robbery happened in <span className="text-white font-medium">London</span> in the <span className="text-white font-medium">year 2000</span>.
                </p>

                <p className="text-lg text-slate-300 leading-relaxed mb-4">
                  There are <span className="text-amber-400 font-medium">6 suspects</span>. Your job is to look at the evidence for each one and decide:
                </p>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-red-900/30 rounded-lg p-3 border border-red-700/50 text-center">
                    <UserX className="w-6 h-6 text-red-400 mx-auto mb-1" />
                    <p className="text-red-300 text-sm font-medium">Eliminate</p>
                    <p className="text-slate-500 text-xs">Impossible — rule them out</p>
                  </div>
                  <div className="bg-emerald-900/30 rounded-lg p-3 border border-emerald-700/50 text-center">
                    <UserCheck className="w-6 h-6 text-emerald-400 mx-auto mb-1" />
                    <p className="text-emerald-300 text-sm font-medium">Possible</p>
                    <p className="text-slate-500 text-xs">Could be them — keep them in</p>
                  </div>
                </div>

                <p className="text-slate-400 leading-relaxed">
                  Use <span className="text-white">logic and evidence</span> to narrow it down.
                </p>
              </div>

              <button
                onClick={() => setPhase('investigate')}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
              >
                Start Investigating
                <Search className="w-5 h-5" />
              </button>
            </motion.div>
          )}

          {/* Investigation Phase */}
          {phase === 'investigate' && (
            <motion.div
              key="investigate"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-6">
                <h2 className="text-2xl font-serif text-white mb-2">Investigate the Suspects</h2>
                <p className="text-slate-400 text-sm">
                  Robbery in London, year 2000. Tap each suspect to see their info.
                </p>
                <p className="text-amber-400 text-sm mt-1">
                  {Object.keys(decisions).length} of {suspects.length} decided
                </p>
              </div>

              <div className="grid gap-3 mb-8">
                {suspects.map((suspect) => {
                  const decided = decisions[suspect.id];
                  const isRevealed = revealedSuspect === suspect.id;

                  return (
                    <motion.div
                      key={suspect.id}
                      layout
                      className={`rounded-xl border transition-all ${
                        decided === 'eliminate'
                          ? 'bg-red-900/20 border-red-700/50 opacity-60'
                          : decided === 'possible'
                          ? 'bg-emerald-900/20 border-emerald-700/50'
                          : 'bg-slate-900/50 border-slate-700 hover:border-slate-500'
                      }`}
                    >
                      {/* Suspect header — always visible */}
                      <button
                        onClick={() => {
                          if (!decided) {
                            setRevealedSuspect(isRevealed ? null : suspect.id);
                          }
                        }}
                        className="w-full p-4 text-left flex items-center gap-3"
                        disabled={!!decided}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                          decided === 'eliminate'
                            ? 'bg-red-900/50 text-red-400'
                            : decided === 'possible'
                            ? 'bg-emerald-900/50 text-emerald-400'
                            : 'bg-slate-800 text-white'
                        }`}>
                          {decided === 'eliminate' ? <X className="w-5 h-5" /> :
                           decided === 'possible' ? <Check className="w-5 h-5" /> :
                           suspect.id}
                        </div>

                        <div className="flex-1">
                          <p className={`font-medium ${decided ? 'text-slate-500' : 'text-white'}`}>
                            {suspect.name}
                          </p>
                          {decided ? (
                            <p className={`text-sm ${decided === 'eliminate' ? 'text-red-400' : 'text-emerald-400'}`}>
                              {decided === 'eliminate' ? 'Eliminated' : 'Possible suspect'}
                            </p>
                          ) : (
                            <p className="text-slate-500 text-sm">
                              {isRevealed ? suspect.clue : 'Tap to investigate'}
                            </p>
                          )}
                        </div>

                        {!decided && !isRevealed && (
                          <Search className="w-4 h-4 text-slate-500" />
                        )}
                      </button>

                      {/* Expanded clue + decision buttons */}
                      <AnimatePresence>
                        {isRevealed && !decided && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="overflow-hidden"
                          >
                            <div className="px-4 pb-4 space-y-3">
                              <div className="bg-slate-800/80 rounded-lg p-3 border border-slate-600">
                                <p className="text-amber-400 font-medium text-sm mb-1">Evidence:</p>
                                <p className="text-slate-300 text-sm">{suspect.clue}</p>
                                <p className="text-slate-400 text-xs mt-1">{suspect.detail}</p>
                              </div>

                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleDecision(suspect.id, 'eliminate')}
                                  className="flex-1 py-2.5 bg-red-900/40 hover:bg-red-900/60 border border-red-700/50 text-red-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
                                >
                                  <UserX className="w-4 h-4" />
                                  Eliminate
                                </button>
                                <button
                                  onClick={() => handleDecision(suspect.id, 'possible')}
                                  className="flex-1 py-2.5 bg-emerald-900/40 hover:bg-emerald-900/60 border border-emerald-700/50 text-emerald-300 rounded-lg text-sm font-medium transition flex items-center justify-center gap-1.5"
                                >
                                  <UserCheck className="w-4 h-4" />
                                  Possible
                                </button>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>

              {allDecided && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <button
                    onClick={() => setPhase('summary')}
                    className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
                  >
                    See Your Results
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Summary Phase */}
          {phase === 'summary' && (
            <motion.div
              key="summary"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <Brain className="w-10 h-10 text-emerald-400" />
                </div>
              </div>

              <h2 className="text-2xl font-serif text-white mb-8">Your Results</h2>

              <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8 text-left">
                {/* Results breakdown */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-red-900/20 rounded-lg p-3 border border-red-700/50 text-center">
                    <p className="text-2xl font-bold text-red-400">
                      {Object.values(decisions).filter(d => d === 'eliminate').length}
                    </p>
                    <p className="text-red-300 text-sm">Eliminated</p>
                  </div>
                  <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-700/50 text-center">
                    <p className="text-2xl font-bold text-emerald-400">
                      {Object.values(decisions).filter(d => d === 'possible').length}
                    </p>
                    <p className="text-emerald-300 text-sm">Possible</p>
                  </div>
                </div>

                {totalCorrect >= 5 ? (
                  <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50 mb-4">
                    <p className="text-emerald-200 leading-relaxed text-lg">
                      You narrowed it down using <span className="text-white font-semibold">evidence and elimination</span>.
                    </p>
                  </div>
                ) : (
                  <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50 mb-4">
                    <p className="text-amber-200 leading-relaxed">
                      The key suspects were <span className="text-white font-semibold">D</span> and <span className="text-white font-semibold">E</span> — they were the right age, in the right place, with no alibis. The rest could be ruled out with evidence.
                    </p>
                  </div>
                )}

                <div className="space-y-2 mb-6">
                  {suspects.map(s => (
                    <div key={s.id} className="flex items-center gap-2 text-sm">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                        s.isGuiltyCandidate ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'
                      }`}>
                        {s.id}
                      </span>
                      <span className="text-slate-400 flex-1">{s.clue}</span>
                      <span className={`text-xs font-medium ${
                        s.isGuiltyCandidate ? 'text-emerald-400' : 'text-red-400'
                      }`}>
                        {s.isGuiltyCandidate ? 'Possible' : 'Rule out'}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-slate-700 pt-4">
                  <p className="text-lg text-white leading-relaxed mb-3">
                    You didn't guess. You didn't go with your gut feeling.
                  </p>
                  <p className="text-lg text-slate-300 leading-relaxed">
                    You used <span className="text-amber-400 font-semibold">evidence</span> to eliminate what's impossible and narrow down to what's possible.
                  </p>
                </div>

                <div className="border-t border-slate-700 pt-4 mt-4">
                  <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50 mb-4">
                    <p className="text-amber-200 leading-relaxed text-lg text-center">
                      This is exactly how we should approach the biggest question of all:
                    </p>
                    <p className="text-3xl text-white font-bold text-center mt-3">
                      Why are we here?
                    </p>
                  </div>

                  <p className="text-lg text-slate-300 leading-relaxed mb-3">
                    You've already agreed that you exist, you had a beginning, and you're going to die. You've just proved you can think critically.
                  </p>

                  <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
                    <p className="text-emerald-200 leading-relaxed">
                      Now let's apply the <span className="text-white font-semibold">same method</span> you just used to life's biggest question.
                    </p>
                  </div>
                </div>
              </div>

              <button
                onClick={onComplete}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2 mx-auto"
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
