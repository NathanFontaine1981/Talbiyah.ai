import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Brain,
  Play,
  Home,
  RotateCcw,
  CheckCircle2,
  Sparkles,
  Moon
} from 'lucide-react';
import { salahPositions, getPositionsByOrder, type SalahPosition } from '../../data/salahData';
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

  // Intro Screen
  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-emerald-950/30 to-slate-950 px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-900/50 border-2 border-emerald-500/50 flex items-center justify-center"
          >
            <span className="text-5xl">🕌</span>
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-4xl md:text-5xl font-bold text-white mb-4"
          >
            The Salah Journey
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl text-slate-300 max-w-2xl mx-auto"
          >
            Transform your prayer from mere movements into a meaningful conversation with your Creator
          </motion.p>
        </div>

        {/* The Problem */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8"
        >
          <h2 className="text-2xl font-semibold text-white mb-4">The Hidden Problem</h2>
          <p className="text-slate-300 text-lg leading-relaxed">
            Most Muslims learn to pray as children - we memorize the Arabic, perfect the movements,
            but are never taught what we're actually <span className="text-emerald-400 font-semibold">saying</span>.
            We stand before the King of Kings five times a day, yet have no idea what words are leaving our lips.
          </p>
          <p className="text-slate-300 text-lg leading-relaxed mt-4">
            Imagine speaking to someone for years without understanding a single word you're saying.
            That's what prayer becomes without understanding.
          </p>
        </motion.div>

        {/* The Solution */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="bg-emerald-900/30 rounded-2xl p-8 border border-emerald-700/50 mb-8"
        >
          <h2 className="text-2xl font-semibold text-emerald-300 mb-4">What You'll Discover</h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-800/50 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">📖</span>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Word-by-Word Meanings</h3>
                <p className="text-slate-300 text-sm">Every Arabic word explained so you understand exactly what you're saying</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-800/50 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">💬</span>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Conversation with Allah</h3>
                <p className="text-slate-300 text-sm">Discover how Al-Fatiha is a direct dialogue between you and your Lord</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-800/50 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🎯</span>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Spiritual Context</h3>
                <p className="text-slate-300 text-sm">Understand WHY we say each phrase and what it means for your connection</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-emerald-800/50 flex items-center justify-center flex-shrink-0">
                <span className="text-xl">🧪</span>
              </div>
              <div>
                <h3 className="text-white font-medium mb-1">Test Your Knowledge</h3>
                <p className="text-slate-300 text-sm">Interactive quizzes to cement your understanding</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Pray Now - Prominent Card */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mb-6"
        >
          <button
            onClick={() => setMode('pray')}
            className="w-full group bg-gradient-to-r from-emerald-700 to-teal-600 hover:from-emerald-600 hover:to-teal-500 rounded-2xl p-6 border-2 border-emerald-400/50 hover:border-emerald-300 transition-all text-left flex items-center gap-6 shadow-lg shadow-emerald-900/50"
          >
            <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
              <Moon className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-semibold text-white mb-1">Pray Now</h3>
              <p className="text-emerald-100">
                Follow along with your daily prayers - Fajr, Dhuhr, Asr, Maghrib, Isha
              </p>
            </div>
            <ArrowRight className="w-6 h-6 text-white group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Game Modes */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          <button
            onClick={() => setMode('learn')}
            className="group bg-slate-900/70 hover:bg-slate-800/70 rounded-2xl p-6 border border-slate-700 hover:border-emerald-500/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-emerald-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <BookOpen className="w-6 h-6 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Learn</h3>
            <p className="text-slate-300 text-sm mb-3">
              Explore each position and understand every word
            </p>
            {learnProgress > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full transition-all"
                    style={{ width: `${learnProgress}%` }}
                  />
                </div>
                <span className="text-emerald-400 text-sm">{learnProgress}%</span>
              </div>
            )}
          </button>

          <button
            onClick={() => setMode('quiz')}
            className="group bg-slate-900/70 hover:bg-slate-800/70 rounded-2xl p-6 border border-slate-700 hover:border-amber-500/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-amber-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Quiz</h3>
            <p className="text-slate-300 text-sm mb-3">
              Test your understanding with interactive challenges
            </p>
            {Object.keys(quizScores).length > 0 && (
              <div className="flex items-center gap-2 text-amber-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>{Object.keys(quizScores).length} quizzes completed</span>
              </div>
            )}
          </button>

          <button
            onClick={() => setMode('practice')}
            className="group bg-slate-900/70 hover:bg-slate-800/70 rounded-2xl p-6 border border-slate-700 hover:border-blue-500/50 transition-all text-left"
          >
            <div className="w-12 h-12 rounded-xl bg-blue-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Play className="w-6 h-6 text-blue-400" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">Practice</h3>
            <p className="text-slate-300 text-sm mb-3">
              Follow along with a complete guided prayer
            </p>
            {practiceCompleted && (
              <div className="flex items-center gap-2 text-blue-400 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                <span>Completed</span>
              </div>
            )}
          </button>
        </motion.div>

        {/* XP Display */}
        {xpEarned > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-8"
          >
            <div className="inline-flex items-center gap-2 bg-amber-900/30 px-4 py-2 rounded-full border border-amber-700/50">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-amber-300 font-medium">{xpEarned} XP earned</span>
            </div>
          </motion.div>
        )}

        {/* Start Button */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="text-center"
        >
          <button
            onClick={() => setMode('learn')}
            className="group inline-flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition-all shadow-lg shadow-emerald-900/50"
          >
            Begin Your Journey
            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        </motion.div>

        {/* Reset Progress */}
        {(completedPositions.length > 0 || xpEarned > 0) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-center mt-6"
          >
            <button
              onClick={resetProgress}
              className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-300 text-sm transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Progress
            </button>
          </motion.div>
        )}

        {/* Back button - always show when onBack is provided */}
        {onBack && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed top-4 left-4 z-50"
          >
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800/80 hover:bg-slate-700 rounded-full text-slate-300 hover:text-white transition-colors backdrop-blur-sm"
            >
              <ArrowLeft className="w-5 h-5" />
              Back
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
          onBack={() => setMode('intro')}
          onComplete={() => setMode('intro')}
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
