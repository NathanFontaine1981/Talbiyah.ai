import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  MessageSquare,
  ArrowLeft,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  Filter,
  RefreshCw,
  User,
  Calendar
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';

interface Feedback {
  id: string;
  user_id: string;
  category: string;
  subject: string;
  message: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
  resolved_at: string | null;
  user_email?: string;
  user_name?: string;
}

const categoryEmojis: Record<string, string> = {
  suggestion: '💡',
  bug: '🐛',
  feature_request: '✨',
  complaint: '😔',
  praise: '🌟',
  other: '💬'
};

const statusColors: Record<string, string> = {
  pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  in_review: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  resolved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  wont_fix: 'bg-gray-500/20 text-gray-500 border-gray-300/30',
  duplicate: 'bg-purple-500/20 text-purple-400 border-purple-500/30'
};

const statusLabels: Record<string, string> = {
  pending: 'Pending',
  in_review: 'In Review',
  resolved: 'Resolved',
  wont_fix: "Won't Fix",
  duplicate: 'Duplicate'
};

export default function FeedbackManagement() {
  const navigate = useNavigate();
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [adminNotes, setAdminNotes] = useState('');
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadFeedback();
  }, [statusFilter, categoryFilter]);

  async function loadFeedback() {
    setLoading(true);
    try {
      let query = supabase
        .from('user_feedback')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user details for each feedback
      const feedbackWithUsers = await Promise.all(
        (data || []).map(async (item) => {
          if (item.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('full_name, email')
              .eq('id', item.user_id)
              .single();

            return {
              ...item,
              user_name: profile?.full_name || 'Unknown',
              user_email: profile?.email || 'No email'
            };
          }
          return { ...item, user_name: 'Anonymous', user_email: 'N/A' };
        })
      );

      setFeedback(feedbackWithUsers);
    } catch (err) {
      console.error('Error loading feedback:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateFeedbackStatus(id: string, newStatus: string) {
    setUpdating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      const updateData: Record<string, unknown> = {
        status: newStatus,
        updated_at: new Date().toISOString(),
        admin_notes: adminNotes || null
      };

      if (newStatus === 'resolved') {
        updateData.resolved_at = new Date().toISOString();
        updateData.resolved_by = user?.id;
      }

      const { error } = await supabase
        .from('user_feedback')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Update local state
      setFeedback(prev => prev.map(f =>
        f.id === id
          ? { ...f, status: newStatus, admin_notes: adminNotes || f.admin_notes }
          : f
      ));

      setSelectedFeedback(null);
      setAdminNotes('');
    } catch (err) {
      console.error('Error updating feedback:', err);
    } finally {
      setUpdating(false);
    }
  }

  const pendingCount = feedback.filter(f => f.status === 'pending').length;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-800 text-gray-900 dark:text-white">
      {/* Header */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => navigate('/admin')}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center space-x-2">
                  <MessageSquare className="w-6 h-6 text-purple-400" />
                  <span>Feedback Management</span>
                </h1>
                <p className="text-gray-600 dark:text-gray-400 text-sm">Review and respond to user feedback</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {pendingCount > 0 && (
                <div className="bg-yellow-500/20 border border-yellow-500/30 px-3 py-1.5 rounded-lg">
                  <span className="text-yellow-400 text-sm font-medium">
                    {pendingCount} pending
                  </span>
                </div>
              )}
              <button
                onClick={loadFeedback}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            <span className="text-sm text-gray-600 dark:text-gray-400">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="in_review">In Review</option>
              <option value="resolved">Resolved</option>
              <option value="wont_fix">Won't Fix</option>
              <option value="duplicate">Duplicate</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Category:</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white text-sm focus:outline-none focus:border-purple-500"
            >
              <option value="all">All</option>
              <option value="suggestion">Suggestions</option>
              <option value="bug">Bug Reports</option>
              <option value="feature_request">Feature Requests</option>
              <option value="complaint">Complaints</option>
              <option value="praise">Praise</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        {/* Feedback List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : feedback.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4">
              <MessageSquare className="w-8 h-8 text-gray-600 dark:text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Feedback Yet</h3>
            <p className="text-gray-600 dark:text-gray-400">User feedback will appear here</p>
          </div>
        ) : (
          <div className="space-y-4">
            {feedback.map((item) => (
              <div
                key={item.id}
                className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-gray-200 dark:hover:border-gray-600 transition cursor-pointer"
                onClick={() => {
                  setSelectedFeedback(item);
                  setAdminNotes(item.admin_notes || '');
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{categoryEmojis[item.category] || '💬'}</span>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{item.subject}</h3>
                      <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="w-3 h-3" />
                        <span>{item.user_name}</span>
                        <span>•</span>
                        <Calendar className="w-3 h-3" />
                        <span>{format(new Date(item.created_at), 'MMM d, yyyy h:mm a')}</span>
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColors[item.status]}`}>
                    {statusLabels[item.status]}
                  </span>
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm line-clamp-2">{item.message}</p>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Detail Modal */}
      {selectedFeedback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setSelectedFeedback(null)}
          />
          <div className="relative bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <span className="text-3xl">{categoryEmojis[selectedFeedback.category]}</span>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">{selectedFeedback.subject}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      From {selectedFeedback.user_name} • {format(new Date(selectedFeedback.created_at), 'PPpp')}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedFeedback(null)}
                  className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Message</label>
                <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4 text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {selectedFeedback.message}
                </div>
              </div>

              {/* Current Status */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Current Status</label>
                <span className={`inline-flex px-3 py-1.5 rounded-lg text-sm font-medium border ${statusColors[selectedFeedback.status]}`}>
                  {statusLabels[selectedFeedback.status]}
                </span>
              </div>

              {/* Admin Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Admin Notes</label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Add internal notes about this feedback..."
                  rows={3}
                  className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:border-purple-500 resize-none"
                />
              </div>

              {/* Status Actions */}
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">Update Status</label>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => updateFeedbackStatus(selectedFeedback.id, 'in_review')}
                    disabled={updating || selectedFeedback.status === 'in_review'}
                    className="px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg font-medium transition disabled:opacity-50 flex items-center space-x-2"
                  >
                    <Clock className="w-4 h-4" />
                    <span>In Review</span>
                  </button>
                  <button
                    onClick={() => updateFeedbackStatus(selectedFeedback.id, 'resolved')}
                    disabled={updating || selectedFeedback.status === 'resolved'}
                    className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg font-medium transition disabled:opacity-50 flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Resolved</span>
                  </button>
                  <button
                    onClick={() => updateFeedbackStatus(selectedFeedback.id, 'wont_fix')}
                    disabled={updating || selectedFeedback.status === 'wont_fix'}
                    className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 text-gray-500 rounded-lg font-medium transition disabled:opacity-50 flex items-center space-x-2"
                  >
                    <XCircle className="w-4 h-4" />
                    <span>Won't Fix</span>
                  </button>
                  <button
                    onClick={() => updateFeedbackStatus(selectedFeedback.id, 'duplicate')}
                    disabled={updating || selectedFeedback.status === 'duplicate'}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg font-medium transition disabled:opacity-50 flex items-center space-x-2"
                  >
                    <AlertCircle className="w-4 h-4" />
                    <span>Duplicate</span>
                  </button>
                </div>
              </div>

              {updating && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-6 h-6 text-purple-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
