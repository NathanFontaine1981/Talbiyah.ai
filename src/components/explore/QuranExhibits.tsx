import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, BookOpen, ChevronRight, Lock, Eye, CheckCircle2 } from 'lucide-react';

interface QuranExhibitsProps {
  onComplete: () => void;
}

interface Exhibit {
  id: string;
  label: string;
  title: string;
  verse: string;
  verseRef: string;
  arabicVerse: string;
  whatWasKnown: string;
  modernDiscovery: string;
  icon: string;
}

const exhibits: Exhibit[] = [
  {
    id: 'jugular-vein',
    label: 'Exhibit A',
    title: 'The Jugular Vein',
    verse: 'And We have already created man and know what his soul whispers to him, and We are closer to him than his jugular vein.',
    verseRef: 'Qaf 50:16',
    arabicVerse: 'وَلَقَدْ خَلَقْنَا الْإِنسَانَ وَنَعْلَمُ مَا تُوَسْوِسُ بِهِ نَفْسُهُ ۖ وَنَحْنُ أَقْرَبُ إِلَيْهِ مِنْ حَبْلِ الْوَرِيدِ',
    whatWasKnown: 'In 7th century Arabia, there was no detailed anatomical knowledge. No one was dissecting bodies or mapping the circulatory system.',
    modernDiscovery: 'The internal jugular vein runs right alongside the carotid artery in the neck — one of the closest major blood vessels to the surface of the body. The Quran chose this specific vein to describe ultimate closeness.',
    icon: '🔴',
  },
  {
    id: 'pain-receptors',
    label: 'Exhibit B',
    title: 'Pain Receptors in Skin',
    verse: 'Every time their skins are roasted through, We will replace them with other skins so they may taste the punishment.',
    verseRef: 'An-Nisa 4:56',
    arabicVerse: 'كُلَّمَا نَضِجَتْ جُلُودُهُم بَدَّلْنَاهُمْ جُلُودًا غَيْرَهَا لِيَذُوقُوا الْعَذَابَ',
    whatWasKnown: 'No understanding of nerve endings, sensory receptors, or why severe burns eventually stop hurting.',
    modernDiscovery: 'Pain receptors (nociceptors) are concentrated in the skin. Third-degree burns destroy these nerve endings, stopping pain. Replacing the skin literally resets the ability to feel pain. The Quran described this mechanism precisely.',
    icon: '🩹',
  },
  {
    id: 'fingerprints',
    label: 'Exhibit C',
    title: 'Unique Fingerprints',
    verse: 'Does man think that We will not assemble his bones? Yes, We are able to put together in perfect order the very tips of his fingers.',
    verseRef: 'Al-Qiyamah 75:3-4',
    arabicVerse: 'أَيَحْسَبُ الْإِنسَانُ أَلَّن نَّجْمَعَ عِظَامَهُ ۚ بَلَىٰ قَادِرِينَ عَلَىٰ أَن نُّسَوِّيَ بَنَانَهُ',
    whatWasKnown: 'Fingerprint uniqueness wasn\'t discovered until the late 19th century. Sir Francis Galton published his findings in 1892.',
    modernDiscovery: 'Every single human being has unique fingerprints — even identical twins. The Quran specifically highlighted the fingertips over 1300 years before forensic science confirmed their uniqueness.',
    icon: '👆',
  },
  {
    id: 'mountains-pegs',
    label: 'Exhibit D',
    title: 'Mountains as Pegs',
    verse: 'Have We not made the earth a resting place? And the mountains as stakes?',
    verseRef: 'An-Naba 78:6-7',
    arabicVerse: 'أَلَمْ نَجْعَلِ الْأَرْضَ مِهَادًا وَالْجِبَالَ أَوْتَادًا',
    whatWasKnown: 'Mountains were seen as solid masses sitting on flat ground. No knowledge of tectonic plates, continental drift, or what lies beneath the surface.',
    modernDiscovery: 'Modern geology confirms mountains have deep roots extending into the earth\'s mantle — like pegs or stakes. They stabilize tectonic plates and reduce seismic movement. The Quran used the exact analogy.',
    icon: '⛰️',
  },
  {
    id: 'expanding-universe',
    label: 'Exhibit E',
    title: 'The Expanding Universe',
    verse: 'And the heaven We constructed with strength, and indeed, We are its expander.',
    verseRef: 'Adh-Dhariyat 51:47',
    arabicVerse: 'وَالسَّمَاءَ بَنَيْنَاهَا بِأَيْدٍ وَإِنَّا لَمُوسِعُونَ',
    whatWasKnown: 'Until 1929, even the most advanced scientists believed the universe was static and unchanging. An expanding universe was unthinkable.',
    modernDiscovery: 'Edwin Hubble discovered in 1929 that the universe is expanding. This is now one of the foundational facts of modern cosmology. The Quran stated this over 1400 years earlier.',
    icon: '🌌',
  },
  {
    id: 'embryology',
    label: 'Exhibit F',
    title: 'Stages of the Embryo',
    verse: 'We created man from an extract of clay. Then We placed him as a sperm-drop in a firm lodging. Then We made the sperm-drop into a clinging clot, and We made the clot into a lump, and We made from the lump bones, and We covered the bones with flesh.',
    verseRef: 'Al-Mu\'minun 23:12-14',
    arabicVerse: 'وَلَقَدْ خَلَقْنَا الْإِنسَانَ مِن سُلَالَةٍ مِّن طِينٍ ثُمَّ جَعَلْنَاهُ نُطْفَةً فِي قَرَارٍ مَّكِينٍ',
    whatWasKnown: 'No microscopes existed. The stages of embryonic development were completely unknown. Many believed babies were preformed miniature humans from the start.',
    modernDiscovery: 'Modern embryology confirms the exact sequence: fertilization, implantation, embryo resembling a clinging clot, lump-like stage, skeleton formation, then muscles wrapping around bones. The Quran described this process with remarkable accuracy.',
    icon: '🧬',
  },
  {
    id: 'two-seas',
    label: 'Exhibit G',
    title: 'Two Seas That Don\'t Mix',
    verse: 'He released the two seas, meeting side by side. Between them is a barrier so neither of them transgresses.',
    verseRef: 'Ar-Rahman 55:19-20',
    arabicVerse: 'مَرَجَ الْبَحْرَيْنِ يَلْتَقِيَانِ بَيْنَهُمَا بَرْزَخٌ لَّا يَبْغِيَانِ',
    whatWasKnown: 'No underwater exploration existed. No knowledge of water density, salinity barriers, or what happens where rivers meet the ocean.',
    modernDiscovery: 'Modern oceanography confirms that where fresh and salt water meet, a visible barrier called a halocline forms. The waters don\'t fully mix due to differences in density and salinity — exactly as the Quran described.',
    icon: '🌊',
  },
];

