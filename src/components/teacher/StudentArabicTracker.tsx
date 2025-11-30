import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, ChevronUp, BookOpen, Brain, MessageCircle, PenTool,
  Edit3, Save, X, Check, Search, Loader2, Languages, GraduationCap,
  FileText, Image as ImageIcon, Star, Clock, CheckCircle, Paperclip
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface SyllabusUnit {
  id: string;
  book: string;
  unit_number: number;
  unit_title_arabic: string;
  unit_title_english: string;
  unit_theme: string | null;
  key_vocabulary: string[] | null;
  grammar_topics: string[] | null;
  conversation_topics: string[] | null;
  estimated_lessons: number;
  display_order: number;
}

interface UnitProgress {
  id?: string;
  syllabus_id: string;
  understanding_complete: boolean;
  practice_complete: boolean;
  mastery_complete: boolean;
  vocabulary_mastered: number;
  grammar_mastered: boolean;
  conversation_practiced: boolean;
  teacher_notes: string | null;
  last_lesson_date: string | null;
  status: 'not_started' | 'in_progress' | 'completed' | 'needs_review';
}

interface UploadedFile {
  name: string;
  url: string;
  type: string;
  size: number;
}

interface HomeworkSubmission {
  id: string;
  syllabus_id: string;
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
}

// Confidence levels for teacher reference
const CONFIDENCE_LEVELS: Record<number, { label: string; color: string; description: string }> = {
  1: { label: 'Need More Practice', color: 'red', description: 'Student needs more repetition on basics' },
  2: { label: 'Getting There', color: 'amber', description: 'Understands some but needs reinforcement' },
  3: { label: 'Fairly Confident', color: 'yellow', description: 'Can recall most with effort' },
  4: { label: 'Strong', color: 'emerald', description: 'Comfortable with material, minor gaps' },
  5: { label: 'Mastered', color: 'cyan', description: 'Uses vocabulary/rules naturally' },
};

interface StudentArabicTrackerProps {
  studentId: string;
  studentName: string;
  onClose?: () => void;
}

