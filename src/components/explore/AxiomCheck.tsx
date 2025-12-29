import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Atom, Heart, Leaf, Sparkles, ChevronRight } from 'lucide-react';

interface AxiomCheckProps {
  onComplete: (agreedAxioms: string[]) => void;
}

// Categories of undeniable knowledge
const categories = [
  {
    id: 'cosmic',
    name: 'The Cosmic Reality',
    subtitle: 'The Stage',
    icon: <Atom className="w-6 h-6" />,
    bgClass: 'bg-blue-500/20',
    textClass: 'text-blue-400',
  },
  {
    id: 'biological',
    name: 'The Biological Reality',
    subtitle: 'The Machine',
    icon: <Sparkles className="w-6 h-6" />,
    bgClass: 'bg-purple-500/20',
    textClass: 'text-purple-400',
  },
  {
    id: 'natural',
    name: 'The Natural Order',
    subtitle: 'The Ecosystem',
    icon: <Leaf className="w-6 h-6" />,
    bgClass: 'bg-emerald-500/20',
    textClass: 'text-emerald-400',
  },
  {
    id: 'human',
    name: 'The Human Condition',
    subtitle: 'The Soul',
    icon: <Heart className="w-6 h-6" />,
    bgClass: 'bg-rose-500/20',
    textClass: 'text-rose-400',
  },
];

// The Axioms - Undeniable facts organized by category
const axioms = [
  // COSMIC REALITY
  {
    id: 'big-bang',
    category: 'cosmic',
    fact: 'The universe had a beginning',
    detail: 'The Big Bang: Everything emerged from a single point. The universe was not always here.',
  },
  {
    id: 'universe-expansion',
    category: 'cosmic',
    fact: 'The universe is expanding',
    detail: 'Space itself is stretching. Galaxies are moving apart from each other.',
  },
  {
    id: 'earth-sphere',
    category: 'cosmic',
    fact: 'The Earth is spherical',
    detail: 'Not flat. Observable from space and through physics.',
  },
  {
    id: 'sun-moon-light',
    category: 'cosmic',
    fact: 'The Sun generates light; the Moon reflects it',
    detail: 'The Sun is a source of heat and light. The Moon has no light of its own.',
  },
  {
    id: 'day-night',
    category: 'cosmic',
    fact: 'Day and night alternate with precision',
    detail: 'This cycle is predictable and mathematically precise.',
  },
  {
    id: 'water-life',
    category: 'cosmic',
    fact: 'Water is essential for all life',
    detail: 'Every known living thing requires water to survive.',
  },

  // BIOLOGICAL REALITY
  {
    id: 'born-helpless',
    category: 'biological',
    fact: 'We are born helpless',
    detail: 'Humans did not create themselves. We arrive completely dependent.',
  },
  {
    id: 'death-certain',
    category: 'biological',
    fact: 'Death is inevitable',
    detail: 'Every living thing dies. No exceptions.',
  },
  {
    id: 'embryo-stages',
    category: 'biological',
    fact: 'Human formation follows specific stages in the womb',
    detail: 'Drop of fluid → clinging substance → lump → bones → flesh covers bones.',
  },
  {
    id: 'body-heals',
    category: 'biological',
    fact: 'The body heals itself',
    detail: 'Cuts clot, bones knit, cells regenerate—without conscious command.',
  },
  {
    id: 'fingerprints',
    category: 'biological',
    fact: 'Every human has unique fingerprints',
    detail: 'No two people share the same fingerprint pattern.',
  },
  {
    id: 'skin-pain',
    category: 'biological',
    fact: 'Pain receptors are located in the skin',
    detail: 'When skin is destroyed (3rd-degree burns), we feel no pain there.',
  },

  // NATURAL ORDER
  {
    id: 'male-female',
    category: 'natural',
    fact: 'Reproduction requires male and female',
    detail: 'The human race continues through this duality.',
  },
  {
    id: 'baby-instinct',
    category: 'natural',
    fact: 'Babies instinctively know how to nurse',
    detail: 'No one teaches them—they know immediately after birth.',
  },
  {
    id: 'parent-protection',
    category: 'natural',
    fact: 'Parents have an innate drive to protect their young',
    detail: 'This is hormonal and instinctive, seen across all mammals.',
  },
  {
    id: 'seasons-cycle',
    category: 'natural',
    fact: 'Nature follows cycles of life, death, and resurrection',
    detail: 'Spring → Summer → Autumn → Winter → Spring again.',
  },
  {
    id: 'animal-intelligence',
    category: 'natural',
    fact: 'Animals have complex intelligence',
    detail: 'Ants build colonies. Bees communicate through dance. Many exceed human senses.',
  },

  // HUMAN CONDITION
  {
    id: 'moral-compass',
    category: 'human',
    fact: 'We have an innate sense of fairness',
    detail: 'Even children feel anger at injustice. We know right from wrong.',
  },
  {
    id: 'emotions-real',
    category: 'human',
    fact: 'Emotions are real but not physical',
    detail: 'Love, anger, jealousy, mercy—states of the soul, not objects.',
  },
  {
    id: 'organs-purpose',
    category: 'human',
    fact: 'Every organ has a purpose',
    detail: 'Eyes to see, ears to hear. If parts have purpose, the whole must too.',
  },
  {
    id: 'conscious-will',
    category: 'human',
    fact: 'We can choose to defy our instincts',
    detail: 'Unlike animals, we can fast when hungry, stay awake when tired.',
  },
];

