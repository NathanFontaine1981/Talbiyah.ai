import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, User, CalendarClock, Sparkles, MessageCircle, X, ArrowLeft, Filter, Play, Download, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, differenceInMinutes, isPast, differenceInDays } from 'date-fns';

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

interface RecordingData {
  lesson_id: string;
  recording_url: string;
  expires_at: string;
}

interface MessageData {
  lesson_id: string;
}

export default function MyClasses() {
  const navigate = useNavigate();
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
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

        let learnerId = learner?.id;

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

        let lessonsWithInsights = new Set();
        if (lessonIds.length > 0) {
          const { data: insightsData } = await supabase
            .from('lesson_insights')
            .select('lesson_id')
            .in('lesson_id', lessonIds);
          lessonsWithInsights = new Set(insightsData?.map(i => i.lesson_id) || []);
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
            has_insights: lessonsWithInsights.has(lesson.id),
            unread_messages: unreadMessageCounts.get(lesson.id) || 0,
            confirmation_status: lesson.confirmation_status,
            has_recording: !!recording,
            recording_url: recording?.url,
            recording_expires_at: recording?.expires_at
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
              <h1 className="text-4xl font-bold text-white mb-2">My Lessons</h1>
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
              {filter === 'upcoming' && !isTeacher && 'Start your learning journey by booking your first session'}
              {filter === 'upcoming' && isTeacher && 'You are viewing this as a teacher. Your teaching schedule is on your teacher dashboard.'}
            </p>
            {filter === 'upcoming' && !isTeacher && (
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
                        <p className="text-sm text-slate-400">
                          {isTeacher ? (
                            <>for <span className="font-semibold text-cyan-400">{lesson.learner_name}</span></>
                          ) : (
                            <>with {lesson.teacher_name}</>
                          )}
                        </p>
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
                        {!lessonIsPast && (
                          <p className="text-xs text-cyan-400/70">
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
                                ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white animate-pulse'
                                : 'bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white'
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

                        {lessonIsPast && (
                          <button
                            onClick={handleViewInsights}
                            className={`px-4 py-2 bg-gradient-to-r text-white rounded-lg font-medium transition flex items-center space-x-2 ${
                              lesson.subject_name?.toLowerCase().includes('quran')
                                ? 'from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                                : 'from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700'
                            }`}
                          >
                            <BookOpen className="w-4 h-4" />
                            <span>Insights</span>
                          </button>
                        )}

                        {/* Recording buttons for past lessons */}
                        {lessonIsPast && lesson.has_recording && lesson.recording_url && (
                          (() => {
                            const daysLeft = lesson.recording_expires_at
                              ? differenceInDays(parseISO(lesson.recording_expires_at), new Date())
                              : 0;
                            const isExpired = daysLeft <= 0;

                            return isExpired ? (
                              <span className="text-xs text-slate-500 px-2">Recording expired</span>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <a
                                  href={lesson.recording_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-400 hover:text-cyan-300 rounded-lg border border-cyan-500/30 hover:border-cyan-500/50 transition text-sm flex items-center space-x-1"
                                >
                                  <Play className="w-4 h-4" />
                                  <span>Watch</span>
                                </a>
                                <a
                                  href={lesson.recording_url}
                                  download
                                  className="p-2 bg-slate-700 hover:bg-slate-600 text-slate-300 hover:text-white rounded-lg transition"
                                  title={`Download - ${daysLeft} days left`}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <span className="text-xs text-amber-400">{daysLeft}d left</span>
                              </div>
                            );
                          })()
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
