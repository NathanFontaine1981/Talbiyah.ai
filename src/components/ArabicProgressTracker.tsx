import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, Languages, Check, BookOpen, GraduationCap, Loader, Edit3, Paperclip } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import ArabicHomeworkUpload from './ArabicHomeworkUpload';

interface SyllabusUnit {
  id: string;
  book: string;
  unit_number: number;
  unit_title_arabic: string;
  unit_title_english: string;
  unit_theme: string | null;
  key_vocabulary: string[] | null;
  grammar_topics: string[] | null;
  display_order: number;
}

interface UnitProgress {
  syllabus_id: string;
  understanding_complete: boolean;
  practice_complete: boolean;
  mastery_complete: boolean;
  teacher_notes?: string;
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
  quiz_score: number | null;
  quiz_total: number | null;
  status: 'draft' | 'submitted' | 'reviewed' | 'needs_revision';
  submitted_at: string | null;
  teacher_feedback: string | null;
  teacher_rating: string | null;
  reviewed_at: string | null;
}

interface ArabicProgressTrackerProps {
  learnerId?: string;
  editable?: boolean;
}

export default function ArabicProgressTracker({ learnerId, editable = true }: ArabicProgressTrackerProps) {
  const [syllabus, setSyllabus] = useState<SyllabusUnit[]>([]);
  const [progress, setProgress] = useState<Record<string, UnitProgress>>({});
  const [homework, setHomework] = useState<Record<string, HomeworkSubmission>>({});
  const [loading, setLoading] = useState(true);
  const [expandedUnit, setExpandedUnit] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [selectedBook, setSelectedBook] = useState<string>('1A');
  const [saving, setSaving] = useState<string | null>(null);
  const [showHomeworkUpload, setShowHomeworkUpload] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, [learnerId]);

  async function loadData() {
    setLoading(true);
    try {
      // Load syllabus
      const { data: syllabusData, error: syllabusError } = await supabase
        .from('arabic_syllabus')
        .select('*')
        .order('display_order');

      if (syllabusError) throw syllabusError;
      setSyllabus(syllabusData || []);

      // Load progress if learnerId provided
      if (learnerId) {
        const { data: progressData, error: progressError } = await supabase
          .from('arabic_learner_progress')
          .select('*')
          .eq('learner_id', learnerId);

        if (progressError) throw progressError;

        const progressMap: Record<string, UnitProgress> = {};
        progressData?.forEach((p) => {
          progressMap[p.syllabus_id] = p;
        });
        setProgress(progressMap);

        // Load homework submissions
        const { data: homeworkData, error: homeworkError } = await supabase
          .from('homework_submissions')
          .select('*')
          .eq('learner_id', learnerId)
          .eq('course_type', 'arabic');

        if (homeworkError) {
          console.error('Error loading homework:', homeworkError);
        } else {
          const homeworkMap: Record<string, HomeworkSubmission> = {};
          homeworkData?.forEach((h) => {
            if (h.syllabus_id) {
              homeworkMap[h.syllabus_id] = h;
            }
          });
          setHomework(homeworkMap);
        }
      }
    } catch (error) {
      console.error('Error loading Arabic progress:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleProgress(unitId: string, field: 'understanding_complete' | 'practice_complete' | 'mastery_complete') {
    if (!learnerId || !editable) return;

    setSaving(unitId);
    try {
      const currentProgress = progress[unitId] || {
        syllabus_id: unitId,
        understanding_complete: false,
        practice_complete: false,
        mastery_complete: false
      };

      const newValue = !currentProgress[field];

      // Update in database
      const { error } = await supabase
        .from('arabic_learner_progress')
        .upsert({
          learner_id: learnerId,
          syllabus_id: unitId,
          understanding_complete: field === 'understanding_complete' ? newValue : currentProgress.understanding_complete,
          practice_complete: field === 'practice_complete' ? newValue : currentProgress.practice_complete,
          mastery_complete: field === 'mastery_complete' ? newValue : currentProgress.mastery_complete,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'learner_id,syllabus_id'
        });

      if (error) throw error;

      // Update local state
      setProgress(prev => ({
        ...prev,
        [unitId]: {
          ...currentProgress,
          [field]: newValue
        }
      }));
    } catch (error) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress. Please try again.');
    } finally {
      setSaving(null);
    }
  }

  // Calculate stats
  const book1AUnits = syllabus.filter((u) => u.book === '1A');
  const book1BUnits = syllabus.filter((u) => u.book === '1B');

  const completedUnits = Object.values(progress).filter(
    (p) => p.understanding_complete && p.practice_complete && p.mastery_complete
  ).length;

  const totalUnits = syllabus.length;
  const percentageComplete = Math.round((completedUnits / totalUnits) * 100) || 0;

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (percentageComplete / 100) * circumference;

  const displayedUnits = showAll
    ? syllabus
    : syllabus.filter((u) => u.book === selectedBook).slice(0, 8);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-200 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse flex flex-col items-center justify-center py-12">
          <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-200 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
          <Languages className="w-5 h-5 text-orange-400" />
          <span>Arabic Progress Tracker</span>
        </h3>
        {editable && learnerId && (
          <span className="text-xs text-gray-500 flex items-center gap-1">
            <Edit3 className="w-3 h-3" />
            Click circles to update
          </span>
        )}
      </div>

      <div className="flex flex-col items-center mb-8">
        <div className="relative w-64 h-64 mb-4">
          <svg className="transform -rotate-90 w-64 h-64">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-gray-700"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-orange-400 transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-bold text-orange-400">{percentageComplete}%</p>
            <p className="text-sm text-gray-500 mt-2">Arabic Mastered</p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{completedUnits}</p>
            <p className="text-gray-500">Units Complete</p>
          </div>
          <div className="w-px h-12 bg-gray-200"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{totalUnits - completedUnits}</p>
            <p className="text-gray-500">Remaining</p>
          </div>
        </div>
      </div>

      {/* Book Selector */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => { setSelectedBook('1A'); setShowAll(false); }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            selectedBook === '1A' && !showAll
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Book 1A ({book1AUnits.length} units)
        </button>
        <button
          onClick={() => { setSelectedBook('1B'); setShowAll(false); }}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition ${
            selectedBook === '1B' && !showAll
              ? 'bg-emerald-600 text-white'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          Book 1B ({book1BUnits.length} units)
        </button>
      </div>


      {/* Unit List */}
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-medium text-gray-500 uppercase">Unit</span>
          <div className="flex items-center gap-2 pr-8">
            <span className="text-xs font-medium text-emerald-600 uppercase w-8 text-center" title="Understanding">
              U
            </span>
            <span className="text-xs font-medium text-blue-400 uppercase w-8 text-center" title="Practice">
              P
            </span>
            <span className="text-xs font-medium text-emerald-400 uppercase w-8 text-center" title="Mastery">
              M
            </span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center justify-end gap-4 mb-2 px-2 text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-500/20"></div>
            <span>Understanding</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-500/20"></div>
            <span>Practice</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded-full border-2 border-emerald-500 bg-emerald-500/20"></div>
            <span>Mastery</span>
          </div>
        </div>

        {displayedUnits.map((unit) => {
          const unitProgress = progress[unit.id];
          const isComplete = unitProgress?.understanding_complete &&
                            unitProgress?.practice_complete &&
                            unitProgress?.mastery_complete;

          return (
            <div key={unit.id} className="bg-gray-50 rounded-lg overflow-hidden">
              <div className="flex items-center justify-between p-3">
                <button
                  onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                  className="flex-1 text-left"
                >
                  <div className="flex items-center gap-3">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      isComplete
                        ? unit.book === '1A' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-500/20 text-emerald-600'
                        : 'bg-gray-100 text-gray-600'
                    }`}>
                      {unit.unit_number}
                    </span>
                    <div>
                      <span className="text-sm font-medium text-gray-700">
                        {unit.unit_title_english}
                      </span>
                      <span className="text-orange-400 text-sm ml-2 font-arabic">
                        {unit.unit_title_arabic}
                      </span>
                    </div>
                  </div>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleProgress(unit.id, 'understanding_complete')}
                    disabled={saving === unit.id || !editable || !learnerId}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      unitProgress?.understanding_complete
                        ? 'bg-emerald-500/20 border-emerald-500'
                        : 'border-gray-300 hover:border-emerald-400'
                    } ${editable && learnerId ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                    title="Understanding"
                  >
                    {saving === unit.id ? (
                      <Loader className="w-3 h-3 text-gray-500 animate-spin" />
                    ) : unitProgress?.understanding_complete ? (
                      <Check className="w-4 h-4 text-emerald-600" />
                    ) : null}
                  </button>

                  <button
                    onClick={() => toggleProgress(unit.id, 'practice_complete')}
                    disabled={saving === unit.id || !editable || !learnerId}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      unitProgress?.practice_complete
                        ? 'bg-blue-500/20 border-blue-500'
                        : 'border-gray-300 hover:border-blue-400'
                    } ${editable && learnerId ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                    title="Practice"
                  >
                    {saving === unit.id ? (
                      <Loader className="w-3 h-3 text-gray-500 animate-spin" />
                    ) : unitProgress?.practice_complete ? (
                      <Check className="w-4 h-4 text-blue-400" />
                    ) : null}
                  </button>

                  <button
                    onClick={() => toggleProgress(unit.id, 'mastery_complete')}
                    disabled={saving === unit.id || !editable || !learnerId}
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                      unitProgress?.mastery_complete
                        ? 'bg-emerald-500/20 border-emerald-500'
                        : 'border-gray-300 hover:border-emerald-400'
                    } ${editable && learnerId ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                    title="Mastery"
                  >
                    {saving === unit.id ? (
                      <Loader className="w-3 h-3 text-gray-500 animate-spin" />
                    ) : unitProgress?.mastery_complete ? (
                      <Check className="w-4 h-4 text-emerald-400" />
                    ) : null}
                  </button>

                  <button
                    onClick={() => setExpandedUnit(expandedUnit === unit.id ? null : unit.id)}
                    className="p-1 text-gray-500 hover:text-orange-400 transition ml-1"
                  >
                    {expandedUnit === unit.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedUnit === unit.id && (
                <div className="px-3 pb-3 pt-0 space-y-3">
                  {/* Theme */}
                  {unit.unit_theme && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-medium text-orange-400 mb-1">Theme</p>
                      <p className="text-sm text-gray-600">{unit.unit_theme}</p>
                    </div>
                  )}

                  {/* Vocabulary Preview */}
                  {unit.key_vocabulary && unit.key_vocabulary.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-medium text-orange-400 mb-2 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        Key Vocabulary
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {unit.key_vocabulary.slice(0, 8).map((word, i) => (
                          <span key={i} className="px-2 py-1 bg-orange-500/10 text-orange-300 rounded text-xs font-arabic">
                            {word}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Grammar Topics */}
                  {unit.grammar_topics && unit.grammar_topics.length > 0 && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <p className="text-xs font-medium text-purple-400 mb-2 flex items-center gap-1">
                        <GraduationCap className="w-3 h-3" />
                        Grammar Topics
                      </p>
                      <ul className="space-y-1">
                        {unit.grammar_topics.map((topic, i) => (
                          <li key={i} className="text-xs text-gray-600">• {topic}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Teacher Notes */}
                  {unitProgress?.teacher_notes && (
                    <div className="bg-gray-50 rounded-lg p-3 border border-emerald-500/30">
                      <p className="text-xs font-medium text-emerald-600 mb-1">Teacher's Notes</p>
                      <p className="text-sm text-gray-600">{unitProgress.teacher_notes}</p>
                    </div>
                  )}

                  {/* Homework Upload Section */}
                  {learnerId && (
                    <div className="mt-4">
                      {showHomeworkUpload === unit.id ? (
                        <div>
                          <ArabicHomeworkUpload
                            syllabusId={unit.id}
                            unitTitle={unit.unit_title_english}
                            learnerId={learnerId}
                            existingSubmission={homework[unit.id] || null}
                            onSubmitted={() => {
                              loadData();
                              setShowHomeworkUpload(null);
                            }}
                          />
                          <button
                            onClick={() => setShowHomeworkUpload(null)}
                            className="w-full mt-2 py-2 text-gray-500 hover:text-gray-600 text-sm"
                          >
                            Hide Upload Form
                          </button>
                        </div>
                      ) : homework[unit.id] ? (
                        <div className="bg-gradient-to-r from-orange-600/10 to-amber-600/10 rounded-lg p-3 border border-orange-500/30">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <Paperclip className="w-4 h-4 text-orange-400" />
                              <span className="text-sm font-medium text-white">Homework</span>
                            </div>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
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

                          {/* Show quiz score if available */}
                          {homework[unit.id].quiz_score !== null && homework[unit.id].quiz_total !== null && (
                            <p className="text-sm text-emerald-600 mb-2">
                              Quiz Score: {homework[unit.id].quiz_score}/{homework[unit.id].quiz_total}
                              ({Math.round((homework[unit.id].quiz_score! / homework[unit.id].quiz_total!) * 100)}%)
                            </p>
                          )}

                          {/* Show teacher feedback if reviewed */}
                          {homework[unit.id].status === 'reviewed' && homework[unit.id].teacher_feedback && (
                            <div className="bg-emerald-500/10 rounded p-2 mb-2">
                              <p className="text-xs text-emerald-400 font-medium">Teacher Feedback:</p>
                              <p className="text-sm text-gray-600">{homework[unit.id].teacher_feedback}</p>
                              {homework[unit.id].teacher_rating && (
                                <p className="text-xs text-amber-400 mt-1">Rating: {homework[unit.id].teacher_rating}</p>
                              )}
                            </div>
                          )}

                          <button
                            onClick={() => setShowHomeworkUpload(unit.id)}
                            className="w-full py-2 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 rounded text-sm font-medium transition"
                          >
                            {homework[unit.id].status === 'reviewed' ? 'View Submission' : 'Update Homework'}
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setShowHomeworkUpload(unit.id)}
                          className="w-full py-3 bg-gradient-to-r from-orange-600/20 to-amber-600/20 hover:from-orange-600/30 hover:to-amber-600/30 border border-orange-500/30 rounded-lg text-orange-400 font-medium transition flex items-center justify-center gap-2"
                        >
                          <Paperclip className="w-4 h-4" />
                          Upload Homework
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Show All Button */}
      {syllabus.length > 8 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 px-4 py-2 bg-gray-100/80 hover:bg-gray-200/80 text-orange-400 rounded-lg transition flex items-center justify-center space-x-2"
        >
          <span className="text-sm font-medium">
            {showAll ? 'Show Less' : `Show All ${totalUnits} Units`}
          </span>
          {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
