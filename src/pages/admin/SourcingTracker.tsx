import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  ExternalLink,
  Edit2,
  ArrowRight,
  ArrowLeft,
  Users,
  Globe,
  Mail,
  Phone,
  MapPin,
  BookOpen,
  Filter,
  MoreVertical,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

// ─── Types ────────────────────────────────────────────────────────────────────

type SourcingStatus = 'identified' | 'contacted' | 'responded' | 'in_pipeline';
type PlatformSource = 'fiverr' | 'upwork' | 'linkedin' | 'referral' | 'direct' | 'other';

interface Prospect {
  id: string;
  full_name: string;
  email: string | null;
  phone: string | null;
  nationality: string | null;
  languages: string[];
  platform_source: PlatformSource | null;
  source_url: string | null;
  subjects: string[];
  expected_hourly_rate: number | null;
  notes: string | null;
  sourcing_status: SourcingStatus;
  first_identified_at: string | null;
  contacted_at: string | null;
  responded_at: string | null;
  moved_to_pipeline_at: string | null;
  pipeline_candidate_id: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

interface FormData {
  full_name: string;
  email: string;
  phone: string;
  nationality: string;
  languages: string;
  platform_source: PlatformSource | '';
  source_url: string;
  subjects: string[];
  expected_hourly_rate: string;
  notes: string;
}

const EMPTY_FORM: FormData = {
  full_name: '',
  email: '',
  phone: '',
  nationality: '',
  languages: '',
  platform_source: '',
  source_url: '',
  subjects: [],
  expected_hourly_rate: '',
  notes: '',
};

const SUBJECT_OPTIONS = ['Quran', 'Arabic', 'Tajweed', 'Islamic Studies'];

const PLATFORM_OPTIONS: { value: PlatformSource; label: string }[] = [
  { value: 'fiverr', label: 'Fiverr' },
  { value: 'upwork', label: 'Upwork' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'referral', label: 'Referral' },
  { value: 'direct', label: 'Direct' },
  { value: 'other', label: 'Other' },
];

const STATUS_OPTIONS: { value: SourcingStatus; label: string }[] = [
  { value: 'identified', label: 'Identified' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'responded', label: 'Responded' },
  { value: 'in_pipeline', label: 'In Pipeline' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusBadgeClasses(status: SourcingStatus): string {
  switch (status) {
    case 'identified':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    case 'contacted':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'responded':
      return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'in_pipeline':
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
  }
}

function statusLabel(status: SourcingStatus): string {
  switch (status) {
    case 'identified':
      return 'Identified';
    case 'contacted':
      return 'Contacted';
    case 'responded':
      return 'Responded';
    case 'in_pipeline':
      return 'In Pipeline';
    default:
      return status;
  }
}

function platformLabel(platform: PlatformSource | null): string {
  if (!platform) return '-';
  const found = PLATFORM_OPTIONS.find((p) => p.value === platform);
  return found ? found.label : platform;
}

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return '-';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '-';
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function SourcingTracker() {
  const navigate = useNavigate();
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [movingId, setMovingId] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<SourcingStatus | 'all'>('all');
  const [platformFilter, setPlatformFilter] = useState<PlatformSource | 'all'>('all');

  // Modal
  const [showModal, setShowModal] = useState(false);
  const [editingProspect, setEditingProspect] = useState<Prospect | null>(null);
  const [formData, setFormData] = useState<FormData>(EMPTY_FORM);

  // Status dropdown per row
  const [statusDropdownId, setStatusDropdownId] = useState<string | null>(null);

  // ─── Fetch ────────────────────────────────────────────────────────────────

  const fetchProspects = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('recruitment_prospects')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProspects(data || []);
    } catch (error) {
      console.error('Error fetching prospects:', error);
      toast.error('Failed to load prospects');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProspects();
  }, [fetchProspects]);

  // ─── Stats ────────────────────────────────────────────────────────────────

  const stats = {
    total: prospects.length,
    identified: prospects.filter((p) => p.sourcing_status === 'identified').length,
    contacted: prospects.filter((p) => p.sourcing_status === 'contacted').length,
    responded: prospects.filter((p) => p.sourcing_status === 'responded').length,
    in_pipeline: prospects.filter((p) => p.sourcing_status === 'in_pipeline').length,
  };

  // ─── Filtered prospects ───────────────────────────────────────────────────

  const filteredProspects = prospects.filter((p) => {
    // Search filter
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchesName = p.full_name.toLowerCase().includes(q);
      const matchesEmail = p.email?.toLowerCase().includes(q);
      if (!matchesName && !matchesEmail) return false;
    }
    // Status filter
    if (statusFilter !== 'all' && p.sourcing_status !== statusFilter) return false;
    // Platform filter
    if (platformFilter !== 'all' && p.platform_source !== platformFilter) return false;
    return true;
  });

