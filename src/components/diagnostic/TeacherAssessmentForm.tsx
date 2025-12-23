import { useState } from 'react';
import {
  BookOpen,
  Check,
  ChevronRight,
  Loader2,
  AlertCircle,
  Star,
  MessageSquare,
  Target,
  Lightbulb
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface TeacherAssessmentFormProps {
  assessmentId: string;
  lessonId: string;
  studentName: string;
  aiAssessment?: any;
  preAssessmentResponses?: any;
  onComplete?: () => void;
  onClose?: () => void;
}

interface TeacherAssessment {
  // Observed Level
  observed_level: string;
  level_notes: string;

  // Talbiyah Methodology Assessment
  understanding_level: number; // 1-5
  understanding_notes: string;
  fluency_level: number; // 1-5
  fluency_notes: string;
  memorization_level: number; // 1-5
  memorization_notes: string;

  // Recommended Phase
  confirmed_phase: string;
  phase_reasoning: string;

  // Strengths & Areas for Improvement
  observed_strengths: string[];
  areas_for_improvement: string[];

  // Teaching Approach
  recommended_approach: string;
  specific_starting_point: string;
  lesson_frequency_recommendation: string;

  // Overall Assessment
  student_readiness: string;
  parent_engagement_notes: string;
  red_flags: string[];

  // Personalized Message for Report
  personalized_feedback: string;

  // Teacher's Recommendation
  recommends_enrollment: boolean;
  enrollment_notes: string;
}

const initialAssessment: TeacherAssessment = {
  observed_level: '',
  level_notes: '',
  understanding_level: 0,
  understanding_notes: '',
  fluency_level: 0,
  fluency_notes: '',
  memorization_level: 0,
  memorization_notes: '',
  confirmed_phase: '',
  phase_reasoning: '',
  observed_strengths: [],
  areas_for_improvement: [],
  recommended_approach: '',
  specific_starting_point: '',
  lesson_frequency_recommendation: '',
  student_readiness: '',
  parent_engagement_notes: '',
  red_flags: [],
  personalized_feedback: '',
  recommends_enrollment: true,
  enrollment_notes: ''
};

export default function TeacherAssessmentForm({
  assessmentId,
  lessonId,
  studentName,
  aiAssessment,
  preAssessmentResponses,
  onComplete,
  onClose
}: TeacherAssessmentFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [assessment, setAssessment] = useState<TeacherAssessment>(initialAssessment);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const totalSteps = 5;

  const updateAssessment = <K extends keyof TeacherAssessment>(
    key: K,
    value: TeacherAssessment[K]
  ) => {
    setAssessment(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayItem = (key: 'observed_strengths' | 'areas_for_improvement' | 'red_flags', value: string) => {
    setAssessment(prev => {
      const currentArray = prev[key];
      if (currentArray.includes(value)) {
        return { ...prev, [key]: currentArray.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...currentArray, value] };
      }
    });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 1:
        return !!assessment.observed_level && !!assessment.level_notes;
      case 2:
        return assessment.understanding_level > 0 && assessment.fluency_level > 0;
      case 3:
        return !!assessment.confirmed_phase && !!assessment.phase_reasoning;
      case 4:
        return assessment.observed_strengths.length > 0 && assessment.areas_for_improvement.length > 0;
      case 5:
        return !!assessment.personalized_feedback && !!assessment.specific_starting_point;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      // Update the diagnostic assessment with teacher's evaluation
      const { error: updateError } = await supabase
        .from('diagnostic_assessments')
        .update({
          teacher_assessment: assessment,
          recommended_phase: assessment.confirmed_phase,
          status: 'report_complete',
          lesson_completed_at: new Date().toISOString(),
          report_generated_at: new Date().toISOString()
        })
        .eq('id', assessmentId);

      if (updateError) throw updateError;

      // Update the lesson status to completed
      await supabase
        .from('lessons')
        .update({ status: 'completed' })
        .eq('id', lessonId);

      // Update teacher payment status to approved
      await supabase
        .from('diagnostic_teacher_payments')
        .update({ status: 'approved' })
        .eq('diagnostic_assessment_id', assessmentId);

      // Update user profile
      const { data: diagnosticData } = await supabase
        .from('diagnostic_assessments')
        .select('student_id')
        .eq('id', assessmentId)
        .single();

      if (diagnosticData) {
        await supabase
          .from('profiles')
          .update({
            has_completed_diagnostic: true,
            diagnostic_completed_at: new Date().toISOString()
          })
          .eq('id', diagnosticData.student_id);
      }

      if (onComplete) {
        onComplete();
      }

    } catch (err: any) {
      console.error('Error submitting assessment:', err);
      setError(err.message || 'Failed to submit assessment');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <Step1ObservedLevel
            assessment={assessment}
            updateAssessment={updateAssessment}
            aiAssessment={aiAssessment}
          />
        );
      case 2:
        return (
          <Step2MethodologyEvaluation
            assessment={assessment}
            updateAssessment={updateAssessment}
          />
        );
      case 3:
        return (
          <Step3RecommendedPhase
            assessment={assessment}
            updateAssessment={updateAssessment}
            aiAssessment={aiAssessment}
          />
        );
      case 4:
        return (
          <Step4StrengthsAndImprovement
            assessment={assessment}
            toggleArrayItem={toggleArrayItem}
            aiAssessment={aiAssessment}
          />
        );
      case 5:
        return (
          <Step5FinalRecommendations
            assessment={assessment}
            updateAssessment={updateAssessment}
            studentName={studentName}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg max-w-3xl mx-auto">
      {/* Header */}
      <div className="border-b border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Assessment Form</h2>
        <p className="text-gray-600">Complete your evaluation of {studentName}'s diagnostic session</p>
      </div>

      {/* Progress Bar */}
      <div className="px-6 pt-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">Step {currentStep} of {totalSteps}</span>
          <span className="text-sm text-gray-500">{Math.round((currentStep / totalSteps) * 100)}% Complete</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 transition-all duration-300"
            style={{ width: `${(currentStep / totalSteps) * 100}%` }}
          />
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mx-6 mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Step Content */}
      <div className="p-6">
        {renderStep()}
      </div>

      {/* Navigation */}
      <div className="border-t border-gray-200 p-6 flex items-center justify-between">
        <button
          onClick={() => setCurrentStep(prev => Math.max(1, prev - 1))}
          disabled={currentStep === 1}
          className={`px-6 py-3 rounded-full font-medium transition ${
            currentStep === 1
              ? 'text-gray-400 cursor-not-allowed'
              : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
          }`}
        >
          Back
        </button>

        {currentStep === totalSteps ? (
          <button
            onClick={handleSubmit}
            disabled={loading || !canProceed()}
            className={`flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition ${
              loading || !canProceed() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                Submit Assessment
                <Check className="w-5 h-5" />
              </>
            )}
          </button>
        ) : (
          <button
            onClick={() => setCurrentStep(prev => Math.min(totalSteps, prev + 1))}
            disabled={!canProceed()}
            className={`flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition ${
              !canProceed() ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            Next
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Close Button */}
      {onClose && (
        <div className="border-t border-gray-200 p-4 text-center">
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-sm transition"
          >
            Save and continue later
          </button>
        </div>
      )}
    </div>
  );
}

// Step 1: Observed Level
function Step1ObservedLevel({
  assessment,
  updateAssessment,
  aiAssessment
}: {
  assessment: TeacherAssessment;
  updateAssessment: <K extends keyof TeacherAssessment>(key: K, value: TeacherAssessment[K]) => void;
  aiAssessment?: any;
}) {
  const levels = [
    { id: 'absolute_beginner', label: 'Absolute Beginner', description: 'No prior knowledge' },
    { id: 'beginner', label: 'Beginner', description: 'Very basic knowledge, needs foundational work' },
    { id: 'lower_intermediate', label: 'Lower Intermediate', description: 'Some basics, can build on existing skills' },
    { id: 'upper_intermediate', label: 'Upper Intermediate', description: 'Solid foundation, ready for advancement' },
    { id: 'advanced', label: 'Advanced', description: 'Strong skills, needs refinement' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <Target className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Observed Level Assessment</h3>
      </div>

      {/* AI Assessment Reference */}
      {aiAssessment && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-emerald-800 mb-1">AI Preliminary Assessment:</p>
          <p className="text-emerald-700">{aiAssessment.estimated_level}</p>
          <p className="text-sm text-emerald-600 mt-1">{aiAssessment.level_reasoning}</p>
        </div>
      )}

      {/* Observed Level Selection */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Based on your observation, what is the student's actual level? <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-3">
          {levels.map(level => (
            <button
              key={level.id}
              onClick={() => updateAssessment('observed_level', level.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition ${
                assessment.observed_level === level.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <p className="font-semibold text-gray-900">{level.label}</p>
              <p className="text-sm text-gray-500">{level.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Level Notes */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Level Assessment Notes <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500 mb-3">
          What did you observe that led to this assessment? Include specific examples.
        </p>
        <textarea
          value={assessment.level_notes}
          onChange={(e) => updateAssessment('level_notes', e.target.value)}
          placeholder="E.g., Student could recognise about half the Arabic letters but struggled with pronunciation. When reading, they had difficulty distinguishing between similar letters..."
          rows={4}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
      </div>
    </div>
  );
}

// Step 2: Methodology Evaluation
function Step2MethodologyEvaluation({
  assessment,
  updateAssessment
}: {
  assessment: TeacherAssessment;
  updateAssessment: <K extends keyof TeacherAssessment>(key: K, value: TeacherAssessment[K]) => void;
}) {
  const renderStarRating = (
    value: number,
    onChange: (rating: number) => void,
    label: string
  ) => (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600 w-24">{label}</span>
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            onClick={() => onChange(star)}
            className="focus:outline-none"
          >
            <Star
              className={`w-8 h-8 transition ${
                star <= value
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-gray-300'
              }`}
            />
          </button>
        ))}
      </div>
      <span className="text-sm text-gray-500 ml-2">
        {value > 0 ? `${value}/5` : 'Not rated'}
      </span>
    </div>
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-emerald-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Talbiyah Methodology Evaluation</h3>
      </div>

      <p className="text-gray-600">
        Rate the student's current ability in each of the three pillars of our methodology.
      </p>

      {/* Understanding (Fahm) */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-2">1. Understanding (Fahm)</h4>
        <p className="text-sm text-gray-500 mb-4">
          Does the student understand the meaning of what they read/recite?
        </p>
        {renderStarRating(
          assessment.understanding_level,
          (rating) => updateAssessment('understanding_level', rating),
          'Current Level'
        )}
        <textarea
          value={assessment.understanding_notes}
          onChange={(e) => updateAssessment('understanding_notes', e.target.value)}
          placeholder="Notes on understanding level..."
          rows={2}
          className="w-full mt-3 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Fluency (Itqan) */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-2">2. Fluency (Itqan)</h4>
        <p className="text-sm text-gray-500 mb-4">
          Can the student read/recite correctly with proper pronunciation and Tajweed?
        </p>
        {renderStarRating(
          assessment.fluency_level,
          (rating) => updateAssessment('fluency_level', rating),
          'Current Level'
        )}
        <textarea
          value={assessment.fluency_notes}
          onChange={(e) => updateAssessment('fluency_notes', e.target.value)}
          placeholder="Notes on fluency level..."
          rows={2}
          className="w-full mt-3 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Memorization (Hifz) */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h4 className="font-bold text-gray-900 mb-2">3. Memorization (Hifz)</h4>
        <p className="text-sm text-gray-500 mb-4">
          What is the student's current memorization and retention ability?
        </p>
        {renderStarRating(
          assessment.memorization_level,
          (rating) => updateAssessment('memorization_level', rating),
          'Current Level'
        )}
        <textarea
          value={assessment.memorization_notes}
          onChange={(e) => updateAssessment('memorization_notes', e.target.value)}
          placeholder="Notes on memorization level..."
          rows={2}
          className="w-full mt-3 px-4 py-3 bg-white border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
      </div>
    </div>
  );
}

// Step 3: Recommended Phase
function Step3RecommendedPhase({
  assessment,
  updateAssessment,
  aiAssessment
}: {
  assessment: TeacherAssessment;
  updateAssessment: <K extends keyof TeacherAssessment>(key: K, value: TeacherAssessment[K]) => void;
  aiAssessment?: any;
}) {
  const phases = [
    {
      id: 'foundations',
      label: 'Foundations',
      description: 'Arabic alphabet, basic reading skills, letter recognition',
      color: 'bg-blue-100 text-blue-800'
    },
    {
      id: 'understanding',
      label: 'Understanding (Fahm)',
      description: 'Focus on meaning, vocabulary, and connection with the text',
      color: 'bg-emerald-100 text-emerald-800'
    },
    {
      id: 'fluency',
      label: 'Fluency (Itqan)',
      description: 'Tajweed rules, pronunciation perfection, smooth recitation',
      color: 'bg-purple-100 text-purple-800'
    },
    {
      id: 'memorization',
      label: 'Memorization (Hifz)',
      description: 'Built on understanding and fluency, meaningful memorization',
      color: 'bg-amber-100 text-amber-800'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <Lightbulb className="w-5 h-5 text-purple-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Recommended Starting Phase</h3>
      </div>

      {/* AI Recommendation */}
      {aiAssessment && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-emerald-800 mb-1">AI Recommended Phase:</p>
          <p className="text-emerald-700 capitalize">{aiAssessment.recommended_phase}</p>
          <p className="text-sm text-emerald-600 mt-1">{aiAssessment.phase_reasoning}</p>
        </div>
      )}

      {/* Phase Selection */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Which phase should this student start in? <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-3">
          {phases.map(phase => (
            <button
              key={phase.id}
              onClick={() => updateAssessment('confirmed_phase', phase.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition ${
                assessment.confirmed_phase === phase.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className="flex items-center gap-3 mb-2">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${phase.color}`}>
                  {phase.label}
                </span>
              </div>
              <p className="text-sm text-gray-600">{phase.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Phase Reasoning */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Why this phase? <span className="text-red-500">*</span>
        </label>
        <textarea
          value={assessment.phase_reasoning}
          onChange={(e) => updateAssessment('phase_reasoning', e.target.value)}
          placeholder="Explain why this is the right starting point based on your observation..."
          rows={4}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
      </div>
    </div>
  );
}

// Step 4: Strengths and Improvement Areas
function Step4StrengthsAndImprovement({
  assessment,
  toggleArrayItem,
  aiAssessment
}: {
  assessment: TeacherAssessment;
  toggleArrayItem: (key: 'observed_strengths' | 'areas_for_improvement' | 'red_flags', value: string) => void;
  aiAssessment?: any;
}) {
  const strengthOptions = [
    'Good pronunciation',
    'Quick learner',
    'Strong memory',
    'Attentive and focused',
    'Eager to learn',
    'Good attitude',
    'Asks good questions',
    'Self-motivated',
    'Respectful',
    'Good Arabic foundation',
    'Understands meanings',
    'Follows instructions well'
  ];

  const improvementOptions = [
    'Pronunciation needs work',
    'Letter recognition',
    'Tajweed rules',
    'Focus and attention',
    'Confidence',
    'Reading speed',
    'Memorization retention',
    'Understanding meanings',
    'Consistency in practice',
    'Motivation',
    'Basic Arabic skills',
    'Following instructions'
  ];

  const redFlagOptions = [
    'Learning difficulty suspected',
    'Attention issues',
    'Unrealistic expectations',
    'Parent pressure concerns',
    'Previous negative experience',
    'Methodology misalignment',
    'None'
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
          <Star className="w-5 h-5 text-amber-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Strengths & Areas for Improvement</h3>
      </div>

      {/* Observed Strengths */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Observed Strengths <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
        <div className="flex flex-wrap gap-2">
          {strengthOptions.map(strength => (
            <button
              key={strength}
              onClick={() => toggleArrayItem('observed_strengths', strength)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                assessment.observed_strengths.includes(strength)
                  ? 'bg-emerald-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-emerald-50 hover:text-emerald-600'
              }`}
            >
              {strength}
            </button>
          ))}
        </div>
      </div>

      {/* Areas for Improvement */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Areas for Improvement <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
        <div className="flex flex-wrap gap-2">
          {improvementOptions.map(area => (
            <button
              key={area}
              onClick={() => toggleArrayItem('areas_for_improvement', area)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                assessment.areas_for_improvement.includes(area)
                  ? 'bg-orange-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-orange-50 hover:text-orange-600'
              }`}
            >
              {area}
            </button>
          ))}
        </div>
      </div>

      {/* Red Flags */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Any Concerns or Red Flags?
        </label>
        <p className="text-sm text-gray-500 mb-3">Select if applicable</p>
        <div className="flex flex-wrap gap-2">
          {redFlagOptions.map(flag => (
            <button
              key={flag}
              onClick={() => toggleArrayItem('red_flags', flag)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                assessment.red_flags.includes(flag)
                  ? flag === 'None' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {flag}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 5: Final Recommendations
function Step5FinalRecommendations({
  assessment,
  updateAssessment,
  studentName
}: {
  assessment: TeacherAssessment;
  updateAssessment: <K extends keyof TeacherAssessment>(key: K, value: TeacherAssessment[K]) => void;
  studentName: string;
}) {
  const frequencyOptions = [
    { id: '1_per_week', label: '1 lesson per week', description: 'Good for maintaining progress' },
    { id: '2_per_week', label: '2 lessons per week', description: 'Recommended for steady growth' },
    { id: '3_plus_per_week', label: '3+ lessons per week', description: 'For intensive progress' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <MessageSquare className="w-5 h-5 text-blue-600" />
        </div>
        <h3 className="text-xl font-bold text-gray-900">Final Recommendations</h3>
      </div>

      {/* Specific Starting Point */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Specific Starting Point <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Where exactly should this student begin? Be specific.
        </p>
        <textarea
          value={assessment.specific_starting_point}
          onChange={(e) => updateAssessment('specific_starting_point', e.target.value)}
          placeholder="E.g., Start with Arabic alphabet recognition, focusing on distinguishing similar letters (ب ت ث). Once comfortable, begin with Al-Fatiha word-by-word meaning study..."
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Recommended Lesson Frequency */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Recommended Lesson Frequency
        </label>
        <div className="grid gap-3">
          {frequencyOptions.map(option => (
            <button
              key={option.id}
              onClick={() => updateAssessment('lesson_frequency_recommendation', option.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition ${
                assessment.lesson_frequency_recommendation === option.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <p className="font-semibold text-gray-900">{option.label}</p>
              <p className="text-sm text-gray-500">{option.description}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Personalized Feedback */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Personalized Message for {studentName} <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500 mb-3">
          Write a warm, encouraging message that will be included in the parent's report.
        </p>
        <textarea
          value={assessment.personalized_feedback}
          onChange={(e) => updateAssessment('personalized_feedback', e.target.value)}
          placeholder="E.g., It was a pleasure meeting Amira today! She showed great enthusiasm and has a wonderful foundation to build upon. I'm excited about her potential and confident that with our structured approach, she'll make excellent progress..."
          rows={4}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Enrollment Recommendation */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Do you recommend this student for enrollment?
        </label>
        <div className="flex gap-4">
          <button
            onClick={() => updateAssessment('recommends_enrollment', true)}
            className={`flex-1 p-4 rounded-xl border-2 text-center transition ${
              assessment.recommends_enrollment
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <Check className="w-6 h-6 mx-auto mb-2 text-emerald-500" />
            <p className="font-semibold text-gray-900">Yes, recommend</p>
          </button>
          <button
            onClick={() => updateAssessment('recommends_enrollment', false)}
            className={`flex-1 p-4 rounded-xl border-2 text-center transition ${
              !assessment.recommends_enrollment
                ? 'border-red-500 bg-red-50'
                : 'border-gray-200 hover:border-red-300'
            }`}
          >
            <AlertCircle className="w-6 h-6 mx-auto mb-2 text-red-500" />
            <p className="font-semibold text-gray-900">Not at this time</p>
          </button>
        </div>
        {!assessment.recommends_enrollment && (
          <textarea
            value={assessment.enrollment_notes}
            onChange={(e) => updateAssessment('enrollment_notes', e.target.value)}
            placeholder="Please explain why..."
            rows={2}
            className="w-full mt-3 px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
        )}
      </div>
    </div>
  );
}
