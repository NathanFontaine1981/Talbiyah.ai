import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, User, CalendarClock, MessageCircle, X, ArrowLeft, Play, Download, BookOpen, XCircle, Loader2, ChevronDown, ChevronRight, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { format, parseISO, differenceInMinutes, isPast, differenceInDays, startOfWeek, endOfWeek, isWithinInterval, addWeeks, subWeeks, isSameWeek } from 'date-fns';

interface Lesson {
  id: string;
  learner_id?: string;
  learner_name?: string;
  teacher_id: string;
  teacher_name: string;
  teacher_avatar: string | null;
  subject_id: string;
  subject_name: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  '100ms_room_id': string | null;
  has_insights: boolean;
  unread_messages: number;
  confirmation_status?: string;
  has_recording?: boolean;
  recording_url?: string;
  recording_expires_at?: string;
  // Insight details for lesson summary
  insight_title?: string;
  insight_summary?: string;
  key_topics?: string[];
}

// Raw lesson data from Supabase query
interface RawLessonData {
  id: string;
  learner_id?: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
  teacher_id: string;
  subject_id: string;
  '100ms_room_id': string | null;
  confirmation_status?: string;
  learners?: { name: string };
  teacher_profiles?: {
    user_id: string;
    profiles: {
      full_name: string | null;
      avatar_url: string | null;
    };
  };
  subjects: { name: string };
}

