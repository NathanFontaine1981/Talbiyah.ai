import { useState, useMemo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Smartphone
} from 'lucide-react';
import { dailyPrayers, getPrayerSteps, type DailyPrayer, type PrayerStep } from '../../data/salahData';

interface PrayNowModeProps {
  onBack: () => void;
}

type ViewState = 'select' | 'praying';

// Audio URLs for recitations (using everyayah.com API for Quran, placeholder for others)
const getAudioUrl = (recitationId: string): string | null => {
  // For Fatiha verses, use everyayah.com (Mishary Rashid Alafasy)
  const fatihaVerseMap: Record<string, string> = {
    'fatiha-1': 'https://everyayah.com/data/Alafasy_128kbps/001002.mp3',
    'fatiha-2': 'https://everyayah.com/data/Alafasy_128kbps/001003.mp3',
    'fatiha-3': 'https://everyayah.com/data/Alafasy_128kbps/001004.mp3',
    'fatiha-4': 'https://everyayah.com/data/Alafasy_128kbps/001005.mp3',
    'fatiha-5': 'https://everyayah.com/data/Alafasy_128kbps/001006.mp3',
    'fatiha-6': 'https://everyayah.com/data/Alafasy_128kbps/001007.mp3',
    'fatiha-7': 'https://everyayah.com/data/Alafasy_128kbps/001007.mp3', // Same verse continues
    'basmala': 'https://everyayah.com/data/Alafasy_128kbps/001001.mp3',
  };

  return fatihaVerseMap[recitationId] || null;
};

