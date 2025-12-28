import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { CheckCircle, XCircle, RotateCcw, Trophy, Sparkles, Target, Volume2, ArrowRight, Shuffle } from 'lucide-react';

interface WordPair {
  arabic: string;
  english: string;
  transliteration?: string;
}

interface WordMatchingQuizProps {
  words: WordPair[];
  lessonId: string;
  ayahNumber?: number;
  onComplete?: (score: number, total: number) => void;
}

type MatchState = 'idle' | 'selected' | 'correct' | 'incorrect';

interface WordCardState {
  word: WordPair;
  index: number;
  matched: boolean;
  state: MatchState;
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

// Storage key for progress
function getStorageKey(lessonId: string, ayahNumber?: number): string {
  return `word-match-progress-${lessonId}${ayahNumber ? `-ayah-${ayahNumber}` : ''}`;
}

// Load mastered words from localStorage
function loadMasteredWords(lessonId: string, ayahNumber?: number): Set<string> {
  const key = getStorageKey(lessonId, ayahNumber);
  const stored = localStorage.getItem(key);
  if (stored) {
    try {
      return new Set(JSON.parse(stored));
    } catch {
      return new Set();
    }
  }
  return new Set();
}

// Save mastered words to localStorage
function saveMasteredWords(lessonId: string, masteredWords: Set<string>, ayahNumber?: number): void {
  const key = getStorageKey(lessonId, ayahNumber);
  localStorage.setItem(key, JSON.stringify([...masteredWords]));
}

// Connection line component for matched pairs
interface ConnectionLineProps {
  arabicRef: HTMLElement | null;
  englishRef: HTMLElement | null;
  containerRef: HTMLElement | null;
  isAnimating?: boolean;
}

function ConnectionLine({ arabicRef, englishRef, containerRef, isAnimating }: ConnectionLineProps) {
  if (!arabicRef || !englishRef || !containerRef) return null;

  const containerRect = containerRef.getBoundingClientRect();
  const arabicRect = arabicRef.getBoundingClientRect();
  const englishRect = englishRef.getBoundingClientRect();

  // Calculate positions relative to container
  const startX = arabicRect.right - containerRect.left;
  const startY = arabicRect.top + arabicRect.height / 2 - containerRect.top;
  const endX = englishRect.left - containerRect.left;
  const endY = englishRect.top + englishRect.height / 2 - containerRect.top;

  // Create a curved path
  const midX = (startX + endX) / 2;
  const pathD = `M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`;

  return (
    <svg
      className="absolute inset-0 pointer-events-none z-10"
      style={{ width: '100%', height: '100%' }}
    >
      <path
        d={pathD}
        fill="none"
        stroke={isAnimating ? '#10b981' : '#10b981'}
        strokeWidth="3"
        strokeLinecap="round"
        className={isAnimating ? 'animate-pulse' : ''}
        style={{
          strokeDasharray: isAnimating ? '8 4' : 'none',
          opacity: isAnimating ? 1 : 0.6
        }}
      />
      {/* Start circle */}
      <circle cx={startX} cy={startY} r="5" fill="#10b981" />
      {/* End circle */}
      <circle cx={endX} cy={endY} r="5" fill="#10b981" />
    </svg>
  );
}

export default function WordMatchingQuiz({ words, lessonId, ayahNumber, onComplete }: WordMatchingQuizProps) {
  const [masteredWords, setMasteredWords] = useState<Set<string>>(() =>
    loadMasteredWords(lessonId, ayahNumber)
  );
  const [arabicCards, setArabicCards] = useState<WordCardState[]>([]);
  const [englishCards, setEnglishCards] = useState<WordCardState[]>([]);
  const [selectedArabic, setSelectedArabic] = useState<number | null>(null);
  const [selectedEnglish, setSelectedEnglish] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);
  const [gameMode, setGameMode] = useState<'practice' | 'quiz'>('practice');
  const [quizComplete, setQuizComplete] = useState(false);

  // Refs for drawing connection lines
  const containerRef = useRef<HTMLDivElement>(null);
  const arabicRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const englishRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [, forceUpdate] = useState(0);

