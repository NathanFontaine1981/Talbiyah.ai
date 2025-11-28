import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Calendar, Clock, Video, RefreshCw, User, CheckCircle, History } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO, differenceInMinutes } from 'date-fns';

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
        .gte('scheduled_time', new Date().toISOString())
        .order('scheduled_time', { ascending: true })
        .limit(5);

      if (error) {
        console.error('Error fetching lessons:', error);
        setSessions([]);
        setLoading(false);
        return;
      }

      if (lessonsData && lessonsData.length > 0) {
        const formattedSessions: TeacherSession[] = lessonsData
          .filter((lesson: any) => lesson.learners && lesson.subjects) // Filter out lessons with missing relations
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
          }));
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
        const formattedSessions: TeacherSession[] = lessonsData
          .filter((lesson: any) => lesson.learners && lesson.subjects)
          .map((lesson: any) => ({
            id: lesson.id,
            student_name: lesson.learners?.name || 'Student',
            student_avatar: lesson.learners?.profiles?.avatar_url || null,
            subject_name: lesson.subjects?.name || 'Unknown Subject',
            scheduled_time: lesson.scheduled_time,
            duration_minutes: lesson.duration_minutes,
            teacher_confirmed: lesson.teacher_confirmed || false,
            '100ms_room_id': lesson['100ms_room_id'],
            teacher_room_code: lesson.teacher_room_code,
            status: lesson.status
          }));
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
      const parentId = lessonData.learners.parent_id;
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

        const { error: messageError } = await supabase
          .from('lesson_messages')
          .insert({
            lesson_id: sessionId,
            sender_id: user.id,
            receiver_id: parentId,
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
      alert('Failed to confirm booking. Please try again.');
    } finally {
      setConfirmingId(null);
    }
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

  const currentSessions = activeTab === 'upcoming' ? sessions : pastSessions;

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold text-white">My Classes</h3>
        <button
          onClick={() => { loadUpcomingSessions(); loadPastSessions(); }}
          className="p-2 text-slate-400 hover:text-cyan-400 transition"
        >
          <RefreshCw className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center space-x-2 mb-6 bg-slate-800/50 rounded-xl p-1.5 border border-slate-700/50">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`flex-1 px-4 py-2.5 rounded-lg font-semibold transition flex items-center justify-center space-x-2 ${
            activeTab === 'upcoming'
              ? 'bg-blue-500 text-white'
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
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
              : 'text-slate-400 hover:text-white hover:bg-slate-700'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Past ({pastSessions.length})</span>
        </button>
      </div>

      {currentSessions.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-6">
            {activeTab === 'upcoming' ? (
              <Calendar className="w-10 h-10 text-slate-600" />
            ) : (
              <History className="w-10 h-10 text-slate-600" />
            )}
          </div>
          <p className="text-xl text-slate-300 mb-2">
            {activeTab === 'upcoming'
              ? 'No upcoming classes scheduled yet.'
              : 'No past classes yet.'}
          </p>
          <p className="text-slate-500">
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
              alert('Session room is not ready yet. Please contact support if this issue persists.');
              return;
            }
            navigate(`/lesson/${session.id}`);
          };

          return (
            <div
              key={session.id}
              className="bg-slate-800/50 rounded-xl p-5 border border-slate-700/50 hover:border-blue-500/30 transition group"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-12 h-12 rounded-full bg-slate-700 flex items-center justify-center overflow-hidden border-2 border-slate-600">
                    {session.student_avatar ? (
                      <img
                        src={session.student_avatar}
                        alt={session.student_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-6 h-6 text-slate-400" />
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="text-lg font-semibold text-white">{session.subject_name}</h4>
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
                    <p className="text-sm text-slate-400">with {session.student_name}</p>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="flex items-center space-x-2 text-slate-300 mb-1">
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
                              : 'bg-slate-700 text-slate-400 cursor-not-allowed'
                          }`}
                        >
                          <Video className="w-5 h-5" />
                          <span>{canJoin ? 'Start' : 'Not Ready'}</span>
                        </button>
                        {!canJoin && minutesUntilStart > 360 && (
                          <p className="text-xs text-slate-500 mt-1">
                            Opens 6 hours before
                          </p>
                        )}
                      </>
                    ) : (
                      <div className="flex items-center space-x-2 px-4 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/30">
                        <CheckCircle className="w-5 h-5" />
                        <span className="text-sm font-semibold">Completed</span>
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
