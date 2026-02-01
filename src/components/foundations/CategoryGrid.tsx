import { motion } from 'framer-motion';
import { Lock, CheckCircle, ChevronRight, Trophy, BookOpen } from 'lucide-react';
import { type FoundationCategory } from '../../data/foundationCategories';

interface CategoryGridProps {
  categories: FoundationCategory[];
  iconMap: Record<string, React.ComponentType<{ className?: string }>>;
  onCategorySelect: (category: FoundationCategory) => void;
  getCategoryProgress: (slug: string) => { watched: number; passed: number; total: number };
}

// Define pillar colors matching HomeLandingV2
const pillarColors: Record<string, { gradient: string; light: string; shadow: string; topBar: string }> = {
  'tawheed': {
    gradient: 'from-emerald-500 to-emerald-700',
    light: 'emerald-100',
    shadow: 'shadow-emerald-200',
    topBar: 'bg-emerald-400'
  },
  'how-to-pray': {
    gradient: 'from-teal-500 to-teal-700',
    light: 'teal-100',
    shadow: 'shadow-teal-200',
    topBar: 'bg-teal-400'
  },
  'comparative-religion': {
    gradient: 'from-blue-500 to-blue-700',
    light: 'blue-100',
    shadow: 'shadow-blue-200',
    topBar: 'bg-blue-400'
  },
  'history-of-islam': {
    gradient: 'from-purple-500 to-purple-700',
    light: 'purple-100',
    shadow: 'shadow-purple-200',
    topBar: 'bg-purple-400'
  },
  'names-of-allah': {
    gradient: 'from-amber-500 to-amber-700',
    light: 'amber-100',
    shadow: 'shadow-amber-200',
    topBar: 'bg-amber-400'
  },
  'fiqh-basics': {
    gradient: 'from-rose-500 to-rose-700',
    light: 'rose-100',
    shadow: 'shadow-rose-200',
    topBar: 'bg-rose-400'
  },
  'arabic-foundations': {
    gradient: 'from-cyan-500 to-cyan-700',
    light: 'cyan-100',
    shadow: 'shadow-cyan-200',
    topBar: 'bg-cyan-400'
  },
};

// Icons for each pillar (matching HomeLandingV2 style)
const pillarIcons: Record<string, string> = {
  'tawheed': '﷽',
  'how-to-pray': '/images/icons/icon-mastery.png',
  'comparative-religion': '/images/icons/icon-scholars.png',
  'history-of-islam': '/images/icons/icon-seerah.png',
  'names-of-allah': '/images/icons/icon-authentic.png',
  'fiqh-basics': '/images/icons/icon-understanding.png',
  'arabic-foundations': '/images/icons/icon-scholars.png',
};

