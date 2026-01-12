import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, BookOpen, Users, MessageCircle, Link2, CheckCircle2, AlertCircle, Scroll, Star } from 'lucide-react';

interface TheReconciliationProps {
  onComplete: () => void;
  onBack?: () => void;
}

// The reconciliation scenes - TRIMMED to 4 essential scenes
const scenes = [
  {
    id: 'one-message',
    title: 'One Message',
    subtitle: 'Throughout all of history',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          There has only ever been <span className="text-amber-400 font-semibold">one message</span>. From Adam to Muhammad.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <p className="text-white font-medium text-center text-xl mb-4">
            "There is only One God. Worship Him alone."
          </p>
          <div className="grid grid-cols-3 gap-2">
            {['Adam', 'Noah', 'Abraham', 'Moses', 'David', 'Jesus', 'Muhammad'].map((prophet) => (
              <div key={prophet} className="bg-slate-700/50 rounded-lg p-2 text-center">
                <span className="text-emerald-400 text-sm">{prophet}</span>
              </div>
            ))}
          </div>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          Muslims believe in <span className="text-white font-semibold">all of them</span>. Same team. Same message.
        </p>
      </>
    ),
    icon: <MessageCircle className="w-12 h-12" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  {
    id: 'why-different',
    title: 'Why Different Religions?',
    subtitle: 'One message, human changes',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          If the message was the same, why <span className="text-rose-400 font-semibold">Judaism, Christianity, and Islam</span>?
        </p>
        <div className="space-y-3 mb-4">
          <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-700/50">
            <p className="text-rose-200">
              Scriptures were <span className="font-semibold">altered</span> over time—translations, additions, political edits
            </p>
          </div>
          <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-700/50">
            <p className="text-emerald-200">
              The Quran came to <span className="font-semibold">confirm what was true</span> and <span className="font-semibold">correct what was changed</span>
            </p>
          </div>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          The message was <span className="text-white font-semibold">one</span>. Humans made it three.
        </p>
      </>
    ),
    icon: <Link2 className="w-12 h-12" />,
    iconBg: 'bg-rose-500/20',
    iconColor: 'text-rose-400',
  },
  {
    id: 'gods-words',
    title: "God's Own Words",
    subtitle: 'First-person speech',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The Quran is unique—it's entirely in <span className="text-amber-400 font-semibold">God's first-person voice</span>:
        </p>
        <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-700/50 mb-4">
          <p className="text-amber-200 italic text-lg mb-2">
            "We have certainly created man..."
          </p>
          <p className="text-amber-200 italic text-lg mb-2">
            "I am Allah. There is no deity except Me..."
          </p>
          <p className="text-amber-200 italic text-lg">
            "Say: He is Allah, the One..."
          </p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          Not stories <em>about</em> God. Direct speech <em>from</em> God.
        </p>
      </>
    ),
    icon: <BookOpen className="w-12 h-12" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  {
    id: 'the-invitation',
    title: 'The Invitation',
    subtitle: 'Return to the source',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Islam isn't a "new" religion. It's the <span className="text-amber-400 font-semibold">original religion</span>—
          submission to One God.
        </p>
        <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-700/50 mb-4">
          <p className="text-amber-200 italic text-lg">
            "We believe in Allah and what was revealed to us and what was revealed to Abraham, Moses, Jesus and the prophets. We make no distinction between any of them."
          </p>
          <p className="text-slate-500 text-sm mt-2">— Quran 3:84</p>
        </div>
        <p className="text-lg text-white font-medium text-center">
          This is the invitation: return to the pure message.
        </p>
      </>
    ),
    icon: <BookOpen className="w-12 h-12" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
];

export const TheReconciliation = ({ onComplete, onBack }: TheReconciliationProps) => {
  const [currentScene, setCurrentScene] = useState(0);
  const scene = scenes[currentScene];
  const isLastScene = currentScene === scenes.length - 1;

  const handleNext = () => {
    if (isLastScene) {
      onComplete();
    } else {
      setCurrentScene(prev => prev + 1);
    }
  };

  const handleBack = () => {
    if (currentScene > 0) {
      setCurrentScene(prev => prev - 1);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4 relative"
    >
      {/* Back button */}
      {onBack && (
        <button
          onClick={onBack}
          className="fixed top-20 md:top-4 left-6 flex items-center gap-1 text-slate-400 hover:text-white transition z-40"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm">Back</span>
        </button>
      )}

      <div className="max-w-2xl w-full">
        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-2">
            <span className="text-slate-500 text-sm">The Reconciliation</span>
            <span className="text-slate-500 text-sm">{currentScene + 1} / {scenes.length}</span>
          </div>
          <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${((currentScene + 1) / scenes.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={scene.id}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
          >
            {/* Scene header */}
            <div className="text-center mb-8">
              <div className={`w-20 h-20 ${scene.iconBg} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <div className={scene.iconColor}>{scene.icon}</div>
              </div>
              <h2 className="text-3xl font-serif text-white mb-2">{scene.title}</h2>
              <p className="text-slate-400">{scene.subtitle}</p>
            </div>

            {/* Scene content */}
            <div className="bg-slate-900/70 backdrop-blur rounded-2xl p-8 border border-slate-700 mb-8">
              {scene.content}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleBack}
            disabled={currentScene === 0}
            className={`px-6 py-3 rounded-full font-medium transition flex items-center gap-2 ${
              currentScene === 0
                ? 'text-slate-600 cursor-not-allowed'
                : 'text-slate-300 hover:text-white border border-slate-700 hover:border-slate-500'
            }`}
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>

          <button
            onClick={handleNext}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-lg font-semibold transition flex items-center gap-2"
          >
            {isLastScene ? 'Continue' : 'Next'}
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default TheReconciliation;
