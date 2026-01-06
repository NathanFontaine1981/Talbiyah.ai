import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Play,
  Pause,
  RotateCcw,
  CheckCircle2,
  Volume2,
  VolumeX,
  ChevronDown,
  ChevronUp,
  Settings,
  X
} from 'lucide-react';
import { salahPositions, getPositionsByOrder, twoRakahPrayer, type SalahPosition } from '../../data/salahData';

interface PracticeModeProps {
  onComplete: () => void;
  onBack: () => void;
}

// Prayer Position Sprite - CSS positions for each prayer position in the sprite image
// Based on the user's image grid (3 columns x 4 rows approximately)
const positionSprites: Record<string, { x: number; y: number; width: number; height: number }> = {
  'prostrating': { x: 0, y: 0, width: 33, height: 25 },      // Top left - sujood
  'sitting': { x: 0, y: 50, width: 33, height: 25 },         // Second row left - sitting
  'hands-raised': { x: 33, y: 50, width: 33, height: 25 },   // Second row middle - takbir
  'standing': { x: 66, y: 0, width: 33, height: 25 },        // Top right area - standing
  'bowing': { x: 66, y: 50, width: 33, height: 25 },         // Second row right - ruku
};

// Position Image Component using CSS sprite
const PositionImage = ({ type }: { type: string }) => {
  const [imageError, setImageError] = useState(false);
  const sprite = positionSprites[type];

  if (!imageError && sprite) {
    return (
      <div
        className="w-full h-full relative overflow-hidden rounded-lg"
        style={{
          backgroundImage: 'url(/images/salah/prayer-positions.png)',
          backgroundSize: '300% 400%',
          backgroundPosition: `${sprite.x}% ${sprite.y}%`,
          backgroundRepeat: 'no-repeat',
        }}
        onError={() => setImageError(true)}
      >
        {/* Fallback check with hidden image */}
        <img
          src="/images/salah/prayer-positions.png"
          alt=""
          className="hidden"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  // Fallback to SVG silhouette
  return <PositionSilhouette type={type} />;
};

// SVG Silhouette Components for Prayer Positions (Fallback)
const PositionSilhouette = ({ type }: { type: string }) => {
  const silhouettes: Record<string, JSX.Element> = {
    'hands-raised': (
      <svg viewBox="0 0 100 150" className="w-full h-full">
        <defs>
          <linearGradient id="bodyGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Head */}
        <circle cx="50" cy="20" r="12" fill="url(#bodyGradient)" />
        {/* Body */}
        <path d="M50 32 L50 80" stroke="url(#bodyGradient)" strokeWidth="8" strokeLinecap="round" />
        {/* Arms raised */}
        <path d="M50 45 L25 20" stroke="url(#bodyGradient)" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 45 L75 20" stroke="url(#bodyGradient)" strokeWidth="6" strokeLinecap="round" />
        {/* Hands */}
        <circle cx="25" cy="18" r="5" fill="url(#bodyGradient)" />
        <circle cx="75" cy="18" r="5" fill="url(#bodyGradient)" />
        {/* Legs */}
        <path d="M50 80 L35 130" stroke="url(#bodyGradient)" strokeWidth="7" strokeLinecap="round" />
        <path d="M50 80 L65 130" stroke="url(#bodyGradient)" strokeWidth="7" strokeLinecap="round" />
        {/* Feet */}
        <ellipse cx="35" cy="135" rx="8" ry="4" fill="url(#bodyGradient)" />
        <ellipse cx="65" cy="135" rx="8" ry="4" fill="url(#bodyGradient)" />
      </svg>
    ),
    'standing': (
      <svg viewBox="0 0 100 150" className="w-full h-full">
        <defs>
          <linearGradient id="bodyGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Head */}
        <circle cx="50" cy="20" r="12" fill="url(#bodyGradient2)" />
        {/* Body */}
        <path d="M50 32 L50 80" stroke="url(#bodyGradient2)" strokeWidth="8" strokeLinecap="round" />
        {/* Arms folded on chest */}
        <path d="M50 50 L35 55 L45 60" stroke="url(#bodyGradient2)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M50 50 L65 55 L55 60" stroke="url(#bodyGradient2)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Legs */}
        <path d="M50 80 L40 130" stroke="url(#bodyGradient2)" strokeWidth="7" strokeLinecap="round" />
        <path d="M50 80 L60 130" stroke="url(#bodyGradient2)" strokeWidth="7" strokeLinecap="round" />
        {/* Feet */}
        <ellipse cx="40" cy="135" rx="8" ry="4" fill="url(#bodyGradient2)" />
        <ellipse cx="60" cy="135" rx="8" ry="4" fill="url(#bodyGradient2)" />
      </svg>
    ),
    'bowing': (
      <svg viewBox="0 0 120 100" className="w-full h-full">
        <defs>
          <linearGradient id="bodyGradient3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Head */}
        <circle cx="30" cy="35" r="10" fill="url(#bodyGradient3)" />
        {/* Back - horizontal */}
        <path d="M38 38 L80 38" stroke="url(#bodyGradient3)" strokeWidth="8" strokeLinecap="round" />
        {/* Arms down to knees */}
        <path d="M55 38 L55 60" stroke="url(#bodyGradient3)" strokeWidth="5" strokeLinecap="round" />
        <path d="M65 38 L65 60" stroke="url(#bodyGradient3)" strokeWidth="5" strokeLinecap="round" />
        {/* Legs */}
        <path d="M80 38 L85 85" stroke="url(#bodyGradient3)" strokeWidth="7" strokeLinecap="round" />
        <path d="M80 38 L95 85" stroke="url(#bodyGradient3)" strokeWidth="7" strokeLinecap="round" />
        {/* Feet */}
        <ellipse cx="85" cy="90" rx="7" ry="4" fill="url(#bodyGradient3)" />
        <ellipse cx="95" cy="90" rx="7" ry="4" fill="url(#bodyGradient3)" />
      </svg>
    ),
    'prostrating': (
      <svg viewBox="0 0 140 80" className="w-full h-full">
        <defs>
          <linearGradient id="bodyGradient4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Ground line */}
        <line x1="10" y1="70" x2="130" y2="70" stroke="#334155" strokeWidth="2" />
        {/* Head on ground */}
        <circle cx="25" cy="62" r="9" fill="url(#bodyGradient4)" />
        {/* Back curved up */}
        <path d="M32 58 Q60 30 90 45" stroke="url(#bodyGradient4)" strokeWidth="8" strokeLinecap="round" fill="none" />
        {/* Arms extended */}
        <path d="M35 58 L15 65" stroke="url(#bodyGradient4)" strokeWidth="5" strokeLinecap="round" />
        <path d="M35 58 L45 68" stroke="url(#bodyGradient4)" strokeWidth="5" strokeLinecap="round" />
        {/* Hands on ground */}
        <circle cx="13" cy="67" r="4" fill="url(#bodyGradient4)" />
        <circle cx="47" cy="68" r="4" fill="url(#bodyGradient4)" />
        {/* Legs folded */}
        <path d="M90 45 L110 65" stroke="url(#bodyGradient4)" strokeWidth="7" strokeLinecap="round" />
        <path d="M110 65 L95 68" stroke="url(#bodyGradient4)" strokeWidth="6" strokeLinecap="round" />
        {/* Feet - toes on ground */}
        <ellipse cx="93" cy="68" rx="5" ry="3" fill="url(#bodyGradient4)" />
      </svg>
    ),
    'sitting': (
      <svg viewBox="0 0 100 120" className="w-full h-full">
        <defs>
          <linearGradient id="bodyGradient5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        {/* Ground line */}
        <line x1="10" y1="110" x2="90" y2="110" stroke="#334155" strokeWidth="2" />
        {/* Head */}
        <circle cx="50" cy="25" r="11" fill="url(#bodyGradient5)" />
        {/* Body - sitting upright */}
        <path d="M50 36 L50 75" stroke="url(#bodyGradient5)" strokeWidth="8" strokeLinecap="round" />
        {/* Arms on thighs */}
        <path d="M50 55 L35 75" stroke="url(#bodyGradient5)" strokeWidth="5" strokeLinecap="round" />
        <path d="M50 55 L65 75" stroke="url(#bodyGradient5)" strokeWidth="5" strokeLinecap="round" />
        {/* Hands */}
        <circle cx="33" cy="77" r="4" fill="url(#bodyGradient5)" />
        <circle cx="67" cy="77" r="4" fill="url(#bodyGradient5)" />
        {/* Legs folded */}
        <path d="M50 75 L30 90 L25 105" stroke="url(#bodyGradient5)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M50 75 L70 90 L80 105" stroke="url(#bodyGradient5)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        {/* Feet */}
        <ellipse cx="25" cy="108" rx="8" ry="4" fill="url(#bodyGradient5)" />
        <ellipse cx="82" cy="108" rx="6" ry="4" fill="url(#bodyGradient5)" />
      </svg>
    ),
  };

  return silhouettes[type] || silhouettes['standing'];
};

interface PracticeStep {
  positionId: string;
  position: SalahPosition;
  recitationIndex: number;
  rakah: number;
  isLastInPosition: boolean;
}

export default function PracticeMode({ onComplete, onBack }: PracticeModeProps) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [autoAdvanceDelay, setAutoAdvanceDelay] = useState(5000); // 5 seconds default
  const [isComplete, setIsComplete] = useState(false);

  // Build the practice steps from the two rakah prayer structure
  const practiceSteps: PracticeStep[] = [];

  twoRakahPrayer.rakahs.forEach((rakah) => {
    rakah.positions.forEach((positionId) => {
      const position = salahPositions.find(p => p.id === positionId);
      if (position) {
        position.recitations.forEach((_, recIndex) => {
          practiceSteps.push({
            positionId,
            position,
            recitationIndex: recIndex,
            rakah: rakah.number,
            isLastInPosition: recIndex === position.recitations.length - 1
          });
        });
      }
    });
  });

  const currentStep = practiceSteps[currentStepIndex];
  const progress = Math.round(((currentStepIndex + 1) / practiceSteps.length) * 100);

  // Auto-advance when playing
  useEffect(() => {
    if (isPlaying && currentStepIndex < practiceSteps.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStepIndex(prev => prev + 1);
      }, autoAdvanceDelay);
      return () => clearTimeout(timer);
    } else if (isPlaying && currentStepIndex === practiceSteps.length - 1) {
      setIsPlaying(false);
      setIsComplete(true);
      onComplete();
    }
  }, [isPlaying, currentStepIndex, autoAdvanceDelay, practiceSteps.length, onComplete]);

  const handleNext = () => {
    if (currentStepIndex < practiceSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleRestart = () => {
    setCurrentStepIndex(0);
    setIsPlaying(false);
    setIsComplete(false);
  };

  const togglePlay = () => {
    setIsPlaying(!isPlaying);
  };

  if (!currentStep && !isComplete) return null;

  // Completion Screen
  if (isComplete) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 px-4 py-8 flex items-center justify-center"
      >
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="max-w-md w-full bg-slate-900/70 rounded-2xl p-8 border border-slate-700 text-center"
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-emerald-900/50 border-2 border-emerald-500/50 flex items-center justify-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-400" />
          </div>

          <h2 className="text-3xl font-bold text-white mb-3">
            Prayer Complete!
          </h2>

          <p className="text-slate-400 mb-6">
            You've completed a full 2-rakah prayer practice.
            May Allah accept your prayers.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-4 mb-6 border border-emerald-700/50">
            <div className="text-3xl font-bold text-emerald-400">+200 XP</div>
            <div className="text-emerald-300/70 text-sm">Practice Completed</div>
          </div>

          <div className="space-y-3">
            <button
              onClick={handleRestart}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full font-medium transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              Practice Again
            </button>
            <button
              onClick={onBack}
              className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-full font-medium transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Menu
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const recitation = currentStep.position.recitations[currentStep.recitationIndex];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950/20 to-slate-950 px-4 py-8"
    >
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Exit Practice
          </button>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 hover:bg-slate-800 rounded-full transition-colors"
            >
              <Settings className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between text-sm text-slate-400 mb-2">
            <span>Rakah {currentStep.rakah} of 2</span>
            <span>{progress}% complete</span>
          </div>
          <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-blue-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mb-6"
            >
              <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-white font-medium">Settings</h3>
                  <button
                    onClick={() => setShowSettings(false)}
                    className="p-1 hover:bg-slate-700 rounded-full"
                  >
                    <X className="w-4 h-4 text-slate-400" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300">Show Translation</span>
                    <button
                      onClick={() => setShowTranslation(!showTranslation)}
                      className={`w-12 h-6 rounded-full transition-colors ${
                        showTranslation ? 'bg-blue-600' : 'bg-slate-600'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-white transform transition-transform ${
                          showTranslation ? 'translate-x-6' : 'translate-x-0.5'
                        }`}
                      />
                    </button>
                  </div>
                  <div>
                    <span className="text-slate-300 block mb-2">Auto-advance Speed</span>
                    <div className="flex gap-2">
                      {[
                        { label: 'Slow', value: 8000 },
                        { label: 'Normal', value: 5000 },
                        { label: 'Fast', value: 3000 }
                      ].map(option => (
                        <button
                          key={option.value}
                          onClick={() => setAutoAdvanceDelay(option.value)}
                          className={`flex-1 py-2 px-3 rounded-lg text-sm transition-colors ${
                            autoAdvanceDelay === option.value
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Position Indicator with Image */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="w-28 h-32 flex items-center justify-center bg-slate-800/50 rounded-2xl border border-slate-700 p-3">
            <PositionImage type={currentStep.position.iconType} />
          </div>
          <div>
            <div className="text-blue-400 text-sm font-medium">
              {currentStep.position.transliteration}
            </div>
            <div className="text-2xl font-bold text-white">
              {currentStep.position.name}
            </div>
            <div className="text-slate-400 font-arabic text-lg">
              {currentStep.position.arabicName}
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-6"
        >
          {/* Transition indicator */}
          {currentStep.recitationIndex === 0 && currentStep.position.transitionSaying && (
            <div className="text-center mb-4">
              <span className="text-sm text-amber-400 bg-amber-900/30 px-3 py-1 rounded-full">
                Say "{currentStep.position.transitionSaying}" when moving to this position
              </span>
            </div>
          )}

          {/* Arabic Text */}
          <div className="text-center mb-6">
            <p className="font-arabic text-3xl md:text-4xl text-emerald-200 leading-loose" dir="rtl">
              {recitation.arabic}
            </p>
          </div>

          {/* Transliteration */}
          <p className="text-center text-slate-400 italic text-lg mb-4">
            {recitation.transliteration}
          </p>

          {/* Translation - Large and Prominent */}
          <AnimatePresence>
            {showTranslation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-2 p-4 bg-amber-900/30 rounded-xl border border-amber-700/40"
              >
                <p className="text-center text-amber-100 text-xl md:text-2xl font-medium leading-relaxed">
                  "{recitation.translation}"
                </p>
                {recitation.reference && (
                  <p className="text-center text-amber-400/60 text-xs mt-2">
                    {recitation.reference}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Repeat indicator */}
          {recitation.timesToRepeat && recitation.timesToRepeat > 1 && (
            <div className="text-center mt-4">
              <span className="text-sm text-blue-400 bg-blue-900/30 px-3 py-1.5 rounded-full">
                Repeat {recitation.timesToRepeat} times
              </span>
            </div>
          )}
        </motion.div>

        {/* Play Controls */}
        <div className="flex items-center justify-center gap-4 mb-6">
          <button
            onClick={handlePrevious}
            disabled={currentStepIndex === 0}
            className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <ArrowLeft className="w-6 h-6 text-white" />
          </button>

          <button
            onClick={togglePlay}
            className={`p-4 rounded-full transition-colors ${
              isPlaying
                ? 'bg-amber-600 hover:bg-amber-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-8 h-8 text-white" />
            ) : (
              <Play className="w-8 h-8 text-white" />
            )}
          </button>

          <button
            onClick={handleNext}
            disabled={currentStepIndex === practiceSteps.length - 1}
            className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-full transition-colors"
          >
            <ArrowRight className="w-6 h-6 text-white" />
          </button>
        </div>

        {/* Auto-play indicator */}
        {isPlaying && (
          <div className="text-center">
            <p className="text-slate-500 text-sm">
              Auto-advancing in {autoAdvanceDelay / 1000}s...
            </p>
          </div>
        )}

        {/* Step Counter */}
        <div className="text-center text-slate-500 text-sm">
          Step {currentStepIndex + 1} of {practiceSteps.length}
        </div>
      </div>
    </motion.div>
  );
}
