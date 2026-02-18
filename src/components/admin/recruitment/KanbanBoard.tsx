import { DndContext, closestCorners, DragEndEvent, DragOverlay, DragStartEvent, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { useState } from 'react';
import KanbanColumn from './KanbanColumn';
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

interface KanbanBoardProps {
  candidates: Candidate[];
  onStageChange: (candidateId: string, newStage: string) => Promise<void>;
  onCandidateClick: (candidate: Candidate) => void;
  onQuickAction: (candidateId: string, action: string) => void;
}

const PIPELINE_STAGES: { key: string; name: string; color: string }[] = [
  { key: 'initial_contact', name: 'Initial Contact', color: 'gray' },
  { key: 'application', name: 'Application', color: 'blue' },
  { key: 'interview_scheduled', name: 'Interview Scheduled', color: 'cyan' },
  { key: 'interview_completed', name: 'Interview Completed', color: 'indigo' },
  { key: 'document_verification', name: 'Document Verification', color: 'yellow' },
  { key: 'trial_lesson', name: 'Trial Lesson', color: 'purple' },
  { key: 'approved', name: 'Approved', color: 'emerald' },
  { key: 'onboarding', name: 'Onboarding', color: 'teal' },
  { key: 'active', name: 'Active', color: 'green' },
  { key: 'rejected', name: 'Rejected', color: 'red' },
];

export default function KanbanBoard({
  candidates,
  onStageChange,
  onCandidateClick,
  onQuickAction,
}: KanbanBoardProps) {
  const [activeDragCandidate, setActiveDragCandidate] = useState<Candidate | null>(null);

  // Require 8px of movement before starting a drag — allows clicks to pass through
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  function getCandidatesByStage(stage: string): Candidate[] {
    return candidates.filter((c) => c.pipeline_stage === stage);
  }

  function handleDragStart(event: DragStartEvent) {
    const candidate = candidates.find((c) => c.id === event.active.id);
    if (candidate) {
      setActiveDragCandidate(candidate);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    setActiveDragCandidate(null);

    const { active, over } = event;
    if (!over) return;

    const candidateId = active.id as string;
    const newStage = over.id as string;

    // Find the candidate to check their current stage
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    // Only trigger change if the stage actually changed
    if (candidate.pipeline_stage === newStage) return;

    await onStageChange(candidateId, newStage);
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 overflow-x-auto pb-4 px-1">
        {PIPELINE_STAGES.map((stage) => (
          <KanbanColumn
            key={stage.key}
            stage={stage.key}
            stageName={stage.name}
            stageColor={stage.color}
            candidates={getCandidatesByStage(stage.key)}
            onCandidateClick={onCandidateClick}
            onQuickAction={onQuickAction}
          />
        ))}
      </div>

      {/* Drag overlay for smooth drag feedback */}
      <DragOverlay>
        {activeDragCandidate ? (
          <div className="w-[260px]">
            <CandidateCard
              candidate={activeDragCandidate}
              onClick={() => {}}
              onQuickAction={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
