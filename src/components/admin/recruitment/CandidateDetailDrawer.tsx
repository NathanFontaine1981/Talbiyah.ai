import { useState, useEffect, useCallback, useRef } from 'react';
import {
  X,
  Mail,
  CalendarPlus,
  CheckCircle,
  XCircle,
  FileText,
  ExternalLink,
  Clock,
  ArrowRight,
  Star,
  ChevronDown,
  Loader2,
  User,
  BookOpen,
  Globe,
  Phone,
  MapPin,
  GraduationCap,
  Briefcase,
  DollarSign,
  Languages,
  Shield,
  Link,
  Video,
  AlertTriangle,
  UserPlus,
} from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface Candidate {
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
  trial_lesson_notes?: string;
  trial_lesson_rating?: number;
  rejection_reason?: string;
  rejection_date?: string;
  approval_date?: string;
  admin_notes?: string;
  source?: string;
  user_id?: string;
  teacher_profile_id?: string;
  created_at: string;
  updated_at?: string;
}

interface CandidateDetailDrawerProps {
  candidate: Candidate | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdate: () => void;
  onSendEmail: (candidate: Candidate) => void;
  onScheduleInterview: (candidate: Candidate) => void;
}

interface InterviewData {
  id: string;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  timezone: string;
  status: string;
  recording_url?: string;
  interview_notes?: string;
  teaching_demo_rating?: number;
  communication_rating?: number;
  knowledge_rating?: number;
  personality_rating?: number;
  overall_rating?: number;
  ai_summary?: string;
  completed_at?: string;
}

interface EmailRecord {
  id: string;
  template_name?: string;
  sent_at: string;
  sent_by?: string;
  admin_email_log?: {
    subject: string;
    template_type?: string;
    status?: string;
  };
}

interface HistoryRecord {
  id: string;
  from_stage?: string;
  to_stage: string;
  changed_by?: string;
  notes?: string;
  created_at: string;
}

type TabId = 'overview' | 'documents' | 'interview' | 'emails' | 'history';

const STAGE_LABELS: Record<string, string> = {
  initial_contact: 'Initial Contact',
  application_review: 'Application Review',
  interview_scheduled: 'Interview Scheduled',
  interview_completed: 'Interview Completed',
  document_verification: 'Document Verification',
  trial_lesson: 'Trial Lesson',
  approved: 'Approved',
  active: 'Active',
  rejected: 'Rejected',
  on_hold: 'On Hold',
};

const STAGE_COLORS: Record<string, string> = {
  initial_contact: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  application_review: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  interview_scheduled: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300',
  interview_completed: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  document_verification: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  trial_lesson: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300',
  approved: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  active: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  rejected: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  on_hold: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300',
};

const DBS_STATUS_COLORS: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  submitted: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  in_progress: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-300',
  cleared: 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300',
  flagged: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
  not_required: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
};

const DBS_STATUS_OPTIONS = [
  'not_started',
  'submitted',
  'in_progress',
  'cleared',
  'flagged',
  'not_required',
];

const REFERENCES_STATUS_OPTIONS = [
  'not_started',
  'requested',
  'received',
  'verified',
  'flagged',
];

