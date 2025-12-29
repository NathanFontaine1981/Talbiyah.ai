import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lightbulb, MessageCircle, Sparkles } from 'lucide-react';

interface ExploreIntroProps {
  onComplete: () => void;
}

const introScenes = [
  {
    id: 'discovery',
    title: 'I Found Something',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          I discovered something that changed everything for me.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed">
          And I want to take you through exactly what my mind was thinking when I found it.
        </p>
      </>
    ),
    commentary: "I remember the moment it clicked. I was just like you—skeptical, busy, had my own beliefs. But then I saw something I couldn't unsee.",
  },
  {
    id: 'treasure',
    title: 'A Treasure',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          Imagine having <span className="text-amber-400 font-semibold">tangible evidence</span> for life's most important questions.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          Not blind faith. Not wishful thinking. Not "just believe."
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          Actual evidence that answers:
          <span className="text-white font-medium"> Why are we here? What happens when we die? Is there more to this?</span>
        </p>
      </>
    ),
    commentary: "21 years. That's how long I lived without knowing. Where were all the Muslims? Why didn't anyone tell me? This treasure was right there the whole time, and I had no idea.",
  },
  {
    id: 'approach',
    title: 'How We\'ll Do This',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          I'm not going to preach at you or ask you to believe anything blindly.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          Instead, I'll show you <span className="text-emerald-400 font-semibold">facts you already agree with</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          Then I'll show you something that will make you think:
          <span className="text-white font-medium italic"> "Wait... how is that possible?"</span>
        </p>
      </>
    ),
    commentary: "I needed proof. Not stories, not emotions—evidence. If you're like me, you need to see it to believe it. That's exactly what I'm going to show you.",
  },
  {
    id: 'ready',
    title: 'Ready?',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          All I ask is that you come with an <span className="text-blue-400 font-semibold">open mind</span>.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          Not to agree with everything—just to honestly look at the evidence.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          If it doesn't convince you, that's fine. But if it does...
          <span className="text-amber-400 font-medium"> it might change your life like it changed mine.</span>
        </p>
      </>
    ),
    commentary: "This isn't about me winning an argument. I genuinely believe I found something life-changing, and I'd feel wrong not sharing it. Let's begin.",
  },
];

export const ExploreIntro = ({ onComplete }: ExploreIntroProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const scene = introScenes[currentScene];
  const isLastScene = currentScene === introScenes.length - 1;

  const handleNext = () => {
    if (isLastScene) {
      onComplete();
    } else {
      setCurrentScene(prev => prev + 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative"
    >
      {/* Progress dots */}
      <div className="fixed top-6 left-6 flex items-center gap-2 z-50">
        {introScenes.map((_, i) => (
          <div
            key={i}
            className={`w-2 h-2 rounded-full transition-colors ${
              i <= currentScene ? 'bg-amber-500' : 'bg-slate-700'
            }`}
          />
        ))}
      </div>

      {/* Main content */}
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Icon */}
            <div className="flex justify-center mb-8">
              <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                {currentScene === 0 && <Lightbulb className="w-10 h-10 text-amber-400" />}
                {currentScene === 1 && <Sparkles className="w-10 h-10 text-amber-400" />}
                {currentScene === 2 && <MessageCircle className="w-10 h-10 text-emerald-400" />}
                {currentScene === 3 && <ArrowRight className="w-10 h-10 text-blue-400" />}
              </div>
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-serif text-white text-center mb-8">
              {scene.title}
            </h1>

            {/* Content */}
            <div className="bg-slate-900/50 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8">
              {scene.content}
            </div>

            {/* Continue button */}
            <div className="flex justify-center">
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
              >
                {isLastScene ? "Let's Begin" : 'Continue'}
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Commentary corner */}
      <AnimatePresence mode="wait">
        <motion.div
          key={scene.id + '-commentary'}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="fixed bottom-6 right-6 max-w-sm"
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
};

export default ExploreIntro;
