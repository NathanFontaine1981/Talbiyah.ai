import { useState, useEffect } from 'react';
import {
  CheckCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  X,
  Sparkles,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const HOMEWORK_TYPES = [
  { value: 'practice', label: 'Practice Recitation' },
  { value: 'memorization', label: 'Memorization' },
  { value: 'revision', label: 'Revision' },
  { value: 'reading', label: 'Reading Assignment' },
  { value: 'listening', label: 'Listening Exercise' },
];

interface LessonData {
  id: string;
  learner_id: string;
  student_name?: string;
}

interface PostLessonFormProps {
  lesson: LessonData;
  onComplete?: () => void;
  onCancel?: () => void;
}

export default function PostLessonForm({ lesson, onComplete, onCancel }: PostLessonFormProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Simple form state
  const [teacherNotes, setTeacherNotes] = useState('');

  // Homework state
  const [assignHomework, setAssignHomework] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkDescription, setHomeworkDescription] = useState('');
  const [homeworkType, setHomeworkType] = useState('practice');
  const [homeworkDueDate, setHomeworkDueDate] = useState('');

  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    }
    fetchUser();
  }, []);

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // Save lesson details (simple version)
      if (teacherNotes.trim()) {
        await supabase.from('lesson_details').upsert({
          lesson_id: lesson.id,
          teacher_notes: teacherNotes,
          homework_assigned: assignHomework,
        });
      }

      // Create homework if assigned
      if (assignHomework && homeworkTitle.trim()) {
        await supabase.from('student_homework').insert({
          student_id: lesson.learner_id,
          lesson_id: lesson.id,
          assigned_by: userId,
          title: homeworkTitle,
          description: homeworkDescription || null,
          homework_type: homeworkType,
          due_date: homeworkDueDate || null,
          status: 'assigned',
        });
      }

      onComplete?.();
    } catch (error) {
      console.error('Error saving lesson details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    onComplete?.();
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden max-w-md mx-auto">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Quick Notes</h2>
            <p className="text-sm text-gray-500">
              {lesson.student_name ? `Session with ${lesson.student_name}` : 'Optional notes'}
            </p>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* AI Insights Notice */}
      <div className="mx-4 mt-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg">
        <div className="flex items-center gap-2 text-emerald-700">
          <Sparkles className="w-4 h-4" />
          <span className="text-sm font-medium">AI Insights generated automatically</span>
        </div>
        <p className="text-xs text-emerald-600 mt-1">
          Detailed lesson notes are created from the recording. Add anything extra below.
        </p>
      </div>

      {/* Form content */}
      <div className="p-4 space-y-4">
        {/* Teacher notes - optional */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <MessageSquare className="w-4 h-4 inline mr-1" />
            Additional Notes <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            value={teacherNotes}
            onChange={(e) => setTeacherNotes(e.target.value)}
            placeholder="Any extra notes not captured by AI insights..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
            rows={3}
          />
        </div>

        {/* Homework assignment toggle */}
        <div className="border-t border-gray-200 pt-4">
          <button
            onClick={() => setAssignHomework(!assignHomework)}
            className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
          >
            {assignHomework ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
            Assign Homework
          </button>

          {assignHomework && (
            <div className="mt-4 space-y-3 p-4 bg-gray-50 rounded-lg">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={homeworkTitle}
                  onChange={(e) => setHomeworkTitle(e.target.value)}
                  placeholder="e.g., Practice Surah Al-Ikhlas"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    value={homeworkType}
                    onChange={(e) => setHomeworkType(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    {HOMEWORK_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    type="date"
                    value={homeworkDueDate}
                    onChange={(e) => setHomeworkDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description <span className="text-gray-400 font-normal">(optional)</span>
                </label>
                <textarea
                  value={homeworkDescription}
                  onChange={(e) => setHomeworkDescription(e.target.value)}
                  placeholder="Detailed instructions..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  rows={2}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={handleSkip}
          className="px-4 py-2 text-sm font-medium text-gray-500 hover:text-gray-700"
        >
          Skip
        </button>

        <button
          onClick={handleSubmit}
          disabled={loading || (assignHomework && !homeworkTitle.trim())}
          className="flex items-center gap-2 px-5 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            'Saving...'
          ) : (
            <>
              <CheckCircle className="w-4 h-4" />
              Done
            </>
          )}
        </button>
      </div>
    </div>
  );
}