export const AxiomCheck = ({ onComplete }: AxiomCheckProps) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [agreedAxioms, setAgreedAxioms] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [isComplete, setIsComplete] = useState(false);

  const currentCategory = categories[currentCategoryIndex];
  const categoryAxioms = axioms.filter(a => a.category === currentCategory?.id);

  // Check if all axioms in current category are processed
  const allCategoryAxiomsProcessed = categoryAxioms.every(
    a => agreedAxioms.includes(a.id)
  );

  const handleAgreeToAll = () => {
    const categoryAxiomIds = categoryAxioms.map(a => a.id);
    setAgreedAxioms(prev => [...new Set([...prev, ...categoryAxiomIds])]);

    if (currentCategoryIndex < categories.length - 1) {
      setCurrentCategoryIndex(prev => prev + 1);
    } else {
      setIsComplete(true);
    }
  };

  const progress = ((currentCategoryIndex) / categories.length) * 100;

  // Intro screen with Almanac concept
  if (showIntro) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-4xl sm:text-5xl font-serif text-white mb-6">
              The Almanac Test
            </h1>

            <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8 text-left">
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Imagine you had a book from the future. You flip to 1950, and it correctly
                predicts the World Cup winner. You flip to 2020, and it predicts a global
                event perfectly. You check 50 different dates, and it is <span className="text-blue-400 font-semibold">never wrong</span>.
              </p>

              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Now, you flip to the page for <span className="text-amber-400 font-semibold">Tomorrow</span>.
                It tells you exactly what to do to survive.
              </p>

              <p className="text-xl text-white font-medium">
                Would you debate it? Or would you use it?
              </p>
            </div>

            <div className="bg-blue-900/30 rounded-xl p-6 border border-blue-700/50 mb-8">
              <p className="text-blue-200">
                Before we check the "Almanac," let's agree on the data.
                Here are <span className="font-bold">{axioms.length} undeniable facts</span> about reality.
              </p>
            </div>

            <button
              onClick={() => setShowIntro(false)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              Let's Establish the Facts
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Completion - transition to Almanac verification
  if (isComplete) {
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
          >
            <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-10 h-10 text-emerald-400" />
            </div>

            <h2 className="text-3xl font-serif text-white mb-4">
              We Agree on {agreedAxioms.length} Facts
            </h2>

            <p className="text-slate-300 text-lg mb-6">
              These are undeniable truths about reality—the <span className="text-blue-400">stable floor</span> we both stand on.
            </p>

            {/* Category summary */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {categories.map(cat => {
                const catAxioms = axioms.filter(a => a.category === cat.id);
                const agreedCount = catAxioms.filter(a => agreedAxioms.includes(a.id)).length;
                return (
                  <div
                    key={cat.id}
                    className="bg-slate-900/50 rounded-xl p-4 border border-slate-700"
                  >
                    <div className="flex items-center gap-2 mb-2 text-slate-400">
                      {cat.icon}
                      <span className="text-sm">{cat.subtitle}</span>
                    </div>
                    <p className="text-white font-semibold">
                      {agreedCount}/{catAxioms.length} agreed
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-900/30 rounded-xl p-6 border border-amber-700/50 mb-8">
              <p className="text-amber-200 text-lg">
                Now, let's check the "Almanac."
                <br />
                <span className="text-white font-semibold">
                  A 1,400-year-old book claims to know all of this.
                </span>
              </p>
            </div>

            <button
              onClick={() => onComplete(agreedAxioms)}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              Verify the Almanac
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Category view with all axioms
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col">
      {/* Progress bar */}
      <div className="fixed top-0 left-0 right-0 h-1 bg-slate-800 z-50">
        <motion.div
          className="h-full bg-blue-500"
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Category tabs */}
      <div className="pt-8 px-4">
        <div className="flex justify-center gap-2 mb-4">
          {categories.map((cat, index) => (
            <button
              key={cat.id}
              onClick={() => index <= currentCategoryIndex && setCurrentCategoryIndex(index)}
              disabled={index > currentCategoryIndex}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                index === currentCategoryIndex
                  ? 'bg-blue-600 text-white'
                  : index < currentCategoryIndex
                  ? 'bg-emerald-900/50 text-emerald-300 border border-emerald-700'
                  : 'bg-slate-800 text-slate-500'
              }`}
            >
              {cat.subtitle}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentCategory.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="max-w-2xl w-full"
          >
            {/* Category Header */}
            <div className="text-center mb-8">
              <div className={`w-16 h-16 ${currentCategory.bgClass} rounded-full flex items-center justify-center mx-auto mb-4 ${currentCategory.textClass}`}>
                {currentCategory.icon}
              </div>
              <h2 className="text-2xl font-serif text-white mb-1">
                {currentCategory.name}
              </h2>
              <p className="text-slate-400">{currentCategory.subtitle}</p>
            </div>

            {/* Axioms List */}
            <div className="bg-slate-900/70 rounded-2xl border border-slate-700 overflow-hidden mb-6">
              {categoryAxioms.map((axiom, index) => (
                <motion.div
                  key={axiom.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 ${
                    index < categoryAxioms.length - 1 ? 'border-b border-slate-700' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-slate-800 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs text-slate-400">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium mb-1">{axiom.fact}</p>
                      <p className="text-slate-400 text-sm">{axiom.detail}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Agree button */}
            <div className="text-center">
              <p className="text-slate-400 text-sm mb-4">
                Do you agree these are undeniable facts?
              </p>
              <button
                onClick={handleAgreeToAll}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
              >
                <Check className="w-5 h-5" />
                Yes, I Agree to All {categoryAxioms.length}
              </button>
              <p className="text-slate-500 text-xs mt-4">
                {currentCategoryIndex + 1} of {categories.length} categories
              </p>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AxiomCheck;
