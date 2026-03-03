import { motion } from 'framer-motion';
import {
  Compass,
  Brain,
  FileSearch,
  Map,
  MessageSquare,
  Link,
  Users,
  Globe,
  Heart,
  Footprints,
} from 'lucide-react';

type FlowStage = 'intro' | 'bias' | 'chain-of-custody' | 'walkthrough' | 'the-voice' | 'reconciliation' | 'prophet-timeline' | 'the-names' | 'the-mercy' | 'first-step';

interface StageInfo {
  id: FlowStage;
  label: string;
  shortLabel: string;
  icon: React.ReactNode;
  chapter: number;
}

const stages: StageInfo[] = [
  // Chapter 1
  { id: 'intro', label: 'Introduction', shortLabel: 'Intro', icon: <Compass className="w-4 h-4" />, chapter: 1 },
  { id: 'bias', label: 'Bias Check', shortLabel: 'Bias', icon: <Brain className="w-4 h-4" />, chapter: 1 },
  { id: 'chain-of-custody', label: 'Chain of Custody', shortLabel: 'Source', icon: <FileSearch className="w-4 h-4" />, chapter: 1 },
  // Chapter 2
  { id: 'walkthrough', label: 'The Walkthrough', shortLabel: 'Walk', icon: <Map className="w-4 h-4" />, chapter: 2 },
  // Chapter 3
  { id: 'the-voice', label: 'The Voice', shortLabel: 'Voice', icon: <MessageSquare className="w-4 h-4" />, chapter: 3 },
  { id: 'reconciliation', label: 'The Connection', shortLabel: 'Connect', icon: <Link className="w-4 h-4" />, chapter: 3 },
  { id: 'prophet-timeline', label: 'The Prophets', shortLabel: 'Prophets', icon: <Users className="w-4 h-4" />, chapter: 3 },
  { id: 'the-names', label: 'The Names', shortLabel: 'Names', icon: <Globe className="w-4 h-4" />, chapter: 3 },
  { id: 'the-mercy', label: 'The Mercy', shortLabel: 'Mercy', icon: <Heart className="w-4 h-4" />, chapter: 3 },
  { id: 'first-step', label: 'The First Step', shortLabel: 'Step', icon: <Footprints className="w-4 h-4" />, chapter: 3 },
];

// Map chapter-intro/complete flow stages to the nearest real progress bar stage
// Derived from chapter data: intro → first stage, complete → last stage of that chapter
const CHAPTER_FIRST_STAGE: Record<number, number> = {};
const CHAPTER_LAST_STAGE: Record<number, number> = {};
stages.forEach((s, i) => {
  if (!(s.chapter in CHAPTER_FIRST_STAGE)) CHAPTER_FIRST_STAGE[s.chapter] = i;
  CHAPTER_LAST_STAGE[s.chapter] = i;
});

interface ExploreProgressBarProps {
  currentStage: string;
  onStageClick: (stage: FlowStage) => void;
  highestStageReached: string;
}

const resolveStageIndex = (stage: string): number => {
  const direct = stages.findIndex(s => s.id === stage);
  if (direct >= 0) return direct;

  // Chapter boundaries → derived from chapter data
  const introMatch = stage.match(/^chapter-(\d+)-intro$/);
  if (introMatch) {
    const ch = parseInt(introMatch[1], 10);
    return CHAPTER_FIRST_STAGE[ch] ?? 0;
  }
  const completeMatch = stage.match(/^chapter-(\d+)-complete$/);
  if (completeMatch) {
    const ch = parseInt(completeMatch[1], 10);
    return CHAPTER_LAST_STAGE[ch] ?? 0;
  }
  return 0;
};

export const ExploreProgressBar = ({
  currentStage,
  onStageClick,
  highestStageReached,
}: ExploreProgressBarProps) => {
  const currentIndex = resolveStageIndex(currentStage);
  const highestIndex = resolveStageIndex(highestStageReached);

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

      {/* Mobile view - simple progress indicator */}
      <div className="md:hidden px-4 py-4">
        <div className="flex items-center justify-center">
          <div className="text-center">
            <span className="text-emerald-400 text-sm font-medium">
              {currentIndex >= 0 ? stages[currentIndex].label : 'Exploring'}
            </span>
            <span className="text-slate-500 text-xs ml-2">
              ({Math.max(currentIndex + 1, 1)}/{stages.length})
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExploreProgressBar;
