import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, ShieldAlert, Droplets } from 'lucide-react';
import { wuduSteps, wuduInvalidators, duaAfterWudu } from '../../data/wuduData';

interface WuduModeProps {
  onBack: () => void;
}

export default function WuduMode({ onBack }: WuduModeProps) {
  const [expandedStepId, setExpandedStepId] = useState<string | null>(null);
  const [showInvalidators, setShowInvalidators] = useState(false);

  const orderedSteps = wuduSteps;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Back button */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-6">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back to Salah
          </button>
        </motion.div>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-cyan-600 to-teal-600 rounded-2xl p-6 mb-8 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <Droplets className="w-8 h-8" />
            <h1 className="text-2xl md:text-3xl font-bold">Learn Wudu</h1>
          </div>
          <p className="text-white/80 font-arabic text-lg">الوضوء</p>
          <p className="text-white/70 text-sm mt-2 max-w-lg">
            Wudu (ablution) is the ritual purification required before prayer. Master these steps
            to prepare yourself spiritually and physically for standing before Allah.
          </p>
          <div className="mt-4 flex items-center gap-3">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {orderedSteps.length} Steps
            </span>
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              Shafi'i Madhab
            </span>
          </div>
        </motion.div>

        {/* Steps Timeline */}
        <div className="space-y-3 mb-8">
          {orderedSteps.map((step, index) => {
            const isExpanded = expandedStepId === step.id;

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="relative"
              >
                {/* Timeline connector */}
                {index < orderedSteps.length - 1 && (
                  <div className="absolute left-7 top-16 w-0.5 h-[calc(100%-2rem)] bg-cyan-200 z-0" />
                )}

                <div className="relative z-10 bg-white rounded-xl border border-gray-200 hover:border-cyan-300 transition-all overflow-hidden">
                  {/* Step Header */}
                  <button
                    onClick={() => setExpandedStepId(isExpanded ? null : step.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-cyan-50/50 transition-colors"
                  >
                    <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center flex-shrink-0 text-lg">
                      {step.icon}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-700">
                          {step.order}
                        </span>
                        <h3 className="font-semibold text-gray-900 truncate">{step.title}</h3>
                      </div>
                      <p className="text-xs text-gray-500 mt-0.5">{step.arabicTitle} - {step.transliteration}</p>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-1">{step.description}</p>
                    </div>

                    {step.timesToRepeat && (
                      <span className="text-xs bg-cyan-50 text-cyan-700 px-2 py-1 rounded-full flex-shrink-0">
                        x{step.timesToRepeat}
                      </span>
                    )}

                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
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
                        <div className="px-4 pb-4 space-y-4">
                          {/* Detailed description */}
                          <div className="bg-cyan-50 rounded-lg p-4">
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {step.detailedDescription}
                            </p>
                          </div>

                          {/* Dua (if any) */}
                          {step.dua && (
                            <div className="bg-white rounded-lg border border-cyan-200 p-4">
                              <p className="text-xs font-medium text-cyan-700 mb-2">Dua / Words to Say</p>
                              <p className="text-2xl text-right font-arabic text-gray-800 leading-loose mb-2" dir="rtl">
                                {step.dua.arabic}
                              </p>
                              <p className="text-sm text-cyan-600 font-medium">{step.dua.transliteration}</p>
                              <p className="text-sm text-gray-600 mt-1">{step.dua.translation}</p>
                              {step.dua.reference && (
                                <p className="text-xs text-gray-400 mt-2">{step.dua.reference}</p>
                              )}
                            </div>
                          )}

                          {/* Repeat count */}
                          {step.timesToRepeat && step.timesToRepeat > 1 && (
                            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
                              <span className="font-medium">Repeat {step.timesToRepeat} times</span>
                            </div>
                          )}

                          {/* Tips */}
                          {step.tips.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-2">Tips</p>
                              <ul className="space-y-1.5">
                                {step.tips.map((tip, tipIdx) => (
                                  <li key={tipIdx} className="flex items-start gap-2 text-sm text-gray-600">
                                    <span className="text-cyan-500 mt-0.5 flex-shrink-0">&#8226;</span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Dua After Wudu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-cyan-50 to-teal-50 rounded-2xl border border-cyan-200 p-6 mb-8"
        >
          <h2 className="text-lg font-bold text-cyan-800 mb-1">Dua After Wudu</h2>
          <p className="text-sm text-cyan-600 mb-4">
            The Prophet (peace be upon him) said: "Whoever performs wudu and says this dua, all
            eight gates of Paradise will be opened for him."
          </p>

          <div className="bg-white rounded-xl p-5 border border-cyan-100">
            <p className="text-2xl md:text-3xl text-right font-arabic text-gray-800 leading-[2.5] mb-4" dir="rtl">
              {duaAfterWudu.arabic}
            </p>
            <p className="text-sm text-cyan-600 font-medium mb-2">
              {duaAfterWudu.transliteration}
            </p>
            <p className="text-sm text-gray-600 leading-relaxed">
              {duaAfterWudu.translation}
            </p>
            <p className="text-xs text-gray-400 mt-3">{duaAfterWudu.reference}</p>
          </div>
        </motion.div>

        {/* What Invalidates Wudu */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mb-8"
        >
          <button
            onClick={() => setShowInvalidators(!showInvalidators)}
            className="w-full bg-white rounded-2xl border border-red-200 hover:border-red-300 p-5 text-left transition-all"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">What Invalidates Wudu?</h2>
                  <p className="text-sm text-gray-500">{wuduInvalidators.length} things that break your wudu</p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-gray-400 transition-transform ${showInvalidators ? 'rotate-180' : ''}`}
              />
            </div>
          </button>

          <AnimatePresence>
            {showInvalidators && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 space-y-3">
                  {wuduInvalidators.map((invalidator, idx) => (
                    <motion.div
                      key={invalidator.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.05 * idx }}
                      className="bg-white rounded-xl border border-red-100 p-4 flex items-start gap-4"
                    >
                      <div className="w-10 h-10 rounded-lg bg-red-50 flex items-center justify-center text-lg flex-shrink-0">
                        {invalidator.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{invalidator.title}</h3>
                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">
                          {invalidator.description}
                        </p>
                        {invalidator.reference && (
                          <p className="text-xs text-gray-400 mt-2">{invalidator.reference}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
}
