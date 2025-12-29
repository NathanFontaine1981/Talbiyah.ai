import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Check, Atom, Heart, Leaf, Sparkles, ChevronRight, BookOpen, TrendingUp, DollarSign, Brain, Zap, Clock } from 'lucide-react';

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

// Story scenes for the Almanac intro
const storyScenes = [
  {
    id: 'scene1',
    title: 'The Sports Almanac',
    icon: <BookOpen className="w-12 h-12" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Remember <span className="text-amber-400 font-semibold">Back to the Future II</span>?
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Biff steals a book from the future: <span className="text-amber-400 font-semibold">"Grays Sports Almanac: 1950-2000"</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          It doesn't <span className="italic">predict</span> anything. It simply <span className="text-white font-semibold">records facts</span>—every score, every winner, every result.
          <span className="text-slate-500 italic"> Because for the book, it already happened.</span>
        </p>
      </>
    ),
  },
  {
    id: 'scene2',
    title: 'Building Belief',
    icon: <TrendingUp className="w-12 h-12" />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          You find the book. At first, <span className="text-white font-semibold">you have 0% belief</span>. Why would you?
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          But then you test it...
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 mb-4 border border-slate-700">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Result 1 correct</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[10%] h-full bg-emerald-500"></div>
                </div>
                <span className="text-emerald-400 text-sm">10%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Result 5 correct</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[40%] h-full bg-emerald-500"></div>
                </div>
                <span className="text-emerald-400 text-sm">40%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-300">Result 20 correct</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-[75%] h-full bg-emerald-500"></div>
                </div>
                <span className="text-emerald-400 text-sm">75%</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-white font-medium">Result 50 correct</span>
              <div className="flex items-center gap-2">
                <div className="w-24 h-2 bg-slate-700 rounded-full overflow-hidden">
                  <div className="w-full h-full bg-emerald-500"></div>
                </div>
                <span className="text-emerald-400 text-sm font-bold">99%</span>
              </div>
            </div>
          </div>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          Each correct result <span className="text-emerald-400 font-semibold">compounds your certainty</span>.
          The only thing that would break it? <span className="text-rose-400">A single wrong result.</span>
        </p>
      </>
    ),
  },
  {
    id: 'scene3',
    title: 'The Point of Certainty',
    icon: <Brain className="w-12 h-12" />,
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          After 50 verified results with <span className="text-white font-semibold">zero errors</span>, something shifts in your mind.
        </p>
        <div className="space-y-3 mb-4">
          <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-amber-500">
            <p className="text-amber-200 italic">"This isn't luck. This isn't coincidence."</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-blue-500">
            <p className="text-blue-200 italic">"These aren't predictions—they're recorded facts."</p>
          </div>
          <div className="bg-slate-800/50 rounded-lg p-3 border-l-4 border-emerald-500">
            <p className="text-emerald-200 italic">"The book knows what happens before I witness it."</p>
          </div>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          You've reached <span className="text-purple-400 font-semibold">the point of certainty</span>—not blind faith, but
          <span className="text-white font-semibold"> earned conviction</span> built on verified evidence.
        </p>
      </>
    ),
  },
  {
    id: 'scene4',
    title: 'Munich, 1958',
    icon: <Clock className="w-12 h-12" />,
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          You turn to February 6th, 1958. <span className="text-white font-semibold">Manchester United's Busby Babes</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The book records: <span className="text-slate-400 italic">"Match result: Drew 3-3 in Belgrade. United through 5-4 on aggregate."</span>
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Then you see the next entry: <span className="text-rose-400 font-semibold">"Flight 609 crashed on takeoff from Munich. 23 dead."</span>
        </p>
        <div className="bg-rose-900/30 rounded-xl p-5 border border-rose-700/50 mb-4">
          <p className="text-xl text-white font-medium mb-3">
            Now ask yourself honestly:
          </p>
          <p className="text-rose-200 text-lg">
            If you were there—and this book had been <span className="font-bold">100% accurate</span> on everything—
            <br /><br />
            <span className="text-white font-semibold">Would you get on that plane?</span>
          </p>
        </div>
        <p className="text-slate-400 text-sm italic">
          The book isn't predicting. It's stating what already happened—you just haven't witnessed it yet.
        </p>
      </>
    ),
  },
  {
    id: 'scene5',
    title: 'The Logic of Belief',
    icon: <Zap className="w-12 h-12" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          This is the logic: If a source is <span className="text-emerald-400 font-semibold">100% accurate about everything you can verify</span>...
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          ...what rational reason do you have to doubt what it says about things <span className="text-white font-semibold">you haven't witnessed yet?</span>
        </p>
        <div className="bg-slate-800/50 rounded-xl p-5 border border-slate-700 mb-4">
          <p className="text-slate-300 mb-3">
            <span className="text-emerald-400">✓</span> Correct about the past → <span className="text-white">Verified</span>
          </p>
          <p className="text-slate-300 mb-3">
            <span className="text-emerald-400">✓</span> Correct about the present (which becomes past) → <span className="text-white">Verified</span>
          </p>
          <p className="text-slate-300">
            <span className="text-blue-400">?</span> What it says about the future → <span className="text-white font-semibold">Why would you doubt it?</span>
          </p>
        </div>
        <p className="text-lg text-blue-200 leading-relaxed">
          This is <span className="text-white font-semibold">belief in the unseen</span>—not blind faith, but certainty built on a foundation of verified truth.
        </p>
      </>
    ),
  },
  {
    id: 'scene6',
    title: 'The Real Almanac',
    icon: <BookOpen className="w-12 h-12" />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Now imagine a different book. Not about sports.
          <br />
          About <span className="text-blue-400 font-semibold">the universe, biology, nature, and human existence</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          A book from <span className="text-amber-400 font-semibold">1,400 years ago</span> that states facts about science
          that humanity only discovered in the last century—<span className="text-white font-semibold">with absolute certainty</span>.
        </p>
        <div className="bg-blue-900/30 rounded-xl p-5 border border-blue-700/50">
          <p className="text-xl text-white font-medium mb-2">
            Let's test this Almanac.
          </p>
          <p className="text-blue-200">
            First, we'll agree on <span className="font-bold">{axioms.length} undeniable facts</span> about reality.
            <br />
            Then, we'll check if the Book stated them accurately.
          </p>
        </div>
      </>
    ),
  },
];

