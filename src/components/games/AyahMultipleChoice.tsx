import { useState, useEffect, useMemo } from 'react';
import { CheckCircle, XCircle, ChevronRight, Trophy, RotateCcw, Target } from 'lucide-react';

interface AyahData {
  surahNumber: number;
  ayahNumber: number;
  verseKey: string;
  arabicText: string;
  englishTranslation: string;
}

interface AyahResult {
  ayahNumber: number;
  correct: boolean;
}

interface AyahMultipleChoiceProps {
  ayahs: AyahData[];
  surahName: string;
  onComplete: (correct: number, total: number, results: AyahResult[]) => void;
}

interface Question {
  ayah: AyahData;
  options: AyahData[];
  correctIndex: number;
}

// Shuffle array using Fisher-Yates algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function AyahMultipleChoice({ ayahs, surahName, onComplete }: AyahMultipleChoiceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [ayahResults, setAyahResults] = useState<AyahResult[]>([]);

  // Generate questions with shuffled options
  const questions = useMemo(() => {
    return ayahs.map(ayah => {
      // Get 3 random distractors from other ayahs in the same surah
      const otherAyahs = ayahs.filter(a => a.ayahNumber !== ayah.ayahNumber);
      const distractors = shuffleArray(otherAyahs).slice(0, Math.min(3, otherAyahs.length));

      // Combine correct answer with distractors and shuffle
      const allOptions = [ayah, ...distractors];
      const shuffledOptions = shuffleArray(allOptions);

      // Find the correct answer index after shuffle
      const correctIndex = shuffledOptions.findIndex(o => o.ayahNumber === ayah.ayahNumber);

      return {
        ayah,
        options: shuffledOptions,
        correctIndex,
      };
    });
  }, [ayahs]);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  // Reset state when ayahs change
  useEffect(() => {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setCorrectCount(0);
    setIsComplete(false);
    setAyahResults([]);
  }, [ayahs]);

  function handleOptionSelect(index: number) {
    if (showAnswer) return;

    setSelectedOption(index);
    setShowAnswer(true);

    const isCorrect = index === currentQuestion.correctIndex;
    if (isCorrect) {
      setCorrectCount(prev => prev + 1);
    }

    // Track this ayah's result
    setAyahResults(prev => [...prev, {
      ayahNumber: currentQuestion.ayah.ayahNumber,
      correct: isCorrect
    }]);
  }

  function handleNext() {
    if (currentIndex + 1 >= questions.length) {
      setIsComplete(true);
      const finalCorrect = selectedOption === currentQuestion.correctIndex ? correctCount + 1 : correctCount;
      onComplete(finalCorrect, questions.length, ayahResults);
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setSelectedOption(null);
    setShowAnswer(false);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setSelectedOption(null);
    setShowAnswer(false);
    setCorrectCount(0);
    setIsComplete(false);
    setAyahResults([]);
  }

  function getOptionStyle(index: number) {
    if (!showAnswer) {
      return 'border-gray-200 dark:border-gray-700 hover:border-purple-400 dark:hover:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20';
    }

    if (index === currentQuestion.correctIndex) {
      return 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30';
    }

    if (selectedOption === index && index !== currentQuestion.correctIndex) {
      return 'border-red-500 bg-red-50 dark:bg-red-900/30';
    }

    return 'border-gray-200 dark:border-gray-700 opacity-50';
  }

  if (!currentQuestion) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No questions available
      </div>
    );
  }

  if (isComplete) {
    const accuracy = Math.round((correctCount / questions.length) * 100);
    return (
      <div className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border-2 border-purple-200 dark:border-purple-800 p-8 text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-purple-800 dark:text-purple-200 mb-2">
          Quiz Complete!
        </h3>
        <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mb-2">
          {accuracy}%
        </p>
        <p className="text-purple-700 dark:text-purple-300 mb-6">
          {correctCount} out of {questions.length} correct
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center gap-2 mx-auto"
        >
          <RotateCcw className="w-5 h-5" />
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {correctCount} correct
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-purple-400 to-indigo-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-5 h-5 text-purple-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {surahName} - Which ayah matches this translation?
          </span>
        </div>

        {/* English translation (question) */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-5 mb-6">
          <p className="text-lg text-purple-900 dark:text-purple-100 leading-relaxed">
            "{currentQuestion.ayah.englishTranslation}"
          </p>
        </div>

        {/* Options */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, index) => (
            <button
              key={`${option.ayahNumber}-${index}`}
              onClick={() => handleOptionSelect(index)}
              disabled={showAnswer}
              className={`w-full p-4 rounded-xl border-2 text-right transition ${getOptionStyle(index)} ${
                showAnswer ? 'cursor-default' : 'cursor-pointer'
              }`}
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-sm font-medium text-gray-600 dark:text-gray-300">
                    {String.fromCharCode(65 + index)}
                  </span>
                  {showAnswer && index === currentQuestion.correctIndex && (
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                  )}
                  {showAnswer && selectedOption === index && index !== currentQuestion.correctIndex && (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                </div>
                <p className="font-arabic text-xl text-gray-800 dark:text-gray-200" dir="rtl">
                  {option.arabicText}
                </p>
              </div>
              {showAnswer && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2 text-left">
                  Ayah {option.ayahNumber}
                </p>
              )}
            </button>
          ))}
        </div>

        {/* Feedback and next button */}
        {showAnswer && (
          <div className="mt-6">
            <div className={`p-4 rounded-xl mb-4 ${
              selectedOption === currentQuestion.correctIndex
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
            }`}>
              <p className={`font-medium ${
                selectedOption === currentQuestion.correctIndex
                  ? 'text-emerald-700 dark:text-emerald-300'
                  : 'text-red-700 dark:text-red-300'
              }`}>
                {selectedOption === currentQuestion.correctIndex
                  ? 'Correct! Well done!'
                  : `Incorrect. The correct answer is Ayah ${currentQuestion.ayah.ayahNumber}.`}
              </p>
            </div>

            <button
              onClick={handleNext}
              className="w-full py-4 bg-purple-600 text-white rounded-xl hover:bg-purple-700 transition flex items-center justify-center gap-2 font-medium"
            >
              {currentIndex + 1 >= questions.length ? 'See Results' : 'Next Question'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
