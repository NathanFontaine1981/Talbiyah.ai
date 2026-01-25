/**
 * DuaBlockSelector Component
 * Renders selectable options for each block type
 */

import { useState, useEffect } from 'react';
import { Check, ChevronDown, ChevronUp, Info, Plus, X, PenLine, AlertCircle } from 'lucide-react';
import { type DuaBlock, type DuaBlockType, type CustomBlockText, BLOCK_TYPE_INFO } from '../../data/duaBlocks';

interface DuaBlockSelectorProps {
  blockType: DuaBlockType;
  blocks: DuaBlock[];
  selectedBlockId: string | null;
  selectedBlockIds?: string[]; // For request blocks (multiple selection)
  onSelect: (blockId: string) => void;
  onDeselect?: (blockId: string) => void; // For removing from multiple selection
  allowMultiple?: boolean;
  categoryId?: string | null;
  isLoading?: boolean;
  // Custom text support
  customText?: CustomBlockText;
  onCustomTextChange?: (customText: CustomBlockText | undefined) => void;
}

export default function DuaBlockSelector({
  blockType,
  blocks,
  selectedBlockId,
  selectedBlockIds = [],
  onSelect,
  onDeselect,
  allowMultiple = false,
  categoryId,
  isLoading = false,
  customText,
  onCustomTextChange
}: DuaBlockSelectorProps) {
  const [expandedBlockId, setExpandedBlockId] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [localCustomText, setLocalCustomText] = useState(customText?.text || '');

  const info = BLOCK_TYPE_INFO[blockType];
  const hasCustomText = customText?.text && customText.text.trim().length > 0;

  // Sync local state with prop when it changes (e.g., navigating between steps)
  useEffect(() => {
    setLocalCustomText(customText?.text || '');
    if (customText?.text) {
      setShowCustomInput(false);
    }
  }, [customText?.text, blockType]);

  // Filter blocks: show category-specific first, then universal blocks
  const filteredBlocks = blocks.filter(block => {
    // Always include universal blocks (category_id is null)
    if (!block.category_id) return true;
    // Include category-specific blocks if they match
    if (categoryId && block.category_id === categoryId) return true;
    return false;
  });

  // Sort: core blocks first, then by display_order
  const sortedBlocks = [...filteredBlocks].sort((a, b) => {
    // Category-specific blocks first if we have a category
    if (categoryId) {
      if (a.category_id === categoryId && b.category_id !== categoryId) return -1;
      if (b.category_id === categoryId && a.category_id !== categoryId) return 1;
    }
    // Then core blocks
    if (a.is_core && !b.is_core) return -1;
    if (!a.is_core && b.is_core) return 1;
    // Then by display order
    return a.display_order - b.display_order;
  });

  // Limit display unless showing all
  const displayBlocks = showAll ? sortedBlocks : sortedBlocks.slice(0, 5);
  const hasMore = sortedBlocks.length > 5;

  const isSelected = (blockId: string) => {
    if (allowMultiple) {
      return selectedBlockIds.includes(blockId);
    }
    return selectedBlockId === blockId;
  };

  const handleSelect = (blockId: string) => {
    if (allowMultiple && isSelected(blockId)) {
      onDeselect?.(blockId);
    } else {
      onSelect(blockId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse bg-gray-100 rounded-lg h-24" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
            {info.step}
          </span>
          {info.name}
          <span className="text-gray-400 font-arabic text-sm">({info.nameArabic})</span>
        </h3>
        <p className="text-sm text-gray-600 mt-1 ml-10">{info.description}</p>
      </div>

      {/* Selected blocks summary for multiple selection */}
      {allowMultiple && selectedBlockIds.length > 0 && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <p className="text-sm font-medium text-emerald-800 mb-2">
            Selected ({selectedBlockIds.length}):
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedBlockIds.map(id => {
              const block = blocks.find(b => b.id === id);
              if (!block) return null;
              return (
                <span
                  key={id}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-white text-emerald-700 text-xs rounded-full border border-emerald-200"
                >
                  {block.source || 'Selected'}
                  <button
                    onClick={() => onDeselect?.(id)}
                    className="hover:text-red-500"
                  >
                    <X size={12} />
                  </button>
                </span>
              );
            })}
          </div>
        </div>
      )}

      {/* Block options */}
      <div className="space-y-3">
        {displayBlocks.map(block => {
          const selected = isSelected(block.id);
          const expanded = expandedBlockId === block.id;

          return (
            <div
              key={block.id}
              className={`border rounded-lg overflow-hidden transition-all ${
                selected
                  ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-500'
                  : 'border-gray-200 bg-white hover:border-emerald-300'
              }`}
            >
              <button
                onClick={() => handleSelect(block.id)}
                className="w-full p-4 text-left"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* Arabic text */}
                    <p
                      className="text-lg font-arabic text-gray-900 leading-loose"
                      dir="rtl"
                    >
                      {block.arabic_text}
                    </p>

                    {/* Transliteration */}
                    <p className="text-sm text-gray-600 italic mt-2">
                      {block.transliteration}
                    </p>

                    {/* Source badge */}
                    {block.source && (
                      <span className="inline-block mt-2 px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded">
                        {block.source}
                      </span>
                    )}
                  </div>

                  {/* Selection indicator */}
                  <div className="ml-4">
                    {selected ? (
                      <div className="w-6 h-6 rounded-full bg-emerald-600 flex items-center justify-center">
                        <Check size={14} className="text-white" />
                      </div>
                    ) : allowMultiple ? (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center hover:border-emerald-500">
                        <Plus size={14} className="text-gray-400" />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300" />
                    )}
                  </div>
                </div>
              </button>

              {/* Expand for more details */}
              <div className="border-t border-gray-100">
                <button
                  onClick={() => setExpandedBlockId(expanded ? null : block.id)}
                  className="w-full px-4 py-2 flex items-center justify-between text-sm text-gray-500 hover:bg-gray-50"
                >
                  <span className="flex items-center gap-1">
                    <Info size={14} />
                    {expanded ? 'Hide translation' : 'Show translation'}
                  </span>
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>

                {expanded && (
                  <div className="px-4 pb-4 space-y-2">
                    <p className="text-gray-700">{block.english_translation}</p>
                    {block.allah_names && block.allah_names.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        <span className="text-xs text-gray-500">Names of Allah:</span>
                        {block.allah_names.map(name => (
                          <span
                            key={name}
                            className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded"
                          >
                            {name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Show more/less button */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full py-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1"
        >
          {showAll ? (
            <>
              <ChevronUp size={16} />
              Show less
            </>
          ) : (
            <>
              <ChevronDown size={16} />
              Show {sortedBlocks.length - 5} more options
            </>
          )}
        </button>
      )}

      {/* Empty state with custom input option */}
      {displayBlocks.length === 0 && !showCustomInput && !hasCustomText && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No pre-built blocks available for this category.</p>
          <button
            onClick={() => setShowCustomInput(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <PenLine size={18} />
            Write Your Own
          </button>
        </div>
      )}

      {/* Write your own button when blocks exist */}
      {displayBlocks.length > 0 && !showCustomInput && !hasCustomText && onCustomTextChange && (
        <button
          onClick={() => setShowCustomInput(true)}
          className="w-full py-3 mt-2 text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-2 border-2 border-dashed border-emerald-200 rounded-lg hover:border-emerald-400 transition-colors"
        >
          <PenLine size={16} />
          Or write your own {info.name.toLowerCase()}
        </button>
      )}

      {/* Custom text input form */}
      {(showCustomInput || hasCustomText) && onCustomTextChange && (
        <div className="mt-4 p-4 bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-medium text-gray-900 flex items-center gap-2">
              <PenLine size={18} className="text-violet-500" />
              Write Your Own {info.name}
            </h4>
            {hasCustomText && (
              <button
                onClick={() => {
                  setShowCustomInput(false);
                  setLocalCustomText('');
                  onCustomTextChange(undefined);
                }}
                className="text-red-500 hover:text-red-600 text-sm flex items-center gap-1"
              >
                <X size={14} />
                Remove
              </button>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Your text (English or Arabic)
              </label>
              <textarea
                value={localCustomText}
                onChange={(e) => setLocalCustomText(e.target.value)}
                placeholder={getPlaceholderForBlockType(blockType)}
                className="w-full p-3 border border-violet-200 rounded-lg focus:ring-2 focus:ring-violet-500 focus:border-violet-500 resize-none text-gray-700"
                rows={3}
              />
            </div>

            <div className="flex items-start gap-2 p-2 bg-amber-50 rounded border border-amber-200">
              <AlertCircle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-amber-800 text-xs">
                Write sincerely from your heart. Your personal words are just as valid as traditional phrases.
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  if (localCustomText.trim()) {
                    onCustomTextChange({ text: localCustomText.trim() });
                    setShowCustomInput(false);
                  }
                }}
                disabled={!localCustomText.trim()}
                className="flex-1 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {hasCustomText ? 'Update' : 'Add'} Custom Text
              </button>
              {!hasCustomText && (
                <button
                  onClick={() => {
                    setShowCustomInput(false);
                    setLocalCustomText('');
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-900"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Show saved custom text */}
      {hasCustomText && !showCustomInput && (
        <div className="mt-4 p-4 bg-violet-50 border border-violet-200 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-violet-700 mb-1 flex items-center gap-2">
                <Check size={16} className="text-violet-600" />
                Your Custom {info.name}
              </p>
              <p className="text-gray-700">{customText?.text}</p>
            </div>
            <button
              onClick={() => setShowCustomInput(true)}
              className="text-violet-600 hover:text-violet-700 text-sm"
            >
              Edit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function getPlaceholderForBlockType(blockType: DuaBlockType): string {
  switch (blockType) {
    case 'hamd':
      return 'e.g., "All praise is due to Allah, the Most Merciful, the Most Compassionate..."';
    case 'salawat':
      return 'e.g., "O Allah, send blessings upon Muhammad and the family of Muhammad..."';
    case 'admission':
      return 'e.g., "O Allah, I acknowledge my shortcomings and turn to You seeking forgiveness..."';
    case 'request':
      return 'e.g., "O Allah, grant me strength and patience in my journey..."';
    case 'others':
      return 'e.g., "O Allah, bless my parents and grant them good health and happiness..."';
    case 'closing':
      return 'e.g., "O Allah, accept this supplication. You are the Hearer, the Knower..."';
    default:
      return 'Write your own text here...';
  }
}
