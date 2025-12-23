import { useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  Play,
  Calendar,
  User,
  Clock,
  FileText,
  CheckCircle,
  AlertCircle,
  Eye,
  MessageSquare,
  Filter,
  Video,
  X,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface DiagnosticAssessment {
  id: string;
  student_id: string;
  learner_id: string | null;
  teacher_id: string | null;
  status: string;
  scheduled_time: string | null;
  duration_minutes: number;
  room_id: string | null;
  teacher_room_code: string | null;
  student_room_code: string | null;
  recording_url: string | null;
  recording_expires_at: string | null;
  pre_assessment_responses: any;
  ai_preliminary_assessment: any;
  teacher_assessment: any;
  admin_notes: string | null;
  admin_reviewed_at: string | null;
  admin_reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  student?: {
    full_name: string;
    email: string;
  };
  teacher?: {
    user: {
      full_name: string;
    };
  };
  learner?: {
    name: string;
    age: number;
    gender: string;
  };
}

type StatusFilter = 'all' | 'questionnaire_pending' | 'ai_analyzed' | 'lesson_scheduled' | 'lesson_complete' | 'report_complete';

export default function DiagnosticAssessments() {
  const [assessments, setAssessments] = useState<DiagnosticAssessment[]>([]);
  const [filteredAssessments, setFilteredAssessments] = useState<DiagnosticAssessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [hasRecordingFilter, setHasRecordingFilter] = useState<'all' | 'yes' | 'no'>('all');
  const [needsReviewFilter, setNeedsReviewFilter] = useState(false);

  // Modals
  const [showVideoModal, setShowVideoModal] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<DiagnosticAssessment | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [savingNotes, setSavingNotes] = useState(false);

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    scheduled: 0,
    completed: 0,
    needsReview: 0,
    withRecordings: 0
  });

  useEffect(() => {
    fetchAssessments();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter, hasRecordingFilter, needsReviewFilter, assessments]);

  async function fetchAssessments() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('diagnostic_assessments')
        .select(`
          *,
          student:profiles!diagnostic_assessments_student_id_fkey(full_name, email),
          teacher:teacher_profiles!diagnostic_assessments_teacher_id_fkey(
            user:profiles!teacher_profiles_user_id_fkey(full_name)
          ),
          learner:learners!diagnostic_assessments_learner_id_fkey(name, age, gender)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAssessments(data || []);

      // Calculate stats
      const total = data?.length || 0;
      const pending = data?.filter(a => a.status === 'questionnaire_pending' || a.status === 'ai_analyzed').length || 0;
      const scheduled = data?.filter(a => a.status === 'lesson_scheduled').length || 0;
      const completed = data?.filter(a => a.status === 'lesson_complete' || a.status === 'report_complete').length || 0;
      const needsReview = data?.filter(a => a.recording_url && !a.admin_reviewed_at).length || 0;
      const withRecordings = data?.filter(a => a.recording_url).length || 0;

      setStats({ total, pending, scheduled, completed, needsReview, withRecordings });

    } catch (error: any) {
      console.error('Error fetching assessments:', error);
      toast.error('Failed to load assessments');
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...assessments];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(a =>
        a.student?.full_name?.toLowerCase().includes(query) ||
        a.student?.email?.toLowerCase().includes(query) ||
        a.learner?.name?.toLowerCase().includes(query) ||
        a.teacher?.user?.full_name?.toLowerCase().includes(query) ||
        a.pre_assessment_responses?.student_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(a => a.status === statusFilter);
    }

    // Recording filter
    if (hasRecordingFilter === 'yes') {
      filtered = filtered.filter(a => a.recording_url);
    } else if (hasRecordingFilter === 'no') {
      filtered = filtered.filter(a => !a.recording_url);
    }

    // Needs review filter
    if (needsReviewFilter) {
      filtered = filtered.filter(a => a.recording_url && !a.admin_reviewed_at);
    }

    setFilteredAssessments(filtered);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAssessments();
    setRefreshing(false);
    toast.success('Assessments refreshed');
  }

  function openVideoModal(assessment: DiagnosticAssessment) {
    setSelectedAssessment(assessment);
    setShowVideoModal(true);
  }

  function openDetailsModal(assessment: DiagnosticAssessment) {
    setSelectedAssessment(assessment);
    setAdminNotes(assessment.admin_notes || '');
    setShowDetailsModal(true);
  }

  async function saveAdminReview() {
    if (!selectedAssessment) return;

    setSavingNotes(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('diagnostic_assessments')
        .update({
          admin_notes: adminNotes,
          admin_reviewed_at: new Date().toISOString(),
          admin_reviewed_by: user?.id
        })
        .eq('id', selectedAssessment.id);

      if (error) throw error;

      toast.success('Review saved successfully');
      setShowDetailsModal(false);
      fetchAssessments();
    } catch (error: any) {
      console.error('Error saving review:', error);
      toast.error('Failed to save review');
    } finally {
      setSavingNotes(false);
    }
  }

  function getStatusBadge(status: string) {
    const statusConfig: Record<string, { label: string; className: string }> = {
      questionnaire_pending: { label: 'Questionnaire Pending', className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' },
      questionnaire_complete: { label: 'Questionnaire Complete', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' },
      ai_analyzed: { label: 'AI Analyzed', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300' },
      lesson_scheduled: { label: 'Lesson Scheduled', className: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
      lesson_complete: { label: 'Lesson Complete', className: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
      report_complete: { label: 'Report Complete', className: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300' }
    };

    const config = statusConfig[status] || { label: status, className: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' };
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${config.className}`}>
        {config.label}
      </span>
    );
  }

  function getRecordingExpiryBadge(expiresAt: string | null) {
    if (!expiresAt) return null;

    const expiryDate = new Date(expiresAt);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (daysUntilExpiry <= 0) {
      return <span className="text-xs text-red-600">Expired</span>;
    } else if (daysUntilExpiry <= 7) {
      return <span className="text-xs text-amber-600">Expires in {daysUntilExpiry} days</span>;
    } else {
      return <span className="text-xs text-gray-500 dark:text-gray-400">Expires in {daysUntilExpiry} days</span>;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-2" />
          <p className="text-gray-600">Loading assessments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Diagnostic Assessments</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and quality control diagnostic assessment videos</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
          <p className="text-2xl font-bold text-amber-600 dark:text-amber-400">{stats.pending}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Scheduled</p>
          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.scheduled}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
          <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{stats.completed}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-500 dark:text-gray-400">With Recordings</p>
          <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{stats.withRecordings}</p>
        </div>
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-xl border border-amber-200 dark:border-amber-700">
          <p className="text-sm text-amber-700 dark:text-amber-400">Needs Review</p>
          <p className="text-2xl font-bold text-amber-700 dark:text-amber-400">{stats.needsReview}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 space-y-4">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Statuses</option>
            <option value="questionnaire_pending">Questionnaire Pending</option>
            <option value="ai_analyzed">AI Analyzed</option>
            <option value="lesson_scheduled">Lesson Scheduled</option>
            <option value="lesson_complete">Lesson Complete</option>
            <option value="report_complete">Report Complete</option>
          </select>

          {/* Recording Filter */}
          <select
            value={hasRecordingFilter}
            onChange={(e) => setHasRecordingFilter(e.target.value as 'all' | 'yes' | 'no')}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Recordings</option>
            <option value="yes">Has Recording</option>
            <option value="no">No Recording</option>
          </select>

          {/* Needs Review Toggle */}
          <button
            onClick={() => setNeedsReviewFilter(!needsReviewFilter)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              needsReviewFilter
                ? 'bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-700 dark:text-amber-400'
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            <AlertCircle className="w-4 h-4" />
            Needs Review
          </button>
        </div>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Showing {filteredAssessments.length} of {assessments.length} assessments
        </p>
      </div>

      {/* Assessments Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Student / Learner
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Teacher
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Scheduled
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Recording
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Review
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredAssessments.map((assessment) => (
                <tr key={assessment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {assessment.learner?.name || assessment.pre_assessment_responses?.student_name || 'Unknown'}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {assessment.student?.full_name || assessment.student?.email}
                      </p>
                      {assessment.learner?.age && (
                        <p className="text-xs text-gray-400">
                          Age: {assessment.learner.age} | {assessment.learner.gender}
                        </p>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {assessment.teacher ? (
                      <p className="text-gray-900 dark:text-white">{assessment.teacher.user?.full_name}</p>
                    ) : (
                      <p className="text-gray-400 italic">Not assigned</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {assessment.scheduled_time ? (
                      <div>
                        <p className="text-gray-900 dark:text-white">
                          {format(new Date(assessment.scheduled_time), 'MMM d, yyyy')}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {format(new Date(assessment.scheduled_time), 'h:mm a')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-400 italic">Not scheduled</p>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(assessment.status)}
                  </td>
                  <td className="px-4 py-4">
                    {assessment.recording_url ? (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => openVideoModal(assessment)}
                          className="flex items-center gap-1 text-emerald-600 hover:text-emerald-700"
                        >
                          <Play className="w-4 h-4" />
                          <span className="text-sm">Watch</span>
                        </button>
                        {getRecordingExpiryBadge(assessment.recording_expires_at)}
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">No recording</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    {assessment.admin_reviewed_at ? (
                      <div className="flex items-center gap-1 text-emerald-600">
                        <CheckCircle className="w-4 h-4" />
                        <span className="text-sm">Reviewed</span>
                      </div>
                    ) : assessment.recording_url ? (
                      <div className="flex items-center gap-1 text-amber-600">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">Pending</span>
                      </div>
                    ) : (
                      <span className="text-gray-400 text-sm">-</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openDetailsModal(assessment)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/30 rounded-lg transition"
                        title="View Details"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredAssessments.length === 0 && (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No assessments found</p>
          </div>
        )}
      </div>

      {/* Video Modal */}
      {showVideoModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Assessment Recording
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedAssessment.learner?.name || selectedAssessment.pre_assessment_responses?.student_name}
                  {' '}-{' '}
                  {selectedAssessment.scheduled_time && format(new Date(selectedAssessment.scheduled_time), 'MMM d, yyyy h:mm a')}
                </p>
              </div>
              <button
                onClick={() => setShowVideoModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              {selectedAssessment.recording_url ? (
                <video
                  src={selectedAssessment.recording_url}
                  controls
                  className="w-full rounded-lg"
                  autoPlay
                />
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  No recording available
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Details Modal */}
      {showDetailsModal && selectedAssessment && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 sticky top-0 bg-white dark:bg-gray-800">
              <h3 className="font-semibold text-gray-900 dark:text-white">Assessment Details</h3>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Student Info */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Student Information</h4>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                  <p className="text-gray-900 dark:text-white"><span className="text-gray-500 dark:text-gray-400">Name:</span> {selectedAssessment.learner?.name || selectedAssessment.pre_assessment_responses?.student_name}</p>
                  <p className="text-gray-900 dark:text-white"><span className="text-gray-500 dark:text-gray-400">Age:</span> {selectedAssessment.learner?.age || selectedAssessment.pre_assessment_responses?.student_age}</p>
                  <p className="text-gray-900 dark:text-white"><span className="text-gray-500 dark:text-gray-400">Gender:</span> {selectedAssessment.learner?.gender || selectedAssessment.pre_assessment_responses?.student_gender}</p>
                  <p className="text-gray-900 dark:text-white"><span className="text-gray-500 dark:text-gray-400">Subject:</span> {selectedAssessment.pre_assessment_responses?.primary_subject}</p>
                </div>
              </div>

              {/* AI Assessment */}
              {selectedAssessment.ai_preliminary_assessment && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">AI Preliminary Assessment</h4>
                  <div className="bg-purple-50 dark:bg-gray-700 rounded-lg p-4 text-sm">
                    <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {typeof selectedAssessment.ai_preliminary_assessment === 'string'
                        ? selectedAssessment.ai_preliminary_assessment
                        : JSON.stringify(selectedAssessment.ai_preliminary_assessment, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Teacher Assessment */}
              {selectedAssessment.teacher_assessment && (
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white mb-2">Teacher Assessment</h4>
                  <div className="bg-emerald-50 dark:bg-gray-700 rounded-lg p-4 text-sm">
                    <pre className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
                      {typeof selectedAssessment.teacher_assessment === 'string'
                        ? selectedAssessment.teacher_assessment
                        : JSON.stringify(selectedAssessment.teacher_assessment, null, 2)}
                    </pre>
                  </div>
                </div>
              )}

              {/* Admin Review Section */}
              <div>
                <h4 className="font-medium text-gray-900 dark:text-white mb-2">Admin Quality Control Review</h4>
                {selectedAssessment.admin_reviewed_at && (
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                    Last reviewed: {format(new Date(selectedAssessment.admin_reviewed_at), 'MMM d, yyyy h:mm a')}
                  </p>
                )}
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add your quality control notes here..."
                  rows={4}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                />
                <div className="flex justify-end mt-4">
                  <button
                    onClick={saveAdminReview}
                    disabled={savingNotes}
                    className="px-6 py-2 bg-emerald-500 text-white font-medium rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
                  >
                    {savingNotes ? 'Saving...' : 'Save Review'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
