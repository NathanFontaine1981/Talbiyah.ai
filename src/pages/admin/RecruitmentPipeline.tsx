import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserPlus,
  Search,
  LayoutGrid,
  List,
  Users,
  Calendar,
  CheckCircle,
  Clock,
  TrendingUp,
  Mail,
  ChevronUp,
  ChevronDown,
  Loader2,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import {
  format,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  differenceInDays,
  parseISO,
} from 'date-fns';
import KanbanBoard from '../../components/admin/recruitment/KanbanBoard';
import CandidateDetailDrawer from '../../components/admin/recruitment/CandidateDetailDrawer';
import AddCandidateModal from '../../components/admin/recruitment/AddCandidateModal';
import SendEmailModal from '../../components/admin/recruitment/SendEmailModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Candidate {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  nationality?: string;
  country?: string;
  city?: string;
  languages: string[];
  subjects: string[];
  expected_hourly_rate?: number;
  assigned_tier?: string;
  teacher_type?: string;
  years_experience?: number;
  education_level?: string;
  qualifications_summary?: string;
  bio?: string;
  pipeline_stage: string;
  pipeline_stage_updated_at: string;
  dbs_status?: string;
  dbs_reference?: string;
  references_status?: string;
  character_references?: any[];
  cv_url?: string;
  certificates?: any[];
  interview_id?: string;
  trial_lesson_id?: string;
  trial_lesson_notes?: string;
  trial_lesson_rating?: number;
  rejection_reason?: string;
  rejection_date?: string;
  approval_date?: string;
  admin_notes?: string;
  source?: string;
  prospect_id?: string;
  user_id?: string;
  teacher_profile_id?: string;
  assigned_admin?: string;
  created_by?: string;
  created_at: string;
  updated_at?: string;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const STAGE_LABELS: Record<string, string> = {
  initial_contact: 'Initial Contact',
  application: 'Application',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  document_verification: 'Document Verification',
  trial_lesson: 'Trial Lesson',
  approved: 'Approved',
  onboarding: 'Onboarding',
  active: 'Active',
  rejected: 'Rejected',
};

