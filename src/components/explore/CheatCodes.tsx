import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Gamepad2, Heart, Coins, Users, Sparkles, Brain, BookOpen, Shield, Zap, Clock } from 'lucide-react';
import LifeManual from './LifeManual';

interface CheatCodesProps {
  verifiedCount: number;
  totalFacts: number;
  onComplete: () => void;
}

// Life "cheat codes" - reframed from LifeManual for the Almanac narrative
const cheatCodeCategories = [
  {
    id: 'emotional',
    name: 'Mental Health',
    icon: <Heart className="w-6 h-6" />,
    bgClass: 'bg-rose-900/30',
    borderClass: 'border-rose-700/50',
    textClass: 'text-rose-400',
    description: 'Anxiety, stress, anger, depression',
    codes: ['Remembrance = Peace', 'Patience = Victory', 'Trust = Calm'],
  },
  {
    id: 'financial',
    name: 'Wealth & Provision',
    icon: <Coins className="w-6 h-6" />,
    bgClass: 'bg-amber-900/30',
    borderClass: 'border-amber-700/50',
    textClass: 'text-amber-400',
    description: 'Debt, poverty, career success',
    codes: ['Charity Multiplies', 'Halal Sustains', 'Contentment = Richness'],
  },
  {
    id: 'relationships',
    name: 'Relationships',
    icon: <Users className="w-6 h-6" />,
    bgClass: 'bg-blue-900/30',
    borderClass: 'border-blue-700/50',
    textClass: 'text-blue-400',
    description: 'Family, marriage, community',
    codes: ['Ties = Blessings', 'Forgiveness = Freedom', 'Kindness Returns'],
  },
  {
    id: 'spiritual',
    name: 'Purpose & Meaning',
    icon: <Sparkles className="w-6 h-6" />,
    bgClass: 'bg-purple-900/30',
    borderClass: 'border-purple-700/50',
    textClass: 'text-purple-400',
    description: 'Direction, hope, inner peace',
    codes: ['Prayer = Connection', 'Gratitude = Increase', 'Tests = Growth'],
  },
];

