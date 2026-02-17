import { useDroppable } from '@dnd-kit/core';
import CandidateCard from './CandidateCard';

interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  nationality?: string;
  country?: string;
  subjects: string[];
  expected_hourly_rate?: number;
  assigned_tier?: string;
  pipeline_stage: string;
  pipeline_stage_updated_at: string;
  admin_notes?: string;
  created_at: string;
}

interface KanbanColumnProps {
  stage: string;
  stageName: string;
  stageColor: string;
  candidates: Candidate[];
  onCandidateClick: (candidate: Candidate) => void;
  onQuickAction: (candidateId: string, action: string) => void;
}

const colorMap: Record<string, { bg: string; text: string; border: string; dot: string; badge: string }> = {
  gray: {
    bg: 'bg-gray-100 dark:bg-gray-700/50',
    text: 'text-gray-700 dark:text-gray-300',
    border: 'border-gray-300 dark:border-gray-600',
    dot: 'bg-gray-400',
    badge: 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300',
  },
  blue: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-700',
    dot: 'bg-blue-500',
    badge: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  },
  cyan: {
    bg: 'bg-cyan-50 dark:bg-cyan-900/20',
    text: 'text-cyan-700 dark:text-cyan-300',
    border: 'border-cyan-300 dark:border-cyan-700',
    dot: 'bg-cyan-500',
    badge: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-700 dark:text-cyan-300',
  },
  indigo: {
    bg: 'bg-indigo-50 dark:bg-indigo-900/20',
    text: 'text-indigo-700 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-700',
    dot: 'bg-indigo-500',
    badge: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300',
  },
  yellow: {
    bg: 'bg-yellow-50 dark:bg-yellow-900/20',
    text: 'text-yellow-700 dark:text-yellow-300',
    border: 'border-yellow-300 dark:border-yellow-700',
    dot: 'bg-yellow-500',
    badge: 'bg-yellow-100 dark:bg-yellow-900/40 text-yellow-700 dark:text-yellow-300',
  },
  purple: {
    bg: 'bg-purple-50 dark:bg-purple-900/20',
    text: 'text-purple-700 dark:text-purple-300',
    border: 'border-purple-300 dark:border-purple-700',
    dot: 'bg-purple-500',
    badge: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  },
  emerald: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/20',
    text: 'text-emerald-700 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-700',
    dot: 'bg-emerald-500',
    badge: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300',
  },
  teal: {
    bg: 'bg-teal-50 dark:bg-teal-900/20',
    text: 'text-teal-700 dark:text-teal-300',
    border: 'border-teal-300 dark:border-teal-700',
    dot: 'bg-teal-500',
    badge: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300',
  },
  green: {
    bg: 'bg-green-50 dark:bg-green-900/20',
    text: 'text-green-700 dark:text-green-300',
    border: 'border-green-300 dark:border-green-700',
    dot: 'bg-green-500',
    badge: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  },
  red: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    border: 'border-red-300 dark:border-red-700',
    dot: 'bg-red-500',
    badge: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300',
  },
};

export default function KanbanColumn({
  stage,
  stageName,
  stageColor,
  candidates,
  onCandidateClick,
  onQuickAction,
}: KanbanColumnProps) {
  const { isOver, setNodeRef } = useDroppable({
    id: stage,
  });

  const colors = colorMap[stageColor] || colorMap.gray;

  return (
    <div
      ref={setNodeRef}
      className={`min-w-[280px] w-[280px] flex-shrink-0 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-200 dark:border-gray-700 flex flex-col transition-colors ${
        isOver ? 'ring-2 ring-emerald-400 border-emerald-300 dark:border-emerald-600' : ''
      }`}
    >
      {/* Column Header */}
      <div className={`px-3 py-3 border-b ${colors.border}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${colors.dot}`} />
            <h3 className={`text-sm font-semibold ${colors.text}`}>{stageName}</h3>
          </div>
          <span
            className={`text-xs font-medium px-2 py-0.5 rounded-full ${colors.badge}`}
          >
            {candidates.length}
          </span>
        </div>
      </div>

      {/* Cards Area */}
      <div className="p-2 flex-1 overflow-y-auto max-h-[calc(100vh-240px)] min-h-[120px] space-y-2">
        {candidates.length === 0 ? (
          <div className="flex items-center justify-center h-20 text-xs text-gray-400 dark:text-gray-500">
            No candidates
          </div>
        ) : (
          candidates.map((candidate) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              onClick={() => onCandidateClick(candidate)}
              onQuickAction={(action) => onQuickAction(candidate.id, action)}
            />
          ))
        )}
      </div>
    </div>
  );
}