export default function CategoryGrid({
  categories,
  iconMap,
  onCategorySelect,
  getCategoryProgress
}: CategoryGridProps) {
  // Calculate overall progress
  const overallProgress = categories.reduce((acc, cat) => {
    const progress = getCategoryProgress(cat.slug);
    return {
      watched: acc.watched + progress.watched,
      passed: acc.passed + progress.passed,
      total: acc.total + progress.total
    };
  }, { watched: 0, passed: 0, total: 0 });

  const overallPercent = overallProgress.total > 0
    ? Math.round((overallProgress.passed / overallProgress.total) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-100 relative overflow-hidden">
      {/* Subtle decorative background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-emerald-100/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-amber-100/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-purple-100/20 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 py-12 relative">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.p
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-emerald-600 text-sm font-semibold uppercase tracking-widest mb-3"
          >
            Your Learning Journey
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3"
          >
            Unshakable Foundations
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-slate-500 max-w-xl mx-auto"
          >
            Master each pillar of knowledge. Complete all sections to build your unshakable foundation in Islam.
          </motion.p>
        </div>

        {/* Overall Progress Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="max-w-2xl mx-auto mb-12"
        >
          <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">Course Progress</h3>
                  <p className="text-sm text-slate-500">{overallProgress.passed} of {overallProgress.total} lessons completed</p>
                </div>
              </div>
              <div className="text-right">
                <span className="text-3xl font-bold text-emerald-600">{overallPercent}%</span>
              </div>
            </div>
            <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${overallPercent}%` }}
                transition={{ delay: 0.5, duration: 0.8 }}
                className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full"
              />
            </div>
          </div>
        </motion.div>

        {/* 3D Pillar Grid - Matching HomeLandingV2 style */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 mb-12">
          {categories.map((category, index) => {
            const colors = pillarColors[category.slug] || pillarColors['tawheed'];
            const iconSrc = pillarIcons[category.slug];
            const progress = getCategoryProgress(category.slug);
            const percent = progress.total > 0 ? Math.round((progress.passed / progress.total) * 100) : 0;
            const isComplete = progress.total > 0 && progress.passed === progress.total;
            const hasProgress = progress.passed > 0;
            const Icon = iconMap[category.icon] || iconMap.BookOpen;

            return (
              <motion.button
                key={category.slug}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.05 }}
                onClick={() => onCategorySelect(category)}
                disabled={category.isComingSoon}
                className={`group relative ${category.isComingSoon ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
              >
                <div className={`bg-gradient-to-b ${colors.gradient} rounded-2xl p-4 sm:p-6 text-center transform transition-all duration-300 ${
                  !category.isComingSoon ? `group-hover:scale-105 group-hover:shadow-xl group-hover:${colors.shadow}` : ''
                } min-h-[200px] sm:min-h-[240px] flex flex-col justify-between relative overflow-hidden`}>

                  {/* 3D Block Effect - Top */}
                  <div
                    className={`absolute -top-2 left-2 right-2 h-4 ${colors.topBar} rounded-t-xl`}
                    style={{ clipPath: 'polygon(8% 0%, 92% 0%, 100% 100%, 0% 100%)' }}
                  />

                  {/* Progress Ring / Completion Badge */}
                  {!category.isComingSoon && (
                    <div className="absolute top-3 right-3 z-20">
                      {isComplete ? (
                        <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-lg">
                          <CheckCircle className="w-6 h-6 text-emerald-500" />
                        </div>
                      ) : (
                        <div className="relative w-12 h-12">
                          {/* Background circle */}
                          <svg className="w-12 h-12 -rotate-90">
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              fill="rgba(255,255,255,0.2)"
                              stroke="rgba(255,255,255,0.3)"
                              strokeWidth="4"
                            />
                            <circle
                              cx="24"
                              cy="24"
                              r="20"
                              fill="none"
                              stroke="white"
                              strokeWidth="4"
                              strokeLinecap="round"
                              strokeDasharray={`${percent * 1.26} 126`}
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-white text-xs font-bold">
                            {percent}%
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Coming Soon Badge */}
                  {category.isComingSoon && (
                    <div className="absolute top-3 right-3 z-20">
                      <span className="px-2 py-1 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full">
                        Soon
                      </span>
                    </div>
                  )}

                  {/* Icon */}
                  <div className="relative z-10 pt-2">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 bg-white/20 rounded-xl flex items-center justify-center">
                      {category.isComingSoon ? (
                        <Lock className="w-7 h-7 text-white/80" />
                      ) : iconSrc && !iconSrc.startsWith('/') ? (
                        <span className="text-2xl sm:text-3xl">{iconSrc}</span>
                      ) : iconSrc ? (
                        <img src={iconSrc} alt={category.name} className="w-10 h-10 sm:w-12 sm:h-12 object-contain" />
                      ) : (
                        <Icon className="w-8 h-8 text-white" />
                      )}
                    </div>
                    <h3 className="text-white font-bold text-base sm:text-lg mb-1">{category.name}</h3>
                    <p className="text-white/80 text-xs sm:text-sm">{category.description || category.arabicName}</p>
                  </div>

                  {/* Progress Info */}
                  <div className="relative z-10 mt-4">
                    {!category.isComingSoon && progress.total > 0 ? (
                      <div className="space-y-2">
                        <div className="h-1.5 bg-white/20 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-white rounded-full transition-all duration-500"
                            style={{ width: `${percent}%` }}
                          />
                        </div>
                        <p className="text-white/70 text-xs">
                          {progress.passed} / {progress.total} lessons
                        </p>
                      </div>
                    ) : !category.isComingSoon ? (
                      <div className="flex items-center justify-center text-white/80 text-sm">
                        <span>{hasProgress ? 'Continue' : 'Start'}</span>
                        <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
                      </div>
                    ) : (
                      <p className="text-white/50 text-xs">Coming soon</p>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
        </div>

        {/* Recommended Next Step */}
        {overallProgress.passed > 0 && overallProgress.passed < overallProgress.total && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-2xl p-6 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-emerald-800">Keep Going!</h3>
              </div>
              <p className="text-emerald-700 text-sm">
                You're making great progress. Complete all lessons to earn your Foundations Certificate.
              </p>
            </div>
          </motion.div>
        )}

        {/* Completion Message */}
        {overallProgress.total > 0 && overallProgress.passed === overallProgress.total && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.8 }}
            className="max-w-2xl mx-auto"
          >
            <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-2xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-amber-100 rounded-full flex items-center justify-center">
                <Trophy className="w-8 h-8 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-amber-800 mb-2">Congratulations!</h3>
              <p className="text-amber-700 text-sm mb-4">
                You've completed all the Unshakable Foundations. Your knowledge is now firmly grounded.
              </p>
              <a
                href="/teachers"
                className="inline-flex items-center px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-medium transition shadow-sm"
              >
                Continue with 1-on-1 Lessons
                <ChevronRight className="w-4 h-4 ml-2" />
              </a>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
