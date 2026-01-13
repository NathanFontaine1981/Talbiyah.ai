import { useState, useMemo, useEffect, useRef, useCallback } from 'react';
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

type ViewState = 'select' | 'intention' | 'praying' | 'video';

// YouTube video URLs for prayers that have video guides
const prayerVideoMap: Record<string, string> = {
  'fajr': 'YhgSe6DFK-0', // Fajr with Surah Al-Kawthar (1st) and Al-Ikhlas (2nd)
  'dhuhr': 'zXjFF35J9PE', // Dhuhr with same surahs
  'asr': 'DcoNzaTl5ms', // Asr
  'maghrib': '-7bw8v_MPmY', // Maghrib
  'isha': 'b0B2TWuqgos', // Isha
};

// Prayer Position Sprite - CSS positions for each prayer position in the sprite image
const positionSprites: Record<string, { x: number; y: number; width: number; height: number }> = {
  'prostrating': { x: 0, y: 0, width: 33, height: 25 },
  'sitting': { x: 0, y: 50, width: 33, height: 25 },
  'hands-raised': { x: 33, y: 50, width: 33, height: 25 },
  'standing': { x: 66, y: 0, width: 33, height: 25 },
  'bowing': { x: 66, y: 50, width: 33, height: 25 },
};

// Position Image Component using CSS sprite
const PositionImage = ({ type }: { type: string }) => {
  const [imageError, setImageError] = useState(false);
  const sprite = positionSprites[type];

  if (!imageError && sprite) {
    return (
      <div
        className="w-full h-full relative overflow-hidden rounded-xl"
        style={{
          backgroundImage: 'url(/images/salah/prayer-positions.png)',
          backgroundSize: '300% 400%',
          backgroundPosition: `${sprite.x}% ${sprite.y}%`,
          backgroundRepeat: 'no-repeat',
        }}
      >
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
          <linearGradient id="pnGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="20" r="12" fill="url(#pnGrad1)" />
        <path d="M50 32 L50 80" stroke="url(#pnGrad1)" strokeWidth="8" strokeLinecap="round" />
        <path d="M50 45 L25 20" stroke="url(#pnGrad1)" strokeWidth="6" strokeLinecap="round" />
        <path d="M50 45 L75 20" stroke="url(#pnGrad1)" strokeWidth="6" strokeLinecap="round" />
        <circle cx="25" cy="18" r="5" fill="url(#pnGrad1)" />
        <circle cx="75" cy="18" r="5" fill="url(#pnGrad1)" />
        <path d="M50 80 L35 130" stroke="url(#pnGrad1)" strokeWidth="7" strokeLinecap="round" />
        <path d="M50 80 L65 130" stroke="url(#pnGrad1)" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="35" cy="135" rx="8" ry="4" fill="url(#pnGrad1)" />
        <ellipse cx="65" cy="135" rx="8" ry="4" fill="url(#pnGrad1)" />
      </svg>
    ),
    'standing': (
      <svg viewBox="0 0 100 150" className="w-full h-full">
        <defs>
          <linearGradient id="pnGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="20" r="12" fill="url(#pnGrad2)" />
        <path d="M50 32 L50 80" stroke="url(#pnGrad2)" strokeWidth="8" strokeLinecap="round" />
        <path d="M50 50 L35 55 L45 60" stroke="url(#pnGrad2)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M50 50 L65 55 L55 60" stroke="url(#pnGrad2)" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M50 80 L40 130" stroke="url(#pnGrad2)" strokeWidth="7" strokeLinecap="round" />
        <path d="M50 80 L60 130" stroke="url(#pnGrad2)" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="40" cy="135" rx="8" ry="4" fill="url(#pnGrad2)" />
        <ellipse cx="60" cy="135" rx="8" ry="4" fill="url(#pnGrad2)" />
      </svg>
    ),
    'bowing': (
      <svg viewBox="0 0 120 100" className="w-full h-full">
        <defs>
          <linearGradient id="pnGrad3" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <circle cx="30" cy="35" r="10" fill="url(#pnGrad3)" />
        <path d="M38 38 L80 38" stroke="url(#pnGrad3)" strokeWidth="8" strokeLinecap="round" />
        <path d="M55 38 L55 60" stroke="url(#pnGrad3)" strokeWidth="5" strokeLinecap="round" />
        <path d="M65 38 L65 60" stroke="url(#pnGrad3)" strokeWidth="5" strokeLinecap="round" />
        <path d="M80 38 L85 85" stroke="url(#pnGrad3)" strokeWidth="7" strokeLinecap="round" />
        <path d="M80 38 L95 85" stroke="url(#pnGrad3)" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="85" cy="90" rx="7" ry="4" fill="url(#pnGrad3)" />
        <ellipse cx="95" cy="90" rx="7" ry="4" fill="url(#pnGrad3)" />
      </svg>
    ),
    'prostrating': (
      <svg viewBox="0 0 140 80" className="w-full h-full">
        <defs>
          <linearGradient id="pnGrad4" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <line x1="10" y1="70" x2="130" y2="70" stroke="#334155" strokeWidth="2" />
        <circle cx="25" cy="62" r="9" fill="url(#pnGrad4)" />
        <path d="M32 58 Q60 30 90 45" stroke="url(#pnGrad4)" strokeWidth="8" strokeLinecap="round" fill="none" />
        <path d="M35 58 L15 65" stroke="url(#pnGrad4)" strokeWidth="5" strokeLinecap="round" />
        <path d="M35 58 L45 68" stroke="url(#pnGrad4)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="13" cy="67" r="4" fill="url(#pnGrad4)" />
        <circle cx="47" cy="68" r="4" fill="url(#pnGrad4)" />
        <path d="M90 45 L110 65" stroke="url(#pnGrad4)" strokeWidth="7" strokeLinecap="round" />
        <path d="M110 65 L95 68" stroke="url(#pnGrad4)" strokeWidth="6" strokeLinecap="round" />
        <ellipse cx="93" cy="68" rx="5" ry="3" fill="url(#pnGrad4)" />
      </svg>
    ),
    'sitting': (
      <svg viewBox="0 0 100 120" className="w-full h-full">
        <defs>
          <linearGradient id="pnGrad5" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.6" />
          </linearGradient>
        </defs>
        <line x1="10" y1="110" x2="90" y2="110" stroke="#334155" strokeWidth="2" />
        <circle cx="50" cy="25" r="11" fill="url(#pnGrad5)" />
        <path d="M50 36 L50 75" stroke="url(#pnGrad5)" strokeWidth="8" strokeLinecap="round" />
        <path d="M50 55 L35 75" stroke="url(#pnGrad5)" strokeWidth="5" strokeLinecap="round" />
        <path d="M50 55 L65 75" stroke="url(#pnGrad5)" strokeWidth="5" strokeLinecap="round" />
        <circle cx="33" cy="77" r="4" fill="url(#pnGrad5)" />
        <circle cx="67" cy="77" r="4" fill="url(#pnGrad5)" />
        <path d="M50 75 L30 90 L25 105" stroke="url(#pnGrad5)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <path d="M50 75 L70 90 L80 105" stroke="url(#pnGrad5)" strokeWidth="7" strokeLinecap="round" strokeLinejoin="round" fill="none" />
        <ellipse cx="25" cy="108" rx="8" ry="4" fill="url(#pnGrad5)" />
        <ellipse cx="82" cy="108" rx="6" ry="4" fill="url(#pnGrad5)" />
      </svg>
    ),
  };

  return silhouettes[type] || silhouettes['standing'];
};

// Audio URLs for recitations (using everyayah.com API - Mishary Rashid Alafasy)
const AUDIO_BASE = 'https://everyayah.com/data/Alafasy_128kbps';
const AUDIO_BASE_HUSARY = 'https://everyayah.com/data/Husary_128kbps';

// Map recitation IDs to audio files
const audioMap: Record<string, string> = {
  'basmala': `${AUDIO_BASE}/001001.mp3`,
  'fatiha-1': `${AUDIO_BASE}/001002.mp3`,
  'fatiha-2': `${AUDIO_BASE}/001003.mp3`,
  'fatiha-3': `${AUDIO_BASE}/001004.mp3`,
  'fatiha-4': `${AUDIO_BASE}/001005.mp3`,
  'fatiha-5': `${AUDIO_BASE}/001006.mp3`,
  'fatiha-6': `${AUDIO_BASE}/001007.mp3`,
  'fatiha-7': `${AUDIO_BASE}/001007.mp3`, // Part of same verse
};

// Duration in ms for recitations without audio - gives time to read and recite
const recitationDurations: Record<string, number> = {
  'takbir': 3000,           // Allahu Akbar - short
  'istiftah': 12000,        // Opening supplication - long
  'taawwudh': 5000,         // A'udhu billah - medium
  'ameen': 3000,            // Ameen - short
  'ruku-dhikr': 8000,       // Subhana Rabbiyal Adheem x3
  'sami-allah': 4000,       // Sami'Allahu liman hamidah
  'rabbana-lakal-hamd': 4000, // Rabbana wa lakal hamd
  'sujood-dhikr': 8000,     // Subhana Rabbiyal A'la x3
  'between-sujood': 5000,   // Rabbighfirli
  'tashahhud': 15000,       // Long recitation
  'shahada': 8000,          // Testimony of faith
  'durood-ibrahim': 18000,  // Longest recitation
  'salam-right': 4000,      // Assalamu alaikum
};

// Get duration for a recitation (default 8 seconds if not specified)
const getRecitationDuration = (id: string, timesToRepeat?: number): number => {
  const baseDuration = recitationDurations[id] || 8000;
  // Add extra time for repeated recitations
  if (timesToRepeat && timesToRepeat > 1) {
    return baseDuration * 1.5;
  }
  return baseDuration;
};

// Check if a recitation is part of Fatiha sequence
const isFatihaRecitation = (id: string): boolean => {
  return id === 'basmala' || id.startsWith('fatiha-');
};

// Get the next Fatiha recitation ID in sequence
const getNextFatihaId = (currentId: string): string | null => {
  const sequence = ['basmala', 'fatiha-1', 'fatiha-2', 'fatiha-3', 'fatiha-4', 'fatiha-5', 'fatiha-6', 'fatiha-7'];
  const currentIndex = sequence.indexOf(currentId);
  if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
    return sequence[currentIndex + 1];
  }
  return null;
};

export default function PrayNowMode({ onBack }: PrayNowModeProps) {
  const [viewState, setViewState] = useState<ViewState>('select');
  const [selectedPrayer, setSelectedPrayer] = useState<DailyPrayer | null>(null);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [isAutoMode, setIsAutoMode] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const audioQueueRef = useRef<string[]>([]);
  const currentAudioIndexRef = useRef(0);

  // Generate steps for selected prayer
  const prayerSteps = useMemo(() => {
    if (!selectedPrayer) return [];
    return getPrayerSteps(selectedPrayer.id);
  }, [selectedPrayer]);

  const currentStep = prayerSteps[currentStepIndex];
  const progress = prayerSteps.length > 0
    ? Math.round(((currentStepIndex + 1) / prayerSteps.length) * 100)
    : 0;

  // Build audio queue for current step (one recitation at a time)
  const buildAudioQueue = useCallback((step: PrayerStep): string[] => {
    const recitation = step.position.recitations[step.recitationIndex];
    const queue: string[] = [];

    // Queue only the current recitation's audio if available
    if (audioMap[recitation.id]) {
      queue.push(audioMap[recitation.id]);
    }

    return queue;
  }, []);

  // Advance to next step helper
  const advanceToNextStep = useCallback(() => {
    if (currentStepIndex < prayerSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      setIsAutoMode(false);
    }
  }, [currentStepIndex, prayerSteps.length]);

  // Play next audio in queue
  const playNextInQueue = useCallback(() => {
    if (!audioRef.current || !audioEnabled) return;

    if (currentAudioIndexRef.current < audioQueueRef.current.length) {
      const nextUrl = audioQueueRef.current[currentAudioIndexRef.current];
      audioRef.current.src = nextUrl;
      audioRef.current.play().catch(() => {
        // Audio play failed, use timer fallback for this step
        setIsPlayingAudio(false);
        if (isAutoMode && !isPaused) {
          const recitation = currentStep?.position.recitations[currentStep?.recitationIndex || 0];
          const delay = recitation ? getRecitationDuration(recitation.id, recitation.timesToRepeat) : 5000;
          timerRef.current = setTimeout(advanceToNextStep, delay);
        }
      });
      currentAudioIndexRef.current++;
      setIsPlayingAudio(true);
    } else {
      setIsPlayingAudio(false);
    }
  }, [audioEnabled, isAutoMode, isPaused, currentStep, advanceToNextStep]);

  // Handle audio ended - play next in queue or advance
  const handleAudioEnded = useCallback(() => {
    if (currentAudioIndexRef.current < audioQueueRef.current.length) {
      // More audio in queue, play next
      playNextInQueue();
    } else {
      // Queue finished
      setIsPlayingAudio(false);

      // If in auto mode, advance to next step after a brief pause
      if (isAutoMode && !isPaused) {
        timerRef.current = setTimeout(advanceToNextStep, 500);
      }
    }
  }, [isAutoMode, isPaused, advanceToNextStep, playNextInQueue]);

  // Handle audio error - fall back to timer
  const handleAudioError = useCallback(() => {
    setIsPlayingAudio(false);
    if (isAutoMode && !isPaused && currentStep) {
      const recitation = currentStep.position.recitations[currentStep.recitationIndex];
      const delay = getRecitationDuration(recitation.id, recitation.timesToRepeat);
      timerRef.current = setTimeout(advanceToNextStep, delay);
    }
  }, [isAutoMode, isPaused, currentStep, advanceToNextStep]);

  // Set up audio event listeners
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.addEventListener('ended', handleAudioEnded);
      audio.addEventListener('error', handleAudioError);
      return () => {
        audio.removeEventListener('ended', handleAudioEnded);
        audio.removeEventListener('error', handleAudioError);
      };
    }
  }, [handleAudioEnded, handleAudioError]);

  // Handle step changes in auto mode
  useEffect(() => {
    if (isAutoMode && !isPaused && viewState === 'praying' && !isComplete && currentStep) {
      // Clear any existing timer
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      const recitation = currentStep.position.recitations[currentStep.recitationIndex];

      // Check if this recitation has audio
      if (audioEnabled && audioMap[recitation.id]) {
        // Build and start audio queue
        audioQueueRef.current = buildAudioQueue(currentStep);
        currentAudioIndexRef.current = 0;
        playNextInQueue();
      } else {
        // No audio available, use timer-based advance with appropriate duration
        const delay = getRecitationDuration(recitation.id, recitation.timesToRepeat);
        timerRef.current = setTimeout(advanceToNextStep, delay);
      }

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [isAutoMode, isPaused, currentStepIndex, viewState, isComplete, currentStep, audioEnabled, buildAudioQueue, playNextInQueue, advanceToNextStep]);

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

  // Handle pause/resume
  useEffect(() => {
    if (audioRef.current) {
      if (isPaused) {
        audioRef.current.pause();
      } else if (isAutoMode && isPlayingAudio) {
        audioRef.current.play().catch(() => {});
      }
    }
  }, [isPaused, isAutoMode, isPlayingAudio]);

  const handleSelectPrayer = (prayer: DailyPrayer) => {
    setSelectedPrayer(prayer);
    setCurrentStepIndex(0);
    setIsComplete(false);
    setIsAutoMode(false);
    setIsPaused(false);
    setIsPlayingAudio(false);
    audioQueueRef.current = [];
    currentAudioIndexRef.current = 0;

    // Check if this prayer has a video guide
    if (prayerVideoMap[prayer.id]) {
      setViewState('video');
    } else {
      setViewState('intention');
    }
  };

  const handleConfirmIntention = () => {
    setViewState('praying');
    // Auto-start prayer mode immediately
    setIsAutoMode(true);
    setIsPaused(false);
  };

  const handleStartAutoMode = () => {
    setIsAutoMode(true);
    setIsPaused(false);
  };

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
  };

  const handleNext = () => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioQueueRef.current = [];
    currentAudioIndexRef.current = 0;
    setIsPlayingAudio(false);

    if (currentStepIndex < prayerSteps.length - 1) {
      setCurrentStepIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
      setIsAutoMode(false);
    }
  };

  const handlePrevious = () => {
    // Stop current audio
    if (audioRef.current) {
      audioRef.current.pause();
    }
    audioQueueRef.current = [];
    currentAudioIndexRef.current = 0;
    setIsPlayingAudio(false);

    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleExitPrayer = () => {
    if (audioRef.current) {
      audioRef.current.pause();
    }
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    setViewState('select');
    setSelectedPrayer(null);
    setCurrentStepIndex(0);
    setIsComplete(false);
    setIsAutoMode(false);
    setIsPlayingAudio(false);
    audioQueueRef.current = [];
    currentAudioIndexRef.current = 0;
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
            className="flex items-center gap-2 text-slate-300 hover:text-white transition-colors"
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
          <p className="text-slate-300 text-lg">
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
              <p className="text-sm text-slate-400 font-arabic">
                {prayer.arabicName}
              </p>
              <div className="mt-2 text-xs text-slate-300">
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
              and follow along as it auto-advances through each recitation with continuous audio.
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
        <audio ref={audioRef} preload="auto" />

        {/* Minimal Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80">
          <button
            onClick={handleExitPrayer}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
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
                <VolumeX className="w-5 h-5 text-slate-400" />
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
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 overflow-y-auto">
          {/* Position Image - Always Visible */}
          <motion.div
            key={`position-${currentStep.position.iconType}`}
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="w-28 h-28 md:w-36 md:h-36 mb-4 bg-slate-900/50 rounded-2xl border border-emerald-800/30 p-2 flex-shrink-0"
          >
            <PositionImage type={currentStep.position.iconType} />
          </motion.div>

          <motion.div
            key={currentStepIndex}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl text-center"
          >
            {/* Position Name */}
            <div className="mb-3">
              <span className="text-sm text-emerald-400 font-medium">
                {currentStep.position.name}
              </span>
            </div>

            {/* Arabic Text - Large with proper line-height for harakat */}
            <p
              className="font-arabic text-4xl md:text-5xl lg:text-6xl text-emerald-100 mb-6"
              dir="rtl"
              style={{
                lineHeight: '2.2',
                letterSpacing: '0.02em'
              }}
            >
              {recitation.arabic}
            </p>

            {/* Transliteration */}
            <p className="text-slate-300 italic text-lg md:text-xl mb-4">
              {recitation.transliteration}
            </p>

            {/* Translation - Clear and readable */}
            <p
              className="text-amber-100 text-xl md:text-2xl leading-relaxed mb-4"
              style={{ lineHeight: '1.6' }}
            >
              {recitation.translation}
            </p>

            {/* Reference - Only show for non-Quran recitations (dhikr, etc.) */}
            {recitation.reference && !isFatihaRecitation(recitation.id) && (
              <p className="text-slate-300 text-xs mt-4">
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
                  className="flex items-center gap-2 px-4 py-2 text-slate-300 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <ArrowLeft className="w-5 h-5" />
                  Previous
                </button>

                <div className="text-slate-300 text-sm">
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

              <div className="text-slate-300 text-sm">
                {currentStepIndex + 1} / {prayerSteps.length}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  };

  // Intention Screen - Make niyyah before starting prayer
  const renderIntentionScreen = () => {
    if (!selectedPrayer) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-slate-950 flex items-center justify-center px-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="max-w-lg w-full text-center"
        >
          {/* Prayer Icon */}
          <div className="text-6xl mb-6">{selectedPrayer.icon}</div>

          {/* Prayer Name */}
          <h2 className="text-3xl font-bold text-white mb-2">
            {selectedPrayer.name}
          </h2>
          <p
            className="text-emerald-300 font-arabic text-2xl mb-4"
            style={{ lineHeight: '1.8' }}
          >
            {selectedPrayer.arabicName}
          </p>

          {/* Rakah Count */}
          <div className="inline-block px-4 py-2 bg-slate-800/50 rounded-full text-slate-300 text-sm mb-8">
            {selectedPrayer.rakahs} Rakahs
          </div>

          {/* Intention Reminder */}
          <div className="bg-emerald-900/20 rounded-2xl p-6 border border-emerald-800/30 mb-8">
            <h3 className="text-emerald-300 font-semibold text-lg mb-3">
              Make Your Intention
            </h3>
            <p className="text-slate-300 leading-relaxed mb-4">
              Before starting, make the intention in your heart that you are
              praying <span className="text-emerald-400 font-medium">{selectedPrayer.name}</span>.
            </p>
            <p className="text-slate-300 text-sm italic">
              The intention (niyyah) is made in the heart, not spoken aloud.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <button
              onClick={handleConfirmIntention}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-semibold text-lg transition-colors"
            >
              <Play className="w-6 h-6" />
              Begin Prayer
            </button>
            <button
              onClick={() => {
                setViewState('select');
                setSelectedPrayer(null);
              }}
              className="w-full px-6 py-3 text-slate-300 hover:text-white transition-colors"
            >
              Choose Different Prayer
            </button>
          </div>
        </motion.div>
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
          <p className="text-slate-300 mb-8">
            May Allah accept your prayer
          </p>

          <div className="space-y-3">
            <button
              onClick={() => {
                setCurrentStepIndex(0);
                setIsComplete(false);
                setIsAutoMode(false);
                setIsPlayingAudio(false);
                audioQueueRef.current = [];
                currentAudioIndexRef.current = 0;
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
              className="w-full px-6 py-4 text-slate-300 hover:text-white transition-colors"
            >
              Back to Menu
            </button>
          </div>
        </motion.div>
      </motion.div>
    );
  };

  // Video Player Screen - for prayers with YouTube video guides
  const renderVideoPlayer = () => {
    if (!selectedPrayer) return null;

    const videoId = prayerVideoMap[selectedPrayer.id];
    if (!videoId) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-black flex flex-col"
      >
        {/* Top Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/80">
          <button
            onClick={() => {
              setViewState('select');
              setSelectedPrayer(null);
            }}
            className="p-2 hover:bg-slate-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-slate-300" />
          </button>

          <div className="text-center">
            <div className="text-white font-medium text-sm">
              {selectedPrayer.name} Prayer Guide
            </div>
          </div>

          <div className="w-9" /> {/* Spacer for alignment */}
        </div>

        {/* Video Container - Mobile First */}
        <div className="flex-1 flex flex-col px-2 sm:px-4 py-4 overflow-y-auto">
          {/* Video wrapper */}
          <div className="w-full max-w-4xl mx-auto">
            {/* YouTube Thumbnail with Play Button - works on all devices */}
            <a
              href={`https://www.youtube.com/watch?v=${videoId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block relative w-full rounded-xl sm:rounded-2xl overflow-hidden bg-slate-900 group"
              style={{ aspectRatio: '16/9' }}
            >
              {/* Thumbnail */}
              <img
                src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                alt={`${selectedPrayer.name} Prayer Guide`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to medium quality if maxres doesn't exist
                  (e.target as HTMLImageElement).src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
                }}
              />
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/40 transition-colors">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                  <Play className="w-8 h-8 sm:w-10 sm:h-10 text-white ml-1" fill="white" />
                </div>
              </div>
              {/* YouTube Badge */}
              <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
                Watch on YouTube
              </div>
            </a>

            {/* Tap to watch hint */}
            <p className="text-center text-slate-400 text-sm mt-3">
              Tap to watch on YouTube
            </p>
          </div>

          {/* Info Card */}
          <div className="mt-4 sm:mt-6 max-w-2xl w-full mx-auto bg-slate-900/50 rounded-xl p-4 border border-emerald-800/30">
            <p className="text-emerald-300 text-sm text-center mb-2">
              <span className="font-semibold">{selectedPrayer.name}</span> • {selectedPrayer.rakahs} Rakahs
            </p>
            <p className="text-slate-400 text-xs text-center">
              Follow along with the video. Surah Al-Kawthar in the 1st rakah, Surah Al-Ikhlas in the 2nd.
            </p>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="px-4 py-4 bg-slate-950/80">
          <div className="max-w-2xl mx-auto flex gap-3">
            <button
              onClick={() => {
                setViewState('select');
                setSelectedPrayer(null);
              }}
              className="flex-1 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-medium transition-colors"
            >
              Choose Another Prayer
            </button>
            <button
              onClick={onBack}
              className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-medium transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {viewState === 'select' && renderPrayerSelection()}
      {viewState === 'intention' && renderIntentionScreen()}
      {viewState === 'video' && renderVideoPlayer()}
      {viewState === 'praying' && !isComplete && renderPrayerWalkthrough()}
      {viewState === 'praying' && isComplete && renderCompletion()}
    </AnimatePresence>
  );
}
