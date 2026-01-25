/**
 * DuaLearnTab Component
 * Educational content about dua structure and etiquette
 */

import { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Star, Clock, Heart } from 'lucide-react';
import { DUA_EDUCATION_TOPICS, BLOCK_TYPE_INFO, type DuaBlockType } from '../../data/duaBlocks';

export default function DuaLearnTab() {
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>('structure');

  const getBlockTypeIcon = (blockType?: DuaBlockType) => {
    if (!blockType) return null;
    return BLOCK_TYPE_INFO[blockType].step;
  };

  return (
    <div className="space-y-6">
      {/* Introduction */}
      <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-6">
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white rounded-lg shadow-sm">
            <BookOpen className="text-emerald-600" size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">
              Learn the Art of Dua
            </h2>
            <p className="text-gray-700 mt-2">
              Dua is the essence of worship. The Prophet (peace be upon him) said:
              "Dua is worship." Understanding its structure and etiquette helps us
              connect more deeply with Allah.
            </p>
          </div>
        </div>
      </div>

      {/* Quick tips banner */}
      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
        <h3 className="font-medium text-amber-800 flex items-center gap-2 mb-2">
          <Star size={18} className="text-amber-600" />
          Key Insight
        </h3>
        <p className="text-amber-900 text-sm">
          The scholars observed that the Prophet (peace be upon him) and the righteous
          predecessors followed a consistent structure in their duas. This structure
          maximizes the chances of acceptance and teaches proper adab with Allah.
        </p>
      </div>

      {/* Topics list */}
      <div className="space-y-3">
        {DUA_EDUCATION_TOPICS.map(topic => {
          const isExpanded = expandedTopicId === topic.id;
          const stepNumber = getBlockTypeIcon(topic.blockType);

          return (
            <div
              key={topic.id}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden"
            >
              <button
                onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {stepNumber && (
                    <span className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-sm font-bold">
                      {stepNumber}
                    </span>
                  )}
                  {!stepNumber && topic.id === 'best-times' && (
                    <span className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center">
                      <Clock size={16} />
                    </span>
                  )}
                  {!stepNumber && topic.id === 'etiquette' && (
                    <span className="w-8 h-8 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center">
                      <Heart size={16} />
                    </span>
                  )}
                  {!stepNumber && topic.id === 'structure' && (
                    <span className="w-8 h-8 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center">
                      <BookOpen size={16} />
                    </span>
                  )}
                  <div>
                    <h3 className="font-medium text-gray-900">{topic.title}</h3>
                    <p className="text-sm text-gray-500 font-arabic">{topic.titleArabic}</p>
                  </div>
                </div>
                {isExpanded ? (
                  <ChevronUp size={20} className="text-gray-400" />
                ) : (
                  <ChevronDown size={20} className="text-gray-400" />
                )}
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 border-t border-gray-100">
                  <div className="pt-4 prose prose-sm max-w-none">
                    {topic.content.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="text-gray-700 mb-3 whitespace-pre-line">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                  {topic.hadithReference && (
                    <div className="mt-4 pt-3 border-t border-gray-100">
                      <p className="text-xs text-gray-500">
                        Reference: {topic.hadithReference}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary card */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">The 6-Block Structure</h3>
        <div className="space-y-3">
          {(['hamd', 'salawat', 'admission', 'request', 'others', 'closing'] as const).map((blockType, index) => {
            const info = BLOCK_TYPE_INFO[blockType];
            return (
              <div key={blockType} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-emerald-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <div>
                  <p className="font-medium text-gray-900">
                    {info.name}
                    <span className="text-gray-400 font-arabic ml-2 text-sm">
                      ({info.nameArabic})
                    </span>
                  </p>
                  <p className="text-sm text-gray-600">{info.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Call to action */}
      <div className="text-center py-4">
        <p className="text-gray-600 mb-2">Ready to build your own dua?</p>
        <p className="text-sm text-emerald-600">
          Go to the Build tab to start composing using these principles.
        </p>
      </div>
    </div>
  );
}
