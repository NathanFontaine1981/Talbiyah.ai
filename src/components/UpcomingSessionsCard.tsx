import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, RefreshCw, BookOpen, User, CalendarClock, Sparkles, MessageCircle, X, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, differenceInMinutes, isPast } from 'date-fns';

interface UpcomingLesson {
  id: string;
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
  }, [learnerId]);

  async function loadUpcomingSessions() {
    try {
      let targetLearnerId = learnerId;

      // If no learnerId provided, get current user's learner
      if (!targetLearnerId) {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: learner } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)
          .maybeSingle();

        if (!learner) {
          setLoading(false);
          return;
        }

        targetLearnerId = learner.id;
      }

      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          status,
          teacher_id,
          subject_id,
          "100ms_room_id",
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
        .eq('learner_id', targetLearnerId)
        .eq('status', 'booked')
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(5);

      if (error) throw error;

      if (lessonsData) {
        // Check which lessons have insights
        const lessonIds = lessonsData.map((l: any) => l.id);
        const { data: insightsData } = await supabase
          .from('lesson_insights')
          .select('lesson_id')
          .in('lesson_id', lessonIds);

        const lessonsWithInsights = new Set(insightsData?.map(i => i.lesson_id) || []);

        // Get current user ID to check for unread messages
        const { data: { user } } = await supabase.auth.getUser();
        const currentUserId = user?.id;

        // Get unread message counts for each lesson
        const unreadMessageCounts = new Map<string, number>();
        if (currentUserId) {
          const { data: messagesData } = await supabase
            .from('lesson_messages')
            .select('lesson_id', { count: 'exact' })
            .in('lesson_id', lessonIds)
            .eq('receiver_id', currentUserId)
            .eq('is_read', false);

          // Count messages per lesson
          messagesData?.forEach((msg: any) => {
            const count = unreadMessageCounts.get(msg.lesson_id) || 0;
            unreadMessageCounts.set(msg.lesson_id, count + 1);
          });
        }

        const formattedLessons: UpcomingLesson[] = lessonsData.map((lesson: any) => ({
          id: lesson.id,
          teacher_id: lesson.teacher_id,
          teacher_name: lesson.teacher_profiles.profiles.full_name || 'Teacher',
          teacher_avatar: lesson.teacher_profiles.profiles.avatar_url,
          subject_id: lesson.subject_id,
          subject_name: lesson.subjects.name,
          scheduled_time: lesson.scheduled_time,
          duration_minutes: lesson.duration_minutes,
          '100ms_room_id': lesson['100ms_room_id'],
          has_insights: lessonsWithInsights.has(lesson.id),
          unread_messages: unreadMessageCounts.get(lesson.id) || 0
        }));
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
              onClick={loadUpcomingSessions}
              className="px-6 py-4 bg-slate-700/50 hover:bg-slate-700 text-slate-300 hover:text-white font-medium rounded-xl transition flex items-center space-x-2"
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
            onClick={loadUpcomingSessions}
            className="p-2 text-slate-400 hover:text-cyan-400 transition"
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
                    <div className="flex items-center space-x-2 mb-1">
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
                    </div>
                    <p className="text-sm text-slate-400">with {lesson.teacher_name}</p>
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
                    <div className="flex items-center space-x-2 text-cyan-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {format(lessonDate, 'h:mm a')}
                      </span>
                    </div>
                    {!canJoin && minutesUntilStart > 360 && (
                      <p className="text-xs text-slate-500 mt-1">
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
                        className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white rounded-lg font-medium transition flex items-center space-x-2"
                      >
                        <Sparkles className="w-4 h-4" />
                        <span>View Insights</span>
                      </button>
                    )}

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
