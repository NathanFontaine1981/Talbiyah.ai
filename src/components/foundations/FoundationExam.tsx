import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { type ExamQuestion } from '../../data/foundationCategories';

interface FoundationExamProps {
  videoId: string;
  videoTitle: string;
  onComplete: (score: number, passed: boolean) => void;
  onBack: () => void;
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
  const [showResults, setShowResults] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PASSING_SCORE = 70;

  useEffect(() => {
    loadExam();
  }, [videoId]);

  async function loadExam() {
    try {
      setLoading(true);
      setError(null);

      // Fetch exam from database
      const { data: exam, error: examError } = await supabase
        .from('foundation_exams')
        .select('*')
        .eq('video_id', videoId)
        .maybeSingle();

      if (examError) throw examError;

      if (exam && exam.questions && exam.questions.length > 0) {
        setQuestions(exam.questions);
      } else {
        // No exam exists yet - show placeholder
        setError('No exam available for this video yet. Check back soon!');
      }
    } catch (err) {
      console.error('Error loading exam:', err);
      setError('Failed to load exam. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectAnswer(questionIndex: number, answerIndex: number) {
    if (submitted) return;
    setSelectedAnswers({
      ...selectedAnswers,
      [questionIndex]: answerIndex
    });
  }

  function calculateScore(): number {
    let correct = 0;
    questions.forEach((q, index) => {
      if (selectedAnswers[index] === q.correctAnswer) {
        correct++;
      }
    });
    return Math.round((correct / questions.length) * 100);
  }

  function handleSubmit() {
    const score = calculateScore();
    const passed = score >= PASSING_SCORE;
    setSubmitted(true);
    setShowResults(true);
    onComplete(score, passed);
  }

  function handleNext() {
    if (currentQuestion < questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
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

        <div className="text-right">
          <p className="text-sm text-gray-500">Question</p>
          <p className="font-semibold text-gray-900">{currentQuestion + 1} / {questions.length}</p>
        </div>
      </div>

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
          <h2 className="text-lg font-semibold text-gray-900 mb-6">
            {currentQ.question}
          </h2>

          <div className="space-y-3">
            {currentQ.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestion] === index;
              const isCorrect = currentQ.correctAnswer === index;
              const showCorrect = submitted;

              let buttonClass = 'border-gray-200 hover:border-amber-300 hover:bg-amber-50';
              if (isSelected && !submitted) {
                buttonClass = 'border-amber-500 bg-amber-50';
              } else if (submitted) {
                if (isCorrect) {
                  buttonClass = 'border-emerald-500 bg-emerald-50';
                } else if (isSelected && !isCorrect) {
                  buttonClass = 'border-red-500 bg-red-50';
                }
              }

              return (
                <button
                  key={index}
                  onClick={() => handleSelectAnswer(currentQuestion, index)}
                  disabled={submitted}
                  className={`w-full text-left p-4 rounded-xl border-2 transition ${buttonClass} ${
                    submitted ? 'cursor-default' : 'cursor-pointer'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      isSelected
                        ? submitted
                          ? isCorrect
                            ? 'border-emerald-500 bg-emerald-500'
                            : 'border-red-500 bg-red-500'
                          : 'border-amber-500 bg-amber-500'
                        : showCorrect && isCorrect
                          ? 'border-emerald-500 bg-emerald-500'
                          : 'border-gray-300'
                    }`}>
                      {isSelected && (
                        submitted ? (
                          isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-white" />
                          ) : (
                            <XCircle className="w-4 h-4 text-white" />
                          )
                        ) : (
                          <div className="w-2 h-2 bg-white rounded-full" />
                        )
                      )}
                      {!isSelected && showCorrect && isCorrect && (
                        <CheckCircle className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <span className={`${
                      submitted && isCorrect ? 'text-emerald-700 font-medium' :
                      submitted && isSelected && !isCorrect ? 'text-red-700' :
                      'text-gray-700'
                    }`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation (after submit) */}
          {submitted && currentQ.explanation && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl"
            >
              <p className="text-blue-800 text-sm">
                <span className="font-semibold">Explanation:</span> {currentQ.explanation}
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

        {currentQuestion === questions.length - 1 ? (
          <button
            onClick={handleSubmit}
            disabled={answeredCount < questions.length || submitted}
            className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white rounded-xl font-semibold transition"
          >
            {submitted ? 'Submitted' : 'Submit Answers'}
          </button>
        ) : (
          <button
            onClick={handleNext}
            className="px-4 py-2 text-amber-600 hover:text-amber-700 font-medium transition"
          >
            Next →
          </button>
        )}
      </div>

      {/* Question Dots Navigation */}
      <div className="flex justify-center gap-2 mt-8">
        {questions.map((_, index) => {
          const isAnswered = selectedAnswers[index] !== undefined;
          const isCurrent = currentQuestion === index;

          return (
            <button
              key={index}
              onClick={() => setCurrentQuestion(index)}
              className={`w-3 h-3 rounded-full transition ${
                isCurrent
                  ? 'bg-amber-500'
                  : isAnswered
                    ? 'bg-amber-200'
                    : 'bg-gray-200'
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