export default function PrayNowMode({ onBack }: PrayNowModeProps) {
  const [viewState, setViewState] = useState<ViewState>('select');
  const [selectedPrayer, setSelectedPrayer] = useState<DailyPrayer | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(4000); // 4 seconds default
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Generate steps for selected prayer
  const prayerSteps = useMemo(() => {
    if (!selectedPrayer) return [];
    return getPrayerSteps(selectedPrayer.id);
  }, [selectedPrayer]);

  const currentStep = prayerSteps[currentStepIndex];
  const progress = prayerSteps.length > 0
    ? Math.round(((currentStepIndex + 1) / prayerSteps.length) * 100)
    : 0;

  // Auto-advance effect
  useEffect(() => {
    if (isAutoMode && !isPaused && viewState === 'praying' && !isComplete) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      // Play audio if available
      if (audioEnabled && currentStep) {
        const recitation = currentStep.position.recitations[currentStep.recitationIndex];
        const audioUrl = getAudioUrl(recitation.id);

        if (audioUrl && audioRef.current) {
          audioRef.current.src = audioUrl;
          audioRef.current.play().catch(() => {
            // Audio play failed, continue anyway
          });
        }
      }

      // Set timer for auto-advance
      timerRef.current = setTimeout(() => {
        if (currentStepIndex < prayerSteps.length - 1) {
          setCurrentStepIndex(prev => prev + 1);
        } else {
          setIsComplete(true);
          setIsAutoMode(false);
        }
      }, autoAdvanceDelay);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [isAutoMode, isPaused, currentStepIndex, prayerSteps.length, autoAdvanceDelay, audioEnabled, currentStep, viewState, isComplete]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const handleSelectPrayer = (prayer: DailyPrayer) => {
    setSelectedPrayer(prayer);
    setCurrentStepIndex(0);
    setIsComplete(false);
    setIsAutoMode(false);
    setIsPaused(false);
    setViewState('praying');
  };

  const handleStartAutoMode = () => {
    setIsAutoMode(true);
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.play().catch(() => {});
      } else {
        audioRef.current.pause();
      }
    }
  };

  const handleNext = () => {
    if (currentStepIndex < prayerSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      setIsAutoMode(false);
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleExitPrayer = () => {
    setViewState('select');
    setSelectedPrayer(null);
    setCurrentStepIndex(0);
    setIsComplete(false);
    setIsAutoMode(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  // Prayer Selection Screen
  const renderPrayerSelection = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-slate-950 px-4 py-8"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Pray Now
          </h1>
          <p className="text-slate-400 text-lg">
            Select your prayer to begin
          </p>
        </div>

        {/* Prayer Grid */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {dailyPrayers.map((prayer, index) => (
            <motion.button
              key={prayer.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => handleSelectPrayer(prayer)}
              className="group bg-slate-900/50 hover:bg-slate-800/70 rounded-2xl p-6 border border-slate-800 hover:border-emerald-500/50 transition-all text-center"
            >
              <div className="text-4xl mb-3">{prayer.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-emerald-300 transition-colors">
                {prayer.name}
              </h3>
              <p className="text-sm text-slate-500 font-arabic">
                {prayer.arabicName}
              </p>
              <div className="mt-2 text-xs text-slate-600">
                {prayer.rakahs} rakahs
              </div>
            </motion.button>
          ))}
        </div>

        {/* Floor Mode Tip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 p-4 bg-emerald-900/20 rounded-xl border border-emerald-800/30 flex items-start gap-3"
        >
          <Smartphone className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-emerald-300 font-medium text-sm">Floor Mode Tip</p>
            <p className="text-emerald-400/70 text-sm">
              Press "Start" after selecting your prayer. Place your phone at sutra distance
              and follow along as it auto-advances through each recitation.
            </p>
          </div>
        </motion.div>
      </div>
    </motion.div>
  );

  // Prayer Walkthrough Screen (Optimized for Floor Mode)
  const renderPrayerWalkthrough = () => {
    if (!currentStep || !selectedPrayer) return null;

    const recitation = currentStep.position.recitations[currentStep.recitationIndex];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-black flex flex-col"
      >
        {/* Hidden Audio Element */}
        <audio ref={audioRef} />

        {/* Minimal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80">
          <button
            onClick={handleExitPrayer}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>

          <div className="text-center">
            <div className="text-white font-medium text-sm">
              {selectedPrayer.name} • Rakah {currentStep.rakah}/{currentStep.totalRakahs}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled(!audioEnabled)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              {audioEnabled ? (
                <Volume2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <VolumeX className="w-5 h-5 text-slate-500" />
              )}
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="h-1 bg-slate-900">
          <motion.div
            className="h-full bg-emerald-500"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>

        {/* Main Content - Optimized for readability from floor */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-2xl text-center"
          >
            {/* Position Name - Small */}
            <div className="mb-4">
              <span className="text-xs text-emerald-400/60 uppercase tracking-wider">
                {currentStep.position.name}
              </span>
            </div>

            {/* Arabic Text - Large with proper line-height for harakat */}
            <p
              className="font-arabic text-4xl md:text-5xl lg:text-6xl text-emerald-100 mb-8"
              dir="rtl"
              style={{
                lineHeight: '2.2',
                letterSpacing: '0.02em'
              }}
            >
              {recitation.arabic}
            </p>

            {/* Translation - Clear and readable */}
            <p
              className="text-white/90 text-xl md:text-2xl leading-relaxed mb-4"
              style={{ lineHeight: '1.6' }}
            >
              {recitation.translation}
            </p>

            {/* Reference - Very subtle */}
            {recitation.reference && (
              <p className="text-slate-600 text-xs mt-4">
                {recitation.reference}
              </p>
            )}

            {/* Repeat indicator */}
            {recitation.timesToRepeat && recitation.timesToRepeat > 1 && (
              <div className="mt-4">
                <span className="text-xs text-amber-500/70 bg-amber-900/20 px-3 py-1 rounded-full">
                  Repeat {recitation.timesToRepeat}×
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Bottom Controls */}
        <div className="px-4 py-4 bg-slate-950/80">
          {!isAutoMode ? (
            // Manual mode controls
            <div className="max-w-2xl mx-auto">
              {/* Start Auto Mode Button */}
              <button
                onClick={handleStartAutoMode}
                className="w-full mb-4 flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-semibold text-lg transition-colors"
              >
                <Play className="w-6 h-6" />
                Start Prayer
              </button>

              {/* Manual Navigation */}
              <div className="flex items-center justify-between">
                <button
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                  className="flex items-center gap-2 px-4 py-2 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Previous
                </button>

                <div className="text-slate-600 text-sm">
                  {currentStepIndex + 1} / {prayerSteps.length}
                </div>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-4 py-2 text-emerald-400 hover:text-emerald-300 transition-colors"
                >
                  Next
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            // Auto mode controls
            <div className="max-w-2xl mx-auto flex items-center justify-center gap-4">
              <button
                onClick={handleTogglePause}
                className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-semibold text-lg transition-colors ${
                  isPaused
                    ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {isPaused ? (
                  <>
                    <Play className="w-6 h-6" />
                    Resume
                  </>
                ) : (
                  <>
                    <Pause className="w-6 h-6" />
                    Pause
                  </>
                )}
              </button>

              <div className="text-slate-500 text-sm">
                {currentStepIndex + 1} / {prayerSteps.length}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Completion Screen
  const renderCompletion = () => {
    if (!selectedPrayer) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-black flex items-center justify-center px-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-900/30 border-2 border-emerald-500/50 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">
            {selectedPrayer.name} Complete
          </h2>

          <p
            className="text-emerald-200 mb-2 font-arabic text-3xl"
            style={{ lineHeight: '2' }}
          >
            تَقَبَّلَ اللهُ
          </p>
          <p className="text-slate-400 mb-8">
            May Allah accept your prayer
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsComplete(false);
                setIsAutoMode(false);
              }}
              className="w-full px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-medium transition-colors"
            >
              Pray Again
            </button>
            <button
              onClick={handleExitPrayer}
              className="w-full px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl font-medium transition-colors"
            >
              Choose Another Prayer
            </button>
            <button
              onClick={onBack}
              className="w-full px-6 py-4 text-slate-400 hover:text-white transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {viewState === 'select' && renderPrayerSelection()}
      {viewState === 'praying' && !isComplete && renderPrayerWalkthrough()}
      {viewState === 'praying' && isComplete && renderCompletion()}
    </AnimatePresence>
  );
}
