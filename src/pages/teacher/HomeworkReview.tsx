import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import {
  ArrowLeft,
  ClipboardCheck,
  BookOpen,
  CheckCircle,
  Clock,
  Star,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  User,
  Brain,
  FileText,
  Image as ImageIcon,
  Languages,
  Paperclip,
} from 'lucide-react';

interface HomeworkSubmission {
  id: string;
  lesson_id: string;
  insight_id: string | null;
  learner_id: string;
  learner_name: string;
  quiz_answers: any[] | null;
  quiz_score: number | null;
  quiz_total: number | null;
  completed_tasks: any[] | null;
  tasks_completed_count: number;
  tasks_total_count: number;
  student_notes: string | null;
  questions_for_teacher: string | null;
  difficulty_rating: number | null;
  status: 'draft' | 'submitted' | 'reviewed' | 'needs_revision';
  submitted_at: string | null;
  teacher_feedback: string | null;
  teacher_rating: string | null;
  teacher_encouragement: string | null;
  areas_to_focus: string[] | null;
  reviewed_at: string | null;
  created_at: string;
  lesson_subject: string | null;
  lesson_date: string | null;
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface ArabicHomeworkSubmission {
  id: string;
  learner_id: string;
  learner_name: string;
  syllabus_id: string;
  course_type: string;
  uploaded_files: UploadedFile[] | null;
  student_notes: string | null;
  confidence_level: number | null;
  quiz_score: number | null;
  quiz_total: number | null;
  status: 'draft' | 'submitted' | 'reviewed' | 'needs_revision';
  submitted_at: string | null;
  teacher_feedback: string | null;
  teacher_rating: string | null;
  reviewed_at: string | null;
  created_at: string;
  unit_title: string;
  unit_number: number;
  book: string;
}

// Confidence levels for teacher reference
const CONFIDENCE_LEVELS: Record<number, { label: string; color: string; bgColor: string; description: string }> = {
  1: { label: 'Need More Practice', color: 'text-red-400', bgColor: 'bg-red-500/20 border-red-500/30', description: 'Student needs more repetition on basics' },
  2: { label: 'Getting There', color: 'text-amber-400', bgColor: 'bg-amber-500/20 border-amber-500/30', description: 'Understands some but needs reinforcement' },
  3: { label: 'Fairly Confident', color: 'text-yellow-400', bgColor: 'bg-yellow-500/20 border-yellow-500/30', description: 'Can recall most with effort' },
  4: { label: 'Strong', color: 'text-emerald-400', bgColor: 'bg-emerald-500/20 border-emerald-500/30', description: 'Comfortable with material, minor gaps' },
  5: { label: 'Mastered', color: 'text-emerald-600', bgColor: 'bg-emerald-500/20 border-emerald-500/30', description: 'Uses vocabulary/rules naturally' },
};

export default function HomeworkReview() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<HomeworkSubmission[]>([]);
  const [arabicSubmissions, setArabicSubmissions] = useState<ArabicHomeworkSubmission[]>([]);
  const [, setSelectedSubmission] = useState<HomeworkSubmission | null>(null);
  const [, setSelectedArabicSubmission] = useState<ArabicHomeworkSubmission | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [expandedArabicId, setExpandedArabicId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'submitted' | 'reviewed'>('submitted');
  const [viewMode, setViewMode] = useState<'lesson' | 'arabic'>('arabic'); // Default to Arabic

  // Feedback form state
  const [feedback, setFeedback] = useState('');
  const [rating, setRating] = useState<string>('');
  const [encouragement, setEncouragement] = useState('');
  const [areasToFocus, setAreasToFocus] = useState('');
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  useEffect(() => {
    fetchSubmissions();
    fetchArabicSubmissions();
  }, [filterStatus]);

  async function fetchSubmissions() {
    try {
      setLoading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Get teacher profile
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherProfile) {
        navigate('/dashboard');
        return;
      }

      // Build query
      let query = supabase
        .from('homework_submissions')
        .select(`
          *,
          learners!homework_submissions_learner_id_fkey(name),
          lessons!homework_submissions_lesson_id_fkey(
            scheduled_time,
            subjects(name)
          )
        `)
        .eq('teacher_id', teacherProfile.id)
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (filterStatus === 'submitted') {
        query = query.eq('status', 'submitted');
      } else if (filterStatus === 'reviewed') {
        query = query.in('status', ['reviewed', 'needs_revision']);
      }

      const { data, error } = await query;

      if (error) {
        if (error.code === 'PGRST205') {
          // Table doesn't exist yet
          setSubmissions([]);
          return;
        }
        throw error;
      }

      const formatted: HomeworkSubmission[] = (data || []).map((sub: any) => ({
        id: sub.id,
        lesson_id: sub.lesson_id,
        insight_id: sub.insight_id,
        learner_id: sub.learner_id,
        learner_name: sub.learners?.name || 'Unknown Student',
        quiz_answers: sub.quiz_answers,
        quiz_score: sub.quiz_score,
        quiz_total: sub.quiz_total,
        completed_tasks: sub.completed_tasks,
        tasks_completed_count: sub.tasks_completed_count || 0,
        tasks_total_count: sub.tasks_total_count || 0,
        student_notes: sub.student_notes,
        questions_for_teacher: sub.questions_for_teacher,
        difficulty_rating: sub.difficulty_rating,
        status: sub.status,
        submitted_at: sub.submitted_at,
        teacher_feedback: sub.teacher_feedback,
        teacher_rating: sub.teacher_rating,
        teacher_encouragement: sub.teacher_encouragement,
        areas_to_focus: sub.areas_to_focus,
        reviewed_at: sub.reviewed_at,
        created_at: sub.created_at,
        lesson_subject: sub.lessons?.subjects?.name || 'General',
        lesson_date: sub.lessons?.scheduled_time,
      }));

      setSubmissions(formatted);
    } catch (error: any) {
      console.error('Error fetching submissions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchArabicSubmissions() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Get teacher profile
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherProfile) return;

      // Get students that this teacher teaches
      const { data: studentTeachers } = await supabase
        .from('student_teachers')
        .select('student_id')
        .eq('teacher_id', teacherProfile.id);

      if (!studentTeachers || studentTeachers.length === 0) {
        setArabicSubmissions([]);
        return;
      }

      const studentIds = studentTeachers.map(st => st.student_id);

      // Build query for Arabic homework submissions
      let query = supabase
        .from('homework_submissions')
        .select(`
          *,
          learners!homework_submissions_learner_id_fkey(name),
          arabic_syllabus!homework_submissions_syllabus_id_fkey(unit_title_english, unit_number, book)
        `)
        .eq('course_type', 'arabic')
        .in('learner_id', studentIds)
        .order('submitted_at', { ascending: false, nullsFirst: false });

      if (filterStatus === 'submitted') {
        query = query.eq('status', 'submitted');
      } else if (filterStatus === 'reviewed') {
        query = query.in('status', ['reviewed', 'needs_revision']);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching Arabic submissions:', error);
        setArabicSubmissions([]);
        return;
      }

      const formatted: ArabicHomeworkSubmission[] = (data || []).map((sub: any) => ({
        id: sub.id,
        learner_id: sub.learner_id,
        learner_name: sub.learners?.name || 'Unknown Student',
        syllabus_id: sub.syllabus_id,
        course_type: sub.course_type,
        uploaded_files: sub.uploaded_files,
        student_notes: sub.student_notes,
        confidence_level: sub.confidence_level,
        quiz_score: sub.quiz_score,
        quiz_total: sub.quiz_total,
        status: sub.status,
        submitted_at: sub.submitted_at,
        teacher_feedback: sub.teacher_feedback,
        teacher_rating: sub.teacher_rating,
        reviewed_at: sub.reviewed_at,
        created_at: sub.created_at,
        unit_title: sub.arabic_syllabus?.unit_title_english || 'Unknown Unit',
        unit_number: sub.arabic_syllabus?.unit_number || 0,
        book: sub.arabic_syllabus?.book || '',
      }));

      setArabicSubmissions(formatted);
    } catch (error: any) {
      console.error('Error fetching Arabic submissions:', error);
    }
  }

