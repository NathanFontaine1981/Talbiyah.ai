import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Lightbulb, MessageCircle, User, Scale, Gavel, HelpCircle, Heart, Compass, BookOpen, TrendingUp, Users } from 'lucide-react';
import AlmanacGame from './AlmanacGame';

interface ExploreIntroProps {
  onComplete: () => void;
}

const introScenes = [
  {
    id: 'welcome',
    title: "A Message From The Founder",
    icon: 'founder-image',
    content: (
      <>
        {/* Founder Image */}
        <div className="flex justify-center mb-6 -mt-2">
          <img
            src="/founder-nathan.jpg"
            alt="Nathan Ellington - Founder of Talbiyah"
            className="w-full max-w-sm rounded-xl shadow-lg"
          />
        </div>
        <div className="space-y-4">
          <p className="text-xl text-white font-medium leading-relaxed">
            My duty is to convey the message that I found.
          </p>

          {/* Ayah */}
          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-emerald-200 text-center font-arabic text-lg mb-2">
              مَّا عَلَى الرَّسُولِ إِلَّا الْبَلَاغُ
            </p>
            <p className="text-emerald-300 text-center text-sm italic">
              "The duty of the Messenger is only to convey the message."
            </p>
            <p className="text-emerald-400/70 text-center text-xs mt-1">
              — Quran 5:99
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            I want to share what I found—in full detail—and take you through <span className="text-amber-400 font-medium">my journey, from my lenses</span>.
          </p>
          <p className="text-slate-400 leading-relaxed">
            Take your time. There's no rush. Digest each point before moving on.
          </p>
        </div>
      </>
    ),
    commentary: "I'm not here to convince you. I'm here to share what I discovered. The rest is between you and your Creator.",
  },
  {
    id: 'hook',
    title: "The Missing Answer",
    icon: 'question',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            The funny thing is—we don't think twice when asked about the <span className="text-white font-medium">purpose of every part of our body</span>.
          </p>

          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
            <p className="text-slate-400 text-sm leading-relaxed">
              <span className="text-white">Eyes?</span> For seeing. <span className="text-white">Heart?</span> Pumps blood. <span className="text-white">Lungs?</span> Breathing. <span className="text-white">Brain?</span> Thinking.
            </p>
            <p className="text-slate-500 text-sm mt-2 italic">Easy answers. No hesitation.</p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            But when we're asked about the purpose of the <span className="text-amber-400 font-semibold">human being as a whole</span>—what are we here for?
          </p>

          <p className="text-xl text-white leading-relaxed">
            We're unsure. We can't answer easily.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50 mt-4">
            <p className="text-lg text-emerald-200 leading-relaxed">
              Well, I found something <span className="text-white font-semibold">very interesting</span> and <span className="text-white font-semibold">very compelling</span>.
            </p>
            <p className="text-emerald-300 mt-2">
              And I'd like to share it with you.
            </p>
          </div>
        </div>
      </>
    ),
    commentary: "If every part exists to serve the whole... then the whole logically must have a purpose too. Otherwise, it's useless?",
  },
  {
    id: 'my-story',
    title: 'My Discovery',
    icon: 'user',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          I remember someone telling me: if you found an <span className="text-white font-medium">iPhone in the desert</span>, you would never think it's a product of nature that just came together on its own.
        </p>

        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <p className="text-slate-400 text-sm leading-relaxed">
            Calendars. Messages. A camera with great clarity. <span className="text-white">Sophistication doesn't happen by accident.</span>
          </p>
        </div>

        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          So why is it that we look at the <span className="text-amber-400 font-semibold">human body</span> and think it came together without something having created it with thought and design?
        </p>

        <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
          <p className="text-emerald-200 leading-relaxed">
            <span className="text-white font-medium">Eyes</span> superior to any camera ever made.
          </p>
          <p className="text-emerald-200 leading-relaxed mt-1">
            A <span className="text-white font-medium">body</span> that repairs itself when damaged.
          </p>
          <p className="text-emerald-200 leading-relaxed mt-1">
            A <span className="text-white font-medium">brain</span> that can think, process, and create.
          </p>
        </div>
      </>
    ),
    commentary: "An iPhone needs a maker. But a human—infinitely more complex—doesn't? That never made sense to me.",
  },
  {
    id: 'invitation',
    title: 'The Invitation',
    icon: 'compass',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            What I'm about to share is <span className="text-white font-medium">my journey</span>, through <span className="text-amber-400 font-medium">my lenses</span>.
          </p>

          <p className="text-lg text-slate-300 leading-relaxed">
            I'm not here to preach at you. I just want to take you through what I discovered—and let you see if you'd think the same way.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-5 border border-emerald-700/50">
            <p className="text-emerald-200 leading-relaxed">
              I treated it like a <span className="text-white font-semibold">court case</span>.
            </p>
            <p className="text-emerald-300 mt-2">
              Evidence. Logic. No blind faith. Just honest examination.
            </p>
          </div>

          <p className="text-lg text-slate-400 leading-relaxed">
            Come with me. See if the evidence leads you where it led me.
          </p>
        </div>
      </>
    ),
    commentary: "I'm not trying to convert you. I'm just sharing what I found. You decide what to do with it.",
  },
  {
    id: 'almanac',
    title: 'The Almanac Moment',
    icon: 'book',
    isInteractive: true,
    content: null, // Will be rendered separately as interactive
    commentary: "It felt like reading tomorrow's sports results. How could someone know this before it was discovered?",
  },
  {
    id: 'beliefs-change',
    title: 'Beliefs Change With Evidence',
    icon: 'trending',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Think about it—<span className="text-white font-medium">we update our beliefs all the time</span> when new evidence comes in.
          </p>

          <div className="space-y-3">
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-slate-400 text-sm">
                <span className="text-white">Before telephones:</span> "Talk to someone miles away? Impossible."
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-slate-400 text-sm">
                <span className="text-white">Before planes:</span> "Humans flying through the sky? Ridiculous."
              </p>
            </div>
            <div className="bg-slate-800/50 rounded-lg p-3 border border-slate-700">
              <p className="text-slate-400 text-sm">
                <span className="text-white">Before Concorde:</span> "London to New York in 3 hours? Unbelievable."
              </p>
            </div>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            The <span className="text-amber-400 font-medium">impossible</span> became <span className="text-emerald-400 font-medium">possible</span>. Then it became <span className="text-white">normal</span>.
          </p>

          <p className="text-slate-400 leading-relaxed">
            We all carry beliefs right now. The question is—are we willing to examine them when evidence is presented?
          </p>
        </div>
      </>
    ),
    commentary: "What we believe today might change tomorrow—if we're honest enough to look at the evidence.",
  },
  {
    id: 'common-ground',
    title: 'Common Ground',
    icon: 'users',
    content: (
      <>
        <div className="space-y-5">
          <p className="text-lg text-slate-300 leading-relaxed">
            Before we dive in, let's <span className="text-white font-medium">establish what we both agree on</span>.
          </p>

          <p className="text-slate-400 leading-relaxed">
            I'm not going to bore you with everything. But I think there are certain facts about this world that everyone would have no problem agreeing with.
          </p>

          <div className="bg-amber-900/30 rounded-xl p-5 border border-amber-700/50">
            <p className="text-amber-200 leading-relaxed">
              Until we establish <span className="text-white font-semibold">common ground</span>, we can't really get anywhere.
            </p>
            <p className="text-amber-300 mt-2">
              Let's see if you agree with me on the points I'm about to make.
            </p>
          </div>

          <p className="text-lg text-slate-300 leading-relaxed">
            Then—and only then—can we examine what the Quran says about those very things.
          </p>

          <div className="bg-emerald-900/30 rounded-xl p-4 border border-emerald-700/50">
            <p className="text-emerald-300 text-sm">
              <span className="text-white font-medium">One truth:</span> Either one religion is true and others are false—or none are true. Let's find out which.
            </p>
          </div>
        </div>
      </>
    ),
    commentary: "The truth reveals itself when you examine it. Falsehood crumbles. That's its nature.",
  },
  {
    id: 'court-session',
    title: 'Court Is Now In Session',
    icon: 'gavel',
    content: (
      <>
        <div className="bg-amber-900/30 rounded-xl p-4 border border-amber-700/50 mb-6 text-center">
          <p className="text-amber-200 font-serif text-lg">
            THE CASE OF
          </p>
          <p className="text-2xl text-white font-bold mt-1">
            The Quran vs. Reasonable Doubt
          </p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          You are the <span className="text-amber-400 font-semibold">judge and jury</span>. I will present evidence. You will decide.
        </p>
        <p className="text-slate-400 leading-relaxed">
          The claim: This book contains knowledge that could only come from the Creator. The burden of proof is on the Quran.
        </p>
      </>
    ),
    commentary: "Every person should examine the evidence for themselves. Today, you're the jury.",
  },
  {
    id: 'rules',
    title: 'The Process',
    icon: 'scale',
    content: (
      <>
        <p className="text-xl text-slate-300 leading-relaxed mb-4">
          I will present <span className="text-emerald-400 font-semibold">exhibits</span>—facts most people accept as true. Then the Quran's statements on each.
        </p>
        <p className="text-lg text-slate-400 leading-relaxed mb-4">
          Your duty: examine each piece of evidence with an <span className="text-blue-400 font-semibold">open mind</span>. Accept what convinces you. Question what doesn't.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed">
          At the end, you will deliver your verdict. <span className="text-amber-400 font-medium">Is this book from the Creator—or isn't it?</span>
        </p>
      </>
    ),
    commentary: "I genuinely believe I found something life-changing. Let's begin.",
  },
];

