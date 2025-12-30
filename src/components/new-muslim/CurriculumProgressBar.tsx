import { motion } from 'framer-motion';
import {
  Globe,
  DollarSign,
  Trophy,
  BookOpen,
  Leaf,
  Scale,
  CheckCircle2,
  Lock,
} from 'lucide-react';
import { CurriculumModule, curriculumModules } from '../../data/curriculumData';

interface CurriculumProgressBarProps {
  currentModule: CurriculumModule | null;
  completedModules: string[];
  onModuleClick: (module: CurriculumModule) => void;
  onBackToDashboard: () => void;
}

// Icons for each module
const moduleIcons: Record<string, React.ReactNode> = {
  origin: <Globe className="w-4 h-4" />,
  worship: <DollarSign className="w-4 h-4" />,
  fear: <Trophy className="w-4 h-4" />,
  protocol: <BookOpen className="w-4 h-4" />,
  wayoflife: <Leaf className="w-4 h-4" />,
  verdict: <Scale className="w-4 h-4" />,
};

export const CurriculumProgressBar = ({
  currentModule,
  completedModules,
  onModuleClick,
  onBackToDashboard,
}: CurriculumProgressBarProps) => {
  const currentIndex = currentModule
    ? curriculumModules.findIndex(m => m.id === currentModule.id)
    : -1;

  const isModuleAccessible = (module: CurriculumModule): boolean => {
    // First module always accessible
    if (module.moduleNumber === 0) return true;
    // Accessible if previous is completed
    const prevModule = curriculumModules.find(m => m.moduleNumber === module.moduleNumber - 1);
    return prevModule ? completedModules.includes(prevModule.id) : false;
  };

  const isModuleCompleted = (moduleId: string): boolean => {
    return completedModules.includes(moduleId);
  };

  const handleClick = (module: CurriculumModule) => {
    if (isModuleAccessible(module) || isModuleCompleted(module.id)) {
      onModuleClick(module);
    }
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
      {/* Progress line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-purple-600 to-indigo-400"
          initial={{ width: 0 }}
          animate={{ width: `${((completedModules.length) / curriculumModules.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Desktop view - full labels */}
      <div className="hidden md:flex items-center justify-between max-w-5xl mx-auto px-4 py-3">
        <button
          onClick={onBackToDashboard}
          className="text-slate-400 hover:text-white transition text-sm"
        >
          ← Back
        </button>

        <div className="flex items-center gap-2">
          {curriculumModules.map((module) => {
            const accessible = isModuleAccessible(module);
            const completed = isModuleCompleted(module.id);
            const current = currentModule?.id === module.id;

            return (
              <button
                key={module.id}
                onClick={() => handleClick(module)}
                disabled={!accessible && !completed}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                  current
                    ? 'bg-purple-600 text-white'
                    : completed
                    ? 'bg-purple-900/50 text-purple-300 hover:bg-purple-800/50'
                    : accessible
                    ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    : 'bg-slate-900 text-slate-600 cursor-not-allowed'
                }`}
              >
                {completed && !current ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : !accessible && !completed ? (
                  <Lock className="w-3 h-3" />
                ) : (
                  moduleIcons[module.id]
                )}
                <span className="text-sm font-medium">Ep {module.moduleNumber}</span>
              </button>
            );
          })}
        </div>

        <div className="text-slate-500 text-sm">
          {completedModules.length}/{curriculumModules.length}
        </div>
      </div>

      {/* Mobile view - dots with current label */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={onBackToDashboard}
            className="text-slate-400 hover:text-white transition text-sm"
          >
            ← Back
          </button>
          <span className="text-purple-400 text-sm font-medium">
            {currentModule?.title || 'Select Chapter'}
          </span>
          <span className="text-slate-500 text-xs">
            {currentIndex + 1} / {curriculumModules.length}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          {curriculumModules.map((module) => {
            const accessible = isModuleAccessible(module);
            const completed = isModuleCompleted(module.id);
            const current = currentModule?.id === module.id;

            return (
              <button
                key={module.id}
                onClick={() => handleClick(module)}
                disabled={!accessible && !completed}
                className="relative group"
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all ${
                    current
                      ? 'bg-purple-500 scale-125'
                      : completed
                      ? 'bg-purple-600'
                      : accessible
                      ? 'bg-slate-600 hover:bg-slate-500'
                      : 'bg-slate-800'
                  }`}
                />
                {/* Tooltip on hover */}
                {(accessible || completed) && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {module.title}
                    </div>
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default CurriculumProgressBar;
