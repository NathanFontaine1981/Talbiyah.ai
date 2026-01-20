import { useState, useEffect } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, ChevronLeft, ChevronRight, RotateCcw, Trophy } from 'lucide-react';

interface AyahData {
  surahNumber: number;
  ayahNumber: number;
  verseKey: string;
  arabicText: string;
  englishTranslation: string;
}

interface AyahFlashcardProps {
  ayahs: AyahData[];
  surahName: string;
  onComplete: (correct: number, total: number) => void;
}

export default function AyahFlashcard({ ayahs, surahName, onComplete }: AyahFlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [unknownCount, setUnknownCount] = useState(0);
  const [reviewedAyahs, setReviewedAyahs] = useState<Set<number>>(new Set());
  const [isComplete, setIsComplete] = useState(false);

  const currentAyah = ayahs[currentIndex];
  const progress = (reviewedAyahs.size / ayahs.length) * 100;

  // Reset state when ayahs change
  useEffect(() => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setUnknownCount(0);
    setReviewedAyahs(new Set());
    setIsComplete(false);
  }, [ayahs]);

  function handleFlip() {
    setIsFlipped(!isFlipped);
  }

  function handleKnow() {
    const newReviewed = new Set(reviewedAyahs);
    newReviewed.add(currentIndex);
    setReviewedAyahs(newReviewed);
    setKnownCount(prev => prev + 1);
    goToNext(newReviewed);
  }

  function handleDontKnow() {
    const newReviewed = new Set(reviewedAyahs);
    newReviewed.add(currentIndex);
    setReviewedAyahs(newReviewed);
    setUnknownCount(prev => prev + 1);
    goToNext(newReviewed);
  }

  function goToNext(reviewed: Set<number>) {
    setIsFlipped(false);

    // Check if all ayahs have been reviewed
    if (reviewed.size >= ayahs.length) {
      setIsComplete(true);
      onComplete(knownCount + 1, ayahs.length); // +1 because we just added one
      return;
    }

    // Find next unreviewed ayah
    let nextIndex = (currentIndex + 1) % ayahs.length;
    while (reviewed.has(nextIndex)) {
      nextIndex = (nextIndex + 1) % ayahs.length;
    }
    setCurrentIndex(nextIndex);
  }

  function handlePrevious() {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev - 1 + ayahs.length) % ayahs.length);
  }

  function handleNext() {
    setIsFlipped(false);
    setCurrentIndex(prev => (prev + 1) % ayahs.length);
  }

  function handleRestart() {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCount(0);
    setUnknownCount(0);
    setReviewedAyahs(new Set());
    setIsComplete(false);
  }

  if (!currentAyah) {
    return (
      <div className="text-center py-8 text-gray-500 dark:text-gray-400">
        No ayahs available
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-8 text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
          Flashcards Complete!
        </h3>
        <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
          {Math.round((knownCount / ayahs.length) * 100)}%
        </p>
        <div className="flex justify-center gap-6 mb-6">
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{knownCount}</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-300">Known</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-red-500">{unknownCount}</p>
            <p className="text-sm text-red-600 dark:text-red-400">Need Practice</p>
          </div>
        </div>
        <button
          onClick={handleRestart}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 mx-auto"
        >
          <RotateCcw className="w-5 h-5" />
          Start Over
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress bar */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
          <span>Progress: {reviewedAyahs.size}/{ayahs.length}</span>
          <span className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-emerald-500" />
              {knownCount}
            </span>
            <span className="flex items-center gap-1">
              <XCircle className="w-4 h-4 text-red-500" />
              {unknownCount}
            </span>
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <div
        onClick={handleFlip}
        className="relative cursor-pointer perspective-1000"
        style={{ minHeight: '320px' }}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-preserve-3d ${
            isFlipped ? 'rotate-y-180' : ''
          }`}
          style={{
            transformStyle: 'preserve-3d',
            transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Front - English Translation */}
          <div
            className={`absolute inset-0 w-full bg-white dark:bg-gray-800 rounded-2xl border-2 border-blue-200 dark:border-blue-800 p-6 flex flex-col justify-center backface-hidden ${
              isFlipped ? 'invisible' : ''
            }`}
            style={{ backfaceVisibility: 'hidden' }}
          >
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm rounded-full mb-4">
                <Eye className="w-4 h-4" />
                English Translation
              </span>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {surahName} - Ayah {currentAyah.ayahNumber}
              </p>
              <p className="text-lg text-gray-800 dark:text-gray-200 leading-relaxed">
                {currentAyah.englishTranslation}
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-6">
                Tap to reveal Arabic
              </p>
            </div>
          </div>

          {/* Back - Arabic Text */}
          <div
            className={`absolute inset-0 w-full bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/30 dark:to-green-900/30 rounded-2xl border-2 border-emerald-300 dark:border-emerald-700 p-6 flex flex-col justify-center ${
              !isFlipped ? 'invisible' : ''
            }`}
            style={{
              backfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
          >
            <div className="text-center">
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 text-sm rounded-full mb-4">
                <EyeOff className="w-4 h-4" />
                Arabic Text
              </span>
              <p className="text-sm text-emerald-600 dark:text-emerald-400 mb-3">
                {surahName} - Ayah {currentAyah.ayahNumber}
              </p>
              <p
                className="text-2xl md:text-3xl font-arabic text-emerald-900 dark:text-emerald-100 leading-loose"
                dir="rtl"
              >
                {currentAyah.arabicText}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation and rating buttons */}
      <div className="flex flex-col gap-4">
        {/* Know / Don't Know buttons - only show when flipped */}
        {isFlipped && !reviewedAyahs.has(currentIndex) && (
          <div className="flex gap-3">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDontKnow();
              }}
              className="flex-1 py-4 rounded-xl bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 font-medium hover:bg-red-200 dark:hover:bg-red-900/50 transition flex items-center justify-center gap-2"
            >
              <XCircle className="w-5 h-5" />
              Don't Know
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleKnow();
              }}
              className="flex-1 py-4 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 font-medium hover:bg-emerald-200 dark:hover:bg-emerald-900/50 transition flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              I Knew It!
            </button>
          </div>
        )}

        {/* Manual navigation */}
        <div className="flex items-center justify-between">
          <button
            onClick={handlePrevious}
            className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {currentIndex + 1} of {ayahs.length}
          </span>
          <button
            onClick={handleNext}
            className="p-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
