import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  BookOpen,
  Plus,
  Loader,
  Send,
  Sparkles,
  Users,
  Calendar,
  FileText,
  CheckCircle,
  Clock,
  AlertCircle,
  Copy,
  Check,
  ChevronRight,
  Upload,
  Trash2,
  ExternalLink,
  Eye,
  HelpCircle,
  Star,
  ArrowLeft,
  Home,
  Video,
  Radio,
  Pencil,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

interface CourseSession {
  id: string;
  session_number: number;
  title: string | null;
  session_date: string | null;
  status: string;
  live_status: string | null;
  transcript: string | null;
}

interface CourseInsight {
  id: string;
  course_session_id: string;
  title: string | null;
  notifications_sent: boolean;
  notification_count: number;
  processing_time_ms: number | null;
}

interface CourseData {
  id: string;
  name: string;
  slug: string;

  current_participants: number;
  teacher_id: string;
}

interface EnrolledStudent {
  student_id: string;
  enrolled_at: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface StudentProgress {
  course_session_id: string;
  student_id: string;
  viewed_at: string | null;
  quiz_score: number | null;
  quiz_completed_at: string | null;
  rating: number | null;
}

export default function CourseTeacherDashboard() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [course, setCourse] = useState<CourseData | null>(null);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [insights, setInsights] = useState<CourseInsight[]>([]);
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [codeCopied, setCodeCopied] = useState(false);
  const [showStudents, setShowStudents] = useState(false);

  // Add session form
  const [showAddSession, setShowAddSession] = useState(false);
  const [newSessionTitle, setNewSessionTitle] = useState('');
  const [newSessionDate, setNewSessionDate] = useState('');
  const [newSessionNumber, setNewSessionNumber] = useState(1);
  const [addingSession, setAddingSession] = useState(false);

  // Transcript form
  const [activeTranscriptSession, setActiveTranscriptSession] = useState<string | null>(null);
  const [transcriptText, setTranscriptText] = useState('');
  const [savingTranscript, setSavingTranscript] = useState(false);

