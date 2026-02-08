import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  XCircle,
  Brain,
  Shuffle,
  Trophy,
  RotateCcw,
  Sparkles,
  Target
} from 'lucide-react';
import { salahPositions, getAllRecitations, getUniqueWords, type ArabicWord } from '../../data/salahData';

interface QuizModeProps {
  completedPositions: string[];
  onQuizComplete: (score: number, quizType: string) => void;
  onBack: () => void;
}

type QuizType = 'select' | 'match-meaning' | 'complete-phrase' | 'results';

interface Question {
  id: string;
  arabic: string;
  transliteration: string;
  correctAnswer: string;
  options: string[];
  context?: string;
}

export default function QuizMode({
  completedPositions,
  onQuizComplete,
  onBack
}: QuizModeProps) {
  const [quizType, setQuizType] = useState<QuizType>('select');
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  const uniqueWords = useMemo(() => getUniqueWords(), []);

  const generateMatchMeaningQuestions = (): Question[] => {
    const shuffled = [...uniqueWords].sort(() => Math.random() - 0.5).slice(0, 10);
    return shuffled.map((word, index) => {
      const wrongOptions = uniqueWords
        .filter(w => w.meaning !== word.meaning)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.meaning);

      const options = [word.meaning, ...wrongOptions].sort(() => Math.random() - 0.5);

      return {
        id: `match-${index}`,
        arabic: word.arabic,
        transliteration: word.transliteration,
        correctAnswer: word.meaning,
        options
      };
    });
  };

  const generateCompletePhraseQuestions = (): Question[] => {
    const recitations = getAllRecitations().filter(r => r.words.length >= 2);
    const shuffled = recitations.sort(() => Math.random() - 0.5).slice(0, 10);

    return shuffled.map((rec, index) => {
      // Pick a random word to blank out
      const blankIndex = Math.floor(Math.random() * rec.words.length);
      const blankWord = rec.words[blankIndex];

      // Create the phrase with blank
      const phraseWithBlank = rec.words.map((w, i) =>
        i === blankIndex ? '______' : w.arabic
      ).join(' ');

      // Get wrong options from other recitations
      const wrongOptions = getAllRecitations()
        .flatMap(r => r.words)
        .filter(w => w.arabic !== blankWord.arabic)
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map(w => w.arabic);

      const options = [blankWord.arabic, ...wrongOptions].sort(() => Math.random() - 0.5);

      return {
        id: `complete-${index}`,
        arabic: phraseWithBlank,
        transliteration: rec.transliteration,
        correctAnswer: blankWord.arabic,
        options,
        context: rec.translation
      };
    });
  };

  const startQuiz = (type: 'match-meaning' | 'complete-phrase') => {
    setQuizType(type);
    setCurrentIndex(0);
    setScore(0);
    setStreak(0);
    setSelectedAnswer(null);
    setIsAnswered(false);

    if (type === 'match-meaning') {
      setQuestions(generateMatchMeaningQuestions());
    } else {
      setQuestions(generateCompletePhraseQuestions());
    }
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const isCorrect = answer === questions[currentIndex].correctAnswer;
    if (isCorrect) {
      const bonus = streak >= 3 ? 20 : streak >= 2 ? 10 : 0;
      setScore(prev => prev + 100 + bonus);
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswered(false);
    } else {
      // Quiz complete
      onQuizComplete(score, quizType);
      setQuizType('results');
    }
  };

  const restartQuiz = () => {
    if (quizType === 'results') {
      setQuizType('select');
    } else {
      startQuiz(quizType as 'match-meaning' | 'complete-phrase');
    }
  };

  // Quiz Selection Screen
  const renderSelect = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 px-4 py-8"
    >
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-900/50 border-2 border-amber-500/50 flex items-center justify-center">
            <Brain className="w-10 h-10 text-amber-400" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Test Your Knowledge
          </h1>
          <p className="text-gray-600 text-lg">
            Choose a quiz type to challenge yourself
          </p>
        </div>

        {/* Quiz Types */}
        <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
          <button
            onClick={() => startQuiz('match-meaning')}
            className="group bg-white hover:bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-amber-500/50 transition-all text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-amber-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Target className="w-7 h-7 text-amber-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Match the Meaning
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              See an Arabic word and select its correct English meaning
            </p>
            <div className="flex items-center gap-2 text-amber-400 text-sm">
              <span>10 questions</span>
              <span className="text-amber-600">•</span>
              <span>100 XP each</span>
            </div>
          </button>

          <button
            onClick={() => startQuiz('complete-phrase')}
            className="group bg-white hover:bg-gray-50 rounded-2xl p-6 border border-gray-200 hover:border-emerald-500/50 transition-all text-left"
          >
            <div className="w-14 h-14 rounded-xl bg-emerald-900/50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Shuffle className="w-7 h-7 text-emerald-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Complete the Phrase
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Fill in the missing Arabic word to complete the recitation
            </p>
            <div className="flex items-center gap-2 text-emerald-400 text-sm">
              <span>10 questions</span>
              <span className="text-emerald-600">•</span>
              <span>100 XP each</span>
            </div>
          </button>
        </div>

        {/* Tip */}
        <div className="mt-8 text-center">
          <p className="text-gray-600 text-sm">
            Tip: Build a streak of correct answers for bonus XP!
          </p>
        </div>
      </div>
    </motion.div>
  );

  // Quiz Question Screen
  const renderQuestion = () => {
    const question = questions[currentIndex];
    if (!question) return null;

    const isCorrect = selectedAnswer === question.correctAnswer;
    const isMatchMeaning = quizType === 'match-meaning';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={`min-h-screen px-4 py-8 ${
          isMatchMeaning
            ? 'bg-gradient-to-br from-slate-950 via-amber-950/20 to-slate-950'
            : 'bg-gray-50'
        }`}
      >
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setQuizType('select')}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              Exit Quiz
            </button>
            <div className="flex items-center gap-4">
              {streak >= 2 && (
                <div className="flex items-center gap-1 text-amber-400 text-sm">
                  <Sparkles className="w-4 h-4" />
                  {streak} streak!
                </div>
              )}
              <div className="text-emerald-400 font-semibold">
                {score} XP
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Question {currentIndex + 1} of {questions.length}</span>
              <span>{Math.round(((currentIndex + 1) / questions.length) * 100)}%</span>
            </div>
            <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
              <motion.div
                className={`h-full rounded-full ${isMatchMeaning ? 'bg-amber-500' : 'bg-emerald-500'}`}
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Question Card */}
          <motion.div
            key={question.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-2xl p-8 border border-gray-200 mb-6"
          >
            <div className="text-center mb-6">
              <p className="text-gray-600 text-sm mb-4">
                {isMatchMeaning ? 'What does this word mean?' : 'Complete the phrase:'}
              </p>
              <p className="font-arabic text-4xl md:text-5xl text-gray-900 leading-loose" dir="rtl">
                {question.arabic}
              </p>
              <p className="text-gray-600 italic mt-2">
                {question.transliteration}
              </p>
              {question.context && (
                <p className="text-amber-200 text-sm mt-2">
                  "{question.context}"
                </p>
              )}
            </div>

            {/* Options */}
            <div className="space-y-3">
              {question.options.map((option, index) => {
                const isSelected = selectedAnswer === option;
                const isCorrectOption = option === question.correctAnswer;
                const showCorrect = isAnswered && isCorrectOption;
                const showWrong = isAnswered && isSelected && !isCorrectOption;

                return (
                  <button
                    key={index}
                    onClick={() => handleAnswer(option)}
                    disabled={isAnswered}
                    className={`w-full p-4 rounded-xl border text-left transition-all ${
                      showCorrect
                        ? 'bg-emerald-900/50 border-emerald-500 text-emerald-100'
                        : showWrong
                        ? 'bg-red-900/50 border-red-500 text-red-100'
                        : isSelected
                        ? 'bg-slate-700 border-slate-500 text-gray-900'
                        : 'bg-slate-800/50 border-gray-200 text-gray-600 hover:bg-slate-700/50 hover:border-slate-600'
                    } ${isAnswered && !showCorrect && !showWrong ? 'opacity-50' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={isMatchMeaning ? '' : 'font-arabic text-xl'} dir={isMatchMeaning ? 'ltr' : 'rtl'}>
                        {option}
                      </span>
                      {showCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400" />}
                      {showWrong && <XCircle className="w-5 h-5 text-red-400" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Feedback & Next Button */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-center"
              >
                <div className={`mb-4 inline-flex items-center gap-2 px-4 py-2 rounded-full ${
                  isCorrect
                    ? 'bg-emerald-900/50 text-emerald-300'
                    : 'bg-red-900/50 text-red-300'
                }`}>
                  {isCorrect ? (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      Correct! +{streak >= 3 ? 120 : streak >= 2 ? 110 : 100} XP
                    </>
                  ) : (
                    <>
                      <XCircle className="w-5 h-5" />
                      Not quite. The answer was: {question.correctAnswer}
                    </>
                  )}
                </div>
                <div>
                  <button
                    onClick={handleNext}
                    className={`inline-flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-colors ${
                      isMatchMeaning
                        ? 'bg-amber-600 hover:bg-amber-500 text-white'
                        : 'bg-emerald-600 hover:bg-emerald-500 text-white'
                    }`}
                  >
                    {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
                    <ArrowRight className="w-5 h-5" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    );
  };

  // Results Screen
  const renderResults = () => {
    const totalPossible = questions.length * 100;
    const percentage = Math.round((score / totalPossible) * 100);
    const grade = percentage >= 90 ? 'Excellent!' : percentage >= 70 ? 'Good job!' : percentage >= 50 ? 'Keep practicing!' : 'Try again!';

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gray-50 px-4 py-8 flex items-center justify-center"
      >
        <div className="max-w-md w-full">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-2xl p-8 border border-gray-200 text-center"
          >
            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-amber-900/50 border-2 border-amber-500/50 flex items-center justify-center">
              <Trophy className="w-10 h-10 text-amber-400" />
            </div>

            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              {grade}
            </h2>

            <p className="text-gray-600 mb-6">
              Quiz Complete
            </p>

            <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
              <div className="text-5xl font-bold text-amber-400 mb-2">
                {score}
              </div>
              <div className="text-gray-600">
                XP Earned
              </div>
              <div className="mt-4 text-sm text-gray-600">
                {percentage}% accuracy
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={restartQuiz}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-full font-medium transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
                Try Another Quiz
              </button>
              <button
                onClick={onBack}
                className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-gray-900 rounded-full font-medium transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Menu
              </button>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {quizType === 'select' && renderSelect()}
      {(quizType === 'match-meaning' || quizType === 'complete-phrase') && renderQuestion()}
      {quizType === 'results' && renderResults()}
    </AnimatePresence>
  );
}
