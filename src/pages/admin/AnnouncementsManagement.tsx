import { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  Eye,
  EyeOff,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Announcement {
  id: string;
  title: string;
  description: string;
  tag: string;
  audience: string;
  is_active: boolean;
  published_at: string;
  created_at: string;
}

const AUDIENCE_OPTIONS = [
  { value: 'all', label: 'Everyone' },
  { value: 'students', label: 'Students Only' },
  { value: 'teachers', label: 'Teachers Only' },
  { value: 'parents', label: 'Parents Only' },
];

const TAG_OPTIONS = ['Update', 'New Feature', 'Important', 'Maintenance', 'Event'];

const AUDIENCE_BADGE: Record<string, string> = {
  all: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
  students: 'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300',
  teachers: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300',
  parents: 'bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300',
  admins: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300',
};

export default function AnnouncementsManagement() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Announcement | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tag, setTag] = useState('Update');
  const [audience, setAudience] = useState('all');
  const [isActive, setIsActive] = useState(true);
  const [publishedAt, setPublishedAt] = useState('');

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) throw error;
      setAnnouncements(data || []);
    } catch (err) {
      console.error('Error fetching announcements:', err);
      toast.error('Failed to load announcements');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  function resetForm() {
    setTitle('');
    setDescription('');
    setTag('Update');
    setAudience('all');
    setIsActive(true);
    setPublishedAt('');
    setEditing(null);
    setShowForm(false);
  }

  function openCreate() {
    resetForm();
    setPublishedAt(new Date().toISOString().slice(0, 16));
    setShowForm(true);
  }

  function openEdit(a: Announcement) {
    setEditing(a);
    setTitle(a.title);
    setDescription(a.description);
    setTag(a.tag);
    setAudience(a.audience);
    setIsActive(a.is_active);
    setPublishedAt(new Date(a.published_at).toISOString().slice(0, 16));
    setShowForm(true);
  }

  async function handleSave() {
    if (!title.trim() || !description.trim()) {
      toast.error('Title and description are required');
      return;
    }
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const payload = {
        title: title.trim(),
        description: description.trim(),
        tag,
        audience,
        is_active: isActive,
        published_at: publishedAt ? new Date(publishedAt).toISOString() : new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      if (editing) {
        const { error } = await supabase
          .from('announcements')
          .update(payload)
          .eq('id', editing.id);
        if (error) throw error;
        toast.success('Announcement updated');
      } else {
        const { error } = await supabase
          .from('announcements')
          .insert({ ...payload, created_by: user?.id || null });
        if (error) throw error;
        toast.success('Announcement published');
      }

      resetForm();
      fetchAnnouncements();
    } catch (err) {
      console.error('Error saving announcement:', err);
      toast.error('Failed to save announcement');
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(a: Announcement) {
    try {
      const { error } = await supabase
        .from('announcements')
        .update({ is_active: !a.is_active, updated_at: new Date().toISOString() })
        .eq('id', a.id);
      if (error) throw error;
      toast.success(a.is_active ? 'Announcement hidden' : 'Announcement published');
      fetchAnnouncements();
    } catch (err) {
      console.error('Error toggling announcement:', err);
      toast.error('Failed to update announcement');
    }
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    try {
      const { error } = await supabase
        .from('announcements')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success('Announcement deleted');
      fetchAnnouncements();
    } catch (err) {
      console.error('Error deleting announcement:', err);
      toast.error('Failed to delete announcement');
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-amber-100 dark:bg-amber-900/30 rounded-xl">
            <Megaphone className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Announcements</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Manage platform announcements shown on user dashboards
            </p>
          </div>
        </div>
        <button
          onClick={openCreate}
          className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Announcement
        </button>
      </div>

      {/* Create/Edit Form */}
      {showForm && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {editing ? 'Edit Announcement' : 'New Announcement'}
            </h2>
            <button
              onClick={resetForm}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. New AI Features Released"
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief description of the announcement..."
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-amber-500 focus:border-transparent resize-y"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Tag</label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {TAG_OPTIONS.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Audience</label>
                <select
                  value={audience}
                  onChange={(e) => setAudience(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                >
                  {AUDIENCE_OPTIONS.map((a) => (
                    <option key={a.value} value={a.value}>{a.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Publish Date</label>
                <input
                  type="datetime-local"
                  value={publishedAt}
                  onChange={(e) => setPublishedAt(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-amber-600 bg-gray-100 border-gray-300 rounded focus:ring-amber-500 dark:bg-gray-600 dark:border-gray-500"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Published (visible to users)</span>
            </label>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors disabled:opacity-50"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                {editing ? 'Update' : 'Publish'}
              </button>
              <button
                onClick={resetForm}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Announcements List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-amber-500" />
          <span className="ml-2 text-gray-500 dark:text-gray-400">Loading announcements...</span>
        </div>
      ) : announcements.length === 0 ? (
        <div className="text-center py-16 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl">
          <Megaphone className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">No announcements yet</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Create your first announcement to notify users on their dashboards.
          </p>
          <button
            onClick={openCreate}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-amber-500 text-white hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Announcement
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((a) => (
            <div
              key={a.id}
              className={`bg-white dark:bg-gray-800 border rounded-xl p-5 transition ${
                a.is_active
                  ? 'border-gray-200 dark:border-gray-700'
                  : 'border-gray-200 dark:border-gray-700 opacity-60'
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-50 text-amber-600 border border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800">
                      {a.tag}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${AUDIENCE_BADGE[a.audience] || AUDIENCE_BADGE.all}`}>
                      {AUDIENCE_OPTIONS.find((o) => o.value === a.audience)?.label || a.audience}
                    </span>
                    {!a.is_active && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                        Hidden
                      </span>
                    )}
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {format(new Date(a.published_at), 'dd MMM yyyy, HH:mm')}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{a.title}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{a.description}</p>
                </div>

                <div className="flex items-center gap-1.5 flex-shrink-0">
                  <button
                    onClick={() => handleToggleActive(a)}
                    title={a.is_active ? 'Hide' : 'Publish'}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    {a.is_active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => openEdit(a)}
                    className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(a.id)}
                    disabled={deleting === a.id}
                    className="p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deleting === a.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
