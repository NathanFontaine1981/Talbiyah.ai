import { motion } from 'framer-motion';
import {
  Compass,
  Brain,
  FileSearch,
  CheckSquare,
  BookOpen,
  Target,
  Flag,
  HelpCircle,
  Link,
  Users,
  Sparkles,
  Heart,
} from 'lucide-react';

type FlowStage = 'intro' | 'bias' | 'chain-of-custody' | 'axiom-check' | 'authority-match' | 'probability-moment' | 'checkpoint' | 'the-question' | 'reconciliation' | 'prophet-timeline' | 'cheat-codes' | 'first-step';

interface StageInfo {
  id: FlowStage;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
}

const stages: StageInfo[] = [
  { id: 'intro', label: 'Introduction', shortLabel: 'Intro', icon: <Compass className="w-4 h-4" /> },
  { id: 'bias', label: 'Bias Check', shortLabel: 'Bias', icon: <Brain className="w-4 h-4" /> },
  { id: 'chain-of-custody', label: 'Chain of Custody', shortLabel: 'Source', icon: <FileSearch className="w-4 h-4" /> },
  { id: 'axiom-check', label: 'The Facts', shortLabel: 'Facts', icon: <CheckSquare className="w-4 h-4" /> },
  { id: 'authority-match', label: 'The Quran', shortLabel: 'Quran', icon: <BookOpen className="w-4 h-4" /> },
  { id: 'probability-moment', label: 'The Odds', shortLabel: 'Odds', icon: <Target className="w-4 h-4" /> },
  { id: 'checkpoint', label: 'Checkpoint', shortLabel: 'Check', icon: <Flag className="w-4 h-4" /> },
  { id: 'the-question', label: 'The Question', shortLabel: 'Question', icon: <HelpCircle className="w-4 h-4" /> },
  { id: 'reconciliation', label: 'The Connection', shortLabel: 'Connect', icon: <Link className="w-4 h-4" /> },
  { id: 'prophet-timeline', label: 'The Prophets', shortLabel: 'Prophets', icon: <Users className="w-4 h-4" /> },
  { id: 'cheat-codes', label: 'Life Guidance', shortLabel: 'Guide', icon: <Sparkles className="w-4 h-4" /> },
  { id: 'first-step', label: 'The First Step', shortLabel: 'Step', icon: <Heart className="w-4 h-4" /> },
];

interface ExploreProgressBarProps {
  currentStage: FlowStage;
  onStageClick: (stage: FlowStage) => void;
  highestStageReached: FlowStage;
}

export const ExploreProgressBar = ({
  currentStage,
  onStageClick,
  highestStageReached,
}: ExploreProgressBarProps) => {
  const currentIndex = stages.findIndex(s => s.id === currentStage);
  const highestIndex = stages.findIndex(s => s.id === highestStageReached);

  const isStageAccessible = (stageIndex: number) => {
    return stageIndex <= highestIndex;
  };

  const isStageComplete = (stageIndex: number) => {
    return stageIndex < currentIndex;
  };

  const isStageCurrent = (stageId: FlowStage) => {
    return stageId === currentStage;
  };

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800">
      {/* Progress line */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-slate-800">
        <motion.div
          className="h-full bg-gradient-to-r from-emerald-600 to-emerald-400"
          initial={{ width: 0 }}
          animate={{ width: `${((currentIndex + 1) / stages.length) * 100}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Desktop view - full labels */}
      <div className="hidden md:flex items-center justify-between max-w-5xl mx-auto px-4 py-3">
        {stages.map((stage, index) => {
          const accessible = isStageAccessible(index);
          const complete = isStageComplete(index);
          const current = isStageCurrent(stage.id);

          return (
            <button
              key={stage.id}
              onClick={() => accessible && onStageClick(stage.id)}
              disabled={!accessible}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                current
                  ? 'bg-emerald-600 text-white'
                  : complete
                  ? 'bg-emerald-900/50 text-emerald-300 hover:bg-emerald-800/50'
                  : accessible
                  ? 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                  : 'bg-slate-900 text-slate-600 cursor-not-allowed'
              }`}
            >
              {stage.icon}
              <span className="text-sm font-medium">{stage.shortLabel}</span>
            </button>
          );
        })}
      </div>

      {/* Mobile view - dots with current label */}
      <div className="md:hidden px-4 py-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-emerald-400 text-sm font-medium">
            {stages[currentIndex].label}
          </span>
          <span className="text-slate-500 text-xs">
            {currentIndex + 1} / {stages.length}
          </span>
        </div>
        <div className="flex items-center justify-center gap-2">
          {stages.map((stage, index) => {
            const accessible = isStageAccessible(index);
            const complete = isStageComplete(index);
            const current = isStageCurrent(stage.id);

            return (
              <button
                key={stage.id}
                onClick={() => accessible && onStageClick(stage.id)}
                disabled={!accessible}
                className={`relative group`}
              >
                <div
                  className={`w-3 h-3 rounded-full transition-all ${
                    current
                      ? 'bg-emerald-500 scale-125'
                      : complete
                      ? 'bg-emerald-600'
                      : accessible
                      ? 'bg-slate-600 hover:bg-slate-500'
                      : 'bg-slate-800'
                  }`}
                />
                {/* Tooltip on hover */}
                {accessible && (
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                    <div className="bg-slate-800 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                      {stage.label}
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

export default ExploreProgressBar;
