import { motion } from 'framer-motion';
import { Coffee, ArrowRight, Pause, CheckCircle2 } from 'lucide-react';

interface EpisodeBreakScreenProps {
  episodeNumber: number;
  episodeName: string;
  nextEpisodeName: string;
  summary: string[];
  reflectionPrompt: string;
  onContinue: () => void;
  onTakeBreak: () => void;
}

export default function EpisodeBreakScreen({
  episodeNumber,
  episodeName,
  nextEpisodeName,
  summary,
  reflectionPrompt,
  onContinue,
  onTakeBreak,
}: EpisodeBreakScreenProps) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Pause icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-br from-emerald-900/40 to-teal-900/30 border-2 border-emerald-600/50 flex items-center justify-center">
            <Pause className="w-10 h-10 text-emerald-400" />
          </div>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-emerald-900/30 to-slate-900/50 border border-emerald-700/40 rounded-3xl p-8 text-center"
        >
          {/* Episode badge */}
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm font-medium text-emerald-400 mb-4">
            Episode {episodeNumber} Complete
          </span>

          {/* Title */}
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            {episodeName}
          </h1>

          {/* Summary bullets */}
          <div className="bg-slate-900/50 rounded-xl p-4 mb-6 border border-slate-700/50 text-left space-y-2">
            {summary.map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="flex items-start gap-2"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                <p className="text-slate-300 text-sm">{item}</p>
              </motion.div>
            ))}
          </div>

          {/* Reflection prompt */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="bg-amber-900/20 rounded-xl p-4 mb-6 border border-amber-700/30"
          >
            <p className="text-amber-200/90 text-sm italic leading-relaxed">
              {reflectionPrompt}
            </p>
          </motion.div>

          {/* Next episode preview */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="text-slate-400 text-sm mb-6"
          >
            Next: <span className="text-emerald-400 font-medium">{nextEpisodeName}</span>
          </motion.p>

          {/* Action buttons */}
          <div className="space-y-3">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              onClick={onContinue}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-2xl font-semibold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-emerald-900/30"
            >
              Continue
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.9 }}
              onClick={onTakeBreak}
              className="w-full flex items-center justify-center gap-3 px-8 py-4 bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white rounded-2xl font-medium text-lg transition-all border border-slate-700/50"
            >
              <Coffee className="w-5 h-5" />
              Take a Break
            </motion.button>
          </div>
        </motion.div>

        {/* Tip */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="mt-6 text-center text-slate-500 text-sm"
        >
          Your progress is saved. Come back anytime.
        </motion.p>
      </motion.div>
    </div>
  );
}