const STAGE_BADGE_COLORS: Record<string, string> = {
  initial_contact:
    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  application:
    'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  interview_scheduled:
    'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/40 dark:text-cyan-300',
  interview_completed:
    'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  document_verification:
    'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  trial_lesson:
    'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  approved:
    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  onboarding:
    'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300',
  active:
    'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

type SortField =
  | 'full_name'
  | 'email'
  | 'subjects'
  | 'pipeline_stage'
  | 'assigned_tier'
  | 'days_in_stage'
  | 'created_at';

// ─── Component ────────────────────────────────────────────────────────────────

export default function RecruitmentPipeline() {
  const navigate = useNavigate();
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'kanban' | 'table'>('kanban');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(
    null
  );
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [emailCandidate, setEmailCandidate] = useState<Candidate | null>(null);

  // Stats
  const [interviewsThisWeek, setInterviewsThisWeek] = useState(0);

  // Table sorting
  const [sortField, setSortField] = useState<SortField>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  // ─── Data Fetching ────────────────────────────────────────────────────────

  const fetchCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('recruitment_pipeline')
        .select('*')
        .order('pipeline_stage_updated_at', { ascending: false });

      if (error) throw error;
      setCandidates(data || []);
    } catch (err: any) {
      console.error('Error fetching candidates:', err);
      toast.error('Failed to load candidates');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInterviewsThisWeek = useCallback(async () => {
    try {
      const now = new Date();
      const weekStart = startOfWeek(now, { weekStartsOn: 1 });
      const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

      const { count, error } = await supabase
        .from('recruitment_interviews')
        .select('*', { count: 'exact', head: true })
        .gte('scheduled_date', format(weekStart, 'yyyy-MM-dd'))
        .lte('scheduled_date', format(weekEnd, 'yyyy-MM-dd'));

      if (error) throw error;
      setInterviewsThisWeek(count || 0);
    } catch (err: any) {
      console.error('Error fetching interviews count:', err);
    }
  }, []);

  useEffect(() => {
    fetchCandidates();
    fetchInterviewsThisWeek();
  }, [fetchCandidates, fetchInterviewsThisWeek]);

  // ─── Computed Stats ───────────────────────────────────────────────────────

  const stats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const inPipeline = candidates.filter(
      (c) => c.pipeline_stage !== 'active' && c.pipeline_stage !== 'rejected'
    ).length;

    const approvedThisMonth = candidates.filter((c) => {
      if (
        c.pipeline_stage !== 'approved' &&
        c.pipeline_stage !== 'onboarding' &&
        c.pipeline_stage !== 'active'
      )
        return false;
      if (!c.approval_date) return false;
      const approvalDate = parseISO(c.approval_date);
      return approvalDate >= monthStart && approvalDate <= monthEnd;
    }).length;

    const approvedWithDates = candidates.filter(
      (c) =>
        c.approval_date &&
        (c.pipeline_stage === 'approved' ||
          c.pipeline_stage === 'onboarding' ||
          c.pipeline_stage === 'active')
    );

    let avgDaysToHire = 0;
    if (approvedWithDates.length > 0) {
      const totalDays = approvedWithDates.reduce((sum, c) => {
        const created = parseISO(c.created_at);
        const approved = parseISO(c.approval_date!);
        return sum + differenceInDays(approved, created);
      }, 0);
      avgDaysToHire = Math.round(totalDays / approvedWithDates.length);
    }

    return { inPipeline, approvedThisMonth, avgDaysToHire };
  }, [candidates]);

  // ─── Filtered Candidates ──────────────────────────────────────────────────

  const filteredCandidates = useMemo(() => {
    if (!searchQuery.trim()) return candidates;
    const q = searchQuery.toLowerCase();
    return candidates.filter(
      (c) =>
        c.full_name.toLowerCase().includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [candidates, searchQuery]);

  // ─── Sorted Candidates (for table view) ───────────────────────────────────

  const sortedCandidates = useMemo(() => {
    const sorted = [...filteredCandidates];
    sorted.sort((a, b) => {
      let comparison = 0;

      switch (sortField) {
        case 'full_name':
          comparison = a.full_name.localeCompare(b.full_name);
          break;
        case 'email':
          comparison = a.email.localeCompare(b.email);
          break;
        case 'subjects':
          comparison = (a.subjects?.[0] || '').localeCompare(
            b.subjects?.[0] || ''
          );
          break;
        case 'pipeline_stage':
          comparison = a.pipeline_stage.localeCompare(b.pipeline_stage);
          break;
        case 'assigned_tier':
          comparison = (a.assigned_tier || '').localeCompare(
            b.assigned_tier || ''
          );
          break;
        case 'days_in_stage': {
          const daysA = differenceInDays(
            new Date(),
            parseISO(a.pipeline_stage_updated_at)
          );
          const daysB = differenceInDays(
            new Date(),
            parseISO(b.pipeline_stage_updated_at)
          );
          comparison = daysA - daysB;
          break;
        }
        case 'created_at':
          comparison =
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime();
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });
    return sorted;
  }, [filteredCandidates, sortField, sortDirection]);

  // ─── Handlers ─────────────────────────────────────────────────────────────

  async function handleStageChange(candidateId: string, newStage: string) {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const updates: Record<string, any> = {
        pipeline_stage: newStage,
        pipeline_stage_updated_at: new Date().toISOString(),
      };
      if (newStage === 'approved')
        updates.approval_date = new Date().toISOString();
      if (newStage === 'rejected')
        updates.rejection_date = new Date().toISOString();

      const { error: updateError } = await supabase
        .from('recruitment_pipeline')
        .update(updates)
        .eq('id', candidateId);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('recruitment_pipeline_history')
        .insert({
          candidate_id: candidateId,
          from_stage: candidate.pipeline_stage,
          to_stage: newStage,
          changed_by: user?.id,
          notes: `Stage changed from ${candidate.pipeline_stage} to ${newStage}`,
        });

      if (historyError)
        console.error('Failed to insert history record:', historyError);

      toast.success(
        `Moved ${candidate.full_name} to ${newStage.replace(/_/g, ' ')}`
      );
      fetchCandidates();
    } catch (err: any) {
      console.error('Error updating stage:', err);
      toast.error('Failed to update candidate stage');
    }
  }

  function handleCandidateClick(candidate: Candidate) {
    setSelectedCandidate(candidate);
    setIsDetailOpen(true);
  }

  function handleQuickAction(candidateId: string, action: string) {
    const candidate = candidates.find((c) => c.id === candidateId);
    if (!candidate) return;

    if (action === 'send_email') {
      setEmailCandidate(candidate);
      setIsEmailModalOpen(true);
    } else if (action === 'schedule_interview') {
      navigate(`/admin/interviews?candidate=${candidate.id}&name=${encodeURIComponent(candidate.full_name)}`);
    } else if (action === 'add_note') {
      setSelectedCandidate(candidate);
      setIsDetailOpen(true);
    }
  }

  function handleSendEmailFromDrawer(candidate: Candidate) {
    setEmailCandidate(candidate);
    setIsEmailModalOpen(true);
  }

  function handleScheduleInterviewFromDrawer(candidate: Candidate) {
    // Navigate to interview management page with candidate context
    navigate(`/admin/interviews?candidate=${candidate.id}&name=${encodeURIComponent(candidate.full_name)}`);
  }

  function handleSort(field: SortField) {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  }

  function getDaysInStage(candidate: Candidate): number {
    return differenceInDays(
      new Date(),
      parseISO(candidate.pipeline_stage_updated_at)
    );
  }

  // ─── Render Helpers ───────────────────────────────────────────────────────

  function SortHeader({
    field,
    label,
  }: {
    field: SortField;
    label: string;
  }) {
    const isActive = sortField === field;
    return (
      <th
        className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 select-none"
        onClick={() => handleSort(field)}
      >
        <div className="flex items-center gap-1">
          {label}
          {isActive ? (
            sortDirection === 'asc' ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )
          ) : (
            <ChevronDown className="w-3.5 h-3.5 opacity-30" />
          )}
        </div>
      </th>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header Row */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Recruitment Pipeline
        </h1>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-2 pl-10 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 focus:border-transparent w-full sm:w-64"
            />
          </div>

          {/* View Toggle */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            <button
              onClick={() => setViewMode('kanban')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <LayoutGrid className="w-4 h-4" />
              Board
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-700 shadow-sm text-gray-900 dark:text-white'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              <List className="w-4 h-4" />
              Table
            </button>
          </div>

          {/* Add Candidate Button */}
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            Add Candidate
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.inPipeline}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Total in Pipeline
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
              <Calendar className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {interviewsThisWeek}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Interviews This Week
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.approvedThisMonth}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Approved This Month
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
              <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.avgDaysToHire > 0 ? `${stats.avgDaysToHire}d` : '--'}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Avg Days to Hire
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 dark:text-emerald-400" />
        </div>
      ) : viewMode === 'kanban' ? (
        /* Kanban Board View */
        <KanbanBoard
          candidates={filteredCandidates}
          onStageChange={handleStageChange}
          onCandidateClick={handleCandidateClick}
          onQuickAction={handleQuickAction}
        />
      ) : (
        /* Table View */
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <SortHeader field="full_name" label="Name" />
                  <SortHeader field="email" label="Email" />
                  <SortHeader field="subjects" label="Subjects" />
                  <SortHeader field="pipeline_stage" label="Stage" />
                  <SortHeader field="assigned_tier" label="Tier" />
                  <SortHeader field="days_in_stage" label="Days in Stage" />
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {sortedCandidates.length === 0 ? (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-4 py-12 text-center text-gray-500 dark:text-gray-400"
                    >
                      {searchQuery
                        ? 'No candidates match your search.'
                        : 'No candidates in the pipeline yet.'}
                    </td>
                  </tr>
                ) : (
                  sortedCandidates.map((candidate) => (
                    <tr
                      key={candidate.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors"
                      onClick={() => handleCandidateClick(candidate)}
                    >
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {candidate.full_name}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {candidate.email}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {candidate.subjects?.slice(0, 2).map((subject) => (
                            <span
                              key={subject}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
                            >
                              {subject}
                            </span>
                          ))}
                          {candidate.subjects?.length > 2 && (
                            <span className="text-xs text-gray-400 dark:text-gray-500">
                              +{candidate.subjects.length - 2}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            STAGE_BADGE_COLORS[candidate.pipeline_stage] ||
                            'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {STAGE_LABELS[candidate.pipeline_stage] ||
                            candidate.pipeline_stage.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                          {candidate.assigned_tier
                            ? candidate.assigned_tier.charAt(0).toUpperCase() +
                              candidate.assigned_tier.slice(1)
                            : '--'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">
                            {getDaysInStage(candidate)}d
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div
                          className="flex items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() =>
                              handleQuickAction(candidate.id, 'send_email')
                            }
                            className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:text-emerald-400 dark:hover:bg-emerald-900/20 transition-colors"
                            title="Send email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() =>
                              handleQuickAction(
                                candidate.id,
                                'schedule_interview'
                              )
                            }
                            className="p-1.5 rounded-md text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:text-indigo-400 dark:hover:bg-indigo-900/20 transition-colors"
                            title="Schedule interview"
                          >
                            <Calendar className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Table footer with count */}
          {sortedCandidates.length > 0 && (
            <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Showing {sortedCandidates.length} of {candidates.length}{' '}
                candidates
                {searchQuery && ' (filtered)'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Candidate Detail Drawer */}
      <CandidateDetailDrawer
        candidate={selectedCandidate}
        isOpen={isDetailOpen}
        onClose={() => {
          setIsDetailOpen(false);
          setSelectedCandidate(null);
        }}
        onUpdate={fetchCandidates}
        onSendEmail={handleSendEmailFromDrawer}
        onScheduleInterview={handleScheduleInterviewFromDrawer}
      />

      {/* Add Candidate Modal */}
      <AddCandidateModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={() => {
          setIsAddModalOpen(false);
          fetchCandidates();
        }}
      />

      {/* Send Email Modal */}
      <SendEmailModal
        isOpen={isEmailModalOpen}
        onClose={() => {
          setIsEmailModalOpen(false);
          setEmailCandidate(null);
        }}
        candidate={emailCandidate}
        onSent={() => {
          setIsEmailModalOpen(false);
          setEmailCandidate(null);
        }}
      />
    </div>
  );
}
