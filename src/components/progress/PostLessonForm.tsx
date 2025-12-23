import { useState, useEffect } from 'react';
import {
  CheckCircle,
  BookOpen,
  MessageSquare,
  Award,
  Plus,
  X,
  ChevronDown,
  ChevronUp,
  ClipboardList,
  Lightbulb,
  Target,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Common surahs for quick selection
const COMMON_SURAHS = [
  { number: 1, name: 'Al-Fatiha' },
  { number: 112, name: 'Al-Ikhlas' },
  { number: 113, name: 'Al-Falaq' },
  { number: 114, name: 'An-Nas' },
  { number: 108, name: 'Al-Kawthar' },
  { number: 107, name: 'Al-Maun' },
  { number: 106, name: 'Quraysh' },
  { number: 105, name: 'Al-Fil' },
  { number: 103, name: 'Al-Asr' },
  { number: 102, name: 'At-Takathur' },
  { number: 110, name: 'An-Nasr' },
  { number: 109, name: 'Al-Kafirun' },
];

const COMMON_TOPICS = [
  'Letter pronunciation',
  'Tajweed rules',
  'Makharij practice',
  'Fluency building',
  'New surah introduction',
  'Revision',
  'Memorization check',
  'Reading practice',
];

const HOMEWORK_TYPES = [
  { value: 'practice', label: 'Practice Recitation' },
  { value: 'memorization', label: 'Memorization' },
  { value: 'revision', label: 'Revision' },
  { value: 'reading', label: 'Reading Assignment' },
  { value: 'listening', label: 'Listening Exercise' },
];

interface Milestone {
  id: string;
  name: string;
  pillar?: string;
  stage?: {
    name: string;
  };
}

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
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Get current user ID on mount
  useEffect(() => {
    async function fetchUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    }
    fetchUser();
  }, []);

  // Form state
  const [selectedSurahs, setSelectedSurahs] = useState<number[]>([]);
  const [ayatStart, setAyatStart] = useState<number | ''>('');
  const [ayatEnd, setAyatEnd] = useState<number | ''>('');
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [customTopic, setCustomTopic] = useState('');
  const [teacherNotes, setTeacherNotes] = useState('');
  const [strengths, setStrengths] = useState('');
  const [improvements, setImprovement] = useState('');
  const [recommendedFocus, setRecommendedFocus] = useState('');
  const [verifiedMilestones, setVerifiedMilestones] = useState<string[]>([]);

  // Homework state
  const [assignHomework, setAssignHomework] = useState(false);
  const [homeworkTitle, setHomeworkTitle] = useState('');
  const [homeworkDescription, setHomeworkDescription] = useState('');
  const [homeworkType, setHomeworkType] = useState('practice');
  const [homeworkSurah, setHomeworkSurah] = useState<number | ''>('');
  const [homeworkAyatStart, setHomeworkAyatStart] = useState<number | ''>('');
  const [homeworkAyatEnd, setHomeworkAyatEnd] = useState<number | ''>('');
  const [homeworkDueDate, setHomeworkDueDate] = useState('');

  // Fetch available milestones
  useEffect(() => {
    async function fetchMilestones() {
      // Get milestones that this student is working on or hasn't started
      const { data } = await supabase
        .from('curriculum_milestones')
        .select(`
          id, name, pillar,
          stage:curriculum_stages(name)
        `)
        .order('sort_order')
        .limit(20);

      setMilestones(data || []);
    }

    fetchMilestones();
  }, [lesson.learner_id]);

  const toggleSurah = (surahNumber: number) => {
    setSelectedSurahs((prev) =>
      prev.includes(surahNumber)
        ? prev.filter((n) => n !== surahNumber)
        : [...prev, surahNumber]
    );
  };

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const addCustomTopic = () => {
    if (customTopic.trim() && !selectedTopics.includes(customTopic.trim())) {
      setSelectedTopics((prev) => [...prev, customTopic.trim()]);
      setCustomTopic('');
    }
  };

  const toggleMilestone = (milestoneId: string) => {
    setVerifiedMilestones((prev) =>
      prev.includes(milestoneId)
        ? prev.filter((id) => id !== milestoneId)
        : [...prev, milestoneId]
    );
  };

  const handleSubmit = async () => {
    setLoading(true);

    try {
      // 1. Create lesson details
      await supabase.from('lesson_details').upsert({
        lesson_id: lesson.id,
        topics_covered: selectedTopics,
        surahs_practiced: selectedSurahs,
        ayat_range_start: ayatStart || null,
        ayat_range_end: ayatEnd || null,
        teacher_notes: teacherNotes || null,
        strengths_observed: strengths || null,
        areas_for_improvement: improvements || null,
        recommended_focus: recommendedFocus || null,
        milestones_verified: verifiedMilestones,
        homework_assigned: assignHomework,
      });

      // 2. Verify milestones
      for (const milestoneId of verifiedMilestones) {
        // Check if progress exists
        const { data: existing } = await supabase
          .from('student_milestone_progress')
          .select('id')
          .eq('student_id', lesson.learner_id)
          .eq('milestone_id', milestoneId)
          .single();

        if (existing) {
          await supabase
            .from('student_milestone_progress')
            .update({
              status: 'verified',
              verified_at: new Date().toISOString(),
              verified_by: userId,
            })
            .eq('id', existing.id);
        } else {
          await supabase.from('student_milestone_progress').insert({
            student_id: lesson.learner_id,
            milestone_id: milestoneId,
            status: 'verified',
            progress_percentage: 100,
            started_at: new Date().toISOString(),
            completed_at: new Date().toISOString(),
            verified_at: new Date().toISOString(),
            verified_by: userId,
          });
        }
      }

      // 3. Update surah progress if surahs were practiced
      for (const surahNumber of selectedSurahs) {
        const surahData = COMMON_SURAHS.find((s) => s.number === surahNumber);

        // Upsert surah progress
        await supabase.from('student_surah_progress').upsert({
          student_id: lesson.learner_id,
          surah_number: surahNumber,
          surah_name: surahData?.name || `Surah ${surahNumber}`,
          total_ayat: 10, // This should come from actual surah data
          status: 'in_progress',
          started_at: new Date().toISOString(),
        }, {
          onConflict: 'student_id,surah_number',
        });
      }

      // 4. Create homework if assigned
      if (assignHomework && homeworkTitle) {
        await supabase.from('student_homework').insert({
          student_id: lesson.learner_id,
          lesson_id: lesson.id,
          assigned_by: userId,
          title: homeworkTitle,
          description: homeworkDescription || null,
          homework_type: homeworkType,
          surah_number: homeworkSurah || null,
          ayat_start: homeworkAyatStart || null,
          ayat_end: homeworkAyatEnd || null,
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

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            {/* Surahs practiced */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <BookOpen className="w-4 h-4 inline mr-1" />
                Surahs Practiced
              </label>
              <div className="flex flex-wrap gap-2">
                {COMMON_SURAHS.map((surah) => (
                  <button
                    key={surah.number}
                    onClick={() => toggleSurah(surah.number)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedSurahs.includes(surah.number)
                        ? 'bg-purple-100 border-purple-300 text-purple-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {surah.name}
                  </button>
                ))}
              </div>

              {selectedSurahs.length > 0 && (
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-sm text-gray-600">Ayat range:</span>
                  <input
                    type="number"
                    value={ayatStart}
                    onChange={(e) => setAyatStart(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="From"
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min={1}
                  />
                  <span className="text-gray-400">to</span>
                  <input
                    type="number"
                    value={ayatEnd}
                    onChange={(e) => setAyatEnd(e.target.value ? parseInt(e.target.value) : '')}
                    placeholder="To"
                    className="w-20 px-2 py-1 border border-gray-300 rounded text-sm"
                    min={1}
                  />
                </div>
              )}
            </div>

            {/* Topics covered */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <ClipboardList className="w-4 h-4 inline mr-1" />
                Topics Covered
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {COMMON_TOPICS.map((topic) => (
                  <button
                    key={topic}
                    onClick={() => toggleTopic(topic)}
                    className={`px-3 py-1.5 text-sm rounded-lg border transition-colors ${
                      selectedTopics.includes(topic)
                        ? 'bg-blue-100 border-blue-300 text-blue-700'
                        : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {topic}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Add custom topic..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
                  onKeyDown={(e) => e.key === 'Enter' && addCustomTopic()}
                />
                <button
                  onClick={addCustomTopic}
                  className="p-2 text-gray-600 hover:text-gray-900"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            {/* Teacher notes */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <MessageSquare className="w-4 h-4 inline mr-1" />
                Lesson Notes
              </label>
              <textarea
                value={teacherNotes}
                onChange={(e) => setTeacherNotes(e.target.value)}
                placeholder="General notes about the lesson..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={3}
              />
            </div>

            {/* Strengths */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Lightbulb className="w-4 h-4 inline mr-1 text-emerald-600" />
                Strengths Observed
              </label>
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                placeholder="What did the student do well?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={2}
              />
            </div>

            {/* Areas for improvement */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Target className="w-4 h-4 inline mr-1 text-amber-600" />
                Areas for Improvement
              </label>
              <textarea
                value={improvements}
                onChange={(e) => setImprovement(e.target.value)}
                placeholder="What should the student focus on?"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                rows={2}
              />
            </div>

            {/* Recommended focus */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Recommended Focus for Next Lesson
              </label>
              <input
                type="text"
                value={recommendedFocus}
                onChange={(e) => setRecommendedFocus(e.target.value)}
                placeholder="e.g., Continue with Surah Al-Ikhlas memorization"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            {/* Milestone verification */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                <Award className="w-4 h-4 inline mr-1" />
                Verify Milestones
              </label>
              <p className="text-xs text-gray-500 mb-3">
                Select milestones the student has demonstrated mastery of
              </p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {milestones.map((milestone) => (
                  <button
                    key={milestone.id}
                    onClick={() => toggleMilestone(milestone.id)}
                    className={`w-full flex items-center gap-3 p-3 rounded-lg border text-left transition-colors ${
                      verifiedMilestones.includes(milestone.id)
                        ? 'bg-emerald-50 border-emerald-300'
                        : 'bg-white border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <CheckCircle
                      className={`w-5 h-5 ${
                        verifiedMilestones.includes(milestone.id)
                          ? 'text-emerald-600'
                          : 'text-gray-300'
                      }`}
                    />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{milestone.name}</p>
                      {milestone.stage && (
                        <p className="text-xs text-gray-500">{milestone.stage.name}</p>
                      )}
                    </div>
                    {milestone.pillar && (
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        milestone.pillar === 'fahm'
                          ? 'bg-blue-100 text-blue-700'
                          : milestone.pillar === 'itqan'
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {milestone.pillar === 'fahm' ? 'Understanding' :
                         milestone.pillar === 'itqan' ? 'Fluency' : 'Memorization'}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Homework assignment */}
            <div className="border-t border-gray-200 pt-6">
              <button
                onClick={() => setAssignHomework(!assignHomework)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700"
              >
                {assignHomework ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
                Assign Homework
              </button>

              {assignHomework && (
                <div className="mt-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Title
                    </label>
                    <input
                      type="text"
                      value={homeworkTitle}
                      onChange={(e) => setHomeworkTitle(e.target.value)}
                      placeholder="e.g., Practice Surah Al-Ikhlas"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Type
                      </label>
                      <select
                        value={homeworkType}
                        onChange={(e) => setHomeworkType(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description (Optional)
                    </label>
                    <textarea
                      value={homeworkDescription}
                      onChange={(e) => setHomeworkDescription(e.target.value)}
                      placeholder="Detailed instructions..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm resize-none"
                      rows={2}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Surah (Optional)
                    </label>
                    <select
                      value={homeworkSurah}
                      onChange={(e) => setHomeworkSurah(e.target.value ? parseInt(e.target.value) : '')}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                    >
                      <option value="">Select surah...</option>
                      {COMMON_SURAHS.map((surah) => (
                        <option key={surah.number} value={surah.number}>
                          {surah.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Post-Lesson Notes</h2>
            <p className="text-sm text-gray-500">
              {lesson.student_name ? `Session with ${lesson.student_name}` : 'Complete your lesson notes'}
            </p>
          </div>
          {onCancel && (
            <button onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Progress steps */}
        <div className="flex items-center gap-2 mt-4">
          {[1, 2, 3].map((s) => (
            <button
              key={s}
              onClick={() => setStep(s)}
              className={`flex-1 h-2 rounded-full transition-colors ${
                s <= step ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>
        <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
          <span className={step >= 1 ? 'text-emerald-600 font-medium' : ''}>Content</span>
          <span className={step >= 2 ? 'text-emerald-600 font-medium' : ''}>Feedback</span>
          <span className={step >= 3 ? 'text-emerald-600 font-medium' : ''}>Progress</span>
        </div>
      </div>

      {/* Form content */}
      <div className="p-4">{renderStep()}</div>

      {/* Navigation */}
      <div className="p-4 border-t border-gray-100 flex items-center justify-between">
        <button
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
          className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 disabled:opacity-50"
        >
          Back
        </button>

        {step < 3 ? (
          <button
            onClick={() => setStep(step + 1)}
            className="px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700"
          >
            Continue
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 disabled:opacity-50"
          >
            {loading ? (
              'Saving...'
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                Complete
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}
