import { useState, useEffect } from 'react';
import { ChevronRight, CheckCircle, Circle, Lock, BookOpen } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface CurriculumSubject {
  id: string;
  name: string;
  name_arabic: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
}

interface CurriculumPhase {
  id: string;
  name: string;
  name_arabic: string;
  slug: string;
  description: string;
  sort_order: number;
  estimated_hours: number;
}

interface CurriculumStage {
  id: string;
  phase_id: string;
  name: string;
  name_arabic: string;
  slug: string;
  description: string;
  sort_order: number;
}

interface CurriculumMilestone {
  id: string;
  stage_id: string;
  name: string;
  name_arabic: string;
  slug: string;
  description: string;
  pillar: 'fahm' | 'itqan' | 'hifz' | null;
  sort_order: number;
}

interface MilestoneProgress {
  milestone_id: string;
  status: 'not_started' | 'in_progress' | 'pending_verification' | 'verified' | 'mastered';
  progress_percentage: number;
}

interface StudentProgress {
  subject_id: string;
  current_phase_id: string | null;
  current_stage_id: string | null;
  overall_progress_percentage: number;
}

const pillarConfig = {
  fahm: {
    label: 'Understanding',
    arabic: 'فهم',
    color: 'text-blue-600',
    bg: 'bg-blue-100',
  },
  itqan: {
    label: 'Fluency',
    arabic: 'إتقان',
    color: 'text-emerald-600',
    bg: 'bg-emerald-100',
  },
  hifz: {
    label: 'Memorization',
    arabic: 'حفظ',
    color: 'text-purple-600',
    bg: 'bg-purple-100',
  },
};

interface CurriculumProgressProps {
  subjectSlug?: string;
  studentId?: string;
  variant?: 'full' | 'compact' | 'overview';
}

