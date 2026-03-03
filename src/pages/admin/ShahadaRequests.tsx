import { useState, useEffect } from 'react';
import {
  Heart,
  Search,
  Loader2,
  ChevronDown,
  ChevronUp,
  Check,
  X,
  Calendar,
  Clock,
  Users,
  Phone,
  Mail,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface ShahadaRequest {
  id: string;
  full_name: string;
  phone_number: string | null;
  phone_country_code: string | null;
  email: string | null;
  status: string;
  admin_notes: string | null;
  shahada_taken: boolean;
  shahada_date: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_OPTIONS = ['pending', 'contacted', 'completed', 'follow-up'] as const;

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  contacted: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  completed: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  'follow-up': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

export default function ShahadaRequests() {
  const [requests, setRequests] = useState<ShahadaRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [shahadaFilter, setShahadaFilter] = useState<string>('all');
  const [expandedNotes, setExpandedNotes] = useState<string | null>(null);
  const [editingNotes, setEditingNotes] = useState<{ id: string; value: string } | null>(null);
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  async function loadRequests() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('shahada_requests')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setRequests(data || []);
    } catch (err) {
      console.error('Error loading shahada requests:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateField(id: string, field: string, value: any) {
    setSaving(id);
    try {
      const { error } = await supabase
        .from('shahada_requests')
        .update({ [field]: value, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setRequests(prev =>
        prev.map(r => (r.id === id ? { ...r, [field]: value, updated_at: new Date().toISOString() } : r))
      );
    } catch (err) {
      console.error(`Error updating ${field}:`, err);
    } finally {
      setSaving(null);
    }
  }

  async function toggleShahadaTaken(request: ShahadaRequest) {
    const newValue = !request.shahada_taken;
    const updates: Record<string, any> = {
      shahada_taken: newValue,
      updated_at: new Date().toISOString(),
    };
    if (newValue && !request.shahada_date) {
      updates.shahada_date = new Date().toISOString();
    }
    if (!newValue) {
      updates.shahada_date = null;
    }

    setSaving(request.id);
    try {
      const { error } = await supabase
        .from('shahada_requests')
        .update(updates)
        .eq('id', request.id);

      if (error) throw error;

      setRequests(prev =>
        prev.map(r => (r.id === request.id ? { ...r, ...updates } : r))
      );
    } catch (err) {
      console.error('Error toggling shahada_taken:', err);
    } finally {
      setSaving(null);
    }
  }

  function saveNotes(id: string) {
    if (!editingNotes) return;
    updateField(id, 'admin_notes', editingNotes.value || null);
    setEditingNotes(null);
    setExpandedNotes(null);
  }

  // Filtering
  const filtered = requests.filter(r => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (shahadaFilter === 'taken' && !r.shahada_taken) return false;
    if (shahadaFilter === 'not_taken' && r.shahada_taken) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      return (
        r.full_name.toLowerCase().includes(q) ||
        (r.email && r.email.toLowerCase().includes(q)) ||
        (r.phone_number && r.phone_number.includes(q))
      );
    }
    return true;
  });

  // Counts
  const counts = {
    total: requests.length,
    pending: requests.filter(r => r.status === 'pending').length,
    contacted: requests.filter(r => r.status === 'contacted').length,
    shahadaTaken: requests.filter(r => r.shahada_taken).length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
          <Heart className="w-7 h-7 text-rose-500" />
          Shahada Requests
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Manage and track shahada request submissions
        </p>
      </div>

      {/* Count badges */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <Users className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.pending}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Pending</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.contacted}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Contacted</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Heart className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{counts.shahadaTaken}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Shahada Taken</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Statuses</option>
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        <select
          value={shahadaFilter}
          onChange={e => setShahadaFilter(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
        >
          <option value="all">All Shahada Status</option>
          <option value="taken">Shahada Taken</option>
          <option value="not_taken">Not Yet Taken</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Name</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Contact</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Status</th>
                <th className="text-center px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Shahada</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Shahada Date</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Submitted</th>
                <th className="text-left px-4 py-3 font-medium text-gray-600 dark:text-gray-400">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-500 dark:text-gray-400">
                    {requests.length === 0 ? 'No shahada requests yet.' : 'No requests match your filters.'}
                  </td>
                </tr>
              ) : (
                filtered.map(request => (
                  <tr key={request.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    {/* Name */}
                    <td className="px-4 py-3">
                      <span className="font-medium text-gray-900 dark:text-white">{request.full_name}</span>
                    </td>

                    {/* Contact */}
                    <td className="px-4 py-3">
                      <div className="space-y-1">
                        {request.phone_number && (
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <Phone className="w-3.5 h-3.5 text-gray-400" />
                            <span>{request.phone_country_code ? `+${request.phone_country_code} ` : ''}{request.phone_number}</span>
                          </div>
                        )}
                        {request.email && (
                          <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300">
                            <Mail className="w-3.5 h-3.5 text-gray-400" />
                            <span className="truncate max-w-[180px]">{request.email}</span>
                          </div>
                        )}
                      </div>
                    </td>

                    {/* Status dropdown */}
                    <td className="px-4 py-3">
                      <select
                        value={request.status}
                        onChange={e => updateField(request.id, 'status', e.target.value)}
                        disabled={saving === request.id}
                        className={`px-2.5 py-1 rounded-full text-xs font-medium border-0 cursor-pointer ${STATUS_COLORS[request.status] || 'bg-gray-100 text-gray-800'} focus:ring-2 focus:ring-emerald-500`}
                      >
                        {STATUS_OPTIONS.map(s => (
                          <option key={s} value={s}>
                            {s.charAt(0).toUpperCase() + s.slice(1)}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* Shahada taken toggle */}
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => toggleShahadaTaken(request)}
                        disabled={saving === request.id}
                        className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${
                          request.shahada_taken
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-200 dark:hover:bg-emerald-900/50'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                        }`}
                        title={request.shahada_taken ? 'Mark as not taken' : 'Mark as taken'}
                      >
                        {request.shahada_taken ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                      </button>
                    </td>

                    {/* Shahada date */}
                    <td className="px-4 py-3">
                      {request.shahada_taken ? (
                        <input
                          type="date"
                          value={request.shahada_date ? new Date(request.shahada_date).toISOString().split('T')[0] : ''}
                          onChange={e =>
                            updateField(request.id, 'shahada_date', e.target.value ? new Date(e.target.value).toISOString() : null)
                          }
                          disabled={saving === request.id}
                          className="px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs">—</span>
                      )}
                    </td>

                    {/* Submitted date */}
                    <td className="px-4 py-3">
                      <span className="text-gray-500 dark:text-gray-400 text-xs">
                        {new Date(request.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </span>
                    </td>

                    {/* Notes */}
                    <td className="px-4 py-3">
                      {expandedNotes === request.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingNotes?.value ?? request.admin_notes ?? ''}
                            onChange={e =>
                              setEditingNotes({ id: request.id, value: e.target.value })
                            }
                            rows={3}
                            className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-xs focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                            placeholder="Add admin notes..."
                            autoFocus
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => saveNotes(request.id)}
                              disabled={saving === request.id}
                              className="px-3 py-1 text-xs bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
                            >
                              Save
                            </button>
                            <button
                              onClick={() => {
                                setExpandedNotes(null);
                                setEditingNotes(null);
                              }}
                              className="px-3 py-1 text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => {
                            setExpandedNotes(request.id);
                            setEditingNotes({ id: request.id, value: request.admin_notes || '' });
                          }}
                          className="text-left text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors max-w-[200px] truncate block"
                        >
                          {request.admin_notes || 'Click to add notes...'}
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
