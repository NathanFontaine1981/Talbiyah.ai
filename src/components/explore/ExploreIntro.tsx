import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Lightbulb, MessageCircle, Sparkles, Compass, Film, User } from 'lucide-react';

interface ExploreIntroProps {
  onComplete: () => void;
}

const introScenes = [
  {
    id: 'welcome',
    title: 'Welcome to My Journey',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          My name is <span className="text-amber-400 font-semibold">Nathan Ellington Fontaine</span>.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          Former professional footballer. Now a Muslim.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          I want to take you through <span className="text-white font-medium">my eyes</span>—how I examined the evidence,
          how it all made sense to me, and why I couldn't ignore what I found.
        </p>
      </>
    ),
    commentary: "I never thought I'd be the one sharing this. But after what I discovered, staying quiet felt wrong.",
  },
  {
    id: 'my-lens',
    title: 'Through My Lenses',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          I'm excited to share with you <span className="text-amber-400 font-semibold">my thought process</span>.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          I'll show you exactly what I was thinking when I examined the evidence.
          The questions I asked. The doubts I had. The moment it clicked.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          You'll see Islam through the eyes of someone who once knew nothing about it.
        </p>
      </>
    ),
    commentary: "I wasn't raised Muslim. I had the same stereotypes, the same misconceptions. That's why I can explain it differently.",
  },
  {
    id: 'discovery',
    title: 'What I Found',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          I discovered something that changed everything for me.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          Not through someone preaching at me. Not through emotion.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          Through <span className="text-emerald-400 font-semibold">evidence</span> I could verify myself.
        </p>
      </>
    ),
    commentary: "I was just like you—skeptical, busy, had my own beliefs. But then I saw something I couldn't unsee.",
  },
  {
    id: 'treasure',
    title: 'A Treasure Hidden in Plain Sight',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          Imagine having <span className="text-amber-400 font-semibold">tangible evidence</span> for life's biggest questions.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          Not blind faith. Not wishful thinking. Not "just believe."
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          Actual evidence that answers:
          <span className="text-white font-medium"> Why am I here? What happens when I die? Is there more to this life?</span>
        </p>
      </>
    ),
    commentary: "21 years. That's how long I lived without knowing. Where were all the Muslims? Why didn't anyone tell me? This treasure was right there the whole time.",
  },
  {
    id: 'approach',
    title: 'How I\'ll Explain It',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          I'm not going to preach at you or ask you to believe anything blindly.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          Instead, I'll show you <span className="text-emerald-400 font-semibold">facts you already accept as true</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          Then I'll show you something that made me think:
          <span className="text-white font-medium italic"> "Wait... how did they know that?"</span>
        </p>
      </>
    ),
    commentary: "I needed proof. Not stories, not emotions—evidence. If you're like me, you need to see it to believe it. That's exactly what I'm going to show you.",
  },
  {
    id: 'my-method',
    title: 'Why I Use Stories',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          Throughout this journey, I'll share <span className="text-amber-400 font-semibold">analogies from my own life</span>.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          When I first discovered these truths, my mind immediately connected them to things I'd experienced—films, conversations, moments that suddenly made sense.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          One of them is <span className="text-white font-medium">Back to the Future II</span>. You'll see why soon.
        </p>
      </>
    ),
    commentary: "I'm a visual thinker. I learn through connections. When I found all this, my brain kept saying 'This is just like that film!' So that's how I'll explain it to you.",
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
          Not to agree with everything—just to honestly examine the evidence with me.
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
                {currentScene === 0 && <User className="w-10 h-10 text-amber-400" />}
                {currentScene === 1 && <Compass className="w-10 h-10 text-amber-400" />}
                {currentScene === 2 && <Lightbulb className="w-10 h-10 text-amber-400" />}
                {currentScene === 3 && <Sparkles className="w-10 h-10 text-amber-400" />}
                {currentScene === 4 && <MessageCircle className="w-10 h-10 text-emerald-400" />}
                {currentScene === 5 && <Film className="w-10 h-10 text-purple-400" />}
                {currentScene === 6 && <ArrowRight className="w-10 h-10 text-blue-400" />}
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
            <div className="flex justify-center mb-6 md:mb-0">
              <button
                onClick={handleNext}
                className="px-8 py-4 bg-amber-600 hover:bg-amber-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
              >
                {isLastScene ? "Let's Begin" : 'Continue'}
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
};

export default ExploreIntro;
