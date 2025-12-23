import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Calendar, Clock, Video, RefreshCw, User, CheckCircle, History, BookOpen, Play, Download } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, differenceInMinutes, differenceInDays } from 'date-fns';

interface TeacherSession {
  id: string;
  student_name: string;
  student_avatar: string | null;
  subject_name: string;
  scheduled_time: string;
  duration_minutes: number;
  teacher_confirmed: boolean;
  '100ms_room_id': string | null;
  teacher_room_code: string | null;
  status?: string;
  has_insights?: boolean;
  has_recording?: boolean;
  recording_url?: string;
  recording_expires_at?: string;
}

export default function TeacherSessionsCard() {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<TeacherSession[]>([]);
  const [pastSessions, setPastSessions] = useState<TeacherSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

  useEffect(() => {
    loadUpcomingSessions();
    loadPastSessions();
  }, []);

  async function loadUpcomingSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!teacherProfile) {
        setLoading(false);
        return;
      }

      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          status,
          teacher_confirmed,
          "100ms_room_id",
          teacher_room_code,
          learners(
            name,
            parent_id,
            profiles!learners_parent_id_fkey(
              avatar_url
            )
          ),
          subjects(
            name
          )
        `)
        .eq('teacher_id', teacherProfile.id)
        .eq('status', 'booked')
        .order('scheduled_time', { ascending: true })
        .limit(10); // Fetch more to filter client-side

      if (error) {
        console.error('Error fetching lessons:', error);
        setSessions([]);
        setLoading(false);
        return;
      }

      if (lessonsData && lessonsData.length > 0) {
        const now = new Date();

        const formattedSessions: TeacherSession[] = lessonsData
          .filter((lesson: any) => lesson.learners && lesson.subjects) // Filter out lessons with missing relations
          .filter((lesson: any) => {
            // Show lesson until its END time (scheduled_time + duration)
            const lessonStart = new Date(lesson.scheduled_time);
            const lessonEnd = new Date(lessonStart.getTime() + lesson.duration_minutes * 60000);
            return lessonEnd > now;
          })
          .map((lesson: any) => ({
            id: lesson.id,
            student_name: lesson.learners?.name || 'Student',
            student_avatar: lesson.learners?.profiles?.avatar_url || null,
            subject_name: lesson.subjects?.name || 'Unknown Subject',
            scheduled_time: lesson.scheduled_time,
            duration_minutes: lesson.duration_minutes,
            teacher_confirmed: lesson.teacher_confirmed || false,
            '100ms_room_id': lesson['100ms_room_id'],
            teacher_room_code: lesson.teacher_room_code
          }))
          .slice(0, 5); // Limit to 5 after filtering
        setSessions(formattedSessions);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error loading upcoming sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadPastSessions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!teacherProfile) return;

      const { data: lessonsData, error } = await supabase
        .from('lessons')
        .select(`
          id,
          scheduled_time,
          duration_minutes,
          status,
          teacher_confirmed,
          "100ms_room_id",
          teacher_room_code,
          recording_url,
          recording_expires_at,
          learners(
            name,
            parent_id,
            profiles!learners_parent_id_fkey(
              avatar_url
            )
          ),
          subjects(
            name
          )
        `)
        .eq('teacher_id', teacherProfile.id)
        .eq('status', 'completed')
        .order('scheduled_time', { ascending: false })
        .limit(10);

      if (error) {
        console.error('Error fetching past lessons:', error);
        setPastSessions([]);
        return;
      }

      if (lessonsData && lessonsData.length > 0) {
        // Fetch insights and recordings separately
        const lessonIds = lessonsData.map((l: any) => l.id);

        // Get insights
        const insightsSet = new Set<string>();
        if (lessonIds.length > 0) {
          const { data: insightsData } = await supabase
            .from('lesson_insights')
            .select('lesson_id')
            .in('lesson_id', lessonIds);
          insightsData?.forEach((i: any) => insightsSet.add(i.lesson_id));
        }

        // Build recording map from lessons data (recording_url is now on lessons table)
        const recordingsMap = new Map<string, { url: string; expires_at: string }>();
        lessonsData.forEach((lesson: any) => {
          if (lesson.recording_url) {
            recordingsMap.set(lesson.id, { url: lesson.recording_url, expires_at: lesson.recording_expires_at });
          }
        });

        const formattedSessions: TeacherSession[] = lessonsData
          .filter((lesson: any) => lesson.learners && lesson.subjects)
          .map((lesson: any) => {
            const recording = recordingsMap.get(lesson.id);
            return {
              id: lesson.id,
              student_name: lesson.learners?.name || 'Student',
              student_avatar: lesson.learners?.profiles?.avatar_url || null,
              subject_name: lesson.subjects?.name || 'Unknown Subject',
              scheduled_time: lesson.scheduled_time,
              duration_minutes: lesson.duration_minutes,
              teacher_confirmed: lesson.teacher_confirmed || false,
              '100ms_room_id': lesson['100ms_room_id'],
              teacher_room_code: lesson.teacher_room_code,
              status: lesson.status,
              has_insights: insightsSet.has(lesson.id),
              has_recording: !!recording,
              recording_url: recording?.url,
              recording_expires_at: recording?.expires_at
            };
          });
        setPastSessions(formattedSessions);
      } else {
        setPastSessions([]);
      }
    } catch (error) {
      console.error('Error loading past sessions:', error);
      setPastSessions([]);
    }
  }

  async function confirmBooking(sessionId: string) {
    try {
      setConfirmingId(sessionId);

      // Get current user (teacher)
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Get lesson details including learner and parent info
      const { data: lessonData, error: lessonError } = await supabase
        .from('lessons')
        .select(`
          id,
          learner_id,
          teacher_id,
          learners!inner(
            id,
            parent_id,
            name
          )
        `)
        .eq('id', sessionId)
        .single();

      if (lessonError) throw lessonError;

      const learnerId = lessonData.learner_id;
      const studentName = lessonData.learners.name;
      const teacherId = lessonData.teacher_id;

      // Check how many completed or confirmed lessons this student has had with this teacher
      const { count, error: countError } = await supabase
        .from('lessons')
        .select('id', { count: 'exact', head: true })
        .eq('learner_id', learnerId)
        .eq('teacher_id', teacherId)
        .or('status.eq.completed,teacher_confirmed.eq.true')
        .neq('id', sessionId); // Exclude current lesson

      if (countError) throw countError;

      const isFirstLesson = count === 0;

      // Update lesson to confirmed
      const { error: updateError } = await supabase
        .from('lessons')
        .update({
          teacher_confirmed: true,
          teacher_confirmed_at: new Date().toISOString()
        })
        .eq('id', sessionId);

      if (updateError) throw updateError;

      // If this is the first lesson with this student, send a welcome message
      if (isFirstLesson) {
        const welcomeMessage = `Assalamu Alaikum! I have confirmed ${studentName}'s booking and I'm really looking forward to teaching them! If you have any questions or special requests before our first lesson, please feel free to reach out. See you soon, Insha'Allah! 😊`;

        // Use the new lesson_messages schema (sender_id, sender_role, message_text)
        const { error: messageError } = await supabase
          .from('lesson_messages')
          .insert({
            lesson_id: sessionId,
            sender_id: user.id,
            sender_role: 'teacher',
            message_text: welcomeMessage
          });

        if (messageError) {
          console.error('Error sending welcome message:', messageError);
          // Don't throw error - confirmation still succeeded
        }
      }

      // Update local state
      setSessions(sessions.map(session =>
        session.id === sessionId
          ? { ...session, teacher_confirmed: true }
          : session
      ));
    } catch (error) {
      console.error('Error confirming booking:', error);
      toast.error('Failed to confirm booking. Please try again.');
    } finally {
      setConfirmingId(null);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-48"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
          <div className="h-24 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const currentSessions = activeTab === 'upcoming' ? sessions : pastSessions;

  return (
    <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-gray-900">My Lessons</h3>
        <button
          onClick={() => { loadUpcomingSessions(); loadPastSessions(); }}
          className="p-2 text-gray-500 hover:text-emerald-600 transition"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 mb-6 bg-gray-100 rounded-xl p-1.5 border border-gray-200">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition flex items-center justify-center space-x-2 ${
            activeTab === 'upcoming'
              ? 'bg-blue-500 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          <Calendar className="w-4 h-4" />
          <span>Upcoming ({sessions.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('past')}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition flex items-center justify-center space-x-2 ${
            activeTab === 'past'
              ? 'bg-emerald-500 text-white'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Past ({pastSessions.length})</span>
        </button>
      </div>

      {currentSessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            {activeTab === 'upcoming' ? (
              <Calendar className="w-10 h-10 text-gray-600" />
            ) : (
              <History className="w-10 h-10 text-gray-600" />
            )}
          </div>
          <p className="text-xl text-gray-600 mb-2">
            {activeTab === 'upcoming'
              ? 'No upcoming lessons scheduled yet.'
              : 'No past lessons yet.'}
          </p>
          <p className="text-gray-500">
            {activeTab === 'upcoming'
              ? 'Students will be able to book sessions based on your availability'
              : 'Completed lessons will appear here'}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {currentSessions.map((session) => {
          const sessionDate = parseISO(session.scheduled_time);
          const isToday = format(sessionDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
          const minutesUntilStart = differenceInMinutes(sessionDate, new Date());
          const canJoin = minutesUntilStart <= 360 && minutesUntilStart >= -session.duration_minutes; // Can join 6 hours before

          const handleJoinSession = () => {
            if (!session['100ms_room_id'] || !session.teacher_room_code) {
              toast.error('Session room is not ready yet. Please contact support if this issue persists.');
              return;
            }
            navigate(`/lesson/${session.id}`);
          };

          return (
            <div
              key={session.id}
              className="bg-gray-50 rounded-xl p-5 border border-gray-200 hover:border-blue-500/30 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden border-2 border-gray-300">
                    {session.student_avatar ? (
                      <img
                        src={session.student_avatar}
                        alt={session.student_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-gray-500" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-lg font-semibold text-gray-900">{session.subject_name}</h4>
                      {isToday && (
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-xs font-bold rounded-full">
                          TODAY
                        </span>
                      )}
                      {canJoin && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs font-bold rounded-full animate-pulse">
                          READY
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">with {session.student_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-gray-600 mb-1">
                      <Calendar className="w-4 h-4" />
                      <span className="text-sm font-medium">
                        {format(sessionDate, 'MMM d, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-blue-400">
                      <Clock className="w-4 h-4" />
                      <span className="text-sm font-semibold">
                        {format(sessionDate, 'h:mm a')}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    {activeTab === 'upcoming' ? (
                      <>
                        {session.teacher_confirmed ? (
                          <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                            <CheckCircle className="w-5 h-5" />
                            <span className="text-sm font-semibold">Confirmed</span>
                          </div>
                        ) : (
                          <button
                            onClick={() => confirmBooking(session.id)}
                            disabled={confirmingId === session.id}
                            className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 hover:text-amber-300 rounded-lg border border-amber-500/30 hover:border-amber-500/50 transition font-semibold text-sm flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <CheckCircle className="w-4 h-4" />
                            <span>{confirmingId === session.id ? 'Confirming...' : 'Confirm'}</span>
                          </button>
                        )}

                        <button
                          onClick={handleJoinSession}
                          disabled={!canJoin}
                          className={`px-6 py-3 font-semibold rounded-lg transition shadow-lg flex items-center space-x-2 ${
                            canJoin
                              ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-blue-500/20'
                              : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                          }`}
                        >
                          <Video className="w-5 h-5" />
                          <span>{canJoin ? 'Start' : 'Not Ready'}</span>
                        </button>
                        {!canJoin && minutesUntilStart > 360 && (
                          <p className="text-xs text-gray-500 mt-1">
                            Opens 6 hours before
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center space-x-3">
                        {/* View Insights Button */}
                        <button
                          onClick={() => navigate(`/lesson/${session.id}/insights`)}
                          className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 hover:text-purple-300 rounded-lg border border-purple-500/30 hover:border-purple-500/50 transition font-semibold text-sm flex items-center space-x-2"
                        >
                          <BookOpen className="w-4 h-4" />
                          <span>Insights</span>
                        </button>

                        {/* Recording Buttons - only show if recording exists and not expired */}
                        {session.has_recording && session.recording_url && (
                          (() => {
                            const daysLeft = session.recording_expires_at
                              ? differenceInDays(parseISO(session.recording_expires_at), new Date())
                              : 0;
                            const isExpired = daysLeft <= 0;

                            return isExpired ? (
                              <span className="text-xs text-gray-500 px-2">Recording expired</span>
                            ) : (
                              <div className="flex items-center space-x-2">
                                <a
                                  href={session.recording_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="px-3 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 hover:text-cyan-300 rounded-lg border border-emerald-500/30 hover:border-emerald-500/50 transition text-sm flex items-center space-x-1"
                                >
                                  <Play className="w-4 h-4" />
                                  <span>Watch</span>
                                </a>
                                <a
                                  href={session.recording_url}
                                  download
                                  className="p-2 bg-gray-200 hover:bg-gray-200 text-gray-600 hover:text-gray-900 rounded-lg transition"
                                  title={`Download - ${daysLeft} days left`}
                                >
                                  <Download className="w-4 h-4" />
                                </a>
                                <span className="text-xs text-amber-400">{daysLeft}d left</span>
                              </div>
                            );
                          })()
                        )}

                        <div className="flex items-center space-x-2 px-3 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                          <CheckCircle className="w-4 h-4" />
                          <span className="text-xs font-semibold">Done</span>
                        </div>
                      </div>
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
}
