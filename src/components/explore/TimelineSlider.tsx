import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';

interface TimelineSliderProps {
  onComplete: (answer: 'creator' | 'nothing') => void;
}

export const TimelineSlider = ({ onComplete }: TimelineSliderProps) => {
  const [sliderValue, setSliderValue] = useState(0);
  const [showLogicGate, setShowLogicGate] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  // Calculate what era we're in based on slider value
  const getEraLabel = (value: number): string => {
    if (value < 10) return 'Present Day';
    if (value < 30) return 'Ancient Civilizations';
    if (value < 50) return 'Dinosaurs (~65 million years)';
    if (value < 70) return 'First Life (~3.5 billion years)';
    if (value < 90) return 'Earth Forms (~4.5 billion years)';
    if (value < 100) return 'The Big Bang (~13.8 billion years)';
    return 'Before Time Itself...';
  };

  // Visual intensity based on how far back we go
  const getBackgroundOpacity = (value: number): number => {
    return Math.min(value / 100, 1);
  };

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setSliderValue(value);

    if (value === 100 && !showLogicGate) {
      setIsAnimating(true);
      setTimeout(() => {
        setShowLogicGate(true);
        setIsAnimating(false);
      }, 800);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Animated stars background that intensifies as we go back */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{
          opacity: getBackgroundOpacity(sliderValue),
          background: `radial-gradient(circle at 50% 50%, rgba(59, 130, 246, 0.1) 0%, transparent 50%)`
        }}
      />

      {/* Floating particles */}
      {sliderValue > 50 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: sliderValue / 100 }}
          className="absolute inset-0 pointer-events-none"
        >
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-blue-400 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3],
              }}
              transition={{
                duration: 2 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </motion.div>
      )}

      <AnimatePresence mode="wait">
        {!showLogicGate ? (
          <motion.div
            key="slider"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="relative z-10 w-full max-w-2xl text-center"
          >
            <h2 className="text-3xl sm:text-4xl font-serif text-white mb-4">
              Journey to the Beginning
            </h2>
            <p className="text-slate-400 mb-8">
              Drag the slider back through time...
            </p>

            {/* Era Display */}
            <motion.div
              key={getEraLabel(sliderValue)}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <span className="text-2xl text-blue-400 font-medium">
                {getEraLabel(sliderValue)}
              </span>
            </motion.div>

            {/* The Timeline Slider */}
            <div className="relative mb-4">
              <input
                type="range"
                min="0"
                max="100"
                value={sliderValue}
                onChange={handleSliderChange}
                className="w-full h-3 bg-slate-800 rounded-lg appearance-none cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-6
                  [&::-webkit-slider-thumb]:h-6
                  [&::-webkit-slider-thumb]:bg-blue-500
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:shadow-lg
                  [&::-webkit-slider-thumb]:shadow-blue-500/50
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-110
                  [&::-moz-range-thumb]:w-6
                  [&::-moz-range-thumb]:h-6
                  [&::-moz-range-thumb]:bg-blue-500
                  [&::-moz-range-thumb]:rounded-full
                  [&::-moz-range-thumb]:border-0
                  [&::-moz-range-thumb]:cursor-pointer"
              />

              {/* Progress fill */}
              <div
                className="absolute top-0 left-0 h-3 bg-gradient-to-r from-blue-600 to-blue-400 rounded-lg pointer-events-none"
                style={{ width: `${sliderValue}%` }}
              />
            </div>

            {/* Labels */}
            <div className="flex justify-between text-sm text-slate-500">
              <span>Today</span>
              <span>The Origin</span>
            </div>

            {/* Hint when close */}
            {sliderValue > 80 && sliderValue < 100 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-6 text-blue-300 text-sm"
              >
                Keep going... what was before the beginning?
              </motion.p>
            )}

            {/* Loading animation */}
            {isAnimating && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-8 flex items-center justify-center gap-2 text-blue-400"
              >
                <Sparkles className="w-5 h-5 animate-pulse" />
                <span>Reaching the origin...</span>
              </motion.div>
            )}
          </motion.div>
        ) : (
          <motion.div
            key="logic-gate"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative z-10 w-full max-w-2xl text-center"
          >
            {/* The Big Question */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-10 h-10 text-blue-400" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-serif text-white mb-6">
                Before the Big Bang...
              </h2>

              <p className="text-xl text-slate-300 mb-8 leading-relaxed">
                Science tells us the universe began from a singularity.
                <br />
                <span className="text-blue-300">But what caused that first moment?</span>
              </p>

              <div className="bg-slate-900/70 rounded-2xl p-6 border border-slate-700 mb-8">
                <p className="text-lg text-slate-200 italic">
                  "Can nothing create something?"
                </p>
                <p className="text-slate-400 mt-2 text-sm">
                  Every effect requires a cause. What was the First Cause?
                </p>
              </div>

              {/* The Choice */}
              <p className="text-slate-400 mb-6">What makes more logical sense?</p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => onComplete('nothing')}
                  className="px-8 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full text-lg font-medium transition"
                >
                  Nothing Created Everything
                </button>
                <button
                  onClick={() => onComplete('creator')}
                  className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
                >
                  An Uncaused Cause (Creator)
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TimelineSlider;
