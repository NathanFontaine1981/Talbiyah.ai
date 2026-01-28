import { useState } from 'react';

// Interactive Flashcard Demo
export function FlashcardDemo() {
  const [flipped, setFlipped] = useState(false);
  const [cardIndex, setCardIndex] = useState(0);

  const cards = [
    { front: 'بِسْمِ اللَّهِ', back: 'In the name of Allah' },
    { front: 'الْحَمْدُ لِلَّهِ', back: 'All praise is due to Allah' },
    { front: 'السَّلَامُ عَلَيْكُمْ', back: 'Peace be upon you' },
  ];

  const nextCard = () => {
    setFlipped(false);
    setTimeout(() => {
      setCardIndex((prev) => (prev + 1) % cards.length);
    }, 200);
  };

  return (
    <div className="w-full max-w-sm">
      <div
        onClick={() => setFlipped(!flipped)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setFlipped(!flipped);
          }
        }}
        role="button"
        tabIndex={0}
        aria-label={flipped ? `Flashcard showing: ${cards[cardIndex].back}. Press Enter to flip.` : `Flashcard showing Arabic: ${cards[cardIndex].front}. Press Enter to flip.`}
        className={`relative w-full h-48 cursor-pointer transition-all duration-500 transform-gpu preserve-3d ${flipped ? 'rotate-y-180' : ''} focus:outline-none focus:ring-4 focus:ring-purple-300 dark:focus:ring-purple-600 rounded-2xl`}
        style={{ perspective: '1000px' }}
      >
        {/* Front */}
        <div className={`absolute inset-0 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-6 flex items-center justify-center text-white shadow-xl backface-hidden ${flipped ? 'invisible' : ''}`} aria-hidden={flipped}>
          <span className="text-3xl font-arabic">{cards[cardIndex].front}</span>
        </div>
        {/* Back */}
        <div className={`absolute inset-0 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-2xl p-6 flex items-center justify-center text-white shadow-xl backface-hidden rotate-y-180 ${!flipped ? 'invisible' : ''}`} aria-hidden={!flipped}>
          <span className="text-xl">{cards[cardIndex].back}</span>
        </div>
      </div>
      <div className="flex items-center justify-center gap-4 mt-4">
        <button
          onClick={() => setFlipped(!flipped)}
          className="px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
        >
          {flipped ? 'Show Arabic' : 'Show English'}
        </button>
        <button
          onClick={nextCard}
          className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition"
        >
          Next Card
        </button>
      </div>
      <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-3">
        Click the card to flip • Card {cardIndex + 1} of {cards.length}
      </p>
    </div>
  );
}

// Interactive Multiple Choice Demo
export function MultipleChoiceDemo() {
  const [selected, setSelected] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  const question = {
    text: 'What does "Alhamdulillah" mean?',
    options: [
      'Peace be upon you',
      'In the name of Allah',
      'All praise is due to Allah',
      'God is the greatest',
    ],
    correct: 2,
  };

  const handleSelect = (index: number) => {
    if (showResult) return;
    setSelected(index);
    setShowResult(true);
  };

  const reset = () => {
    setSelected(null);
    setShowResult(false);
  };

  return (
    <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-purple-200 dark:border-purple-800">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">{question.text}</h4>
      <div className="space-y-2">
        {question.options.map((option, index) => (
          <button
            key={index}
            onClick={() => handleSelect(index)}
            disabled={showResult}
            className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
              showResult
                ? index === question.correct
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500'
                  : index === selected
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                : selected === index
                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 border-2 border-purple-500'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
            }`}
          >
            <span className="mr-2">{String.fromCharCode(65 + index)}.</span>
            {option}
          </button>
        ))}
      </div>
      {showResult && (
        <div className="mt-4 flex items-center justify-between">
          <span className={`text-sm font-medium ${selected === question.correct ? 'text-green-600' : 'text-red-600'}`}>
            {selected === question.correct ? '✓ Correct!' : '✗ Try again'}
          </span>
          <button
            onClick={reset}
            className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 rounded-lg text-sm font-medium hover:bg-purple-200 transition"
          >
            Reset
          </button>
        </div>
      )}
    </div>
  );
}

// Interactive Matching Demo
export function MatchingDemo() {
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matches, setMatches] = useState<Record<number, number>>({});
  const [wrongMatch, setWrongMatch] = useState<number | null>(null);

  const pairs = [
    { arabic: 'سلام', english: 'Peace' },
    { arabic: 'كتاب', english: 'Book' },
    { arabic: 'ماء', english: 'Water' },
  ];

  const shuffledRight = [1, 2, 0]; // Shuffled indices for right side

  const handleLeftClick = (index: number) => {
    if (matches[index] !== undefined) return;
    setSelectedLeft(index);
    setWrongMatch(null);
  };

  const handleRightClick = (rightIndex: number) => {
    if (selectedLeft === null) return;
    const actualRight = shuffledRight[rightIndex];

    if (selectedLeft === actualRight) {
      setMatches(prev => ({ ...prev, [selectedLeft]: rightIndex }));
      setSelectedLeft(null);
    } else {
      setWrongMatch(rightIndex);
      setTimeout(() => setWrongMatch(null), 500);
    }
  };

  const reset = () => {
    setSelectedLeft(null);
    setMatches({});
    setWrongMatch(null);
  };

  const isComplete = Object.keys(matches).length === pairs.length;

  return (
    <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-xl border border-indigo-200 dark:border-indigo-800">
      <h4 className="font-semibold text-gray-900 dark:text-white mb-4">Match Arabic to English</h4>
      <div className="flex gap-4">
        {/* Left column - Arabic */}
        <div className="flex-1 space-y-2">
          {pairs.map((pair, index) => (
            <button
              key={index}
              onClick={() => handleLeftClick(index)}
              disabled={matches[index] !== undefined}
              className={`w-full px-3 py-2 rounded-lg text-lg font-arabic transition-all ${
                matches[index] !== undefined
                  ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500'
                  : selectedLeft === index
                  ? 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 border-2 border-indigo-500'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {pair.arabic}
            </button>
          ))}
        </div>
        {/* Right column - English */}
        <div className="flex-1 space-y-2">
          {shuffledRight.map((pairIndex, displayIndex) => {
            const isMatched = Object.values(matches).includes(displayIndex);
            return (
              <button
                key={displayIndex}
                onClick={() => handleRightClick(displayIndex)}
                disabled={isMatched}
                className={`w-full px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                  isMatched
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-2 border-green-500'
                    : wrongMatch === displayIndex
                    ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-2 border-red-500'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {pairs[pairIndex].english}
              </button>
            );
          })}
        </div>
      </div>
      <div className="mt-4 flex items-center justify-between">
        <span className={`text-sm font-medium ${isComplete ? 'text-green-600' : 'text-gray-500'}`}>
          {isComplete ? '✓ All matched!' : `${Object.keys(matches).length}/${pairs.length} matched`}
        </span>
        <button
          onClick={reset}
          className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400 rounded-lg text-sm font-medium hover:bg-indigo-200 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
