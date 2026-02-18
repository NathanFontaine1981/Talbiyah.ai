import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertCircle, Trophy, RotateCcw, Save, PlayCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { type ExamQuestion } from '../../data/foundationCategories';
import TextToSpeechButton from '../shared/TextToSpeechButton';

interface FoundationExamProps {
  videoId: string;
  videoTitle: string;
  onComplete: (score: number, passed: boolean) => void;
  onBack: () => void;
}

interface SavedProgress {
  currentQuestion: number;
  answers: Record<number, number>;
  answeredQuestions: number[];
}

export default function FoundationExam({
  videoId,
  videoTitle,
  onComplete,
  onBack
}: FoundationExamProps) {
  const [loading, setLoading] = useState(true);
  const [questions, setQuestions] = useState<ExamQuestion[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [passingScore, setPassingScore] = useState(80);
  const [userId, setUserId] = useState<string | null>(null);
  const [hasSavedProgress, setHasSavedProgress] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showResumePrompt, setShowResumePrompt] = useState(false);
  const [savedProgressData, setSavedProgressData] = useState<SavedProgress | null>(null);

  useEffect(() => {
    loadExam();
  }, [videoId]);

  async function loadExam() {
    try {
      setLoading(true);
      setError(null);

      // Check if user is logged in
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);

      // Fetch exam from database
      const { data: exam, error: examError } = await supabase
        .from('foundation_exams')
        .select('*')
        .eq('video_id', videoId)
        .maybeSingle();

      if (examError) throw examError;

      if (exam && exam.questions && exam.questions.length > 0) {
        setQuestions(exam.questions);
        if (exam.passing_score) {
          setPassingScore(exam.passing_score);
        }

        // Check for saved progress if user is logged in
        if (user) {
          const { data: progress } = await supabase
            .from('foundation_progress')
            .select('exam_in_progress')
            .eq('user_id', user.id)
            .eq('video_id', videoId)
            .maybeSingle();

          if (progress?.exam_in_progress) {
            const saved = progress.exam_in_progress as SavedProgress;
            if (saved.answeredQuestions && saved.answeredQuestions.length > 0) {
              setSavedProgressData(saved);
              setShowResumePrompt(true);
              setHasSavedProgress(true);
            }
          }
        }
      } else {
        setError('No exam available for this video yet. Check back soon!');
      }
    } catch (err) {
      console.error('Error loading exam:', err);
      setError('Failed to load exam. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function resumeSavedProgress() {
    if (savedProgressData) {
      setCurrentQuestion(savedProgressData.currentQuestion || 0);
      setSelectedAnswers(savedProgressData.answers || {});
      setAnsweredQuestions(new Set(savedProgressData.answeredQuestions || []));
    }
    setShowResumePrompt(false);
  }

  function startFresh() {
    // Clear saved progress in database
    clearSavedProgress();
    setShowResumePrompt(false);
  }

  const saveProgress = useCallback(async (
    answers: Record<number, number>,
    answered: Set<number>,
    currentQ: number
  ) => {
    if (!userId) return;

    try {
      setSaving(true);
      const progressData: SavedProgress = {
        currentQuestion: currentQ,
        answers: answers,
        answeredQuestions: Array.from(answered)
      };

      // Upsert progress
      const { error } = await supabase
        .from('foundation_progress')
        .upsert({
          user_id: userId,
          video_id: videoId,
          exam_in_progress: progressData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,video_id'
        });

      if (error) {
        console.error('Error saving progress:', error);
      } else {
        setHasSavedProgress(true);
      }
    } catch (err) {
      console.error('Error saving progress:', err);
    } finally {
      setSaving(false);
    }
  }, [userId, videoId]);

  async function clearSavedProgress() {
    if (!userId) return;

    try {
      await supabase
        .from('foundation_progress')
        .update({ exam_in_progress: null })
        .eq('user_id', userId)
        .eq('video_id', videoId);

      setHasSavedProgress(false);
    } catch (err) {
      console.error('Error clearing progress:', err);
    }
  }

  function handleSelectAnswer(questionIndex: number, answerIndex: number) {
    if (answeredQuestions.has(questionIndex)) return;

    const newAnswers = {
      ...selectedAnswers,
      [questionIndex]: answerIndex
    };
    const newAnswered = new Set(answeredQuestions).add(questionIndex);

    setSelectedAnswers(newAnswers);
    setAnsweredQuestions(newAnswered);

    // Auto-save progress for logged in users
    if (userId) {
      saveProgress(newAnswers, newAnswered, currentQuestion);
    }
  }

  function calculateScore(): { correct: number; total: number; percentage: number } {
    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: questions.length,
      percentage: Math.round((correct / questions.length) * 100)
    };
  }

  function handleFinish() {
    const { percentage } = calculateScore();
    const passed = percentage >= passingScore;
    setSubmitted(true);
    setShowResults(true);

    // Clear saved progress when completing the exam
    clearSavedProgress();

    onComplete(percentage, passed);
  }

  function handleRetry() {
    setSelectedAnswers({});
    setAnsweredQuestions(new Set());
    setCurrentQuestion(0);
    setSubmitted(false);
    setShowResults(false);

    // Clear saved progress
    clearSavedProgress();
  }

  function handleSaveAndExit() {
    // Progress is already auto-saved, just go back
    onBack();
  }

  function handleNext() {
    if (currentQuestion < questions.length - 1) {
      const newQuestion = currentQuestion + 1;
      setCurrentQuestion(newQuestion);

      // Save current question position
      if (userId && answeredQuestions.size > 0) {
        saveProgress(selectedAnswers, answeredQuestions, newQuestion);
      }
    }
  }

  function handlePrevious() {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  }

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <Loader2 className="w-10 h-10 text-amber-500 animate-spin mx-auto mb-4" />
        <p className="text-gray-600">Loading exam...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-8 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Exam Not Available</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={onBack}
            className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition"
          >
            Back to Video
          </button>
        </div>
      </div>
    );
  }

  // Resume prompt modal
  if (showResumePrompt) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white border border-gray-200 rounded-2xl p-8 text-center shadow-lg">
          <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <PlayCircle className="w-8 h-8 text-amber-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Resume Your Progress?</h3>
          <p className="text-gray-600 mb-2">
            You have saved progress on this exam.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            {savedProgressData?.answeredQuestions?.length || 0} of {questions.length} questions answered
          </p>

          <div className="flex gap-3">
            <button
              onClick={startFresh}
              className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition"
            >
              Start Fresh
            </button>
            <button
              onClick={resumeSavedProgress}
              className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition"
            >
              Resume
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQ = questions[currentQuestion];
  const answeredCount = Object.keys(selectedAnswers).length;
  const progressPercent = (answeredCount / questions.length) * 100;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Video</span>
        </button>

        <div className="flex items-center gap-4">
          {/* Save & Exit button for logged in users with progress */}
          {userId && answeredQuestions.size > 0 && answeredQuestions.size < questions.length && (
            <button
              onClick={handleSaveAndExit}
              className="flex items-center gap-2 px-3 py-1.5 text-sm text-amber-600 hover:text-amber-700 border border-amber-300 hover:border-amber-400 rounded-lg transition"
            >
              <Save className="w-4 h-4" />
              <span>Save & Exit</span>
              {saving && <Loader2 className="w-3 h-3 animate-spin" />}
            </button>
          )}

          <div className="text-right">
            <p className="text-sm text-gray-500">Question</p>
            <p className="font-semibold text-gray-900">{currentQuestion + 1} / {questions.length}</p>
          </div>
        </div>
      </div>

      {/* Auto-save indicator */}
      {userId && hasSavedProgress && (
        <div className="mb-4 text-xs text-gray-400 text-right">
          Progress auto-saved
        </div>
      )}

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-1 text-right">
          {answeredCount} of {questions.length} answered
        </p>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          className="bg-white rounded-2xl border border-gray-200 p-6 mb-6 shadow-sm"
        >
          <div className="flex items-start gap-3 mb-6">
            <h2 className="text-lg font-semibold text-gray-900 flex-1">
              {currentQ.question}
            </h2>
            <TextToSpeechButton
              text={`${currentQ.question} ${currentQ.options.map((o, i) => `Option ${i + 1}: ${o}`).join('. ')}`}
              sectionId={`exam-q-${currentQuestion}`}
              label="Question"
              variant="mini"
            />
          </div>

          <div className="space-y-3">
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestion] === index;
              const isCorrect = currentQ.correctAnswer === index;
              const isAnswered = answeredQuestions.has(currentQuestion);

              let buttonClass = 'border-gray-200 hover:border-amber-300 hover:bg-amber-50';
              if (isAnswered) {
                if (isCorrect) {
                  buttonClass = 'border-emerald-500 bg-emerald-50';
                } else if (isSelected && !isCorrect) {
                  buttonClass = 'border-red-500 bg-red-50';
                } else {
                  buttonClass = 'border-gray-200 bg-gray-50';
                }
              } else if (isSelected) {
                buttonClass = 'border-amber-500 bg-amber-50';
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(currentQuestion, index)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${buttonClass} ${
                    isAnswered ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isAnswered
                        ? isCorrect
                          ? 'border-emerald-500 bg-emerald-500'
                          : isSelected
                            ? 'border-red-500 bg-red-500'
                            : 'border-gray-300'
                        : isSelected
                          ? 'border-amber-500 bg-amber-500'
                          : 'border-gray-300'
                    }`}>
                      {isAnswered && isCorrect && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                      {isAnswered && isSelected && !isCorrect && (
                        <XCircle className="w-4 h-4 text-white" />
                      )}
                      {!isAnswered && isSelected && (
                        <div className="w-2 h-2 bg-white rounded-full" />
                      )}
                    </div>
                    <span className={`${
                      isAnswered && isCorrect ? 'text-emerald-700 font-medium' :
                      isAnswered && isSelected && !isCorrect ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation (shown immediately after answering) */}
          {answeredQuestions.has(currentQuestion) && currentQ.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mt-4 p-4 rounded-xl border ${
                selectedAnswers[currentQuestion] === currentQ.correctAnswer
                  ? 'bg-emerald-50 border-emerald-200'
                  : 'bg-amber-50 border-amber-200'
              }`}
            >
              <p className={`text-sm ${
                selectedAnswers[currentQuestion] === currentQ.correctAnswer
                  ? 'text-emerald-800'
                  : 'text-amber-800'
              }`}>
                <span className="font-semibold">
                  {selectedAnswers[currentQuestion] === currentQ.correctAnswer ? '✓ Correct! ' : '✗ Incorrect. '}
                </span>
                {currentQ.explanation}
              </p>
            </motion.div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition"
        >
          ← Previous
        </button>

        <div className="flex items-center gap-3">
          {/* Running Score */}
          {answeredQuestions.size > 0 && (
            <div className="text-sm text-gray-500">
              <span className="text-emerald-600 font-semibold">
                {calculateScore().correct}
              </span>
              /{answeredQuestions.size} correct
            </div>
          )}

          {currentQuestion === questions.length - 1 && answeredQuestions.size === questions.length ? (
            <button
              onClick={handleFinish}
              disabled={submitted}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition"
            >
              See Results
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={currentQuestion === questions.length - 1}
              className="px-4 py-2 text-amber-600 hover:text-amber-700 font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          )}
        </div>
      </div>

      {/* Question Dots Navigation */}
      <div className="flex justify-center gap-2 mt-8 flex-wrap">
        {questions.map((q, index) => {
          const isAnswered = answeredQuestions.has(index);
          const isCorrect = selectedAnswers[index] === q.correctAnswer;
          const isCurrent = currentQuestion === index;

          return (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-3 h-3 rounded-full transition ${
                isCurrent
                  ? 'ring-2 ring-amber-500 ring-offset-2'
                  : ''
              } ${
                isAnswered
                  ? isCorrect
                    ? 'bg-emerald-500'
                    : 'bg-red-400'
                  : 'bg-gray-200'
              }`}
              title={`Question ${index + 1}`}
            />
          );
        })}
      </div>

      {/* Results Modal */}
      {showResults && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-2xl p-8 max-w-md w-full text-center"
          >
            {calculateScore().percentage >= passingScore ? (
              <>
                <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Trophy className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Congratulations!</h2>
                <p className="text-gray-600 mb-4">You passed the exam!</p>
              </>
            ) : (
              <>
                <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <RotateCcw className="w-10 h-10 text-amber-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Keep Learning!</h2>
                <p className="text-gray-600 mb-4">You need {passingScore}% to pass. Try again!</p>
              </>
            )}

            <div className="bg-gray-50 rounded-xl p-4 mb-6">
              <div className="text-4xl font-bold text-gray-900 mb-1">
                {calculateScore().correct}/{calculateScore().total}
              </div>
              <div className="text-sm text-gray-500">
                {calculateScore().percentage}% correct
              </div>
              <div className="text-xs text-gray-400 mt-1">
                Passing score: {passingScore}%
              </div>
            </div>

            <div className="flex gap-3">
              {calculateScore().percentage >= passingScore ? (
                <button
                  onClick={onBack}
                  className="flex-1 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition"
                >
                  Continue
                </button>
              ) : (
                <>
                  <button
                    onClick={onBack}
                    className="flex-1 px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-semibold transition"
                  >
                    Review Video
                  </button>
                  <button
                    onClick={handleRetry}
                    className="flex-1 px-6 py-3 bg-amber-500 hover:bg-amber-600 text-white rounded-xl font-semibold transition"
                  >
                    Try Again
                  </button>
                </>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
