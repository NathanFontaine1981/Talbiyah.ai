import { useEffect, useState } from 'react';
import {
  Search,
  RefreshCw,
  Filter,
  AlertTriangle,
  AlertCircle,
  CheckCircle,
  Eye,
  X,
  Mail,
  Phone,
  MessageSquare,
  Link as LinkIcon,
  Calendar,
  User,
  Shield,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format, formatDistanceToNow } from 'date-fns';

interface ContentFlag {
  id: string;
  lesson_id: string;
  flag_type: 'email' | 'phone' | 'social_media' | 'file_share' | 'keyword' | 'other';
  source: 'transcript' | 'chat';
  flagged_content: string;
  context: string | null;
  teacher_id: string | null;
  student_id: string | null;
  detected_at: string;
  reviewed: boolean;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_notes: string | null;
  severity: 'warning' | 'critical';
  admin_notified: boolean;
  action_taken: string | null;
  created_at: string;
  // Joined data
  teacher?: {
    full_name: string;
    email: string;
  };
  student?: {
    full_name: string;
    email: string;
  };
  lesson?: {
    title: string;
    scheduled_time: string;
  };
}

type StatusFilter = 'all' | 'unreviewed' | 'reviewed';
type SeverityFilter = 'all' | 'critical' | 'warning';
type FlagTypeFilter = 'all' | 'email' | 'phone' | 'social_media' | 'file_share' | 'keyword';

