import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BookOpen,
  Target,
  GraduationCap,
  Sparkles,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Check,
  User,
  Calendar,
  Loader2,
  X,
  Info
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface DiagnosticQuestionnaireProps {
  onComplete?: (assessmentId: string) => void;
  onClose?: () => void;
}

interface QuestionnaireResponses {
  // Step 0: Who is filling this out
  user_type: 'student' | 'parent' | '';

  // Step 1: Learning Goals
  selected_subjects: string[]; // Multiple subjects allowed
  primary_subject: string; // Keep for backward compatibility
  specific_goals: string;
  timeline_expectation: string;

  // Step 2: Current Level
  current_level: string;
  previous_experience: string;
  can_read_arabic: string;
  current_memorization: string;

  // Step 3: Talbiyah Approach
  learning_priority: string;
  reconsidered_approach?: string;

  // Step 4: Challenges
  main_challenges: string[];
  challenge_details: string;

  // Step 5: Learning Preferences
  learning_styles: string[]; // Multiple styles allowed
  learning_style: string; // Keep for backward compatibility
  lesson_frequency: string;
  preferred_schedule: string[];

  // Step 6: Student Information
  student_name: string;
  student_surname: string;
  student_age: number | null;
  student_gender: string;
  parent_involved: string;
  additional_notes: string;

  // Multi-child support
  num_children: number;
}

const initialResponses: QuestionnaireResponses = {
  user_type: '',
  selected_subjects: [],
  primary_subject: '',
  specific_goals: '',
  timeline_expectation: '',
  current_level: '',
  previous_experience: '',
  can_read_arabic: '',
  current_memorization: '',
  learning_priority: '',
  reconsidered_approach: undefined,
  main_challenges: [],
  challenge_details: '',
  learning_styles: [],
  learning_style: '',
  lesson_frequency: '',
  preferred_schedule: [],
  student_name: '',
  student_surname: '',
  student_age: null,
  student_gender: '',
  parent_involved: '',
  additional_notes: '',
  num_children: 1
};

