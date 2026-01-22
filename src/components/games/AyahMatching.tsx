import { useState, useEffect, useRef, useMemo } from 'react';
import { CheckCircle, Shuffle, Trophy, RotateCcw, Target, Link2 } from 'lucide-react';

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

interface AyahMatchingProps {
  ayahs: AyahData[];
  surahName: string;
  onComplete: (correct: number, total: number, results: AyahResult[]) => void;
}

type MatchState = 'idle' | 'selected' | 'correct' | 'incorrect';

interface CardState {
  ayah: AyahData;
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

// Connection line component for matched pairs
interface ConnectionLineProps {
  englishRef: HTMLElement | null;
  arabicRef: HTMLElement | null;
  containerRef: HTMLElement | null;
  isAnimating?: boolean;
}

function ConnectionLine({ englishRef, arabicRef, containerRef, isAnimating }: ConnectionLineProps) {
  if (!englishRef || !arabicRef || !containerRef) return null;

  const containerRect = containerRef.getBoundingClientRect();
  const englishRect = englishRef.getBoundingClientRect();
  const arabicRect = arabicRef.getBoundingClientRect();

  // Calculate positions relative to container
  const startX = englishRect.right - containerRect.left;
  const startY = englishRect.top + englishRect.height / 2 - containerRect.top;
  const endX = arabicRect.left - containerRect.left;
  const endY = arabicRect.top + arabicRect.height / 2 - containerRect.top;

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
        stroke="#10b981"
        strokeWidth="3"
        strokeLinecap="round"
        className={isAnimating ? 'animate-pulse' : ''}
        style={{
          strokeDasharray: isAnimating ? '8 4' : 'none',
          opacity: isAnimating ? 1 : 0.6
        }}
      />
      <circle cx={startX} cy={startY} r="5" fill="#10b981" />
      <circle cx={endX} cy={endY} r="5" fill="#10b981" />
    </svg>
  );
}

