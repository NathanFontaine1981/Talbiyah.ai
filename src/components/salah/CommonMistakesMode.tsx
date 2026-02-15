import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ChevronDown, AlertTriangle } from 'lucide-react';
import {
  salahMistakes,
  severityColors,
  severityLabels,
  categoryLabels,
  type MistakeCategory,
} from '../../data/salahMistakesData';

interface CommonMistakesModeProps {
  onBack: () => void;
}

type FilterOption = 'all' | MistakeCategory;

const filterOptions: { value: FilterOption; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'position', label: 'Position' },
  { value: 'focus', label: 'Focus' },
  { value: 'invalidator', label: 'Invalidators' },
  { value: 'general', label: 'General' },
];

export default function CommonMistakesMode({ onBack }: CommonMistakesModeProps) {
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredMistakes =
    activeFilter === 'all'
      ? salahMistakes
      : salahMistakes.filter((m) => m.category === activeFilter);

  const invalidatingCount = salahMistakes.filter((m) => m.severity === 'invalidates').length;

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
          className="bg-gradient-to-r from-orange-500 to-red-500 rounded-2xl p-6 mb-6 text-white"
        >
          <div className="flex items-center gap-3 mb-2">
            <AlertTriangle className="w-8 h-8" />
            <h1 className="text-2xl md:text-3xl font-bold">Common Mistakes</h1>
          </div>
          <p className="text-white/70 text-sm mt-2 max-w-lg">
            Learn what to avoid so your prayer is accepted and performed correctly. Some of these
            mistakes can invalidate your entire prayer.
          </p>

          {/* Stats */}
          <div className="mt-4 flex items-center gap-3">
            <span className="bg-white/20 px-3 py-1 rounded-full text-sm">
              {salahMistakes.length} mistakes to avoid
            </span>
            <span className="bg-red-400/30 px-3 py-1 rounded-full text-sm font-medium">
              {invalidatingCount} invalidate your prayer
            </span>
          </div>
        </motion.div>

        {/* Filter Pills */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 mb-6"
        >
          {filterOptions.map((option) => (
            <button
              key={option.value}
              onClick={() => setActiveFilter(option.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                activeFilter === option.value
                  ? 'bg-orange-500 text-white shadow-md'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-orange-300 hover:text-orange-600'
              }`}
            >
              {option.label}
              {option.value !== 'all' && (
                <span className="ml-1.5 opacity-70">
                  ({salahMistakes.filter((m) =>
                    option.value === 'all' ? true : m.category === option.value
                  ).length})
                </span>
              )}
            </button>
          ))}
        </motion.div>

        {/* Mistakes Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {filteredMistakes.map((mistake, index) => {
            const isExpanded = expandedId === mistake.id;
            const colors = severityColors[mistake.severity];

            return (
              <motion.div
                key={mistake.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className="bg-white rounded-xl border border-gray-200 hover:border-orange-200 overflow-hidden transition-all"
              >
                {/* Card Header */}
                <div className="p-4">
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {mistake.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-gray-900">{mistake.title}</h3>
                      </div>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}
                        >
                          {severityLabels[mistake.severity]}
                        </span>
                        <span className="text-xs text-gray-400">
                          {categoryLabels[mistake.category]}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Mistake Description - always visible */}
                  <p className="text-sm text-gray-600 mt-3 leading-relaxed">
                    {mistake.mistakeDescription}
                  </p>
                </div>

                {/* Expandable Correction */}
                <div className="border-t border-gray-100">
                  <button
                    onClick={() => setExpandedId(isExpanded ? null : mistake.id)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-sm font-medium text-orange-600 hover:bg-orange-50 transition-colors"
                  >
                    <span>{isExpanded ? 'Hide correction' : 'How to fix this'}</span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
                    />
                  </button>

                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-3">
                          {/* Correction */}
                          <div className="bg-emerald-50 rounded-lg p-3">
                            <p className="text-xs font-medium text-emerald-700 mb-1">Correct Way</p>
                            <p className="text-sm text-gray-700 leading-relaxed">
                              {mistake.correction}
                            </p>
                          </div>

                          {/* Tips */}
                          {mistake.tips && mistake.tips.length > 0 && (
                            <div>
                              <p className="text-xs font-medium text-gray-500 mb-1.5">Tips</p>
                              <ul className="space-y-1">
                                {mistake.tips.map((tip, tipIdx) => (
                                  <li
                                    key={tipIdx}
                                    className="flex items-start gap-2 text-sm text-gray-600"
                                  >
                                    <span className="text-orange-400 mt-0.5 flex-shrink-0">
                                      &#8226;
                                    </span>
                                    {tip}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {/* Reference */}
                          {mistake.reference && (
                            <p className="text-xs text-gray-400">{mistake.reference}</p>
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
      </div>
    </motion.div>
  );
}