export default function MyClasses() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'missed' | 'all'>('upcoming');
  const [viewingMessage, setViewingMessage] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState<string>('');
  const [cancellingLessonId, setCancellingLessonId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState<{ lessonId: string; canCancel: boolean; hoursUntil: number } | null>(null);
  const [expandedWeeks, setExpandedWeeks] = useState<Set<string>>(new Set(['This Week']));

  useEffect(() => {
    loadLessons();
  }, [filter]);

  async function loadLessons() {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is a teacher
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      const userIsTeacher = teacherProfile?.status === 'approved';
      setIsTeacher(userIsTeacher);

      let query;

      if (userIsTeacher) {
        // Load lessons as teacher
        query = supabase
          .from('lessons')
          .select(`
            id,
            learner_id,
            scheduled_time,
            duration_minutes,
            status,
            teacher_id,
            subject_id,
            "100ms_room_id",
            confirmation_status,
            learners!inner(
              name
            ),
            subjects!inner(
              name
            )
          `)
          .eq('teacher_id', teacherProfile.id);
      } else {
        // Load lessons as student
        const { data: learner } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)
          .maybeSingle();

        const learnerId = learner?.id;

        if (!learnerId) {
          setLoading(false);
          return;
        }

        query = supabase
          .from('lessons')
          .select(`
            id,
            scheduled_time,
            duration_minutes,
            status,
            teacher_id,
            subject_id,
            "100ms_room_id",
            recording_url,
            recording_expires_at,
            teacher_profiles!inner(
              user_id,
              profiles!inner(
                full_name,
                avatar_url
              )
            ),
            subjects!inner(
              name
            )
          `)
          .eq('learner_id', learnerId);
      }

      // Apply filter
      if (filter === 'upcoming') {
        query = query
          .eq('status', 'booked')
          .gte('scheduled_time', new Date().toISOString());
      } else if (filter === 'past') {
        query = query
          .in('status', ['completed', 'booked'])
          .lte('scheduled_time', new Date().toISOString());
      } else if (filter === 'missed') {
        query = query
          .in('status', ['missed', 'cancelled'])
          .lte('scheduled_time', new Date().toISOString());
      }

      query = query.order('scheduled_time', { ascending: filter === 'upcoming' });

      const { data: lessonsData, error } = await query;

      if (error) throw error;

      if (lessonsData) {
        // Check which lessons have insights
        const lessonIds = (lessonsData as RawLessonData[]).map((l) => l.id);

        // Fetch insight details (title, summary, key_topics) for lessons
        const insightsMap = new Map<string, { title: string; summary: string; key_topics: string[] | null }>();
        if (lessonIds.length > 0) {
          const { data: insightsData } = await supabase
            .from('lesson_insights')
            .select('lesson_id, title, summary, key_topics')
            .in('lesson_id', lessonIds);
          insightsData?.forEach(insight => {
            insightsMap.set(insight.lesson_id, {
              title: insight.title,
              summary: insight.summary,
              key_topics: insight.key_topics
            });
          });
        }

        // Build recording map from lessons data (recording_url is now on lessons table)
        const recordingsMap = new Map<string, { url: string; expires_at: string }>();
        (lessonsData as RawLessonData[]).forEach((lesson: any) => {
          if (lesson.recording_url) {
            recordingsMap.set(lesson.id, {
              url: lesson.recording_url,
              expires_at: lesson.recording_expires_at
            });
          }
        });

        // Get unread message counts (disabled - messaging system uses new schema)
        const unreadMessageCounts = new Map<string, number>();
        // New schema uses read_at instead of is_read and doesn't have receiver_id
        // Messages are grouped by lesson_id, unread = sender_id != user.id AND read_at IS NULL

        const formattedLessons: Lesson[] = (lessonsData as RawLessonData[]).map((lesson) => {
          const recording = recordingsMap.get(lesson.id);
          const insight = insightsMap.get(lesson.id);
          return {
            id: lesson.id,
            learner_id: lesson.learner_id,
            learner_name: lesson.learners?.name,
            teacher_id: lesson.teacher_id,
            teacher_name: lesson.teacher_profiles?.profiles?.full_name || 'Teacher',
            teacher_avatar: lesson.teacher_profiles?.profiles?.avatar_url || null,
            subject_id: lesson.subject_id,
            subject_name: lesson.subjects.name,
            scheduled_time: lesson.scheduled_time,
            duration_minutes: lesson.duration_minutes,
            status: lesson.status,
            '100ms_room_id': lesson['100ms_room_id'],
            has_insights: !!insight,
            unread_messages: unreadMessageCounts.get(lesson.id) || 0,
            confirmation_status: lesson.confirmation_status,
            has_recording: !!recording,
            recording_url: recording?.url,
            recording_expires_at: recording?.expires_at,
            insight_title: insight?.title,
            insight_summary: insight?.summary,
            key_topics: insight?.key_topics || undefined
          };
        });
        setLessons(formattedLessons);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
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

      // Show success message and reload
      toast.success(`Lesson cancelled successfully. ${data.credits_refunded} credit(s) have been refunded to your account.`);
      setShowCancelModal(null);
      loadLessons();
    } catch (error) {
      console.error('Error cancelling lesson:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel lesson');
    } finally {
      setCancellingLessonId(null);
    }
  }

  // Group lessons by week
  function groupLessonsByWeek(lessonsToGroup: Lesson[]): { weekLabel: string; weekStart: Date; lessons: Lesson[] }[] {
    if (lessonsToGroup.length === 0) return [];

    const groups: Map<string, { weekLabel: string; weekStart: Date; lessons: Lesson[] }> = new Map();
    const now = new Date();

    lessonsToGroup.forEach(lesson => {
      const lessonDate = parseISO(lesson.scheduled_time);
      const weekStart = startOfWeek(lessonDate, { weekStartsOn: 1 }); // Monday start
      const weekEnd = endOfWeek(lessonDate, { weekStartsOn: 1 });
      const weekKey = format(weekStart, 'yyyy-MM-dd');

      // Create a readable week label
      let weekLabel: string;
      if (isSameWeek(lessonDate, now, { weekStartsOn: 1 })) {
        weekLabel = 'This Week';
      } else if (isSameWeek(lessonDate, addWeeks(now, 1), { weekStartsOn: 1 })) {
        weekLabel = 'Next Week';
      } else if (isSameWeek(lessonDate, subWeeks(now, 1), { weekStartsOn: 1 })) {
        weekLabel = 'Last Week';
      } else {
        weekLabel = `${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')}`;
      }

      if (!groups.has(weekKey)) {
        groups.set(weekKey, { weekLabel, weekStart, lessons: [] });
      }
      groups.get(weekKey)!.lessons.push(lesson);
    });

    // Sort groups by week start date
    const sortedGroups = Array.from(groups.values()).sort((a, b) => {
      // For upcoming, sort ascending (soonest first)
      // For past, sort descending (most recent first)
      if (filter === 'upcoming') {
        return a.weekStart.getTime() - b.weekStart.getTime();
      } else {
        return b.weekStart.getTime() - a.weekStart.getTime();
      }
    });

    return sortedGroups;
  }

  const groupedLessons = groupLessonsByWeek(lessons);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading your lessons...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">My Lessons</h1>
              <p className="text-gray-500 dark:text-gray-400 text-lg">View and manage all your lessons</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2 bg-white dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700 shadow-sm">
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'upcoming'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'past'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Past
              </button>
              <button
                onClick={() => setFilter('missed')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'missed'
                    ? 'bg-red-500 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                Missed
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'all'
                    ? 'bg-emerald-500 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        {lessons.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200 shadow-sm">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-gray-400" />
            </div>
            <p className="text-xl text-gray-700 mb-2">
              {filter === 'upcoming' && 'No upcoming lessons scheduled'}
              {filter === 'past' && 'No past lessons found'}
              {filter === 'missed' && 'No missed lessons'}
              {filter === 'all' && 'No lessons found'}
            </p>
            <p className="text-gray-500 mb-8">
              {filter === 'upcoming' && !isTeacher && 'Start your learning journey by booking your first session'}
              {filter === 'upcoming' && isTeacher && 'You are viewing this as a teacher. Your teaching schedule is on your teacher dashboard.'}
            </p>
            {filter === 'upcoming' && !isTeacher && (
              <button
                onClick={() => navigate('/subjects')}
                className="px-8 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition shadow-md"
              >
                Book a Session
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-8">
            {groupedLessons.map((group) => {
              const isExpanded = expandedWeeks.has(group.weekLabel);
              const toggleWeek = () => {
                setExpandedWeeks(prev => {
                  const newSet = new Set(prev);
                  if (newSet.has(group.weekLabel)) {
                    newSet.delete(group.weekLabel);
                  } else {
                    newSet.add(group.weekLabel);
                  }
                  return newSet;
                });
              };

              return (
              <div key={group.weekLabel} className="space-y-4">
                {/* Week Header - Clickable */}
                <button
                  onClick={toggleWeek}
                  className="w-full flex items-center space-x-4 group cursor-pointer"
                >
                  <div className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-bold text-sm transition ${
                    group.weekLabel === 'This Week'
                      ? 'bg-emerald-50 text-emerald-600 border border-emerald-200 group-hover:bg-emerald-100'
                      : group.weekLabel === 'Next Week'
                      ? 'bg-blue-50 text-blue-600 border border-blue-200 group-hover:bg-blue-100'
                      : group.weekLabel === 'Last Week'
                      ? 'bg-amber-50 text-amber-600 border border-amber-200 group-hover:bg-amber-100'
                      : 'bg-gray-100 text-gray-600 border border-gray-200 group-hover:bg-gray-200'
                  }`}>
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                    <span>{group.weekLabel}</span>
                  </div>
                  <div className="flex-1 h-px bg-gray-200"></div>
                  <span className="text-sm text-gray-500">
                    {group.lessons.length} lesson{group.lessons.length !== 1 ? 's' : ''}
                  </span>
                </button>

                {/* Lessons in this week - Only show when expanded */}
                {isExpanded && (
                <div className="space-y-3">
                  {group.lessons.map((lesson) => {
                    const lessonDate = parseISO(lesson.scheduled_time);
                    const isToday = format(lessonDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
                    const minutesUntilStart = differenceInMinutes(lessonDate, new Date());
                    const canJoin = minutesUntilStart <= 360 && minutesUntilStart >= -lesson.duration_minutes;
                    const canReschedule = minutesUntilStart > 30 && lesson.status === 'booked';
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
                        className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-emerald-300 transition shadow-sm"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center overflow-hidden border-2 border-emerald-200">
                        {lesson.teacher_avatar ? (
                          <img
                            src={lesson.teacher_avatar}
                            alt={lesson.teacher_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-emerald-600" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-xl font-bold text-gray-900 dark:text-white">{lesson.subject_name}</h4>
                          {isToday && !lessonIsPast && (
                            <span className="px-2 py-1 bg-emerald-100 text-emerald-600 text-xs font-bold rounded-full">
                              TODAY
                            </span>
                          )}
                          {canJoin && (
                            <span className="px-2 py-1 bg-green-100 text-green-600 text-xs font-bold rounded-full animate-pulse">
                              READY
                            </span>
                          )}
                          {(lesson.status === 'missed' || lesson.status === 'cancelled') && (
                            <span className="px-2 py-1 bg-red-100 text-red-600 text-xs font-bold rounded-full">
                              MISSED
                            </span>
                          )}
                          {lessonIsPast && lesson.status !== 'missed' && lesson.status !== 'cancelled' && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                              COMPLETED
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {isTeacher ? (
                            <>for <span className="font-semibold text-emerald-600">{lesson.learner_name}</span></>
                          ) : (
                            <>with {lesson.teacher_name}</>
                          )}
                        </p>

                        {/* Lesson topic/summary from insights */}
                        {lessonIsPast && lesson.has_insights && lesson.insight_title && (
                          <div className="mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
                            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                              {lesson.insight_title}
                            </p>
                            {lesson.key_topics && lesson.key_topics.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-1.5">
                                {lesson.key_topics.map((topic, idx) => {
                                  // Special styling for Tafsir badge
                                  if (topic.toLowerCase() === 'tafsir') {
                                    return (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 text-xs font-semibold rounded-full border border-purple-200 dark:border-purple-700"
                                      >
                                        📖 Tafsir
                                      </span>
                                    );
                                  }
                                  // Special styling for Memorization badge
                                  if (topic.toLowerCase() === 'memorization') {
                                    return (
                                      <span
                                        key={idx}
                                        className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-xs font-medium rounded-full"
                                      >
                                        🧠 Memorization
                                      </span>
                                    );
                                  }
                                  // Default styling for other topics
                                  return (
                                    <span
                                      key={idx}
                                      className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs rounded-full"
                                    >
                                      {topic}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
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
                          <span className="px-2 py-1 bg-emerald-50 text-emerald-600 text-sm font-semibold rounded-lg border border-emerald-200">
                            {lesson.duration_minutes} min
                          </span>
                        </div>
                        {!lessonIsPast && (
                          <p className="text-xs text-gray-400">
                            Room opens 6hrs before
                          </p>
                        )}
                      </div>

                      <div className="flex items-center space-x-3">
                        {/* Message button - show for teachers always, for students only if unread */}
                        {(isTeacher || lesson.unread_messages > 0) && !lessonIsPast && (
                          <button
                            onClick={() => navigate(`/lesson/${lesson.id}`)}
                            className={`relative px-4 py-2 rounded-lg font-medium transition flex items-center space-x-2 ${
                              lesson.unread_messages > 0
                                ? 'bg-purple-500 hover:bg-purple-600 text-white animate-pulse'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900'
                            }`}
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Message</span>
                            {lesson.unread_messages > 0 && (
                              <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                                {lesson.unread_messages}
                              </span>
                            )}
                          </button>
                        )}

                        {lessonIsPast && (() => {
                          // Calculate minutes since lesson ended
                          const lessonEndTime = new Date(parseISO(lesson.scheduled_time).getTime() + (lesson.duration_minutes || 30) * 60000);
                          const minutesSinceEnd = differenceInMinutes(new Date(), lessonEndTime);

                          if (lesson.has_insights) {
                            // Insights available - show button
                            return (
                              <button
                                onClick={handleViewInsights}
                                className={`px-4 py-2 text-white rounded-lg font-medium transition flex items-center space-x-2 ${
                                  lesson.subject_name?.toLowerCase().includes('quran')
                                    ? 'bg-emerald-500 hover:bg-emerald-600'
                                    : 'bg-blue-500 hover:bg-blue-600'
                                }`}
                              >
                                <BookOpen className="w-4 h-4" />
                                <span>Insights</span>
                              </button>
                            );
                          } else if (lesson.has_recording && minutesSinceEnd < 15) {
                            // Recording exists, less than 15 mins - still processing
                            return (
                              <div className="px-4 py-2 bg-gray-100 text-gray-500 rounded-lg font-medium flex items-center space-x-2 cursor-default">
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>Processing...</span>
                              </div>
                            );
                          } else if (lesson.has_recording && minutesSinceEnd >= 15) {
                            // Recording exists but insights failed after 15 mins
                            return (
                              <div className="px-3 py-2 bg-amber-50 text-amber-600 rounded-lg text-sm flex items-center space-x-2 border border-amber-200">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Insights unavailable</span>
                              </div>
                            );
                          }
                          // No recording - lesson didn't happen, show nothing
                          return null;
                        })()}

                        {/* Recording buttons for past lessons */}
                        {lessonIsPast && lesson.has_recording && lesson.recording_url && (
                          (() => {
                            const daysLeft = lesson.recording_expires_at
                              ? differenceInDays(parseISO(lesson.recording_expires_at), new Date())
                              : 0;
                            const isExpired = daysLeft <= 0;

                            return isExpired ? (
                              <span className="text-xs text-gray-400 px-2">Recording expired</span>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <a
                                  href={lesson.recording_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 rounded-lg border border-emerald-200 transition text-sm flex items-center space-x-1"
                                >
                                  <Play className="w-4 h-4" />
                                  <span>Watch</span>
                                </a>
                                <a
                                  href={lesson.recording_url}
                                  download
                                  className="p-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-lg transition"
                                  title={`Download - ${daysLeft} days left`}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <span className="text-xs text-amber-600">{daysLeft}d left</span>
                              </div>
                            );
                          })()
                        )}

                        {!lessonIsPast && canReschedule && !isTeacher && (
                          <>
                            <button
                              onClick={() => handleCancelClick(lesson.id, lesson.scheduled_time)}
                              disabled={cancellingLessonId === lesson.id}
                              className="px-4 py-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg font-medium transition flex items-center space-x-2 border border-red-200"
                            >
                              {cancellingLessonId === lesson.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <XCircle className="w-4 h-4" />
                              )}
                              <span>Cancel</span>
                            </button>
                            <button
                              onClick={handleReschedule}
                              className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-lg font-medium transition flex items-center space-x-2"
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
                            className={`px-6 py-3 font-semibold rounded-lg transition shadow-md flex items-center space-x-2 ${
                              canJoin
                                ? 'bg-emerald-500 hover:bg-emerald-600 text-white'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
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
                )}
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Message Modal */}
      {viewingMessage && messageContent && (
        <>
          <div
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50"
            onClick={closeMessage}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-purple-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Message from Teacher</h3>
                    <p className="text-sm text-gray-500">
                      {lessons.find(l => l.id === viewingMessage)?.teacher_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeMessage}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-gray-500 hover:text-gray-900"
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
                  className="w-full mt-6 px-6 py-3 bg-purple-500 hover:bg-purple-600 text-white rounded-lg font-semibold transition"
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
            className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-50"
            onClick={() => setShowCancelModal(null)}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    showCancelModal.canCancel
                      ? 'bg-red-100'
                      : 'bg-amber-100'
                  }`}>
                    <XCircle className={`w-5 h-5 ${
                      showCancelModal.canCancel ? 'text-red-600' : 'text-amber-600'
                    }`} />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">
                    {showCancelModal.canCancel ? 'Cancel Lesson' : 'Cannot Cancel'}
                  </h3>
                </div>
                <button
                  onClick={() => setShowCancelModal(null)}
                  className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 transition flex items-center justify-center text-gray-500 hover:text-gray-900"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {showCancelModal.canCancel ? (
                  <>
                    <p className="text-gray-600 mb-4">
                      Are you sure you want to cancel this lesson? Your credit will be refunded to your account.
                    </p>
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 mb-6">
                      <p className="text-emerald-600 text-sm">
                        Your lesson credit will be refunded immediately
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-gray-600 mb-4">
                      This lesson starts in less than 2 hours. You cannot cancel at this time.
                    </p>
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
                      <p className="text-amber-600 text-sm">
                        Lessons can only be cancelled 2+ hours before start time. You can still reschedule this lesson.
                      </p>
                    </div>
                  </>
                )}

                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowCancelModal(null)}
                    className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition"
                  >
                    {showCancelModal.canCancel ? 'Keep Lesson' : 'Close'}
                  </button>
                  {showCancelModal.canCancel ? (
                    <button
                      onClick={handleCancelLesson}
                      disabled={cancellingLessonId !== null}
                      className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2 disabled:opacity-50"
                    >
                      {cancellingLessonId ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Cancelling...</span>
                        </>
                      ) : (
                        <span>Yes, Cancel</span>
                      )}
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        setShowCancelModal(null);
                        navigate(`/reschedule-lesson?lessonId=${showCancelModal.lessonId}`);
                      }}
                      className="flex-1 px-4 py-3 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-medium transition flex items-center justify-center space-x-2"
                    >
                      <CalendarClock className="w-4 h-4" />
                      <span>Reschedule Instead</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