  // Edit session state
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDate, setEditDate] = useState('');
  const [savingEdit, setSavingEdit] = useState(false);

  // Remove student state
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);

  // Generating/notifying state
  const [generatingId, setGeneratingId] = useState<string | null>(null);
  const [notifyingId, setNotifyingId] = useState<string | null>(null);
  const [startingClassId, setStartingClassId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const { data: courseData, error } = await supabase
        .from('group_sessions')
        .select('id, name, slug, current_participants, teacher_id')
        .eq('id', id)
        .single();

      if (error || !courseData) {
        toast.error('Course not found');
        navigate('/teacher/hub');
        return;
      }

      setCourse(courseData as CourseData);

      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from('course_sessions')
        .select('id, session_number, title, session_date, status, live_status, transcript')
        .eq('group_session_id', courseData.id)
        .order('session_number', { ascending: true });

      setSessions(sessionsData || []);
      setNewSessionNumber((sessionsData?.length || 0) + 1);

      // Fetch insights
      const { data: insightsData } = await supabase
        .from('course_insights')
        .select('id, course_session_id, title, notifications_sent, notification_count, processing_time_ms')
        .eq('group_session_id', courseData.id);

      setInsights(insightsData || []);

      // Fetch enrolled students
      const { data: studentsData } = await supabase
        .from('group_session_participants')
        .select('student_id, enrolled_at, profiles:profiles!group_session_participants_student_id_fkey (full_name, email, avatar_url)')
        .eq('group_session_id', courseData.id)
        .order('enrolled_at', { ascending: true });

      const mappedStudents = (studentsData || []).map((s: any) => ({
        student_id: s.student_id,
        enrolled_at: s.enrolled_at,
        full_name: s.profiles?.full_name || 'Unknown',
        email: s.profiles?.email || '',
        avatar_url: s.profiles?.avatar_url || null,
      }));
      setStudents(mappedStudents);

      // Fetch progress for all sessions in this course
      const sessionIds = (sessionsData || []).map((s: any) => s.id);
      if (sessionIds.length > 0) {
        const { data: progressData } = await supabase
          .from('course_student_progress')
          .select('course_session_id, student_id, viewed_at, quiz_score, quiz_completed_at, rating')
          .in('course_session_id', sessionIds);

        setProgress(progressData || []);
      }
    } catch (err) {
      console.error('Error loading course:', err);
    } finally {
      setLoading(false);
    }
  }

  async function addSession() {
    if (!course) return;
    setAddingSession(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from('course_sessions')
        .insert({
          group_session_id: course.id,
          session_number: newSessionNumber,
          title: newSessionTitle || null,
          session_date: newSessionDate || null,
          added_by: user?.id,
        });

      if (error) throw error;
      toast.success(`Session ${newSessionNumber} added`);
      setShowAddSession(false);
      setNewSessionTitle('');
      setNewSessionDate('');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to add session: ' + err.message);
    } finally {
      setAddingSession(false);
    }
  }

  function startEditingSession(session: CourseSession) {
    setEditingSessionId(session.id);
    setEditTitle(session.title || '');
    setEditDate(session.session_date || '');
  }

  async function saveSessionEdit(sessionId: string) {
    setSavingEdit(true);
    try {
      const { error } = await supabase
        .from('course_sessions')
        .update({
          title: editTitle || null,
          session_date: editDate || null,
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Session updated');
      setEditingSessionId(null);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to update: ' + err.message);
    } finally {
      setSavingEdit(false);
    }
  }

  async function saveTranscript(sessionId: string) {
    setSavingTranscript(true);
    try {
      const { error } = await supabase
        .from('course_sessions')
        .update({
          transcript: transcriptText,
          transcript_source: 'paste',
          status: 'transcript_added',
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success('Transcript saved');
      setActiveTranscriptSession(null);
      setTranscriptText('');
      fetchData();
    } catch (err: any) {
      toast.error('Failed to save: ' + err.message);
    } finally {
      setSavingTranscript(false);
    }
  }

  async function generateInsights(sessionId: string) {
    setGeneratingId(sessionId);
    try {
      const { data, error } = await supabase.functions.invoke('generate-course-insights', {
        body: { course_session_id: sessionId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Generation failed');

      toast.success(`Study notes generated in ${Math.round((data.processing_time_ms || 0) / 1000)}s`);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to generate: ' + err.message);
    } finally {
      setGeneratingId(null);
    }
  }

  async function notifyStudents(insightId: string) {
    setNotifyingId(insightId);
    try {
      const { data, error } = await supabase.functions.invoke('notify-course-insights', {
        body: { course_insight_id: insightId },
      });

      if (error) throw error;
      toast.success(`Emails sent to ${data.email_count} students`);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to notify: ' + err.message);
    } finally {
      setNotifyingId(null);
    }
  }

  async function startClass(sessionId: string, sessionNumber: number) {
    setStartingClassId(sessionId);
    try {
      const { data, error } = await supabase.functions.invoke('create-course-session-room', {
        body: { course_session_id: sessionId },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || 'Failed to create room');

      toast.success('Class room created! Joining...');
      navigate(`/course/${course?.slug}/live/${sessionNumber}`);
    } catch (err: any) {
      toast.error('Failed to start class: ' + err.message);
    } finally {
      setStartingClassId(null);
    }
  }

  function getInsightForSession(sessionId: string) {
    return insights.find((i) => i.course_session_id === sessionId);
  }

  function copyInviteLink() {
    if (course?.slug) {
      navigator.clipboard.writeText(`https://talbiyah.ai/course/${course.slug}`);
      setCodeCopied(true);
      toast.success('Course link copied!');
      setTimeout(() => setCodeCopied(false), 2000);
    }
  }

  async function removeStudent(studentId: string, studentName: string) {
    if (!course) return;
    if (!confirm(`Remove ${studentName} from this course? This cannot be undone.`)) return;

    setRemovingStudentId(studentId);
    try {
      const { error } = await supabase
        .from('group_session_participants')
        .delete()
        .eq('group_session_id', course.id)
        .eq('student_id', studentId);

      if (error) throw error;

      // Decrement participant count
      await supabase
        .from('group_sessions')
        .update({ current_participants: Math.max(0, (course.current_participants || 1) - 1) })
        .eq('id', course.id);

      toast.success(`${studentName} removed from the course`);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to remove student: ' + err.message);
    } finally {
      setRemovingStudentId(null);
    }
  }

  function formatDate(dateStr: string | null) {
    if (!dateStr) return 'No date';
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  }

  const statusBadge = (status: string, liveStatus?: string | null) => {
    const styles: Record<string, string> = {
      draft: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
      recording: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      transcribing: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400',
      transcript_added: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      generating: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
      published: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    };
    const labels: Record<string, string> = {
      draft: 'Draft',
      recording: 'Recording Processing...',
      transcribing: 'Transcribing...',
      transcript_added: 'Transcript Ready',
      generating: 'Generating...',
      published: 'Published',
    };

    return (
      <div className="flex items-center gap-2">
        {liveStatus === 'live' && (
          <span className="flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 animate-pulse">
            <Radio className="w-3 h-3" />
            LIVE
          </span>
        )}
        <span className={`text-xs font-medium px-2 py-1 rounded-full ${styles[status] || styles.draft}`}>
          {labels[status] || status}
        </span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
  }

  if (!course) return null;

  const publishedSessions = sessions.filter(s => s.status === 'published');

  function getStudentProgress(studentId: string, sessionId: string) {
    return progress.find(p => p.student_id === studentId && p.course_session_id === sessionId);
  }

  function getStudentStats(studentId: string) {
    const studentProgress = progress.filter(p => p.student_id === studentId);
    const viewed = studentProgress.filter(p => p.viewed_at).length;
    const quizzed = studentProgress.filter(p => p.quiz_completed_at).length;
    const avgRating = studentProgress.filter(p => p.rating).reduce((sum, p) => sum + (p.rating || 0), 0) / (studentProgress.filter(p => p.rating).length || 1);
    return { viewed, quizzed, avgRating: studentProgress.filter(p => p.rating).length > 0 ? avgRating : null };
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Back nav */}
      <div className="flex items-center gap-4 mb-6">
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

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
            <BookOpen className="w-4 h-4" />
            <span>Course Management</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{course.name}</h1>
          <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
            <span className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {course.current_participants} enrolled
            </span>
            <span className="flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {sessions.length} sessions
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={copyInviteLink}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-300 transition-colors"
          >
            {codeCopied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            Share Link
          </button>
          {course.slug && (
            <Link
              to={`/course/${course.slug}`}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-emerald-300 transition-colors"
            >
              <ExternalLink className="w-4 h-4" />
              View Public Page
            </Link>
          )}
        </div>
      </div>

      {/* Sessions */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Sessions</h2>
        <button
          onClick={() => setShowAddSession(!showAddSession)}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
        >
          <Plus className="w-4 h-4" />
          Add Session
        </button>
      </div>

      {/* Add session form */}
      {showAddSession && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-3">New Session</h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Session Number
              </label>
              <input
                type="number"
                min={1}
                value={newSessionNumber}
                onChange={(e) => setNewSessionNumber(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Title (optional)
              </label>
              <input
                type="text"
                value={newSessionTitle}
                onChange={(e) => setNewSessionTitle(e.target.value)}
                placeholder="e.g. Introduction to Surah Al-Baqarah"
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date
              </label>
              <input
                type="date"
                value={newSessionDate}
                onChange={(e) => setNewSessionDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button
              onClick={() => setShowAddSession(false)}
              className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={addSession}
              disabled={addingSession}
              className="px-4 py-2 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              {addingSession && <Loader className="w-4 h-4 animate-spin" />}
              Add Session
            </button>
          </div>
        </div>
      )}

      {/* Session list */}
      <div className="space-y-3">
        {sessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <Calendar className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
            <p className="text-gray-500 dark:text-gray-400">No sessions yet. Add your first session above.</p>
          </div>
        ) : (
          sessions.map((session) => {
            const insight = getInsightForSession(session.id);
            const isGenerating = generatingId === session.id || session.status === 'generating';
            const isNotifying = notifyingId === insight?.id;

            return (
              <div
                key={session.id}
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-sm font-bold">
                      {session.session_number}
                    </div>
                    {editingSessionId === session.id ? (
                      <div className="flex flex-col sm:flex-row gap-2">
                        <input
                          type="text"
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          placeholder="Session title (optional)"
                          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <input
                          type="date"
                          value={editDate}
                          onChange={(e) => setEditDate(e.target.value)}
                          className="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                        />
                        <div className="flex gap-1">
                          <button
                            onClick={() => saveSessionEdit(session.id)}
                            disabled={savingEdit}
                            className="px-3 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-1"
                          >
                            {savingEdit && <Loader className="w-3 h-3 animate-spin" />}
                            Save
                          </button>
                          <button
                            onClick={() => setEditingSessionId(null)}
                            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div>
                          <h3 className="font-semibold text-gray-900 dark:text-white">
                            {session.title || `Session ${session.session_number}`}
                          </h3>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{formatDate(session.session_date)}</p>
                        </div>
                        <button
                          onClick={() => startEditingSession(session)}
                          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                          title="Edit session details"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  {statusBadge(session.status, session.live_status)}
                </div>

                {/* Actions based on status */}
                <div className="flex flex-wrap items-center gap-2">
                  {/* Start / Rejoin class */}
                  {session.status === 'draft' && session.live_status !== 'live' && (
                    <button
                      onClick={() => startClass(session.id, session.session_number)}
                      disabled={startingClassId === session.id}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {startingClassId === session.id ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Video className="w-3.5 h-3.5" />
                      )}
                      Start Class
                    </button>
                  )}

                  {session.live_status === 'live' && (
                    <button
                      onClick={() => navigate(`/course/${course?.slug}/live/${session.session_number}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                      <Radio className="w-3.5 h-3.5 animate-pulse" />
                      Rejoin Class
                    </button>
                  )}

                  {/* Recording processing */}
                  {session.status === 'recording' && (
                    <span className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-orange-600 dark:text-orange-400">
                      <Loader className="w-3.5 h-3.5 animate-spin" />
                      Recording processing...
                    </span>
                  )}

                  {/* Add/edit transcript */}
                  {(session.status === 'draft' || session.status === 'transcript_added' || session.status === 'recording') && (
                    <button
                      onClick={() => {
                        setActiveTranscriptSession(
                          activeTranscriptSession === session.id ? null : session.id
                        );
                        setTranscriptText(session.transcript || '');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <FileText className="w-3.5 h-3.5" />
                      {session.transcript ? 'Edit Transcript' : 'Add Transcript'}
                    </button>
                  )}

                  {/* Generate insights */}
                  {(session.status === 'transcript_added' || session.status === 'published') && (
                    <button
                      onClick={() => generateInsights(session.id)}
                      disabled={isGenerating}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Sparkles className="w-3.5 h-3.5" />
                      )}
                      {session.status === 'published' ? 'Regenerate' : 'Generate Insights'}
                    </button>
                  )}

                  {/* Notify students */}
                  {insight && session.status === 'published' && (
                    <button
                      onClick={() => notifyStudents(insight.id)}
                      disabled={isNotifying}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors disabled:opacity-50"
                    >
                      {isNotifying ? (
                        <Loader className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      {insight.notifications_sent
                        ? `Resend (${insight.notification_count} sent)`
                        : 'Notify Students'}
                    </button>
                  )}

                  {/* View insights */}
                  {insight && course?.slug && (
                    <Link
                      to={`/course/${course.slug}/session/${session.session_number}`}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      View Notes
                    </Link>
                  )}
                </div>

                {/* Transcript textarea */}
                {activeTranscriptSession === session.id && (
                  <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-4">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Paste transcript below
                    </label>
                    <textarea
                      value={transcriptText}
                      onChange={(e) => setTranscriptText(e.target.value)}
                      rows={10}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm font-mono resize-y"
                      placeholder="Paste the lesson transcript here..."
                    />
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {transcriptText.length > 0 &&
                          `${transcriptText.split(/\s+/).length.toLocaleString()} words`}
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setActiveTranscriptSession(null);
                            setTranscriptText('');
                          }}
                          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => saveTranscript(session.id)}
                          disabled={savingTranscript || !transcriptText.trim()}
                          className="px-4 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
                        >
                          {savingTranscript && <Loader className="w-3.5 h-3.5 animate-spin" />}
                          Save Transcript
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Insight meta */}
                {insight && (
                  <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-500" />
                      Notes generated
                    </span>
                    {insight.processing_time_ms && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {Math.round(insight.processing_time_ms / 1000)}s
                      </span>
                    )}
                    {insight.notifications_sent && (
                      <span className="flex items-center gap-1">
                        <Send className="w-3 h-3 text-blue-500" />
                        {insight.notification_count} notified
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Enrolled Students Section */}
      <div className="mt-10">
        <button
          onClick={() => setShowStudents(!showStudents)}
          className="flex items-center justify-between w-full mb-4"
        >
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5" />
            Enrolled Students ({students.length})
          </h2>
          <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${showStudents ? 'rotate-90' : ''}`} />
        </button>

        {showStudents && (
          <div className="space-y-4">
            {/* Summary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <p className="text-2xl font-bold text-emerald-600">{students.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Enrolled</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <p className="text-2xl font-bold text-blue-600">{publishedSessions.length}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Notes Published</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <p className="text-2xl font-bold text-purple-600">
                  {progress.filter(p => p.viewed_at).length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Views</p>
              </div>
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
                <p className="text-2xl font-bold text-pink-600">
                  {progress.filter(p => p.quiz_completed_at).length}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Quizzes Done</p>
              </div>
            </div>

            {/* Student table */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left px-4 py-3 font-semibold text-gray-700 dark:text-gray-300">Student</th>
                      <th className="text-center px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">Enrolled</th>
                      {publishedSessions.map(s => (
                        <th key={s.id} className="text-center px-3 py-3 font-semibold text-gray-700 dark:text-gray-300 min-w-[80px]">
                          <div className="text-xs">S{s.session_number}</div>
                        </th>
                      ))}
                      <th className="text-center px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        <Eye className="w-3.5 h-3.5 mx-auto" />
                      </th>
                      <th className="text-center px-3 py-3 font-semibold text-gray-700 dark:text-gray-300">
                        <HelpCircle className="w-3.5 h-3.5 mx-auto" />
                      </th>
                      <th className="text-center px-3 py-3 font-semibold text-gray-700 dark:text-gray-300 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student) => {
                      const stats = getStudentStats(student.student_id);
                      return (
                        <tr key={student.student_id} className="border-b border-gray-100 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-emerald-700 dark:text-emerald-400 text-xs font-bold flex-shrink-0">
                                {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                              <div className="min-w-0">
                                <p className="font-medium text-gray-900 dark:text-white truncate">{student.full_name}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{student.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-center text-xs text-gray-500 dark:text-gray-400">
                            {new Date(student.enrolled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                          </td>
                          {publishedSessions.map(s => {
                            const sp = getStudentProgress(student.student_id, s.id);
                            return (
                              <td key={s.id} className="px-3 py-3 text-center">
                                {sp?.viewed_at ? (
                                  <div className="flex flex-col items-center gap-0.5">
                                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    {sp.quiz_score !== null && (
                                      <span className="text-[10px] text-purple-600 dark:text-purple-400 font-medium">{sp.quiz_score}%</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-gray-600 block mx-auto" />
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-3 text-center">
                            <span className={`text-xs font-medium ${stats.viewed > 0 ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {stats.viewed}/{publishedSessions.length}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <span className={`text-xs font-medium ${stats.quizzed > 0 ? 'text-purple-600' : 'text-gray-400'}`}>
                              {stats.quizzed}/{publishedSessions.length}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => removeStudent(student.student_id, student.full_name)}
                              disabled={removingStudentId === student.student_id}
                              className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                              title={`Remove ${student.full_name}`}
                            >
                              {removingStudentId === student.student_id ? (
                                <Loader className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {students.length === 0 && (
                      <tr>
                        <td colSpan={publishedSessions.length + 5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                          No students enrolled yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
