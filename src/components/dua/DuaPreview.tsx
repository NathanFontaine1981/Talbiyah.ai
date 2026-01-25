/**
 * DuaPreview Component
 * Shows a live preview of the composed dua
 */

import { useState, useRef } from 'react';
import {
  Copy,
  Check,
  Volume2,
  Loader2,
  ChevronDown,
  ChevronUp,
  FileText,
  Pause,
  Play,
  StopCircle
} from 'lucide-react';
import { toast } from 'sonner';
import {
  type ComposedDua,
  getComposedArabicText,
  getComposedTransliteration,
  getComposedEnglish,
  getComposedNames,
  getCompositionProgress
} from '../../data/duaBlocks';

interface DuaPreviewProps {
  composition: ComposedDua;
  isCompact?: boolean;
  onGenerateAudio?: (text: string, language: 'arabic' | 'english') => Promise<void>;
  generatingAudio?: boolean;
}

export default function DuaPreview({
  composition,
  isCompact = false,
  onGenerateAudio,
  generatingAudio = false
}: DuaPreviewProps) {
  const [expanded, setExpanded] = useState(!isCompact);
  const [copied, setCopied] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);
  const [audioLanguage, setAudioLanguage] = useState<'arabic' | 'english'>('arabic');

  const progress = getCompositionProgress(composition);
  const arabicText = getComposedArabicText(composition);
  const transliteration = getComposedTransliteration(composition);
  const englishText = getComposedEnglish(composition);
  const namesUsed = getComposedNames(composition);

  const handleCopy = async () => {
    const fullText = `${arabicText}\n\n${transliteration}\n\n${englishText}`;
    try {
      await navigator.clipboard.writeText(fullText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      toast.success('Dua copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handlePlayAudio = async (language: 'arabic' | 'english') => {
    if (!onGenerateAudio) return;
    setAudioLanguage(language);
    const text = language === 'arabic' ? arabicText : englishText;
    await onGenerateAudio(text, language);
  };

  // Empty state
  if (!arabicText) {
    return (
      <div className="bg-gray-50 rounded-lg p-6 text-center">
        <FileText className="mx-auto text-gray-300 mb-3" size={40} />
        <p className="text-gray-500">Start selecting blocks to preview your dua</p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-50 to-emerald-100 px-4 py-3 border-b border-emerald-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">📜</span>
            <h3 className="font-semibold text-gray-900">Your Dua</h3>
            {progress < 100 && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                {progress}% complete
              </span>
            )}
          </div>
          {isCompact && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-gray-500 hover:text-gray-700"
            >
              {expanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
            </button>
          )}
        </div>

        {/* Progress bar */}
        <div className="mt-2 w-full bg-white/50 rounded-full h-1.5">
          <div
            className="bg-emerald-600 h-1.5 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {expanded && (
        <div className="p-4 space-y-4">
          {/* Arabic text */}
          <div className="bg-emerald-50 rounded-lg p-4">
            <p
              className="text-xl font-arabic leading-loose text-gray-900 text-right"
              dir="rtl"
            >
              {arabicText}
            </p>
          </div>

          {/* Transliteration */}
          <div>
            <p className="text-sm text-gray-600 italic leading-relaxed">
              {transliteration}
            </p>
          </div>

          {/* Toggle translation */}
          <button
            onClick={() => setShowTranslation(!showTranslation)}
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
          >
            {showTranslation ? 'Hide' : 'Show'} English translation
            {showTranslation ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          {showTranslation && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-gray-700 leading-relaxed">{englishText}</p>
            </div>
          )}

          {/* Names of Allah used */}
          {namesUsed.length > 0 && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-2">Names of Allah invoked:</p>
              <div className="flex flex-wrap gap-1">
                {namesUsed.map(name => (
                  <span
                    key={name}
                    className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full"
                  >
                    {name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-wrap gap-2 pt-3 border-t border-gray-100">
            {onGenerateAudio && (
              <>
                <button
                  onClick={() => handlePlayAudio('arabic')}
                  disabled={generatingAudio}
                  className="flex items-center gap-2 px-3 py-2 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                >
                  {generatingAudio && audioLanguage === 'arabic' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Volume2 size={14} />
                  )}
                  Play Arabic
                </button>
                <button
                  onClick={() => handlePlayAudio('english')}
                  disabled={generatingAudio}
                  className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {generatingAudio && audioLanguage === 'english' ? (
                    <Loader2 size={14} className="animate-spin" />
                  ) : (
                    <Volume2 size={14} />
                  )}
                  Play English
                </button>
              </>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-2 px-3 py-2 bg-gray-100 text-gray-700 text-sm rounded-lg hover:bg-gray-200"
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
