import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Clock, Video, RefreshCw, BookOpen, User, CalendarClock, Sparkles, MessageCircle, X, ArrowRight, CheckCircle, AlertCircle, XCircle, Users } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, differenceInMinutes, isPast } from 'date-fns';
import { getSubjectGradientClasses } from '../lib/subjectColors';

interface UpcomingLesson {
  id: string;
  learner_id: string;
  learner_name: string;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  subject_id: string;
  subject_name: string;
  scheduled_time: string;
  duration_minutes: number;
  '100ms_room_id': string | null;
  has_insights: boolean;
  insight_title?: string;
  unread_messages: number;
  confirmation_status: string;
  teacher_acknowledgment_message: string | null;
  quran_focus?: 'understanding' | 'fluency' | 'memorisation' | null;
}

interface UpcomingCourseSession {
  id: string;
  session_number: number;
  title: string | null;
  session_date: string | null;
  schedule_time: string | null;
  duration_minutes: number;
  live_status: string | null;
  room_code_guest: string | null;
  course_name: string;
  course_slug: string;
  teacher_name: string;
  teacher_avatar: string | null;
  gender_restriction: string | null;
}

interface UpcomingSessionsCardProps {
  learnerId?: string;
}

export default function UpcomingSessionsCard({ learnerId }: UpcomingSessionsCardProps) {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<UpcomingLesson[]>([]);
  const [recentLessons, setRecentLessons] = useState<UpcomingLesson[]>([]);
  const [courseSessions, setCourseSessions] = useState<UpcomingCourseSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMessage, setViewingMessage] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState<string>('');
  const [showCancelModal, setShowCancelModal] = useState<{ lessonId: string; canCancel: boolean; hoursUntil: number } | null>(null);
  const [cancellingLessonId, setCancellingLessonId] = useState<string | null>(null);

  useEffect(() => {
    loadUpcomingSessions();
    loadUpcomingCourseSessions();

    // Set up real-time subscription for lesson updates
    const channel = supabase
      .channel('lesson-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'lessons'
        },
        () => {
          // Refresh lessons when any lesson is updated (without showing loading spinner)
          loadUpcomingSessions(false);
        }
      )
      .subscribe();

    // Realtime for live course sessions
    const courseChannel = supabase
      .channel('course-session-live')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'course_sessions',
        },
        () => {
          loadUpcomingCourseSessions();
        }
      )
      .subscribe();

    // Polling fallback: refresh every 30 seconds to catch any missed updates
    const pollInterval = setInterval(() => {
      loadUpcomingSessions(false);
      loadUpcomingCourseSessions();
    }, 30000); // 30 seconds

    // Cleanup subscription and polling on unmount
    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(courseChannel);
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerId]);

  async function loadUpcomingCourseSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Find courses the user is enrolled in
      const { data: enrollments } = await supabase
        .from('group_session_participants')
        .select('group_session_id')
        .eq('student_id', user.id);

      if (!enrollments || enrollments.length === 0) {
        setCourseSessions([]);
        return;
      }

      const courseIds = enrollments.map((e) => e.group_session_id);
      const today = new Date().toISOString().split('T')[0];

      // Fetch upcoming course sessions (today + future)
      const { data: sessions } = await supabase
        .from('course_sessions')
        .select(`
          id, session_number, title, session_date, live_status, room_code_guest,
          group_sessions!inner (
            name, slug, gender_restriction, schedule_time, duration_minutes,
            teacher:profiles!group_sessions_teacher_id_fkey (full_name, avatar_url)
          )
        `)
        .in('group_session_id', courseIds)
        .gte('session_date', today)
        .order('session_date', { ascending: true })
        .limit(3);

      if (sessions && sessions.length > 0) {
        setCourseSessions(
          sessions.map((s: any) => {
            const gs = s.group_sessions;
            return {
              id: s.id,
              session_number: s.session_number,
              title: s.title,
              session_date: s.session_date,
              schedule_time: gs.schedule_time,
              duration_minutes: gs.duration_minutes,
              live_status: s.live_status,
              room_code_guest: s.room_code_guest,
              course_name: gs.name,
              course_slug: gs.slug,
              teacher_name: gs.teacher?.full_name || 'Teacher',
              teacher_avatar: gs.teacher?.avatar_url || null,
              gender_restriction: gs.gender_restriction,
            };
          })
        );
      } else {
        setCourseSessions([]);
      }
    } catch (err) {
      console.error('Error loading course sessions:', err);
      setCourseSessions([]);
    }
  }

  async function loadUpcomingSessions(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      }
      let targetLearnerIds: string[] = learnerId ? [learnerId] : [];

      // If no learnerId provided, get ALL learners for this parent OR the user themselves
      if (!learnerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          setLoading(false);
          return;
        }

        // Get ALL learners for this parent
        const { data: learners, error: learnerError } = await supabase
          .from('learners')
          .select('id, name, parent_id')
          .eq('parent_id', user.id);

        if (learnerError) {
          console.error('Error fetching learners:', learnerError);
        }

        if (learners && learners.length > 0) {
          targetLearnerIds = learners.map(l => l.id);
        } else {
          // No learners found via parent_id - user might BE the learner directly
          // Check if user has lessons as learner_id (student account)
          targetLearnerIds = [user.id];
        }
      }

      // Get all booked lessons for ALL the parent's learners
      // Using regular joins instead of !inner to avoid 406 errors when relations don't match
      const { data: lessonsData, error} = await supabase
        .from('lessons')
        .select(`
          id,
          learner_id,
          scheduled_time,
          duration_minutes,
          status,
          teacher_id,
          subject_id,
          quran_focus,
          "100ms_room_id",
          confirmation_status,
          teacher_acknowledgment_message,
          learners(
            name
          ),
          teacher_profiles(
            user_id,
            profiles!teacher_profiles_user_id_fkey(
              full_name,
              avatar_url
            )
          ),
          subjects(
            name
          )
        `)
        .in('learner_id', targetLearnerIds)
        .eq('status', 'booked')
        .order('scheduled_time', { ascending: true });

      if (error) {
        throw error;
      }

      if (lessonsData) {
        // Check which lessons have insights
        const lessonIds = lessonsData.map((l: any) => l.id);

        // Only query if we have lessons - chunk to avoid URL length limits
        const lessonsWithInsights = new Set<string>();
        if (lessonIds.length > 0) {
          const CHUNK_SIZE = 10;
          const chunks = [];
          for (let i = 0; i < lessonIds.length; i += CHUNK_SIZE) {
            chunks.push(lessonIds.slice(i, i + CHUNK_SIZE));
          }

          const results = await Promise.all(
            chunks.map(chunk =>
              supabase
                .from('lesson_insights')
                .select('lesson_id')
                .in('lesson_id', chunk)
            )
          );

          results.forEach(({ data: insightsData }) => {
            insightsData?.forEach((i: any) => lessonsWithInsights.add(i.lesson_id));
          });
        }

        // Unread message counts - disabled for now due to RLS policy constraints
        // The lesson_messages table requires user to be sender or receiver
        const unreadMessageCounts = new Map<string, number>();

        const now = new Date();

        const lessonsWithRelations = lessonsData.filter((lesson: any) => {
          return lesson.learners && lesson.teacher_profiles && lesson.subjects;
        });

        const formattedLessons: UpcomingLesson[] = lessonsWithRelations
          .map((lesson: any) => ({
            id: lesson.id,
            learner_id: lesson.learner_id,
            learner_name: lesson.learners?.name || 'Student',
            teacher_id: lesson.teacher_id,
            teacher_name: lesson.teacher_profiles?.profiles?.full_name || 'Teacher',
            teacher_avatar: lesson.teacher_profiles?.profiles?.avatar_url || null,
            subject_id: lesson.subject_id,
            subject_name: lesson.subjects?.name || 'Subject',
            scheduled_time: lesson.scheduled_time,
            duration_minutes: lesson.duration_minutes,
            '100ms_room_id': lesson['100ms_room_id'],
            has_insights: lessonsWithInsights.has(lesson.id),
            unread_messages: unreadMessageCounts.get(lesson.id) || 0,
            confirmation_status: lesson.confirmation_status || 'pending',
            teacher_acknowledgment_message: lesson.teacher_acknowledgment_message,
            quran_focus: lesson.quran_focus || null,
          }))
          .filter((lesson) => {
            // Calculate lesson end time (scheduled_time + duration)
            const lessonStart = new Date(lesson.scheduled_time);
            const lessonEnd = new Date(lessonStart.getTime() + lesson.duration_minutes * 60000);

            // Show lesson if it hasn't ended yet
            return lessonEnd > now;
          })
          .slice(0, 5); // Limit to 5 lessons

        setLessons(formattedLessons);
      }

      // Also fetch last 3 completed lessons
      const { data: completedLessonsData } = await supabase
        .from('lessons')
        .select(`
          id,
          learner_id,
          scheduled_time,
          duration_minutes,
          status,
          teacher_id,
          subject_id,
          quran_focus,
          "100ms_room_id",
          confirmation_status,
          teacher_acknowledgment_message,
          learners(
            name
          ),
          teacher_profiles(
            user_id,
            profiles!teacher_profiles_user_id_fkey(
              full_name,
              avatar_url
            )
          ),
          subjects(
            name
          )
        `)
        .in('learner_id', targetLearnerIds)
        .eq('status', 'completed')
        .order('scheduled_time', { ascending: false })
        .limit(3);

      if (completedLessonsData) {
        // Check which completed lessons have insights and get their titles
        const completedLessonIds = completedLessonsData.map((l: any) => l.id);
        const completedLessonsInsightsMap = new Map<string, { hasInsights: boolean; title?: string }>();

        if (completedLessonIds.length > 0) {
          const { data: completedInsights } = await supabase
            .from('lesson_insights')
            .select('lesson_id, title')
            .in('lesson_id', completedLessonIds);

          completedInsights?.forEach((i: any) => {
            completedLessonsInsightsMap.set(i.lesson_id, { hasInsights: true, title: i.title });
          });
        }

        const formattedCompletedLessons: UpcomingLesson[] = completedLessonsData
          .filter((lesson: any) => lesson.subjects) // Only include lessons with valid subject
          .map((lesson: any) => {
            const insightData = completedLessonsInsightsMap.get(lesson.id);
            return {
              id: lesson.id,
              learner_id: lesson.learner_id,
              learner_name: lesson.learners?.name || 'Student',
              teacher_id: lesson.teacher_id,
              teacher_name: lesson.teacher_profiles?.profiles?.full_name || 'Teacher',
              teacher_avatar: lesson.teacher_profiles?.profiles?.avatar_url || null,
              subject_id: lesson.subject_id,
              subject_name: lesson.subjects?.name || 'Subject',
              scheduled_time: lesson.scheduled_time,
              duration_minutes: lesson.duration_minutes,
              '100ms_room_id': lesson['100ms_room_id'],
              has_insights: !!insightData?.hasInsights,
              insight_title: insightData?.title,
              unread_messages: 0,
              confirmation_status: lesson.confirmation_status || 'completed',
              teacher_acknowledgment_message: lesson.teacher_acknowledgment_message,
              quran_focus: lesson.quran_focus || null,
            };
          });

        setRecentLessons(formattedCompletedLessons);
      }
    } catch (error) {
      console.error('Error loading upcoming sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function viewMessage(lessonId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // New schema: messages don't have receiver_id or is_read
      // Instead, read_at is null for unread, and we check sender_id != user.id
      const { data: messages, error } = await supabase
        .from('lesson_messages')
        .select('id, message_text, sender_id, created_at')
        .eq('lesson_id', lessonId)
        .neq('sender_id', user.id)
        .is('read_at', null)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (messages && messages.length > 0) {
        setMessageContent(messages[0].message_text);
        setViewingMessage(lessonId);

        // Mark message as read by setting read_at
        await supabase
          .from('lesson_messages')
          .update({ read_at: new Date().toISOString() })
          .eq('id', messages[0].id);

        // Update local state to reflect message as read
        setLessons(lessons.map(lesson =>
          lesson.id === lessonId
            ? { ...lesson, unread_messages: Math.max(0, lesson.unread_messages - 1) }
            : lesson
        ));
      }
    } catch (error) {
      console.error('Error viewing message:', error);
    }
  }

  function closeMessage() {
    setViewingMessage(null);
    setMessageContent('');
  }

  function handleCancelClick(lessonId: string, scheduledTime: string) {
    const lessonTime = new Date(scheduledTime);
    const hoursUntil = (lessonTime.getTime() - Date.now()) / (1000 * 60 * 60);
    const canCancel = hoursUntil >= 2;
    setShowCancelModal({ lessonId, canCancel, hoursUntil });
  }

  async function handleCancelLesson() {
    if (!showCancelModal) return;

    setCancellingLessonId(showCancelModal.lessonId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/cancel-lesson`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            lesson_id: showCancelModal.lessonId,
            reason: 'Cancelled by student'
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error;
        throw new Error(errorMsg || 'Failed to cancel lesson');
      }

      toast.success(`Lesson cancelled successfully. ${data.credits_refunded} credit(s) have been refunded to your account.`);
      setShowCancelModal(null);
      loadUpcomingSessions();
    } catch (error) {
      console.error('Error cancelling lesson:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel lesson');
    } finally {
      setCancellingLessonId(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-100 rounded w-48"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
          <div className="h-24 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (lessons.length === 0 && recentLessons.length === 0 && courseSessions.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Upcoming Lessons</h3>

        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-gray-600" />
          </div>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-2">You don't have any sessions scheduled yet.</p>
          <p className="text-gray-500 dark:text-gray-400 mb-8">Start your learning journey by booking your first session</p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/subjects')}
              className="px-8 py-4 bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-blue-600 hover:to-blue-600 text-gray-900 font-semibold rounded-xl transition shadow-lg shadow-emerald-500/20 flex items-center space-x-2"
            >
              <BookOpen className="w-5 h-5" />
              <span>Book a Session</span>
            </button>

            <button
              onClick={() => loadUpcomingSessions(true)}
              className="px-6 py-4 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 font-medium rounded-xl transition flex items-center space-x-2"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Show recent lessons even if no upcoming booked lessons
  if (lessons.length === 0 && courseSessions.length === 0 && recentLessons.length > 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Lessons</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/my-classes')}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-lg font-semibold transition flex items-center space-x-2 border border-emerald-500/30"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => loadUpcomingSessions(true)}
              className="p-2 text-gray-500 hover:text-emerald-600 transition hover:rotate-180 duration-500"
              title="Refresh lessons"
            >
              <RefreshCw className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* No upcoming lessons message */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-amber-800 dark:text-amber-300">No upcoming lessons</p>
              <p className="text-xs text-amber-600 dark:text-amber-400 mt-1">
                Book your next session to continue your learning journey
              </p>
              <button
                onClick={() => navigate('/teachers')}
                className="mt-2 text-xs font-semibold text-amber-700 dark:text-amber-300 hover:underline flex items-center gap-1"
              >
                Book a Lesson <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Recent Completed Lessons */}
        <div>
          <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-gray-400" />
            Recent Lessons
          </h4>

          <div className="space-y-3">
            {recentLessons.map((lesson) => {
              const lessonDate = parseISO(lesson.scheduled_time);

              return (
                <div
                  key={lesson.id}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition cursor-pointer"
                  onClick={() => navigate(`/my-classes?lesson=${lesson.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {lesson.teacher_avatar ? (
                          <img
                            src={lesson.teacher_avatar}
                            alt={lesson.teacher_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {lesson.subject_name}
                          {lesson.quran_focus && (
                            <span className={`ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              lesson.quran_focus === 'understanding' ? 'bg-emerald-100 text-emerald-700' :
                              lesson.quran_focus === 'fluency' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {lesson.quran_focus.charAt(0).toUpperCase() + lesson.quran_focus.slice(1)}
                            </span>
                          )}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          with {lesson.teacher_name} • {format(lessonDate, 'MMM d')} at {format(lessonDate, 'h:mm a')}
                        </p>
                        {lesson.insight_title && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                            {/* Clean up title - remove prefix like "Qur'an Insights:" or "Arabic Language Insights:" */}
                            {lesson.insight_title
                              .replace(/^Qur'?[aā]n\s*(with\s+Understanding\s*)?:?\s*(Insights:?)?\s*/i, '')
                              .replace(/^Arabic\s+Language\s*:?\s*(Insights:?)?\s*/i, '')
                              .replace(/^[\w\s]+Insights:\s*/i, '')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{lesson.duration_minutes} min</span>
                      {lesson.has_insights ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/lesson/${lesson.id}/insights`);
                          }}
                          className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          View Insights
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-xs">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl p-6 border border-gray-200">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Upcoming Lessons</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/my-classes')}
            className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-lg font-semibold transition flex items-center space-x-2 border border-emerald-500/30"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => loadUpcomingSessions(true)}
            className="p-2 text-gray-500 hover:text-emerald-600 transition hover:rotate-180 duration-500"
            title="Refresh lessons"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {/* Upcoming Course Sessions */}
        {courseSessions.map((cs) => {
          const isLive = cs.live_status === 'live';
          const roomReady = isLive && !!cs.room_code_guest;
          const isToday = cs.session_date === format(new Date(), 'yyyy-MM-dd');
          const sessionDateFormatted = cs.session_date
            ? format(new Date(cs.session_date + 'T00:00:00'), 'MMM d, yyyy')
            : 'Date TBC';
          const timeFormatted = cs.schedule_time ? cs.schedule_time.slice(0, 5) : '';

          // Join window: 10 min before lesson start until lesson end
          let canJoinByTime = false;
          if (cs.session_date && cs.schedule_time) {
            const sessionStart = new Date(`${cs.session_date}T${cs.schedule_time}`);
            const sessionEnd = new Date(sessionStart.getTime() + cs.duration_minutes * 60000);
            const joinOpens = new Date(sessionStart.getTime() - 10 * 60000);
            const now = new Date();
            canJoinByTime = now >= joinOpens && now <= sessionEnd;
          }
          const canJoin = roomReady && canJoinByTime;

          return (
            <div
              key={cs.id}
              className={`rounded-xl p-5 border transition-all cursor-pointer ${
                isLive
                  ? 'bg-gradient-to-r from-red-50 to-rose-50 dark:from-red-950/30 dark:to-rose-950/30 border-red-300 dark:border-red-800 ring-1 ring-red-200 dark:ring-red-900 shadow-md shadow-red-100 dark:shadow-red-950/20 hover:shadow-lg'
                  : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:border-emerald-500/30'
              }`}
              onClick={() => {
                if (canJoin) {
                  navigate(`/course/${cs.course_slug}/live/${cs.session_number}`);
                } else {
                  navigate(`/course/${cs.course_slug}`);
                }
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center overflow-hidden border-2 ${
                    isLive
                      ? 'bg-red-100 dark:bg-red-900/40 border-red-300 dark:border-red-700'
                      : 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-300 dark:border-emerald-700'
                  }`}>
                    {cs.teacher_avatar ? (
                      <img
                        src={cs.teacher_avatar}
                        alt={cs.teacher_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Users className={`w-6 h-6 ${isLive ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`} />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {cs.course_name}
                      </h4>
                      {isLive && (
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-bold bg-red-600 text-white">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                          </span>
                          LIVE
                        </span>
                      )}
                      {isToday && !isLive && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 text-xs font-bold rounded-full">
                          TODAY
                        </span>
                      )}
                      {canJoinByTime && !isLive && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full animate-pulse">
                          READY
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {cs.title || `Session ${cs.session_number}`} — with {cs.teacher_name}
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  {!isLive && (
                    <div className="text-right">
                      <div className="flex items-center space-x-2 text-gray-600 mb-1">
                        <Calendar className="w-4 h-4" />
                        <span className="text-sm font-medium">{sessionDateFormatted}</span>
                      </div>
                      {timeFormatted && (
                        <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                          <Clock className="w-4 h-4" />
                          <span className="text-sm font-semibold">{timeFormatted}</span>
                        </div>
                      )}
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-sm font-semibold rounded-lg border border-emerald-500/20">
                        {cs.duration_minutes} min
                      </span>
                    </div>
                  )}

                  {canJoin ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/course/${cs.course_slug}/live/${cs.session_number}`);
                      }}
                      className="px-6 py-3 bg-red-600 hover:bg-red-700 text-white font-semibold rounded-lg transition shadow-lg shadow-red-500/20 flex items-center space-x-2"
                    >
                      <Video className="w-5 h-5" />
                      <span>Join Class</span>
                    </button>
                  ) : isLive && !canJoinByTime ? (
                    <span className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-medium rounded-lg">
                      Outside join window
                    </span>
                  ) : canJoinByTime && !roomReady ? (
                    <span className="px-4 py-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 text-sm font-medium rounded-lg">
                      Waiting for teacher...
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
          );
        })}

        {lessons.map((lesson) => {
          const lessonDate = parseISO(lesson.scheduled_time);
          const isToday = format(lessonDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const minutesUntilStart = differenceInMinutes(lessonDate, new Date());
          const canJoin = minutesUntilStart <= 360 && minutesUntilStart >= -lesson.duration_minutes; // Can join 6 hours before
          const canReschedule = minutesUntilStart > 30; // Can reschedule if more than 30 minutes away
          const lessonIsPast = isPast(new Date(lessonDate.getTime() + lesson.duration_minutes * 60000));

          const handleJoin = () => {
            if (!lesson['100ms_room_id']) {
              toast.error('Session room is not ready yet. Please contact support if this issue persists.');
              return;
            }
            navigate(`/lesson/${lesson.id}`);
          };

          const handleReschedule = () => {
            navigate(`/reschedule-lesson?lessonId=${lesson.id}`);
          };

          const handleViewInsights = () => {
            navigate(`/lesson/${lesson.id}/insights`);
          };

          return (
            <div
              key={lesson.id}
              className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-700 hover:border-emerald-500/30 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                    {lesson.teacher_avatar ? (
                      <img
                        src={lesson.teacher_avatar}
                        alt={lesson.teacher_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                      <h4 className="text-lg font-semibold text-gray-900 dark:text-white">
                        {lesson.subject_name}
                        {lesson.quran_focus && (
                          <span className={`ml-2 text-xs font-medium px-2 py-0.5 rounded-full ${
                            lesson.quran_focus === 'understanding' ? 'bg-emerald-100 text-emerald-700' :
                            lesson.quran_focus === 'fluency' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                          }`}>
                            {lesson.quran_focus.charAt(0).toUpperCase() + lesson.quran_focus.slice(1)}
                          </span>
                        )}
                      </h4>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-600 text-xs font-bold rounded-full">
                          TODAY
                        </span>
                      )}
                      {canJoin && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full animate-pulse">
                          READY
                        </span>
                      )}
                      {lesson.confirmation_status === 'pending' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full border border-orange-500/30">
                          <AlertCircle className="w-3 h-3" />
                          Awaiting Acknowledgment
                        </span>
                      )}
                      {lesson.confirmation_status === 'acknowledged' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full border border-green-500/30">
                          <CheckCircle className="w-3 h-3" />
                          Acknowledged
                        </span>
                      )}
                      {lesson.confirmation_status === 'auto_acknowledged' && (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs rounded-full border border-blue-500/30">
                          <CheckCircle className="w-3 h-3" />
                          Auto-confirmed
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {!learnerId && <span className="font-semibold text-emerald-600">{lesson.learner_name}'s class</span>}{!learnerId && ' - '}with {lesson.teacher_name}
                    </p>
                    {lesson.teacher_acknowledgment_message && (
                      <div className="mt-2 p-2 bg-green-500/10 border border-green-500/30 rounded-lg">
                        <p className="text-xs text-green-300 italic">
                          "{lesson.teacher_acknowledgment_message}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {format(lessonDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-emerald-600 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {format(lessonDate, 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center justify-end space-x-1 mb-1">
                      <span className="px-2 py-1 bg-emerald-500/10 text-emerald-600 text-sm font-semibold rounded-lg border border-emerald-500/20">
                        {lesson.duration_minutes} min
                      </span>
                    </div>
                    {!canJoin && minutesUntilStart > 360 && (
                      <p className="text-xs text-gray-500">
                        Opens 6 hours before
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {lesson.unread_messages > 0 && (
                      <button
                        onClick={() => viewMessage(lesson.id)}
                        className="relative px-4 py-2 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-medium transition flex items-center space-x-2 animate-pulse"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Message from Teacher</span>
                        {lesson.unread_messages > 1 && (
                          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-gray-900 rounded-full text-xs font-bold flex items-center justify-center">
                            {lesson.unread_messages}
                          </span>
                        )}
                      </button>
                    )}

                    {lessonIsPast && lesson.has_insights && (
                      <button
                        onClick={handleViewInsights}
                        className={`px-4 py-2 bg-gradient-to-r text-white rounded-lg font-medium transition flex items-center space-x-2 ${getSubjectGradientClasses(lesson.subject_name)}`}
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>View Insights</span>
                      </button>
                    )}

                    {/* Always show Message Teacher button */}
                    <button
                      onClick={() => navigate('/messages')}
                      className="px-4 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 hover:border-purple-500/50 text-purple-300 hover:text-purple-200 rounded-lg font-medium transition flex items-center space-x-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      <span>Message</span>
                    </button>

                    {!lessonIsPast && canReschedule && (
                      <>
                        <button
                          onClick={() => handleCancelClick(lesson.id, lesson.scheduled_time)}
                          disabled={cancellingLessonId === lesson.id}
                          className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 border border-red-200 rounded-lg font-medium transition flex items-center space-x-2"
                        >
                          <XCircle className="w-4 h-4" />
                          <span>{cancellingLessonId === lesson.id ? 'Cancelling...' : 'Cancel'}</span>
                        </button>
                        <button
                          onClick={handleReschedule}
                          className="px-4 py-2 bg-gray-200 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-lg font-medium transition flex items-center space-x-2"
                        >
                          <CalendarClock className="w-4 h-4" />
                          <span>Reschedule</span>
                        </button>
                      </>
                    )}

                    {!lessonIsPast && (
                      <button
                        onClick={handleJoin}
                        disabled={!canJoin}
                        className={`px-6 py-3 font-semibold rounded-lg transition shadow-lg flex items-center space-x-2 ${
                          canJoin
                            ? 'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white shadow-emerald-500/20'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        <Video className="w-5 h-5" />
                        <span>{canJoin ? 'Join' : 'Not Ready'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Completed Lessons Section */}
      {recentLessons.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-5 h-5 text-gray-400" />
              Recent Lessons
            </h4>
          </div>

          <div className="space-y-3">
            {recentLessons.map((lesson) => {
              const lessonDate = parseISO(lesson.scheduled_time);

              return (
                <div
                  key={lesson.id}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-xl p-4 border border-gray-100 dark:border-gray-700 hover:border-emerald-200 dark:hover:border-emerald-800 transition cursor-pointer"
                  onClick={() => navigate(`/my-classes?lesson=${lesson.id}`)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                        {lesson.teacher_avatar ? (
                          <img
                            src={lesson.teacher_avatar}
                            alt={lesson.teacher_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-gray-500" />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white">
                          {lesson.subject_name}
                          {lesson.quran_focus && (
                            <span className={`ml-1.5 text-[10px] font-medium px-1.5 py-0.5 rounded-full ${
                              lesson.quran_focus === 'understanding' ? 'bg-emerald-100 text-emerald-700' :
                              lesson.quran_focus === 'fluency' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                            }`}>
                              {lesson.quran_focus.charAt(0).toUpperCase() + lesson.quran_focus.slice(1)}
                            </span>
                          )}
                        </h5>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          with {lesson.teacher_name} • {format(lessonDate, 'MMM d')} at {format(lessonDate, 'h:mm a')}
                        </p>
                        {lesson.insight_title && (
                          <p className="text-xs text-gray-600 dark:text-gray-300 mt-1 truncate">
                            {/* Clean up title - remove prefix like "Qur'an Insights:" or "Arabic Language Insights:" */}
                            {lesson.insight_title
                              .replace(/^Qur'?[aā]n\s*(with\s+Understanding\s*)?:?\s*(Insights:?)?\s*/i, '')
                              .replace(/^Arabic\s+Language\s*:?\s*(Insights:?)?\s*/i, '')
                              .replace(/^[\w\s]+Insights:\s*/i, '')}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <span className="text-xs text-gray-400">{lesson.duration_minutes} min</span>
                      {lesson.has_insights ? (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/lesson/${lesson.id}/insights`);
                          }}
                          className="px-3 py-1.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-lg text-xs font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition flex items-center gap-1"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          View Insights
                        </button>
                      ) : (
                        <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-xs">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Message Modal */}
      {viewingMessage && messageContent && (
        <>
          <div
            className="fixed inset-0 bg-gray-50/80 backdrop-blur-sm z-50"
            onClick={closeMessage}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Message from Teacher</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {lessons.find(l => l.id === viewingMessage)?.teacher_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeMessage}
                  className="w-10 h-10 rounded-lg bg-gray-200 hover:bg-gray-200 transition flex items-center justify-center text-gray-500 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                  <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                    {messageContent}
                  </p>
                </div>

                <button
                  onClick={closeMessage}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Cancel Lesson Modal */}
      {showCancelModal && (
        <>
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
            onClick={() => setShowCancelModal(null)}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">Cancel Lesson</h3>
                </div>

                {showCancelModal.canCancel ? (
                  <>
                    <p className="text-gray-600 mb-6">
                      Are you sure you want to cancel this lesson? Your credit will be refunded to your account.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowCancelModal(null)}
                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                      >
                        Keep Lesson
                      </button>
                      <button
                        onClick={handleCancelLesson}
                        disabled={cancellingLessonId !== null}
                        className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition disabled:opacity-50"
                      >
                        {cancellingLessonId ? 'Cancelling...' : 'Yes, Cancel'}
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">
                      Lessons can only be cancelled 2+ hours before start time. You can still reschedule this lesson.
                    </p>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowCancelModal(null)}
                        className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          navigate(`/reschedule-lesson?lessonId=${showCancelModal.lessonId}`);
                          setShowCancelModal(null);
                        }}
                        className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2"
                      >
                        <CalendarClock className="w-4 h-4" />
                        <span>Reschedule Instead</span>
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
