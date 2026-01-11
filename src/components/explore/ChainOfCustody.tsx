import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, FileSearch, Book, BookOpen, CheckCircle, XCircle, AlertTriangle, Link, MessageCircle, Coffee, RefreshCw } from 'lucide-react';

interface ChainOfCustodyProps {
  onComplete: () => void;
  onBack?: () => void;
}

const scenes = [
  {
    id: 'intro',
    title: 'Examining the Sources',
    icon: 'file-search',
    content: null, // Custom content
    commentary: "In a court of law, if the evidence has been tampered with, the case is thrown out. I applied that same rule to God's Word.",
    section: 1,
  },
  {
    id: 'exhibit-a',
    title: 'Exhibit A: The Bible',
    icon: 'books',
    content: null, // Custom animated content
    commentary: "initial-findings", // Special marker for custom label
    section: 1,
  },
  {
    id: 'exhibit-b',
    title: 'Exhibit B: The Quran',
    icon: 'quran',
    content: null, // Custom animated content
    commentary: "I wanted to verify there was only one version, so I searched the internet for anyone claiming to have a different version or reciting something different. No evidence anywhere. I did find different dialects which were approved and carried the exact same meaning — I counted this as the same. I accepted it has not been changed until proven otherwise.",
    section: 1,
  },
  {
    id: 'section-1-recap',
    title: 'Section 1 Complete',
    icon: 'pause',
    content: null, // Custom recap content
    commentary: null,
    section: 1,
    isRecap: true,
  },
  {
    id: 'transition',
    title: 'But Wait...',
    icon: 'alert',
    content: null, // Custom content
    commentary: "Just because it's preserved doesn't mean it's from God. I could write a book and preserve it myself. So I looked at the content.",
    section: 2,
  },
];

