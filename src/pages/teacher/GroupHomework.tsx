import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  ClipboardList,
  Clock,
  CheckCircle,
  AlertCircle,
  Users,
  BookOpen,
  X,
  Calendar,
  Send,
  MessageSquare,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface GroupSession {
  id: string;
  name: string;
  subject?: { name: string };
}

interface HomeworkAssignment {
  id: string;
  title: string;
  description: string | null;
  homework_type: string;
  surah_number: number | null;
  ayat_start: number | null;
  ayat_end: number | null;
  due_date: string | null;
  status: string;
  assigned_at: string;
  submissions?: HomeworkSubmission[];
}

interface HomeworkSubmission {
  id: string;
  student_id: string;
  student?: { full_name: string };
  status: string;
  submitted_at: string | null;
  submission_notes: string | null;
  grade: string | null;
  feedback: string | null;
  graded_at: string | null;
}

const HOMEWORK_TYPES = [
  { value: 'practice', label: 'Practice', icon: '📝' },
  { value: 'memorization', label: 'Memorization', icon: '🧠' },
  { value: 'revision', label: 'Revision', icon: '🔄' },
  { value: 'reading', label: 'Reading', icon: '📖' },
  { value: 'listening', label: 'Listening', icon: '🎧' },
  { value: 'worksheet', label: 'Worksheet', icon: '📋' },
  { value: 'reflection', label: 'Reflection', icon: '💭' },
  { value: 'other', label: 'Other', icon: '📌' },
];

const GRADES = [
  { value: 'excellent', label: 'Excellent', color: 'text-emerald-400' },
  { value: 'good', label: 'Good', color: 'text-blue-400' },
  { value: 'satisfactory', label: 'Satisfactory', color: 'text-yellow-400' },
  { value: 'needs_improvement', label: 'Needs Improvement', color: 'text-orange-400' },
  { value: 'incomplete', label: 'Incomplete', color: 'text-red-400' },
];

