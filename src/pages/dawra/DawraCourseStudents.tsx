import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Users,
  ArrowLeft,
  Home,
  BookOpen,
  Loader,
  Trash2,
  CheckCircle,
  Eye,
  HelpCircle,
  Search,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';

interface EnrolledStudent {
  student_id: string;
  enrolled_at: string;
  full_name: string;
  email: string;
  avatar_url: string | null;
}

interface CourseSession {
  id: string;
  session_number: number;
  title: string | null;
  status: string;
}

interface StudentProgress {
  course_session_id: string;
  student_id: string;
  viewed_at: string | null;
  quiz_score: number | null;
  quiz_completed_at: string | null;
  rating: number | null;
}

export default function DawraCourseStudents() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [courseName, setCourseName] = useState('');
  const [students, setStudents] = useState<EnrolledStudent[]>([]);
  const [sessions, setSessions] = useState<CourseSession[]>([]);
  const [progress, setProgress] = useState<StudentProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingStudentId, setRemovingStudentId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const { data: course } = await supabase
        .from('group_sessions')
        .select('id, name, current_participants')
        .eq('id', id)
        .single();

      if (!course) {
        toast.error('Course not found');
        navigate(-1);
        return;
      }

      setCourseName(course.name);
      setParticipantCount(course.current_participants || 0);

      // Fetch sessions
      const { data: sessionsData } = await supabase
        .from('course_sessions')
        .select('id, session_number, title, status')
        .eq('group_session_id', course.id)
        .order('session_number', { ascending: true });

      setSessions(sessionsData || []);

      // Fetch enrolled students
      const { data: studentsData } = await supabase
        .from('group_session_participants')
        .select('student_id, enrolled_at, profiles:profiles!group_session_participants_student_id_fkey (full_name, email, avatar_url)')
        .eq('group_session_id', course.id)
        .order('enrolled_at', { ascending: true });

      const mapped = (studentsData || []).map((s: any) => ({
        student_id: s.student_id,
        enrolled_at: s.enrolled_at,
        full_name: s.profiles?.full_name || 'Unknown',
        email: s.profiles?.email || '',
        avatar_url: s.profiles?.avatar_url || null,
      }));
      setStudents(mapped);

      // Fetch progress
      const sessionIds = (sessionsData || []).map((s: any) => s.id);
      if (sessionIds.length > 0) {
        const { data: progressData } = await supabase
          .from('course_student_progress')
          .select('course_session_id, student_id, viewed_at, quiz_score, quiz_completed_at, rating')
          .in('course_session_id', sessionIds);

        setProgress(progressData || []);
      }
    } catch (err) {
      console.error('Error loading students:', err);
    } finally {
      setLoading(false);
    }
  }

  async function removeStudent(studentId: string, studentName: string) {
    if (!confirm(`Remove ${studentName} from this course? This cannot be undone.`)) return;

    setRemovingStudentId(studentId);
    try {
      const { error } = await supabase
        .from('group_session_participants')
        .delete()
        .eq('group_session_id', id)
        .eq('student_id', studentId);

      if (error) throw error;

      await supabase
        .from('group_sessions')
        .update({ current_participants: Math.max(0, participantCount - 1) })
        .eq('id', id);

      toast.success(`${studentName} removed from the course`);
      fetchData();
    } catch (err: any) {
      toast.error('Failed to remove student: ' + err.message);
    } finally {
      setRemovingStudentId(null);
    }
  }

  const publishedSessions = sessions.filter(s => s.status === 'published');

  function getStudentProgress(studentId: string, sessionId: string) {
    return progress.find(p => p.student_id === studentId && p.course_session_id === sessionId);
  }

  function getStudentStats(studentId: string) {
    const sp = progress.filter(p => p.student_id === studentId);
    const viewed = sp.filter(p => p.viewed_at).length;
    const quizzed = sp.filter(p => p.quiz_completed_at).length;
    return { viewed, quizzed };
  }

  const filteredStudents = searchQuery.trim()
    ? students.filter(s =>
        s.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.email.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : students;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader className="w-8 h-8 animate-spin text-emerald-600" />
      </div>
    );
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
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mb-2">
          <Users className="w-4 h-4" />
          <span>Student Management</span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{courseName}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{students.length} enrolled students</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
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

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          placeholder="Search students..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
        />
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
              {filteredStudents.map((student) => {
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
              {filteredStudents.length === 0 && (
                <tr>
                  <td colSpan={publishedSessions.length + 5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    {searchQuery ? 'No students match your search' : 'No students enrolled yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
