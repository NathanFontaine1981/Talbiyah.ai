import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Filter, Check, X as XIcon } from 'lucide-react';

interface ReligionFilterProps {
  onComplete: () => void;
}

interface Religion {
  id: string;
  name: string;
  icon: string;
  claim: string;
  testable: boolean;
  reason: string;
}

const religions: Religion[] = [
  {
    id: 'hinduism',
    name: 'Hinduism',
    icon: '🕉️',
    claim: 'Eternal truths revealed through many texts over millennia',
    testable: false,
    reason: 'Texts evolved over time with no single "original" to verify. Multiple contradicting versions exist.',
  },
  {
    id: 'buddhism',
    name: 'Buddhism',
    icon: '☸️',
    claim: 'Path to enlightenment through meditation and wisdom',
    testable: false,
    reason: 'Does not claim divine authorship or make verifiable predictions about the physical world.',
  },
  {
    id: 'judaism',
    name: 'Judaism',
    icon: '✡️',
    claim: 'Torah given by God to Moses on Mount Sinai',
    testable: false,
    reason: 'The Torah has documented textual variations. Dead Sea Scrolls show differences from modern texts.',
  },
  {
    id: 'christianity',
    name: 'Christianity',
    icon: '✝️',
    claim: 'Bible is the inspired word of God through various authors',
    testable: false,
    reason: 'Over 5,700 Greek manuscripts with significant variations. No original copies exist. Councils decided which books to include.',
  },
  {
    id: 'islam',
    name: 'Islam',
    icon: '☪️',
    claim: 'Quran is the unchanged word of God, preserved letter-for-letter',
    testable: true,
    reason: 'Single source, memorized by millions, manuscripts from 7th century match today\'s text exactly. Contains testable scientific statements.',
  },
];

const filterCriteria = [
  {
    id: 'preservation',
    question: 'Can the original text be verified unchanged?',
    description: 'Is there a verifiable chain of preservation back to the original revelation?',
  },
  {
    id: 'testable',
    question: 'Does it make testable claims about reality?',
    description: 'Can we verify claims against scientific or historical evidence?',
  },
  {
    id: 'single-source',
    question: 'Is there a single, authoritative source?',
    description: 'Was it revealed through one prophet in a defined timeframe?',
  },
];

export const ReligionFilter = ({ onComplete }: ReligionFilterProps) => {
  const [currentFilter, setCurrentFilter] = useState(0);
  const [filteredOut, setFilteredOut] = useState<string[]>([]);
  const [showResult, setShowResult] = useState(false);

  const activeReligions = religions.filter(r => !filteredOut.includes(r.id));
  const currentCriteria = filterCriteria[currentFilter];

  const handleApplyFilter = () => {
    // Filter out religions that don't pass the current criteria
    const toFilter = religions.filter(r => !r.testable && !filteredOut.includes(r.id));
    const newFiltered = [...filteredOut, ...toFilter.map(r => r.id)];
    setFilteredOut(newFiltered);

    setTimeout(() => {
      if (currentFilter < filterCriteria.length - 1) {
        setCurrentFilter(prev => prev + 1);
      } else {
        setShowResult(true);
      }
    }, 800);
  };

  if (showResult) {
    const remaining = religions.filter(r => !filteredOut.includes(r.id));

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="mb-8"
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Filter className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-serif text-white mb-4">
              Filter Complete
            </h2>
            <p className="text-slate-300 text-lg">
              Only {remaining.length} religion{remaining.length !== 1 ? 's' : ''} passed all criteria
            </p>
          </motion.div>

          {/* Remaining religion(s) */}
          <div className="space-y-4 mb-8">
            {remaining.map((religion) => (
              <motion.div
                key={religion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-emerald-900/30 rounded-xl p-6 border border-emerald-500/50"
              >
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-4xl">{religion.icon}</span>
                  <h3 className="text-2xl font-semibold text-white">{religion.name}</h3>
                </div>
                <p className="text-emerald-200">
                  {religion.reason}
                </p>
              </motion.div>
            ))}
          </div>

          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 mb-8">
            <p className="text-slate-300">
              This doesn't prove Islam is true—but it shows Islam makes
              <span className="text-blue-300 font-medium"> verifiable claims</span>
              {' '}that can be tested. Let's examine the evidence.
            </p>
          </div>

          <button
            onClick={onComplete}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
          >
            Examine the Evidence
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Filter className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-3xl font-serif text-white mb-2">
            The Verification Filter
          </h2>
          <p className="text-slate-400">
            Let's apply logical criteria to major world religions
          </p>
        </div>

        {/* Current Filter */}
        <motion.div
          key={currentFilter}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-blue-900/30 rounded-xl p-6 border border-blue-700/50 mb-8 text-center"
        >
          <p className="text-sm text-blue-300 mb-2">Filter {currentFilter + 1} of {filterCriteria.length}</p>
          <h3 className="text-xl text-white font-medium mb-2">
            {currentCriteria.question}
          </h3>
          <p className="text-slate-400 text-sm">
            {currentCriteria.description}
          </p>
        </motion.div>

        {/* Religion Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          <AnimatePresence>
            {religions.map((religion) => {
              const isFiltered = filteredOut.includes(religion.id);

              return (
                <motion.div
                  key={religion.id}
                  layout
                  initial={{ opacity: 1, scale: 1 }}
                  animate={{
                    opacity: isFiltered ? 0.3 : 1,
                    scale: isFiltered ? 0.95 : 1,
                    filter: isFiltered ? 'grayscale(100%)' : 'none',
                  }}
                  className={`relative bg-slate-900/70 rounded-xl p-5 border ${
                    isFiltered
                      ? 'border-slate-700'
                      : religion.testable
                      ? 'border-emerald-500/50'
                      : 'border-slate-600'
                  }`}
                >
                  {/* Filtered out overlay */}
                  {isFiltered && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center">
                        <XIcon className="w-6 h-6 text-red-400" />
                      </div>
                    </div>
                  )}

                  <div className={isFiltered ? 'opacity-30' : ''}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{religion.icon}</span>
                      <h4 className="text-lg font-medium text-white">{religion.name}</h4>
                    </div>
                    <p className="text-sm text-slate-400 mb-3">
                      {religion.claim}
                    </p>
                    {!isFiltered && (
                      <div className={`flex items-center gap-2 text-sm ${
                        religion.testable ? 'text-emerald-400' : 'text-amber-400'
                      }`}>
                        {religion.testable ? (
                          <>
                            <Check className="w-4 h-4" />
                            <span>Passes filter</span>
                          </>
                        ) : (
                          <>
                            <XIcon className="w-4 h-4" />
                            <span>Doesn't pass</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Apply Filter Button */}
        <div className="text-center">
          <button
            onClick={handleApplyFilter}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
          >
            Apply This Filter
            <Filter className="w-5 h-5" />
          </button>
          <p className="text-slate-500 text-sm mt-4">
            {activeReligions.length} religion{activeReligions.length !== 1 ? 's' : ''} remaining
          </p>
        </div>
      </div>
    </div>
  );
};

export default ReligionFilter;
