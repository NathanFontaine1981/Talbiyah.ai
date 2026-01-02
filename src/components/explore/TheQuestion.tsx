import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, HelpCircle, User, Users, Sparkles, Check, Brain } from 'lucide-react';

interface TheQuestionProps {
  verifiedCount: number;
  totalFacts: number;
  onComplete: (belief: string) => void;
}

const sourceOptions = [
  {
    id: 'single-human',
    label: 'A single human being',
    description: 'Muhammad wrote it himself using knowledge available at the time',
    icon: <User className="w-6 h-6" />,
    color: 'slate',
  },
  {
    id: 'group-humans',
    label: 'A group of humans',
    description: 'Multiple people collaborated to write it over time',
    icon: <Users className="w-6 h-6" />,
    color: 'slate',
  },
  {
    id: 'divine-human',
    label: 'Divinely inspired human',
    description: 'A human who received some form of inspiration or guidance',
    icon: <Brain className="w-6 h-6" />,
    color: 'blue',
  },
  {
    id: 'creator',
    label: 'The Creator',
    description: 'Direct communication from the One who made everything',
    icon: <Sparkles className="w-6 h-6" />,
    color: 'amber',
  },
];

export const TheQuestion = ({ verifiedCount, totalFacts, onComplete }: TheQuestionProps) => {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showReflection, setShowReflection] = useState(false);
  const [showSpecialistLogic, setShowSpecialistLogic] = useState(false);

  const handleSelect = (optionId: string) => {
    setSelectedOption(optionId);
    // Show reflection after selection
    setTimeout(() => setShowReflection(true), 500);
  };

  const handleContinue = () => {
    if (selectedOption) {
      onComplete(selectedOption);
    }
  };

  const getColorClasses = (color: string, isSelected: boolean) => {
    if (!isSelected) {
      return 'bg-slate-900/70 border-slate-700 hover:border-slate-500';
    }
    switch (color) {
      case 'amber':
        return 'bg-amber-900/30 border-amber-500';
      case 'blue':
        return 'bg-blue-900/30 border-blue-500';
      default:
        return 'bg-slate-800 border-slate-500';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4"
    >
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 bg-indigo-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <HelpCircle className="w-10 h-10 text-indigo-400" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-serif text-white mb-4">
            The Question
          </h1>

          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-700 mb-6">
            <p className="text-lg text-slate-300 leading-relaxed mb-4">
              You've agreed that <span className="text-emerald-400 font-semibold">{verifiedCount} facts</span> are undeniably true.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed mb-4">
              A book written <span className="text-amber-400 font-semibold">over 1,400 years ago</span> stated all of them accurately—
              long before modern science discovered them.
            </p>

            {!showSpecialistLogic ? (
              <button
                onClick={() => setShowSpecialistLogic(true)}
                className="text-blue-400 hover:text-blue-300 text-sm underline transition"
              >
                Think about this...
              </button>
            ) : (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="mt-4"
              >
                <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-700/50 mb-4">
                  <p className="text-blue-200 text-sm mb-3">
                    To fully understand the human body alone, you need <span className="text-white font-semibold">10+ specialists</span>:
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {['Optician', 'Cardiologist', 'Neurologist', 'Osteopath', 'Dermatologist', 'Gastroenterologist'].map(spec => (
                      <span key={spec} className="px-2 py-1 bg-slate-800 rounded text-slate-300 text-xs">{spec}</span>
                    ))}
                    <span className="px-2 py-1 bg-slate-700 rounded text-slate-400 text-xs">+ more...</span>
                  </div>
                  <p className="text-blue-200 text-sm mb-3">
                    It takes a <span className="text-white font-semibold">lifetime</span> to become a specialist in just <span className="text-white">one</span> field.
                    People study for <span className="text-white">7-15 years</span> just to become a doctor in a single specialisation.
                  </p>
                  <p className="text-blue-200 text-sm mb-3">
                    To master astronomy, embryology, oceanography, geology, and biology would take <span className="text-amber-300 font-semibold">many lifetimes</span>. It's literally impossible for one person.
                  </p>
                  <p className="text-white font-medium">
                    Yet one book—revealed to one illiterate man who couldn't read or write—accurately covers all of these fields
                    <span className="text-amber-300"> with zero errors.</span>
                  </p>
                  <p className="text-slate-400 text-sm mt-3 italic">
                    How do you reconcile this knowledge source?
                  </p>
                </div>
              </motion.div>
            )}

            <p className="text-xl text-white font-medium mt-4">
              Where do you think this knowledge came from?
            </p>
          </div>
        </motion.div>

        {/* Options */}
        <div className="space-y-3 mb-8">
          {sourceOptions.map((option, index) => {
            const isSelected = selectedOption === option.id;
            return (
              <motion.button
                key={option.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                onClick={() => handleSelect(option.id)}
                className={`w-full p-4 rounded-xl border-2 transition-all text-left ${getColorClasses(option.color, isSelected)}`}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${
                    isSelected
                      ? option.color === 'amber' ? 'bg-amber-500/30 text-amber-400'
                        : option.color === 'blue' ? 'bg-blue-500/30 text-blue-400'
                        : 'bg-slate-600 text-slate-300'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {isSelected ? <Check className="w-6 h-6" /> : option.icon}
                  </div>
                  <div className="flex-1">
                    <p className={`font-semibold text-lg ${isSelected ? 'text-white' : 'text-slate-200'}`}>
                      {option.label}
                    </p>
                    <p className="text-slate-400 text-sm">
                      {option.description}
                    </p>
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Reflection after selection */}
        <AnimatePresence>
          {showReflection && selectedOption && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-8"
            >
              {selectedOption === 'creator' ? (
                <div className="bg-emerald-900/30 rounded-xl p-6 border border-emerald-700/50">
                  <p className="text-emerald-200 text-lg mb-4">
                    If it's from the Creator, then this isn't just any book—
                    it's <span className="text-white font-semibold">direct communication</span> from the One who made you.
                  </p>
                  <p className="text-emerald-200">
                    And if He's communicating with you, there must be a reason.
                  </p>
                </div>
              ) : selectedOption === 'divine-human' ? (
                <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-700/50">
                  <p className="text-blue-200 text-lg mb-4">
                    If a human received divine inspiration, the question becomes:
                    <span className="text-white font-semibold"> who was inspiring them?</span>
                  </p>
                  <p className="text-blue-200">
                    And if there's a source of divine guidance—shouldn't we know what it says?
                  </p>
                </div>
              ) : (
                <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-600">
                  <p className="text-slate-300 text-lg mb-4">
                    Consider: how could {selectedOption === 'single-human' ? 'one person' : 'a group'} in 7th century Arabia know about:
                  </p>
                  <ul className="text-slate-400 text-sm space-y-1 mb-4">
                    <li>• The Big Bang (discovered 1927)</li>
                    <li>• Universe expansion (discovered 1929)</li>
                    <li>• Embryonic development stages (confirmed 1940)</li>
                    <li>• Pain receptors in skin (discovered 1906)</li>
                  </ul>
                  <p className="text-slate-300">
                    With <span className="text-white font-semibold">100% accuracy</span>?
                    <br />
                    <span className="text-slate-400 text-sm">Not a single error in over 1,400 years.</span>
                  </p>
                </div>
              )}

              <button
                onClick={handleContinue}
                className="mt-6 w-full px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
              >
                Continue
                <ArrowRight className="w-5 h-5" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!showReflection && (
          <p className="text-center text-slate-500 text-sm">
            Select an option above to continue
          </p>
        )}
      </div>
    </motion.div>
  );
};

export default TheQuestion;