export const CheatCodes = ({ verifiedCount, totalFacts, onComplete }: CheatCodesProps) => {
  const [stage, setStage] = useState<'why-obey' | 'intro' | 'manual'>('why-obey');

  // "Why Obey?" - The Manufacturer Logic
  if (stage === 'why-obey') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Shield className="w-10 h-10 text-blue-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif text-white mb-4">
              Why Follow the Rules?
            </h1>

            <p className="text-xl text-blue-200 mb-8">
              A fair question
            </p>

            <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8 text-left">
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                Some people say: <span className="text-slate-400 italic">"I believe in God, but why do I have to follow rules? Why can't I just be a good person?"</span>
              </p>

              <div className="bg-blue-900/30 rounded-xl p-5 border border-blue-700/50 mb-6">
                <p className="text-blue-200 font-medium mb-3">Think about it this way:</p>
                <p className="text-white text-lg mb-3">
                  Who knows a machine better—<span className="text-amber-400">you</span> or <span className="text-emerald-400">the manufacturer</span>?
                </p>
                <p className="text-slate-300">
                  When your car manual says "use premium fuel"—you might think regular is fine.
                  But the engineers who built it <span className="text-white font-semibold">know what damages the engine</span>.
                </p>
              </div>

              <div className="bg-amber-900/20 rounded-xl p-4 border border-amber-700/50 mb-6">
                <p className="text-amber-200 text-sm mb-2">
                  <span className="font-semibold">Example: Alcohol & Gambling</span>
                </p>
                <p className="text-slate-300 mb-2">
                  Society says they're harmless fun. The Quran says avoid them.
                </p>
                <p className="text-white">
                  Result? <span className="text-rose-300">Broken families</span>, <span className="text-rose-300">addiction</span>, <span className="text-rose-300">debt</span>, <span className="text-rose-300">domestic abuse</span>.
                </p>
                <p className="text-slate-400 text-sm mt-2 italic">
                  The Manufacturer knew what would damage the machine.
                </p>
              </div>

              <p className="text-lg text-slate-300 leading-relaxed">
                The rules aren't restrictions—they're <span className="text-emerald-400 font-semibold">protection</span>.
                <br />
                <span className="text-slate-400 text-sm">The Creator knows what breaks us better than we do.</span>
              </p>
            </div>

            <button
              onClick={() => setStage('intro')}
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </button>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Intro screen - "The Cheat Codes"
  if (stage === 'intro') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-2xl w-full text-center">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="w-20 h-20 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Gamepad2 className="w-10 h-10 text-purple-400" />
            </div>

            <h1 className="text-4xl sm:text-5xl font-serif text-white mb-4">
              The Cheat Codes
            </h1>

            <p className="text-xl text-purple-200 mb-8">
              Life guidance from the Quran
            </p>

            <div className="bg-slate-900/70 rounded-2xl p-8 border border-slate-700 mb-8 text-left">
              <p className="text-lg text-slate-300 leading-relaxed mb-6">
                The Quran doesn't just state facts about the past—it gives <span className="text-purple-400 font-semibold">cheat codes</span> for winning at life.
              </p>

              <div className="bg-purple-900/30 rounded-xl p-4 border border-purple-700/50 mb-6">
                <div className="flex items-center gap-2 text-purple-300 mb-2">
                  <Zap className="w-5 h-5" />
                  <span className="font-semibold">The Quran says:</span>
                </div>
                <p className="text-slate-300 italic">
                  "We have not neglected anything in the Book."
                  <span className="text-slate-500 text-sm ml-2">— Surah Al-An'am, 6:38</span>
                </p>
              </div>

              <p className="text-lg text-slate-300 leading-relaxed">
                Every problem you face—<span className="text-rose-300">anxiety</span>, <span className="text-amber-300">debt</span>, <span className="text-blue-300">family issues</span>—has a solution already written.
              </p>
            </div>

            {/* Cheat Code Categories Preview */}
            <div className="grid grid-cols-2 gap-3 mb-8">
              {cheatCodeCategories.map((cat, index) => (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1 }}
                  className={`${cat.bgClass} rounded-xl p-4 border ${cat.borderClass}`}
                >
                  <div className={`flex items-center gap-2 ${cat.textClass} mb-2`}>
                    {cat.icon}
                    <span className="font-medium">{cat.name}</span>
                  </div>
                  <p className="text-slate-400 text-sm">{cat.description}</p>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button
                onClick={() => setStage('manual')}
                className="px-8 py-4 bg-purple-600 hover:bg-purple-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2"
              >
                <BookOpen className="w-5 h-5" />
                Access the Cheat Codes
              </button>
              <button
                onClick={onComplete}
                className="px-8 py-4 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full text-lg font-medium transition"
              >
                Skip for Now
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // Life Manual with Almanac framing
  if (stage === 'manual') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950 to-slate-950 flex items-center justify-center p-4"
      >
        <div className="max-w-3xl w-full">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/20 rounded-full border border-purple-500/30 mb-4">
              <Gamepad2 className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 font-medium">Cheat Code Database</span>
            </div>
            <h2 className="text-2xl font-serif text-white mb-2">
              What challenge are you facing?
            </h2>
            <p className="text-slate-400">
              The Quran has a solution for every life problem
            </p>
          </div>

          {/* Life Manual Component */}
          <LifeManual />

          {/* Continue button */}
          <div className="mt-8 text-center">
            <button
              onClick={onComplete}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-lg font-semibold transition flex items-center justify-center gap-2 mx-auto"
            >
              Continue to the Future
              <ArrowRight className="w-5 h-5" />
            </button>
            <p className="text-slate-500 text-sm mt-4">
              Phase 3: The Future Scores
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  return null;
};

export default CheatCodes;