export const AxiomCheck = ({ onComplete }: AxiomCheckProps) => {
  const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
  const [agreedAxioms, setAgreedAxioms] = useState<string[]>([]);
  const [showIntro, setShowIntro] = useState(true);
  const [introScene, setIntroScene] = useState(0);
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

  // Intro screen with Almanac story scenes
  if (showIntro) {
    const currentScene = storyScenes[introScene];
    const isLastScene = introScene === storyScenes.length - 1;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-slate-950 flex flex-col"
      >
        {/* Progress dots */}
        <div className="fixed top-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-50">
          {storyScenes.map((_, i) => (
            <button
              key={i}
              onClick={() => setIntroScene(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all ${
                i === introScene
                  ? 'bg-blue-500 w-6'
                  : i < introScene
                  ? 'bg-blue-500/50'
                  : 'bg-slate-700'
              }`}
            />
          ))}
        </div>

        <div className="flex-1 flex items-center justify-center p-4 pt-16">
          <div className="max-w-2xl w-full">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentScene.id}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                {/* Scene Icon */}
                <div className={`w-24 h-24 ${currentScene.iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                  <div className={currentScene.iconColor}>
                    {currentScene.icon}
                  </div>
                </div>

                {/* Scene Title */}
                <h1 className="text-3xl sm:text-4xl font-serif text-white mb-2">
                  {currentScene.title}
                </h1>
                <p className="text-slate-500 text-sm mb-8">
                  Scene {introScene + 1} of {storyScenes.length}
                </p>

                {/* Scene Content */}
                <div className="bg-slate-900/70 rounded-2xl p-6 sm:p-8 border border-slate-700 mb-8 text-left">
                  {currentScene.content}
                </div>

                {/* Navigation */}
                <div className="flex items-center justify-center gap-4">
                  {introScene > 0 && (
                    <button
                      onClick={() => setIntroScene(prev => prev - 1)}
                      className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full transition"
                    >
                      Back
                    </button>
                  )}

                  {isLastScene ? (
                    <button
                      onClick={() => setShowIntro(false)}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      Begin the Test
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  ) : (
                    <button
                      onClick={() => setIntroScene(prev => prev + 1)}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
                    >
                      Continue
                      <ArrowRight className="w-5 h-5" />
                    </button>
                  )}
                </div>

                {/* Skip option */}
                {!isLastScene && (
                  <button
                    onClick={() => setShowIntro(false)}
                    className="mt-6 text-slate-500 hover:text-slate-300 text-sm transition"
                  >
                    Skip story →
                  </button>
                )}
              </motion.div>
            </AnimatePresence>
          </div>
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