export default function AyahMatching({ ayahs, surahName, onComplete }: AyahMatchingProps) {
  // Limit to 5-6 ayahs for better UX
  const gameAyahs = useMemo(() => ayahs.slice(0, Math.min(6, ayahs.length)), [ayahs]);

  const [englishCards, setEnglishCards] = useState<CardState[]>([]);
  const [arabicCards, setArabicCards] = useState<CardState[]>([]);
  const [selectedEnglish, setSelectedEnglish] = useState<number | null>(null);
  const [selectedArabic, setSelectedArabic] = useState<number | null>(null);
  const [matchedCount, setMatchedCount] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for drawing connection lines
  const containerRef = useRef<HTMLDivElement>(null);
  const englishRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const arabicRefs = useRef<Map<number, HTMLButtonElement>>(new Map());
  const [, forceUpdate] = useState(0);

  // Initialize game
  const initializeGame = () => {
    const englishShuffled = shuffleArray(gameAyahs.map((ayah, index) => ({
      ayah,
      index,
      matched: false,
      state: 'idle' as MatchState
    })));

    const arabicShuffled = shuffleArray(gameAyahs.map((ayah, index) => ({
      ayah,
      index,
      matched: false,
      state: 'idle' as MatchState
    })));

    setEnglishCards(englishShuffled);
    setArabicCards(arabicShuffled);
    setSelectedEnglish(null);
    setSelectedArabic(null);
    setMatchedCount(0);
    setAttempts(0);
    setIsComplete(false);
  };

  // Initialize on mount
  useEffect(() => {
    initializeGame();
  }, [gameAyahs]);

  // Force re-render when matches change to update connection lines
  useEffect(() => {
    const timer = setTimeout(() => forceUpdate(n => n + 1), 50);
    return () => clearTimeout(timer);
  }, [matchedCount]);

  // Check for match when both selections are made
  useEffect(() => {
    if (selectedEnglish !== null && selectedArabic !== null) {
      const englishCard = englishCards.find(c => c.index === selectedEnglish);
      const arabicCard = arabicCards.find(c => c.index === selectedArabic);

      if (englishCard && arabicCard) {
        setAttempts(prev => prev + 1);

        // Check if they match (same original index means same ayah)
        if (englishCard.index === arabicCard.index) {
          // Correct match!
          setMatchedCount(prev => prev + 1);

          // Update card states
          setEnglishCards(prev => prev.map(c =>
            c.index === selectedEnglish ? { ...c, matched: true, state: 'correct' } : c
          ));
          setArabicCards(prev => prev.map(c =>
            c.index === selectedArabic ? { ...c, matched: true, state: 'correct' } : c
          ));

          // Check if all matched
          if (matchedCount + 1 === gameAyahs.length) {
            setIsComplete(true);
            // All matched ayahs are correct
            const results: AyahResult[] = gameAyahs.map(ayah => ({
              ayahNumber: ayah.ayahNumber,
              correct: true
            }));
            onComplete(matchedCount + 1, attempts + 1, results);
          }

          // Clear selections after delay
          setTimeout(() => {
            setSelectedEnglish(null);
            setSelectedArabic(null);
          }, 500);
        } else {
          // Incorrect match
          setEnglishCards(prev => prev.map(c =>
            c.index === selectedEnglish ? { ...c, state: 'incorrect' } : c
          ));
          setArabicCards(prev => prev.map(c =>
            c.index === selectedArabic ? { ...c, state: 'incorrect' } : c
          ));

          // Reset after showing incorrect
          setTimeout(() => {
            setEnglishCards(prev => prev.map(c =>
              c.index === selectedEnglish ? { ...c, state: 'idle' } : c
            ));
            setArabicCards(prev => prev.map(c =>
              c.index === selectedArabic ? { ...c, state: 'idle' } : c
            ));
            setSelectedEnglish(null);
            setSelectedArabic(null);
          }, 800);
        }
      }
    }
  }, [selectedEnglish, selectedArabic]);

  // Handle English card click
  function handleEnglishClick(index: number) {
    const card = englishCards.find(c => c.index === index);
    if (card?.matched || card?.state === 'incorrect') return;
    setSelectedEnglish(index);
  }

  // Handle Arabic card click
  function handleArabicClick(index: number) {
    const card = arabicCards.find(c => c.index === index);
    if (card?.matched || card?.state === 'incorrect') return;
    setSelectedArabic(index);
  }

  // Get card style based on state
  function getCardStyle(state: MatchState, isSelected: boolean, matched: boolean) {
    if (matched) {
      return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 border-2 text-emerald-800 dark:text-emerald-200 shadow-md';
    }
    if (state === 'correct') {
      return 'bg-emerald-100 dark:bg-emerald-900/30 border-emerald-500 text-emerald-800 dark:text-emerald-200 ring-2 ring-emerald-400';
    }
    if (state === 'incorrect') {
      return 'bg-red-100 dark:bg-red-900/30 border-red-400 text-red-800 dark:text-red-200 animate-shake';
    }
    if (isSelected) {
      return 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-800 dark:text-blue-200 ring-2 ring-blue-400 scale-105';
    }
    return 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-800 dark:text-gray-200 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md';
  }

  const accuracy = attempts > 0 ? Math.round((matchedCount / attempts) * 100) : 0;

  if (isComplete) {
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-8 text-center">
        <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
          Matching Complete!
        </h3>
        <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
          {accuracy}%
        </p>
        <p className="text-emerald-700 dark:text-emerald-300 mb-6">
          {gameAyahs.length} matches in {attempts} attempts
        </p>
        <button
          onClick={initializeGame}
          className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 mx-auto"
        >
          <RotateCcw className="w-5 h-5" />
          Play Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Progress header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Link2 className="w-5 h-5 text-emerald-500" />
            <h3 className="font-bold text-gray-900 dark:text-white">Match English to Arabic</h3>
          </div>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-gray-600 dark:text-gray-400">
              Matched: {matchedCount}/{gameAyahs.length}
            </span>
            <span className="text-gray-600 dark:text-gray-400">
              Attempts: {attempts}
            </span>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-emerald-400 to-green-500 transition-all duration-300"
            style={{ width: `${(matchedCount / gameAyahs.length) * 100}%` }}
          />
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          <strong>How to play:</strong> Tap an English translation, then tap its matching Arabic ayah.
          Match all pairs to complete the game!
        </p>
      </div>

      {/* Game controls */}
      <div className="flex justify-end">
        <button
          onClick={initializeGame}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition"
        >
          <Shuffle className="w-4 h-4" />
          Shuffle
        </button>
      </div>

      {/* Matching game area */}
      <div ref={containerRef} className="relative">
        {/* Connection lines for matched pairs */}
        {englishCards.filter(c => c.matched).map((card) => {
          const englishEl = englishRefs.current.get(card.index);
          const arabicEl = arabicRefs.current.get(card.index);
          return (
            <ConnectionLine
              key={`line-${card.index}`}
              englishRef={englishEl || null}
              arabicRef={arabicEl || null}
              containerRef={containerRef.current}
              isAnimating={card.state === 'correct'}
            />
          );
        })}

        <div className="grid grid-cols-2 gap-4">
          {/* English column */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-3">
              English Translations
            </h4>
            {englishCards.map((card) => (
              <button
                key={`en-${card.index}`}
                ref={(el) => {
                  if (el) englishRefs.current.set(card.index, el);
                }}
                onClick={() => handleEnglishClick(card.index)}
                disabled={card.matched || card.state === 'incorrect'}
                className={`relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-left ${getCardStyle(
                  card.state,
                  selectedEnglish === card.index,
                  card.matched
                )}`}
              >
                <p className="text-sm leading-relaxed line-clamp-3">
                  {card.ayah.englishTranslation}
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                  Ayah {card.ayah.ayahNumber}
                </p>
                {card.matched && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 absolute top-2 right-2" />
                )}
              </button>
            ))}
          </div>

          {/* Arabic column */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 text-center mb-3">
              Arabic Ayahs
            </h4>
            {arabicCards.map((card) => (
              <button
                key={`ar-${card.index}`}
                ref={(el) => {
                  if (el) arabicRefs.current.set(card.index, el);
                }}
                onClick={() => handleArabicClick(card.index)}
                disabled={card.matched || card.state === 'incorrect'}
                className={`relative w-full p-4 rounded-xl border-2 transition-all duration-200 text-right ${getCardStyle(
                  card.state,
                  selectedArabic === card.index,
                  card.matched
                )}`}
              >
                <p className="font-arabic text-xl leading-loose" dir="rtl">
                  {card.ayah.arabicText}
                </p>
                {card.matched && (
                  <CheckCircle className="w-4 h-4 text-emerald-500 absolute top-2 left-2" />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Hint */}
      {selectedEnglish !== null && selectedArabic === null && (
        <div className="text-center text-sm text-blue-600 dark:text-blue-400 animate-pulse">
          Now tap the matching Arabic ayah
        </div>
      )}
      {selectedArabic !== null && selectedEnglish === null && (
        <div className="text-center text-sm text-blue-600 dark:text-blue-400 animate-pulse">
          Now tap the matching English translation
        </div>
      )}
    </div>
  );
}
