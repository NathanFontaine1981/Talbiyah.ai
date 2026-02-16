import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import {
  BookOpen,
  Calendar,
  MapPin,
  Users,
  Clock,
  CheckCircle,
  Lock,
  Loader,

  ChevronRight,
  User,
  Globe,
  Wifi,
  ArrowLeft,
  Home,
  Bell,
  Settings,
  Radio,
  Video,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { useCourseNotesAccess } from '../../hooks/useCourseNotesAccess';

interface CourseSession {
  id: string;
  session_number: number;
  title: string | null;
  session_date: string | null;
  status: string;
  live_status: string | null;
  room_code_guest: string | null;
}

interface CourseInsight {
  id: string;
  course_session_id: string;
  title: string | null;
}

interface CourseData {
  id: string;
  name: string;
  description: string | null;
  slug: string;

  poster_url: string | null;
  location: string | null;
  delivery_mode: string;
  is_public: boolean;
  start_date: string | null;
  end_date: string | null;
  schedule_day: string;
  schedule_time: string;
  duration_minutes: number;
  current_participants: number;
  max_participants: number;
  teacher_id: string | null;
  created_by: string | null;
  teacher: { full_name: string; avatar_url?: string } | null;
  gender_restriction: string | null;
}

export default function CoursePage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [insights, setInsights] = useState<CourseInsight[]>([]);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [isTeacher, setIsTeacher] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const [userGender, setUserGender] = useState<string | null>(null);

  const { hasAccess: hasNotesAccess, notesPricePounds, isTeacherOrAdmin: isNotesAdmin } = useCourseNotesAccess(course?.id || null);

  useEffect(() => {
    fetchCourse();
  }, [slug]);

  // Realtime subscription: auto-update when teacher starts/ends a live session
  useEffect(() => {
    if (!course?.id) return;
    const channel = supabase
      .channel(`course-sessions-${course.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'course_sessions',
          filter: `group_session_id=eq.${course.id}`,
        },
        (payload) => {
          const updated = payload.new as CourseSession;
          setSessions((prev) =>
            prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [course?.id]);

  useEffect(() => {
    if (searchParams.get('notes_unlocked') === 'true') {
      toast.success('Study notes unlocked! You now have access to all session notes.');
    }
  }, [searchParams]);

  async function fetchCourse() {
    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Fetch course by slug
      const { data: courseData, error: courseError } = await supabase
        .from('group_sessions')
        .select(`
          id, name, description, slug, poster_url, location,
          delivery_mode, is_public, start_date, end_date, schedule_day,
          schedule_time, duration_minutes, current_participants, max_participants,
          teacher_id, created_by, gender_restriction,
          teacher:profiles!group_sessions_teacher_id_fkey (full_name, avatar_url)
        `)
        .eq('slug', slug)
        .single();

      if (courseError || !courseData) {
        toast.error('Course not found');
        navigate('/');
        return;
      }

      setCourse(courseData as unknown as CourseData);

      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from('course_sessions')
        .select('id, session_number, title, session_date, status, live_status, room_code_guest')
        .eq('group_session_id', courseData.id)
        .order('session_number', { ascending: true });

      setSessions(sessionsData || []);

      // Fetch insights for published sessions
      const { data: insightsData } = await supabase
        .from('course_insights')
        .select('id, course_session_id, title')
        .eq('group_session_id', courseData.id);

      setInsights(insightsData || []);

      // Check enrollment
      if (user) {
        const { data: enrollment } = await supabase
          .from('group_session_participants')
          .select('id')
          .eq('group_session_id', courseData.id)
          .eq('student_id', user.id)
          .limit(1);

        setIsEnrolled(enrollment !== null && enrollment.length > 0);
      }

      // Check if user is teacher/admin and get gender
      if (user) {
        const isOwner = user.id === courseData.teacher_id || user.id === courseData.created_by;
        const { data: profile } = await supabase.from('profiles').select('role, gender').eq('id', user.id).single();
        if (isOwner || profile?.role === 'admin') {
          setIsTeacher(true);
        }
        setUserGender(profile?.gender || null);
      }
    } catch (err) {
      console.error('Error loading course:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleEnrol() {
    if (!userId) {
      // Redirect to signup with return URL
      navigate(`/signup?redirect=/course/${slug}`);
      return;
    }

    setEnrolling(true);
    try {
      const { error } = await supabase
        .from('group_session_participants')
        .insert({
          group_session_id: course!.id,
          student_id: userId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('You are already enrolled in this course');
          setIsEnrolled(true);
        } else {
          throw error;
        }
      } else {
        toast.success('Successfully enrolled! Welcome to the course.');
        setIsEnrolled(true);
      }
    } catch (err: any) {
      toast.error('Failed to enrol: ' + err.message);
    } finally {
      setEnrolling(false);
    }
  }


  function getInsightForSession(sessionId: string) {
    return insights.find((i) => i.course_session_id === sessionId);
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const deliveryIcon = {
    online: <Wifi className="w-4 h-4" />,
    in_person: <MapPin className="w-4 h-4" />,
    hybrid: <Globe className="w-4 h-4" />,
  };

  const deliveryLabel = {
    online: 'Online',
    in_person: 'In Person',
    hybrid: 'Hybrid (In Person + Online)',
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!course) return null;

  const publishedCount = sessions.filter((s) => s.status === 'published').length;
  const today = new Date().toISOString().split('T')[0];
  const nextSession = sessions.find(
    (s) => s.status === 'draft' && s.session_date && s.session_date >= today
  );
  const liveSession = sessions.find((s) => s.live_status === 'live');
  const canJoinLive = !course.gender_restriction || isTeacher || userGender === course.gender_restriction;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Back nav */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <span className="text-gray-300 dark:text-gray-600">|</span>
          <Link to="/dashboard" className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-emerald-600 transition-colors">
            <Home className="w-4 h-4" />
            Dashboard
          </Link>
        </div>
      </div>

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
        <div className="relative max-w-4xl mx-auto px-4 py-12 sm:py-16">
          <div className="flex flex-col md:flex-row md:items-center gap-8">
            {/* Left: course info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 text-emerald-100 text-sm mb-4">
                <BookOpen className="w-4 h-4" />
                <span>Course</span>
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-4">{course.name}</h1>
              {course.description && (
                <p className="text-emerald-100 text-lg mb-6 max-w-2xl">{course.description}</p>
              )}

              <div className="flex flex-wrap gap-4 text-sm">
                {course.teacher && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <User className="w-4 h-4" />
                    <span>{course.teacher.full_name}</span>
                  </div>
                )}
                {course.location && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <MapPin className="w-4 h-4" />
                    <span>{course.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  {deliveryIcon[course.delivery_mode as keyof typeof deliveryIcon]}
                  <span>{deliveryLabel[course.delivery_mode as keyof typeof deliveryLabel]}</span>
                </div>
                {course.start_date && (
                  <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                    <Calendar className="w-4 h-4" />
                    <span>
                      {formatDate(course.start_date)}
                      {course.end_date ? ` — ${formatDate(course.end_date)}` : ''}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <Clock className="w-4 h-4" />
                  <span>{course.schedule_day.includes(' - ') || course.schedule_day.includes(',') ? course.schedule_day : `${course.schedule_day}s`} at {course.schedule_time?.slice(0, 5)} ({course.duration_minutes} min)</span>
                </div>
                <div className="flex items-center gap-2 bg-white/10 rounded-lg px-3 py-2">
                  <Users className="w-4 h-4" />
                  <span>{course.current_participants} enrolled</span>
                </div>
                {course.gender_restriction === 'female' && (
                  <div className="flex items-center gap-2 bg-pink-500/20 border border-pink-300/30 rounded-lg px-3 py-2">
                    <span>Sisters only — live sessions</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right: poster */}
            {course.poster_url && (
              <div className="flex-shrink-0 w-full md:w-80 lg:w-[420px]">
                <img
                  src={course.poster_url}
                  alt={course.name}
                  className="w-full rounded-xl shadow-lg object-contain"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Enrol / Status bar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {isTeacher ? (
            <div className="flex items-center gap-3">
              <Settings className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">You are the teacher of this course</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {sessions.length} sessions — {publishedCount} with study notes
                </p>
              </div>
            </div>
          ) : isEnrolled ? (
            <div className="flex items-center gap-3">
              <CheckCircle className="w-6 h-6 text-emerald-600" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">You're enrolled</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {publishedCount} of {sessions.length} sessions have study notes available
                </p>
              </div>
            </div>
          ) : (
            <>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Join this course — Free</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Get AI-generated study notes after each session
                </p>
              </div>
              <button
                onClick={handleEnrol}
                disabled={enrolling}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {enrolling && <Loader className="w-4 h-4 animate-spin" />}
                {userId ? 'Join This Course' : 'Sign Up & Join'}
              </button>
            </>
          )}
        </div>

        {/* Live class banner */}
        {liveSession && isEnrolled && canJoinLive && (
          <div
            onClick={() => navigate(`/course/${slug}/live/${liveSession.session_number}`)}
            className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-xl p-5 mb-6 cursor-pointer hover:from-red-600 hover:to-rose-700 transition-all shadow-lg shadow-red-500/20 animate-pulse-slow"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
                  <Radio className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <p className="font-bold text-lg">Class is Live — Join Now</p>
                  <p className="text-red-100 text-sm">
                    {liveSession.title || `Session ${liveSession.session_number}`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-4 py-2">
                <Video className="w-5 h-5" />
                <span className="font-semibold">Join</span>
              </div>
            </div>
          </div>
        )}
        {liveSession && isEnrolled && !canJoinLive && (
          <div className="bg-gradient-to-r from-pink-50 to-rose-50 dark:from-pink-900/20 dark:to-rose-900/20 rounded-xl border border-pink-200 dark:border-pink-800 p-5 mb-6">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-full bg-pink-100 dark:bg-pink-900/40 flex items-center justify-center">
                <Radio className="w-5 h-5 text-pink-600 dark:text-pink-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Class is Live — Sisters Only</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Live sessions are for sisters only. Study notes will be available after the session.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Teacher manage button */}
        {isTeacher && (
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-xl border border-blue-200 dark:border-blue-800 p-4 mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <div>
                <p className="font-semibold text-gray-900 dark:text-white text-sm">Teacher Dashboard</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Add transcripts, generate insights, notify students</p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/teacher/course/${course.id}`)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              Manage Course
            </button>
          </div>
        )}

        {/* Next session alert */}
        {nextSession && isEnrolled && (
          <div className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800 p-5 mb-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center flex-shrink-0">
                <Bell className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Next Session: {nextSession.title || `Session ${nextSession.session_number}`}
                </h3>
                <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                  <Calendar className="w-3.5 h-3.5 inline mr-1" />
                  {formatDate(nextSession.session_date)}
                  {course.schedule_time && (
                    <span className="ml-2">
                      <Clock className="w-3.5 h-3.5 inline mr-1" />
                      {course.schedule_time?.slice(0, 5)}
                    </span>
                  )}
                  {course.location && (
                    <span className="ml-2">
                      <MapPin className="w-3.5 h-3.5 inline mr-1" />
                      {course.location}
                    </span>
                  )}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                  Study notes will be available after this session
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Sessions list */}
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Sessions</h2>
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
              <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-gray-500 dark:text-gray-400">Sessions will appear here as the course progresses.</p>
            </div>
          ) : (
            sessions.map((session) => {
              const insight = getInsightForSession(session.id);
              const hasInsights = session.status === 'published' && insight;
              const isUpcoming = session.status === 'draft';
              const isGenerating = session.status === 'generating';
              const isLive = session.live_status === 'live';
              const isToday = session.session_date === today;
              const roomReady = isLive && !!session.room_code_guest;

              // Join window: 10 min before scheduled time until lesson end
              let canJoinByTime = true; // default allow if no schedule info
              if (session.session_date && course.schedule_time) {
                const sessionStart = new Date(`${session.session_date}T${course.schedule_time}`);
                const sessionEnd = new Date(sessionStart.getTime() + (course.duration_minutes || 120) * 60000);
                const joinOpens = new Date(sessionStart.getTime() - 10 * 60000);
                const now = new Date();
                canJoinByTime = now >= joinOpens && now <= sessionEnd;
              }
              const canJoin = roomReady && (isEnrolled || isTeacher) && canJoinLive && canJoinByTime;

              return (
                <div
                  key={session.id}
                  className={`rounded-xl border p-4 sm:p-5 transition-all ${
                    isLive
                      ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-900 shadow-md shadow-red-100 dark:shadow-red-950/20'
                      : isToday && isUpcoming
                      ? 'bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20 border-amber-300 dark:border-amber-800'
                      : hasInsights
                      ? 'bg-white dark:bg-gray-800 border-emerald-200 dark:border-emerald-800'
                      : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                  } ${
                    canJoin ? 'hover:shadow-lg cursor-pointer' :
                    hasInsights && (isEnrolled || isTeacher) ? 'hover:shadow-md cursor-pointer' : hasInsights ? 'cursor-pointer' : ''
                  }`}
                  onClick={() => {
                    if (canJoin) {
                      navigate(`/course/${slug}/live/${session.session_number}`);
                    } else if (hasInsights && (isEnrolled || isTeacher)) {
                      navigate(`/course/${slug}/session/${session.session_number}`);
                    } else if (hasInsights && !userId) {
                      navigate(`/signup?redirect=/course/${slug}`);
                    } else if (hasInsights && !isEnrolled) {
                      toast.info('Enrol in this course to view study notes');
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                          isLive
                            ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-400'
                            : isToday && isUpcoming
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : hasInsights
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400'
                            : isGenerating
                            ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}
                      >
                        {session.session_number}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {session.title || `Session ${session.session_number}`}
                          </h3>
                          {isLive && (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                              </span>
                              LIVE
                            </span>
                          )}
                          {isToday && !isLive && isUpcoming && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400">
                              Today
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {session.session_date
                            ? formatDate(session.session_date)
                            : 'Date TBC'}
                          {hasInsights && (isEnrolled || isTeacher) && session.session_number === 1 && (
                            <span className="ml-2 inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                              <Sparkles className="w-3 h-3" /> Free Study Notes
                            </span>
                          )}
                          {hasInsights && (isEnrolled || isTeacher) && session.session_number > 1 && (hasNotesAccess || isNotesAdmin) && (
                            <span className="ml-2 text-emerald-600 dark:text-emerald-400">
                              Study Notes Available
                            </span>
                          )}
                          {hasInsights && isEnrolled && !isTeacher && session.session_number > 1 && !hasNotesAccess && !isNotesAdmin && (
                            <span className="ml-2 inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
                              <Lock className="w-3 h-3" /> Unlock Study Notes — £{notesPricePounds.toFixed(2)}
                            </span>
                          )}
                          {hasInsights && !isEnrolled && !isTeacher && (
                            <span className="ml-2 text-gray-400 dark:text-gray-500">
                              Enrol to view study notes
                            </span>
                          )}
                          {isGenerating && (
                            <span className="ml-2 text-amber-600 dark:text-amber-400 flex items-center gap-1 inline-flex">
                              <Loader className="w-3 h-3 animate-spin" /> Generating notes...
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div>
                      {canJoin ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/course/${slug}/live/${session.session_number}`);
                          }}
                          className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded-lg transition-colors shadow-sm"
                        >
                          <Video className="w-4 h-4" />
                          Join Room
                        </button>
                      ) : isLive && isEnrolled && !canJoinLive ? (
                        <span className="text-xs text-pink-600 dark:text-pink-400 font-medium">Sisters only</span>
                      ) : isLive && !isEnrolled ? (
                        <span className="text-xs text-gray-400">Enrol to join</span>
                      ) : hasInsights && (isEnrolled || isTeacher) ? (
                        <ChevronRight className="w-5 h-5 text-emerald-500" />
                      ) : hasInsights && !isEnrolled ? (
                        <Lock className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      ) : isUpcoming ? (
                        <Lock className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
