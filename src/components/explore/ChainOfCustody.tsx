import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, FileSearch, Book, BookOpen, CheckCircle, XCircle, AlertTriangle, Link, MessageCircle } from 'lucide-react';

interface ChainOfCustodyProps {
  onComplete: () => void;
}

const scenes = [
  {
    id: 'intro',
    title: 'The Chain of Custody',
    icon: 'file-search',
    content: null, // Custom content
    commentary: "In a court of law, if the evidence has been tampered with, the case is thrown out. I applied that same rule to God's Word.",
  },
  {
    id: 'exhibit-a',
    title: 'Exhibit A: The Library',
    icon: 'books',
    content: null, // Custom animated content
    commentary: "I found it wasn't one book; it was a library of 66 (or 72) books with multiple authors, versions, and no original manuscript.",
  },
  {
    id: 'exhibit-b',
    title: 'Exhibit B: The Transmission',
    icon: 'quran',
    content: null, // Custom animated content
    commentary: "I expected the same chaos, but found a single, unchanged text. I tried to find a 'rival version' and couldn't.",
  },
  {
    id: 'transition',
    title: 'But Wait...',
    icon: 'alert',
    content: null, // Custom content
    commentary: "Just because it's preserved doesn't mean it's from God. I could write a book and preserve it myself. So I looked at the content.",
  },
];

export default function ChainOfCustody({ onComplete }: ChainOfCustodyProps) {
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
    if (!isFirstScene) {
      setCurrentScene(prev => prev - 1);
    }
  };

  // Render scene-specific content
  const renderSceneContent = () => {
    switch (scene.id) {
      case 'intro':
        return (
          <div className="space-y-6">
            <p className="text-xl text-slate-300 leading-relaxed">
              Before I read what the books said, I had to check <span className="text-amber-400 font-semibold">where they came from</span>.
            </p>
            <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
              <p className="text-lg text-amber-200 leading-relaxed">
                In a court of law, if the evidence has been <span className="text-white font-semibold">tampered with</span>, the case is thrown out.
              </p>
            </div>
            <p className="text-lg text-slate-300 leading-relaxed">
              I applied that same rule to <span className="text-emerald-400 font-semibold">God's Word</span>.
            </p>
            <p className="text-slate-400 leading-relaxed">
              This is the "Sherlock Holmes" moment. Moving from general curiosity to <span className="text-white">forensic analysis</span>.
            </p>
          </div>
        );

      case 'exhibit-a':
        return (
          <div className="space-y-6">
            {/* The Bookshelf Animation */}
            <div className="relative bg-gradient-to-b from-amber-950/50 to-slate-900/50 rounded-xl p-6 border border-amber-800/30 min-h-[200px] overflow-hidden">
              {/* Shelf */}
              <div className="absolute bottom-8 left-4 right-4 h-2 bg-amber-900/60 rounded" />

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
                <span className="text-amber-400 font-medium text-sm">THE ANTHOLOGY</span>
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
                <span><span className="text-white font-semibold">66 books</span> (or 72, depending on who you ask)</span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: animationPhase >= 2 ? 1 : 0, x: animationPhase >= 2 ? 0 : -20 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <Book className="w-5 h-5 text-amber-500" />
                <span>Multiple authors who <span className="text-white font-semibold">never met Jesus</span></span>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: animationPhase >= 3 ? 1 : 0, x: animationPhase >= 3 ? 0 : -20 }}
                className="flex items-center gap-3 text-slate-300"
              >
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                <span><span className="text-white font-semibold">No original manuscript</span> exists</span>
              </motion.div>
            </div>

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

              {/* Match indicator */}
              {animationPhase >= 3 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div className="bg-emerald-500 text-white px-6 py-3 rounded-full font-bold text-lg shadow-lg shadow-emerald-500/50 flex items-center gap-2">
                    <CheckCircle className="w-6 h-6" />
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
                <span><span className="text-white font-semibold">Letter-for-letter identical</span> for 1,400 years</span>
              </motion.div>
            </div>

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
        {!isFirstScene && (
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        )}
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
                    : 'bg-amber-600 hover:bg-amber-500 text-white'
                }`}
              >
                {isLastScene ? "Examine the Content" : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>

            {/* Commentary - inline on mobile */}
            <motion.div
              key={scene.id + '-commentary-mobile'}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="md:hidden"
            >
              <div className="bg-slate-800/90 backdrop-blur rounded-xl p-4 border border-slate-600">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-amber-400 text-xs font-medium mb-1">What I was thinking...</p>
                    <p className="text-slate-300 text-sm leading-relaxed italic">
                      "{scene.commentary}"
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Commentary corner - desktop only */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id + '-commentary'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="hidden md:block fixed bottom-6 right-6 max-w-sm"
        >
          <div className="bg-slate-800/90 backdrop-blur rounded-xl p-4 border border-slate-600 shadow-xl">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <p className="text-amber-400 text-xs font-medium mb-1">What I was thinking...</p>
                <p className="text-slate-300 text-sm leading-relaxed italic">
                  "{scene.commentary}"
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
