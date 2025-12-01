import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, RefreshCw, BookOpen, User, CalendarClock, Sparkles, MessageCircle, X, ArrowRight, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, differenceInMinutes, isPast } from 'date-fns';

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
  unread_messages: number;
  confirmation_status: string;
  teacher_acknowledgment_message: string | null;
}

interface UpcomingSessionsCardProps {
  learnerId?: string;
}

export default function UpcomingSessionsCard({ learnerId }: UpcomingSessionsCardProps) {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<UpcomingLesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewingMessage, setViewingMessage] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState<string>('');

  useEffect(() => {
    loadUpcomingSessions();

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
        (payload) => {
          console.log('📡 Lesson updated in real-time:', payload);
          // Refresh lessons when any lesson is updated (without showing loading spinner)
          loadUpcomingSessions(false);
        }
      )
      .subscribe();

    // Polling fallback: refresh every 30 seconds to catch any missed updates
    const pollInterval = setInterval(() => {
      console.log('🔄 Polling for lesson updates...');
      loadUpcomingSessions(false);
    }, 30000); // 30 seconds

    // Cleanup subscription and polling on unmount
    return () => {
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerId]);

  async function loadUpcomingSessions(showLoading = true) {
    try {
      if (showLoading) {
        setLoading(true);
      }
      let targetLearnerIds: string[] = learnerId ? [learnerId] : [];

      // If no learnerId provided, get ALL learners for this parent
      if (!learnerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          console.log('❌ No authenticated user found');
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
          setLoading(false);
          return;
        }

        if (!learners || learners.length === 0) {
          // No learners found - this could be a lightweight child view
          // In this case, learnerId should be passed as a prop
          setLoading(false);
          return;
        }

        targetLearnerIds = learners.map(l => l.id);
      }

      console.log('🔍 UpcomingSessionsCard: targetLearnerIds =', targetLearnerIds);

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
          "100ms_room_id",
          confirmation_status,
          teacher_acknowledgment_message,
          learners(
            name
          ),
          teacher_profiles(
            user_id,
            profiles(
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
        console.error('❌ Error fetching lessons:', error);
        throw error;
      }

      console.log('✅ Fetched lessons:', lessonsData?.length || 0, 'lessons');
      console.log('📋 Raw lessons data:', JSON.stringify(lessonsData, null, 2));

      if (lessonsData) {
        // Check which lessons have insights
        const lessonIds = lessonsData.map((l: any) => l.id);

        // Only query if we have lessons - chunk to avoid URL length limits
        let lessonsWithInsights = new Set<string>();
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

        // Get current user ID to check for unread messages
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        // Get unread message counts for each lesson using message_reads table
        // The new schema uses message_reads table to track which messages have been read
        const unreadMessageCounts = new Map<string, number>();
        if (currentUserId && lessonIds.length > 0) {
          try {
            // Query messages for these lessons that the user hasn't read yet
            // Using the new schema with message_reads join table
            const { data: messagesData } = await supabase
              .from('lesson_messages')
              .select(`
                id,
                lesson_id,
                sender_id,
                message_reads!left(user_id)
              `)
              .in('lesson_id', lessonIds)
              .neq('sender_id', currentUserId); // Don't count messages sent by the user

            // Count messages that don't have a read record for this user
            messagesData?.forEach((msg: any) => {
              const hasRead = msg.message_reads?.some((r: any) => r.user_id === currentUserId);
              if (!hasRead) {
                const count = unreadMessageCounts.get(msg.lesson_id) || 0;
                unreadMessageCounts.set(msg.lesson_id, count + 1);
              }
            });
          } catch (msgError) {
            // Silently ignore - messages feature may not be fully set up
          }
        }

        const now = new Date();

        const lessonsWithRelations = lessonsData.filter((lesson: any) => {
          const hasRelations = lesson.learners && lesson.teacher_profiles && lesson.subjects;
          if (!hasRelations) {
            console.log('⚠️ Lesson missing relations:', lesson.id, {
              hasLearners: !!lesson.learners,
              hasTeacherProfiles: !!lesson.teacher_profiles,
              hasSubjects: !!lesson.subjects
            });
          }
          return hasRelations;
        });
        console.log('📊 Lessons with valid relations:', lessonsWithRelations.length);

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
            teacher_acknowledgment_message: lesson.teacher_acknowledgment_message
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

      // Get the most recent unread message for this lesson
      const { data: messages, error } = await supabase
        .from('lesson_messages')
        .select('id, message_text, sender_id, created_at')
        .eq('lesson_id', lessonId)
        .eq('receiver_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(1);

      if (error) throw error;

      if (messages && messages.length > 0) {
        setMessageContent(messages[0].message_text);
        setViewingMessage(lessonId);

        // Mark message as read
        await supabase
          .from('lesson_messages')
          .update({ is_read: true })
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

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-slate-700 rounded w-48"></div>
          <div className="h-24 bg-slate-700 rounded"></div>
          <div className="h-24 bg-slate-700 rounded"></div>
        </div>
      </div>
    );
  }

  if (lessons.length === 0) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <h3 className="text-2xl font-bold text-white mb-6">My Classes</h3>

        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            <Calendar className="w-10 h-10 text-slate-600" />
          </div>
          <p className="text-xl text-slate-300 mb-2">You don't have any sessions scheduled yet.</p>
          <p className="text-slate-500 mb-8">Start your learning journey by booking your first session</p>

          <div className="flex items-center justify-center gap-4">
            <button
              onClick={() => navigate('/subjects')}
              className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-500/20 flex items-center space-x-2"
            >
              <BookOpen className="w-5 h-5" />
              <span>Book a Session</span>
            </button>

            <button
              onClick={() => loadUpcomingSessions(true)}
              className="px-6 py-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition flex items-center space-x-2"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">My Classes</h3>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => navigate('/my-classes')}
            className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg font-semibold transition flex items-center space-x-2 border border-cyan-500/30"
          >
            <span>View All</span>
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => loadUpcomingSessions(true)}
            className="p-2 text-slate-400 hover:text-cyan-400 transition hover:rotate-180 duration-500"
            title="Refresh lessons"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {lessons.map((lesson) => {
          const lessonDate = parseISO(lesson.scheduled_time);
          const isToday = format(lessonDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const minutesUntilStart = differenceInMinutes(lessonDate, new Date());
          const canJoin = minutesUntilStart <= 360 && minutesUntilStart >= -lesson.duration_minutes; // Can join 6 hours before
          const canReschedule = minutesUntilStart > 30; // Can reschedule if more than 30 minutes away
          const lessonIsPast = isPast(new Date(lessonDate.getTime() + lesson.duration_minutes * 60000));

          const handleJoin = () => {
            if (!lesson['100ms_room_id']) {
              alert('Session room is not ready yet. Please contact support if this issue persists.');
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
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-cyan-500/30 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                    {lesson.teacher_avatar ? (
                      <img
                        src={lesson.teacher_avatar}
                        alt={lesson.teacher_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1 flex-wrap gap-1">
                      <h4 className="text-lg font-semibold text-white">{lesson.subject_name}</h4>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-full">
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
                    <p className="text-sm text-slate-400">
                      {!learnerId && <span className="font-semibold text-cyan-400">{lesson.learner_name}'s class</span>}{!learnerId && ' - '}with {lesson.teacher_name}
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
                    <div className="flex items-center space-x-2 text-slate-300 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {format(lessonDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-cyan-400 mb-1">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {format(lessonDate, 'h:mm a')}
                      </span>
                    </div>
                    <div className="flex items-center justify-end space-x-1 mb-1">
                      <span className="px-2 py-1 bg-cyan-500/10 text-cyan-300 text-sm font-semibold rounded-lg border border-cyan-500/20">
                        {lesson.duration_minutes} min
                      </span>
                    </div>
                    {!canJoin && minutesUntilStart > 360 && (
                      <p className="text-xs text-slate-500">
                        Opens 6 hours before
                      </p>
                    )}
                  </div>

                  <div className="flex items-center space-x-3">
                    {lesson.unread_messages > 0 && (
                      <button
                        onClick={() => viewMessage(lesson.id)}
                        className="relative px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition flex items-center space-x-2 animate-pulse"
                      >
                        <MessageCircle className="w-4 h-4" />
                        <span>Message from Teacher</span>
                        {lesson.unread_messages > 1 && (
                          <span className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full text-xs font-bold flex items-center justify-center">
                            {lesson.unread_messages}
                          </span>
                        )}
                      </button>
                    )}

                    {lessonIsPast && lesson.has_insights && (
                      <button
                        onClick={handleViewInsights}
                        className={`px-4 py-2 bg-gradient-to-r text-white rounded-lg font-medium transition flex items-center space-x-2 ${
                          lesson.subject_name?.toLowerCase().includes('quran')
                            ? 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                            : 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                        }`}
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
                      <button
                        onClick={handleReschedule}
                        className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg font-medium transition flex items-center space-x-2"
                      >
                        <CalendarClock className="w-4 h-4" />
                        <span>Reschedule</span>
                      </button>
                    )}

                    {!lessonIsPast && (
                      <button
                        onClick={handleJoin}
                        disabled={!canJoin}
                        className={`px-6 py-3 font-semibold rounded-lg transition shadow-lg flex items-center space-x-2 ${
                          canJoin
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white shadow-cyan-500/20'
                            : 'bg-slate-700 text-slate-400 cursor-not-allowed'
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

      {/* Message Modal */}
      {viewingMessage && messageContent && (
        <>
          <div
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50"
            onClick={closeMessage}
          ></div>

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl shadow-2xl max-w-lg w-full border border-slate-700">
              <div className="flex items-center justify-between p-6 border-b border-slate-700">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                    <MessageCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Message from Teacher</h3>
                    <p className="text-sm text-slate-400">
                      {lessons.find(l => l.id === viewingMessage)?.teacher_name}
                    </p>
                  </div>
                </div>
                <button
                  onClick={closeMessage}
                  className="w-10 h-10 rounded-lg bg-slate-700 hover:bg-slate-600 transition flex items-center justify-center text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                  <p className="text-slate-200 leading-relaxed whitespace-pre-wrap">
                    {messageContent}
                  </p>
                </div>

                <button
                  onClick={closeMessage}
                  className="w-full mt-6 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-semibold transition"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
