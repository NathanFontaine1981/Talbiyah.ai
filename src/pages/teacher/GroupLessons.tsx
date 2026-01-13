import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Users,
  Calendar,
  Clock,
  Video,
  BookOpen,
  Award,
  ExternalLink,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  ClipboardList,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { GROUP_LESSON_TIERS } from '../../data/locationConstants';

interface GroupSession {
  id: string;
  name: string;
  subject?: { name: string };
  level: string;
  max_participants: number;
  current_participants: number;
  schedule_day: string;
  schedule_time: string;
  duration_minutes: number;
  start_date: string;
  end_date?: string;
  status: string;
  description?: string;
  teacher_room_code?: string;
  student_room_code?: string;
  '100ms_room_id'?: string;
}

interface Participant {
  id: string;
  student_id: string;
  student?: { full_name: string; email: string };
  enrolled_at: string;
}

interface TeacherGroupInfo {
  enabled: boolean;
  tier: string | null;
  hourlyRate: number | null;
}

export default function GroupLessons() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [groupInfo, setGroupInfo] = useState<TeacherGroupInfo>({
    enabled: false,
    tier: null,
    hourlyRate: null,
  });
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();
      if (userError || !user) {
        navigate('/');
        return;
      }

      // Check if teacher is group-enabled
      const { data: teacherProfile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('group_lesson_enabled, group_lesson_tier, group_lesson_hourly_rate')
        .eq('user_id', user.id)
        .single();

      if (profileError || !teacherProfile) {
        toast.error('Teacher profile not found');
        navigate('/teacher/hub');
        return;
      }

      setGroupInfo({
        enabled: teacherProfile.group_lesson_enabled || false,
        tier: teacherProfile.group_lesson_tier,
        hourlyRate: teacherProfile.group_lesson_hourly_rate,
      });

      if (!teacherProfile.group_lesson_enabled) {
        setLoading(false);
        return;
      }

      // Fetch teacher's group sessions
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('group_sessions')
        .select(`
          *,
          subject:subjects(name)
        `)
        .eq('teacher_id', user.id)
        .order('start_date', { ascending: true });

      if (sessionsError) throw sessionsError;

      setSessions(sessionsData || []);
    } catch (error) {
      console.error('Error loading group lessons:', error);
      toast.error('Failed to load group lessons');
    } finally {
      setLoading(false);
    }
  }

  async function fetchParticipants(sessionId: string) {
    if (participants[sessionId]) return;

    try {
      const { data, error } = await supabase
        .from('group_session_participants')
        .select(`
          *,
          student:profiles!student_id(full_name, email)
        `)
        .eq('group_session_id', sessionId);

      if (error) throw error;

      setParticipants((prev) => ({ ...prev, [sessionId]: data || [] }));
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  }

  function toggleSession(sessionId: string) {
    if (expandedSession === sessionId) {
      setExpandedSession(null);
    } else {
      setExpandedSession(sessionId);
      fetchParticipants(sessionId);
    }
  }

  function copyToClipboard(text: string, id: string) {
    navigator.clipboard.writeText(text);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2000);
    toast.success('Room code copied!');
  }

  function getSubjectIcon(name: string) {
    if (name?.toLowerCase().includes('quran')) return '📗';
    if (name?.toLowerCase().includes('tadabbur')) return '📕';
    if (name?.toLowerCase().includes('islamic')) return '🕌';
    if (name?.toLowerCase().includes('seerah')) return '📜';
    return '📚';
  }

  function getNextSessionDate(session: GroupSession): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const targetDay = days.indexOf(session.schedule_day);
    const today = new Date();
    const currentDay = today.getDay();

    let daysUntilNext = targetDay - currentDay;
    if (daysUntilNext <= 0) daysUntilNext += 7;

    const nextDate = new Date(today);
    nextDate.setDate(today.getDate() + daysUntilNext);

    return format(nextDate, 'EEEE, MMMM d');
  }

  const tierInfo = groupInfo.tier
    ? GROUP_LESSON_TIERS[groupInfo.tier as keyof typeof GROUP_LESSON_TIERS]
    : null;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!groupInfo.enabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-6 py-12">
          <button
            onClick={() => navigate('/teacher/hub')}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Teacher Hub</span>
          </button>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/20">
            <Users className="w-16 h-16 mx-auto mb-6 text-gray-500" />
            <h1 className="text-3xl font-bold mb-4">Group Lessons Not Enabled</h1>
            <p className="text-gray-400 mb-6 max-w-md mx-auto">
              You are not currently enabled for group lessons. Group lessons are available for UK-based teachers
              and require admin approval.
            </p>
            <p className="text-sm text-gray-500">
              Contact the admin team if you believe you should be eligible for group lessons.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/teacher/hub')}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Teacher Hub</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Users className="w-10 h-10 text-emerald-400" />
                My Group Lessons
              </h1>
              <p className="text-gray-400">Manage your group lesson sessions and students</p>
            </div>

            {/* Tier Badge */}
            {tierInfo && (
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-6 py-4 border border-emerald-400/30">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{tierInfo.icon}</span>
                  <div>
                    <p className="text-sm text-gray-400">Your Tier</p>
                    <p className="text-lg font-bold text-white">{tierInfo.name}</p>
                    <p className="text-emerald-400 font-semibold">£{groupInfo.hourlyRate}/hr</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
            <div className="flex items-center gap-3">
              <Calendar className="w-6 h-6 text-blue-400" />
              <div>
                <p className="text-sm text-gray-400">Active Sessions</p>
                <p className="text-2xl font-bold">{sessions.filter((s) => s.status === 'open').length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
            <div className="flex items-center gap-3">
              <Users className="w-6 h-6 text-emerald-400" />
              <div>
                <p className="text-sm text-gray-400">Total Students</p>
                <p className="text-2xl font-bold">
                  {sessions.reduce((sum, s) => sum + (s.current_participants || 0), 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-5 border border-white/20">
            <div className="flex items-center gap-3">
              <Award className="w-6 h-6 text-amber-400" />
              <div>
                <p className="text-sm text-gray-400">Potential Earnings</p>
                <p className="text-2xl font-bold text-emerald-400">
                  £{(sessions.filter((s) => s.status === 'open').length * (groupInfo.hourlyRate || 0)).toFixed(0)}/week
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Sessions List */}
        {sessions.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">No Group Sessions Assigned</h3>
            <p className="text-gray-400">
              You don't have any group sessions assigned yet. The admin will assign sessions to you.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => {
              const isExpanded = expandedSession === session.id;
              const sessionParticipants = participants[session.id] || [];
              const hasRoom = session['100ms_room_id'] && session.teacher_room_code;

              return (
                <div
                  key={session.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden"
                >
                  {/* Session Header */}
                  <div
                    className="p-6 cursor-pointer hover:bg-white/5 transition"
                    onClick={() => toggleSession(session.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <span className="text-4xl">{getSubjectIcon(session.subject?.name || '')}</span>
                        <div>
                          <h3 className="text-xl font-bold text-white mb-1">{session.name}</h3>
                          <p className="text-gray-400 text-sm mb-2">{session.subject?.name || 'General'}</p>
                          <div className="flex flex-wrap gap-3 text-sm">
                            <span className="flex items-center gap-1 text-gray-300">
                              <Calendar className="w-4 h-4 text-blue-400" />
                              {session.schedule_day}s at {session.schedule_time}
                            </span>
                            <span className="flex items-center gap-1 text-gray-300">
                              <Clock className="w-4 h-4 text-purple-400" />
                              {session.duration_minutes} min
                            </span>
                            <span className="flex items-center gap-1 text-gray-300">
                              <Users className="w-4 h-4 text-emerald-400" />
                              {session.current_participants || 0}/{session.max_participants} students
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            session.status === 'open'
                              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                              : session.status === 'full'
                              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              : 'bg-gray-500/20 text-gray-400 border border-gray-500/30'
                          }`}
                        >
                          {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                        </span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-6 pb-6 border-t border-white/10">
                      {/* Next Session */}
                      <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                        <p className="text-blue-400 text-sm font-semibold mb-1">Next Session</p>
                        <p className="text-white">{getNextSessionDate(session)} at {session.schedule_time}</p>
                      </div>

                      {/* Video Room */}
                      {hasRoom ? (
                        <div className="mb-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-2">
                              <Video className="w-5 h-5 text-emerald-400" />
                              <span className="text-emerald-400 font-semibold">Video Room Ready</span>
                            </div>
                            <a
                              href={`https://talbiyah.app.100ms.live/meeting/${session.teacher_room_code}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Join Room
                            </a>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-400">Room Code:</span>
                            <code className="px-2 py-1 bg-white/10 rounded text-sm text-white">
                              {session.teacher_room_code}
                            </code>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(session.teacher_room_code!, session.id);
                              }}
                              className="text-gray-400 hover:text-white"
                            >
                              {copiedCode === session.id ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mb-4 p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
                          <p className="text-amber-400 text-sm">
                            Video room not created yet. Admin will set this up before your first session.
                          </p>
                        </div>
                      )}

                      {/* Participants */}
                      <div className="mb-4">
                        <h4 className="text-sm font-semibold text-gray-400 mb-3">
                          Enrolled Students ({sessionParticipants.length})
                        </h4>
                        {sessionParticipants.length === 0 ? (
                          <p className="text-gray-500 text-sm">No students enrolled yet</p>
                        ) : (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                            {sessionParticipants.map((p, index) => (
                              <div
                                key={p.id}
                                className="flex items-center gap-3 p-3 bg-white/5 rounded-lg"
                              >
                                <span className="w-6 h-6 bg-emerald-500/20 rounded-full flex items-center justify-center text-xs text-emerald-400">
                                  {index + 1}
                                </span>
                                <div>
                                  <p className="text-white text-sm font-medium">
                                    {(p.student as any)?.full_name || 'Unknown'}
                                  </p>
                                  <p className="text-gray-500 text-xs">
                                    {(p.student as any)?.email || ''}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex gap-3">
                        <button
                          onClick={() => navigate(`/teacher/group-homework/${session.id}`)}
                          className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-400 rounded-lg text-sm font-semibold transition flex items-center gap-2"
                        >
                          <ClipboardList className="w-4 h-4" />
                          Manage Homework
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
