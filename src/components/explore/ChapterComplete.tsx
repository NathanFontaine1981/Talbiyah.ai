import { motion } from 'framer-motion';
import { CheckCircle2, ChevronRight, Coffee, ArrowRight } from 'lucide-react';

interface ChapterCompleteProps {
  chapterNumber: number;
  chapterTitle: string;
  nextChapterTitle?: string;
  nextChapterNumber?: number;
  icon: React.ReactNode;
  color: 'amber' | 'emerald' | 'purple';
  onContinue: () => void;
  onTakeBreak: () => void;
}

const colorClasses = {
  amber: {
    bg: 'from-amber-900/40 to-orange-900/30',
    border: 'border-amber-600/50',
    icon: 'from-amber-500 to-orange-500',
    text: 'text-amber-400',
    button: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30',
    check: 'text-amber-400',
  },
  emerald: {
    bg: 'from-emerald-900/40 to-teal-900/30',
    border: 'border-emerald-600/50',
    icon: 'from-emerald-500 to-teal-500',
    text: 'text-emerald-400',
    button: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30',
    check: 'text-emerald-400',
  },
  purple: {
    bg: 'from-purple-900/40 to-indigo-900/30',
    border: 'border-purple-600/50',
    icon: 'from-purple-500 to-indigo-500',
    text: 'text-purple-400',
    button: 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/30',
    check: 'text-purple-400',
  },
};

export default function ChapterComplete({
  chapterNumber,
  chapterTitle,
  nextChapterTitle,
  nextChapterNumber,
  icon,
  color,
  onContinue,
  onTakeBreak,
}: ChapterCompleteProps) {
  const colors = colorClasses[color];
  const isLastChapter = !nextChapterTitle;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Success icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="text-center mb-8"
        >
          <div className={`w-24 h-24 mx-auto rounded-full bg-gradient-to-br ${colors.bg} border-2 ${colors.border} flex items-center justify-center`}>
            <CheckCircle2 className={`w-12 h-12 ${colors.check}`} />
          </div>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-3xl p-8 text-center`}
        >
          {/* Chapter badge */}
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm font-medium ${colors.text} mb-4`}>
            Chapter {chapterNumber} Complete
          </span>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {chapterTitle}
          </h1>
          <p className="text-slate-300 mb-6">
            You've completed this chapter. Well done!
          </p>

          {/* Chapter icon */}
          <div className={`w-16 h-16 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${colors.icon} flex items-center justify-center shadow-lg opacity-50`}>
            <div className="text-white">
              {icon}
            </div>
          </div>

          {/* Encouragement message */}
          <div className="bg-slate-900/50 rounded-xl p-4 mb-8 border border-slate-700/50">
            {isLastChapter ? (
              <p className="text-slate-300">
                You've completed the entire journey. Take some time to reflect on what you've learned.
              </p>
            ) : (
              <p className="text-slate-300">
                Take a moment to reflect on what you've explored. When you're ready,
                <span className={`${colors.text} font-medium`}> Chapter {nextChapterNumber}: {nextChapterTitle}</span> awaits.
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="space-y-3">
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              onClick={onContinue}
              className={`w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r ${colors.button} text-white rounded-2xl font-semibold text-lg transition-all hover:scale-[1.02] shadow-lg`}
            >
              {isLastChapter ? 'Finish Journey' : `Continue to Chapter ${nextChapterNumber}`}
              <ArrowRight className="w-5 h-5" />
            </motion.button>

            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
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
          transition={{ delay: 0.7 }}
          className="mt-6 text-center text-slate-500 text-sm"
        >
          Your progress is saved. Come back anytime.
        </motion.p>
      </motion.div>
    </div>
  );
}