  // Filter words that haven't been mastered for quiz mode
  const availableWords = useMemo(() => {
    if (gameMode === 'practice') return words;
    return words.filter(w => !masteredWords.has(w.arabic));
  }, [words, masteredWords, gameMode]);

  // Initialize/reset the game
  const initializeGame = useCallback(() => {
    const wordsToUse = availableWords.slice(0, 6); // Max 6 pairs at a time

    const arabicShuffled = shuffleArray(wordsToUse.map((word, index) => ({
      word,
      index,
      matched: false,
      state: 'idle' as MatchState
    })));

    const englishShuffled = shuffleArray(wordsToUse.map((word, index) => ({
      word,
      index,
      matched: false,
      state: 'idle' as MatchState
    })));

    setArabicCards(arabicShuffled);
    setEnglishCards(englishShuffled);
    setSelectedArabic(null);
    setSelectedEnglish(null);
    setScore(0);
    setAttempts(0);
    setMatchedCount(0);
    setShowCelebration(false);
    setQuizComplete(false);
  }, [availableWords]);

  // Initialize on mount and when words change
  useEffect(() => {
    initializeGame();
  }, [initializeGame]);

  // Force re-render when matches change to update connection lines
  useEffect(() => {
    // Small delay to ensure DOM has updated
    const timer = setTimeout(() => forceUpdate(n => n + 1), 50);
    return () => clearTimeout(timer);
  }, [matchedCount]);

