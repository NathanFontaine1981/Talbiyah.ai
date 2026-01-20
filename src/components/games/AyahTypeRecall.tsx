import { useState, useEffect, useRef } from 'react';
import { CheckCircle, XCircle, ChevronRight, Trophy, RotateCcw, Keyboard, Eye, EyeOff, HelpCircle } from 'lucide-react';

interface AyahData {
  surahNumber: number;
  ayahNumber: number;
  verseKey: string;
  arabicText: string;
  englishTranslation: string;
}

interface AyahTypeRecallProps {
  ayahs: AyahData[];
  surahName: string;
  onComplete: (correct: number, total: number) => void;
}

// Normalize Arabic text for comparison (remove diacritics)
function normalizeArabic(text: string): string {
  return text
    .replace(/[\u064B-\u065F]/g, '') // Remove tashkeel
    .replace(/\u0670/g, '') // Remove superscript alef
    .replace(/ٱ/g, 'ا') // Normalize alef wasla
    .replace(/ى/g, 'ي') // Normalize alef maqsura
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

// Extract first N words from Arabic text
function getFirstWords(text: string, count: number): string {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return words.slice(0, count).join(' ');
}

// Check if user input matches the expected Arabic
function checkMatch(userInput: string, expected: string): { isMatch: boolean; similarity: number } {
  const normalizedInput = normalizeArabic(userInput);
  const normalizedExpected = normalizeArabic(expected);

  // Exact match
  if (normalizedInput === normalizedExpected) {
    return { isMatch: true, similarity: 100 };
  }

  // Check if input is contained in expected or vice versa
  if (normalizedExpected.includes(normalizedInput) || normalizedInput.includes(normalizedExpected)) {
    const longer = normalizedInput.length > normalizedExpected.length ? normalizedInput : normalizedExpected;
    const shorter = normalizedInput.length > normalizedExpected.length ? normalizedExpected : normalizedInput;
    const similarity = Math.round((shorter.length / longer.length) * 100);
    return { isMatch: similarity >= 70, similarity };
  }

  // Calculate Levenshtein-like similarity
  const maxLen = Math.max(normalizedInput.length, normalizedExpected.length);
  if (maxLen === 0) return { isMatch: false, similarity: 0 };

  let matchingChars = 0;
  const minLen = Math.min(normalizedInput.length, normalizedExpected.length);

  for (let i = 0; i < minLen; i++) {
    if (normalizedInput[i] === normalizedExpected[i]) {
      matchingChars++;
    }
  }

  const similarity = Math.round((matchingChars / maxLen) * 100);
  return { isMatch: similarity >= 70, similarity };
}

export default function AyahTypeRecall({ ayahs, surahName, onComplete }: AyahTypeRecallProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userInput, setUserInput] = useState('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [correctCount, setCorrectCount] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentAyah = ayahs[currentIndex];
  const progress = ((currentIndex + 1) / ayahs.length) * 100;

  // Get first 3 words for comparison
  const expectedWords = currentAyah ? getFirstWords(currentAyah.arabicText, 3) : '';

  // Reset state when ayahs change
  useEffect(() => {
    setCurrentIndex(0);
    setUserInput('');
    setShowAnswer(false);
    setShowHint(false);
    setIsCorrect(null);
    setCorrectCount(0);
    setIsComplete(false);
  }, [ayahs]);

  // Focus input when moving to next question
  useEffect(() => {
    if (!showAnswer && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentIndex, showAnswer]);

  function handleSubmit() {
    if (!userInput.trim()) return;

    const { isMatch } = checkMatch(userInput, expectedWords);
    setIsCorrect(isMatch);
    setShowAnswer(true);

    if (isMatch) {
      setCorrectCount(prev => prev + 1);
    }
  }

  function handleSkip() {
    setShowAnswer(true);
    setIsCorrect(false);
  }

  function handleNext() {
    if (currentIndex + 1 >= ayahs.length) {
      setIsComplete(true);
      onComplete(
        isCorrect ? correctCount + 1 : correctCount,
        ayahs.length
      );
      return;
    }

    setCurrentIndex(prev => prev + 1);
    setUserInput('');
    setShowAnswer(false);
    setShowHint(false);
    setIsCorrect(null);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setUserInput('');
    setShowAnswer(false);
    setShowHint(false);
    setIsCorrect(null);
    setCorrectCount(0);
    setIsComplete(false);
  }

  function toggleHint() {
    setShowHint(!showHint);
  }

  if (!currentAyah) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No ayahs available
      </div>
    );
  }

  if (isComplete) {
    const accuracy = Math.round((correctCount / ayahs.length) * 100);
    return (
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-2xl border-2 border-orange-200 dark:border-orange-800 p-8 text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-orange-800 dark:text-orange-200 mb-2">
          Type Recall Complete!
        </h3>
        <p className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">
          {accuracy}%
        </p>
        <p className="text-orange-700 dark:text-orange-300 mb-6">
          {correctCount} out of {ayahs.length} correct
        </p>
        <button
          onClick={handleRestart}
          className="px-6 py-3 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition flex items-center gap-2 mx-auto"
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
          <span>Question {currentIndex + 1} of {ayahs.length}</span>
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-emerald-500" />
            {correctCount} correct
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-amber-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
        <div className="flex items-center gap-2 mb-4">
          <Keyboard className="w-5 h-5 text-orange-500" />
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {surahName} - Ayah {currentAyah.ayahNumber}
          </span>
        </div>

        {/* English translation prompt */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-5 mb-6">
          <p className="text-lg text-orange-900 dark:text-orange-100 leading-relaxed">
            "{currentAyah.englishTranslation}"
          </p>
        </div>

        {/* Instruction */}
        <div className="mb-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
            Type the <strong>first 2-3 words</strong> of this ayah in Arabic:
          </p>

          {/* Hint toggle */}
          {!showAnswer && (
            <button
              onClick={toggleHint}
              className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              {showHint ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              {showHint ? 'Hide hint' : 'Show hint (first letter)'}
            </button>
          )}

          {/* Hint display */}
          {showHint && !showAnswer && (
            <div className="mt-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-700 dark:text-blue-300 font-arabic text-xl" dir="rtl">
                {expectedWords.charAt(0)}...
              </p>
            </div>
          )}
        </div>

        {/* Input area */}
        {!showAnswer ? (
          <div className="space-y-4">
            <textarea
              ref={inputRef}
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              placeholder="اكتب هنا..."
              className="w-full h-24 p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 text-right font-arabic text-2xl focus:border-orange-400 dark:focus:border-orange-600 focus:outline-none resize-none"
              dir="rtl"
            />

            <div className="flex gap-3">
              <button
                onClick={handleSkip}
                className="flex-1 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition flex items-center justify-center gap-2"
              >
                <HelpCircle className="w-5 h-5" />
                Show Answer
              </button>
              <button
                onClick={handleSubmit}
                disabled={!userInput.trim()}
                className="flex-1 py-3 rounded-xl bg-orange-600 text-white hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2 font-medium"
              >
                <CheckCircle className="w-5 h-5" />
                Check Answer
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Result feedback */}
            <div className={`p-4 rounded-xl border ${
              isCorrect
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <div className="flex items-center gap-2 mb-2">
                {isCorrect ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-emerald-500" />
                    <span className="font-medium text-emerald-700 dark:text-emerald-300">Correct!</span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-5 h-5 text-red-500" />
                    <span className="font-medium text-red-700 dark:text-red-300">Not quite right</span>
                  </>
                )}
              </div>

              {userInput && (
                <div className="mb-3">
                  <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Your answer:</p>
                  <p className="font-arabic text-xl text-gray-700 dark:text-gray-300" dir="rtl">
                    {userInput}
                  </p>
                </div>
              )}

              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Expected (first words):</p>
                <p className={`font-arabic text-xl ${
                  isCorrect ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-700 dark:text-gray-300'
                }`} dir="rtl">
                  {expectedWords}
                </p>
              </div>
            </div>

            {/* Full ayah reveal */}
            <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Full Ayah:</p>
              <p className="font-arabic text-xl text-gray-800 dark:text-gray-200 leading-loose" dir="rtl">
                {currentAyah.arabicText}
              </p>
            </div>

            {/* Next button */}
            <button
              onClick={handleNext}
              className="w-full py-4 bg-orange-600 text-white rounded-xl hover:bg-orange-700 transition flex items-center justify-center gap-2 font-medium"
            >
              {currentIndex + 1 >= ayahs.length ? 'See Results' : 'Next Ayah'}
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
