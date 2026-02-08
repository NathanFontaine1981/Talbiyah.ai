import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Volume2,
  MessageCircle,
  Sparkles,
  Eye,
  X
} from 'lucide-react';
import { salahPositions, getPositionsByOrder, type SalahPosition, type SalahRecitation, type ArabicWord } from '../../data/salahData';

interface LearnModeProps {
  completedPositions: string[];
  onPositionComplete: (positionId: string) => void;
  onBack: () => void;
  onComplete: () => void;
  initialPositionId?: string;
}

type ViewMode = 'grid' | 'detail' | 'conversation';

// Position icons mapping
const positionIcons: Record<string, string> = {
  'hands-raised': '🙌',
  'standing': '🧍',
  'bowing': '🙇',
  'prostrating': '🤲',
  'sitting': '🧘'
};

export default function LearnMode({
  completedPositions,
  onPositionComplete,
  onBack,
  onComplete,
  initialPositionId
}: LearnModeProps) {
  const positions = getPositionsByOrder();

  // Find initial position if provided
  const initialPosition = initialPositionId
    ? positions.find(p => p.id === initialPositionId) || null
    : null;

  const [viewMode, setViewMode] = useState<ViewMode>(initialPosition ? 'detail' : 'grid');
  const [selectedPosition, setSelectedPosition] = useState<SalahPosition | null>(initialPosition);
  const [expandedRecitation, setExpandedRecitation] = useState<string | null>(null);
  const [revealedWords, setRevealedWords] = useState<Record<string, number>>({});
  const [showConversation, setShowConversation] = useState(false);
  const progress = Math.round((completedPositions.length / positions.length) * 100);

  const handlePositionSelect = (position: SalahPosition) => {
    setSelectedPosition(position);
    setViewMode('detail');
    setExpandedRecitation(null);
    setRevealedWords({});
  };

  const handleBackToGrid = () => {
    setViewMode('grid');
    setSelectedPosition(null);
    setExpandedRecitation(null);
    setRevealedWords({});
  };

  const handleToggleExpand = (recitationId: string) => {
    if (expandedRecitation === recitationId) {
      setExpandedRecitation(null);
    } else {
      setExpandedRecitation(recitationId);
    }
  };

  const handleRevealAll = (recitationId: string, totalWords: number) => {
    setRevealedWords(prev => ({ ...prev, [recitationId]: totalWords }));
  };

  const handleMarkComplete = () => {
    if (selectedPosition) {
      onPositionComplete(selectedPosition.id);
    }
  };

  const isFatiha = selectedPosition?.id === 'standing-fatiha';

  // Grid View
  const renderGrid = () => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="min-h-screen bg-gray-50 px-4 py-8"
    >
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            Back
          </button>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <div className="text-sm text-gray-500">Progress</div>
              <div className="text-emerald-600 font-semibold">{progress}%</div>
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
            Positions of Prayer
          </h1>
          <p className="text-gray-600 text-lg">
            Tap on any position to learn what you recite and what it means
          </p>
        </div>

        {/* Position Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {positions.map((position, index) => {
            const isCompleted = completedPositions.includes(position.id);
            return (
              <motion.button
                key={position.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handlePositionSelect(position)}
                className={`group relative bg-white hover:bg-gray-50 rounded-2xl p-5 border transition-all text-left shadow-sm ${
                  isCompleted
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : 'border-gray-200 hover:border-emerald-300'
                }`}
              >
                {isCompleted && (
                  <div className="absolute top-3 right-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                  </div>
                )}
                <div className="text-3xl mb-3">
                  {positionIcons[position.iconType] || '🕌'}
                </div>
                <div className="text-sm text-gray-500 mb-1">
                  {position.order}. {position.transliteration}
                </div>
                <h3 className="text-gray-900 font-semibold mb-1 group-hover:text-emerald-600 transition-colors">
                  {position.name}
                </h3>
                <p className="text-xs text-gray-500 line-clamp-2">
                  {position.description}
                </p>
                {position.id === 'standing-fatiha' && (
                  <div className="mt-2 inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
                    <MessageCircle className="w-3 h-3" />
                    Conversation
                  </div>
                )}
              </motion.button>
            );
          })}
        </div>

        {/* Complete all prompt */}
        {progress === 100 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 text-center"
          >
            <div className="inline-flex items-center gap-2 bg-emerald-100 px-6 py-3 rounded-full border border-emerald-200">
              <Sparkles className="w-5 h-5 text-emerald-600" />
              <span className="text-emerald-700 font-medium">
                Amazing! You've learned all positions!
              </span>
            </div>
          </motion.div>
        )}
      </div>
    </motion.div>
  );

  // Detail View
  const renderDetail = () => {
    if (!selectedPosition) return null;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="min-h-screen bg-gray-50 px-4 py-8"
      >
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handleBackToGrid}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              All Positions
            </button>
            {!completedPositions.includes(selectedPosition.id) ? (
              <button
                onClick={handleMarkComplete}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-medium transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                Mark as Learned
              </button>
            ) : (
              <div className="flex items-center gap-2 text-emerald-600 text-sm">
                <CheckCircle2 className="w-4 h-4" />
                Completed
              </div>
            )}
          </div>

          {/* Position Header */}
          <div className="bg-white rounded-2xl p-6 border border-gray-200 mb-6 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="w-16 h-16 rounded-xl bg-emerald-100 flex items-center justify-center text-4xl">
                {positionIcons[selectedPosition.iconType] || '🕌'}
              </div>
              <div className="flex-1">
                <div className="text-emerald-600 text-sm mb-1">
                  Position {selectedPosition.order}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">
                  {selectedPosition.name}
                </h1>
                <div className="text-lg text-gray-600 font-arabic">
                  {selectedPosition.arabicName}
                </div>
              </div>
            </div>
            <p className="text-gray-600 mt-4">
              {selectedPosition.description}
            </p>
            {selectedPosition.physicalDescription && (
              <p className="text-gray-500 text-sm mt-2 italic">
                {selectedPosition.physicalDescription}
              </p>
            )}
            {selectedPosition.transitionSaying && (
              <div className="mt-4 inline-flex items-center gap-2 text-sm text-amber-700 bg-amber-100 px-3 py-1.5 rounded-full">
                <span>Say "{selectedPosition.transitionSaying}" when entering this position</span>
              </div>
            )}
          </div>

          {/* Fatiha Conversation Button */}
          {isFatiha && (
            <button
              onClick={() => setShowConversation(true)}
              className="w-full mb-6 bg-gradient-to-r from-amber-100 to-amber-50 hover:from-amber-200 hover:to-amber-100 rounded-2xl p-5 border border-amber-300 transition-all flex items-center justify-between group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-amber-200 flex items-center justify-center">
                  <MessageCircle className="w-6 h-6 text-amber-600" />
                </div>
                <div className="text-left">
                  <h3 className="text-lg font-semibold text-amber-800">
                    View as Conversation with Allah
                  </h3>
                  <p className="text-amber-600 text-sm">
                    See how Allah responds to each verse you recite
                  </p>
                </div>
              </div>
              <ArrowRight className="w-5 h-5 text-amber-600 group-hover:translate-x-1 transition-transform" />
            </button>
          )}

          {/* Recitations */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              What You Recite
            </h2>
            {selectedPosition.recitations.map((recitation, index) => (
              <RecitationCard
                key={recitation.id}
                recitation={recitation}
                index={index}
                isExpanded={expandedRecitation === recitation.id}
                revealedCount={revealedWords[recitation.id] || 0}
                onToggleExpand={() => handleToggleExpand(recitation.id)}
                onRevealAll={() => handleRevealAll(recitation.id, recitation.words.length)}
              />
            ))}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-gray-200">
            {selectedPosition.order > 1 ? (
              <button
                onClick={() => {
                  const prev = positions.find(p => p.order === selectedPosition.order - 1);
                  if (prev) handlePositionSelect(prev);
                }}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Previous
              </button>
            ) : (
              <div />
            )}
            {selectedPosition.order < positions.length ? (
              <button
                onClick={() => {
                  const next = positions.find(p => p.order === selectedPosition.order + 1);
                  if (next) handlePositionSelect(next);
                }}
                className="flex items-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleBackToGrid}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full text-sm font-medium transition-colors"
              >
                Complete
                <CheckCircle2 className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation Modal for Fatiha */}
        <AnimatePresence>
          {showConversation && selectedPosition && (
            <ConversationModal
              recitations={selectedPosition.recitations}
              onClose={() => setShowConversation(false)}
            />
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      {viewMode === 'grid' && renderGrid()}
      {viewMode === 'detail' && renderDetail()}
    </AnimatePresence>
  );
}

// Recitation Card Component
interface RecitationCardProps {
  recitation: SalahRecitation;
  index: number;
  isExpanded: boolean;
  revealedCount: number;
  onToggleExpand: () => void;
  onRevealAll: () => void;
}

function RecitationCard({
  recitation,
  index,
  isExpanded,
  revealedCount,
  onToggleExpand,
  onRevealAll
}: RecitationCardProps) {
  const allWordsRevealed = revealedCount >= recitation.words.length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      className="bg-white rounded-2xl border border-gray-200 overflow-hidden shadow-sm"
    >
      {/* Main Content */}
      <div className="p-6">
        {/* Arabic Text */}
        <div className="text-center mb-4">
          <p
            className="font-arabic text-3xl md:text-4xl text-emerald-700"
            dir="rtl"
            style={{ lineHeight: '2.2' }}
          >
            {recitation.arabic}
          </p>
        </div>

        {/* Transliteration */}
        <p className="text-center text-gray-500 italic mb-2">
          {recitation.transliteration}
        </p>

        {/* Translation */}
        <p className="text-center text-gray-900 font-medium">
          {recitation.translation}
        </p>

        {/* Reference */}
        {recitation.reference && (
          <p className="text-center text-gray-400 text-xs mt-2">
            {recitation.reference}
          </p>
        )}

        {/* Repeat indicator */}
        {recitation.timesToRepeat && recitation.timesToRepeat > 1 && (
          <div className="text-center mt-3">
            <span className="text-xs text-amber-700 bg-amber-100 px-2 py-1 rounded-full">
              Repeat {recitation.timesToRepeat} times
            </span>
          </div>
        )}

        {/* Word-by-Word Expand Button */}
        <button
          onClick={onToggleExpand}
          className="w-full mt-4 pt-4 border-t border-gray-200 flex items-center justify-center gap-2 text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          <Eye className="w-4 h-4" />
          {isExpanded ? 'Hide' : 'Show'} Word-by-Word Breakdown
          {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      </div>

      {/* Expanded Word-by-Word Content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 pb-6 border-t border-gray-200 pt-4 bg-gray-50">
              {/* Word-by-Word Grid - Tap to reveal meanings */}
              <button
                onClick={onRevealAll}
                disabled={allWordsRevealed}
                className="w-full"
              >
                <div className="flex flex-wrap justify-center gap-3 mb-4" dir="rtl">
                  {recitation.words.map((word, wordIndex) => {
                    // First word is always revealed, others depend on revealedCount
                    const isRevealed = wordIndex === 0 || wordIndex < revealedCount;
                    return (
                      <motion.div
                        key={wordIndex}
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{
                          scale: isRevealed ? 1 : 0.95,
                          opacity: isRevealed ? 1 : 0.5
                        }}
                        className={`text-center p-3 rounded-xl transition-all ${
                          isRevealed
                            ? 'bg-emerald-100 border border-emerald-300'
                            : 'bg-white border border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        <div className="font-arabic text-xl text-emerald-700 mb-1">
                          {word.arabic}
                        </div>
                        {isRevealed ? (
                          <>
                            <div className="text-xs text-gray-500 italic mb-0.5">
                              {word.transliteration}
                            </div>
                            <div className="text-sm text-gray-900 font-medium">
                              {word.meaning}
                            </div>
                          </>
                        ) : (
                          <div className="text-xs text-gray-400">
                            ?
                          </div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              </button>

              {/* Reveal prompt or completion indicator */}
              <div className="flex justify-center">
                {!allWordsRevealed ? (
                  <p className="text-gray-500 text-sm">
                    Tap to reveal word meanings
                  </p>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-600 text-sm">
                    <CheckCircle2 className="w-4 h-4" />
                    All words revealed
                  </div>
                )}
              </div>

              {/* Spiritual Context */}
              {recitation.spiritualContext && allWordsRevealed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-amber-50 rounded-xl border border-amber-200"
                >
                  <h4 className="text-amber-700 font-medium mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    Spiritual Context
                  </h4>
                  <p className="text-gray-700 text-sm leading-relaxed">
                    {recitation.spiritualContext}
                  </p>
                </motion.div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Conversation Modal for Fatiha
interface ConversationModalProps {
  recitations: SalahRecitation[];
  onClose: () => void;
}

function ConversationModal({ recitations, onClose }: ConversationModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const conversationRecitations = recitations.filter(r => r.divinePerspective);
  const current = conversationRecitations[currentIndex];

  if (!current) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto border border-gray-200 shadow-xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Conversation with Allah</h2>
            <p className="text-sm text-gray-500">
              Based on Sahih Muslim 395
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Progress */}
          <div className="flex justify-center gap-2 mb-6">
            {conversationRecitations.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === currentIndex
                    ? 'bg-emerald-500 scale-125'
                    : i < currentIndex
                    ? 'bg-emerald-300'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          {/* Servant's Words */}
          <motion.div
            key={`servant-${currentIndex}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <div className="text-sm text-emerald-600 mb-2">You say:</div>
            <div className="bg-emerald-50 rounded-2xl rounded-br-md p-4 border border-emerald-200 ml-8">
              <p className="font-arabic text-2xl text-emerald-700 mb-2 text-right" dir="rtl">
                {current.arabic}
              </p>
              <p className="text-gray-700 text-sm">
                "{current.translation}"
              </p>
            </div>
          </motion.div>

          {/* Allah's Response */}
          {current.divinePerspective && (
            <motion.div
              key={`allah-${currentIndex}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <div className="text-sm text-amber-600 mb-2">Allah responds:</div>
              <div className="bg-amber-50 rounded-2xl rounded-bl-md p-4 border border-amber-200 mr-8">
                <p className="text-gray-900 text-lg leading-relaxed">
                  {current.divinePerspective.text}
                </p>
                {current.divinePerspective.hadithSource && (
                  <p className="text-amber-600 text-xs mt-2">
                    — {current.divinePerspective.hadithSource}
                  </p>
                )}
              </div>
            </motion.div>
          )}

          {/* Spiritual Context */}
          {current.spiritualContext && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="mt-6 p-4 bg-gray-50 rounded-xl border border-gray-200"
            >
              <p className="text-gray-600 text-sm leading-relaxed">
                {current.spiritualContext}
              </p>
            </motion.div>
          )}
        </div>

        {/* Navigation */}
        <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex justify-between">
          <button
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Previous
          </button>
          {currentIndex < conversationRecitations.length - 1 ? (
            <button
              onClick={() => setCurrentIndex(currentIndex + 1)}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors"
            >
              Next
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-full transition-colors"
            >
              Complete
              <CheckCircle2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
