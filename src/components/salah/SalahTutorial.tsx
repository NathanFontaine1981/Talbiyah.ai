import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Brain,
  Play,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Moon,
  Volume2,
  VolumeX,
  ChevronDown,
  ExternalLink
} from 'lucide-react';
import { salahPositions, getPositionsByOrder } from '../../data/salahData';
import LearnMode from './LearnMode';
import QuizMode from './QuizMode';
import PracticeMode from './PracticeMode';
import PrayNowMode from './PrayNowMode';

interface SalahTutorialProps {
  onComplete?: () => void;
  onBack?: () => void;
  standalone?: boolean;
}

type GameMode = 'intro' | 'learn' | 'quiz' | 'practice' | 'pray' | 'complete';

const STORAGE_KEY = 'talbiyah_salah_progress';

// Define learning sections with color coding
interface SalahSection {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  color: string;
  bgColor: string;
  borderColor: string;
  iconBg: string;
  positionIds: string[];
  icon: string;
}

const SALAH_SECTIONS: SalahSection[] = [
  {
    id: 'section-1',
    title: 'Getting Ready',
    subtitle: 'Starting your prayer',
    description: 'Begin with intention and enter the sacred state',
    color: 'text-emerald-700',
    bgColor: 'bg-emerald-50',
    borderColor: 'border-emerald-200',
    iconBg: 'bg-emerald-100',
    positionIds: ['takbir-opening', 'standing-opening', 'standing-taawwudh', 'standing-basmala'],
    icon: '🙌'
  },
  {
    id: 'section-2',
    title: 'Recitation',
    subtitle: 'Standing & reading Quran',
    description: 'Al-Fatiha is mandatory - the most important surah',
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
    borderColor: 'border-blue-200',
    iconBg: 'bg-blue-100',
    positionIds: ['standing-fatiha', 'standing-ameen'],
    icon: '📖'
  },
  {
    id: 'section-surah',
    title: 'Additional Surah',
    subtitle: 'Your choice of Quran',
    description: 'After Fatiha, recite any surah you know - start with Al-Kawthar or Al-Ikhlas',
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
    borderColor: 'border-cyan-200',
    iconBg: 'bg-cyan-100',
    positionIds: ['standing-kawthar', 'standing-ikhlas'],
    icon: '🌟'
  },
  {
    id: 'section-3',
    title: 'Bowing (Ruku)',
    subtitle: 'Humbling before Allah',
    description: 'Bow in submission and praise your Lord',
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
    borderColor: 'border-amber-200',
    iconBg: 'bg-amber-100',
    positionIds: ['takbir-to-ruku', 'ruku', 'rising-from-ruku'],
    icon: '🙇'
  },
  {
    id: 'section-4',
    title: 'Prostration (Sujood)',
    subtitle: 'Closest to Allah',
    description: 'The position where you are nearest to your Creator',
    color: 'text-purple-700',
    bgColor: 'bg-purple-50',
    borderColor: 'border-purple-200',
    iconBg: 'bg-purple-100',
    positionIds: ['takbir-to-first-sujood', 'sujood', 'takbir-from-sujood', 'sitting-between-sujood', 'takbir-to-sujood'],
    icon: '🤲'
  },
  {
    id: 'section-5',
    title: 'Completion',
    subtitle: 'Finishing your prayer',
    description: 'Bear witness, send blessings, and conclude with peace',
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
    borderColor: 'border-rose-200',
    iconBg: 'bg-rose-100',
    positionIds: ['tashahhud', 'salawat', 'tasleem'],
    icon: '✨'
  }
];

interface SalahProgress {
  mode: GameMode;
  completedPositions: string[];
  quizScores: Record<string, number>;
  practiceCompleted: boolean;
  xpEarned: number;
}