export default function ContentModeration() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [filteredFlags, setFilteredFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('unreviewed');
  const [severityFilter, setSeverityFilter] = useState<SeverityFilter>('all');
  const [flagTypeFilter, setFlagTypeFilter] = useState<FlagTypeFilter>('all');

  // Modals
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<ContentFlag | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [selectedAction, setSelectedAction] = useState<string>('dismissed');
  const [saving, setSaving] = useState(false);

  // Expanded rows
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    unreviewed: 0,
    critical: 0,
    today: 0,
    thisWeek: 0
  });

  useEffect(() => {
    fetchFlags();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, statusFilter, severityFilter, flagTypeFilter, flags]);

  async function fetchFlags() {
    try {
      const { data, error } = await supabase
        .from('lesson_content_flags')
        .select(`
          *,
          teacher:profiles!lesson_content_flags_teacher_id_fkey(full_name, email),
          student:profiles!lesson_content_flags_student_id_fkey(full_name, email),
          lesson:lessons!lesson_content_flags_lesson_id_fkey(title, scheduled_time)
        `)
        .order('detected_at', { ascending: false });

      if (error) throw error;

      setFlags(data || []);
      calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching content flags:', error);
      toast.error('Failed to load content flags');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function calculateStats(data: ContentFlag[]) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    setStats({
      total: data.length,
      unreviewed: data.filter(f => !f.reviewed).length,
      critical: data.filter(f => f.severity === 'critical' && !f.reviewed).length,
      today: data.filter(f => new Date(f.detected_at) >= today).length,
      thisWeek: data.filter(f => new Date(f.detected_at) >= weekAgo).length
    });
  }

  function applyFilters() {
    let filtered = [...flags];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f =>
        f.flagged_content.toLowerCase().includes(query) ||
        f.context?.toLowerCase().includes(query) ||
        f.teacher?.full_name?.toLowerCase().includes(query) ||
        f.student?.full_name?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter === 'unreviewed') {
      filtered = filtered.filter(f => !f.reviewed);
    } else if (statusFilter === 'reviewed') {
      filtered = filtered.filter(f => f.reviewed);
    }

    // Severity filter
    if (severityFilter !== 'all') {
      filtered = filtered.filter(f => f.severity === severityFilter);
    }

    // Flag type filter
    if (flagTypeFilter !== 'all') {
      filtered = filtered.filter(f => f.flag_type === flagTypeFilter);
    }

    setFilteredFlags(filtered);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchFlags();
    toast.success('Content flags refreshed');
  }

  function toggleRowExpand(id: string) {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  }

  function openDetailsModal(flag: ContentFlag) {
    setSelectedFlag(flag);
    setReviewNotes(flag.review_notes || '');
    setSelectedAction(flag.action_taken || 'dismissed');
    setShowDetailsModal(true);
  }

  async function handleMarkAsReviewed() {
    if (!selectedFlag) return;

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase
        .from('lesson_content_flags')
        .update({
          reviewed: true,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          review_notes: reviewNotes,
          action_taken: selectedAction
        })
        .eq('id', selectedFlag.id);

      if (error) throw error;

      toast.success('Flag marked as reviewed');
      setShowDetailsModal(false);
      await fetchFlags();
    } catch (error) {
      console.error('Error updating flag:', error);
      toast.error('Failed to update flag');
    } finally {
      setSaving(false);
    }
  }

  function getFlagTypeIcon(type: string) {
    switch (type) {
      case 'email':
        return <Mail className="w-4 h-4" />;
      case 'phone':
        return <Phone className="w-4 h-4" />;
      case 'social_media':
        return <MessageSquare className="w-4 h-4" />;
      case 'file_share':
        return <LinkIcon className="w-4 h-4" />;
      case 'keyword':
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  }

  function getFlagTypeLabel(type: string): string {
    switch (type) {
      case 'email':
        return 'Email Address';
      case 'phone':
        return 'Phone Number';
      case 'social_media':
        return 'Social Media';
      case 'file_share':
        return 'File Sharing';
      case 'keyword':
        return 'Suspicious Keyword';
      default:
        return type;
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Content Moderation</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Monitor lesson content for policy violations</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Shield className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total Flags</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertCircle className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-600">{stats.unreviewed}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Unreviewed</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-600">{stats.critical}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Critical</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-600">{stats.today}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Today</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-purple-600">{stats.thisWeek}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">This Week</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search flagged content, teacher, or student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Status</option>
            <option value="unreviewed">Unreviewed</option>
            <option value="reviewed">Reviewed</option>
          </select>

          {/* Severity Filter */}
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value as SeverityFilter)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Severity</option>
            <option value="critical">Critical</option>
            <option value="warning">Warning</option>
          </select>

          {/* Flag Type Filter */}
          <select
            value={flagTypeFilter}
            onChange={(e) => setFlagTypeFilter(e.target.value as FlagTypeFilter)}
            className="px-4 py-2 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          >
            <option value="all">All Types</option>
            <option value="email">Email Address</option>
            <option value="phone">Phone Number</option>
            <option value="social_media">Social Media</option>
            <option value="file_share">File Sharing</option>
            <option value="keyword">Keywords</option>
          </select>
        </div>
      </div>

      {/* Flags Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Flagged Content</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Source</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Teacher</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Student</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Detected</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredFlags.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    {flags.length === 0 ? (
                      <div className="flex flex-col items-center gap-2">
                        <CheckCircle className="w-12 h-12 text-emerald-500" />
                        <p className="font-medium">No content flags detected</p>
                        <p className="text-sm">All clear! No suspicious activity found.</p>
                      </div>
                    ) : (
                      <p>No flags match your current filters</p>
                    )}
                  </td>
                </tr>
              ) : (
                filteredFlags.map((flag) => (
                  <>
                    <tr key={flag.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${flag.severity === 'critical' && !flag.reviewed ? 'bg-red-50 dark:bg-red-900/20' : ''}`}>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {flag.reviewed ? (
                            <span className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              <CheckCircle className="w-3 h-3" />
                              Reviewed
                            </span>
                          ) : (
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                              flag.severity === 'critical'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {flag.severity === 'critical' ? (
                                <AlertTriangle className="w-3 h-3" />
                              ) : (
                                <AlertCircle className="w-3 h-3" />
                              )}
                              {flag.severity === 'critical' ? 'Critical' : 'Warning'}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Type */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          {getFlagTypeIcon(flag.flag_type)}
                          <span className="text-sm text-gray-700 dark:text-gray-300">{getFlagTypeLabel(flag.flag_type)}</span>
                        </div>
                      </td>

                      {/* Flagged Content */}
                      <td className="px-4 py-3">
                        <div className="max-w-xs">
                          <p className="text-sm font-medium text-gray-900 dark:text-white truncate" title={flag.flagged_content}>
                            {flag.flagged_content}
                          </p>
                          {flag.context && (
                            <button
                              onClick={() => toggleRowExpand(flag.id)}
                              className="text-xs text-emerald-600 hover:text-emerald-700 flex items-center gap-1 mt-1"
                            >
                              {expandedRows.has(flag.id) ? (
                                <>
                                  <ChevronUp className="w-3 h-3" /> Hide context
                                </>
                              ) : (
                                <>
                                  <ChevronDown className="w-3 h-3" /> Show context
                                </>
                              )}
                            </button>
                          )}
                        </div>
                      </td>

                      {/* Source */}
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          flag.source === 'transcript'
                            ? 'bg-purple-100 text-purple-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {flag.source === 'transcript' ? 'Transcript' : 'Chat'}
                        </span>
                      </td>

                      {/* Teacher */}
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">{flag.teacher?.full_name || 'Unknown'}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{flag.teacher?.email}</p>
                        </div>
                      </td>

                      {/* Student */}
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">{flag.student?.full_name || 'Unknown'}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{flag.student?.email}</p>
                        </div>
                      </td>

                      {/* Detected */}
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p className="text-gray-900 dark:text-white">{format(new Date(flag.detected_at), 'MMM d, yyyy')}</p>
                          <p className="text-gray-500 dark:text-gray-400 text-xs">{formatDistanceToNow(new Date(flag.detected_at), { addSuffix: true })}</p>
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <button
                          onClick={() => openDetailsModal(flag)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white text-sm rounded-lg hover:bg-emerald-600 transition"
                        >
                          <Eye className="w-4 h-4" />
                          Review
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Context Row */}
                    {expandedRows.has(flag.id) && flag.context && (
                      <tr key={`${flag.id}-context`} className="bg-gray-50 dark:bg-gray-700">
                        <td colSpan={8} className="px-4 py-3">
                          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase mb-2">Context</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{flag.context}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {showDetailsModal && selectedFlag && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  selectedFlag.severity === 'critical' ? 'bg-red-100' : 'bg-amber-100'
                }`}>
                  {selectedFlag.severity === 'critical' ? (
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  )}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">Review Content Flag</h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{getFlagTypeLabel(selectedFlag.flag_type)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Flagged Content */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Flagged Content</h3>
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg p-4">
                  <p className="text-red-800 dark:text-red-200 font-medium break-all">{selectedFlag.flagged_content}</p>
                </div>
              </div>

              {/* Context */}
              {selectedFlag.context && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Context</h3>
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                    <p className="text-gray-700 dark:text-gray-300 text-sm whitespace-pre-wrap">{selectedFlag.context}</p>
                  </div>
                </div>
              )}

              {/* Lesson Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Teacher</h3>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedFlag.teacher?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedFlag.teacher?.email}</p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Student</h3>
                  <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                    <User className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{selectedFlag.student?.full_name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{selectedFlag.student?.email}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detection Info */}
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span>Source: <strong className="text-gray-700 dark:text-gray-300">{selectedFlag.source === 'transcript' ? 'Transcript' : 'Chat'}</strong></span>
                <span>Detected: <strong className="text-gray-700 dark:text-gray-300">{format(new Date(selectedFlag.detected_at), 'PPpp')}</strong></span>
              </div>

              {/* Action Selection */}
              {!selectedFlag.reviewed && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Action to Take</h3>
                  <div className="flex gap-3">
                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer transition ${
                      selectedAction === 'dismissed' ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="action"
                        value="dismissed"
                        checked={selectedAction === 'dismissed'}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="sr-only"
                      />
                      <p className="font-medium text-gray-900 dark:text-white">Dismiss</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">False positive, no action needed</p>
                    </label>
                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer transition ${
                      selectedAction === 'warned' ? 'border-amber-500 bg-amber-50 dark:bg-amber-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="action"
                        value="warned"
                        checked={selectedAction === 'warned'}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="sr-only"
                      />
                      <p className="font-medium text-gray-900 dark:text-white">Warn</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Issue warning to teacher/student</p>
                    </label>
                    <label className={`flex-1 p-3 border rounded-lg cursor-pointer transition ${
                      selectedAction === 'suspended' ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                    }`}>
                      <input
                        type="radio"
                        name="action"
                        value="suspended"
                        checked={selectedAction === 'suspended'}
                        onChange={(e) => setSelectedAction(e.target.value)}
                        className="sr-only"
                      />
                      <p className="font-medium text-gray-900 dark:text-white">Suspend</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Suspend teacher account</p>
                    </label>
                  </div>
                </div>
              )}

              {/* Review Notes */}
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">Review Notes</h3>
                <textarea
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  disabled={selectedFlag.reviewed}
                  rows={3}
                  placeholder="Add notes about your review decision..."
                  className="w-full px-4 py-3 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent disabled:bg-gray-100 dark:disabled:bg-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                />
              </div>

              {/* Previous Review Info */}
              {selectedFlag.reviewed && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-4">
                  <p className="text-sm text-green-800 dark:text-green-200">
                    <strong>Reviewed</strong> on {format(new Date(selectedFlag.reviewed_at!), 'PPpp')}
                  </p>
                  <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                    Action taken: <strong>{selectedFlag.action_taken}</strong>
                  </p>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            {!selectedFlag.reviewed && (
              <div className="flex justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleMarkAsReviewed}
                  disabled={saving}
                  className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition disabled:opacity-50 flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Mark as Reviewed
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
