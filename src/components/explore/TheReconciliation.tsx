import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, ArrowLeft, BookOpen, Users, MessageCircle, Link2, CheckCircle2, AlertCircle, Scroll, Star } from 'lucide-react';

interface TheReconciliationProps {
  onComplete: () => void;
}

// The reconciliation scenes
const scenes = [
  {
    id: 'one-message',
    title: 'One Message',
    subtitle: 'Throughout all of history',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          There has only ever been <span className="text-amber-400 font-semibold">one message</span>.
        </p>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          From Adam to Noah. From Abraham to Moses. From David to Jesus. To Muhammad.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <p className="text-white font-medium text-center text-xl">
            "There is only One God. Worship Him alone."
          </p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          Every prophet. Every scripture. <span className="text-white font-semibold">The same message.</span>
        </p>
      </>
    ),
    icon: <MessageCircle className="w-12 h-12" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  {
    id: 'the-prophets',
    title: 'The Chain of Prophets',
    subtitle: 'All connected',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The Quran confirms <span className="text-emerald-400 font-semibold">all the prophets</span> that came before:
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          {['Adam', 'Noah', 'Abraham', 'Ishmael', 'Isaac', 'Jacob', 'Joseph', 'Moses', 'David', 'Solomon', 'John', 'Jesus'].map((prophet) => (
            <div key={prophet} className="bg-slate-800/50 rounded-lg p-2 border border-slate-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span className="text-white text-sm">{prophet}</span>
            </div>
          ))}
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          Muslims are required to believe in <span className="text-white font-semibold">all of them</span>.
          <br />
          <span className="text-slate-400 text-sm">Rejecting any prophet is rejecting the message.</span>
        </p>
      </>
    ),
    icon: <Users className="w-12 h-12" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'angel-jibreel',
    title: 'One Messenger',
    subtitle: 'Angel Jibreel (Gabriel)',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The same angel delivered the revelation to all prophets:
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4 space-y-3">
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-blue-400" />
            <span className="text-slate-300">Gabriel appeared to <span className="text-white">Mary</span> announcing Jesus</span>
          </div>
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-blue-400" />
            <span className="text-slate-300">Gabriel appeared to <span className="text-white">Daniel</span> with visions</span>
          </div>
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-blue-400" />
            <span className="text-slate-300">Gabriel appeared to <span className="text-white">Zechariah</span> about John</span>
          </div>
          <div className="flex items-center gap-3">
            <Star className="w-5 h-5 text-blue-400" />
            <span className="text-slate-300">Gabriel (Jibreel) brought the <span className="text-white">Quran</span> to Muhammad</span>
          </div>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          <span className="text-blue-400 font-semibold">One angel. One source. One message.</span>
          <br />
          Different languages. Different times. Same truth.
        </p>
      </>
    ),
    icon: <Star className="w-12 h-12" />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
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
          <br />
          <span className="text-slate-400 text-sm">The Creator addressing His creation directly.</span>
        </p>
      </>
    ),
    icon: <BookOpen className="w-12 h-12" />,
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
  },
  {
    id: 'why-three',
    title: 'Why Three Religions?',
    subtitle: 'The same path, different names',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          If the message was always the same, why do we have <span className="text-rose-400 font-semibold">Judaism, Christianity, and Islam</span>?
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 mt-1" />
              <p className="text-slate-300">
                <span className="text-white font-medium">Scriptures were altered</span> over time—translations, additions, political edits
              </p>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 mt-1" />
              <p className="text-slate-300">
                <span className="text-white font-medium">Human interpretations</span> replaced divine commands
              </p>
            </div>
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-400 mt-1" />
              <p className="text-slate-300">
                <span className="text-white font-medium">Cultural practices</span> became confused with religious law
              </p>
            </div>
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
    id: 'the-quran-clears',
    title: 'The Quran Clears It Up',
    subtitle: 'The final clarification',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The Quran came to <span className="text-emerald-400 font-semibold">confirm what was true</span> and <span className="text-rose-400 font-semibold">correct what was changed</span>:
        </p>
        <div className="space-y-3 mb-4">
          <div className="bg-emerald-900/20 rounded-lg p-3 border border-emerald-700/50">
            <p className="text-emerald-200">
              <span className="font-semibold">✓ Confirms:</span> One God, prophets, Day of Judgment, moral law
            </p>
          </div>
          <div className="bg-rose-900/20 rounded-lg p-3 border border-rose-700/50">
            <p className="text-rose-200">
              <span className="font-semibold">✗ Corrects:</span> Trinity, divine sonship, altered laws, human additions
            </p>
          </div>
        </div>
        <div className="bg-blue-900/30 rounded-xl p-4 border border-blue-700/50">
          <p className="text-blue-200 italic">
            "We have sent down to you the Book in truth, confirming what came before it of the Scripture and as a criterion over it."
          </p>
          <p className="text-slate-500 text-sm mt-2">— Quran 5:48</p>
        </div>
      </>
    ),
    icon: <Scroll className="w-12 h-12" />,
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
  },
  {
    id: 'people-of-book',
    title: 'People of the Book',
    subtitle: 'We are family',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          The Quran calls Jews and Christians <span className="text-blue-400 font-semibold">"People of the Book"</span>—
          acknowledging they received divine revelation.
        </p>
        <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700 mb-4">
          <p className="text-slate-300 mb-3">
            Muslims, Christians, and Jews all trace back to <span className="text-white font-semibold">Abraham</span>.
          </p>
          <p className="text-slate-300 mb-3">
            All worship the <span className="text-white font-semibold">same God</span>—the God of Abraham.
          </p>
          <p className="text-slate-300">
            All believe in <span className="text-white font-semibold">accountability</span>—judgment for our actions.
          </p>
        </div>
        <p className="text-lg text-slate-300 leading-relaxed">
          We were never meant to be divided.
          <br />
          <span className="text-amber-400 font-semibold">One family. One message. One God.</span>
        </p>
      </>
    ),
    icon: <Users className="w-12 h-12" />,
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
  },
  {
    id: 'the-invitation',
    title: 'The Invitation',
    subtitle: 'Return to the source',
    content: (
      <>
        <p className="text-lg text-slate-300 leading-relaxed mb-4">
          Islam isn't a "new" religion. It's the <span className="text-amber-400 font-semibold">original religion</span>—
          the submission to One God that every prophet taught.
        </p>
        <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-700/50 mb-4">
          <p className="text-amber-200 italic text-lg">
            "Say: We believe in Allah and what was revealed to us and what was revealed to Abraham, Ishmael, Isaac, Jacob, and the tribes, and what was given to Moses and Jesus and the prophets from their Lord. We make no distinction between any of them, and to Him we submit."
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

export const TheReconciliation = ({ onComplete }: TheReconciliationProps) => {
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
      className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4"
    >
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
