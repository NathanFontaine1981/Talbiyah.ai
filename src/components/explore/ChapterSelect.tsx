import { motion } from 'framer-motion';
import { ChevronRight, CheckCircle2, Lock, Play, Eye, Scale, Heart, Clock } from 'lucide-react';

export interface Chapter {
  id: number;
  title: string;
  subtitle: string;
  description: string;
  bulletPoints: string[];
  duration: string;
  episodeCount: number;
  icon: React.ReactNode;
  color: 'amber' | 'emerald' | 'purple';
  isUnlocked: boolean;
  isCompleted: boolean;
  progress: number; // 0-100
}

interface ChapterSelectProps {
  chapters: Chapter[];
  onSelectChapter: (chapterId: number) => void;
  totalProgress: number; // 0-100
}

const colorClasses = {
  amber: {
    bg: 'from-amber-900/30 to-orange-900/20',
    border: 'border-amber-700/50',
    borderHover: 'hover:border-amber-500',
    icon: 'from-amber-500 to-orange-500',
    text: 'text-amber-400',
    progress: 'bg-amber-500',
    button: 'bg-amber-600 hover:bg-amber-500',
  },
  emerald: {
    bg: 'from-emerald-900/30 to-teal-900/20',
    border: 'border-emerald-700/50',
    borderHover: 'hover:border-emerald-500',
    icon: 'from-emerald-500 to-teal-500',
    text: 'text-emerald-400',
    progress: 'bg-emerald-500',
    button: 'bg-emerald-600 hover:bg-emerald-500',
  },
  purple: {
    bg: 'from-purple-900/30 to-indigo-900/20',
    border: 'border-purple-700/50',
    borderHover: 'hover:border-purple-500',
    icon: 'from-purple-500 to-indigo-500',
    text: 'text-purple-400',
    progress: 'bg-purple-500',
    button: 'bg-purple-600 hover:bg-purple-500',
  },
};

export default function ChapterSelect({ chapters, onSelectChapter, totalProgress }: ChapterSelectProps) {
  return (
    <div className="space-y-6">
      {/* Overall progress */}
      {totalProgress > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/50"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-slate-400">Your Journey</span>
            <span className="text-sm font-medium text-white">{Math.round(totalProgress)}% complete</span>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${totalProgress}%` }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="h-full bg-gradient-to-r from-amber-500 via-emerald-500 to-purple-500 rounded-full"
            />
          </div>
        </motion.div>
      )}

      {/* Chapter cards */}
      <div className="space-y-4">
        {chapters.map((chapter, index) => {
          const colors = colorClasses[chapter.color];
          const isLocked = !chapter.isUnlocked;

          return (
            <motion.button
              key={chapter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => !isLocked && onSelectChapter(chapter.id)}
              disabled={isLocked}
              className={`group w-full text-left bg-gradient-to-br ${colors.bg} border ${colors.border} ${
                !isLocked ? colors.borderHover : ''
              } rounded-2xl p-5 transition-all ${
                isLocked ? 'opacity-60 cursor-not-allowed' : 'hover:scale-[1.01]'
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${colors.icon} flex items-center justify-center flex-shrink-0 shadow-lg ${
                  isLocked ? 'opacity-50' : ''
                }`}>
                  {chapter.isCompleted ? (
                    <CheckCircle2 className="w-7 h-7 text-white" />
                  ) : isLocked ? (
                    <Lock className="w-6 h-6 text-white/70" />
                  ) : (
                    <div className="text-white">
                      {chapter.icon}
                    </div>
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-semibold uppercase tracking-wide ${colors.text}`}>
                      Chapter {chapter.id}
                    </span>
                    {chapter.isCompleted && (
                      <span className="text-xs px-2 py-0.5 bg-emerald-900/50 text-emerald-400 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-1">
                    {chapter.title}
                  </h3>
                  <p className="text-slate-400 text-sm mb-3">
                    {chapter.subtitle}
                  </p>

                  {/* Meta info */}
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      ~{chapter.duration}
                    </span>
                    <span>{chapter.episodeCount} episodes</span>
                  </div>

                  {/* Progress bar (if started but not complete) */}
                  {chapter.progress > 0 && chapter.progress < 100 && (
                    <div className="mt-3">
                      <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full ${colors.progress} rounded-full transition-all`}
                          style={{ width: `${chapter.progress}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Arrow */}
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                  isLocked ? 'bg-slate-800/50' : 'bg-slate-800/50 group-hover:bg-slate-700/50'
                } transition-all`}>
                  {isLocked ? (
                    <Lock className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronRight className={`w-5 h-5 ${colors.text} group-hover:translate-x-0.5 transition-transform`} />
                  )}
                </div>
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// Default chapter data for Explore Islam
export const EXPLORE_CHAPTERS: Omit<Chapter, 'isUnlocked' | 'isCompleted' | 'progress'>[] = [
  {
    id: 1,
    title: 'Open Mind',
    subtitle: 'Preparing for the journey',
    description: 'Let\'s clear our minds together. We all carry biases — setting them aside is the first step to honest inquiry.',
    bulletPoints: [
      'Clear our minds of preconceptions',
      'Approach evidence with fresh eyes',
      'Commit to honest consideration',
    ],
    duration: '10 min',
    episodeCount: 3,
    icon: <Eye className="w-7 h-7" />,
    color: 'amber',
  },
  {
    id: 2,
    title: 'The Evidence',
    subtitle: 'Scientific facts in ancient text',
    description: 'Examine undeniable scientific facts stated in the Quran over 1,400 years ago—long before modern discovery.',
    bulletPoints: [
      'Review scientific facts we can all agree on',
      'See how ancient text matches modern science',
      'Weigh the statistical probability',
    ],
    duration: '15 min',
    episodeCount: 3,
    icon: <Scale className="w-7 h-7" />,
    color: 'emerald',
  },
  {
    id: 3,
    title: "What's Inside",
    subtitle: 'The message and meaning',
    description: 'Discover what this book actually says—about life, purpose, and your place in creation.',
    bulletPoints: [
      'Explore the source of this knowledge',
      'Understand the connection between faiths',
      'Learn practical life guidance',
    ],
    duration: '20 min',
    episodeCount: 5,
    icon: <Heart className="w-7 h-7" />,
    color: 'purple',
  },
];