  // ─── Modal helpers ────────────────────────────────────────────────────────

  function openAddModal() {
    setEditingProspect(null);
    setFormData(EMPTY_FORM);
    setShowModal(true);
  }

  function openEditModal(prospect: Prospect) {
    setEditingProspect(prospect);
    setFormData({
      full_name: prospect.full_name,
      email: prospect.email || '',
      phone: prospect.phone || '',
      nationality: prospect.nationality || '',
      languages: (prospect.languages || []).join(', '),
      platform_source: prospect.platform_source || '',
      source_url: prospect.source_url || '',
      subjects: prospect.subjects || [],
      expected_hourly_rate: prospect.expected_hourly_rate != null ? String(prospect.expected_hourly_rate) : '',
      notes: prospect.notes || '',
    });
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingProspect(null);
    setFormData(EMPTY_FORM);
  }

  function handleFormChange(field: keyof FormData, value: string | string[]) {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }

  function toggleSubject(subject: string) {
    setFormData((prev) => {
      const subjects = prev.subjects.includes(subject)
        ? prev.subjects.filter((s) => s !== subject)
        : [...prev.subjects, subject];
      return { ...prev, subjects };
    });
  }

  // ─── Save (Create / Update) ───────────────────────────────────────────────

  async function handleSave() {
    if (!formData.full_name.trim()) {
      toast.error('Full name is required');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const languagesArray = formData.languages
        .split(',')
        .map((l) => l.trim())
        .filter(Boolean);

      const record: Record<string, unknown> = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null,
        nationality: formData.nationality.trim() || null,
        languages: languagesArray,
        platform_source: formData.platform_source || null,
        source_url: formData.source_url.trim() || null,
        subjects: formData.subjects,
        expected_hourly_rate: formData.expected_hourly_rate ? parseFloat(formData.expected_hourly_rate) : null,
        notes: formData.notes.trim() || null,
        updated_at: new Date().toISOString(),
      };

      if (editingProspect) {
        // Update
        const { error } = await supabase
          .from('recruitment_prospects')
          .update(record)
          .eq('id', editingProspect.id);

        if (error) throw error;
        toast.success('Prospect updated');
      } else {
        // Create
        record.sourcing_status = 'identified';
        record.first_identified_at = new Date().toISOString();
        record.created_by = user?.id || null;
        record.created_at = new Date().toISOString();

        const { error } = await supabase
          .from('recruitment_prospects')
          .insert(record);

        if (error) throw error;
        toast.success('Prospect added');
      }

      closeModal();
      fetchProspects();
    } catch (error) {
      console.error('Error saving prospect:', error);
      toast.error('Failed to save prospect');
    } finally {
      setSaving(false);
    }
  }

  // ─── Status change ────────────────────────────────────────────────────────

  async function handleStatusChange(prospect: Prospect, newStatus: SourcingStatus) {
    setStatusDropdownId(null);

    if (newStatus === prospect.sourcing_status) return;

    try {
      const updates: Record<string, unknown> = {
        sourcing_status: newStatus,
        updated_at: new Date().toISOString(),
      };

      // Set timestamp for the new status if not already set
      if (newStatus === 'contacted' && !prospect.contacted_at) {
        updates.contacted_at = new Date().toISOString();
      }
      if (newStatus === 'responded' && !prospect.responded_at) {
        updates.responded_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('recruitment_prospects')
        .update(updates)
        .eq('id', prospect.id);

      if (error) throw error;
      toast.success(`Status changed to ${statusLabel(newStatus)}`);
      fetchProspects();
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  }

  // ─── Move to Pipeline ─────────────────────────────────────────────────────

  async function handleMoveToPipeline(prospect: Prospect) {
    if (prospect.sourcing_status === 'in_pipeline') {
      toast.error('Already in pipeline');
      return;
    }

    if (!prospect.email) {
      toast.error('Email is required to move to pipeline');
      return;
    }

    setMovingId(prospect.id);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Create recruitment_pipeline record with all available data
      const { data: pipelineRecord, error: pipelineError } = await supabase
        .from('recruitment_pipeline')
        .insert({
          full_name: prospect.full_name,
          email: prospect.email,
          phone: prospect.phone || null,
          nationality: prospect.nationality || null,
          languages: prospect.languages || [],
          subjects: prospect.subjects || [],
          expected_hourly_rate: prospect.expected_hourly_rate || null,
          pipeline_stage: 'initial_contact',
          prospect_id: prospect.id,
          source: prospect.platform_source || 'direct',
          created_by: user?.id || null,
        })
        .select('id')
        .single();

      if (pipelineError) throw pipelineError;

      // Update the prospect record
      const { error: updateError } = await supabase
        .from('recruitment_prospects')
        .update({
          sourcing_status: 'in_pipeline',
          moved_to_pipeline_at: new Date().toISOString(),
          pipeline_candidate_id: pipelineRecord.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', prospect.id);

      if (updateError) throw updateError;

      toast.success(
        <span>
          Moved to pipeline.{' '}
          <a href="/admin/recruitment-pipeline" className="underline font-medium">
            View pipeline
          </a>
        </span>
      );
      fetchProspects();
    } catch (error) {
      console.error('Error moving to pipeline:', error);
      toast.error('Failed to move to pipeline');
    } finally {
      setMovingId(null);
    }
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate('/admin')}
        className="flex items-center gap-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition" />
        <span className="text-sm">Back to Admin Dashboard</span>
      </button>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Teacher Sourcing Tracker
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Find and track prospective teachers before they enter the recruitment pipeline.
          </p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Prospect
        </button>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <StatCard label="Total Prospects" value={stats.total} color="gray" />
        <StatCard label="Identified" value={stats.identified} color="blue" />
        <StatCard label="Contacted" value={stats.contacted} color="yellow" />
        <StatCard label="Responded" value={stats.responded} color="purple" />
        <StatCard label="In Pipeline" value={stats.in_pipeline} color="emerald" />
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          {/* Status filter */}
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as SourcingStatus | 'all')}
              className="appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-8 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Statuses</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Platform filter */}
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value as PlatformSource | 'all')}
              className="appearance-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-8 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            >
              <option value="all">All Platforms</option>
              {PLATFORM_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent" />
          </div>
        ) : filteredProspects.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400 dark:text-gray-500">
            <Users className="h-12 w-12 mb-3" />
            <p className="text-sm">
              {prospects.length === 0
                ? 'No prospects yet. Add your first one!'
                : 'No prospects match your filters.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Platform
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Subjects
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Rate
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Added
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredProspects.map((prospect) => (
                  <tr
                    key={prospect.id}
                    className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                  >
                    {/* Name */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {prospect.full_name}
                        </span>
                        {prospect.source_url && (
                          <a
                            href={prospect.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-gray-400 hover:text-emerald-500 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      {prospect.nationality && (
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {prospect.nationality}
                        </span>
                      )}
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {prospect.email || '-'}
                    </td>

                    {/* Platform */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {platformLabel(prospect.platform_source)}
                    </td>

                    {/* Subjects */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {prospect.subjects && prospect.subjects.length > 0 ? (
                          prospect.subjects.map((subject) => (
                            <span
                              key={subject}
                              className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400"
                            >
                              {subject}
                            </span>
                          ))
                        ) : (
                          <span className="text-sm text-gray-400">-</span>
                        )}
                      </div>
                    </td>

                    {/* Rate */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-300">
                      {prospect.expected_hourly_rate != null
                        ? `\u00A3${prospect.expected_hourly_rate}`
                        : '-'}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap relative">
                      <button
                        onClick={() =>
                          setStatusDropdownId(
                            statusDropdownId === prospect.id ? null : prospect.id
                          )
                        }
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium cursor-pointer transition-opacity hover:opacity-80 ${statusBadgeClasses(prospect.sourcing_status)}`}
                      >
                        {statusLabel(prospect.sourcing_status)}
                        <MoreVertical className="h-3 w-3" />
                      </button>

                      {/* Status dropdown */}
                      {statusDropdownId === prospect.id && (
                        <div className="absolute z-20 mt-1 left-4 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1">
                          {STATUS_OPTIONS.filter(
                            (opt) => opt.value !== 'in_pipeline'
                          ).map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => handleStatusChange(prospect, opt.value)}
                              className={`w-full text-left px-3 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                                prospect.sourcing_status === opt.value
                                  ? 'text-emerald-600 dark:text-emerald-400 font-medium'
                                  : 'text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>

                    {/* Added */}
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                      {relativeTime(prospect.created_at)}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(prospect)}
                          className="inline-flex items-center gap-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                          Edit
                        </button>
                        {prospect.sourcing_status !== 'in_pipeline' && (
                          <button
                            onClick={() => handleMoveToPipeline(prospect)}
                            disabled={movingId === prospect.id}
                            className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors"
                          >
                            {movingId === prospect.id ? (
                              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            ) : (
                              <ArrowRight className="h-3.5 w-3.5" />
                            )}
                            Pipeline
                          </button>
                        )}
                        {prospect.sourcing_status === 'in_pipeline' && prospect.pipeline_candidate_id && (
                          <a
                            href="/admin/recruitment"
                            className="inline-flex items-center gap-1 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                            View
                          </a>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ─── Modal ──────────────────────────────────────────────────────────── */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {/* Backdrop */}
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeModal} />

          {/* Modal content */}
          <div className="relative z-10 w-full max-w-2xl bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                {editingProspect ? 'Edit Prospect' : 'Add Prospect'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal body */}
            <div className="p-6 space-y-5">
              {/* Row: Name & Email */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.full_name}
                    onChange={(e) => handleFormChange('full_name', e.target.value)}
                    placeholder="e.g. Ahmad Hassan"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleFormChange('email', e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row: Phone & Nationality */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleFormChange('phone', e.target.value)}
                      placeholder="+44 7..."
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nationality
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.nationality}
                      onChange={(e) => handleFormChange('nationality', e.target.value)}
                      placeholder="e.g. Egyptian"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Row: Languages & Platform */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Languages
                  </label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={formData.languages}
                      onChange={(e) => handleFormChange('languages', e.target.value)}
                      placeholder="Arabic, English, Urdu"
                      className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                  <p className="mt-1 text-xs text-gray-400">Comma-separated</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Platform Source
                  </label>
                  <select
                    value={formData.platform_source}
                    onChange={(e) => handleFormChange('platform_source', e.target.value)}
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  >
                    <option value="">Select platform...</option>
                    {PLATFORM_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Source URL */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Source URL
                </label>
                <div className="relative">
                  <ExternalLink className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="url"
                    value={formData.source_url}
                    onChange={(e) => handleFormChange('source_url', e.target.value)}
                    placeholder="https://fiverr.com/username"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-9 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Subjects (checkboxes) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Subjects
                </label>
                <div className="flex flex-wrap gap-3">
                  {SUBJECT_OPTIONS.map((subject) => (
                    <label
                      key={subject}
                      className="inline-flex items-center gap-2 cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={formData.subjects.includes(subject)}
                        onChange={() => toggleSubject(subject)}
                        className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-emerald-600 focus:ring-emerald-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{subject}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Expected Hourly Rate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Expected Hourly Rate
                </label>
                <div className="relative max-w-xs">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400 font-medium">
                    {'\u00A3'}
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.expected_hourly_rate}
                    onChange={(e) => handleFormChange('expected_hourly_rate', e.target.value)}
                    placeholder="0.00"
                    className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 pl-7 pr-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => handleFormChange('notes', e.target.value)}
                  rows={3}
                  placeholder="Any notes about this prospect..."
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            {/* Modal footer */}
            <div className="flex items-center justify-end gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={closeModal}
                className="border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                {saving && (
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                )}
                {editingProspect ? 'Save Changes' : 'Add Prospect'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Click-away handler for status dropdowns */}
      {statusDropdownId && (
        <div
          className="fixed inset-0 z-10"
          onClick={() => setStatusDropdownId(null)}
        />
      )}
    </div>
  );
}

// ─── Stat Card ────────────────────────────────────────────────────────────────

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: 'gray' | 'blue' | 'yellow' | 'purple' | 'emerald';
}) {
  const badgeColors: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
    emerald: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
        {label}
      </p>
      <div className="mt-2 flex items-center gap-2">
        <span
          className={`inline-flex items-center justify-center h-8 min-w-[2rem] px-2 rounded-full text-lg font-bold ${badgeColors[color]}`}
        >
          {value}
        </span>
      </div>
    </div>
  );
}
