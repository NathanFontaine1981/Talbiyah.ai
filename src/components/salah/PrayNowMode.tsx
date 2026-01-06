import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  X
} from 'lucide-react';
import { dailyPrayers, getPrayerSteps, type DailyPrayer, type PrayerStep } from '../../data/salahData';

interface PrayNowModeProps {
  onBack: () => void;
}

type ViewState = 'select' | 'praying';

export default function PrayNowMode({ onBack }: PrayNowModeProps) {
  const [viewState, setViewState] = useState<ViewState>('select');
  const [selectedPrayer, setSelectedPrayer] = useState<DailyPrayer | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Generate steps for selected prayer
  const prayerSteps = useMemo(() => {
    if (!selectedPrayer) return [];
    return getPrayerSteps(selectedPrayer.id);
  }, [selectedPrayer]);

  const currentStep = prayerSteps[currentStepIndex];
  const progress = prayerSteps.length > 0
    ? Math.round(((currentStepIndex + 1) / prayerSteps.length) * 100)
    : 0;

  const handleSelectPrayer = (prayer: DailyPrayer) => {
    setSelectedPrayer(prayer);
    setCurrentStepIndex(0);
    setIsComplete(false);
    setViewState('praying');
  };

  const handleNext = () => {
    if (currentStepIndex < prayerSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
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
      </div>
    </motion.div>
  );

  // Prayer Walkthrough Screen
  const renderPrayerWalkthrough = () => {
    if (!currentStep || !selectedPrayer) return null;

    const recitation = currentStep.position.recitations[currentStep.recitationIndex];

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-slate-950 flex flex-col"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-slate-800/50">
          <button
            onClick={handleExitPrayer}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-400" />
          </button>
          <div className="text-center">
            <div className="text-white font-medium">
              {selectedPrayer.name}
            </div>
            <div className="text-sm text-slate-500">
              Rakah {currentStep.rakah} of {currentStep.totalRakahs}
            </div>
          </div>
          <div className="w-9" /> {/* Spacer for alignment */}
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

        {/* Main Content */}
        <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl text-center"
          >
            {/* Position Name */}
            <div className="mb-6">
              <span className="text-sm text-emerald-400/70">
                {currentStep.position.name}
              </span>
            </div>

            {/* Arabic Text */}
            <p
              className="font-arabic text-3xl md:text-4xl lg:text-5xl text-emerald-200 leading-loose mb-6"
              dir="rtl"
            >
              {recitation.arabic}
            </p>

            {/* Translation */}
            <p className="text-white text-lg md:text-xl leading-relaxed mb-4">
              {recitation.translation}
            </p>

            {/* Reference */}
            {recitation.reference && (
              <p className="text-slate-600 text-sm">
                {recitation.reference}
              </p>
            )}

            {/* Repeat indicator */}
            {recitation.timesToRepeat && recitation.timesToRepeat > 1 && (
              <div className="mt-4">
                <span className="text-xs text-amber-500/70 bg-amber-900/20 px-3 py-1 rounded-full">
                  Repeat {recitation.timesToRepeat} times
                </span>
              </div>
            )}
          </motion.div>
        </div>

        {/* Navigation */}
        <div className="px-4 py-6 border-t border-slate-800/50">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentStepIndex === 0}
              className="flex items-center gap-2 px-6 py-3 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Previous
            </button>

            <div className="text-slate-600 text-sm">
              {currentStepIndex + 1} / {prayerSteps.length}
            </div>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium transition-colors"
            >
              {currentStepIndex === prayerSteps.length - 1 ? 'Complete' : 'Next'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
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
        className="min-h-screen bg-slate-950 flex items-center justify-center px-4"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-md w-full text-center"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-emerald-900/30 border-2 border-emerald-500/50 flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">
            {selectedPrayer.name} Complete
          </h2>

          <p className="text-slate-400 mb-2 font-arabic text-xl">
            تقبل الله
          </p>
          <p className="text-slate-500 mb-8">
            May Allah accept your prayer
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsComplete(false);
              }}
              className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-medium transition-colors"
            >
              Pray Again
            </button>
            <button
              onClick={handleExitPrayer}
              className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-full font-medium transition-colors"
            >
              Choose Another Prayer
            </button>
            <button
              onClick={onBack}
              className="w-full px-6 py-3 text-slate-400 hover:text-white transition-colors"
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