export default function CurriculumProgress({
  subjectSlug = 'quran-reading',
  studentId,
  variant = 'full',
}: CurriculumProgressProps) {
  const [subject, setSubject] = useState<CurriculumSubject | null>(null);
  const [phases, setPhases] = useState<CurriculumPhase[]>([]);
  const [stages, setStages] = useState<CurriculumStage[]>([]);
  const [milestones, setMilestones] = useState<CurriculumMilestone[]>([]);
  const [milestoneProgress, setMilestoneProgress] = useState<Map<string, MilestoneProgress>>(new Map());
  const [studentProgress, setStudentProgress] = useState<StudentProgress | null>(null);
  const [expandedPhase, setExpandedPhase] = useState<string | null>(null);
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchCurriculum() {
      // Get current user if studentId not provided
      let targetId = studentId;
      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetId = user?.id;
      }

      try {
        // Fetch subject
        const { data: subjectData } = await supabase
          .from('curriculum_subjects')
          .select('*')
          .eq('slug', subjectSlug)
          .single();

        if (!subjectData) return;
        setSubject(subjectData);

        // Fetch phases
        const { data: phasesData } = await supabase
          .from('curriculum_phases')
          .select('*')
          .eq('subject_id', subjectData.id)
          .order('sort_order');

        setPhases(phasesData || []);

        if (phasesData && phasesData.length > 0) {
          // Fetch all stages for these phases
          const phaseIds = phasesData.map(p => p.id);
          const { data: stagesData } = await supabase
            .from('curriculum_stages')
            .select('*')
            .in('phase_id', phaseIds)
            .order('sort_order');

          setStages(stagesData || []);

          if (stagesData && stagesData.length > 0) {
            // Fetch all milestones for these stages
            const stageIds = stagesData.map(s => s.id);
            const { data: milestonesData } = await supabase
              .from('curriculum_milestones')
              .select('*')
              .in('stage_id', stageIds)
              .order('sort_order');

            setMilestones(milestonesData || []);

            // Fetch student progress if logged in
            if (targetId) {
              const milestoneIds = (milestonesData || []).map(m => m.id);
              const { data: progressData } = await supabase
                .from('student_milestone_progress')
                .select('milestone_id, status, progress_percentage')
                .eq('student_id', targetId)
                .in('milestone_id', milestoneIds);

              const progressMap = new Map<string, MilestoneProgress>();
              (progressData || []).forEach(p => {
                progressMap.set(p.milestone_id, p);
              });
              setMilestoneProgress(progressMap);

              // Fetch overall student curriculum progress (use maybeSingle to avoid 406 on empty)
              let studentProgressData: StudentProgress | null = null;
              const { data, error: progressError } = await supabase
                .from('student_curriculum_progress')
                .select('*')
                .eq('student_id', targetId)
                .eq('subject_id', subjectData.id)
                .maybeSingle();

              // Only set if no error and data exists
              if (!progressError && data) {
                studentProgressData = data;
                setStudentProgress(data);
              }

              // Auto-expand current phase/stage
              if (studentProgressData?.current_phase_id) {
                setExpandedPhase(studentProgressData.current_phase_id);
              } else if (phasesData.length > 0) {
                setExpandedPhase(phasesData[0].id);
              }

              if (studentProgressData?.current_stage_id) {
                setExpandedStage(studentProgressData.current_stage_id);
              }
            }
          }
        }
      } catch (error) {
        console.error('Error fetching curriculum:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchCurriculum();
  }, [subjectSlug, studentId]);

  const getPhaseProgress = (phaseId: string) => {
    const phaseStages = stages.filter(s => s.phase_id === phaseId);
    const stageMilestones = milestones.filter(m =>
      phaseStages.some(s => s.id === m.stage_id)
    );

    if (stageMilestones.length === 0) return 0;

    const verifiedCount = stageMilestones.filter(m => {
      const progress = milestoneProgress.get(m.id);
      return progress?.status === 'verified' || progress?.status === 'mastered';
    }).length;

    return Math.round((verifiedCount / stageMilestones.length) * 100);
  };

  const getStageProgress = (stageId: string) => {
    const stageMilestones = milestones.filter(m => m.stage_id === stageId);
    if (stageMilestones.length === 0) return 0;

    const verifiedCount = stageMilestones.filter(m => {
      const progress = milestoneProgress.get(m.id);
      return progress?.status === 'verified' || progress?.status === 'mastered';
    }).length;

    return Math.round((verifiedCount / stageMilestones.length) * 100);
  };

  const getMilestoneStatus = (milestoneId: string) => {
    const progress = milestoneProgress.get(milestoneId);
    return progress?.status || 'not_started';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'verified':
      case 'mastered':
        return <CheckCircle className="w-5 h-5 text-emerald-600" />;
      case 'pending_verification':
        return <Circle className="w-5 h-5 text-amber-500 fill-amber-500" />;
      case 'in_progress':
        return <Circle className="w-5 h-5 text-blue-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-300" />;
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!subject) {
    return (
      <div className="text-center py-8 text-gray-500">
        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
        <p>Curriculum not found</p>
      </div>
    );
  }

  if (variant === 'overview') {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="text-2xl">{subject.icon}</span>
          <div>
            <h3 className="font-semibold text-gray-900">{subject.name}</h3>
            <p className="text-sm text-gray-500">{subject.name_arabic}</p>
          </div>
        </div>

        <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden mb-4">
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${studentProgress?.overall_progress_percentage || 0}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-600">
            {studentProgress?.overall_progress_percentage || 0}% complete
          </span>
          <span className="text-emerald-600 font-medium">
            {phases.find(p => p.id === studentProgress?.current_phase_id)?.name || phases[0]?.name || 'Not started'}
          </span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-3">
        {phases.map((phase) => {
          const progress = getPhaseProgress(phase.id);
          const isCurrent = phase.id === studentProgress?.current_phase_id;

          return (
            <div
              key={phase.id}
              className={`flex items-center gap-4 p-3 rounded-lg border ${
                isCurrent ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200'
              }`}
            >
              <div className="flex-1">
                <p className="font-medium text-gray-900">{phase.name}</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-xs text-gray-500">{progress}%</span>
                </div>
              </div>
              {isCurrent && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-1 rounded">
                  Current
                </span>
              )}
            </div>
          );
        })}
      </div>
    );
  }

  // Full variant
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <span className="text-3xl">{subject.icon}</span>
        <div className="flex-1">
          <h2 className="text-xl font-bold text-gray-900">{subject.name}</h2>
          <p className="text-gray-500">{subject.description}</p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-600">
            {studentProgress?.overall_progress_percentage || 0}%
          </p>
          <p className="text-sm text-gray-500">Overall Progress</p>
        </div>
      </div>

      {/* Phases */}
      <div className="space-y-4">
        {phases.map((phase, phaseIndex) => {
          const phaseProgress = getPhaseProgress(phase.id);
          const isExpanded = expandedPhase === phase.id;
          const isCurrent = phase.id === studentProgress?.current_phase_id;
          const isLocked = phaseIndex > 0 && getPhaseProgress(phases[phaseIndex - 1].id) < 80;
          const phaseStages = stages.filter(s => s.phase_id === phase.id);

          return (
            <div key={phase.id} className="border border-gray-200 rounded-xl overflow-hidden">
              {/* Phase Header */}
              <button
                onClick={() => setExpandedPhase(isExpanded ? null : phase.id)}
                disabled={isLocked}
                className={`w-full flex items-center gap-4 p-4 text-left transition-colors ${
                  isLocked ? 'opacity-50 cursor-not-allowed bg-gray-50' : 'hover:bg-gray-50'
                } ${isCurrent ? 'bg-emerald-50' : ''}`}
              >
                {isLocked ? (
                  <Lock className="w-5 h-5 text-gray-400" />
                ) : (
                  <ChevronRight
                    className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`}
                  />
                )}

                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{phase.name}</h3>
                    <span className="text-sm text-gray-500">{phase.name_arabic}</span>
                    {isCurrent && (
                      <span className="text-xs font-medium text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded">
                        Current Phase
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500 mt-1">{phase.description}</p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="w-24">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${phaseProgress}%` }}
                      />
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-600 w-12 text-right">
                    {phaseProgress}%
                  </span>
                </div>
              </button>

              {/* Stages */}
              {isExpanded && (
                <div className="border-t border-gray-200 bg-gray-50">
                  {phaseStages.map((stage) => {
                    const stageProgress = getStageProgress(stage.id);
                    const isStageExpanded = expandedStage === stage.id;
                    const stageMilestones = milestones.filter(m => m.stage_id === stage.id);
                    const isCurrentStage = stage.id === studentProgress?.current_stage_id;

                    return (
                      <div key={stage.id} className="border-b border-gray-200 last:border-0">
                        {/* Stage Header */}
                        <button
                          onClick={() => setExpandedStage(isStageExpanded ? null : stage.id)}
                          className={`w-full flex items-center gap-4 p-4 pl-12 text-left hover:bg-white transition-colors ${
                            isCurrentStage ? 'bg-emerald-50/50' : ''
                          }`}
                        >
                          <ChevronRight
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              isStageExpanded ? 'rotate-90' : ''
                            }`}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-800">{stage.name}</span>
                              {isCurrentStage && (
                                <span className="text-xs text-blue-600 bg-blue-100 px-1.5 py-0.5 rounded">
                                  In Progress
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{ width: `${stageProgress}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-500 w-8">{stageProgress}%</span>
                          </div>
                        </button>

                        {/* Milestones */}
                        {isStageExpanded && stageMilestones.length > 0 && (
                          <div className="px-4 pb-4 pl-20 space-y-2">
                            {stageMilestones.map((milestone) => {
                              const status = getMilestoneStatus(milestone.id);
                              const pillar = milestone.pillar ? pillarConfig[milestone.pillar] : null;

                              return (
                                <div
                                  key={milestone.id}
                                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
                                >
                                  {getStatusIcon(status)}
                                  <div className="flex-1">
                                    <p className="text-sm font-medium text-gray-800">
                                      {milestone.name}
                                    </p>
                                    {milestone.description && (
                                      <p className="text-xs text-gray-500 mt-0.5">
                                        {milestone.description}
                                      </p>
                                    )}
                                  </div>
                                  {pillar && (
                                    <span
                                      className={`text-xs font-medium px-2 py-1 rounded ${pillar.bg} ${pillar.color}`}
                                    >
                                      {pillar.label}
                                    </span>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Three Pillars Legend Component
export function ThreePillarsLegend() {
  return (
    <div className="flex items-center gap-4 text-sm">
      <span className="text-gray-500">The Three Pillars:</span>
      {Object.entries(pillarConfig).map(([key, config]) => (
        <div key={key} className="flex items-center gap-1.5">
          <span className={`w-3 h-3 rounded-full ${config.bg}`} />
          <span className={config.color}>{config.label}</span>
          <span className="text-gray-400 text-xs">({config.arabic})</span>
        </div>
      ))}
    </div>
  );
}
