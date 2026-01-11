import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Lightbulb,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  Loader2,
  Filter,
  RefreshCw,
  User,
  Calendar,
  Mail,
  Sparkles,
  Bug,
  BookOpen,
  Palette,
  GraduationCap,
  HelpCircle,
  ChevronDown,
  MessageSquare
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';

interface Suggestion {
  id: string;
  user_id: string | null;
  name: string | null;
  email: string | null;
  category: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  admin_notes: string | null;
  upvotes: number;
  created_at: string;
  updated_at: string;
  profiles?: {
    full_name: string;
    email: string;
  };
}

const categoryConfig: Record<string, { label: string; icon: typeof Lightbulb; color: string }> = {
  feature_request: { label: 'Feature Request', icon: Sparkles, color: 'text-purple-500 bg-purple-50' },
  bug_report: { label: 'Bug Report', icon: Bug, color: 'text-red-500 bg-red-50' },
  content_suggestion: { label: 'Content', icon: BookOpen, color: 'text-blue-500 bg-blue-50' },
  ui_improvement: { label: 'UI/UX', icon: Palette, color: 'text-pink-500 bg-pink-50' },
  teacher_feedback: { label: 'Teacher', icon: GraduationCap, color: 'text-emerald-500 bg-emerald-50' },
  other: { label: 'Other', icon: HelpCircle, color: 'text-gray-500 bg-gray-50' },
};

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-700 border-yellow-200' },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  planned: { label: 'Planned', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  in_progress: { label: 'In Progress', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  completed: { label: 'Completed', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  declined: { label: 'Declined', color: 'bg-gray-100 text-gray-700 border-gray-200' },
};

export default function AdminSuggestions() {
  const navigate = useNavigate();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [adminNotes, setAdminNotes] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadSuggestions();
  }, [filterStatus, filterCategory]);

  async function loadSuggestions() {
    setLoading(true);
    try {
      let query = supabase
        .from('suggestions')
        .select(`
          *,
          profiles:user_id (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }
      if (filterCategory !== 'all') {
        query = query.eq('category', filterCategory);
      }

      const { data, error } = await query;

      if (error) throw error;
      setSuggestions(data || []);
    } catch (err) {
      console.error('Error loading suggestions:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateSuggestion() {
    if (!selectedSuggestion) return;

    setSaving(true);
    try {
      const updates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };

      if (adminNotes !== (selectedSuggestion.admin_notes || '')) {
        updates.admin_notes = adminNotes;
      }
      if (newStatus && newStatus !== selectedSuggestion.status) {
        updates.status = newStatus;
      }

      const { error } = await supabase
        .from('suggestions')
        .update(updates)
        .eq('id', selectedSuggestion.id);

      if (error) throw error;

      setSelectedSuggestion(null);
      loadSuggestions();
    } catch (err) {
      console.error('Error updating suggestion:', err);
      alert('Failed to update suggestion');
    } finally {
      setSaving(false);
    }
  }

  function openSuggestion(suggestion: Suggestion) {
    setSelectedSuggestion(suggestion);
    setAdminNotes(suggestion.admin_notes || '');
    setNewStatus(suggestion.status);
  }

  const pendingCount = suggestions.filter(s => s.status === 'pending').length;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <Lightbulb className="w-6 h-6 text-amber-500" />
                  User Suggestions
                  {pendingCount > 0 && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-sm rounded-full">
                      {pendingCount} new
                    </span>
                  )}
                </h1>
                <p className="text-sm text-gray-500">Review and manage user feedback</p>
              </div>
            </div>

            <button
              onClick={loadSuggestions}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              title="Refresh"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Filters */}
          <div className="flex gap-4 mt-4">
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Statuses</option>
              {Object.entries(statusConfig).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryConfig).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
          </div>
        ) : suggestions.length === 0 ? (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <MessageSquare className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Suggestions Yet</h3>
            <p className="text-gray-500">User suggestions will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {suggestions.map((suggestion) => {
              const category = categoryConfig[suggestion.category] || categoryConfig.other;
              const status = statusConfig[suggestion.status] || statusConfig.pending;
              const CategoryIcon = category.icon;

              return (
                <div
                  key={suggestion.id}
                  onClick={() => openSuggestion(suggestion)}
                  className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition cursor-pointer"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${category.color}`}>
                      <CategoryIcon className="w-5 h-5" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h3 className="font-semibold text-gray-900">{suggestion.title}</h3>
                          <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                            {suggestion.description}
                          </p>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
                          {status.label}
                        </span>
                      </div>

                      <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {suggestion.profiles?.full_name || suggestion.name || 'Anonymous'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(suggestion.created_at), 'MMM d, yyyy')}
                        </span>
                        <span className={`px-2 py-0.5 rounded ${category.color} text-xs`}>
                          {category.label}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedSuggestion && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${categoryConfig[selectedSuggestion.category]?.color || 'bg-gray-50'}`}>
                    {categoryConfig[selectedSuggestion.category]?.label || 'Other'}
                  </span>
                  <h2 className="text-xl font-bold text-gray-900 mt-2">{selectedSuggestion.title}</h2>
                </div>
                <button
                  onClick={() => setSelectedSuggestion(null)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-4">
                <p className="text-gray-700 whitespace-pre-wrap">{selectedSuggestion.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                <div>
                  <span className="text-gray-500">Submitted by:</span>
                  <p className="font-medium">
                    {selectedSuggestion.profiles?.full_name || selectedSuggestion.name || 'Anonymous'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">
                    {selectedSuggestion.profiles?.email || selectedSuggestion.email || 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Submitted:</span>
                  <p className="font-medium">
                    {format(new Date(selectedSuggestion.created_at), 'MMM d, yyyy h:mm a')}
                  </p>
                </div>
                <div>
                  <span className="text-gray-500">Current Status:</span>
                  <p className="font-medium">{statusConfig[selectedSuggestion.status]?.label}</p>
                </div>
              </div>

              {/* Update Form */}
              <div className="border-t border-gray-200 pt-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Update Status
                  </label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500"
                  >
                    {Object.entries(statusConfig).map(([value, { label }]) => (
                      <option key={value} value={value}>{label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Admin Notes (internal)
                  </label>
                  <textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    rows={3}
                    placeholder="Add notes about this suggestion..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedSuggestion(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateSuggestion}
                    disabled={saving}
                    className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
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