export default function CandidateDetailDrawer({
  candidate,
  isOpen,
  onClose,
  onUpdate,
  onSendEmail,
  onScheduleInterview,
}: CandidateDetailDrawerProps) {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [adminNotes, setAdminNotes] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [saving, setSaving] = useState(false);
  const [creatingAccount, setCreatingAccount] = useState(false);

  // Documents tab state
  const [dbsStatus, setDbsStatus] = useState('');
  const [dbsReference, setDbsReference] = useState('');
  const [referencesStatus, setReferencesStatus] = useState('');

  // Interview tab state
  const [interviewData, setInterviewData] = useState<InterviewData | null>(null);
  const [interviewLoading, setInterviewLoading] = useState(false);

  // Emails tab state
  const [emails, setEmails] = useState<EmailRecord[]>([]);
  const [emailsLoading, setEmailsLoading] = useState(false);

  // History tab state
  const [history, setHistory] = useState<HistoryRecord[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Debounce ref for admin notes auto-save
  const notesDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const adminNotesRef = useRef(adminNotes);

  // Reset state when candidate changes
  useEffect(() => {
    if (candidate) {
      setAdminNotes(candidate.admin_notes || '');
      adminNotesRef.current = candidate.admin_notes || '';
      setDbsStatus(candidate.dbs_status || 'not_started');
      setDbsReference(candidate.dbs_reference || '');
      setReferencesStatus(candidate.references_status || 'not_started');
      setShowRejectForm(false);
      setRejectionReason('');
      setActiveTab('overview');
      setInterviewData(null);
      setEmails([]);
      setHistory([]);
    }
    return () => {
      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
    };
  }, [candidate?.id]);

  // Fetch tab-specific data when tab changes
  useEffect(() => {
    if (!candidate || !isOpen) return;

    if (activeTab === 'interview' && candidate.interview_id) {
      fetchInterview(candidate.interview_id);
    } else if (activeTab === 'emails') {
      fetchEmails(candidate.id);
    } else if (activeTab === 'history') {
      fetchHistory(candidate.id);
    }
  }, [activeTab, candidate?.id, isOpen]);

  const fetchInterview = useCallback(async (interviewId: string) => {
    setInterviewLoading(true);
    try {
      const { data, error } = await supabase
        .from('recruitment_interviews')
        .select('*')
        .eq('id', interviewId)
        .single();

      if (error) throw error;
      setInterviewData(data);
    } catch (err) {
      console.error('Error fetching interview:', err);
      toast.error('Failed to load interview details');
    } finally {
      setInterviewLoading(false);
    }
  }, []);

  const fetchEmails = useCallback(async (candidateId: string) => {
    setEmailsLoading(true);
    try {
      const { data, error } = await supabase
        .from('recruitment_email_log')
        .select(`
          id,
          template_name,
          sent_at,
          sent_by,
          admin_email_log:email_log_id (
            subject,
            template_type,
            status
          )
        `)
        .eq('candidate_id', candidateId)
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setEmails(data || []);
    } catch (err) {
      console.error('Error fetching emails:', err);
      toast.error('Failed to load email history');
    } finally {
      setEmailsLoading(false);
    }
  }, []);

  const fetchHistory = useCallback(async (candidateId: string) => {
    setHistoryLoading(true);
    try {
      const { data, error } = await supabase
        .from('recruitment_pipeline_history')
        .select('*')
        .eq('candidate_id', candidateId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setHistory(data || []);
    } catch (err) {
      console.error('Error fetching history:', err);
      toast.error('Failed to load pipeline history');
    } finally {
      setHistoryLoading(false);
    }
  }, []);

  async function saveAdminNotes() {
    if (!candidate) return;
    const notes = adminNotesRef.current;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('recruitment_pipeline')
        .update({ admin_notes: notes, updated_at: new Date().toISOString() })
        .eq('id', candidate.id);

      if (error) throw error;
      toast.success('Admin notes saved');
      onUpdate();
    } catch (err) {
      console.error('Error saving admin notes:', err);
      toast.error('Failed to save admin notes');
    } finally {
      setSaving(false);
    }
  }

  async function updateDbsStatus(newStatus: string) {
    if (!candidate) return;
    setDbsStatus(newStatus);
    try {
      const { error } = await supabase
        .from('recruitment_pipeline')
        .update({ dbs_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', candidate.id);

      if (error) throw error;
      toast.success('DBS status updated');
      onUpdate();
    } catch (err) {
      console.error('Error updating DBS status:', err);
      toast.error('Failed to update DBS status');
    }
  }

  async function saveDbsReference() {
    if (!candidate) return;
    try {
      const { error } = await supabase
        .from('recruitment_pipeline')
        .update({ dbs_reference: dbsReference, updated_at: new Date().toISOString() })
        .eq('id', candidate.id);

      if (error) throw error;
      toast.success('DBS reference saved');
      onUpdate();
    } catch (err) {
      console.error('Error saving DBS reference:', err);
      toast.error('Failed to save DBS reference');
    }
  }

  async function updateReferencesStatus(newStatus: string) {
    if (!candidate) return;
    setReferencesStatus(newStatus);
    try {
      const { error } = await supabase
        .from('recruitment_pipeline')
        .update({ references_status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', candidate.id);

      if (error) throw error;
      toast.success('References status updated');
      onUpdate();
    } catch (err) {
      console.error('Error updating references status:', err);
      toast.error('Failed to update references status');
    }
  }

  async function handleApprove() {
    if (!candidate) return;
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('recruitment_pipeline')
        .update({
          pipeline_stage: 'approved',
          pipeline_stage_updated_at: now,
          approval_date: now,
          updated_at: now,
        })
        .eq('id', candidate.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('recruitment_pipeline_history')
        .insert({
          candidate_id: candidate.id,
          from_stage: candidate.pipeline_stage,
          to_stage: 'approved',
          changed_by: user?.id || null,
          notes: 'Candidate approved',
        });

      if (historyError) throw historyError;

      toast.success(`${candidate.full_name} has been approved`);
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error approving candidate:', err);
      toast.error('Failed to approve candidate');
    } finally {
      setSaving(false);
    }
  }

  async function handleReject() {
    if (!candidate || !rejectionReason.trim()) {
      toast.error('Please provide a rejection reason');
      return;
    }
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { data: { user } } = await supabase.auth.getUser();

      const { error: updateError } = await supabase
        .from('recruitment_pipeline')
        .update({
          pipeline_stage: 'rejected',
          pipeline_stage_updated_at: now,
          rejection_reason: rejectionReason.trim(),
          rejection_date: now,
          updated_at: now,
        })
        .eq('id', candidate.id);

      if (updateError) throw updateError;

      const { error: historyError } = await supabase
        .from('recruitment_pipeline_history')
        .insert({
          candidate_id: candidate.id,
          from_stage: candidate.pipeline_stage,
          to_stage: 'rejected',
          changed_by: user?.id || null,
          notes: `Rejected: ${rejectionReason.trim()}`,
        });

      if (historyError) throw historyError;

      toast.success(`${candidate.full_name} has been rejected`);
      setShowRejectForm(false);
      setRejectionReason('');
      onUpdate();
      onClose();
    } catch (err) {
      console.error('Error rejecting candidate:', err);
      toast.error('Failed to reject candidate');
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateAccount() {
    if (!candidate) return;
    setCreatingAccount(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in to create accounts');
        return;
      }

      const res = await supabase.functions.invoke('create-teacher-account', {
        body: { candidate_id: candidate.id },
      });

      if (res.error) {
        throw new Error(res.error.message || 'Edge function error');
      }

      const result = res.data;
      if (!result.success) {
        throw new Error(result.error || 'Failed to create account');
      }

      toast.success(
        `Account created for ${candidate.full_name}${result.email_sent ? ' — welcome email sent' : ''}`
      );
      onUpdate();
    } catch (err: any) {
      console.error('Error creating teacher account:', err);
      toast.error(err.message || 'Failed to create teacher account');
    } finally {
      setCreatingAccount(false);
    }
  }

  async function toggleCertificateVerified(index: number) {
    if (!candidate || !candidate.certificates) return;
    const updatedCerts = [...candidate.certificates];
    updatedCerts[index] = {
      ...updatedCerts[index],
      verified: !updatedCerts[index].verified,
    };

    try {
      const { error } = await supabase
        .from('recruitment_pipeline')
        .update({ certificates: updatedCerts, updated_at: new Date().toISOString() })
        .eq('id', candidate.id);

      if (error) throw error;
      toast.success('Certificate verification updated');
      onUpdate();
    } catch (err) {
      console.error('Error updating certificate:', err);
      toast.error('Failed to update certificate');
    }
  }

  if (!candidate) return null;

  const canApprove = ['interview_completed', 'document_verification', 'trial_lesson'].includes(
    candidate.pipeline_stage
  );
  const canReject = !['active', 'rejected'].includes(candidate.pipeline_stage);

  const tabs: { id: TabId; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'documents', label: 'Documents' },
    { id: 'interview', label: 'Interview' },
    { id: 'emails', label: 'Emails' },
    { id: 'history', label: 'History' },
  ];

  function renderRatingStars(rating: number | undefined | null, max: number = 5) {
    if (rating == null) return <span className="text-xs text-gray-400 dark:text-gray-500">Not rated</span>;
    return (
      <div className="flex items-center gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <Star
            key={i}
            className={`w-4 h-4 ${
              i < rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300 dark:text-gray-600'
            }`}
          />
        ))}
        <span className="ml-1.5 text-xs text-gray-500 dark:text-gray-400">
          {rating}/{max}
        </span>
      </div>
    );
  }

  function formatStageName(stage: string): string {
    return (
      STAGE_LABELS[stage] ||
      stage
        .split('_')
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ')
    );
  }

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Drawer panel */}
      <div
        className={`fixed inset-y-0 right-0 w-full max-w-2xl bg-white dark:bg-gray-900 shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white truncate">
                  {candidate.full_name}
                </h2>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                    STAGE_COLORS[candidate.pipeline_stage] ||
                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                  }`}
                >
                  {formatStageName(candidate.pipeline_stage)}
                </span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                {candidate.email}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors flex-shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick action buttons */}
          <div className="flex items-center gap-2 mt-3 flex-wrap">
            <button
              onClick={() => onSendEmail(candidate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              Send Email
            </button>
            <button
              onClick={() => onScheduleInterview(candidate)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300 dark:hover:bg-indigo-900/50 transition-colors"
            >
              <CalendarPlus className="w-3.5 h-3.5" />
              Schedule Interview
            </button>
            {canApprove && (
              <button
                onClick={handleApprove}
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300 dark:hover:bg-emerald-900/50 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <CheckCircle className="w-3.5 h-3.5" />
                )}
                Approve
              </button>
            )}
            {candidate.pipeline_stage === 'approved' && !candidate.user_id && (
              <button
                onClick={handleCreateAccount}
                disabled={creatingAccount}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300 dark:hover:bg-cyan-900/50 transition-colors disabled:opacity-50"
              >
                {creatingAccount ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <UserPlus className="w-3.5 h-3.5" />
                )}
                {creatingAccount ? 'Creating Account...' : 'Create Account & Send Invite'}
              </button>
            )}
            {candidate.user_id && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                <CheckCircle className="w-3.5 h-3.5" />
                Account Created
              </span>
            )}
            {canReject && (
              <button
                onClick={() => setShowRejectForm((prev) => !prev)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-red-50 text-red-700 hover:bg-red-100 dark:bg-red-900/30 dark:text-red-300 dark:hover:bg-red-900/50 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            )}
          </div>

          {/* Inline reject form */}
          {showRejectForm && (
            <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <label className="block text-sm font-medium text-red-700 dark:text-red-300 mb-1.5">
                Rejection Reason
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Please provide a reason for rejection..."
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-red-500 focus:border-transparent resize-none"
              />
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={handleReject}
                  disabled={saving || !rejectionReason.trim()}
                  className="px-3 py-1.5 text-sm font-medium bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 inline-flex items-center gap-1.5"
                >
                  {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Confirm Rejection
                </button>
                <button
                  onClick={() => {
                    setShowRejectForm(false);
                    setRejectionReason('');
                  }}
                  className="px-3 py-1.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Tab bar */}
        <div className="px-6 border-b border-gray-200 dark:border-gray-700 flex gap-1 flex-shrink-0 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                  : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* OVERVIEW TAB */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Personal Info */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                  Personal Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <InfoRow icon={<User className="w-4 h-4" />} label="Full Name" value={candidate.full_name} />
                  <InfoRow icon={<Mail className="w-4 h-4" />} label="Email" value={candidate.email} />
                  <InfoRow icon={<Phone className="w-4 h-4" />} label="Phone" value={candidate.phone} />
                  <InfoRow icon={<Globe className="w-4 h-4" />} label="Nationality" value={candidate.nationality} />
                  <InfoRow
                    icon={<MapPin className="w-4 h-4" />}
                    label="Location"
                    value={
                      [candidate.city, candidate.country].filter(Boolean).join(', ') || undefined
                    }
                  />
                  <InfoRow
                    icon={<Languages className="w-4 h-4" />}
                    label="Languages"
                    value={
                      candidate.languages && candidate.languages.length > 0
                        ? candidate.languages.join(', ')
                        : undefined
                    }
                  />
                </div>
              </section>

              {/* Teaching Info */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                  Teaching Information
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <div>
                    <span className="text-xs text-gray-500 dark:text-gray-400">Subjects</span>
                    {candidate.subjects && candidate.subjects.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {candidate.subjects.map((subject) => (
                          <span
                            key={subject}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                          >
                            {subject}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400 italic mt-1">Not specified</p>
                    )}
                  </div>
                  <InfoRow
                    icon={<DollarSign className="w-4 h-4" />}
                    label="Expected Hourly Rate"
                    value={
                      candidate.expected_hourly_rate != null
                        ? `\u00A3${candidate.expected_hourly_rate}/hr`
                        : undefined
                    }
                  />
                  <InfoRow icon={<Shield className="w-4 h-4" />} label="Assigned Tier" value={candidate.assigned_tier} />
                  <InfoRow icon={<Briefcase className="w-4 h-4" />} label="Teacher Type" value={candidate.teacher_type} />
                  <InfoRow
                    icon={<Clock className="w-4 h-4" />}
                    label="Years of Experience"
                    value={
                      candidate.years_experience != null
                        ? `${candidate.years_experience} years`
                        : undefined
                    }
                  />
                  <InfoRow
                    icon={<GraduationCap className="w-4 h-4" />}
                    label="Education Level"
                    value={candidate.education_level}
                  />
                </div>
              </section>

              {/* Bio / Qualifications */}
              {(candidate.bio || candidate.qualifications_summary) && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                    Bio & Qualifications
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                    {candidate.bio && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Bio</span>
                        <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                          {candidate.bio}
                        </p>
                      </div>
                    )}
                    {candidate.qualifications_summary && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Qualifications Summary
                        </span>
                        <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                          {candidate.qualifications_summary}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}

              {/* Source & Dates */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                  Source & Timeline
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                  <InfoRow label="Source" value={candidate.source} />
                  <InfoRow
                    label="Applied"
                    value={
                      candidate.created_at
                        ? `${format(new Date(candidate.created_at), 'dd MMM yyyy, HH:mm')} (${formatDistanceToNow(new Date(candidate.created_at), { addSuffix: true })})`
                        : undefined
                    }
                  />
                  <InfoRow
                    label="Stage Updated"
                    value={
                      candidate.pipeline_stage_updated_at
                        ? `${format(new Date(candidate.pipeline_stage_updated_at), 'dd MMM yyyy, HH:mm')} (${formatDistanceToNow(new Date(candidate.pipeline_stage_updated_at), { addSuffix: true })})`
                        : undefined
                    }
                  />
                  {candidate.approval_date && (
                    <InfoRow
                      label="Approved"
                      value={format(new Date(candidate.approval_date), 'dd MMM yyyy, HH:mm')}
                    />
                  )}
                  {candidate.rejection_date && (
                    <>
                      <InfoRow
                        label="Rejected"
                        value={format(new Date(candidate.rejection_date), 'dd MMM yyyy, HH:mm')}
                      />
                      <InfoRow label="Rejection Reason" value={candidate.rejection_reason} />
                    </>
                  )}
                </div>
              </section>

              {/* Admin Notes */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                  Admin Notes
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <textarea
                    value={adminNotes}
                    onChange={(e) => {
                      setAdminNotes(e.target.value);
                      adminNotesRef.current = e.target.value;
                      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
                      notesDebounceRef.current = setTimeout(() => saveAdminNotes(), 2000);
                    }}
                    onBlur={() => {
                      if (notesDebounceRef.current) clearTimeout(notesDebounceRef.current);
                      saveAdminNotes();
                    }}
                    placeholder="Add private admin notes about this candidate..."
                    rows={4}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-y"
                  />
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                    {saving ? 'Saving...' : 'Auto-saves after 2s of idle or when you click away'}
                  </p>
                </div>
              </section>
            </div>
          )}

          {/* DOCUMENTS TAB */}
          {activeTab === 'documents' && (
            <div className="space-y-6">
              {/* DBS Check */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                  DBS Check
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">DBS Status</span>
                    <div className="relative">
                      <select
                        value={dbsStatus}
                        onChange={(e) => updateDbsStatus(e.target.value)}
                        className={`appearance-none pl-3 pr-8 py-1 text-xs font-medium rounded-full cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                          DBS_STATUS_COLORS[dbsStatus] || DBS_STATUS_COLORS['not_started']
                        }`}
                      >
                        {DBS_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 dark:text-gray-400 block mb-1">
                      DBS Reference
                    </label>
                    <input
                      type="text"
                      value={dbsReference}
                      onChange={(e) => setDbsReference(e.target.value)}
                      onBlur={saveDbsReference}
                      placeholder="Enter DBS reference number..."
                      className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </section>

              {/* References */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                  References
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      References Status
                    </span>
                    <div className="relative">
                      <select
                        value={referencesStatus}
                        onChange={(e) => updateReferencesStatus(e.target.value)}
                        className={`appearance-none pl-3 pr-8 py-1 text-xs font-medium rounded-full cursor-pointer focus:ring-2 focus:ring-emerald-500 focus:outline-none ${
                          DBS_STATUS_COLORS[referencesStatus] || DBS_STATUS_COLORS['not_started']
                        }`}
                      >
                        {REFERENCES_STATUS_OPTIONS.map((opt) => (
                          <option key={opt} value={opt}>
                            {opt.split('_').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="w-3 h-3 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none opacity-60" />
                    </div>
                  </div>

                  {/* Character References List */}
                  {candidate.character_references && candidate.character_references.length > 0 ? (
                    <div className="space-y-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Character References
                      </span>
                      {candidate.character_references.map((ref: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg px-3 py-2"
                        >
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {ref.name || 'Unnamed'}
                            </p>
                            {ref.relationship && (
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {ref.relationship}
                              </p>
                            )}
                          </div>
                          <span
                            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              ref.status === 'verified'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : ref.status === 'received'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : ref.status === 'flagged'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : 'bg-gray-100 text-gray-600 dark:bg-gray-600 dark:text-gray-300'
                            }`}
                          >
                            {ref.status
                              ? ref.status.charAt(0).toUpperCase() + ref.status.slice(1)
                              : 'Pending'}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      No character references provided
                    </p>
                  )}
                </div>
              </section>

              {/* CV */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                  CV / Resume
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  {candidate.cv_url ? (
                    <a
                      href={candidate.cv_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      View CV
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      No CV uploaded
                    </p>
                  )}
                </div>
              </section>

              {/* Certificates */}
              <section>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                  Certificates
                </h3>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  {candidate.certificates && candidate.certificates.length > 0 ? (
                    <div className="space-y-2">
                      {candidate.certificates.map((cert: any, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-lg px-3 py-2"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                                {cert.name || 'Untitled Certificate'}
                              </p>
                              {cert.url && (
                                <a
                                  href={cert.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-blue-600 dark:text-blue-400 hover:underline inline-flex items-center gap-1"
                                >
                                  View
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                          <label className="flex items-center gap-2 cursor-pointer flex-shrink-0">
                            <span className="text-xs text-gray-500 dark:text-gray-400">
                              Verified
                            </span>
                            <input
                              type="checkbox"
                              checked={cert.verified || false}
                              onChange={() => toggleCertificateVerified(idx)}
                              className="w-4 h-4 text-emerald-600 bg-gray-100 border-gray-300 rounded focus:ring-emerald-500 dark:bg-gray-600 dark:border-gray-500 cursor-pointer"
                            />
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                      No certificates uploaded
                    </p>
                  )}
                </div>
              </section>
            </div>
          )}

          {/* INTERVIEW TAB */}
          {activeTab === 'interview' && (
            <div className="space-y-6">
              {candidate.interview_id ? (
                interviewLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                    <span className="ml-2 text-gray-500 dark:text-gray-400">
                      Loading interview details...
                    </span>
                  </div>
                ) : interviewData ? (
                  <>
                    {/* Interview Details */}
                    <section>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                        Interview Details
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                        <InfoRow
                          icon={<CalendarPlus className="w-4 h-4" />}
                          label="Date"
                          value={
                            interviewData.scheduled_date
                              ? format(new Date(interviewData.scheduled_date), 'dd MMM yyyy')
                              : undefined
                          }
                        />
                        <InfoRow
                          icon={<Clock className="w-4 h-4" />}
                          label="Time"
                          value={interviewData.scheduled_time || undefined}
                        />
                        <InfoRow
                          label="Duration"
                          value={`${interviewData.duration_minutes} minutes`}
                        />
                        <InfoRow label="Timezone" value={interviewData.timezone} />
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Status
                          </span>
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                              interviewData.status === 'completed'
                                ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                : interviewData.status === 'cancelled'
                                ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                : interviewData.status === 'scheduled'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300'
                                : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                            }`}
                          >
                            {interviewData.status.charAt(0).toUpperCase() +
                              interviewData.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </section>

                    {/* Ratings */}
                    <section>
                      <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                        Ratings
                      </h3>
                      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Teaching Demo
                          </span>
                          {renderRatingStars(interviewData.teaching_demo_rating)}
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Communication
                          </span>
                          {renderRatingStars(interviewData.communication_rating)}
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Knowledge
                          </span>
                          {renderRatingStars(interviewData.knowledge_rating)}
                        </div>
                        <div className="flex items-center justify-between py-1">
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            Personality
                          </span>
                          {renderRatingStars(interviewData.personality_rating)}
                        </div>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex items-center justify-between">
                          <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Overall
                          </span>
                          {renderRatingStars(interviewData.overall_rating)}
                        </div>
                      </div>
                    </section>

                    {/* Interview Notes */}
                    {interviewData.interview_notes && (
                      <section>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                          Interview Notes
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                            {interviewData.interview_notes}
                          </p>
                        </div>
                      </section>
                    )}

                    {/* AI Summary */}
                    {interviewData.ai_summary && (
                      <section>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                          AI Summary
                        </h3>
                        <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg p-4 border border-indigo-200 dark:border-indigo-800">
                          <p className="text-sm text-gray-900 dark:text-white whitespace-pre-wrap">
                            {interviewData.ai_summary}
                          </p>
                        </div>
                      </section>
                    )}

                    {/* Recording */}
                    {interviewData.recording_url && (
                      <section>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                          Recording
                        </h3>
                        <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                          <a
                            href={interviewData.recording_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300 dark:hover:bg-purple-900/50 transition-colors"
                          >
                            <Video className="w-4 h-4" />
                            View Recording
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        </div>
                      </section>
                    )}
                  </>
                ) : (
                  <div className="text-center py-12">
                    <AlertTriangle className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400 mb-4">
                      Failed to load interview details
                    </p>
                    <button
                      onClick={() => fetchInterview(candidate.interview_id!)}
                      className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Loader2 className={`w-4 h-4 ${interviewLoading ? 'animate-spin' : ''}`} />
                      Retry
                    </button>
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <CalendarPlus className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400 mb-4">
                    No interview scheduled
                  </p>
                  <button
                    onClick={() => onScheduleInterview(candidate)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition-colors"
                  >
                    <CalendarPlus className="w-4 h-4" />
                    Schedule Interview
                  </button>
                </div>
              )}

              {/* Trial Lesson info (if applicable) */}
              {(candidate.trial_lesson_notes || candidate.trial_lesson_rating != null) && (
                <section>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide mb-3">
                    Trial Lesson
                  </h3>
                  <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-3">
                    {candidate.trial_lesson_rating != null && (
                      <div className="flex items-center justify-between py-1">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          Rating
                        </span>
                        {renderRatingStars(candidate.trial_lesson_rating)}
                      </div>
                    )}
                    {candidate.trial_lesson_notes && (
                      <div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">Notes</span>
                        <p className="text-sm text-gray-900 dark:text-white mt-1 whitespace-pre-wrap">
                          {candidate.trial_lesson_notes}
                        </p>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* EMAILS TAB */}
          {activeTab === 'emails' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                  Email History
                </h3>
                <button
                  onClick={() => onSendEmail(candidate)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Send Email
                </button>
              </div>

              {emailsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    Loading emails...
                  </span>
                </div>
              ) : emails.length > 0 ? (
                <div className="space-y-2">
                  {emails.map((email) => {
                    const emailLog = email.admin_email_log as any;
                    return (
                      <div
                        key={email.id}
                        className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                              {emailLog?.subject || email.template_name || 'Email sent'}
                            </p>
                            {email.template_name && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                Template: {email.template_name}
                              </p>
                            )}
                          </div>
                          {emailLog?.status && (
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                                emailLog.status === 'sent'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                                  : emailLog.status === 'failed'
                                  ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                                  : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                              }`}
                            >
                              {emailLog.status.charAt(0).toUpperCase() + emailLog.status.slice(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                          {email.sent_at
                            ? `${format(new Date(email.sent_at), 'dd MMM yyyy, HH:mm')} (${formatDistanceToNow(new Date(email.sent_at), { addSuffix: true })})`
                            : 'Unknown date'}
                        </p>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Mail className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No emails sent to this candidate
                  </p>
                </div>
              )}
            </div>
          )}

          {/* HISTORY TAB */}
          {activeTab === 'history' && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white uppercase tracking-wide">
                Pipeline History
              </h3>

              {historyLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-emerald-500" />
                  <span className="ml-2 text-gray-500 dark:text-gray-400">
                    Loading history...
                  </span>
                </div>
              ) : history.length > 0 ? (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-3 bottom-3 w-0.5 bg-gray-200 dark:bg-gray-700" />

                  <div className="space-y-4">
                    {history.map((entry, idx) => (
                      <div key={entry.id} className="relative flex gap-4">
                        {/* Timeline dot */}
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                            idx === 0
                              ? 'bg-emerald-100 dark:bg-emerald-900/40'
                              : 'bg-gray-100 dark:bg-gray-800'
                          }`}
                        >
                          <ArrowRight
                            className={`w-4 h-4 ${
                              idx === 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-400 dark:text-gray-500'
                            }`}
                          />
                        </div>

                        {/* Content */}
                        <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg p-4 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            {entry.from_stage && (
                              <>
                                <span
                                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    STAGE_COLORS[entry.from_stage] ||
                                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                  }`}
                                >
                                  {formatStageName(entry.from_stage)}
                                </span>
                                <ArrowRight className="w-3.5 h-3.5 text-gray-400 dark:text-gray-500 flex-shrink-0" />
                              </>
                            )}
                            <span
                              className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                STAGE_COLORS[entry.to_stage] ||
                                'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {formatStageName(entry.to_stage)}
                            </span>
                          </div>
                          {entry.notes && (
                            <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                              {entry.notes}
                            </p>
                          )}
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                            {entry.created_at
                              ? `${format(new Date(entry.created_at), 'dd MMM yyyy, HH:mm')} (${formatDistanceToNow(new Date(entry.created_at), { addSuffix: true })})`
                              : 'Unknown date'}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <Clock className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                  <p className="text-gray-500 dark:text-gray-400">
                    No pipeline history recorded
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Helper component for displaying labeled info rows
function InfoRow({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        {icon && <span className="text-gray-400 dark:text-gray-500">{icon}</span>}
        <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      </div>
      {value ? (
        <span className="text-sm text-gray-900 dark:text-white text-right max-w-[60%] truncate">
          {value}
        </span>
      ) : (
        <span className="text-sm text-gray-400 dark:text-gray-500 italic">Not provided</span>
      )}
    </div>
  );
}
