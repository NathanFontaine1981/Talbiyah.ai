import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Trophy, Brain, ChevronRight, RotateCcw, Sparkles } from 'lucide-react';

interface QuizQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface SurahQuizData {
  surahNumber: number;
  surahName: string;
  surahNameArabic: string;
  theme: string;
  questions: QuizQuestion[];
}

// Quiz data for common surahs
const SURAH_QUIZZES: { [key: number]: SurahQuizData } = {
  1: {
    surahNumber: 1,
    surahName: 'Al-Fatihah',
    surahNameArabic: 'الفاتحة',
    theme: 'The Opening - Foundation of Prayer',
    questions: [
      {
        question: 'What is Al-Fatihah often called?',
        options: ['The Closer', 'The Opening', 'The Middle', 'The End'],
        correctAnswer: 1,
        explanation: 'Al-Fatihah means "The Opening" as it opens the Quran and every unit of prayer.'
      },
      {
        question: 'Which path do we ask Allah to guide us to in Al-Fatihah?',
        options: ['The easy path', 'The straight path', 'The short path', 'The hidden path'],
        correctAnswer: 1,
        explanation: 'We ask Allah to guide us to "As-Sirat Al-Mustaqeem" - the straight path.'
      },
      {
        question: 'How many verses does Al-Fatihah have?',
        options: ['5', '6', '7', '8'],
        correctAnswer: 2,
        explanation: 'Al-Fatihah has 7 verses and is also called "As-Sab al-Mathani" (The Seven Oft-Repeated).'
      }
    ]
  },
  112: {
    surahNumber: 112,
    surahName: 'Al-Ikhlas',
    surahNameArabic: 'الإخلاص',
    theme: 'Pure Monotheism - Oneness of Allah',
    questions: [
      {
        question: 'What does "Al-Ikhlas" mean?',
        options: ['The Prayer', 'The Sincerity/Purity', 'The Mercy', 'The Light'],
        correctAnswer: 1,
        explanation: 'Al-Ikhlas means "The Sincerity" or "The Purity" referring to pure monotheism.'
      },
      {
        question: 'What is the main theme of Surah Al-Ikhlas?',
        options: ['Stories of prophets', 'The Oneness of Allah', 'Day of Judgement', 'Paradise'],
        correctAnswer: 1,
        explanation: 'The surah declares the absolute Oneness of Allah (Tawhid) - that He is One, Eternal, and has no equal.'
      },
      {
        question: 'This surah is said to be equivalent to how much of the Quran?',
        options: ['One quarter', 'One third', 'One half', 'The whole Quran'],
        correctAnswer: 1,
        explanation: 'The Prophet (PBUH) said Al-Ikhlas is equivalent to one-third of the Quran in reward.'
      }
    ]
  },
  113: {
    surahNumber: 113,
    surahName: 'Al-Falaq',
    surahNameArabic: 'الفلق',
    theme: 'Seeking Refuge - Protection from Evil',
    questions: [
      {
        question: 'What does "Al-Falaq" mean?',
        options: ['The Night', 'The Daybreak/Dawn', 'The Stars', 'The Moon'],
        correctAnswer: 1,
        explanation: 'Al-Falaq means "The Daybreak" or "The Dawn" - we seek refuge in the Lord of the Dawn.'
      },
      {
        question: 'What do we seek protection from in this surah?',
        options: ['Only hunger', 'Evil of creation', 'Only illness', 'Only poverty'],
        correctAnswer: 1,
        explanation: 'We seek protection from the evil of what Allah has created, darkness, envy, and magic.'
      },
      {
        question: 'Al-Falaq and An-Nas together are called:',
        options: ['Al-Fatiha', 'Al-Mu\'awwidhatayn', 'Al-Kursi', 'Al-Baqarah'],
        correctAnswer: 1,
        explanation: 'They are called Al-Mu\'awwidhatayn (The Two Protectors) as both seek refuge in Allah.'
      }
    ]
  },
  114: {
    surahNumber: 114,
    surahName: 'An-Nas',
    surahNameArabic: 'الناس',
    theme: 'Protection from Whispers',
    questions: [
      {
        question: 'What does "An-Nas" mean?',
        options: ['The Angels', 'The Mankind', 'The Jinn', 'The Prophets'],
        correctAnswer: 1,
        explanation: 'An-Nas means "The Mankind" - we seek refuge in the Lord of mankind.'
      },
      {
        question: 'What evil do we seek protection from in An-Nas?',
        options: ['Wild animals', 'The whisperer (Shaytan)', 'Natural disasters', 'Illness'],
        correctAnswer: 1,
        explanation: 'We seek protection from the evil of the retreating whisperer (Shaytan) who whispers into hearts.'
      },
      {
        question: 'The whisperer whispers into:',
        options: ['The ears of people', 'The hearts/chests of people', 'The minds of people', 'The hands of people'],
        correctAnswer: 1,
        explanation: 'The whisperer whispers into the chests (hearts) of mankind, from among jinn and mankind.'
      }
    ]
  },
  36: {
    surahNumber: 36,
    surahName: 'Ya-Sin',
    surahNameArabic: 'يس',
    theme: 'The Heart of the Quran',
    questions: [
      {
        question: 'Ya-Sin is often called:',
        options: ['The Hand of the Quran', 'The Heart of the Quran', 'The Eye of the Quran', 'The Foot of the Quran'],
        correctAnswer: 1,
        explanation: 'Ya-Sin is called the Heart of the Quran due to its central themes and spiritual significance.'
      },
      {
        question: 'What major themes are covered in Ya-Sin?',
        options: ['Only fasting rules', 'Resurrection, Prophethood, Tawhid', 'Only trade laws', 'Only marriage laws'],
        correctAnswer: 1,
        explanation: 'Ya-Sin covers the core themes of resurrection, the truth of prophethood, and the Oneness of Allah.'
      },
      {
        question: 'The surah mentions the story of messengers sent to which city?',
        options: ['Makkah', 'Madinah', 'A city (Antioch)', 'Jerusalem'],
        correctAnswer: 2,
        explanation: 'It mentions messengers sent to "the companions of the city" (traditionally identified as Antioch).'
      }
    ]
  },
  67: {
    surahNumber: 67,
    surahName: 'Al-Mulk',
    surahNameArabic: 'الملك',
    theme: 'The Sovereignty - Protection in the Grave',
    questions: [
      {
        question: 'What does "Al-Mulk" mean?',
        options: ['The Prayer', 'The Sovereignty/Dominion', 'The Mercy', 'The Light'],
        correctAnswer: 1,
        explanation: 'Al-Mulk means "The Sovereignty" or "The Dominion" - referring to Allah\'s complete control.'
      },
      {
        question: 'Reciting Al-Mulk before sleep is said to:',
        options: ['Give wealth', 'Protect from punishment of the grave', 'Cure illness', 'Bring rain'],
        correctAnswer: 1,
        explanation: 'The Prophet (PBUH) said it intercedes for its reciter until they are forgiven, protecting from grave punishment.'
      },
      {
        question: 'How many verses does Al-Mulk have?',
        options: ['20', '25', '30', '35'],
        correctAnswer: 2,
        explanation: 'Al-Mulk has 30 verses and is also called "Al-Munjiyah" (The Saviour) and "Al-Waqiyah" (The Protector).'
      }
    ]
  },
  18: {
    surahNumber: 18,
    surahName: 'Al-Kahf',
    surahNameArabic: 'الكهف',
    theme: 'The Cave - Protection from Trials',
    questions: [
      {
        question: 'What does "Al-Kahf" mean?',
        options: ['The Mountain', 'The Cave', 'The Valley', 'The Desert'],
        correctAnswer: 1,
        explanation: 'Al-Kahf means "The Cave" referring to the cave where young believers sought refuge.'
      },
      {
        question: 'Reciting Al-Kahf on which day is recommended?',
        options: ['Monday', 'Wednesday', 'Friday', 'Sunday'],
        correctAnswer: 2,
        explanation: 'Reciting Al-Kahf on Friday brings light from one Friday to the next, as mentioned in hadith.'
      },
      {
        question: 'Memorising the first 10 verses protects from:',
        options: ['Poverty', 'Dajjal (the Antichrist)', 'Illness', 'Bad dreams'],
        correctAnswer: 1,
        explanation: 'The Prophet (PBUH) said memorising the first 10 verses protects from the trial of Dajjal.'
      }
    ]
  }
};