  // Check for match when both selections are made
  useEffect(() => {
    if (selectedArabic !== null && selectedEnglish !== null) {
      const arabicCard = arabicCards.find(c => c.index === selectedArabic);
      const englishCard = englishCards.find(c => c.index === selectedEnglish);

      if (arabicCard && englishCard) {
        setAttempts(prev => prev + 1);

        // Check if they match (same original index means same word pair)
        if (arabicCard.index === englishCard.index) {
          // Correct match!
          setScore(prev => prev + 1);
          setMatchedCount(prev => prev + 1);

          // Update card states
          setArabicCards(prev => prev.map(c =>
            c.index === selectedArabic ? { ...c, matched: true, state: 'correct' } : c
          ));
          setEnglishCards(prev => prev.map(c =>
            c.index === selectedEnglish ? { ...c, matched: true, state: 'correct' } : c
          ));

          // Add to mastered words
          const newMastered = new Set(masteredWords);
          newMastered.add(arabicCard.word.arabic);
          setMasteredWords(newMastered);
          saveMasteredWords(lessonId, newMastered, ayahNumber);

          // Check if all matched (only show celebration if there were multiple cards)
          if (matchedCount + 1 === arabicCards.length && arabicCards.length > 1) {
            setShowCelebration(true);
            setQuizComplete(true);
            onComplete?.(score + 1, attempts + 1);
          }

          // Clear selections after delay
          setTimeout(() => {
            setSelectedArabic(null);
            setSelectedEnglish(null);
          }, 500);
        } else {
          // Incorrect match
          setArabicCards(prev => prev.map(c =>
            c.index === selectedArabic ? { ...c, state: 'incorrect' } : c
          ));
          setEnglishCards(prev => prev.map(c =>
            c.index === selectedEnglish ? { ...c, state: 'incorrect' } : c
          ));

          // Reset after showing incorrect
          setTimeout(() => {
            setArabicCards(prev => prev.map(c =>
              c.index === selectedArabic ? { ...c, state: 'idle' } : c
            ));
            setEnglishCards(prev => prev.map(c =>
              c.index === selectedEnglish ? { ...c, state: 'idle' } : c
            ));
            setSelectedArabic(null);
            setSelectedEnglish(null);
          }, 800);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedArabic, selectedEnglish]);

  // Handle Arabic card click
  const handleArabicClick = (index: number) => {
    const card = arabicCards.find(c => c.index === index);
    if (card?.matched || card?.state === 'incorrect') return;
    setSelectedArabic(index);
  };

  // Handle English card click
  const handleEnglishClick = (index: number) => {
    const card = englishCards.find(c => c.index === index);
    if (card?.matched || card?.state === 'incorrect') return;
    setSelectedEnglish(index);
  };

  // Reset mastered words
  const resetProgress = () => {
    if (!confirm('Reset all mastered words? You will need to match them again.')) return;
    setMasteredWords(new Set());
    localStorage.removeItem(getStorageKey(lessonId, ayahNumber));
    initializeGame();
  };

  // Get card style based on state
  const getCardStyle = (state: MatchState, isSelected: boolean, matched: boolean) => {
    if (matched) {
      // Keep matched cards visible with green highlight
      return 'bg-emerald-100 border-emerald-500 border-2 text-emerald-800 shadow-md';
    }
    if (state === 'correct') {
      return 'bg-emerald-100 border-emerald-500 text-emerald-800 ring-2 ring-emerald-400';
    }
    if (state === 'incorrect') {
      return 'bg-red-100 border-red-400 text-red-800 animate-shake';
    }
    if (isSelected) {
      return 'bg-blue-100 border-emerald-500 text-blue-800 ring-2 ring-blue-400 scale-105';
    }
    return 'bg-white border-gray-200 text-gray-800 hover:border-blue-300 hover:shadow-md';
  };

  const accuracy = attempts > 0 ? Math.round((score / attempts) * 100) : 0;
  const totalMastered = masteredWords.size;
  const totalWords = words.length;
  const masteryPercent = Math.round((totalMastered / totalWords) * 100);

  if (words.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No vocabulary words available for this lesson.
      </div>
    );
  }

  // If only 1 word available, show a message to use practice mode or reset
  if (arabicCards.length <= 1 && gameMode === 'quiz') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
        <p className="text-amber-800 mb-4">
          Only 1 new word remaining. Switch to Practice mode to review all words.
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setGameMode('practice')}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-blue-700 transition-all"
          >
            Practice All Words
          </button>
          <button
            onClick={resetProgress}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
          >
            Reset Progress
          </button>
        </div>
      </div>
    );
  }

  if (availableWords.length === 0 && gameMode === 'quiz') {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-2xl p-8 text-center border border-emerald-200">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-emerald-800 mb-2">All Words Mastered!</h3>
        <p className="text-emerald-600 mb-6">
          You've matched all {totalWords} words correctly. Amazing work!
        </p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => setGameMode('practice')}
            className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all"
          >
            Practice Again
          </button>
          <button
            onClick={resetProgress}
            className="px-4 py-2 rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-all"
          >
            Reset Progress
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-blue-600 to-green-600 rounded-xl p-4 text-white">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5" />
            <h3 className="font-bold">Word Matching Quiz</h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span>Score: {score}/{arabicCards.length}</span>
            <span>Accuracy: {accuracy}%</span>
          </div>
        </div>

        {/* Mastery progress bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-xs text-white/80">
            <span>Overall Mastery</span>
            <span>{totalMastered}/{totalWords} words ({masteryPercent}%)</span>
          </div>
          <div className="h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-yellow-400 to-emerald-300 transition-all duration-500"
              style={{ width: `${masteryPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-sm text-blue-800">
          <strong>How to play:</strong> Tap an Arabic word, then tap its matching English translation.
          Match all pairs to complete the round!
        </p>
      </div>

      {/* Game controls */}
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          <button
            onClick={() => setGameMode('practice')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              gameMode === 'practice'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Practice All
          </button>
          <button
            onClick={() => setGameMode('quiz')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              gameMode === 'quiz'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            New Words Only
          </button>
        </div>
        <div className="flex gap-2">
          <button
            onClick={initializeGame}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 text-gray-700 hover:bg-gray-200 transition-all"
          >
            <Shuffle className="w-4 h-4" />
            Shuffle
          </button>
          <button
            onClick={resetProgress}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-red-100 text-red-700 hover:bg-red-200 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </button>
        </div>
      </div>

      {/* Celebration overlay */}
      {showCelebration && (
        <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 text-center border-2 border-emerald-300 animate-fadeIn">
          <div className="flex justify-center mb-3">
            <Trophy className="w-12 h-12 text-yellow-500" />
          </div>
          <h3 className="text-xl font-bold text-emerald-800 mb-2">Round Complete!</h3>
          <p className="text-emerald-600 mb-4">
            Score: {score}/{arabicCards.length} • Accuracy: {accuracy}%
          </p>
          <button
            onClick={initializeGame}
            className="px-6 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition-all flex items-center gap-2 mx-auto"
          >
            <ArrowRight className="w-4 h-4" />
            Next Round
          </button>
        </div>
      )}

      {/* Matching cards */}
      {!quizComplete && (
        <div ref={containerRef} className="relative">
          {/* Connection lines for matched pairs */}
          {arabicCards.filter(c => c.matched).map((card) => {
            const arabicEl = arabicRefs.current.get(card.index);
            const englishEl = englishRefs.current.get(card.index);
            return (
              <ConnectionLine
                key={`line-${card.index}`}
                arabicRef={arabicEl || null}
                englishRef={englishEl || null}
                containerRef={containerRef.current}
                isAnimating={card.state === 'correct'}
              />
            );
          })}

          <div className="grid grid-cols-2 gap-6">
            {/* Arabic column */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-500 text-center mb-3">Arabic</h4>
              {arabicCards.map((card) => (
                <button
                  key={`ar-${card.index}`}
                  ref={(el) => {
                    if (el) arabicRefs.current.set(card.index, el);
                  }}
                  onClick={() => handleArabicClick(card.index)}
                  disabled={card.matched || card.state === 'incorrect'}
                  className={`relative w-full h-24 p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${getCardStyle(
                    card.state,
                    selectedArabic === card.index,
                    card.matched
                  )}`}
                >
                  <p className="font-arabic text-3xl leading-tight" dir="rtl">
                    {card.word.arabic}
                  </p>
                  {card.matched && (
                    <CheckCircle className="w-4 h-4 text-emerald-500 absolute top-2 right-2" />
                  )}
                </button>
              ))}
            </div>

            {/* English column */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-gray-500 text-center mb-3">English</h4>
              {englishCards.map((card) => (
                <button
                  key={`en-${card.index}`}
                  ref={(el) => {
                    if (el) englishRefs.current.set(card.index, el);
                  }}
                  onClick={() => handleEnglishClick(card.index)}
                  disabled={card.matched || card.state === 'incorrect'}
                  className={`relative w-full h-24 p-4 rounded-xl border-2 transition-all duration-200 flex flex-col items-center justify-center ${getCardStyle(
                    card.state,
                    selectedEnglish === card.index,
                    card.matched
                  )}`}
                >
                  <p className="text-base font-medium text-center leading-tight line-clamp-3">
                    {card.word.english}
                  </p>
                  {card.matched && (
                    <CheckCircle className="w-4 h-4 text-emerald-500 absolute top-2 left-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Hint: show which Arabic is selected */}
      {selectedArabic !== null && selectedEnglish === null && (
        <div className="text-center text-sm text-emerald-600 animate-pulse">
          Now tap the matching English translation
        </div>
      )}
    </div>
  );
}

// Helper component to extract vocabulary from insight content and create quiz
interface VocabularyMatchQuizProps {
  vocabularyContent: string;
  lessonId: string;
}

export function VocabularyMatchQuiz({ vocabularyContent, lessonId }: VocabularyMatchQuizProps) {
  // Parse vocabulary table from markdown content
  const words = useMemo(() => {
    const pairs: WordPair[] = [];
    const lines = vocabularyContent.split('\n');

    for (const line of lines) {
      // Skip header and separator rows
      if (line.includes('---') || line.includes('Arabic') || line.includes('Transliteration')) {
        continue;
      }

      // Parse table rows
      const cells = line.split('|').map(c => c.trim()).filter(c => c.length > 0);

      if (cells.length >= 3) {
        const arabic = cells[0];
        const transliteration = cells[1];
        // Handle different table formats - meaning might be in column 3 or 4
        const english = cells[3] || cells[2];

        // Check if Arabic column contains Arabic characters
        if (arabic && /[أ-يً-ْ]/.test(arabic) && arabic.length > 1) {
          pairs.push({
            arabic,
            transliteration,
            english: english.replace(/\s*\([^)]*\)\s*/g, '').trim() // Remove parenthetical notes
          });
        }
      }
    }

    return pairs;
  }, [vocabularyContent]);

  if (words.length === 0) {
    return null;
  }

  return <WordMatchingQuiz words={words} lessonId={lessonId} />;
}