export default function GroupHomework() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<GroupSession | null>(null);
  const [assignments, setAssignments] = useState<HomeworkAssignment[]>([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showGradeModal, setShowGradeModal] = useState(false);
  const [selectedSubmission, setSelectedSubmission] = useState<HomeworkSubmission | null>(null);
  const [expandedAssignment, setExpandedAssignment] = useState<string | null>(null);

  useEffect(() => {
    if (sessionId) {
      loadData();
    }
  }, [sessionId]);

  async function loadData() {
    try {
      setLoading(true);

      // Fetch session info
      const { data: sessionData, error: sessionError } = await supabase
        .from('group_sessions')
        .select(`
          id,
          name,
          subject:subjects(name)
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData);

      // Fetch assignments with submissions
      const { data: assignmentsData, error: assignmentsError } = await supabase
        .from('group_homework_assignments')
        .select(`
          *,
          submissions:group_homework_submissions(
            *,
            student:profiles!student_id(full_name)
          )
        `)
        .eq('group_session_id', sessionId)
        .order('assigned_at', { ascending: false });

      if (assignmentsError) throw assignmentsError;
      setAssignments(assignmentsData || []);
    } catch (error) {
      console.error('Error loading homework data:', error);
      toast.error('Failed to load homework data');
    } finally {
      setLoading(false);
    }
  }

  function getTypeIcon(type: string) {
    return HOMEWORK_TYPES.find((t) => t.value === type)?.icon || '📌';
  }

  function getStatusBadge(status: string) {
    const styles: Record<string, string> = {
      pending: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
      in_progress: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      submitted: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
      graded: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
      late: 'bg-red-500/20 text-red-400 border-red-500/30',
    };
    return styles[status] || styles.pending;
  }

  function openGradeModal(submission: HomeworkSubmission) {
    setSelectedSubmission(submission);
    setShowGradeModal(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-2xl font-bold mb-2">Session Not Found</h2>
          <button
            onClick={() => navigate('/teacher/group-lessons')}
            className="text-emerald-400 hover:underline"
          >
            Back to Group Lessons
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/teacher/group-lessons')}
            className="mb-6 flex items-center gap-2 text-gray-400 hover:text-white transition"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Group Lessons</span>
          </button>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
                <ClipboardList className="w-8 h-8 text-purple-400" />
                Group Homework
              </h1>
              <p className="text-gray-400">
                {session.name} - {session.subject?.name || 'General'}
              </p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Assign Homework
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-xs text-gray-400">Total Assignments</p>
                <p className="text-xl font-bold">{assignments.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-amber-400" />
              <div>
                <p className="text-xs text-gray-400">Pending Review</p>
                <p className="text-xl font-bold">
                  {assignments.reduce(
                    (sum, a) =>
                      sum + (a.submissions?.filter((s) => s.status === 'submitted').length || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-emerald-400" />
              <div>
                <p className="text-xs text-gray-400">Graded</p>
                <p className="text-xl font-bold">
                  {assignments.reduce(
                    (sum, a) =>
                      sum + (a.submissions?.filter((s) => s.status === 'graded').length || 0),
                    0
                  )}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
            <div className="flex items-center gap-3">
              <Users className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-xs text-gray-400">Students</p>
                <p className="text-xl font-bold">
                  {assignments[0]?.submissions?.length || 0}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Assignments List */}
        {assignments.length === 0 ? (
          <div className="bg-white/5 backdrop-blur-sm rounded-2xl p-12 text-center border border-white/10">
            <ClipboardList className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">No Homework Assigned</h3>
            <p className="text-gray-400 mb-4">
              Assign homework to your group students to track their progress.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg font-semibold transition"
            >
              Assign First Homework
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {assignments.map((assignment) => {
              const isExpanded = expandedAssignment === assignment.id;
              const pendingCount =
                assignment.submissions?.filter((s) => s.status === 'submitted').length || 0;

              return (
                <div
                  key={assignment.id}
                  className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden"
                >
                  <div
                    className="p-5 cursor-pointer hover:bg-white/5 transition"
                    onClick={() =>
                      setExpandedAssignment(isExpanded ? null : assignment.id)
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <span className="text-3xl">{getTypeIcon(assignment.homework_type)}</span>
                        <div>
                          <h3 className="text-lg font-bold text-white mb-1">{assignment.title}</h3>
                          <p className="text-gray-400 text-sm mb-2 line-clamp-1">
                            {assignment.description || 'No description'}
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs">
                            <span className="flex items-center gap-1 text-gray-300">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(assignment.assigned_at), 'MMM d, yyyy')}
                            </span>
                            {assignment.due_date && (
                              <span className="flex items-center gap-1 text-amber-400">
                                <Clock className="w-3 h-3" />
                                Due: {format(new Date(assignment.due_date), 'MMM d')}
                              </span>
                            )}
                            {assignment.surah_number && (
                              <span className="text-emerald-400">
                                Surah {assignment.surah_number}
                                {assignment.ayat_start &&
                                  `: ${assignment.ayat_start}-${assignment.ayat_end || assignment.ayat_start}`}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        {pendingCount > 0 && (
                          <span className="px-2 py-1 bg-amber-500/20 text-amber-400 rounded-full text-xs font-semibold">
                            {pendingCount} pending
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded - Show Submissions */}
                  {isExpanded && assignment.submissions && (
                    <div className="px-5 pb-5 border-t border-white/10">
                      <h4 className="text-sm font-semibold text-gray-400 my-4">
                        Student Submissions ({assignment.submissions.length})
                      </h4>
                      <div className="space-y-2">
                        {assignment.submissions.map((submission) => (
                          <div
                            key={submission.id}
                            className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-2 h-2 rounded-full ${
                                  submission.status === 'graded'
                                    ? 'bg-emerald-400'
                                    : submission.status === 'submitted'
                                    ? 'bg-amber-400'
                                    : 'bg-gray-500'
                                }`}
                              />
                              <div>
                                <p className="text-white text-sm font-medium">
                                  {(submission.student as any)?.full_name || 'Unknown Student'}
                                </p>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded border ${getStatusBadge(
                                    submission.status
                                  )}`}
                                >
                                  {submission.status.replace('_', ' ')}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {submission.grade && (
                                <span
                                  className={`text-sm font-semibold ${
                                    GRADES.find((g) => g.value === submission.grade)?.color ||
                                    'text-gray-400'
                                  }`}
                                >
                                  {GRADES.find((g) => g.value === submission.grade)?.label}
                                </span>
                              )}
                              {submission.status === 'submitted' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openGradeModal(submission);
                                  }}
                                  className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded text-xs font-semibold transition"
                                >
                                  Grade
                                </button>
                              )}
                              {submission.status === 'graded' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openGradeModal(submission);
                                  }}
                                  className="px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded text-xs font-semibold transition"
                                >
                                  View
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Assignment Modal */}
      {showCreateModal && (
        <CreateAssignmentModal
          sessionId={sessionId!}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadData();
          }}
        />
      )}

      {/* Grade Submission Modal */}
      {showGradeModal && selectedSubmission && (
        <GradeSubmissionModal
          submission={selectedSubmission}
          onClose={() => {
            setShowGradeModal(false);
            setSelectedSubmission(null);
          }}
          onSuccess={() => {
            setShowGradeModal(false);
            setSelectedSubmission(null);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// Create Assignment Modal
function CreateAssignmentModal({
  sessionId,
  onClose,
  onSuccess,
}: {
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    homework_type: 'practice',
    surah_number: '',
    ayat_start: '',
    ayat_end: '',
    due_date: '',
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('group_homework_assignments').insert([
        {
          group_session_id: sessionId,
          assigned_by: user.id,
          title: formData.title,
          description: formData.description || null,
          homework_type: formData.homework_type,
          surah_number: formData.surah_number ? parseInt(formData.surah_number) : null,
          ayat_start: formData.ayat_start ? parseInt(formData.ayat_start) : null,
          ayat_end: formData.ayat_end ? parseInt(formData.ayat_end) : null,
          due_date: formData.due_date || null,
        },
      ]);

      if (error) throw error;

      toast.success('Homework assigned successfully! Submissions created for all enrolled students.');
      onSuccess();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      toast.error('Failed to create assignment: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-lg w-full border border-gray-700 shadow-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Assign Homework</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Title *</label>
            <input
              type="text"
              required
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="e.g., Memorize Surah Al-Fatiha"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Type *</label>
            <select
              value={formData.homework_type}
              onChange={(e) => setFormData({ ...formData, homework_type: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              {HOMEWORK_TYPES.map((type) => (
                <option key={type.value} value={type.value} className="bg-gray-800">
                  {type.icon} {type.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Additional instructions..."
            />
          </div>

          {/* Quran-specific fields */}
          <div className="border border-white/10 rounded-lg p-4">
            <h4 className="text-sm font-semibold text-gray-400 mb-3">
              Quran Reference (optional)
            </h4>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">Surah #</label>
                <input
                  type="number"
                  min="1"
                  max="114"
                  value={formData.surah_number}
                  onChange={(e) => setFormData({ ...formData, surah_number: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ayat Start</label>
                <input
                  type="number"
                  min="1"
                  value={formData.ayat_start}
                  onChange={(e) => setFormData({ ...formData, ayat_start: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">Ayat End</label>
                <input
                  type="number"
                  min="1"
                  value={formData.ayat_end}
                  onChange={(e) => setFormData({ ...formData, ayat_end: e.target.value })}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Due Date</label>
            <input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-semibold transition flex items-center justify-center gap-2"
            >
              <Send className="w-4 h-4" />
              {loading ? 'Assigning...' : 'Assign to All'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Grade Submission Modal
function GradeSubmissionModal({
  submission,
  onClose,
  onSuccess,
}: {
  submission: HomeworkSubmission;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [grade, setGrade] = useState(submission.grade || '');
  const [feedback, setFeedback] = useState(submission.feedback || '');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('group_homework_submissions')
        .update({
          grade,
          feedback: feedback || null,
          status: 'graded',
          graded_by: user.id,
          graded_at: new Date().toISOString(),
        })
        .eq('id', submission.id);

      if (error) throw error;

      toast.success('Submission graded successfully!');
      onSuccess();
    } catch (error: any) {
      console.error('Error grading submission:', error);
      toast.error('Failed to grade submission: ' + error.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Grade Submission</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-sm text-gray-400">Student</p>
          <p className="text-lg font-semibold text-white">
            {(submission.student as any)?.full_name || 'Unknown'}
          </p>
          {submission.submission_notes && (
            <div className="mt-3 p-3 bg-white/5 rounded-lg">
              <p className="text-xs text-gray-400 mb-1">Student Notes:</p>
              <p className="text-sm text-gray-300">{submission.submission_notes}</p>
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">Grade *</label>
            <div className="grid grid-cols-2 gap-2">
              {GRADES.map((g) => (
                <label
                  key={g.value}
                  className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition ${
                    grade === g.value
                      ? 'bg-emerald-500/20 border-emerald-500'
                      : 'bg-white/5 border-white/10 hover:border-white/30'
                  }`}
                >
                  <input
                    type="radio"
                    name="grade"
                    value={g.value}
                    checked={grade === g.value}
                    onChange={(e) => setGrade(e.target.value)}
                    className="sr-only"
                  />
                  <span className={`text-sm font-medium ${g.color}`}>{g.label}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-400 mb-2">
              <MessageSquare className="w-4 h-4 inline mr-1" />
              Feedback
            </label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={3}
              className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              placeholder="Provide feedback for the student..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-semibold transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !grade}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-lg font-semibold transition"
            >
              {loading ? 'Saving...' : 'Save Grade'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