export default function DiagnosticQuestionnaire({ onComplete, onClose }: DiagnosticQuestionnaireProps) {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0); // Start at step 0 (user type selection)
  const [responses, setResponses] = useState<QuestionnaireResponses>(initialResponses);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showMisalignedWarning, setShowMisalignedWarning] = useState(false);

  const isQuranSubject = responses.selected_subjects.some(s =>
    s.toLowerCase().includes('quran') || s.toLowerCase().includes('tajweed')
  ) || responses.primary_subject.toLowerCase().includes('quran') ||
    responses.primary_subject.toLowerCase().includes('tajweed');

  const isArabicSubject = responses.selected_subjects.some(s =>
    s.toLowerCase().includes('arabic')
  ) || responses.primary_subject.toLowerCase().includes('arabic');

  const isParent = responses.user_type === 'parent';

  // Total steps: 8 for Quran subjects, 7 for others (includes step 0 for user type)
  const totalSteps = isQuranSubject ? 8 : 7;

  // Adjust step numbers when Quran subject is not selected
  // Step 0: User type (always)
  // Step 1: Learning Goals (always)
  // Step 2: Current Level (always)
  // Step 3: Talbiyah Approach (Quran only - skip for others)
  // Step 4: Challenges (always)
  // Step 5: Preferences (always)
  // Step 6: Student Info (always)
  // Step 7: Confirmation (always)
  const getActualStep = (displayStep: number): number => {
    if (displayStep === 0) return 0; // User type
    if (!isQuranSubject && displayStep >= 4) {
      return displayStep + 1; // Skip step 4 (Talbiyah Approach in actual numbering)
    }
    return displayStep;
  };

  const getDisplayStep = (actualStep: number): number => {
    if (actualStep === 0) return 0;
    if (!isQuranSubject && actualStep >= 5) {
      return actualStep - 1;
    }
    return actualStep;
  };

  const updateResponse = <K extends keyof QuestionnaireResponses>(
    key: K,
    value: QuestionnaireResponses[K]
  ) => {
    setResponses(prev => ({ ...prev, [key]: value }));
  };

  const toggleArrayResponse = (key: 'main_challenges' | 'preferred_schedule' | 'selected_subjects' | 'learning_styles', value: string) => {
    setResponses(prev => {
      const currentArray = prev[key] as string[];
      if (currentArray.includes(value)) {
        return { ...prev, [key]: currentArray.filter(v => v !== value) };
      } else {
        return { ...prev, [key]: [...currentArray, value] };
      }
    });
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 0: // User type selection
        return !!responses.user_type;
      case 1: // Learning Goals
        return responses.selected_subjects.length > 0 && !!responses.specific_goals && !!responses.timeline_expectation;
      case 2: // Current Level
        if (isQuranSubject) {
          return !!responses.current_level && !!responses.can_read_arabic;
        }
        return !!responses.current_level;
      case 3: // Talbiyah Approach (Quran only) OR Challenges (non-Quran)
        if (isQuranSubject) {
          // Talbiyah Approach
          if (responses.learning_priority === 'memorization_first') {
            return !!responses.reconsidered_approach;
          }
          return !!responses.learning_priority;
        } else {
          // Challenges (skipped Talbiyah)
          return responses.main_challenges.length > 0;
        }
      case 4: // Challenges (Quran) OR Preferences (non-Quran)
        if (isQuranSubject) {
          return responses.main_challenges.length > 0;
        } else {
          const hasStyle = responses.learning_styles.length > 0 || !!responses.learning_style;
          return hasStyle && !!responses.lesson_frequency && responses.preferred_schedule.length > 0;
        }
      case 5: // Preferences (Quran) OR Student Info (non-Quran)
        if (isQuranSubject) {
          const hasStyle = responses.learning_styles.length > 0 || !!responses.learning_style;
          return hasStyle && !!responses.lesson_frequency && responses.preferred_schedule.length > 0;
        } else {
          return !!responses.student_name && responses.student_age !== null && !!responses.student_gender && !!responses.parent_involved;
        }
      case 6: // Student Info (Quran) OR Confirmation (non-Quran)
        if (isQuranSubject) {
          return !!responses.student_name && responses.student_age !== null && !!responses.student_gender && !!responses.parent_involved;
        } else {
          return true; // Confirmation step
        }
      case 7: // Confirmation (Quran only)
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (!canProceed()) return;

    // Check if showing misaligned warning (step 3 for Quran subjects)
    if (isQuranSubject && currentStep === 3 && responses.reconsidered_approach === 'still_memorization') {
      setShowMisalignedWarning(true);
      return;
    }

    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/signin');
        return;
      }

      // Check if user already has a diagnostic assessment
      const { data: existingAssessment } = await supabase
        .from('diagnostic_assessments')
        .select('id')
        .eq('student_id', user.id)
        .not('status', 'eq', 'cancelled')
        .maybeSingle();

      if (existingAssessment) {
        setError('You have already started a diagnostic assessment. Please continue from your dashboard.');
        setLoading(false);
        return;
      }

      // Calculate methodology alignment
      let methodologyAlignment = 'moderate';
      if (responses.learning_priority === 'understanding_first' || responses.learning_priority === 'fluency_first') {
        methodologyAlignment = 'strong';
      } else if (responses.learning_priority === 'balanced' || responses.learning_priority === 'guidance_needed') {
        methodologyAlignment = 'moderate';
      } else if (responses.learning_priority === 'memorization_first') {
        if (responses.reconsidered_approach === 'try_talbiyah') {
          methodologyAlignment = 'moderate';
        } else {
          methodologyAlignment = 'misaligned';
        }
      }

      // Build the full responses object with backward compatibility
      const fullResponses = {
        ...responses,
        // Set primary_subject from selected_subjects for backward compatibility
        primary_subject: responses.selected_subjects.length > 0
          ? responses.selected_subjects[0]
          : responses.primary_subject,
        // Set learning_style from learning_styles for backward compatibility
        learning_style: responses.learning_styles.length > 0
          ? responses.learning_styles[0]
          : responses.learning_style,
      };

      // Get subject_area from selected subjects (prioritize Quran if selected)
      const subjectArea = responses.selected_subjects.find(s =>
        s.includes('quran') || s.includes('tajweed')
      ) || responses.selected_subjects[0] || responses.primary_subject;

      // Create the diagnostic assessment
      const { data: assessment, error: insertError } = await supabase
        .from('diagnostic_assessments')
        .insert({
          student_id: user.id,
          pre_assessment_responses: fullResponses,
          methodology_alignment: methodologyAlignment,
          status: 'questionnaire_complete',
          subject_area: subjectArea,
          questionnaire_completed_at: new Date().toISOString()
        })
        .select('id')
        .single();

      if (insertError) throw insertError;

      // Update profile to track diagnostic
      await supabase
        .from('profiles')
        .update({ diagnostic_assessment_id: assessment.id })
        .eq('id', user.id);

      if (onComplete) {
        onComplete(assessment.id);
      } else {
        // Navigate to booking flow
        navigate(`/diagnostic/book/${assessment.id}`);
      }

    } catch (err: any) {
      console.error('Error creating diagnostic assessment:', err);
      setError(err.message || 'Failed to save your responses. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStep = () => {
    // Step 0 is always user type selection
    if (currentStep === 0) {
      return (
        <Step0UserType
          responses={responses}
          updateResponse={updateResponse}
        />
      );
    }

    // For Quran subjects: 1=Goals, 2=Level, 3=Talbiyah, 4=Challenges, 5=Preferences, 6=StudentInfo, 7=Confirmation
    // For non-Quran:      1=Goals, 2=Level, 3=Challenges, 4=Preferences, 5=StudentInfo, 6=Confirmation
    if (isQuranSubject) {
      switch (currentStep) {
        case 1:
          return (
            <Step1LearningGoals
              responses={responses}
              toggleSubject={(value) => toggleArrayResponse('selected_subjects', value)}
              updateResponse={updateResponse}
              isParent={isParent}
            />
          );
        case 2:
          return <Step2CurrentLevel responses={responses} updateResponse={updateResponse} isQuranSubject={isQuranSubject} isParent={isParent} />;
        case 3:
          return (
            <Step3TalbiyahApproach
              responses={responses}
              updateResponse={updateResponse}
              showMisalignedWarning={showMisalignedWarning}
              setShowMisalignedWarning={setShowMisalignedWarning}
              onContinue={() => setCurrentStep(currentStep + 1)}
              onClose={onClose}
              isParent={isParent}
            />
          );
        case 4:
          return (
            <Step4Challenges
              responses={responses}
              toggleArrayResponse={toggleArrayResponse}
              updateResponse={updateResponse}
              isQuranSubject={isQuranSubject}
              isArabicSubject={isArabicSubject}
              isParent={isParent}
            />
          );
        case 5:
          return (
            <Step5Preferences
              responses={responses}
              updateResponse={updateResponse}
              toggleArrayResponse={toggleArrayResponse}
              isParent={isParent}
            />
          );
        case 6:
          return <Step6StudentInfo responses={responses} updateResponse={updateResponse} isParent={isParent} />;
        case 7:
          return <Step7Confirmation responses={responses} isQuranSubject={isQuranSubject} isParent={isParent} />;
        default:
          return null;
      }
    } else {
      // Non-Quran - skip Talbiyah step
      switch (currentStep) {
        case 1:
          return (
            <Step1LearningGoals
              responses={responses}
              toggleSubject={(value) => toggleArrayResponse('selected_subjects', value)}
              updateResponse={updateResponse}
              isParent={isParent}
            />
          );
        case 2:
          return <Step2CurrentLevel responses={responses} updateResponse={updateResponse} isQuranSubject={isQuranSubject} isParent={isParent} />;
        case 3:
          return (
            <Step4Challenges
              responses={responses}
              toggleArrayResponse={toggleArrayResponse}
              updateResponse={updateResponse}
              isQuranSubject={isQuranSubject}
              isArabicSubject={isArabicSubject}
              isParent={isParent}
            />
          );
        case 4:
          return (
            <Step5Preferences
              responses={responses}
              updateResponse={updateResponse}
              toggleArrayResponse={toggleArrayResponse}
              isParent={isParent}
            />
          );
        case 5:
          return <Step6StudentInfo responses={responses} updateResponse={updateResponse} isParent={isParent} />;
        case 6:
          return <Step7Confirmation responses={responses} isQuranSubject={isQuranSubject} isParent={isParent} />;
        default:
          return null;
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-emerald-500 rounded-full mb-4">
            <Sparkles className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Free Diagnostic Assessment</h1>
          <p className="text-gray-600">
            Let's understand your learning goals to create the perfect learning journey
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Step {currentStep + 1} of {totalSteps}</span>
            <span className="text-sm text-gray-500">{Math.round(((currentStep + 1) / totalSteps) * 100)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300"
              style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        )}

        {/* Question Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8 mb-6">
          {renderStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition ${
              currentStep === 0
                ? 'text-gray-400 cursor-not-allowed'
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <ChevronLeft className="w-5 h-5" />
            Back
          </button>

          {currentStep === totalSteps - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={loading || !canProceed()}
              className={`flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition shadow-lg shadow-emerald-500/20 ${
                loading || !canProceed() ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  Continue to Book Assessment
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className={`flex items-center gap-2 px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition shadow-lg shadow-emerald-500/20 ${
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
          <div className="mt-6 text-center">
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm transition"
            >
              Cancel and go back
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// Step 0: Who is filling out this questionnaire
function Step0UserType({
  responses,
  updateResponse
}: {
  responses: QuestionnaireResponses;
  updateResponse: <K extends keyof QuestionnaireResponses>(key: K, value: QuestionnaireResponses[K]) => void;
}) {
  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Welcome!</h2>
      </div>

      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Who is filling out this questionnaire? <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500 mb-4">This helps us personalise the questions for you</p>

        <div className="grid gap-4">
          <button
            onClick={() => updateResponse('user_type', 'student')}
            className={`w-full p-6 rounded-xl border-2 text-left transition ${
              responses.user_type === 'student'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">🎓</span>
              <div className="flex-1">
                <p className="font-bold text-lg text-gray-900">I'm the student</p>
                <p className="text-gray-500">I'll be taking the lessons myself</p>
              </div>
              {responses.user_type === 'student' && (
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </button>

          <button
            onClick={() => updateResponse('user_type', 'parent')}
            className={`w-full p-6 rounded-xl border-2 text-left transition ${
              responses.user_type === 'parent'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <div className="flex items-start gap-4">
              <span className="text-4xl">👨‍👩‍👧</span>
              <div className="flex-1">
                <p className="font-bold text-lg text-gray-900">I'm a parent/guardian</p>
                <p className="text-gray-500">I'm registering my child/children for lessons</p>
              </div>
              {responses.user_type === 'parent' && (
                <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Multi-child option for parents */}
      {responses.user_type === 'parent' && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            How many children would you like to register?
          </label>
          <div className="flex gap-3">
            {[1, 2, 3, 4].map(num => (
              <button
                key={num}
                onClick={() => updateResponse('num_children', num)}
                className={`w-14 h-14 rounded-xl border-2 font-bold text-lg transition ${
                  responses.num_children === num
                    ? 'border-blue-500 bg-blue-500 text-white'
                    : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
                }`}
              >
                {num}
              </button>
            ))}
            <button
              onClick={() => updateResponse('num_children', 5)}
              className={`px-4 h-14 rounded-xl border-2 font-bold text-lg transition ${
                responses.num_children >= 5
                  ? 'border-blue-500 bg-blue-500 text-white'
                  : 'border-gray-200 bg-white text-gray-700 hover:border-blue-300'
              }`}
            >
              5+
            </button>
          </div>

          {responses.num_children > 1 && (
            <div className="mt-4 p-4 bg-emerald-100 rounded-lg border border-emerald-200">
              <p className="text-emerald-800 font-medium flex items-center gap-2">
                <Sparkles className="w-5 h-5" />
                Great news! Sibling discounts are available.
              </p>
              <p className="text-emerald-700 text-sm mt-1">
                We'll discuss discount options after your free diagnostic assessment.
              </p>
            </div>
          )}

          {responses.num_children > 1 && (
            <p className="mt-3 text-sm text-gray-600">
              This questionnaire will be for your first child. You can register additional children after the initial assessment.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

// Step 1: Learning Goals - Combined subjects, goals, and timeline
function Step1LearningGoals({
  responses,
  toggleSubject,
  updateResponse,
  isParent
}: {
  responses: QuestionnaireResponses;
  toggleSubject: (value: string) => void;
  updateResponse: <K extends keyof QuestionnaireResponses>(key: K, value: QuestionnaireResponses[K]) => void;
  isParent: boolean;
}) {
  const subjects = [
    { id: 'quran_reading', label: 'Quran Reading', description: 'Learn to read the Quran with proper pronunciation', icon: '📖' },
    { id: 'quran_memorization', label: 'Quran Memorization', description: 'Memorize surahs and ayat systematically', icon: '🧠' },
    { id: 'arabic_language', label: 'Arabic Language', description: 'Conversational Arabic - read, write, and speak', icon: '🗣️' },
    { id: 'tajweed', label: 'Tajweed', description: 'Perfect your Quran recitation rules', icon: '🎯' },
    { id: 'islamic_studies', label: 'Islamic Studies', description: 'Learn about Islamic knowledge and history', icon: '📚' }
  ];

  const timelines = [
    { id: '1_3_months', label: '1-3 months', description: 'Quick progress' },
    { id: '3_6_months', label: '3-6 months', description: 'Steady progress' },
    { id: '6_12_months', label: '6-12 months', description: 'Taking time' },
    { id: 'no_rush', label: 'No rush', description: 'Long-term journey' }
  ];

  const isQuranSelected = responses.selected_subjects.some(s =>
    s.includes('quran') || s.includes('tajweed')
  );
  const isArabicSelected = responses.selected_subjects.includes('arabic_language');

  const getPlaceholder = () => {
    const subject = isParent ? "my child" : "I";
    const verb = isParent ? "wants" : "want";
    if (isQuranSelected && isArabicSelected) {
      return isParent
        ? "E.g., I want my child to read Quran fluently with understanding, AND have conversational Arabic..."
        : "E.g., I want to read Quran fluently with understanding, AND have conversational Arabic for everyday use...";
    } else if (isQuranSelected) {
      return isParent
        ? "E.g., I want my child to memorize Juz Amma while understanding the meanings..."
        : "E.g., I want to memorize Juz Amma while understanding the meanings, or read Quran fluently with proper tajweed...";
    } else if (isArabicSelected) {
      return isParent
        ? "E.g., I want my child to speak conversational Arabic and read/write fluently..."
        : "E.g., I want to have conversational Arabic for travel, understand Arabic media, or read Arabic literature...";
    }
    return isParent
      ? "E.g., I want my child to learn about Islamic history and understand the basics of fiqh..."
      : "E.g., I want to learn about Islamic history and understand the basics of fiqh...";
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <Target className="w-5 h-5 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Learning Goals</h2>
      </div>

      {/* Question 1: Subjects - Multi-select */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-2">
          {isParent ? "What would your child like to learn?" : "What would you like to learn?"} <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-emerald-600 mb-3 flex items-center gap-1">
          <Check className="w-4 h-4" />
          Select all that apply - you can choose multiple subjects
        </p>
        <div className="grid gap-3">
          {subjects.map(subject => {
            const isSelected = responses.selected_subjects.includes(subject.id);
            return (
              <button
                key={subject.id}
                onClick={() => toggleSubject(subject.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition relative ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{subject.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{subject.label}</p>
                    <p className="text-sm text-gray-500">{subject.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {responses.selected_subjects.length > 0 && (
          <p className="text-sm text-emerald-600 mt-2">
            Selected: {responses.selected_subjects.length} subject{responses.selected_subjects.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Question 2: Specific Goals - only show after subjects selected */}
      {responses.selected_subjects.length > 0 && (
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            What are your specific goals? <span className="text-red-500">*</span>
          </label>
          <p className="text-sm text-gray-500 mb-3">Be as detailed as possible - this helps us match you with the right teacher</p>
          <textarea
            value={responses.specific_goals}
            onChange={(e) => updateResponse('specific_goals', e.target.value)}
            placeholder={getPlaceholder()}
            maxLength={500}
            rows={4}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
          <p className="text-xs text-gray-400 mt-1">{responses.specific_goals.length}/500 characters</p>
        </div>
      )}

      {/* Question 3: Timeline - only show after subjects selected */}
      {responses.selected_subjects.length > 0 && (
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            What's your expected timeline? <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-3">
            {timelines.map(timeline => (
              <button
                key={timeline.id}
                onClick={() => updateResponse('timeline_expectation', timeline.id)}
                className={`p-4 rounded-xl border-2 text-left transition ${
                  responses.timeline_expectation === timeline.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <p className="font-semibold text-gray-900">{timeline.label}</p>
                <p className="text-sm text-gray-500">{timeline.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Step 2: Current Level
function Step2CurrentLevel({
  responses,
  updateResponse,
  isQuranSubject,
  isParent
}: {
  responses: QuestionnaireResponses;
  updateResponse: <K extends keyof QuestionnaireResponses>(key: K, value: QuestionnaireResponses[K]) => void;
  isQuranSubject: boolean;
  isParent: boolean;
}) {
  const studentLabel = isParent ? "your child" : "you";
  const possessive = isParent ? "your child's" : "your";

  const levels = [
    { id: 'beginner', label: 'Complete beginner', description: isParent ? 'Never studied this before' : 'Never studied this before' },
    { id: 'some_exposure', label: 'Some exposure', description: isParent ? 'Knows some basics but not confident' : 'Know some basics but not confident' },
    { id: 'intermediate', label: 'Intermediate', description: isParent ? 'Can do basics independently' : 'Can do basics independently' },
    { id: 'advanced', label: 'Advanced', description: 'Looking to refine and perfect skills' }
  ];

  const arabicReadingLevels = [
    { id: 'cannot_read', label: isParent ? 'Cannot read Arabic at all' : 'Cannot read Arabic at all' },
    { id: 'some_letters', label: isParent ? 'Knows some letters but can\'t read words' : 'Know some letters but can\'t read words' },
    { id: 'read_slowly', label: isParent ? 'Can read slowly with difficulty' : 'Can read slowly with difficulty' },
    { id: 'read_fluently', label: isParent ? 'Can read fluently' : 'Can read fluently' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Current Level</h2>
      </div>

      {/* Question 4: Current Level */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          {isParent ? "What's your child's current level?" : "What's your current level in this subject?"} <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-3">
          {levels.map(level => (
            <button
              key={level.id}
              onClick={() => updateResponse('current_level', level.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition ${
                responses.current_level === level.id
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

      {/* Question 5: Previous Experience */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          {isParent ? "Tell us about your child's previous learning experience" : "Tell us about any previous learning experience"}
        </label>
        <textarea
          value={responses.previous_experience}
          onChange={(e) => updateResponse('previous_experience', e.target.value)}
          placeholder={isParent
            ? "E.g., Attended madrasa for 2 years, had lessons at the mosque, uses Quran apps..."
            : "E.g., Attended madrasa for 2 years, self-studied with apps, had a private tutor..."}
          maxLength={500}
          rows={3}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
      </div>

      {/* Question 6: Arabic Reading (Quran subjects only) */}
      {isQuranSubject && (
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            {isParent ? "Can your child read Arabic script?" : "Can you read Arabic script?"} <span className="text-red-500">*</span>
          </label>
          <div className="grid gap-3">
            {arabicReadingLevels.map(level => (
              <button
                key={level.id}
                onClick={() => updateResponse('can_read_arabic', level.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition ${
                  responses.can_read_arabic === level.id
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <p className="font-medium text-gray-900">{level.label}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Question 7: Current Memorization (Quran subjects only) */}
      {isQuranSubject && (
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            {isParent ? "What has your child memorized so far (if anything)?" : "What have you memorized so far (if anything)?"}
          </label>
          <textarea
            value={responses.current_memorization}
            onChange={(e) => updateResponse('current_memorization', e.target.value)}
            placeholder="E.g., Al-Fatiha, last 10 surahs, Juz Amma..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
        </div>
      )}
    </div>
  );
}

// Step 3: Talbiyah Approach (Quran subjects only)
function Step3TalbiyahApproach({
  responses,
  updateResponse,
  showMisalignedWarning,
  setShowMisalignedWarning,
  onContinue,
  onClose,
  isParent
}: {
  responses: QuestionnaireResponses;
  updateResponse: <K extends keyof QuestionnaireResponses>(key: K, value: QuestionnaireResponses[K]) => void;
  showMisalignedWarning: boolean;
  setShowMisalignedWarning: (show: boolean) => void;
  onContinue: () => void;
  onClose?: () => void;
  isParent: boolean;
}) {
  const priorities = [
    { id: 'understanding_first', label: 'Understanding first', description: 'I want to know what I\'m reading and connect with the meaning' },
    { id: 'fluency_first', label: 'Fluency first', description: 'I want to read correctly with proper Tajweed before memorizing' },
    { id: 'balanced', label: 'Balanced approach', description: 'I want understanding, fluency, AND memorization together' },
    { id: 'memorization_first', label: 'Memorization first', description: 'I want to memorize as much as possible, as quickly as possible' },
    { id: 'guidance_needed', label: 'I\'m not sure', description: 'I\'d like guidance on the best approach' }
  ];

  // Show different perspective if memorization_first selected
  if (responses.learning_priority === 'memorization_first' && !responses.reconsidered_approach) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center">
            <Info className="w-5 h-5 text-amber-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">A Different Perspective</h2>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6">
          <p className="text-gray-700 mb-4">We understand the desire to memorize quickly.</p>
          <p className="text-gray-700 mb-4">But here's what we've seen:</p>

          <div className="mb-6">
            <p className="font-semibold text-red-600 mb-2">Students who memorize without understanding often:</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Forget what they've memorized within months</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Recite mechanically without feeling</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Struggle to maintain motivation</span>
              </li>
              <li className="flex items-start gap-2">
                <X className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <span>Miss the transformative power of Quran</span>
              </li>
            </ul>
          </div>

          <div className="mb-6">
            <p className="font-semibold text-emerald-600 mb-2">Students who follow Understanding → Fluency → Memorization:</p>
            <ul className="space-y-2 text-gray-600">
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Retain memorization much longer</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Feel deep connection during recitation</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Stay motivated because they understand</span>
              </li>
              <li className="flex items-start gap-2">
                <Check className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                <span>Experience real spiritual growth</span>
              </li>
            </ul>
          </div>

          <p className="text-gray-700">
            We'd love for you to try our approach. Your free diagnostic assessment will show you the difference.
          </p>
        </div>

        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            After reading this, which would you prefer? <span className="text-red-500">*</span>
          </label>
          <div className="grid gap-3">
            <button
              onClick={() => updateResponse('reconsidered_approach', 'try_talbiyah')}
              className={`w-full p-4 rounded-xl border-2 text-left transition ${
                responses.reconsidered_approach === 'try_talbiyah'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <p className="font-semibold text-gray-900">I'd like to try the Talbiyah approach</p>
              <p className="text-sm text-gray-500">Understanding → Fluency → Memorization</p>
            </button>
            <button
              onClick={() => updateResponse('reconsidered_approach', 'still_memorization')}
              className={`w-full p-4 rounded-xl border-2 text-left transition ${
                responses.reconsidered_approach === 'still_memorization'
                  ? 'border-amber-500 bg-amber-50'
                  : 'border-gray-200 hover:border-amber-300'
              }`}
            >
              <p className="font-semibold text-gray-900">I still prefer to focus on fast memorization</p>
            </button>
          </div>
        </div>

        <button
          onClick={() => {
            updateResponse('learning_priority', '');
            updateResponse('reconsidered_approach', undefined);
          }}
          className="text-sm text-gray-500 hover:text-gray-700 underline"
        >
          ← Go back and choose a different priority
        </button>
      </div>
    );
  }

  // Show misaligned warning if user still prefers fast memorization
  if (showMisalignedWarning) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
            <Info className="w-5 h-5 text-gray-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">We Respect Your Choice</h2>
        </div>

        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
          <p className="text-gray-700 mb-4">We want to be honest with you.</p>

          <p className="text-gray-700 mb-4">
            Talbiyah teachers are trained in the Understanding → Fluency → Memorization methodology.
            This is core to how we teach.
          </p>

          <p className="text-gray-700 mb-4">
            If your primary goal is rapid memorization without focus on meaning, there may be
            other platforms better suited to that approach.
          </p>

          <p className="text-gray-700 mb-4">
            However, you're welcome to book a free diagnostic assessment and experience our approach
            firsthand. Many students who came for "fast memorization" discovered they preferred
            learning with understanding.
          </p>

          <p className="text-gray-700 font-medium">No pressure. The choice is yours.</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={() => {
              setShowMisalignedWarning(false);
              onContinue();
            }}
            className="w-full px-6 py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-full transition"
          >
            Continue with Free Assessment
          </button>
          {onClose && (
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-sm transition"
            >
              Maybe Talbiyah isn't for me
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <BookOpen className="w-5 h-5 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">The Talbiyah Approach</h2>
      </div>

      {/* Educational Content */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <p className="text-gray-700 mb-4">
          At Talbiyah, we teach Quran differently.
        </p>
        <p className="text-gray-700 mb-4">
          Most platforms focus on fast memorization. <strong>We focus on deep connection.</strong>
        </p>
        <p className="text-gray-700 mb-4">Our methodology follows three pillars, in this order:</p>

        <div className="space-y-4 mb-4">
          <div className="bg-white rounded-lg p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">1</span>
              <h4 className="font-bold text-gray-900">UNDERSTANDING (Fahm)</h4>
            </div>
            <p className="text-sm text-gray-600 ml-10">
              First, know what you're reading. Learn the meaning of each word and ayah. Connect emotionally with the message.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">2</span>
              <h4 className="font-bold text-gray-900">FLUENCY (Itqan)</h4>
            </div>
            <p className="text-sm text-gray-600 ml-10">
              Then, read it correctly. Master proper pronunciation and Tajweed. Recite smoothly without stumbling.
            </p>
          </div>

          <div className="bg-white rounded-lg p-4 border border-emerald-100">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-8 h-8 bg-emerald-500 text-white rounded-full flex items-center justify-center font-bold text-sm">3</span>
              <h4 className="font-bold text-gray-900">MEMORIZATION (Hifz)</h4>
            </div>
            <p className="text-sm text-gray-600 ml-10">
              Finally, commit to memory. Built on understanding and fluency. Retention is stronger, recitation more meaningful.
            </p>
          </div>
        </div>

        <p className="text-gray-700 text-sm italic">
          This isn't the fastest path. But it's the deepest. Students who memorize with understanding
          retain better, connect more deeply, and recite with true feeling.
        </p>
      </div>

      {/* Question 8: Learning Priority */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Which best describes your priority? <span className="text-red-500">*</span>
        </label>
        <div className="grid gap-3">
          {priorities.map(priority => (
            <button
              key={priority.id}
              onClick={() => updateResponse('learning_priority', priority.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition ${
                responses.learning_priority === priority.id
                  ? priority.id === 'memorization_first'
                    ? 'border-amber-500 bg-amber-50'
                    : 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <p className="font-semibold text-gray-900">{priority.label}</p>
              <p className="text-sm text-gray-500">{priority.description}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 4: Challenges
function Step4Challenges({
  responses,
  toggleArrayResponse,
  updateResponse,
  isQuranSubject,
  isArabicSubject,
  isParent
}: {
  responses: QuestionnaireResponses;
  toggleArrayResponse: (key: 'main_challenges' | 'preferred_schedule' | 'selected_subjects' | 'learning_styles', value: string) => void;
  updateResponse: <K extends keyof QuestionnaireResponses>(key: K, value: QuestionnaireResponses[K]) => void;
  isQuranSubject: boolean;
  isArabicSubject: boolean;
  isParent: boolean;
}) {
  // Subject-specific challenges
  const quranChallenges = [
    { id: 'pronunciation', label: 'Pronunciation', description: 'Difficulty saying Arabic sounds correctly' },
    { id: 'reading', label: 'Reading Arabic Script', description: "Can't read Arabic script fluently" },
    { id: 'memorization', label: 'Memorization', description: "Hard to remember what I've learned" },
    { id: 'understanding', label: 'Understanding Meanings', description: "Don't understand what the words mean" },
    { id: 'tajweed', label: 'Tajweed Rules', description: "Don't know the rules of proper recitation" },
  ];

  const arabicChallenges = [
    { id: 'speaking', label: 'Speaking', description: 'Difficulty speaking fluently in conversation' },
    { id: 'vocabulary', label: 'Vocabulary', description: 'Limited vocabulary for everyday use' },
    { id: 'grammar', label: 'Grammar/Sentence Structure', description: 'Struggle with putting sentences together' },
    { id: 'listening', label: 'Listening Comprehension', description: 'Hard to understand spoken Arabic' },
    { id: 'writing', label: 'Writing', description: 'Difficulty writing in Arabic' },
  ];

  const commonChallenges = [
    { id: 'consistency', label: 'Consistency', description: 'Hard to maintain regular practice' },
    { id: 'motivation', label: 'Motivation', description: 'Struggle to stay engaged' },
    { id: 'time', label: 'Limited Time', description: 'Not enough time for learning' },
    { id: 'previous_experience', label: 'Previous Experience', description: 'Had unhelpful teachers before' },
    { id: 'other', label: 'Other', description: 'Something else (please specify)' }
  ];

  // Build challenge list based on selected subjects
  let challenges = [...commonChallenges];
  if (isQuranSubject) {
    challenges = [...quranChallenges, ...challenges];
  }
  if (isArabicSubject) {
    challenges = [...arabicChallenges, ...challenges.filter(c => !arabicChallenges.find(ac => ac.id === c.id))];
  }
  if (!isQuranSubject && !isArabicSubject) {
    // Default - show all
    challenges = [...quranChallenges, ...arabicChallenges, ...commonChallenges];
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-orange-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Challenges</h2>
      </div>

      {/* Question 9: Main Challenges */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          What challenges do you face? <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
        <div className="grid gap-3">
          {challenges.map(challenge => (
            <button
              key={challenge.id}
              onClick={() => toggleArrayResponse('main_challenges', challenge.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition flex items-start gap-3 ${
                responses.main_challenges.includes(challenge.id)
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 mt-0.5 ${
                responses.main_challenges.includes(challenge.id)
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-300'
              }`}>
                {responses.main_challenges.includes(challenge.id) && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{challenge.label}</p>
                <p className="text-sm text-gray-500">{challenge.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Question 10: Challenge Details (if Other selected) */}
      {responses.main_challenges.includes('other') && (
        <div>
          <label className="block text-lg font-semibold text-gray-900 mb-3">
            Tell us more about your challenges
          </label>
          <textarea
            value={responses.challenge_details}
            onChange={(e) => updateResponse('challenge_details', e.target.value)}
            placeholder="Describe any other challenges you face..."
            maxLength={500}
            rows={3}
            className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
          />
        </div>
      )}
    </div>
  );
}

// Step 5: Learning Preferences
function Step5Preferences({
  responses,
  updateResponse,
  toggleArrayResponse,
  isParent
}: {
  responses: QuestionnaireResponses;
  updateResponse: <K extends keyof QuestionnaireResponses>(key: K, value: QuestionnaireResponses[K]) => void;
  toggleArrayResponse: (key: 'main_challenges' | 'preferred_schedule' | 'selected_subjects' | 'learning_styles', value: string) => void;
  isParent: boolean;
}) {
  const learningStyles = [
    { id: 'visual', label: 'Visual', description: isParent ? 'Learns by seeing (diagrams, videos, written examples)' : 'I learn by seeing (diagrams, videos, written examples)', icon: '👁️' },
    { id: 'auditory', label: 'Auditory', description: isParent ? 'Learns by listening (explanations, recitations)' : 'I learn by listening (explanations, recitations)', icon: '👂' },
    { id: 'reading_writing', label: 'Reading/Writing', description: isParent ? 'Learns by taking notes and reading' : 'I learn by taking notes and reading', icon: '📝' },
    { id: 'hands_on', label: 'Hands-on', description: isParent ? 'Learns by practicing and doing' : 'I learn by practicing and doing', icon: '✋' }
  ];

  const frequencies = [
    { id: '1_per_week', label: '1 lesson per week' },
    { id: '2_per_week', label: '2 lessons per week' },
    { id: '3_plus_per_week', label: '3+ lessons per week' },
    { id: 'not_sure', label: 'Not sure yet' }
  ];

  const scheduleOptions = [
    { id: 'weekday_mornings', label: 'Weekday mornings (before 12pm)' },
    { id: 'weekday_afternoons', label: 'Weekday afternoons (12pm - 5pm)' },
    { id: 'weekday_evenings', label: 'Weekday evenings (after 5pm)' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
          <Calendar className="w-5 h-5 text-purple-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Learning Preferences</h2>
      </div>

      {/* Question 11: Learning Style - Multi-select */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-2">
          {isParent ? "How does your child learn best?" : "How do you learn best?"} <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-emerald-600 mb-3 flex items-center gap-1">
          <Check className="w-4 h-4" />
          {isParent ? "Select all that apply - most children have multiple learning styles" : "Select all that apply - most people have multiple learning styles"}
        </p>
        <div className="grid gap-3">
          {learningStyles.map(style => {
            const isSelected = responses.learning_styles.includes(style.id);
            return (
              <button
                key={style.id}
                onClick={() => toggleArrayResponse('learning_styles', style.id)}
                className={`w-full p-4 rounded-xl border-2 text-left transition ${
                  isSelected
                    ? 'border-emerald-500 bg-emerald-50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{style.icon}</span>
                  <div className="flex-1">
                    <p className="font-semibold text-gray-900">{style.label}</p>
                    <p className="text-sm text-gray-500">{style.description}</p>
                  </div>
                  {isSelected && (
                    <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {responses.learning_styles.length > 0 && (
          <p className="text-sm text-emerald-600 mt-2">
            Selected: {responses.learning_styles.length} style{responses.learning_styles.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      {/* Question 12: Lesson Frequency */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          How often would you like to have lessons? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {frequencies.map(freq => (
            <button
              key={freq.id}
              onClick={() => updateResponse('lesson_frequency', freq.id)}
              className={`p-4 rounded-xl border-2 text-left transition ${
                responses.lesson_frequency === freq.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <p className="font-medium text-gray-900">{freq.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Question 13: Preferred Schedule */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          When are you available for lessons? <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500 mb-3">Select all that apply</p>
        <div className="grid gap-3">
          {scheduleOptions.map(option => (
            <button
              key={option.id}
              onClick={() => toggleArrayResponse('preferred_schedule', option.id)}
              className={`w-full p-4 rounded-xl border-2 text-left transition flex items-center gap-3 ${
                responses.preferred_schedule.includes(option.id)
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              }`}
            >
              <div className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                responses.preferred_schedule.includes(option.id)
                  ? 'border-emerald-500 bg-emerald-500'
                  : 'border-gray-300'
              }`}>
                {responses.preferred_schedule.includes(option.id) && (
                  <Check className="w-4 h-4 text-white" />
                )}
              </div>
              <p className="font-medium text-gray-900">{option.label}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Step 6: Student Information
function Step6StudentInfo({
  responses,
  updateResponse,
  isParent
}: {
  responses: QuestionnaireResponses;
  updateResponse: <K extends keyof QuestionnaireResponses>(key: K, value: QuestionnaireResponses[K]) => void;
  isParent: boolean;
}) {
  const parentOptions = [
    { id: 'always', label: 'Yes, always' },
    { id: 'sometimes', label: 'Yes, sometimes' },
    { id: 'no', label: 'No, student will learn independently' }
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          {isParent ? "Child's Information" : "Your Information"}
        </h2>
      </div>

      {/* Question 14: Student Name */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          {isParent ? "Child's first name" : "Your first name"} <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={responses.student_name}
          onChange={(e) => updateResponse('student_name', e.target.value)}
          placeholder={isParent ? "Enter your child's first name" : "Enter your first name"}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Student Surname */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          {isParent ? "Child's surname/family name" : "Your surname/family name"}
        </label>
        <input
          type="text"
          value={responses.student_surname}
          onChange={(e) => updateResponse('student_surname', e.target.value)}
          placeholder={isParent ? "Enter your child's surname" : "Enter your surname"}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
      </div>

      {/* Question 15: Student Age */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          {isParent ? "Child's age" : "Your age"} <span className="text-red-500">*</span>
        </label>
        <input
          type="number"
          value={responses.student_age || ''}
          onChange={(e) => updateResponse('student_age', e.target.value ? parseInt(e.target.value) : null)}
          placeholder="Enter age"
          min={4}
          max={99}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
        />
        {responses.student_age !== null && (responses.student_age < 4 || responses.student_age > 99) && (
          <p className="text-red-500 text-sm mt-1">Age must be between 4 and 99</p>
        )}
      </div>

      {/* Question 16: Student Gender */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          {isParent ? "Child's gender" : "Your gender"} <span className="text-red-500">*</span>
        </label>
        <p className="text-sm text-gray-500 mb-3">Used to match with appropriate teacher</p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => updateResponse('student_gender', 'male')}
            className={`p-4 rounded-xl border-2 text-left transition ${
              responses.student_gender === 'male'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <p className="font-semibold text-gray-900">Male</p>
          </button>
          <button
            onClick={() => updateResponse('student_gender', 'female')}
            className={`p-4 rounded-xl border-2 text-left transition ${
              responses.student_gender === 'female'
                ? 'border-emerald-500 bg-emerald-50'
                : 'border-gray-200 hover:border-emerald-300'
            }`}
          >
            <p className="font-semibold text-gray-900">Female</p>
          </button>
        </div>
      </div>

      {/* Question 17: Parent Involvement */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          {isParent ? "Will you be present during lessons?" : "Will a parent/guardian be present during lessons?"} <span className="text-red-500">*</span>
        </label>
        {responses.student_age !== null && responses.student_age < 13 && (
          <p className="text-amber-600 text-sm mb-3 bg-amber-50 p-2 rounded-lg">
            Required for students under 13
          </p>
        )}
        <div className="grid gap-3">
          {parentOptions.map(option => (
            <button
              key={option.id}
              onClick={() => updateResponse('parent_involved', option.id)}
              disabled={responses.student_age !== null && responses.student_age < 13 && option.id === 'no'}
              className={`w-full p-4 rounded-xl border-2 text-left transition ${
                responses.parent_involved === option.id
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-200 hover:border-emerald-300'
              } ${responses.student_age !== null && responses.student_age < 13 && option.id === 'no' ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <p className="font-medium text-gray-900">{option.label}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Question 18: Additional Notes */}
      <div>
        <label className="block text-lg font-semibold text-gray-900 mb-3">
          Anything else we should know?
        </label>
        <textarea
          value={responses.additional_notes}
          onChange={(e) => updateResponse('additional_notes', e.target.value)}
          placeholder="E.g., Learning difficulties, specific teacher preferences, religious considerations..."
          maxLength={500}
          rows={4}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{responses.additional_notes.length}/500 characters</p>
      </div>
    </div>
  );
}

// Step 7: Confirmation
function Step7Confirmation({
  responses,
  isQuranSubject,
  isParent
}: {
  responses: QuestionnaireResponses;
  isQuranSubject: boolean;
  isParent: boolean;
}) {
  const getSubjectLabel = (id: string) => {
    const subjects: Record<string, string> = {
      quran_reading: 'Quran Reading',
      quran_memorization: 'Quran Memorization',
      arabic_language: 'Arabic Language',
      tajweed: 'Tajweed',
      islamic_studies: 'Islamic Studies'
    };
    return subjects[id] || id;
  };

  const getLevelLabel = (id: string) => {
    const levels: Record<string, string> = {
      beginner: 'Complete beginner',
      some_exposure: 'Some exposure',
      intermediate: 'Intermediate',
      advanced: 'Advanced'
    };
    return levels[id] || id;
  };

  const getPriorityLabel = (id: string) => {
    const priorities: Record<string, string> = {
      understanding_first: 'Understanding first',
      fluency_first: 'Fluency first',
      balanced: 'Balanced approach',
      memorization_first: 'Memorization first',
      guidance_needed: 'Guidance needed'
    };
    return priorities[id] || id;
  };

  const getLearningStyleLabel = (id: string) => {
    const styles: Record<string, string> = {
      visual: 'Visual',
      auditory: 'Auditory',
      reading_writing: 'Reading/Writing',
      hands_on: 'Hands-on'
    };
    return styles[id] || id;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
          <Check className="w-5 h-5 text-emerald-600" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Review Your Information</h2>
      </div>

      <div className="bg-gray-50 rounded-xl border border-gray-200 divide-y divide-gray-200">
        {/* Student Info */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">{isParent ? "Child" : "Student"}</h3>
          <p className="text-gray-600">
            {responses.student_name} {responses.student_surname && responses.student_surname}, Age {responses.student_age}, {responses.student_gender === 'male' ? 'Male' : 'Female'}
          </p>
          {isParent && responses.num_children > 1 && (
            <p className="text-emerald-600 text-sm mt-1">
              + {responses.num_children - 1} additional child{responses.num_children > 2 ? 'ren' : ''} (sibling discount available)
            </p>
          )}
        </div>

        {/* Subjects & Level */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Subjects & Level</h3>
          <div className="flex flex-wrap gap-2 mb-2">
            {responses.selected_subjects.length > 0 ? (
              responses.selected_subjects.map(subject => (
                <span
                  key={subject}
                  className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm"
                >
                  {getSubjectLabel(subject)}
                </span>
              ))
            ) : (
              <span className="text-gray-600">{getSubjectLabel(responses.primary_subject)}</span>
            )}
          </div>
          <p className="text-gray-500 text-sm">{getLevelLabel(responses.current_level)}</p>
        </div>

        {/* Goals */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Goals</h3>
          <p className="text-gray-600 text-sm">{responses.specific_goals}</p>
        </div>

        {/* Learning Priority (Quran only) */}
        {isQuranSubject && responses.learning_priority && (
          <div className="p-4">
            <h3 className="font-semibold text-gray-900 mb-2">Learning Priority</h3>
            <p className="text-gray-600">{getPriorityLabel(responses.learning_priority)}</p>
          </div>
        )}

        {/* Challenges */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Challenges</h3>
          <div className="flex flex-wrap gap-2">
            {responses.main_challenges.map(challenge => (
              <span
                key={challenge}
                className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm"
              >
                {challenge.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>

        {/* Learning Styles */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Learning Styles</h3>
          <div className="flex flex-wrap gap-2">
            {responses.learning_styles.length > 0 ? (
              responses.learning_styles.map(style => (
                <span
                  key={style}
                  className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                >
                  {getLearningStyleLabel(style)}
                </span>
              ))
            ) : responses.learning_style ? (
              <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm">
                {getLearningStyleLabel(responses.learning_style)}
              </span>
            ) : null}
          </div>
        </div>

        {/* Schedule */}
        <div className="p-4">
          <h3 className="font-semibold text-gray-900 mb-2">Preferred Schedule</h3>
          <div className="flex flex-wrap gap-2">
            {responses.preferred_schedule.map(schedule => (
              <span
                key={schedule}
                className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm"
              >
                {schedule.replace(/_/g, ' ')}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* What's Next */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-6">
        <h3 className="font-bold text-gray-900 mb-3">What Happens Next?</h3>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">1</span>
            <span>Our AI will analyse your responses and create a preliminary assessment</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">2</span>
            <span>You'll book a FREE 20-minute diagnostic session with a teacher</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">3</span>
            <span>The teacher will evaluate {isParent ? "your child" : "you"} live and add their assessment</span>
          </li>
          <li className="flex items-start gap-3">
            <span className="w-6 h-6 bg-emerald-500 text-white rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold">4</span>
            <span>You'll receive a detailed assessment report with personalised recommendations</span>
          </li>
        </ol>
      </div>
    </div>
  );
}
