import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, User, CalendarClock, Sparkles, MessageCircle, X, ArrowLeft, Filter } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, differenceInMinutes, isPast } from 'date-fns';

interface Lesson {
  id: string;
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
}

export default function MyClasses() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'upcoming' | 'past' | 'missed' | 'all'>('upcoming');
  const [viewingMessage, setViewingMessage] = useState<string | null>(null);
  const [messageContent, setMessageContent] = useState<string>('');

  useEffect(() => {
    loadLessons();
  }, [filter]);

  async function loadLessons() {
    try {
      setLoading(true);
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

      let query = supabase
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
        .eq('learner_id', learner.id);

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
        const lessonIds = lessonsData.map((l: any) => l.id);
        const { data: insightsData } = await supabase
          .from('lesson_insights')
          .select('lesson_id')
          .in('lesson_id', lessonIds);

        const lessonsWithInsights = new Set(insightsData?.map(i => i.lesson_id) || []);

        // Get unread message counts
        const unreadMessageCounts = new Map<string, number>();
        const { data: messagesData } = await supabase
          .from('lesson_messages')
          .select('lesson_id', { count: 'exact' })
          .in('lesson_id', lessonIds)
          .eq('receiver_id', user.id)
          .eq('is_read', false);

        messagesData?.forEach((msg: any) => {
          const count = unreadMessageCounts.get(msg.lesson_id) || 0;
          unreadMessageCounts.set(msg.lesson_id, count + 1);
        });

        const formattedLessons: Lesson[] = lessonsData.map((lesson: any) => ({
          id: lesson.id,
          teacher_id: lesson.teacher_id,
          teacher_name: lesson.teacher_profiles.profiles.full_name || 'Teacher',
          teacher_avatar: lesson.teacher_profiles.profiles.avatar_url,
          subject_id: lesson.subject_id,
          subject_name: lesson.subjects.name,
          scheduled_time: lesson.scheduled_time,
          duration_minutes: lesson.duration_minutes,
          status: lesson.status,
          '100ms_room_id': lesson['100ms_room_id'],
          has_insights: lessonsWithInsights.has(lesson.id),
          unread_messages: unreadMessageCounts.get(lesson.id) || 0
        }));
        setLessons(formattedLessons);
      }
    } catch (error) {
      console.error('Error loading lessons:', error);
    } finally {
      setLoading(false);
    }
  }

  async function viewMessage(lessonId: string) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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

        await supabase
          .from('lesson_messages')
          .update({ is_read: true })
          .eq('id', messages[0].id);

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-white text-lg">Loading your classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">My Classes</h1>
              <p className="text-slate-400 text-lg">View and manage all your lessons</p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center space-x-2 bg-slate-800/50 rounded-xl p-2 border border-slate-700">
              <button
                onClick={() => setFilter('upcoming')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'upcoming'
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Upcoming
              </button>
              <button
                onClick={() => setFilter('past')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'past'
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Past
              </button>
              <button
                onClick={() => setFilter('missed')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'missed'
                    ? 'bg-red-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                Missed
              </button>
              <button
                onClick={() => setFilter('all')}
                className={`px-6 py-2 rounded-lg font-semibold transition ${
                  filter === 'all'
                    ? 'bg-cyan-500 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-slate-700'
                }`}
              >
                All
              </button>
            </div>
          </div>
        </div>

        {/* Lessons List */}
        {lessons.length === 0 ? (
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-12 text-center border border-slate-700">
            <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
              <Calendar className="w-10 h-10 text-slate-600" />
            </div>
            <p className="text-xl text-slate-300 mb-2">
              {filter === 'upcoming' && 'No upcoming classes scheduled'}
              {filter === 'past' && 'No past classes found'}
              {filter === 'missed' && 'No missed classes'}
              {filter === 'all' && 'No classes found'}
            </p>
            <p className="text-slate-500 mb-8">
              {filter === 'upcoming' && 'Start your learning journey by booking your first session'}
            </p>
            {filter === 'upcoming' && (
              <button
                onClick={() => navigate('/subjects')}
                className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 text-white font-semibold rounded-xl transition shadow-lg shadow-cyan-500/20"
              >
                Book a Session
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {lessons.map((lesson) => {
              const lessonDate = parseISO(lesson.scheduled_time);
              const isToday = format(lessonDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
              const minutesUntilStart = differenceInMinutes(lessonDate, new Date());
              const canJoin = minutesUntilStart <= 360 && minutesUntilStart >= -lesson.duration_minutes;
              const canReschedule = minutesUntilStart > 30 && lesson.status === 'booked';
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
                  className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-slate-700/50 hover:border-cyan-500/30 transition"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-16 h-16 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                        {lesson.teacher_avatar ? (
                          <img
                            src={lesson.teacher_avatar}
                            alt={lesson.teacher_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-8 h-8 text-slate-400" />
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h4 className="text-xl font-bold text-white">{lesson.subject_name}</h4>
                          {isToday && !lessonIsPast && (
                            <span className="px-2 py-1 bg-cyan-500/20 text-cyan-400 text-xs font-bold rounded-full">
                              TODAY
                            </span>
                          )}
                          {canJoin && (
                            <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs font-bold rounded-full animate-pulse">
                              READY
                            </span>
                          )}
                          {(lesson.status === 'missed' || lesson.status === 'cancelled') && (
                            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold rounded-full">
                              MISSED
                            </span>
                          )}
                          {lessonIsPast && lesson.status !== 'missed' && lesson.status !== 'cancelled' && (
                            <span className="px-2 py-1 bg-slate-700 text-slate-400 text-xs font-bold rounded-full">
                              COMPLETED
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
                        <p className="text-xs text-slate-500 mt-1">
                          {lesson.duration_minutes} minutes
                        </p>
                      </div>

                      <div className="flex items-center space-x-3">
                        {lesson.unread_messages > 0 && (
                          <button
                            onClick={() => viewMessage(lesson.id)}
                            className="relative px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-lg font-medium transition flex items-center space-x-2 animate-pulse"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Message</span>
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
        )}
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
