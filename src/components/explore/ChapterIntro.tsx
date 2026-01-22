import { motion } from 'framer-motion';
import { ChevronRight, Clock } from 'lucide-react';

interface ChapterIntroProps {
  chapterNumber: number;
  title: string;
  subtitle: string;
  description: string;
  bulletPoints: string[];
  duration: string;
  episodeCount: number;
  icon: React.ReactNode;
  color: 'amber' | 'emerald' | 'purple';
  onBegin: () => void;
  onBack: () => void;
}

const colorClasses = {
  amber: {
    bg: 'from-amber-900/30 to-orange-900/20',
    border: 'border-amber-700/50',
    icon: 'from-amber-500 to-orange-500',
    button: 'from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 shadow-amber-900/30',
    text: 'text-amber-400',
    bullet: 'bg-amber-500',
  },
  emerald: {
    bg: 'from-emerald-900/30 to-teal-900/20',
    border: 'border-emerald-700/50',
    icon: 'from-emerald-500 to-teal-500',
    button: 'from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-900/30',
    text: 'text-emerald-400',
    bullet: 'bg-emerald-500',
  },
  purple: {
    bg: 'from-purple-900/30 to-indigo-900/20',
    border: 'border-purple-700/50',
    icon: 'from-purple-500 to-indigo-500',
    button: 'from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-purple-900/30',
    text: 'text-purple-400',
    bullet: 'bg-purple-500',
  },
};

export default function ChapterIntro({
  chapterNumber,
  title,
  subtitle,
  description,
  bulletPoints,
  duration,
  episodeCount,
  icon,
  color,
  onBegin,
  onBack,
}: ChapterIntroProps) {
  const colors = colorClasses[color];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-950 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg w-full"
      >
        {/* Chapter badge */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-6"
        >
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/50 border border-slate-700/50 text-sm font-medium ${colors.text}`}>
            Chapter {chapterNumber} of 3
          </span>
        </motion.div>

        {/* Main card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`bg-gradient-to-br ${colors.bg} border ${colors.border} rounded-3xl p-8 text-center`}
        >
          {/* Icon */}
          <div className={`w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br ${colors.icon} flex items-center justify-center shadow-lg`}>
            <div className="text-white">
              {icon}
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            {title}
          </h1>
          <p className={`text-lg ${colors.text} mb-4`}>
            {subtitle}
          </p>

          {/* Description */}
          <p className="text-slate-300 mb-6">
            {description}
          </p>

          {/* What you'll explore */}
          <div className="text-left mb-8">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
              What you'll explore
            </h3>
            <ul className="space-y-2">
              {bulletPoints.map((point, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <span className={`w-2 h-2 ${colors.bullet} rounded-full mt-2 flex-shrink-0`} />
                  <span className="text-slate-200">{point}</span>
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Duration info */}
          <div className="flex items-center justify-center gap-4 text-sm text-slate-400 mb-8">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              ~{duration}
            </span>
            <span className="text-slate-600">•</span>
            <span>{episodeCount} episodes</span>
          </div>

          {/* Begin button */}
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            onClick={onBegin}
            className={`w-full flex items-center justify-center gap-3 px-8 py-4 bg-gradient-to-r ${colors.button} text-white rounded-2xl font-semibold text-lg transition-all hover:scale-[1.02] shadow-lg`}
          >
            Begin Chapter
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>

        {/* Back button */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          onClick={onBack}
          className="mt-6 w-full text-center text-slate-400 hover:text-white transition text-sm"
        >
          ← Back to chapters
        </motion.button>
      </motion.div>
    </div>
  );
}