interface SurahUnderstandingQuizProps {
  surahNumber: number;
  onComplete?: (passed: boolean, score: number, total: number) => void;
  onClose?: () => void;
}

export default function SurahUnderstandingQuiz({ surahNumber, onComplete, onClose }: SurahUnderstandingQuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [quizComplete, setQuizComplete] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);

  const quizData = SURAH_QUIZZES[surahNumber];

  useEffect(() => {
    if (quizData) {
      setAnswers(new Array(quizData.questions.length).fill(null));
    }
  }, [surahNumber]);

  if (!quizData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center">
        <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Quiz Not Available
        </h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Understanding quiz for this surah is coming soon.
        </p>
        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg"
          >
            Close
          </button>
        )}
      </div>
    );
  }

  const question = quizData.questions[currentQuestion];
  const totalQuestions = quizData.questions.length;
  const passingScore = Math.ceil(totalQuestions * 0.7); // 70% to pass

  function handleAnswerSelect(answerIndex: number) {
    if (showResult) return;
    setSelectedAnswer(answerIndex);
  }

  function handleSubmitAnswer() {
    if (selectedAnswer === null) return;

    const newAnswers = [...answers];
    newAnswers[currentQuestion] = selectedAnswer;
    setAnswers(newAnswers);

    if (selectedAnswer === question.correctAnswer) {
      setScore(score + 1);
    }

    setShowResult(true);
  }

  function handleNextQuestion() {
    if (currentQuestion < totalQuestions - 1) {
      setCurrentQuestion(currentQuestion + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      setQuizComplete(true);
      const finalScore = selectedAnswer === question.correctAnswer ? score + 1 : score;
      const passed = finalScore >= passingScore;
      onComplete?.(passed, finalScore, totalQuestions);
    }
  }

  function handleRetry() {
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setScore(0);
    setQuizComplete(false);
    setAnswers(new Array(totalQuestions).fill(null));
  }

  if (quizComplete) {
    const finalScore = score;
    const passed = finalScore >= passingScore;
    const percentage = Math.round((finalScore / totalQuestions) * 100);

    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6">
        <div className="text-center">
          {passed ? (
            <>
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
              </div>
              <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
                Excellent!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                You have demonstrated understanding of {quizData.surahName}
              </p>
            </>
          ) : (
            <>
              <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <Brain className="w-10 h-10 text-amber-600 dark:text-amber-400" />
              </div>
              <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mb-2">
                Keep Learning!
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Review the surah and try again to improve your understanding
              </p>
            </>
          )}

          <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-4 mb-6">
            <p className="text-3xl font-bold text-gray-900 dark:text-white">{percentage}%</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {finalScore} out of {totalQuestions} correct
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {passed ? 'Understanding verified' : `Need ${passingScore} correct to pass`}
            </p>
          </div>

          <div className="flex gap-3 justify-center">
            <button
              onClick={handleRetry}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              <RotateCcw className="w-4 h-4" />
              Try Again
            </button>
            {onClose && (
              <button
                onClick={onClose}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
              >
                Done
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-4 text-white">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            <span className="font-semibold">Understanding Quiz</span>
          </div>
          <span className="text-purple-200 text-sm">
            {currentQuestion + 1} / {totalQuestions}
          </span>
        </div>
        <h3 className="text-lg font-bold">{quizData.surahName}</h3>
        <p className="text-purple-200 text-sm">{quizData.theme}</p>

        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-white rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestion + 1) / totalQuestions) * 100}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        <p className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          {question.question}
        </p>

        {/* Options */}
        <div className="space-y-3 mb-6">
          {question.options.map((option, index) => {
            const isSelected = selectedAnswer === index;
            const isCorrect = index === question.correctAnswer;
            const showCorrectness = showResult;

            let bgClass = 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600';
            let textClass = 'text-gray-900 dark:text-white';

            if (showCorrectness) {
              if (isCorrect) {
                bgClass = 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500';
                textClass = 'text-emerald-900 dark:text-emerald-100';
              } else if (isSelected && !isCorrect) {
                bgClass = 'bg-red-50 dark:bg-red-900/30 border-red-500';
                textClass = 'text-red-900 dark:text-red-100';
              }
            } else if (isSelected) {
              bgClass = 'bg-purple-50 dark:bg-purple-900/30 border-purple-500';
              textClass = 'text-purple-900 dark:text-purple-100';
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswerSelect(index)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl border-2 text-left transition ${bgClass} ${textClass} ${
                  !showResult ? 'hover:border-purple-400 dark:hover:border-purple-500' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showCorrectness && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  )}
                  {showCorrectness && isSelected && !isCorrect && (
                    <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Explanation (shown after answer) */}
        {showResult && (
          <div className={`p-4 rounded-xl mb-4 ${
            selectedAnswer === question.correctAnswer
              ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
              : 'bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800'
          }`}>
            <div className="flex items-start gap-2">
              <Sparkles className={`w-5 h-5 mt-0.5 ${
                selectedAnswer === question.correctAnswer
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-amber-600 dark:text-amber-400'
              }`} />
              <p className={`text-sm ${
                selectedAnswer === question.correctAnswer
                  ? 'text-emerald-800 dark:text-emerald-200'
                  : 'text-amber-800 dark:text-amber-200'
              }`}>
                {question.explanation}
              </p>
            </div>
          </div>
        )}

        {/* Action button */}
        {!showResult ? (
          <button
            onClick={handleSubmitAnswer}
            disabled={selectedAnswer === null}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-purple-700 transition"
          >
            Check Answer
          </button>
        ) : (
          <button
            onClick={handleNextQuestion}
            className="w-full py-3 bg-purple-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-purple-700 transition"
          >
            {currentQuestion < totalQuestions - 1 ? 'Next Question' : 'See Results'}
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>
    </div>
  );
}
