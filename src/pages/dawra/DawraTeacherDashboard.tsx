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
  ExternalLink,
  ArrowLeft,
  Home,
  Video,
  Radio,
  Pencil,
  Trash2,
  UserPlus,
  Search,
  X,
  Mail,
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
  phone_number: string | null;
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

  // Add student state
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [studentSearchQuery, setStudentSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{ id: string; full_name: string; email: string; avatar_url: string | null }[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingStudentId, setAddingStudentId] = useState<string | null>(null);

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
        .select('student_id, enrolled_at, profiles:profiles!group_session_participants_student_id_fkey (full_name, email, phone_number, avatar_url)')
        .eq('group_session_id', courseData.id)
        .order('enrolled_at', { ascending: true });

      const mappedStudents = (studentsData || []).map((s: any) => ({
        student_id: s.student_id,
        enrolled_at: s.enrolled_at,
        full_name: s.profiles?.full_name || 'Unknown',
        email: s.profiles?.email || '',
        phone_number: s.profiles?.phone_number || null,
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

  async function searchStudents(query: string) {
    if (query.trim().length < 2) { setSearchResults([]); return; }
    setSearching(true);
    try {
      const enrolledIds = students.map(s => s.student_id);
      const { data } = await supabase
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .or(`full_name.ilike.%${query.trim()}%,email.ilike.%${query.trim()}%`)
        .limit(10);

      // Filter out already-enrolled students
      setSearchResults((data || []).filter(p => !enrolledIds.includes(p.id)));
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setSearching(false);
    }
  }

  async function addStudentToCourse(studentId: string, studentName: string) {
    if (!course) return;
    setAddingStudentId(studentId);
    try {
      const { error } = await supabase
        .from('group_session_participants')
        .insert({
          group_session_id: course.id,
          student_id: studentId,
        });

      if (error) {
        if (error.code === '23505') {
          toast.error(`${studentName} is already enrolled`);
        } else {
          throw error;
        }
      } else {
        // Increment participant count
        await supabase
          .from('group_sessions')
          .update({ current_participants: (course.current_participants || 0) + 1 })
          .eq('id', course.id);

        toast.success(`${studentName} added to the course`);
        setShowAddStudent(false);
        setStudentSearchQuery('');
        setSearchResults([]);
        fetchData();
      }
    } catch (err: any) {
      toast.error('Failed to add student: ' + err.message);
    } finally {
      setAddingStudentId(null);
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
          <Link
            to={`/teacher/course/${course.id}/students`}
            className="flex items-center gap-2 px-3 py-2 text-sm bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg hover:bg-emerald-100 dark:hover:bg-emerald-900/30 transition-colors font-medium"
          >
            <Users className="w-4 h-4" />
            Students ({students.length})
          </Link>
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

      {/* Enrolled Students */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 mb-6">
        <div className="flex items-center justify-between p-5 pb-0">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-600" />
            Enrolled Students ({students.length})
          </h2>
          <button
            onClick={() => setShowAddStudent(!showAddStudent)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Add Student
          </button>
        </div>

        {/* Add student search */}
        {showAddStudent && (
          <div className="mx-5 mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Add student by name or email</p>
              <button onClick={() => { setShowAddStudent(false); setStudentSearchQuery(''); setSearchResults([]); }} className="p-1 text-emerald-600 hover:text-emerald-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={studentSearchQuery}
                onChange={(e) => { setStudentSearchQuery(e.target.value); searchStudents(e.target.value); }}
                className="w-full pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
                autoFocus
              />
              {searching && <Loader className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-emerald-500" />}
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 space-y-1 max-h-40 overflow-y-auto">
                {searchResults.map(user => (
                  <div key={user.id} className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-100 dark:border-gray-700">
                    <div className="flex items-center gap-2 min-w-0">
                      {user.avatar_url ? (
                        <img src={user.avatar_url} alt="" className="w-7 h-7 rounded-full object-cover flex-shrink-0" />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">
                          {user.full_name?.charAt(0).toUpperCase() || '?'}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{user.full_name}</p>
                        <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => addStudentToCourse(user.id, user.full_name)}
                      disabled={addingStudentId === user.id}
                      className="flex items-center gap-1 px-2.5 py-1 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-md transition-colors disabled:opacity-50 flex-shrink-0 ml-2"
                    >
                      {addingStudentId === user.id ? <Loader className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                      Add
                    </button>
                  </div>
                ))}
              </div>
            )}
            {studentSearchQuery.trim().length >= 2 && !searching && searchResults.length === 0 && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 text-center py-2">No users found matching "{studentSearchQuery}"</p>
            )}
          </div>
        )}

        {/* Student list */}
        {students.length === 0 ? (
          <div className="text-center py-8 px-5">
            <Users className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-sm text-gray-500 dark:text-gray-400">No students enrolled yet. Share the course link or add them manually.</p>
          </div>
        ) : (
          <div className="mt-4">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-t border-b border-gray-100 dark:border-gray-700">
                    <th className="text-left px-5 py-2.5 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Student</th>
                    <th className="text-left px-3 py-2.5 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Enrolled</th>
                    {publishedSessions.length > 0 && (
                      <th className="text-center px-3 py-2.5 font-medium text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider">Progress</th>
                    )}
                    <th className="text-right px-5 py-2.5 w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((student) => {
                    const stats = getStudentStats(student.student_id);
                    return (
                      <tr key={student.student_id} className="border-b border-gray-50 dark:border-gray-700/50 last:border-0 hover:bg-gray-50 dark:hover:bg-gray-700/30">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            {student.avatar_url ? (
                              <img src={student.avatar_url} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-400 flex items-center justify-center text-xs font-bold flex-shrink-0">
                                {student.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 dark:text-white truncate">{student.full_name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {student.email}
                              </p>
                              {student.phone_number && (
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {student.phone_number}
                                </p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-3 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                          {new Date(student.enrolled_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </td>
                        {publishedSessions.length > 0 && (
                          <td className="px-3 py-3">
                            <div className="flex items-center justify-center gap-1">
                              {publishedSessions.map(s => {
                                const sp = getStudentProgress(student.student_id, s.id);
                                return (
                                  <div key={s.id} title={`Session ${s.session_number}: ${sp?.viewed_at ? 'Viewed' : 'Not viewed'}${sp?.quiz_score !== null && sp?.quiz_score !== undefined ? ` (Quiz: ${sp.quiz_score}%)` : ''}`}>
                                    {sp?.viewed_at ? (
                                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                                    ) : (
                                      <span className="w-4 h-4 rounded-full border-2 border-gray-200 dark:border-gray-600 block" />
                                    )}
                                  </div>
                                );
                              })}
                              <span className="text-xs text-gray-400 ml-1">{stats.viewed}/{publishedSessions.length}</span>
                            </div>
                          </td>
                        )}
                        <td className="px-5 py-3 text-right">
                          <button
                            onClick={() => removeStudent(student.student_id, student.full_name)}
                            disabled={removingStudentId === student.student_id}
                            className="p-1.5 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors disabled:opacity-50"
                            title={`Remove ${student.full_name}`}
                          >
                            {removingStudentId === student.student_id ? (
                              <Loader className="w-4 h-4 animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
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

    </div>
  );
}