export default function SalahTutorial({ onComplete, onBack, standalone = true }: SalahTutorialProps) {
  const [mode, setMode] = useState<GameMode>('intro');
  const [completedPositions, setCompletedPositions] = useState<string[]>([]);
  const [quizScores, setQuizScores] = useState<Record<string, number>>({});
  const [practiceCompleted, setPracticeCompleted] = useState(false);
  const [xpEarned, setXpEarned] = useState(0);
  const [initialPositionId, setInitialPositionId] = useState<string | undefined>(undefined);
  const [expandedPositionId, setExpandedPositionId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const speechSynthRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Play Arabic audio using Web Speech API
  const playAudio = (text: string, recitationId: string) => {
    // Stop any current audio
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }

    if (playingAudioId === recitationId) {
      setPlayingAudioId(null);
      return;
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.8; // Slower for learning
    utterance.pitch = 1;

    // Find Arabic voice if available
    const voices = window.speechSynthesis.getVoices();
    const arabicVoice = voices.find(v => v.lang.startsWith('ar'));
    if (arabicVoice) {
      utterance.voice = arabicVoice;
    }

    utterance.onend = () => setPlayingAudioId(null);
    utterance.onerror = () => setPlayingAudioId(null);

    speechSynthRef.current = utterance;
    setPlayingAudioId(recitationId);
    window.speechSynthesis.speak(utterance);
  };

  // Stop audio when leaving intro mode
  useEffect(() => {
    return () => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    };
  }, [mode]);

  // Load progress from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const progress: SalahProgress = JSON.parse(saved);
        setCompletedPositions(progress.completedPositions || []);
        setQuizScores(progress.quizScores || {});
        setPracticeCompleted(progress.practiceCompleted || false);
        setXpEarned(progress.xpEarned || 0);
        // Don't restore mode - always start fresh on intro
      } catch (e) {
        console.error('Failed to load salah progress:', e);
      }
    }
  }, []);

  // Save progress to localStorage
  useEffect(() => {
    const progress: SalahProgress = {
      mode,
      completedPositions,
      quizScores,
      practiceCompleted,
      xpEarned
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [mode, completedPositions, quizScores, practiceCompleted, xpEarned]);

  const totalPositions = salahPositions.length;
  const learnProgress = Math.round((completedPositions.length / totalPositions) * 100);

  const handlePositionComplete = (positionId: string) => {
    if (!completedPositions.includes(positionId)) {
      setCompletedPositions(prev => [...prev, positionId]);
      setXpEarned(prev => prev + 50);
    }
  };

  const handleQuizComplete = (score: number, quizType: string) => {
    setQuizScores(prev => ({ ...prev, [quizType]: score }));
    setXpEarned(prev => prev + score);
  };

  const handlePracticeComplete = () => {
    setPracticeCompleted(true);
    setXpEarned(prev => prev + 200);
  };

  const resetProgress = () => {
    setCompletedPositions([]);
    setQuizScores({});
    setPracticeCompleted(false);
    setXpEarned(0);
    setMode('intro');
    localStorage.removeItem(STORAGE_KEY);
  };

  // Position icons mapping
  const positionIcons: Record<string, string> = {
    'hands-raised': '🙌',
    'standing': '🧍',
    'bowing': '🙇',
    'prostrating': '🤲',
    'sitting': '🧘'
  };

  const positions = getPositionsByOrder();

  // Intro Screen
  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        {onBack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <button
              onClick={onBack}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
            </button>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 mb-8 text-white"
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="text-4xl">🕌</span>
                <h1 className="text-2xl md:text-3xl font-bold">Learn Salah</h1>
              </div>
              <p className="text-white/80 font-arabic text-lg">الصلاة</p>
              <p className="text-white/70 text-sm mt-2 max-w-lg">
                Transform your prayer into a meaningful conversation with your Creator
              </p>
            </div>

            <div className="flex-shrink-0 text-center">
              <div className="w-20 h-20 bg-white/20 rounded-2xl flex items-center justify-center mx-auto mb-2">
                <span className="text-3xl font-bold">{learnProgress}%</span>
              </div>
              <p className="text-white/80 text-sm">{completedPositions.length}/{totalPositions} Steps</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-4">
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-500"
                style={{ width: `${learnProgress}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Color-Coded Learning Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-4 mb-6"
        >
          <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4">
            <h2 className="text-xl font-semibold text-gray-900 flex items-center gap-2 mb-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Learn in 5 Easy Sections
            </h2>
            <p className="text-gray-600 text-sm leading-relaxed">
              Don't feel overwhelmed! Just focus on <strong>one section at a time</strong>.
              Each colored section contains a few simple steps. Once you complete all 5 sections,
              you'll know everything needed for one full rakah of prayer.
              <span className="text-emerald-600 font-medium"> You've got this!</span>
            </p>
          </div>

          {SALAH_SECTIONS.map((section, sectionIndex) => {
            // Get positions for this section
            const sectionPositions = positions.filter(p => section.positionIds.includes(p.id));
            const completedInSection = sectionPositions.filter(p => completedPositions.includes(p.id)).length;
            const sectionProgress = sectionPositions.length > 0
              ? Math.round((completedInSection / sectionPositions.length) * 100)
              : 0;
            const isSectionComplete = sectionPositions.length > 0 && completedInSection === sectionPositions.length;

            // The "Additional Surah" section is optional (bonus content)
            const isOptionalSection = section.id === 'section-surah';

            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 * sectionIndex }}
                className={`rounded-2xl border overflow-hidden transition-all ${section.bgColor} ${section.borderColor}`}
              >
                {/* Section Header */}
                <div className="p-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-14 h-14 rounded-xl flex items-center justify-center text-2xl ${section.iconBg}`}>
                      {section.icon}
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        {!isOptionalSection && (
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${section.iconBg} ${section.color}`}>
                            {SALAH_SECTIONS.filter(s => s.id !== 'section-surah').indexOf(section) + 1}
                          </span>
                        )}
                        <h3 className={`font-bold text-lg ${section.color}`}>
                          {section.title}
                        </h3>
                        {isOptionalSection && (
                          <span className="text-xs bg-cyan-100 text-cyan-700 px-2 py-0.5 rounded-full font-medium">
                            Bonus
                          </span>
                        )}
                        {isSectionComplete && (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {section.subtitle}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">{section.description}</p>
                    </div>

                    <div className="text-right">
                      <div className={`text-lg font-bold ${section.color}`}>
                        {completedInSection}/{sectionPositions.length}
                      </div>
                      <div className="text-xs text-gray-500">steps</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-3">
                    <div className="h-2 bg-white/50 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isSectionComplete ? 'bg-emerald-500' : section.borderColor.replace('border-', 'bg-').replace('-200', '-400')
                        }`}
                        style={{ width: `${sectionProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section Steps (expandable) */}
                <div className="px-4 pb-4">
                    <div className="bg-white/70 rounded-xl p-3 space-y-2">
                      {sectionPositions.map((position, posIndex) => {
                        const isCompleted = completedPositions.includes(position.id);
                        const globalIndex = positions.findIndex(p => p.id === position.id) + 1;

                        const isExpanded = expandedPositionId === position.id;

                        return (
                          <div
                            key={position.id}
                            className={`rounded-lg border transition-all overflow-hidden ${
                              isCompleted
                                ? 'bg-emerald-50 border-emerald-200'
                                : 'bg-white border-gray-200'
                            }`}
                          >
                            {/* Position Header - Click to expand */}
                            <button
                              onClick={() => setExpandedPositionId(isExpanded ? null : position.id)}
                              className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/50 transition-colors"
                            >
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-medium ${
                                isCompleted
                                  ? 'bg-emerald-500 text-white'
                                  : `${section.iconBg} ${section.color}`
                              }`}>
                                {isCompleted ? (
                                  <CheckCircle2 className="w-4 h-4" />
                                ) : (
                                  globalIndex
                                )}
                              </div>

                              <div className="flex-1 min-w-0">
                                <p className={`font-medium text-sm truncate ${
                                  isCompleted ? 'text-emerald-700' : 'text-gray-700'
                                }`}>
                                  {position.name}
                                </p>
                                <p className="text-xs text-gray-400 truncate">{position.transliteration}</p>
                              </div>

                              <ChevronDown className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''} ${isCompleted ? 'text-emerald-400' : 'text-gray-400'}`} />
                            </button>

                            {/* Expanded Content */}
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="px-3 pb-3 space-y-3">
                                    {/* Recitations */}
                                    {position.recitations.map((recitation, recIdx) => (
                                      <div
                                        key={recitation.id}
                                        className="bg-white rounded-lg border border-gray-100 p-4"
                                      >
                                        {/* Arabic Text */}
                                        <p className="text-2xl text-right font-arabic text-gray-800 leading-loose mb-3" dir="rtl">
                                          {recitation.arabic}
                                        </p>

                                        {/* Transliteration */}
                                        <p className="text-sm text-emerald-600 font-medium mb-1">
                                          {recitation.transliteration}
                                        </p>

                                        {/* Translation */}
                                        <p className="text-sm text-gray-600 mb-3">
                                          {recitation.translation}
                                        </p>

                                        {/* Audio Button */}
                                        <button
                                          onClick={() => playAudio(recitation.arabic, recitation.id)}
                                          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                                            playingAudioId === recitation.id
                                              ? 'bg-emerald-500 text-white'
                                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                          }`}
                                        >
                                          {playingAudioId === recitation.id ? (
                                            <>
                                              <VolumeX className="w-4 h-4" />
                                              <span className="text-sm font-medium">Stop</span>
                                            </>
                                          ) : (
                                            <>
                                              <Volume2 className="w-4 h-4" />
                                              <span className="text-sm font-medium">Listen</span>
                                            </>
                                          )}
                                        </button>

                                        {/* Repeat info if applicable */}
                                        {recitation.timesToRepeat && recitation.timesToRepeat > 1 && (
                                          <p className="text-xs text-amber-600 mt-2">
                                            Repeat {recitation.timesToRepeat} times
                                          </p>
                                        )}
                                      </div>
                                    ))}

                                    {/* Learn More Button */}
                                    <button
                                      onClick={() => {
                                        setExpandedPositionId(null);
                                        setInitialPositionId(position.id);
                                        setMode('learn');
                                      }}
                                      className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${section.bgColor} ${section.color} hover:opacity-80`}
                                    >
                                      <ExternalLink className="w-4 h-4" />
                                      Learn More Details
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>
              </motion.div>
            );
          })}

          {/* Milestone Card - One Rakah Complete */}
          {(() => {
            // Check if all core sections (excluding optional surah) are complete
            const coreSections = SALAH_SECTIONS.filter(s => s.id !== 'section-surah');
            const allCoreComplete = coreSections.every(section => {
              const sectionPositions = positions.filter(p => section.positionIds.includes(p.id));
              return sectionPositions.every(p => completedPositions.includes(p.id));
            });

            if (allCoreComplete) {
              return (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-amber-400 to-orange-500 rounded-2xl p-6 text-center text-white"
                >
                  <div className="text-4xl mb-2">🎉</div>
                  <h3 className="text-xl font-bold mb-1">One Rakah Complete!</h3>
                  <p className="text-amber-100 text-sm">
                    MashaAllah! You've learned all the steps for one complete rakah.
                    You can now pray a full 2-rakah prayer like Fajr!
                  </p>
                  <div className="mt-4 flex justify-center gap-2">
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Fajr: 2 rakahs</span>
                    <span className="px-3 py-1 bg-white/20 rounded-full text-sm">Dhuhr: 4 rakahs</span>
                  </div>
                </motion.div>
              );
            }
            return null;
          })()}
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid md:grid-cols-2 gap-4 mb-6"
        >
          {/* Pray Now */}
          <button
            onClick={() => setMode('pray')}
            className="group bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 rounded-2xl p-5 text-left flex items-center gap-4 shadow-md transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Moon className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-white">Pray Now</h3>
              <p className="text-emerald-100 text-sm">Follow along with your daily prayers</p>
            </div>
            <ArrowRight className="w-5 h-5 text-white group-hover:translate-x-1 transition-transform" />
          </button>

          {/* Learn Mode */}
          <button
            onClick={() => {
              setInitialPositionId(undefined);
              setMode('learn');
            }}
            className="group bg-white hover:bg-gray-50 rounded-2xl p-5 border border-gray-200 hover:border-emerald-300 text-left flex items-center gap-4 shadow-sm transition-all"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-emerald-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Learn Step by Step</h3>
              <p className="text-gray-500 text-sm">Understand every word you say</p>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:translate-x-1 group-hover:text-emerald-600 transition-all" />
          </button>
        </motion.div>

        {/* Secondary Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="grid md:grid-cols-2 gap-4 mb-8"
        >
          <button
            onClick={() => setMode('quiz')}
            className="group bg-white hover:bg-amber-50 rounded-xl p-4 border border-gray-200 hover:border-amber-300 text-left flex items-center gap-3 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <Brain className="w-5 h-5 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Quiz Mode</h3>
              <p className="text-gray-500 text-xs">Test your knowledge</p>
            </div>
            {Object.keys(quizScores).length > 0 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
                {Object.keys(quizScores).length} done
              </span>
            )}
          </button>

          <button
            onClick={() => setMode('practice')}
            className="group bg-white hover:bg-blue-50 rounded-xl p-4 border border-gray-200 hover:border-blue-300 text-left flex items-center gap-3 transition-all"
          >
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Play className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Practice Mode</h3>
              <p className="text-gray-500 text-xs">Complete guided prayer</p>
            </div>
            {practiceCompleted && (
              <CheckCircle2 className="w-5 h-5 text-blue-500" />
            )}
          </button>
        </motion.div>

        {/* XP Display */}
        {xpEarned > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-6"
          >
            <div className="inline-flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-full border border-amber-200">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <span className="text-amber-700 font-medium">{xpEarned} XP earned</span>
            </div>
          </motion.div>
        )}

        {/* Reset Progress */}
        {(completedPositions.length > 0 || xpEarned > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center"
          >
            <button
              onClick={resetProgress}
              className="inline-flex items-center gap-2 text-gray-400 hover:text-gray-600 text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Progress
            </button>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence mode="wait">
      {mode === 'intro' && renderIntro()}

      {mode === 'learn' && (
        <LearnMode
          key="learn"
          completedPositions={completedPositions}
          onPositionComplete={handlePositionComplete}
          onBack={() => {
            setInitialPositionId(undefined);
            setMode('intro');
          }}
          onComplete={() => {
            setInitialPositionId(undefined);
            setMode('intro');
          }}
          initialPositionId={initialPositionId}
        />
      )}

      {mode === 'quiz' && (
        <QuizMode
          key="quiz"
          completedPositions={completedPositions}
          onQuizComplete={handleQuizComplete}
          onBack={() => setMode('intro')}
        />
      )}

      {mode === 'practice' && (
        <PracticeMode
          key="practice"
          onComplete={handlePracticeComplete}
          onBack={() => setMode('intro')}
        />
      )}

      {mode === 'pray' && (
        <PrayNowMode
          key="pray"
          onBack={() => setMode('intro')}
        />
      )}
    </AnimatePresence>
  );
}