export const ExploreIntro = ({ onComplete }: ExploreIntroProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const scene = introScenes[currentScene];
  const isLastScene = currentScene === introScenes.length - 1;
  const isFirstScene = currentScene === 0;

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

  // Handle interactive almanac scene
  if (scene.isInteractive && scene.id === 'almanac') {
    return (
      <div className="relative">
        {/* Back button for returning from interactive */}
        <div className="fixed top-6 left-6 z-50">
          <button
            onClick={handleBack}
            className="flex items-center gap-1 text-slate-400 hover:text-white transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back</span>
          </button>
        </div>
        <AlmanacGame onComplete={handleNext} />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 flex items-center justify-center p-4 relative"
    >
      {/* Back button and Progress dots */}
      <div className="fixed top-6 left-6 flex items-center gap-4 z-50">
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
          {introScenes.map((_, i) => (
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
      <div className="max-w-2xl w-full">
        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            {/* Icon - hide for founder-image since image is in content */}
            {scene.icon !== 'founder-image' && (
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-amber-500/20 rounded-full flex items-center justify-center">
                  {scene.icon === 'welcome' && <Heart className="w-10 h-10 text-emerald-400" />}
                  {scene.icon === 'question' && <HelpCircle className="w-10 h-10 text-purple-400" />}
                  {scene.icon === 'user' && <User className="w-10 h-10 text-emerald-400" />}
                  {scene.icon === 'compass' && <Compass className="w-10 h-10 text-blue-400" />}
                  {scene.icon === 'book' && <BookOpen className="w-10 h-10 text-amber-400" />}
                  {scene.icon === 'trending' && <TrendingUp className="w-10 h-10 text-emerald-400" />}
                  {scene.icon === 'users' && <Users className="w-10 h-10 text-cyan-400" />}
                  {scene.icon === 'gavel' && <Gavel className="w-10 h-10 text-amber-400" />}
                  {scene.icon === 'scale' && <Scale className="w-10 h-10 text-blue-400" />}
                </div>
              </div>
            )}

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
