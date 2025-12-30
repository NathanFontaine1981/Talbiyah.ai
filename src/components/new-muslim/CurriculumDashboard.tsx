import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Play,
  Lock,
  CheckCircle2,
  Clock,
  ArrowRight,
  X,
  Sparkles,
  Globe,
  DollarSign,
  Trophy,
  BookOpen,
  Leaf,
  Scale,
} from 'lucide-react';
import { curriculumModules, CurriculumModule } from '../../data/curriculumData';

interface CurriculumDashboardProps {
  completedModules?: string[];
  onSelectModule: (module: CurriculumModule) => void;
}

// Thumbnail backgrounds based on type
const thumbnailStyles: Record<string, { bg: string; icon: React.ReactNode }> = {
  space: {
    bg: 'from-indigo-900 via-purple-900 to-slate-900',
    icon: <Globe className="w-12 h-12 text-indigo-300" />,
  },
  money: {
    bg: 'from-amber-900 via-yellow-900 to-slate-900',
    icon: <DollarSign className="w-12 h-12 text-amber-300" />,
  },
  stadium: {
    bg: 'from-emerald-900 via-green-900 to-slate-900',
    icon: <Trophy className="w-12 h-12 text-emerald-300" />,
  },
  prayer: {
    bg: 'from-blue-900 via-cyan-900 to-slate-900',
    icon: <BookOpen className="w-12 h-12 text-blue-300" />,
  },
  nature: {
    bg: 'from-green-900 via-teal-900 to-slate-900',
    icon: <Leaf className="w-12 h-12 text-green-300" />,
  },
  scales: {
    bg: 'from-rose-900 via-red-900 to-slate-900',
    icon: <Scale className="w-12 h-12 text-rose-300" />,
  },
};

export const CurriculumDashboard = ({
  completedModules = [],
  onSelectModule,
}: CurriculumDashboardProps) => {
  const [selectedModule, setSelectedModule] = useState<CurriculumModule | null>(null);

  const isModuleUnlocked = (module: CurriculumModule): boolean => {
    if (module.moduleNumber === 0) return true;
    // Unlock if previous module is completed
    const prevModule = curriculumModules.find(m => m.moduleNumber === module.moduleNumber - 1);
    return prevModule ? completedModules.includes(prevModule.id) : false;
  };

  const isModuleCompleted = (moduleId: string): boolean => {
    return completedModules.includes(moduleId);
  };

  const handleModuleClick = (module: CurriculumModule) => {
    if (isModuleUnlocked(module) || isModuleCompleted(module.id)) {
      setSelectedModule(module);
    }
  };

  const handleStartModule = () => {
    if (selectedModule) {
      onSelectModule(selectedModule);
    }
  };

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h2 className="text-2xl sm:text-3xl font-serif text-white mb-2">
          Your Learning Journey
        </h2>
        <p className="text-slate-400">
          {completedModules.length} of {curriculumModules.length} chapters completed
        </p>
      </div>

      {/* Progress bar */}
      <div className="mb-8">
        <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
            initial={{ width: 0 }}
            animate={{ width: `${(completedModules.length / curriculumModules.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
      </div>

      {/* Netflix-style module grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {curriculumModules.map((module) => {
          const unlocked = isModuleUnlocked(module);
          const completed = isModuleCompleted(module.id);
          const style = thumbnailStyles[module.thumbnailType];

          return (
            <motion.div
              key={module.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: module.moduleNumber * 0.1 }}
              className={`relative group cursor-pointer ${!unlocked && !completed ? 'opacity-60' : ''}`}
              onClick={() => handleModuleClick(module)}
            >
              {/* Thumbnail */}
              <div className={`relative aspect-video rounded-xl overflow-hidden bg-gradient-to-br ${style.bg} mb-3`}>
                {/* Background pattern */}
                <div className="absolute inset-0 opacity-20">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]" />
                </div>

                {/* Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  {style.icon}
                </div>

                {/* Episode number */}
                <div className="absolute top-3 left-3 bg-black/50 backdrop-blur px-2 py-1 rounded text-xs text-white font-medium">
                  Episode {module.moduleNumber}
                </div>

                {/* Status badge */}
                <div className="absolute top-3 right-3">
                  {completed ? (
                    <div className="bg-emerald-500 p-1.5 rounded-full">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                  ) : !unlocked ? (
                    <div className="bg-slate-700 p-1.5 rounded-full">
                      <Lock className="w-4 h-4 text-slate-400" />
                    </div>
                  ) : null}
                </div>

                {/* Hover overlay */}
                {(unlocked || completed) && (
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center">
                      <Play className="w-6 h-6 text-slate-900 ml-1" />
                    </div>
                  </div>
                )}

                {/* Lock overlay */}
                {!unlocked && !completed && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-slate-400" />
                  </div>
                )}
              </div>

              {/* Title and meta */}
              <h3 className="text-white font-semibold mb-1 group-hover:text-emerald-400 transition">
                {module.title}
              </h3>
              <p className="text-slate-400 text-sm mb-2 line-clamp-2">
                {module.description}
              </p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {module.readTime} min
                </span>
                {completed && (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Completed
                  </span>
                )}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Module Preview Modal */}
      <AnimatePresence>
        {selectedModule && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedModule(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header image */}
              <div className={`relative h-48 bg-gradient-to-br ${thumbnailStyles[selectedModule.thumbnailType].bg}`}>
                <div className="absolute inset-0 flex items-center justify-center">
                  {thumbnailStyles[selectedModule.thumbnailType].icon}
                </div>
                <button
                  onClick={() => setSelectedModule(null)}
                  className="absolute top-4 right-4 w-10 h-10 bg-black/50 rounded-full flex items-center justify-center text-white hover:bg-black/70 transition"
                >
                  <X className="w-5 h-5" />
                </button>
                <div className="absolute bottom-4 left-4">
                  <span className="bg-black/50 backdrop-blur px-3 py-1 rounded-full text-sm text-white">
                    Episode {selectedModule.moduleNumber}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-6">
                <h2 className="text-2xl font-serif text-white mb-2">
                  {selectedModule.title}
                </h2>
                <p className="text-emerald-400 text-sm mb-4">
                  {selectedModule.subtitle}
                </p>
                <p className="text-slate-300 mb-6">
                  {selectedModule.description}
                </p>

                {/* Key points */}
                <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                  <h3 className="text-white font-medium mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    What you'll learn
                  </h3>
                  <ul className="space-y-2">
                    {selectedModule.keyPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-300 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
                        {point}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Meta */}
                <div className="flex items-center gap-4 text-sm text-slate-400 mb-6">
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedModule.readTime} min read
                  </span>
                  {isModuleCompleted(selectedModule.id) && (
                    <span className="flex items-center gap-1 text-emerald-400">
                      <CheckCircle2 className="w-4 h-4" />
                      Completed
                    </span>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <button
                    onClick={handleStartModule}
                    className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full font-semibold transition flex items-center justify-center gap-2"
                  >
                    <Play className="w-5 h-5" />
                    {isModuleCompleted(selectedModule.id) ? 'Review Chapter' : 'Start Chapter'}
                  </button>
                  <button
                    onClick={() => setSelectedModule(null)}
                    className="px-6 py-3 border border-slate-600 text-slate-300 hover:bg-slate-800 rounded-full transition"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CurriculumDashboard;
