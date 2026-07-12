import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HMSPrebuilt } from '@100mslive/roomkit-react';
import { Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Admin joins a lesson's live 100ms room as a visible `host` for support/debugging.
// The auth token is minted server-side (admin-join-lesson) from the lesson's
// 100ms_room_id, so this works even when the teacher/student room codes are broken.
export default function AdminLessonMonitor() {
  const { lessonId } = useParams<{ lessonId: string }>();
  const navigate = useNavigate();

  const [authToken, setAuthToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string>('');
  const [adminName, setAdminName] = useState<string>('Admin');
  const [label, setLabel] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function join() {
      try {
        // Refresh the session first: on phones the tab often wakes with an expired
        // access token, and invoking with it gets a bare gateway 401 ("non-2xx")
        // that never reaches the function. getSession() triggers the refresh.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Your admin session has expired — please sign in again, then retry Join Room.');
        }

        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('full_name')
            .eq('id', user.id)
            .maybeSingle();
          if (!cancelled && profile?.full_name) setAdminName(profile.full_name);
        }

        const { data, error: fnError } = await supabase.functions.invoke('admin-join-lesson', {
          body: { lesson_id: lessonId },
        });

        if (fnError || (data && (data as { error?: string }).error)) {
          throw new Error((data as { error?: string })?.error || fnError?.message || 'Failed to join room');
        }

        if (!cancelled) {
          setAuthToken((data as { authToken: string }).authToken);
          setUserId((data as { user_id: string }).user_id);
          setLabel((data as { label?: string }).label || '');
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to join room');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    join();
    return () => { cancelled = true; };
  }, [lessonId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-emerald-400 mx-auto mb-4" />
          <p>Joining lesson room…</p>
        </div>
      </div>
    );
  }

  if (error || !authToken) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
        <div className="max-w-md text-center">
          <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-4" />
          <h1 className="text-xl font-semibold mb-2">Couldn't join the room</h1>
          <p className="text-gray-300 mb-6">{error || 'No room token was returned.'}</p>
          <button
            onClick={() => navigate('/admin/sessions')}
            className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg font-medium"
          >
            Back to Sessions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black">
      {/* Admin bar */}
      <div className="absolute top-0 left-0 right-0 z-[9999] bg-amber-500 text-black px-4 py-2 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => navigate('/admin/sessions')}
            className="p-1.5 hover:bg-black/10 rounded"
            aria-label="Leave and return to Sessions"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-sm font-semibold truncate">
            Admin monitoring{label ? `: ${label}` : ''}
          </span>
        </div>
        <span className="text-xs opacity-80 shrink-0 hidden sm:inline">You appear as “Admin ({adminName})”</span>
      </div>

      <div className="absolute inset-0 pt-10">
        {/* Layout comes from the room template (roomLayout endpoint); no custom
            `screens` override needed for admin monitoring. */}
        <HMSPrebuilt
          authToken={authToken}
          options={{
            userName: `Admin (${adminName})`,
            userId: userId,
            endpoints: {
              roomLayout: 'https://api.100ms.live/v2/layouts/ui',
            },
          }}
          onLeave={() => navigate('/admin/sessions')}
        />
      </div>
    </div>
  );
}