export default function ChainOfCustody({ onComplete, onBack }: ChainOfCustodyProps) {
  const [currentScene, setCurrentScene] = useState(0);
  const [animationPhase, setAnimationPhase] = useState(0);
  const scene = scenes[currentScene];
  const isLastScene = currentScene === scenes.length - 1;
  const isFirstScene = currentScene === 0;

  // Reset animation phase when scene changes
  useEffect(() => {
    setAnimationPhase(0);

    // Auto-advance animation phases for exhibit scenes
    if (scene.id === 'exhibit-a' || scene.id === 'exhibit-b') {
      const timer1 = setTimeout(() => setAnimationPhase(1), 1000);
      const timer2 = setTimeout(() => setAnimationPhase(2), 2500);
      const timer3 = setTimeout(() => setAnimationPhase(3), 4000);
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
        clearTimeout(timer3);
      };
    }
  }, [currentScene, scene.id]);

  const handleNext = () => {
    if (isLastScene) {
      onComplete();
    } else {
      setCurrentScene(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (isFirstScene && onBack) {
      onBack();
    } else if (!isFirstScene) {
      setCurrentScene(prev => prev - 1);
    }
  };

  // Render scene-specific content
  const renderSceneContent = () => {
    switch (scene.id) {
      case 'intro':
        return (
          <div className="space-y-6">
            <p className="text-lg text-slate-300 leading-relaxed">
              I wanted to examine the religion I was already following — or should I say, the one <span className="text-amber-400 font-semibold">my family brought me up on</span>.
            </p>
            <p className="text-lg text-slate-300 leading-relaxed">
              It was only fair to examine the <span className="text-amber-400 font-semibold">largest religion</span> alongside the <span className="text-emerald-400 font-semibold">most practiced religion in the world</span> — Islam.
            </p>
            <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-600">
              <p className="text-slate-300 leading-relaxed">
                I said to myself: <span className="text-white font-medium">"I'm an adult now. Surely I can work out if these books are man-made to control the masses, or if there is some truth to one of these religions' claims."</span>
              </p>
            </div>
            <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
              <p className="text-lg text-amber-200 leading-relaxed">
                My goal: gather <span className="text-white font-semibold">conclusive proof</span> of either one being true — or both being false.
              </p>
            </div>
            <p className="text-slate-400 leading-relaxed">
              But before I read what the books said, I had to check <span className="text-white">where they came from</span>.
            </p>
          </div>
        );

      case 'exhibit-a':
        return (
          <div className="space-y-6">
            {/* The Bookshelf Animation */}
            <div className="relative bg-gradient-to-b from-amber-950/50 to-slate-900/50 rounded-xl p-6 border border-amber-800/30 min-h-[200px] overflow-hidden">
              {/* Shelf - positioned below books */}
              <div className="absolute bottom-20 left-4 right-4 h-2 bg-amber-900/60 rounded" />

              {/* Books appearing and changing */}
              <div className="flex justify-center items-end gap-1 h-40 relative">
                {/* Animated books */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: animationPhase >= 1 ? [0.3, 1, 0.5, 1][i % 4] : 0,
                      y: animationPhase >= 1 ? 0 : 20,
                      scale: animationPhase >= 2 ? [1, 0.9, 1.1, 0.95][i % 4] : 1,
                    }}
                    transition={{
                      delay: i * 0.1,
                      duration: 0.5,
                      scale: { duration: 1, repeat: animationPhase >= 2 ? Infinity : 0, repeatType: 'reverse' }
                    }}
                    className={`rounded-t ${
                      ['bg-red-800', 'bg-blue-800', 'bg-green-800', 'bg-purple-800', 'bg-orange-800', 'bg-teal-800'][i % 6]
                    }`}
                    style={{
                      width: `${20 + (i % 3) * 5}px`,
                      height: `${80 + (i % 4) * 20}px`,
                    }}
                  />
                ))}

                {/* Version labels appearing */}
                {animationPhase >= 2 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute -top-2 left-0 right-0 flex justify-around text-[10px] text-slate-400"
                  >
                    <span>KJV</span>
                    <span>NIV</span>
                    <span>ESV</span>
                    <span>NKJV</span>
                  </motion.div>
                )}
              </div>

              {/* Label */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: animationPhase >= 1 ? 1 : 0 }}
                className="text-center mt-4"
              >
                <span className="text-amber-400 font-medium text-sm">THE BIBLE</span>
                <span className="text-slate-500 text-xs block mt-1">(from Greek "biblia" meaning "books" — a collection, not a single book)</span>
              </motion.div>
            </div>

            {/* Facts revealed progressively */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: animationPhase >= 1 ? 1 : 0, x: animationPhase >= 1 ? 0 : -20 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <Book className="w-5 h-5 text-amber-500" />
                <span><span className="text-white font-semibold">66 or 72 books</span> — Catholics and Protestants can't agree</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: animationPhase >= 2 ? 1 : 0, x: animationPhase >= 2 ? 0 : -20 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <Book className="w-5 h-5 text-amber-500" />
                <span><span className="text-white font-semibold">Multiple authors</span> wrote different chapters over centuries</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: animationPhase >= 2 ? 1 : 0, x: animationPhase >= 2 ? 0 : -20 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span>Jesus spoke <span className="text-white font-semibold">Aramaic</span>, but oldest manuscripts are in <span className="text-white font-semibold">Greek</span></span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: animationPhase >= 3 ? 1 : 0, x: animationPhase >= 3 ? 0 : -20 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span><span className="text-white font-semibold">Different versions</span> have different verse counts in the same chapter</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: animationPhase >= 3 ? 1 : 0, x: animationPhase >= 3 ? 0 : -20 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span><span className="text-white font-semibold">No original manuscript</span> exists today</span>
              </motion.div>
            </div>

            {/* Source link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: animationPhase >= 2 ? 1 : 0 }}
              className="text-center"
            >
              <a
                href="https://www.youtube.com/watch?v=jowQond7_UE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-amber-400 transition underline"
              >
                Source: "Who Wrote the Bible?" — Dr Robert Beckford (Channel 4)
              </a>
            </motion.div>

            {/* Verdict */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: animationPhase >= 3 ? 1 : 0, y: animationPhase >= 3 ? 0 : 20 }}
              className="bg-slate-800/80 rounded-xl p-4 border border-slate-600"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                  <XCircle className="w-6 h-6 text-amber-400" />
                </div>
                <div>
                  <p className="text-amber-400 font-semibold text-sm uppercase tracking-wider">Verdict</p>
                  <p className="text-white font-medium">Inconclusive</p>
                  <p className="text-slate-400 text-sm">If there is no original, I cannot verify the Author's intent.</p>
                </div>
              </div>
            </motion.div>
          </div>
        );

      case 'exhibit-b':
        return (
          <div className="space-y-6">
            {/* The Manuscript Overlay Animation */}
            <div className="relative bg-gradient-to-b from-emerald-950/50 to-slate-900/50 rounded-xl p-6 border border-emerald-800/30 min-h-[220px] overflow-hidden">
              {/* Ancient manuscript (background) */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: animationPhase >= 1 ? 0.6 : 0 }}
                className="absolute inset-4 bg-amber-100/10 rounded-lg flex items-center justify-center overflow-hidden"
              >
                <div className="text-amber-200/40 text-2xl font-arabic text-center leading-loose">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  <br />
                  الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: animationPhase >= 1 ? 1 : 0 }}
                  className="absolute bottom-2 left-2 text-[10px] text-amber-400/60"
                >
                  Birmingham Manuscript (~645 CE)
                </motion.div>
              </motion.div>

              {/* Modern Quran (overlay) */}
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{
                  opacity: animationPhase >= 2 ? 1 : 0,
                  scale: animationPhase >= 2 ? 1 : 0.9
                }}
                className="absolute inset-4 bg-emerald-900/40 rounded-lg flex items-center justify-center border-2 border-emerald-500/50"
              >
                <div className="text-emerald-200 text-2xl font-arabic text-center leading-loose">
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  <br />
                  الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ
                </div>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: animationPhase >= 2 ? 1 : 0 }}
                  className="absolute bottom-2 right-2 text-[10px] text-emerald-400/60"
                >
                  Modern Quran (2024)
                </motion.div>
              </motion.div>

              {/* Match indicator - positioned at bottom */}
              {animationPhase >= 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute bottom-2 left-0 right-0 flex justify-center"
                >
                  <div className="bg-emerald-500 text-white px-4 py-2 rounded-full font-bold text-sm shadow-lg shadow-emerald-500/50 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    100% MATCH
                  </div>
                </motion.div>
              )}
            </div>

            {/* Facts revealed progressively */}
            <div className="space-y-3">
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: animationPhase >= 1 ? 1 : 0, x: animationPhase >= 1 ? 0 : -20 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <BookOpen className="w-5 h-5 text-emerald-500" />
                <span><span className="text-white font-semibold">Single text</span> — no versions, no variations</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: animationPhase >= 2 ? 1 : 0, x: animationPhase >= 2 ? 0 : -20 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <Link className="w-5 h-5 text-emerald-500" />
                <span>Manuscripts from <span className="text-white font-semibold">Prophet's lifetime</span> still exist</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: animationPhase >= 3 ? 1 : 0, x: animationPhase >= 3 ? 0 : -20 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <span><span className="text-white font-semibold">Letter-for-letter identical</span> for over 1,400 years</span>
              </motion.div>
            </div>

            {/* Source link */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: animationPhase >= 2 ? 1 : 0 }}
              className="text-center"
            >
              <a
                href="https://www.youtube.com/watch?v=jowQond7_UE"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-slate-500 hover:text-emerald-400 transition underline"
              >
                Source: "'Oldest' Koran found in Birmingham" — BBC News
              </a>
            </motion.div>

            {/* Verdict */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: animationPhase >= 3 ? 1 : 0, y: animationPhase >= 3 ? 0 : 20 }}
              className="bg-emerald-900/40 rounded-xl p-4 border border-emerald-600/50"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                  <p className="text-emerald-400 font-semibold text-sm uppercase tracking-wider">Verdict</p>
                  <p className="text-white font-medium">Preserved</p>
                  <p className="text-slate-300 text-sm">The chain of custody is unbroken. This is exactly what was said 1,400 years ago.</p>
                </div>
              </div>
            </motion.div>
          </div>
        );

      case 'section-1-recap':
        return (
          <div className="space-y-6">
            {/* Break recommendation */}
            <div className="bg-gradient-to-br from-blue-900/40 to-purple-900/40 rounded-2xl p-6 border border-blue-700/50">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center">
                  <Coffee className="w-6 h-6 text-blue-400" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-white">Take a Break</h3>
                  <p className="text-blue-300 text-sm">10 minutes recommended</p>
                </div>
              </div>
              <p className="text-slate-300 leading-relaxed">
                There's no rush. You need a <span className="text-white font-medium">clear head</span> to process this information.
                Step away, grab a drink, and come back refreshed.
              </p>
            </div>

            {/* Recap */}
            <div className="bg-slate-800/60 rounded-xl p-6 border border-slate-600">
              <div className="flex items-center gap-2 mb-4">
                <RefreshCw className="w-5 h-5 text-emerald-400" />
                <h3 className="text-lg font-semibold text-white">What We've Covered</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-amber-400 text-xs font-bold">1</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">The Bible</p>
                    <p className="text-slate-400 text-sm">66-72 books, multiple authors, written in Greek (not Jesus's language), no original manuscript exists. Verdict: Inconclusive.</p>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-emerald-400 text-xs font-bold">2</span>
                  </div>
                  <div>
                    <p className="text-white font-medium">The Quran</p>
                    <p className="text-slate-400 text-sm">Single text, unchanged for over 1,400 years, manuscripts from the Prophet's time still exist. Verdict: Preserved.</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Key insight */}
            <div className="bg-amber-900/20 rounded-xl p-5 border border-amber-700/40">
              <p className="text-amber-200 leading-relaxed text-center">
                <span className="text-white font-medium">Key insight:</span> Preservation doesn't prove divine origin — but it means we can at least examine the <span className="text-emerald-400 font-medium">original text</span>.
              </p>
            </div>
          </div>
        );

      case 'transition':
        return (
          <div className="space-y-6">
            <p className="text-xl text-slate-300 leading-relaxed">
              So the Quran is <span className="text-emerald-400 font-semibold">preserved</span>. But...
            </p>

            <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
              <p className="text-lg text-amber-200 leading-relaxed">
                Just because it's preserved doesn't mean it's <span className="text-white font-semibold">from God</span>.
              </p>
              <p className="text-amber-300 mt-2">
                I could write a book and preserve it myself. That doesn't make me divine.
              </p>
            </div>

            <p className="text-lg text-slate-300 leading-relaxed">
              That's when I stopped looking at the <span className="text-slate-400">Container</span> (the book's history)...
            </p>

            <p className="text-xl text-white leading-relaxed">
              ...and started looking at the <span className="text-emerald-400 font-semibold">Content</span> (the words themselves).
            </p>

            <div className="bg-slate-800/60 rounded-xl p-5 border border-slate-600">
              <p className="text-slate-300 leading-relaxed">
                I didn't want to read 600 pages. I was lazy. I just wanted the <span className="text-white font-medium">facts</span>.
              </p>
              <p className="text-emerald-400 mt-2 font-medium">
                So I looked at the miracles.
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const getIcon = () => {
    switch (scene.icon) {
      case 'file-search':
        return <FileSearch className="w-10 h-10 text-amber-400" />;
      case 'books':
        return <Book className="w-10 h-10 text-amber-400" />;
      case 'quran':
        return <BookOpen className="w-10 h-10 text-emerald-400" />;
      case 'alert':
        return <AlertTriangle className="w-10 h-10 text-amber-400" />;
      case 'pause':
        return <Coffee className="w-10 h-10 text-blue-400" />;
      default:
        return null;
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative"
    >
      {/* Back button and Progress dots */}
      <div className="fixed top-20 md:top-4 left-6 flex items-center gap-4 z-40">
        <button
          onClick={handleBack}
          className="flex items-center gap-1 text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
        <div className="flex items-center gap-2">
          {scenes.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i <= currentScene ? 'bg-amber-500' : 'bg-slate-700'
              }`}
            />
          ))}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-2xl w-full pt-8 md:pt-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                {getIcon()}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-serif text-white text-center mb-8">
              {scene.title}
            </h1>

            {/* Content */}
            <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-6 sm:p-8 border border-slate-700 mb-8">
              {renderSceneContent()}
            </div>

            {/* Continue button */}
            <div className="flex justify-center mb-6 md:mb-0">
              <button
                onClick={handleNext}
                disabled={scene.id === 'exhibit-a' && animationPhase < 3 || scene.id === 'exhibit-b' && animationPhase < 3}
                className={`px-8 py-4 rounded-full text-lg font-semibold transition flex items-center gap-2 ${
                  (scene.id === 'exhibit-a' || scene.id === 'exhibit-b') && animationPhase < 3
                    ? 'bg-slate-700 text-slate-400 cursor-not-allowed'
                    : scene.id === 'section-1-recap'
                    ? 'bg-blue-600 hover:bg-blue-500 text-white'
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {isLastScene ? "Examine the Content" : scene.id === 'section-1-recap' ? "I'm Ready to Continue" : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

          </motion.div>
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
