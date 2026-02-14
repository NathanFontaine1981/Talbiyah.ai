import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { HMSPrebuilt } from '@100mslive/roomkit-react';
import { supabase } from '../../lib/supabase';
import TalbiyahLogo from '../../components/TalbiyahLogo';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';

interface CourseSessionInfo {
  id: string;
  session_number: number;
  title: string | null;
  room_code_host: string;
  room_code_guest: string;
  group_session_id: string;
  course_name: string;
  course_slug: string;
  teacher_id: string;
}

export default function CourseLiveRoom() {
  const { slug, sessionNumber } = useParams<{ slug: string; sessionNumber: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<CourseSessionInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTeacher, setIsTeacher] = useState(false);
  const [userName, setUserName] = useState('Student');
  const [userId, setUserId] = useState<string>('');

  useEffect(() => {
    loadSession();
  }, [slug, sessionNumber]);

  async function loadSession() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      setUserId(user.id);

      // Get user profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, roles')
        .eq('id', user.id)
        .single();

      if (profile?.full_name) {
        setUserName(profile.full_name);
      }

      const isAdmin = profile?.roles?.includes('admin');

      // Find the course by slug
      const { data: course, error: courseError } = await supabase
        .from('group_sessions')
        .select('id, name, slug, teacher_id, created_by')
        .eq('slug', slug)
        .single();

      if (courseError || !course) {
        setError('Course not found');
        return;
      }

      // Check if user is the teacher
      const userIsTeacher = isAdmin || user.id === course.teacher_id || user.id === course.created_by;
      setIsTeacher(userIsTeacher);

      // Find the session
      const { data: courseSession, error: sessionError } = await supabase
        .from('course_sessions')
        .select('id, session_number, title, room_code_host, room_code_guest, group_session_id')
        .eq('group_session_id', course.id)
        .eq('session_number', parseInt(sessionNumber || '0'))
        .single();

      if (sessionError || !courseSession) {
        setError('Session not found');
        return;
      }

      if (!courseSession.room_code_host || !courseSession.room_code_guest) {
        setError('Live room has not been set up for this session yet. The teacher needs to start the class first.');
        return;
      }

      setSession({
        ...courseSession,
        course_name: course.name,
        course_slug: course.slug,
        teacher_id: course.teacher_id,
      });

    } catch (err: any) {
      setError(err.message || 'Failed to load session');
    } finally {
      setLoading(false);
    }
  }

  async function handleLeaveRoom() {
    if (isTeacher && session) {
      // Teacher leaving — set live_status to ended
      await supabase
        .from('course_sessions')
        .update({ live_status: 'ended', updated_at: new Date().toISOString() })
        .eq('id', session.id);
    }

    navigate(`/course/${slug}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Joining class...</p>
        </div>
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Cannot Join Class</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'Session not available'}</p>
          <button
            onClick={() => navigate(`/course/${slug}`)}
            className="px-6 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition"
          >
            Back to Course
          </button>
        </div>
      </div>
    );
  }

  const roomCode = isTeacher ? session.room_code_host : session.room_code_guest;

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Minimal header */}
      <div className="h-14 bg-gray-800 border-b border-gray-700 flex items-center justify-between px-4 flex-shrink-0">
        <div className="flex items-center gap-3">
          <TalbiyahLogo size="sm" showText={false} linkTo="/dashboard" />
          <div className="hidden sm:block">
            <p className="text-white text-sm font-medium truncate max-w-xs">
              {session.course_name} — Session {session.session_number}
              {session.title && `: ${session.title}`}
            </p>
          </div>
        </div>

        <button
          onClick={handleLeaveRoom}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-lg transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Leave</span>
        </button>
      </div>

      {/* Video room */}
      <div className="flex-1 overflow-hidden">
        <HMSPrebuilt
          roomCode={roomCode}
          options={{
            userName: userName,
            userId: userId || `user_${Date.now()}`,
            endpoints: {
              roomLayout: 'https://api.100ms.live/v2/layouts/ui'
            },
            theme: {
              palette: {
                mode: 'dark',
                primary_default: '#10B981',
                primary_bright: '#34D399',
                primary_dim: '#059669',
                primary_disabled: '#A7F3D0',
                secondary_default: '#6B7280',
                secondary_bright: '#9CA3AF',
                secondary_dim: '#4B5563',
                secondary_disabled: '#D1D5DB',
                background_default: '#111827',
                background_dim: '#1F2937',
                surface_default: '#1F2937',
                surface_bright: '#374151',
                surface_brighter: '#4B5563',
                surface_dim: '#111827',
                on_primary_high: '#FFFFFF',
                on_primary_medium: '#E6FFFA',
                on_primary_low: '#D1FAE5',
                on_secondary_high: '#FFFFFF',
                on_secondary_medium: '#F3F4F6',
                on_secondary_low: '#E5E7EB',
                on_surface_high: '#F9FAFB',
                on_surface_medium: '#D1D5DB',
                on_surface_low: '#9CA3AF',
                border_default: '#374151',
                border_bright: '#4B5563',
              }
            }
          }}
          screens={{
            preview: {
              elements: {
                virtual_background: true,
                noise_cancellation: true,
              }
            },
            conferencing: {
              default: {
                elements: {
                  video_tile_layout: {
                    grid: {
                      enable_local_tile_inset: true,
                      prominent_roles: ['host'],
                      enable_spotlighting_peer: true,
                    }
                  },
                  participant_list: {
                    off_stage_roles: [],
                  },
                  emoji_reactions: true,
                  hand_raise: true,
                  chat: true,
                  noise_cancellation: true,
                  brb: true,
                }
              }
            }
          }}
          onLeaveRoom={handleLeaveRoom}
        />
      </div>
    </div>
  );
}