const BOOK_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  '1A': { bg: 'bg-emerald-500/20', text: 'text-emerald-400', border: 'border-emerald-500/50' },
  '1B': { bg: 'bg-cyan-500/20', text: 'text-cyan-400', border: 'border-cyan-500/50' },
  '2A': { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/50' },
  '2B': { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/50' },
};

export default function StudentArabicTracker({
  studentId,
  studentName,
  onClose,
}: StudentArabicTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syllabus, setSyllabus] = useState<SyllabusUnit[]>([]);
  const [progress, setProgress] = useState<Record<string, UnitProgress>>({});
  const [homework, setHomework] = useState<Record<string, HomeworkSubmission>>({});
  const [selectedBook, setSelectedBook] = useState<string>('1A');
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [editingGeneralNotes, setEditingGeneralNotes] = useState(false);
  const [reviewingHomework, setReviewingHomework] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState('');
  const [ratingValue, setRatingValue] = useState('');

  useEffect(() => {
    loadData();
  }, [studentId]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load syllabus
      const { data: syllabusData, error: syllabusError } = await supabase
        .from('arabic_syllabus')
        .select('*')
        .order('display_order');

      if (syllabusError) throw syllabusError;
      setSyllabus(syllabusData || []);

      // Load progress for this student
      const { data: progressData, error: progressError } = await supabase
        .from('arabic_learner_progress')
        .select('*')
        .eq('learner_id', studentId);

      if (progressError) throw progressError;

      // Index by syllabus_id
      const progressMap: Record<string, UnitProgress> = {};
      progressData?.forEach((p) => {
        progressMap[p.syllabus_id] = p;
      });
      setProgress(progressMap);

      // Load homework submissions for this student (Arabic course)
      const { data: homeworkData, error: homeworkError } = await supabase
        .from('homework_submissions')
        .select('*')
        .eq('learner_id', studentId)
        .eq('course_type', 'arabic');

      if (homeworkError) {
        console.error('Error loading homework:', homeworkError);
      } else {
        // Index by syllabus_id
        const homeworkMap: Record<string, HomeworkSubmission> = {};
        homeworkData?.forEach((h) => {
          if (h.syllabus_id) {
            homeworkMap[h.syllabus_id] = h;
          }
        });
        setHomework(homeworkMap);
      }

      // Load general notes
      const { data: notesData } = await supabase
        .from('student_teacher_relationships')
        .select('teacher_general_notes')
        .eq('student_id', studentId)
        .maybeSingle();

      if (notesData?.teacher_general_notes) {
        setGeneralNotes(notesData.teacher_general_notes);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getUnitProgress = (syllabusId: string): UnitProgress | undefined => {
    return progress[syllabusId];
  };

  const getBookStats = useCallback((book: string) => {
    const bookUnits = syllabus.filter((u) => u.book === book);
    const completed = bookUnits.filter(
      (u) => progress[u.id]?.mastery_complete
    ).length;
    const inProgress = bookUnits.filter(
      (u) => progress[u.id]?.status === 'in_progress'
    ).length;
    return {
      total: bookUnits.length,
      completed,
      inProgress,
      percentage: Math.round((completed / bookUnits.length) * 100) || 0,
    };
  }, [syllabus, progress]);

  const handleToggleProgress = async (
    syllabusId: string,
    field: 'understanding_complete' | 'practice_complete' | 'mastery_complete' | 'grammar_mastered' | 'conversation_practiced'
  ) => {
    setSaving(true);
    try {
      const existing = getUnitProgress(syllabusId);
      const newValue = existing ? !existing[field] : true;

      // Determine new status based on toggles
      let newStatus: 'not_started' | 'in_progress' | 'completed' | 'needs_review' = 'not_started';
      const updatedProgress = {
        ...existing,
        [field]: newValue,
      };

      if (updatedProgress.mastery_complete) {
        newStatus = 'completed';
      } else if (updatedProgress.understanding_complete || updatedProgress.practice_complete) {
        newStatus = 'in_progress';
      }

      const updateData = {
        learner_id: studentId,
        syllabus_id: syllabusId,
        [field]: newValue,
        status: newStatus,
        last_lesson_date: new Date().toISOString().split('T')[0],
      };

      // Use upsert to handle case where record exists but wasn't visible due to RLS
      const { error } = await supabase
        .from('arabic_learner_progress')
        .upsert(updateData, {
          onConflict: 'learner_id,syllabus_id',
          ignoreDuplicates: false
        });
      if (error) throw error;

      // Update local state
      setProgress((prev) => ({
        ...prev,
        [syllabusId]: {
          ...prev[syllabusId],
          ...updateData,
        } as UnitProgress,
      }));
    } catch (error) {
      console.error('Error updating progress:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveNotes = async (syllabusId: string) => {
    setSaving(true);
    try {
      const existing = getUnitProgress(syllabusId);

      const updateData = {
        learner_id: studentId,
        syllabus_id: syllabusId,
        teacher_notes: notesText,
        last_lesson_date: new Date().toISOString().split('T')[0],
      };

      // Use upsert to handle case where record exists but wasn't visible due to RLS
      const { error } = await supabase
        .from('arabic_learner_progress')
        .upsert(updateData, {
          onConflict: 'learner_id,syllabus_id',
          ignoreDuplicates: false
        });
      if (error) throw error;

      // Update local state
      setProgress((prev) => ({
        ...prev,
        [syllabusId]: {
          ...prev[syllabusId],
          teacher_notes: notesText,
        } as UnitProgress,
      }));

      setEditingNotes(null);
      setNotesText('');
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneralNotes = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('student_teacher_relationships')
        .update({ teacher_general_notes: generalNotes })
        .eq('student_id', studentId);

      if (error) throw error;
      setEditingGeneralNotes(false);
    } catch (error) {
      console.error('Error saving general notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleReviewHomework = async (syllabusId: string) => {
    if (!feedbackText.trim()) return;
    setSaving(true);
    try {
      const submission = homework[syllabusId];
      if (!submission) return;

      const { error } = await supabase
        .from('homework_submissions')
        .update({
          teacher_feedback: feedbackText.trim(),
          teacher_rating: ratingValue || null,
          status: 'reviewed',
          reviewed_at: new Date().toISOString()
        })
        .eq('id', submission.id);

      if (error) throw error;

      // Update local state
      setHomework(prev => ({
        ...prev,
        [syllabusId]: {
          ...prev[syllabusId],
          teacher_feedback: feedbackText.trim(),
          teacher_rating: ratingValue || null,
          status: 'reviewed',
          reviewed_at: new Date().toISOString()
        }
      }));

      setReviewingHomework(null);
      setFeedbackText('');
      setRatingValue('');
    } catch (error) {
      console.error('Error reviewing homework:', error);
    } finally {
      setSaving(false);
    }
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return <ImageIcon className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  // Filter units
  const filteredUnits = searchQuery
    ? syllabus.filter(
        (u) =>
          u.unit_title_english.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.unit_title_arabic.includes(searchQuery) ||
          u.unit_theme?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          u.unit_number.toString() === searchQuery
      )
    : syllabus.filter((u) => u.book === selectedBook);

  // Calculate overall stats
  const overallStats = {
    totalUnits: syllabus.length,
    completed: Object.values(progress).filter((p) => p.mastery_complete).length,
    inProgress: Object.values(progress).filter((p) => p.status === 'in_progress').length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <Languages className="w-7 h-7" />
              Arabic Progress - {studentName}
            </h2>
            <p className="text-orange-100 mt-1">
              Al-Arabiyyah Bayna Yadayk - Track {studentName}'s Arabic learning
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-orange-400" />
              <span className="text-slate-400 text-sm">Total Units</span>
            </div>
            <p className="text-2xl font-bold text-orange-400">{overallStats.totalUnits}</p>
            <p className="text-xs text-slate-500">Book 1A & 1B</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <GraduationCap className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400 text-sm">Completed</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{overallStats.completed}</p>
            <p className="text-xs text-slate-500">{Math.round((overallStats.completed / overallStats.totalUnits) * 100)}% mastered</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-400 text-sm">In Progress</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">{overallStats.inProgress}</p>
            <p className="text-xs text-slate-500">Currently learning</p>
          </div>
          <div className="bg-gradient-to-br from-orange-500/20 to-amber-500/20 rounded-xl p-4 border border-orange-500/30">
            <div className="flex items-center gap-2 mb-2">
              <Languages className="w-5 h-5 text-orange-400" />
              <span className="text-orange-300 text-sm">Overall</span>
            </div>
            <p className="text-3xl font-bold text-orange-400">
              {Math.round((overallStats.completed / overallStats.totalUnits) * 100)}%
            </p>
            <p className="text-xs text-orange-400/70">Complete</p>
          </div>
        </div>
      </div>

      {/* General Notes Section */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <Edit3 className="w-5 h-5 text-orange-400" />
            General Arabic Learning Notes
          </h3>
          {!editingGeneralNotes && (
            <button
              onClick={() => setEditingGeneralNotes(true)}
              className="text-orange-400 hover:text-orange-300 text-sm flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        {editingGeneralNotes ? (
          <div className="space-y-3">
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Add notes about the student's Arabic progress, strengths, areas to improve..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveGeneralNotes}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Notes
              </button>
              <button
                onClick={() => setEditingGeneralNotes(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            {generalNotes ? (
              <p className="text-slate-300 whitespace-pre-wrap">{generalNotes}</p>
            ) : (
              <p className="text-slate-500 italic">No general notes yet. Click Edit to add notes.</p>
            )}
          </div>
        )}
      </div>

      {/* Book Navigation */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Select Book</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search units..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm w-48"
            />
          </div>
        </div>

        <div className="flex gap-3">
          {['1A', '1B'].map((book) => {
            const stats = getBookStats(book);
            const colors = BOOK_COLORS[book];
            return (
              <button
                key={book}
                onClick={() => {
                  setSelectedBook(book);
                  setSearchQuery('');
                }}
                className={`flex-1 p-4 rounded-xl border-2 transition ${
                  selectedBook === book && !searchQuery
                    ? `${colors.bg} ${colors.border}`
                    : 'bg-slate-800/50 border-slate-700/50 hover:border-slate-600'
                }`}
              >
                <div className="text-left">
                  <h4 className={`font-bold ${selectedBook === book && !searchQuery ? colors.text : 'text-white'}`}>
                    Book {book}
                  </h4>
                  <p className="text-slate-400 text-sm">
                    {book === '1A' ? 'Units 1-8 (Beginner)' : 'Units 9-16 (Elementary)'}
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <div className="flex-1 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${colors.bg.replace('/20', '')} transition-all`}
                        style={{ width: `${stats.percentage}%` }}
                      />
                    </div>
                    <span className={`text-sm font-medium ${colors.text}`}>
                      {stats.completed}/{stats.total}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Unit List */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="space-y-3">
          {filteredUnits.map((unit) => {
            const unitProgress = getUnitProgress(unit.id);
            const isExpanded = expandedUnit === unit.id;
            const isComplete = unitProgress?.mastery_complete;
            const colors = BOOK_COLORS[unit.book];

            return (
              <div
                key={unit.id}
                className={`bg-slate-800/50 rounded-xl border overflow-hidden transition ${
                  isComplete ? colors.border : 'border-slate-700/50'
                }`}
              >
                {/* Unit Header */}
                <button
                  onClick={() => setExpandedUnit(isExpanded ? null : unit.id)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/70 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                      isComplete ? colors.bg + ' ' + colors.text : 'bg-slate-700/50 text-slate-300'
                    }`}>
                      {unit.unit_number}
                    </div>
                    <div className="text-left">
                      <h4 className="text-white font-semibold flex items-center gap-2">
                        {unit.unit_title_english}
                        <span className="text-lg text-orange-400 font-arabic">{unit.unit_title_arabic}</span>
                      </h4>
                      <p className="text-slate-400 text-sm">
                        Book {unit.book} • {unit.unit_theme}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Status Badge */}
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                      unitProgress?.status === 'completed'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : unitProgress?.status === 'in_progress'
                        ? 'bg-cyan-500/20 text-cyan-400'
                        : unitProgress?.status === 'needs_review'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-slate-700/50 text-slate-400'
                    }`}>
                      {unitProgress?.status?.replace('_', ' ') || 'Not Started'}
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-700/50 pt-4 space-y-4">
                    {/* Progress Checkboxes */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Understanding */}
                      <button
                        onClick={() => handleToggleProgress(unit.id, 'understanding_complete')}
                        disabled={saving}
                        className={`p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                          unitProgress?.understanding_complete
                            ? 'bg-cyan-500/20 border-cyan-500'
                            : 'bg-slate-900/30 border-slate-700/50 hover:border-cyan-500/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                          unitProgress?.understanding_complete ? 'border-cyan-500 bg-cyan-500/20' : 'border-slate-600'
                        }`}>
                          {unitProgress?.understanding_complete && <Check className="w-5 h-5 text-cyan-400" />}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-white">Understanding</p>
                          <p className="text-xs text-slate-400">Can understand vocabulary</p>
                        </div>
                      </button>

                      {/* Practice */}
                      <button
                        onClick={() => handleToggleProgress(unit.id, 'practice_complete')}
                        disabled={saving}
                        className={`p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                          unitProgress?.practice_complete
                            ? 'bg-blue-500/20 border-blue-500'
                            : 'bg-slate-900/30 border-slate-700/50 hover:border-blue-500/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                          unitProgress?.practice_complete ? 'border-blue-500 bg-blue-500/20' : 'border-slate-600'
                        }`}>
                          {unitProgress?.practice_complete && <Check className="w-5 h-5 text-blue-400" />}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-white">Practice</p>
                          <p className="text-xs text-slate-400">Can use in exercises</p>
                        </div>
                      </button>

                      {/* Mastery */}
                      <button
                        onClick={() => handleToggleProgress(unit.id, 'mastery_complete')}
                        disabled={saving}
                        className={`p-4 rounded-xl border-2 transition flex items-center gap-3 ${
                          unitProgress?.mastery_complete
                            ? 'bg-emerald-500/20 border-emerald-500'
                            : 'bg-slate-900/30 border-slate-700/50 hover:border-emerald-500/50'
                        }`}
                      >
                        <div className={`w-8 h-8 rounded-lg border-2 flex items-center justify-center ${
                          unitProgress?.mastery_complete ? 'border-emerald-500 bg-emerald-500/20' : 'border-slate-600'
                        }`}>
                          {unitProgress?.mastery_complete && <Check className="w-5 h-5 text-emerald-400" />}
                        </div>
                        <div className="text-left">
                          <p className="font-medium text-white">Mastery</p>
                          <p className="text-xs text-slate-400">Fluent in conversation</p>
                        </div>
                      </button>
                    </div>

                    {/* Skills Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => handleToggleProgress(unit.id, 'grammar_mastered')}
                        disabled={saving}
                        className={`p-3 rounded-xl border transition flex items-center gap-3 ${
                          unitProgress?.grammar_mastered
                            ? 'bg-purple-500/20 border-purple-500/50'
                            : 'bg-slate-900/30 border-slate-700/50 hover:border-purple-500/30'
                        }`}
                      >
                        <PenTool className={`w-5 h-5 ${unitProgress?.grammar_mastered ? 'text-purple-400' : 'text-slate-400'}`} />
                        <span className={unitProgress?.grammar_mastered ? 'text-purple-300' : 'text-slate-300'}>
                          Grammar Mastered
                        </span>
                      </button>
                      <button
                        onClick={() => handleToggleProgress(unit.id, 'conversation_practiced')}
                        disabled={saving}
                        className={`p-3 rounded-xl border transition flex items-center gap-3 ${
                          unitProgress?.conversation_practiced
                            ? 'bg-amber-500/20 border-amber-500/50'
                            : 'bg-slate-900/30 border-slate-700/50 hover:border-amber-500/30'
                        }`}
                      >
                        <MessageCircle className={`w-5 h-5 ${unitProgress?.conversation_practiced ? 'text-amber-400' : 'text-slate-400'}`} />
                        <span className={unitProgress?.conversation_practiced ? 'text-amber-300' : 'text-slate-300'}>
                          Conversation Practiced
                        </span>
                      </button>
                    </div>

                    {/* Unit Details */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {/* Key Vocabulary */}
                      {unit.key_vocabulary && unit.key_vocabulary.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                          <p className="text-xs text-orange-400 font-medium mb-2 flex items-center gap-1">
                            <BookOpen className="w-4 h-4" />
                            Key Vocabulary
                          </p>
                          <div className="flex flex-wrap gap-1">
                            {unit.key_vocabulary.slice(0, 6).map((word, i) => (
                              <span key={i} className="px-2 py-1 bg-orange-500/10 text-orange-300 rounded text-xs font-arabic">
                                {word}
                              </span>
                            ))}
                            {unit.key_vocabulary.length > 6 && (
                              <span className="px-2 py-1 text-slate-400 text-xs">
                                +{unit.key_vocabulary.length - 6} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Grammar Topics */}
                      {unit.grammar_topics && unit.grammar_topics.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                          <p className="text-xs text-purple-400 font-medium mb-2 flex items-center gap-1">
                            <PenTool className="w-4 h-4" />
                            Grammar Topics
                          </p>
                          <ul className="space-y-1">
                            {unit.grammar_topics.slice(0, 3).map((topic, i) => (
                              <li key={i} className="text-xs text-slate-300">
                                • {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Conversation Topics */}
                      {unit.conversation_topics && unit.conversation_topics.length > 0 && (
                        <div className="bg-slate-900/50 rounded-xl p-4 border border-slate-700/30">
                          <p className="text-xs text-amber-400 font-medium mb-2 flex items-center gap-1">
                            <MessageCircle className="w-4 h-4" />
                            Conversation Topics
                          </p>
                          <ul className="space-y-1">
                            {unit.conversation_topics.map((topic, i) => (
                              <li key={i} className="text-xs text-slate-300">
                                • {topic}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>

                    {/* Teacher Notes */}
                    <div className="bg-slate-900/30 rounded-xl p-4 border border-slate-700/30">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-white font-medium flex items-center gap-2">
                          <Edit3 className="w-4 h-4 text-cyan-400" />
                          Teacher Notes for Unit {unit.unit_number}
                        </p>
                        {editingNotes !== unit.id && (
                          <button
                            onClick={() => {
                              setEditingNotes(unit.id);
                              setNotesText(unitProgress?.teacher_notes || '');
                            }}
                            className="text-cyan-400 hover:text-cyan-300 text-xs"
                          >
                            {unitProgress?.teacher_notes ? 'Edit' : 'Add Notes'}
                          </button>
                        )}
                      </div>

                      {editingNotes === unit.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={notesText}
                            onChange={(e) => setNotesText(e.target.value)}
                            placeholder="Add notes about the student's progress in this unit..."
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none text-sm"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSaveNotes(unit.id)}
                              disabled={saving}
                              className="flex-1 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                            >
                              {saving ? 'Saving...' : 'Save Notes'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingNotes(null);
                                setNotesText('');
                              }}
                              className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : unitProgress?.teacher_notes ? (
                        <p className="text-sm text-slate-300 whitespace-pre-wrap">{unitProgress.teacher_notes}</p>
                      ) : (
                        <p className="text-sm text-slate-500 italic">No notes yet.</p>
                      )}
                    </div>

                    {/* Student Homework Section */}
                    {homework[unit.id] && (
                      <div className="bg-gradient-to-r from-orange-600/10 to-amber-600/10 rounded-xl p-4 border border-orange-500/30">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <Paperclip className="w-5 h-5 text-orange-400" />
                            <span className="font-semibold text-white">Student Homework</span>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            homework[unit.id].status === 'reviewed'
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : homework[unit.id].status === 'submitted'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {homework[unit.id].status === 'reviewed' ? 'Reviewed' :
                             homework[unit.id].status === 'submitted' ? 'Submitted' : 'Draft'}
                          </span>
                        </div>

                        {/* Uploaded Files */}
                        {homework[unit.id].uploaded_files && homework[unit.id].uploaded_files!.length > 0 && (
                          <div className="mb-3">
                            <p className="text-xs text-slate-400 mb-2">Submitted Files</p>
                            <div className="space-y-2">
                              {homework[unit.id].uploaded_files!.map((file, index) => (
                                <a
                                  key={index}
                                  href={file.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center gap-2 bg-slate-800/50 rounded-lg px-3 py-2 hover:bg-slate-700/50 transition"
                                >
                                  {getFileIcon(file.type)}
                                  <span className="text-sm text-cyan-400 hover:text-cyan-300 truncate flex-1">
                                    {file.name}
                                  </span>
                                  <span className="text-xs text-slate-500">{formatFileSize(file.size)}</span>
                                </a>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Student Confidence Level */}
                        {homework[unit.id].confidence_level && (
                          <div className={`mb-3 rounded-lg p-3 border ${
                            homework[unit.id].confidence_level === 1 ? 'bg-red-500/10 border-red-500/30' :
                            homework[unit.id].confidence_level === 2 ? 'bg-amber-500/10 border-amber-500/30' :
                            homework[unit.id].confidence_level === 3 ? 'bg-yellow-500/10 border-yellow-500/30' :
                            homework[unit.id].confidence_level === 4 ? 'bg-emerald-500/10 border-emerald-500/30' :
                            'bg-cyan-500/10 border-cyan-500/30'
                          }`}>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Brain className={`w-5 h-5 ${
                                  homework[unit.id].confidence_level === 1 ? 'text-red-400' :
                                  homework[unit.id].confidence_level === 2 ? 'text-amber-400' :
                                  homework[unit.id].confidence_level === 3 ? 'text-yellow-400' :
                                  homework[unit.id].confidence_level === 4 ? 'text-emerald-400' :
                                  'text-cyan-400'
                                }`} />
                                <span className="text-sm font-medium text-white">Student Confidence</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  homework[unit.id].confidence_level === 1 ? 'bg-red-500/20 text-red-400' :
                                  homework[unit.id].confidence_level === 2 ? 'bg-amber-500/20 text-amber-400' :
                                  homework[unit.id].confidence_level === 3 ? 'bg-yellow-500/20 text-yellow-400' :
                                  homework[unit.id].confidence_level === 4 ? 'bg-emerald-500/20 text-emerald-400' :
                                  'bg-cyan-500/20 text-cyan-400'
                                }`}>
                                  {CONFIDENCE_LEVELS[homework[unit.id].confidence_level!]?.label}
                                </span>
                                <span className="text-xs text-slate-400">
                                  ({homework[unit.id].confidence_level}/5)
                                </span>
                              </div>
                            </div>
                            <p className="text-xs text-slate-400 mt-2">
                              {CONFIDENCE_LEVELS[homework[unit.id].confidence_level!]?.description}
                            </p>
                            {homework[unit.id].confidence_level! <= 2 && (
                              <p className="text-xs text-amber-400 mt-1 font-medium">
                                Consider reinforcing this unit in upcoming lessons
                              </p>
                            )}
                          </div>
                        )}

                        {/* Student Notes */}
                        {homework[unit.id].student_notes && (
                          <div className="mb-3 bg-slate-800/30 rounded-lg p-3">
                            <p className="text-xs text-slate-400 mb-1">Student's Notes</p>
                            <p className="text-sm text-slate-300">{homework[unit.id].student_notes}</p>
                          </div>
                        )}

                        {/* Quiz Score */}
                        {homework[unit.id].quiz_score !== null && homework[unit.id].quiz_total !== null && (
                          <div className="mb-3 bg-cyan-500/10 rounded-lg p-3 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Star className="w-5 h-5 text-cyan-400" />
                              <span className="text-sm text-cyan-400 font-medium">Quiz Score</span>
                            </div>
                            <div className="text-right">
                              <span className="text-xl font-bold text-white">
                                {homework[unit.id].quiz_score}/{homework[unit.id].quiz_total}
                              </span>
                              <span className="text-sm text-slate-400 ml-2">
                                ({Math.round((homework[unit.id].quiz_score! / homework[unit.id].quiz_total!) * 100)}%)
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Submission Time */}
                        {homework[unit.id].submitted_at && (
                          <p className="text-xs text-slate-500 mb-3 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Submitted {new Date(homework[unit.id].submitted_at!).toLocaleString()}
                          </p>
                        )}

                        {/* Teacher Review Section */}
                        {homework[unit.id].status === 'reviewed' && homework[unit.id].teacher_feedback ? (
                          <div className="bg-emerald-500/10 rounded-lg p-3 border border-emerald-500/30">
                            <div className="flex items-center gap-2 mb-2">
                              <CheckCircle className="w-5 h-5 text-emerald-400" />
                              <span className="font-semibold text-emerald-400">Your Feedback</span>
                              {homework[unit.id].teacher_rating && (
                                <span className="ml-auto flex items-center gap-1 text-amber-400">
                                  <Star className="w-4 h-4 fill-amber-400" />
                                  {homework[unit.id].teacher_rating}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-slate-300">{homework[unit.id].teacher_feedback}</p>
                            {homework[unit.id].reviewed_at && (
                              <p className="text-xs text-slate-500 mt-2">
                                Reviewed {new Date(homework[unit.id].reviewed_at!).toLocaleDateString()}
                              </p>
                            )}
                          </div>
                        ) : homework[unit.id].status === 'submitted' ? (
                          reviewingHomework === unit.id ? (
                            <div className="space-y-3">
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Your Feedback</label>
                                <textarea
                                  value={feedbackText}
                                  onChange={(e) => setFeedbackText(e.target.value)}
                                  placeholder="Provide feedback on the student's homework..."
                                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
                                  rows={3}
                                />
                              </div>
                              <div>
                                <label className="text-xs text-slate-400 mb-1 block">Rating (optional)</label>
                                <select
                                  value={ratingValue}
                                  onChange={(e) => setRatingValue(e.target.value)}
                                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 text-sm"
                                >
                                  <option value="">Select rating...</option>
                                  <option value="Excellent">⭐⭐⭐⭐⭐ Excellent</option>
                                  <option value="Very Good">⭐⭐⭐⭐ Very Good</option>
                                  <option value="Good">⭐⭐⭐ Good</option>
                                  <option value="Needs Improvement">⭐⭐ Needs Improvement</option>
                                  <option value="Incomplete">⭐ Incomplete</option>
                                </select>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleReviewHomework(unit.id)}
                                  disabled={saving || !feedbackText.trim()}
                                  className="flex-1 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-600 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                                >
                                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                                  Submit Review
                                </button>
                                <button
                                  onClick={() => {
                                    setReviewingHomework(null);
                                    setFeedbackText('');
                                    setRatingValue('');
                                  }}
                                  className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <button
                              onClick={() => setReviewingHomework(unit.id)}
                              className="w-full py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-sm font-medium transition flex items-center justify-center gap-2"
                            >
                              <Edit3 className="w-4 h-4" />
                              Review Homework
                            </button>
                          )
                        ) : null}
                      </div>
                    )}

                    {/* Last Lesson Date */}
                    {unitProgress?.last_lesson_date && (
                      <p className="text-xs text-slate-500">
                        Last updated: {new Date(unitProgress.last_lesson_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