  async function submitArabicFeedback(submissionId: string) {
    try {
      setSubmittingFeedback(true);

      const { error } = await supabase
        .from('homework_submissions')
        .update({
          teacher_feedback: feedback || null,
          teacher_rating: rating || null,
          reviewed_at: new Date().toISOString(),
          status: 'reviewed',
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Reset form
      setFeedback('');
      setRating('');
      setSelectedArabicSubmission(null);
      setExpandedArabicId(null);

      // Refresh list
      fetchArabicSubmissions();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback: ' + error.message);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  function toggleArabicExpand(id: string) {
    if (expandedArabicId === id) {
      setExpandedArabicId(null);
      setSelectedArabicSubmission(null);
    } else {
      setExpandedArabicId(id);
      const sub = arabicSubmissions.find(s => s.id === id);
      if (sub) {
        setSelectedArabicSubmission(sub);
        if (sub.teacher_feedback) setFeedback(sub.teacher_feedback);
        if (sub.teacher_rating) setRating(sub.teacher_rating);
      }
    }
  }

  function getFileIcon(type: string) {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  }

  function formatFileSize(bytes: number) {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }

  async function submitFeedback(submissionId: string) {
    try {
      setSubmittingFeedback(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const areas = areasToFocus.split(',').map(a => a.trim()).filter(a => a.length > 0);

      const { error } = await supabase
        .from('homework_submissions')
        .update({
          teacher_feedback: feedback || null,
          teacher_rating: rating || null,
          teacher_encouragement: encouragement || null,
          areas_to_focus: areas.length > 0 ? areas : null,
          reviewed_at: new Date().toISOString(),
          reviewed_by: user.id,
          status: 'reviewed',
        })
        .eq('id', submissionId);

      if (error) throw error;

      // Reset form
      setFeedback('');
      setRating('');
      setEncouragement('');
      setAreasToFocus('');
      setSelectedSubmission(null);
      setExpandedId(null);

      // Refresh list
      fetchSubmissions();
    } catch (error: any) {
      console.error('Error submitting feedback:', error);
      toast.error('Failed to submit feedback: ' + error.message);
    } finally {
      setSubmittingFeedback(false);
    }
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function getDifficultyLabel(rating: number | null) {
    if (!rating) return 'Not rated';
    const labels = ['Very Easy', 'Easy', 'Moderate', 'Hard', 'Very Hard'];
    return labels[rating - 1] || 'Unknown';
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'submitted':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/50';
      case 'reviewed':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50';
      case 'needs_revision':
        return 'bg-red-500/20 text-red-400 border-red-500/50';
      default:
        return 'bg-gray-500/20 text-gray-500 border-gray-300/50';
    }
  }

  function toggleExpand(id: string) {
    if (expandedId === id) {
      setExpandedId(null);
      setSelectedSubmission(null);
    } else {
      setExpandedId(id);
      const sub = submissions.find(s => s.id === id);
      if (sub) {
        setSelectedSubmission(sub);
        // Pre-fill feedback if already reviewed
        if (sub.teacher_feedback) setFeedback(sub.teacher_feedback);
        if (sub.teacher_rating) setRating(sub.teacher_rating);
        if (sub.teacher_encouragement) setEncouragement(sub.teacher_encouragement);
        if (sub.areas_to_focus) setAreasToFocus(sub.areas_to_focus.join(', '));
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center justify-center h-64">
            <div className="w-16 h-16 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </div>
      </div>
    );
  }

  const pendingLessonCount = submissions.filter(s => s.status === 'submitted').length;
  const pendingArabicCount = arabicSubmissions.filter(s => s.status === 'submitted').length;
  const totalPendingCount = pendingLessonCount + pendingArabicCount;

  // Current view counts
  const currentSubmissions = viewMode === 'arabic' ? arabicSubmissions : submissions;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/teacher/hub')}
            className="mb-6 flex items-center gap-2 text-gray-500 hover:text-white transition group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition" />
            <span>Back to Teacher Hub</span>
          </button>

          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <ClipboardCheck className="w-10 h-10 text-emerald-400" />
                Homework Review
              </h1>
              <p className="text-gray-600">
                Review student homework submissions and provide feedback
              </p>
            </div>

            {/* Pending Badge */}
            {totalPendingCount > 0 && (
              <div className="bg-amber-500/20 backdrop-blur-md rounded-xl px-6 py-3 border border-amber-500/50">
                <p className="text-amber-300 text-sm">Awaiting Review</p>
                <p className="text-3xl font-bold text-amber-400">{totalPendingCount}</p>
              </div>
            )}
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setViewMode('arabic')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition ${
              viewMode === 'arabic'
                ? 'bg-orange-500/30 text-orange-400 border-2 border-orange-500/50'
                : 'bg-white/5 text-gray-500 hover:bg-white/10 border-2 border-transparent'
            }`}
          >
            <Languages className="w-5 h-5" />
            Arabic Course
            {pendingArabicCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-orange-500/30 text-xs">
                {pendingArabicCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setViewMode('lesson')}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition ${
              viewMode === 'lesson'
                ? 'bg-emerald-500/30 text-emerald-600 border-2 border-emerald-500/50'
                : 'bg-white/5 text-gray-500 hover:bg-white/10 border-2 border-transparent'
            }`}
          >
            <BookOpen className="w-5 h-5" />
            Lesson Insights
            {pendingLessonCount > 0 && (
              <span className="ml-2 px-2 py-0.5 rounded-full bg-emerald-500/30 text-xs">
                {pendingLessonCount}
              </span>
            )}
          </button>
        </div>

        {/* Filter Tabs */}
        <div className="flex gap-2 mb-6">
          {[
            { key: 'submitted', label: 'Pending', count: currentSubmissions.filter(s => s.status === 'submitted').length },
            { key: 'reviewed', label: 'Reviewed', count: currentSubmissions.filter(s => s.status === 'reviewed' || s.status === 'needs_revision').length },
            { key: 'all', label: 'All', count: currentSubmissions.length },
          ].map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilterStatus(tab.key as any)}
              className={`px-4 py-2 rounded-lg font-medium transition ${
                filterStatus === tab.key
                  ? 'bg-emerald-500/30 text-emerald-600 border border-emerald-500/50'
                  : 'bg-white/5 text-gray-500 hover:bg-white/10'
              }`}
            >
              {tab.label}
              {tab.count > 0 && (
                <span className="ml-2 px-2 py-0.5 rounded-full bg-white/10 text-xs">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Arabic Homework Submissions */}
        {viewMode === 'arabic' && (
          arabicSubmissions.length === 0 ? (
            <div className="bg-white/5 backdrop-blur-md rounded-xl p-12 text-center border border-white/10">
              <Languages className="w-16 h-16 mx-auto mb-4 text-orange-500/50" />
              <h3 className="text-xl font-semibold mb-2">No Arabic homework submissions</h3>
              <p className="text-gray-400">
                {filterStatus === 'submitted'
                  ? 'No pending Arabic homework to review'
                  : 'Student Arabic homework will appear here when submitted'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {arabicSubmissions.map(submission => (
                <div
                  key={submission.id}
                  className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
                >
                  {/* Header Row */}
                  <button
                    onClick={() => toggleArabicExpand(submission.id)}
                    className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <Languages className="w-6 h-6 text-orange-400" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold text-lg">{submission.learner_name}</h3>
                        <p className="text-sm text-gray-500">
                          Book {submission.book} • Unit {submission.unit_number}: {submission.unit_title}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Confidence Level - Key for teacher */}
                      {submission.confidence_level && (
                        <div className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border ${CONFIDENCE_LEVELS[submission.confidence_level]?.bgColor}`}>
                          <Brain className={`w-4 h-4 ${CONFIDENCE_LEVELS[submission.confidence_level]?.color}`} />
                          <span className={`text-sm font-medium ${CONFIDENCE_LEVELS[submission.confidence_level]?.color}`}>
                            {CONFIDENCE_LEVELS[submission.confidence_level]?.label}
                          </span>
                        </div>
                      )}

                      {/* Quiz Score */}
                      {submission.quiz_score !== null && (
                        <div className="hidden md:block text-center">
                          <p className="text-xs text-gray-500">Quiz</p>
                          <p className="font-semibold text-emerald-600">
                            {submission.quiz_score}/{submission.quiz_total}
                          </p>
                        </div>
                      )}

                      {/* Files indicator */}
                      {submission.uploaded_files && submission.uploaded_files.length > 0 && (
                        <div className="hidden md:flex items-center gap-1 text-gray-500">
                          <Paperclip className="w-4 h-4" />
                          <span className="text-xs">{submission.uploaded_files.length}</span>
                        </div>
                      )}

                      {/* Status Badge */}
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(submission.status)}`}>
                        {submission.status.replace('_', ' ')}
                      </span>

                      {/* Expand Icon */}
                      {expandedArabicId === submission.id ? (
                        <ChevronUp className="w-5 h-5 text-gray-500" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-500" />
                      )}
                    </div>
                  </button>

                  {/* Expanded Content */}
                  {expandedArabicId === submission.id && (
                    <div className="border-t border-white/10 p-6 space-y-6">
                      <div className="grid md:grid-cols-2 gap-6">
                        {/* Left Column - Student Work */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg text-orange-400">Student Submission</h4>

                          {/* Confidence Level - Prominent display */}
                          {submission.confidence_level && (
                            <div className={`rounded-lg p-4 border ${CONFIDENCE_LEVELS[submission.confidence_level]?.bgColor}`}>
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                  <Brain className={`w-5 h-5 ${CONFIDENCE_LEVELS[submission.confidence_level]?.color}`} />
                                  <span className="font-medium text-white">Student's Confidence Level</span>
                                </div>
                                <span className={`text-lg font-bold ${CONFIDENCE_LEVELS[submission.confidence_level]?.color}`}>
                                  {submission.confidence_level}/5
                                </span>
                              </div>
                              <p className={`text-lg font-semibold ${CONFIDENCE_LEVELS[submission.confidence_level]?.color}`}>
                                {CONFIDENCE_LEVELS[submission.confidence_level]?.label}
                              </p>
                              <p className="text-sm text-gray-500 mt-1">
                                {CONFIDENCE_LEVELS[submission.confidence_level]?.description}
                              </p>
                              {submission.confidence_level <= 2 && (
                                <div className="mt-3 p-2 bg-amber-500/10 rounded border border-amber-500/30">
                                  <p className="text-xs text-amber-400 font-medium">
                                    Consider reinforcing this unit - student needs more practice
                                  </p>
                                </div>
                              )}
                            </div>
                          )}

                          {/* Uploaded Files */}
                          {submission.uploaded_files && submission.uploaded_files.length > 0 && (
                            <div className="bg-white/5 rounded-lg p-4">
                              <h5 className="font-medium mb-3 flex items-center gap-2">
                                <Paperclip className="w-4 h-4 text-orange-400" />
                                Uploaded Files ({submission.uploaded_files.length})
                              </h5>
                              <div className="space-y-2">
                                {submission.uploaded_files.map((file, idx) => (
                                  <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 bg-gray-50 rounded-lg px-3 py-2 hover:bg-gray-100 transition"
                                  >
                                    {getFileIcon(file.type)}
                                    <span className="text-sm text-emerald-600 hover:text-cyan-300 truncate flex-1">
                                      {file.name}
                                    </span>
                                    <span className="text-xs text-gray-500">{formatFileSize(file.size)}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quiz Score */}
                          {submission.quiz_score !== null && submission.quiz_total !== null && (
                            <div className="bg-emerald-500/10 rounded-lg p-4 flex items-center justify-between border border-emerald-500/30">
                              <div className="flex items-center gap-2">
                                <Star className="w-5 h-5 text-emerald-600" />
                                <span className="font-medium text-emerald-600">Quiz Score</span>
                              </div>
                              <div className="text-right">
                                <span className="text-xl font-bold text-white">
                                  {submission.quiz_score}/{submission.quiz_total}
                                </span>
                                <span className="text-sm text-gray-500 ml-2">
                                  ({Math.round((submission.quiz_score / submission.quiz_total) * 100)}%)
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Student Notes */}
                          {submission.student_notes && (
                            <div className="bg-white/5 rounded-lg p-4">
                              <h5 className="font-medium mb-2">Student Notes</h5>
                              <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                {submission.student_notes}
                              </p>
                            </div>
                          )}

                          {/* Submission Time */}
                          {submission.submitted_at && (
                            <p className="text-xs text-gray-500 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              Submitted {formatDate(submission.submitted_at)}
                            </p>
                          )}
                        </div>

                        {/* Right Column - Teacher Feedback */}
                        <div className="space-y-4">
                          <h4 className="font-semibold text-lg text-emerald-400">Your Feedback</h4>

                          {/* Rating Select */}
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                              Rating
                            </label>
                            <select
                              value={rating}
                              onChange={(e) => setRating(e.target.value)}
                              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            >
                              <option value="" className="bg-gray-100">Select rating...</option>
                              <option value="Excellent" className="bg-gray-100">Excellent</option>
                              <option value="Very Good" className="bg-gray-100">Very Good</option>
                              <option value="Good" className="bg-gray-100">Good</option>
                              <option value="Needs Improvement" className="bg-gray-100">Needs Improvement</option>
                              <option value="Incomplete" className="bg-gray-100">Incomplete</option>
                            </select>
                          </div>

                          {/* Feedback */}
                          <div>
                            <label className="block text-sm font-medium text-gray-500 mb-2">
                              Feedback
                            </label>
                            <textarea
                              value={feedback}
                              onChange={(e) => setFeedback(e.target.value)}
                              rows={4}
                              placeholder="Provide feedback on their Arabic progress, vocabulary retention, and grammar usage..."
                              className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                            />
                          </div>

                          {/* Submit Feedback Button */}
                          <button
                            onClick={() => submitArabicFeedback(submission.id)}
                            disabled={submittingFeedback}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2"
                          >
                            {submittingFeedback ? (
                              <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Submitting...
                              </>
                            ) : (
                              <>
                                <Send className="w-5 h-5" />
                                Submit Feedback
                              </>
                            )}
                          </button>

                          {/* Previous Feedback */}
                          {submission.status === 'reviewed' && submission.reviewed_at && (
                            <div className="mt-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                              <p className="text-xs text-emerald-400 mb-2">
                                Reviewed on {formatDate(submission.reviewed_at)}
                              </p>
                              {submission.teacher_rating && (
                                <p className="text-sm">
                                  <span className="text-gray-500">Rating:</span>{' '}
                                  <span className="text-emerald-400">{submission.teacher_rating}</span>
                                </p>
                              )}
                              {submission.teacher_feedback && (
                                <p className="text-sm text-gray-600 mt-2">{submission.teacher_feedback}</p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )
        )}

        {/* Lesson Insight Submissions */}
        {viewMode === 'lesson' && submissions.length === 0 && (
          <div className="bg-white/5 backdrop-blur-md rounded-xl p-12 text-center border border-white/10">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-xl font-semibold mb-2">No homework submissions</h3>
            <p className="text-gray-400">
              {filterStatus === 'submitted'
                ? 'No pending submissions to review'
                : 'Student homework submissions will appear here'}
            </p>
          </div>
        )}

        {viewMode === 'lesson' && submissions.length > 0 && (
          <div className="space-y-4">
            {submissions.map(submission => (
              <div
                key={submission.id}
                className="bg-white/5 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
              >
                {/* Header Row */}
                <button
                  onClick={() => toggleExpand(submission.id)}
                  className="w-full p-6 flex items-center justify-between hover:bg-white/5 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-lg">{submission.learner_name}</h3>
                      <p className="text-sm text-gray-500">
                        {submission.lesson_subject} - {formatDate(submission.lesson_date)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Quick Stats */}
                    <div className="hidden md:flex items-center gap-4 mr-4">
                      {submission.quiz_score !== null && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Quiz</p>
                          <p className="font-semibold text-emerald-600">
                            {submission.quiz_score}/{submission.quiz_total}
                          </p>
                        </div>
                      )}
                      {submission.tasks_total_count > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-gray-500">Tasks</p>
                          <p className="font-semibold text-emerald-400">
                            {submission.tasks_completed_count}/{submission.tasks_total_count}
                          </p>
                        </div>
                      )}
                      {submission.questions_for_teacher && (
                        <div className="flex items-center gap-1 text-amber-400">
                          <MessageSquare className="w-4 h-4" />
                          <span className="text-xs">Has Question</span>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(submission.status)}`}>
                      {submission.status.replace('_', ' ')}
                    </span>

                    {/* Expand Icon */}
                    {expandedId === submission.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-500" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {expandedId === submission.id && (
                  <div className="border-t border-white/10 p-6 space-y-6">
                    {/* Submission Details */}
                    <div className="grid md:grid-cols-2 gap-6">
                      {/* Left Column - Student Work */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-emerald-600">Student Submission</h4>

                        {/* Quiz Results */}
                        {submission.quiz_answers && submission.quiz_answers.length > 0 && (
                          <div className="bg-white/5 rounded-lg p-4">
                            <h5 className="font-medium mb-2 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-emerald-400" />
                              Quiz Answers ({submission.quiz_score}/{submission.quiz_total})
                            </h5>
                            <div className="space-y-2 text-sm">
                              {submission.quiz_answers.map((answer: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`p-2 rounded ${
                                    answer.correct
                                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                                      : 'bg-red-500/10 border border-red-500/30'
                                  }`}
                                >
                                  <p className="text-gray-600">{answer.question || `Question ${idx + 1}`}</p>
                                  <p className={answer.correct ? 'text-emerald-400' : 'text-red-400'}>
                                    Answer: {answer.selectedAnswer}
                                    {!answer.correct && answer.correctAnswer && (
                                      <span className="text-gray-500"> (Correct: {answer.correctAnswer})</span>
                                    )}
                                  </p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Completed Tasks */}
                        {submission.completed_tasks && submission.completed_tasks.length > 0 && (
                          <div className="bg-white/5 rounded-lg p-4">
                            <h5 className="font-medium mb-2 flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-purple-400" />
                              Homework Tasks
                            </h5>
                            <div className="space-y-2 text-sm">
                              {submission.completed_tasks.map((task: any, idx: number) => (
                                <div
                                  key={idx}
                                  className={`flex items-start gap-2 p-2 rounded ${
                                    task.completed
                                      ? 'bg-emerald-500/10 border border-emerald-500/30'
                                      : 'bg-gray-500/10 border border-gray-300/30'
                                  }`}
                                >
                                  {task.completed ? (
                                    <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-gray-500 mt-0.5" />
                                  )}
                                  <span className={task.completed ? 'text-emerald-300' : 'text-gray-500'}>
                                    {task.task}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Difficulty Rating */}
                        {submission.difficulty_rating && (
                          <div className="bg-white/5 rounded-lg p-4">
                            <h5 className="font-medium mb-2">Difficulty Rating</h5>
                            <div className="flex items-center gap-2">
                              {[1, 2, 3, 4, 5].map(star => (
                                <Star
                                  key={star}
                                  className={`w-5 h-5 ${
                                    star <= submission.difficulty_rating!
                                      ? 'text-amber-400 fill-amber-400'
                                      : 'text-gray-600'
                                  }`}
                                />
                              ))}
                              <span className="text-sm text-gray-500 ml-2">
                                {getDifficultyLabel(submission.difficulty_rating)}
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Student Notes */}
                        {submission.student_notes && (
                          <div className="bg-white/5 rounded-lg p-4">
                            <h5 className="font-medium mb-2">Student Notes</h5>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {submission.student_notes}
                            </p>
                          </div>
                        )}

                        {/* Questions for Teacher */}
                        {submission.questions_for_teacher && (
                          <div className="bg-amber-500/10 rounded-lg p-4 border border-amber-500/30">
                            <h5 className="font-medium mb-2 flex items-center gap-2 text-amber-400">
                              <AlertCircle className="w-4 h-4" />
                              Question for You
                            </h5>
                            <p className="text-sm text-gray-600 whitespace-pre-wrap">
                              {submission.questions_for_teacher}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Right Column - Teacher Feedback */}
                      <div className="space-y-4">
                        <h4 className="font-semibold text-lg text-emerald-400">Your Feedback</h4>

                        {/* Rating Select */}
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-2">
                            Overall Rating
                          </label>
                          <select
                            value={rating}
                            onChange={(e) => setRating(e.target.value)}
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          >
                            <option value="" className="bg-gray-100">Select rating...</option>
                            <option value="excellent" className="bg-gray-100">Excellent</option>
                            <option value="good" className="bg-gray-100">Good</option>
                            <option value="satisfactory" className="bg-gray-100">Satisfactory</option>
                            <option value="needs_improvement" className="bg-gray-100">Needs Improvement</option>
                          </select>
                        </div>

                        {/* Encouragement */}
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-2">
                            Encouragement / Praise
                          </label>
                          <textarea
                            value={encouragement}
                            onChange={(e) => setEncouragement(e.target.value)}
                            rows={2}
                            placeholder="e.g., Great effort on the vocabulary! You're making excellent progress..."
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Detailed Feedback */}
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-2">
                            Detailed Feedback
                          </label>
                          <textarea
                            value={feedback}
                            onChange={(e) => setFeedback(e.target.value)}
                            rows={4}
                            placeholder="Provide constructive feedback on their work..."
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Areas to Focus */}
                        <div>
                          <label className="block text-sm font-medium text-gray-500 mb-2">
                            Areas to Focus (comma separated)
                          </label>
                          <input
                            type="text"
                            value={areasToFocus}
                            onChange={(e) => setAreasToFocus(e.target.value)}
                            placeholder="e.g., Verb conjugation, Vocabulary retention, Pronunciation"
                            className="w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                          />
                        </div>

                        {/* Submit Feedback Button */}
                        <button
                          onClick={() => submitFeedback(submission.id)}
                          disabled={submittingFeedback}
                          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-800 disabled:cursor-not-allowed rounded-lg font-semibold transition flex items-center justify-center gap-2"
                        >
                          {submittingFeedback ? (
                            <>
                              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              <Send className="w-5 h-5" />
                              Submit Feedback
                            </>
                          )}
                        </button>

                        {/* Previous Feedback (if any) */}
                        {submission.status === 'reviewed' && submission.reviewed_at && (
                          <div className="mt-4 p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/30">
                            <p className="text-xs text-emerald-400 mb-2">
                              Reviewed on {formatDate(submission.reviewed_at)}
                            </p>
                            {submission.teacher_rating && (
                              <p className="text-sm">
                                <span className="text-gray-500">Rating:</span>{' '}
                                <span className="text-emerald-400 capitalize">
                                  {submission.teacher_rating.replace('_', ' ')}
                                </span>
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* View Lesson Insights Link */}
                    <div className="pt-4 border-t border-white/10">
                      <button
                        onClick={() => navigate(`/lesson/${submission.lesson_id}/insights`)}
                        className="text-emerald-600 hover:text-cyan-300 text-sm flex items-center gap-2"
                      >
                        <BookOpen className="w-4 h-4" />
                        View Full Lesson Insights
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