type ExhibitPhase = 'locked' | 'verse' | 'context' | 'discovery' | 'complete';

export default function QuranExhibits({ onComplete }: QuranExhibitsProps) {
  const [currentExhibit, setCurrentExhibit] = useState<string | null>(null);
  const [exhibitPhases, setExhibitPhases] = useState<Record<string, ExhibitPhase>>({});
  const [completedExhibits, setCompletedExhibits] = useState<Set<string>>(new Set());

  const allCompleted = completedExhibits.size === exhibits.length;
  const viewedExhibit = currentExhibit ? exhibits.find(e => e.id === currentExhibit) : null;
  const currentPhase = currentExhibit ? (exhibitPhases[currentExhibit] || 'verse') : 'locked';

  function openExhibit(id: string) {
    setCurrentExhibit(id);
    if (!exhibitPhases[id]) {
      setExhibitPhases(prev => ({ ...prev, [id]: 'verse' }));
    }
  }

  function advancePhase() {
    if (!currentExhibit) return;
    const phase = exhibitPhases[currentExhibit] || 'verse';
    if (phase === 'verse') {
      setExhibitPhases(prev => ({ ...prev, [currentExhibit]: 'context' }));
    } else if (phase === 'context') {
      setExhibitPhases(prev => ({ ...prev, [currentExhibit]: 'discovery' }));
    } else if (phase === 'discovery') {
      setExhibitPhases(prev => ({ ...prev, [currentExhibit]: 'complete' }));
      setCompletedExhibits(prev => new Set(prev).add(currentExhibit));
      setCurrentExhibit(null);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          {/* Exhibit List View */}
          {!currentExhibit && (
            <motion.div
              key="list"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-6">
                <div className="flex justify-center mb-4">
                  <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center">
                    <BookOpen className="w-8 h-8 text-amber-400" />
                  </div>
                </div>
                <h1 className="text-3xl font-serif text-white mb-2">The Exhibits</h1>
                <p className="text-slate-400 text-sm">
                  Tap each exhibit to examine the evidence. {completedExhibits.size} of {exhibits.length} reviewed.
                </p>
              </div>

              <div className="space-y-3 mb-8">
                {exhibits.map((exhibit) => {
                  const isComplete = completedExhibits.has(exhibit.id);
                  const isStarted = !!exhibitPhases[exhibit.id];

                  return (
                    <motion.button
                      key={exhibit.id}
                      onClick={() => openExhibit(exhibit.id)}
                      disabled={isComplete}
                      className={`w-full text-left rounded-xl border transition-all ${
                        isComplete
                          ? 'bg-emerald-900/20 border-emerald-700/40 opacity-70'
                          : isStarted
                          ? 'bg-amber-900/20 border-amber-700/40 hover:bg-amber-900/30'
                          : 'bg-slate-900/50 border-slate-700 hover:border-slate-500 hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="p-4 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 ${
                          isComplete
                            ? 'bg-emerald-900/30'
                            : 'bg-slate-800/80'
                        }`}>
                          {isComplete ? (
                            <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                          ) : (
                            <span>{exhibit.icon}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-medium mb-0.5 ${
                            isComplete ? 'text-emerald-500' : 'text-amber-500'
                          }`}>
                            {exhibit.label}
                          </p>
                          <p className={`font-medium ${isComplete ? 'text-slate-500' : 'text-white'}`}>
                            {exhibit.title}
                          </p>
                          {isComplete && (
                            <p className="text-emerald-500 text-xs mt-0.5">Evidence reviewed</p>
                          )}
                        </div>
                        {!isComplete && (
                          <div className="flex items-center gap-1 text-slate-500">
                            <Eye className="w-4 h-4" />
                            <ChevronRight className="w-4 h-4" />
                          </div>
                        )}
                      </div>
                    </motion.button>
                  );
                })}
              </div>

              {allCompleted && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50 mb-6">
                    <p className="text-emerald-200 text-lg leading-relaxed">
                      You've examined all the evidence. Each of these facts was stated in a book from <span className="text-white font-semibold">1400 years ago</span> — long before any human could have known them.
                    </p>
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
            </motion.div>
          )}

          {/* Exhibit Detail View */}
          {viewedExhibit && (
            <motion.div
              key={`exhibit-${viewedExhibit.id}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
            >
              <div className="text-center mb-6">
                <p className="text-amber-500 text-sm font-medium mb-1">{viewedExhibit.label}</p>
                <h2 className="text-2xl font-serif text-white flex items-center justify-center gap-3">
                  <span className="text-3xl">{viewedExhibit.icon}</span>
                  {viewedExhibit.title}
                </h2>
              </div>

              {/* The Verse — always shown */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 border border-slate-700 mb-4"
              >
                <p className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-3">
                  What the Quran says
                </p>
                <p className="text-white/80 font-arabic text-lg text-center mb-3 leading-loose" dir="rtl">
                  {viewedExhibit.arabicVerse}
                </p>
                <p className="text-white leading-relaxed text-center italic">
                  "{viewedExhibit.verse}"
                </p>
                <p className="text-amber-400/70 text-center text-xs mt-2">
                  — {viewedExhibit.verseRef}
                </p>
              </motion.div>

              {/* Context — shown after first tap */}
              <AnimatePresence>
                {(currentPhase === 'context' || currentPhase === 'discovery' || currentPhase === 'complete') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    className="bg-amber-900/20 rounded-2xl p-6 border border-amber-700/30 mb-4"
                  >
                    <p className="text-amber-500 text-xs font-medium uppercase tracking-wider mb-3">
                      What was known 1400 years ago
                    </p>
                    <p className="text-amber-200/80 leading-relaxed">
                      {viewedExhibit.whatWasKnown}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Modern Discovery — shown after second tap */}
              <AnimatePresence>
                {(currentPhase === 'discovery' || currentPhase === 'complete') && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, height: 0 }}
                    animate={{ opacity: 1, y: 0, height: 'auto' }}
                    className="bg-emerald-900/20 rounded-2xl p-6 border border-emerald-700/30 mb-4"
                  >
                    <p className="text-emerald-500 text-xs font-medium uppercase tracking-wider mb-3">
                      What modern science confirms
                    </p>
                    <p className="text-emerald-200/80 leading-relaxed">
                      {viewedExhibit.modernDiscovery}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Action Button */}
              <div className="flex justify-center mt-6">
                <button
                  onClick={advancePhase}
                  className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
                >
                  {currentPhase === 'verse' && (
                    <>What was known then? <ChevronRight className="w-5 h-5" /></>
                  )}
                  {currentPhase === 'context' && (
                    <>What do we know now? <ChevronRight className="w-5 h-5" /></>
                  )}
                  {currentPhase === 'discovery' && (
                    <>Back to Exhibits <ArrowRight className="w-5 h-5" /></>
                  )}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
