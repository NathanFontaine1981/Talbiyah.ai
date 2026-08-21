import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ArrowLeft,
  PlayCircle,
  Plus,
  Trash2,
  Loader2,
  X,
  Bell,
  Mail,
  Check,
  User,
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import DashboardHeader from '../components/DashboardHeader';

interface Recommendation {
  id: string;
  title: string;
  youtube_url: string;
  note: string | null;
  recommended_by: string | null;
  created_at: string;
  notified_dashboard_at: string | null;
  notified_email_at: string | null;
  notified_email_count: number | null;
}

function getYouTubeId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default function TalbiyahRecommends() {
  const navigate = useNavigate();
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [sendingDashboard, setSendingDashboard] = useState<string | null>(null);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');
  const [newNote, setNewNote] = useState('');
  const [newRecommendedBy, setNewRecommendedBy] = useState('Nathan Fontaine');

  useEffect(() => {
    fetchRecommendations();
    checkAdmin();
  }, []);

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: profile } = await supabase
        .from('profiles')
        .select('roles')
        .eq('id', user.id)
        .single();
      setIsAdmin(!!profile?.roles?.includes('admin'));
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

  async function fetchRecommendations() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('curated_recommendations')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        if (error.code === 'PGRST205' || error.code === '42P01') {
          setRecommendations([]);
          return;
        }
        throw error;
      }
      setRecommendations(data || []);
    } catch (error: any) {
      console.error('Error fetching recommendations:', error);
      setRecommendations([]);
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd() {
    if (!newTitle.trim() || !newUrl.trim()) {
      toast.error('Please add a title and a YouTube link.');
      return;
    }
    if (!getYouTubeId(newUrl.trim())) {
      toast.error('That doesn\'t look like a valid YouTube link.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase.from('curated_recommendations').insert({
        title: newTitle.trim(),
        youtube_url: newUrl.trim(),
        note: newNote.trim() || null,
        recommended_by: newRecommendedBy.trim() || null,
        created_by: user?.id || null,
      });

      if (error) throw error;

      toast.success('Added to Talbiyah Recommends!');
      setNewTitle('');
      setNewUrl('');
      setNewNote('');
      setShowAddForm(false);
      fetchRecommendations();
    } catch (error: any) {
      console.error('Error adding recommendation:', error);
      toast.error('Error adding: ' + error.message);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!isAdmin) return;
    if (!confirm('Remove this recommendation? This cannot be undone.')) return;

    setDeleting(id);
    try {
      const { error } = await supabase.from('curated_recommendations').delete().eq('id', id);
      if (error) throw error;
      setRecommendations(prev => prev.filter(r => r.id !== id));
    } catch (error: any) {
      console.error('Error deleting recommendation:', error);
      toast.error('Error deleting: ' + error.message);
    } finally {
      setDeleting(null);
    }
  }

  function updateNotifyState(id: string, patch: Partial<Recommendation>) {
    setRecommendations(prev => prev.map(r => (r.id === id ? { ...r, ...patch } : r)));
  }

  async function sendToDashboards(rec: Recommendation) {
    if (!isAdmin) return;
    setSendingDashboard(rec.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-talbiyah-recommends`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendation_id: rec.id,
            title: rec.title,
            recommended_by: rec.recommended_by,
            notification_type: 'dashboard'
          })
        }
      );
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Failed to send notifications');

      updateNotifyState(rec.id, { notified_dashboard_at: new Date().toISOString() });
      toast.success(`Dashboard notification sent to ${result.user_count || 'all'} users!`);
    } catch (error: any) {
      console.error('Error sending dashboard notifications:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSendingDashboard(null);
    }
  }

  async function sendEmail(rec: Recommendation) {
    if (!isAdmin) return;
    setSendingEmail(rec.id);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/notify-talbiyah-recommends`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recommendation_id: rec.id,
            title: rec.title,
            note: rec.note,
            recommended_by: rec.recommended_by,
            notification_type: 'email'
          })
        }
      );
      const result = await response.json();
      if (!response.ok || result.error) throw new Error(result.error || 'Failed to send emails');

      updateNotifyState(rec.id, {
        notified_email_at: new Date().toISOString(),
        notified_email_count: result.email_count || 0
      });
      toast.success(`Emailed ${result.email_count || 0} users who opted in!`);
    } catch (error: any) {
      console.error('Error sending email notifications:', error);
      toast.error(`Error: ${error.message}`);
    } finally {
      setSendingEmail(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />

      <main className="max-w-5xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header banner */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center flex-shrink-0">
              <PlayCircle className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">Talbiyah Recommends</h1>
              <p className="text-white/80 text-sm">Videos worth your time, hand-picked for you</p>
            </div>
            {isAdmin && (
              <button
                onClick={() => setShowAddForm(v => !v)}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg text-sm font-semibold transition"
              >
                <Plus className="w-4 h-4" /> Add Video
              </button>
            )}
          </div>
        </div>

        {/* Admin: add form */}
        {isAdmin && showAddForm && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6 mb-6">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Add a recommendation</h2>
            <div className="space-y-3">
              <input
                type="text"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="Title"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <input
                type="text"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                placeholder="YouTube link (e.g. https://youtube.com/watch?v=...)"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <textarea
                value={newNote}
                onChange={e => setNewNote(e.target.value)}
                placeholder="Why is this worth watching? (optional)"
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm resize-none"
              />
              <input
                type="text"
                value={newRecommendedBy}
                onChange={e => setNewRecommendedBy(e.target.value)}
                placeholder="Recommended by"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
              <button
                onClick={handleAdd}
                disabled={saving}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                {saving ? 'Adding...' : 'Add Recommendation'}
              </button>
            </div>
          </div>
        )}

        {/* Grid */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-emerald-500 animate-spin mx-auto mb-4" />
          </div>
        ) : recommendations.length === 0 ? (
          <div className="text-center py-16">
            <PlayCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">Nothing here yet</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Check back soon for hand-picked videos.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendations.map(rec => {
              const ytId = getYouTubeId(rec.youtube_url);
              return (
                <div
                  key={rec.id}
                  className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:border-emerald-400 hover:shadow-md transition"
                >
                  <button
                    onClick={() => ytId && setPlayingId(rec.id)}
                    className="relative w-full aspect-video bg-black group"
                  >
                    {ytId ? (
                      <img
                        src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                        alt={rec.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white/60 text-sm">
                        Invalid video link
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition flex items-center justify-center">
                      <PlayCircle className="w-12 h-12 text-white drop-shadow-lg" />
                    </div>
                  </button>

                  <div className="p-4">
                    <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1 line-clamp-2">{rec.title}</h3>
                    {rec.recommended_by && (
                      <div className="flex items-center text-xs text-gray-500 dark:text-gray-400 mb-2">
                        <User className="w-3.5 h-3.5 mr-1" />
                        Recommended by {rec.recommended_by}
                      </div>
                    )}
                    {rec.note && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-3">{rec.note}</p>
                    )}
                  </div>

                  {isAdmin && (
                    <div className="px-4 pb-4 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          onClick={() => sendToDashboards(rec)}
                          disabled={sendingDashboard === rec.id}
                          className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                            rec.notified_dashboard_at
                              ? 'bg-blue-50 dark:bg-blue-900/30 border border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-300'
                              : 'bg-blue-500 hover:bg-blue-600 text-white'
                          }`}
                        >
                          {sendingDashboard === rec.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : rec.notified_dashboard_at ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Bell className="w-3.5 h-3.5" />
                          )}
                          {rec.notified_dashboard_at ? 'Sent' : 'Notify'}
                        </button>
                        <button
                          onClick={() => sendEmail(rec)}
                          disabled={sendingEmail === rec.id}
                          className={`flex items-center justify-center gap-1.5 px-2 py-2 rounded-lg text-xs font-semibold transition disabled:opacity-50 ${
                            rec.notified_email_at
                              ? 'bg-violet-50 dark:bg-violet-900/30 border border-violet-300 dark:border-violet-700 text-violet-700 dark:text-violet-300'
                              : 'bg-violet-500 hover:bg-violet-600 text-white'
                          }`}
                        >
                          {sendingEmail === rec.id ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : rec.notified_email_at ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <Mail className="w-3.5 h-3.5" />
                          )}
                          {rec.notified_email_at ? `Emailed ${rec.notified_email_count ?? ''}` : 'Email'}
                        </button>
                      </div>
                      <button
                        onClick={() => handleDelete(rec.id)}
                        disabled={deleting === rec.id}
                        className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition disabled:opacity-50"
                      >
                        {deleting === rec.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Playback modal */}
      {playingId && (() => {
        const rec = recommendations.find(r => r.id === playingId);
        const ytId = rec ? getYouTubeId(rec.youtube_url) : null;
        if (!rec || !ytId) return null;
        return (
          <div
            className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
            onClick={() => setPlayingId(null)}
          >
            <div className="w-full max-w-3xl" onClick={e => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-semibold">{rec.title}</h3>
                <button onClick={() => setPlayingId(null)} className="text-white/70 hover:text-white">
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="relative w-full rounded-xl overflow-hidden" style={{ paddingTop: '56.25%' }}>
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube.com/embed/${ytId}?rel=0&modestbranding=1&autoplay=1`}
                  title={rec.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
