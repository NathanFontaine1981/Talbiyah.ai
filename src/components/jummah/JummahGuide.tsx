import { useState } from 'react';
import {
  ChevronDown,
  CheckCircle,
  Volume2,
  Loader2,
  BookOpen,
  ExternalLink,
} from 'lucide-react';
import { JUMMAH_STEPS, JUMMAH_INTRO, type JummahStep } from '../../data/jummahGuideData';
import { useTTS } from '../shared/TTSProvider';

function StepCard({ step, isExpanded, onToggle }: { step: JummahStep; isExpanded: boolean; onToggle: () => void }) {
  const { playTTS, activeSectionId, isLoading } = useTTS();
  const sectionId = `jummah-step-${step.id}`;
  const isTTSActive = activeSectionId === sectionId;

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden transition-all">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center gap-4 text-left hover:bg-gray-50 dark:hover:bg-gray-750 transition"
      >
        <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center flex-shrink-0">
          <span className="text-emerald-700 dark:text-emerald-300 font-bold text-sm">{step.id}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-gray-900 dark:text-white">{step.title}</p>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic" dir="rtl">{step.titleArabic}</p>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform flex-shrink-0 ${isExpanded ? 'rotate-180' : ''}`} />
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 space-y-4 border-t border-gray-100 dark:border-gray-700">
          <p className="text-gray-700 dark:text-gray-300 text-sm pt-3 leading-relaxed">{step.description}</p>

          {/* Hadith Reference */}
          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <p className="text-sm text-gray-800 dark:text-gray-200 italic leading-relaxed">{step.hadithText}</p>
            <p className="text-xs text-amber-700 dark:text-amber-400 font-semibold mt-1.5">— {step.hadithReference}</p>
          </div>

          {/* Tips */}
          <div>
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Tips</p>
            <ul className="space-y-1.5">
              {step.tips.map((tip, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                  <CheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          {/* Al-Kahf link for step 3 */}
          {step.id === 3 && (
            <div className="flex flex-wrap gap-2">
              <a
                href="https://quran.com/18"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-700 transition flex items-center gap-1.5"
              >
                <ExternalLink className="w-3.5 h-3.5" /> Read Surah Al-Kahf
              </a>
            </div>
          )}

          {/* TTS button */}
          <button
            onClick={() => playTTS(step.ttsText, sectionId, `Step ${step.id}`)}
            className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm hover:bg-gray-200 dark:hover:bg-gray-600 transition"
          >
            {isTTSActive && isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Volume2 className="w-4 h-4" />
            )}
            {isTTSActive ? 'Playing...' : 'Listen'}
          </button>
        </div>
      )}
    </div>
  );
}

export default function JummahGuide() {
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());

  function toggleStep(id: number) {
    setExpandedSteps(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  return (
    <div className="space-y-6">
      {/* Intro Banner */}
      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 shadow-lg">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
            <BookOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-white">{JUMMAH_INTRO.title}</h2>
            <p className="text-emerald-100 text-sm">Your guide to the best day of the week</p>
          </div>
        </div>
        <p className="text-white/90 text-sm leading-relaxed">{JUMMAH_INTRO.description}</p>
      </div>

      {/* Steps */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">7 Sunnahs of Jumu'ah</h3>
        {JUMMAH_STEPS.map(step => (
          <StepCard
            key={step.id}
            step={step}
            isExpanded={expandedSteps.has(step.id)}
            onToggle={() => toggleStep(step.id)}
          />
        ))}
      </div>
    </div>
  );
}
