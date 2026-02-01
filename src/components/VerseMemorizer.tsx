import { useState, useEffect } from 'react';
import { BookOpen, ChevronLeft, ChevronRight, CheckCircle, Book, Mic, Brain, Loader } from 'lucide-react';

// Clean footnote markers from translation text (e.g., "ease1" -> "ease")
function cleanTranslation(text: string): string {
  return text
    .replace(/(\w)(\d+)(?=\s|$|[.,;:!?])/g, '$1') // Remove numbers attached to words
    .replace(/<sup>.*?<\/sup>/g, '') // Remove HTML superscript tags
    .replace(/\[\d+\]/g, '') // Remove bracketed numbers like [1]
    .trim();
}
import { supabase } from '../lib/supabaseClient';

interface VerseMemorizerProps {
  ayahNumber: number;
  arabic: string;
  transliteration?: string;
  translation: string;
  lessonId: string;
  surahNumber?: number;
  surahName?: string;
}

type Stage = 'understanding' | 'fluency' | 'memorization';

interface AyahProgress {
  understanding_completed: boolean;
  fluency_completed: boolean;
  memorization_completed: boolean;
}

export default function VerseMemorizer({
  ayahNumber,
  arabic,
  transliteration,
  translation,
  surahNumber,
  surahName
}: VerseMemorizerProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [showTransliteration, setShowTransliteration] = useState(true);
  const [showTranslation, setShowTranslation] = useState(false);
  const [progress, setProgress] = useState<AyahProgress>({
    understanding_completed: false,
    fluency_completed: false,
    memorization_completed: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Stage | null>(null);

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Load existing progress for this ayah
  useEffect(() => {
    if (!userId || !surahNumber) return;

    const loadProgress = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('quran_progress')
          .select('understanding_completed, fluency_completed, memorization_completed')
          .eq('student_id', userId)
          .eq('surah_number', surahNumber)
          .eq('ayah_number', ayahNumber)
          .maybeSingle();

        if (data && !error) {
          setProgress({
            understanding_completed: data.understanding_completed || false,
            fluency_completed: data.fluency_completed || false,
            memorization_completed: data.memorization_completed || false
          });
        }
      } catch (err) {
        // No existing progress, that's okay
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [userId, surahNumber, ayahNumber]);

  // Toggle a stage completion
  const toggleStage = async (stage: Stage) => {
    if (!userId || !surahNumber) return;

    const stageKey = `${stage}_completed` as keyof AyahProgress;
    const newValue = !progress[stageKey];

    setSaving(stage);

    try {
      // Check if record exists
      const { data: existing } = await supabase
        .from('quran_progress')
        .select('id')
        .eq('student_id', userId)
        .eq('surah_number', surahNumber)
        .eq('ayah_number', ayahNumber)
        .maybeSingle();

      const updateData = {
        [`${stage}_completed`]: newValue,
        [`${stage}_last_practiced`]: new Date().toISOString(),
        [`${stage}_confidence`]: newValue ? 0.85 : 0,
        updated_at: new Date().toISOString()
      };

      if (existing) {
        // Update existing record
        await supabase
          .from('quran_progress')
          .update(updateData)
          .eq('id', existing.id);
      } else {
        // Insert new record
        await supabase
          .from('quran_progress')
          .insert({
            student_id: userId,
            surah_number: surahNumber,
            surah_name: surahName || `Surah ${surahNumber}`,
            ayah_number: ayahNumber,
            ...updateData,
            created_at: new Date().toISOString()
          });
      }

      // Update local state
      setProgress(prev => ({
        ...prev,
        [stageKey]: newValue
      }));
    } catch (err) {
      console.error('Error updating progress:', err);
    } finally {
      setSaving(null);
    }
  };

  const StageButton = ({
    stage,
    icon: Icon,
    label,
    color
  }: {
    stage: Stage;
    icon: typeof Brain;
    label: string;
    color: string;
  }) => {
    const stageKey = `${stage}_completed` as keyof AyahProgress;
    const isCompleted = progress[stageKey];
    const isSaving = saving === stage;

    return (
      <button
        onClick={() => toggleStage(stage)}
        disabled={loading || isSaving}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
          isCompleted
            ? `${color} text-white shadow-sm`
            : `bg-gray-100 text-gray-600 hover:bg-gray-200`
        } ${(loading || isSaving) ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isSaving ? (
          <Loader className="w-4 h-4 animate-spin" />
        ) : isCompleted ? (
          <CheckCircle className="w-4 h-4" />
        ) : (
          <Icon className="w-4 h-4" />
        )}
        {label}
      </button>
    );
  };

  return (
    <div className="bg-gradient-to-br from-slate-900 via-emerald-950/30 to-slate-900 rounded-2xl border border-slate-700 overflow-hidden shadow-xl">
      {/* Main Content - Centered Arabic */}
      <div className="p-6 md:p-8">
        {/* Arabic Text - Large and Centered */}
        <div className="text-center mb-4">
          <p
            className="font-arabic text-3xl md:text-4xl text-emerald-200"
            dir="rtl"
            style={{ lineHeight: '2.2' }}
          >
            {arabic}
          </p>
        </div>

        {/* Transliteration - Centered Italic */}
        {transliteration && showTransliteration && (
          <p className="text-center text-slate-300 italic mb-2 text-lg">
            {transliteration}
          </p>
        )}

        {/* Translation - Centered Amber */}
        {showTranslation ? (
          <p className="text-center text-amber-100 text-lg leading-relaxed">
            {cleanTranslation(translation)}
          </p>
        ) : (
          <button
            onClick={() => setShowTranslation(true)}
            className="w-full py-3 mt-2 bg-emerald-900/40 hover:bg-emerald-800/50 rounded-xl text-emerald-300 font-medium text-sm flex items-center justify-center gap-2 transition-colors border border-emerald-700/30"
          >
            <ChevronRight className="w-4 h-4" />
            Tap to reveal translation
          </button>
        )}

        {/* Reference */}
        <p className="text-center text-slate-400 text-xs mt-3">
          {surahName ? `${surahName} ` : ''}
          {surahNumber ? `${surahNumber}:` : 'Ayah '}{ayahNumber}
        </p>
      </div>

      {/* Progress tracking buttons */}
      {userId && surahNumber && (
        <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700">
          <p className="text-xs text-slate-400 mb-3 text-center">Mark your progress:</p>
          <div className="flex flex-wrap justify-center gap-2">
            <StageButton
              stage="understanding"
              icon={Brain}
              label="Meaning"
              color="bg-purple-600"
            />
            <StageButton
              stage="fluency"
              icon={Mic}
              label="Fluent"
              color="bg-blue-600"
            />
            <StageButton
              stage="memorization"
              icon={Book}
              label="Memorized"
              color="bg-emerald-600"
            />
          </div>
          {/* Progress indicator */}
          {(progress.understanding_completed || progress.fluency_completed || progress.memorization_completed) && (
            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-emerald-400">
              <CheckCircle className="w-3 h-3" />
              <span>Progress saved</span>
            </div>
          )}
        </div>
      )}

      {/* Toggle buttons */}
      <div className="px-6 py-3 border-t border-slate-700 flex justify-center gap-4">
        {transliteration && (
          <button
            onClick={() => setShowTransliteration(!showTransliteration)}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            {showTransliteration ? 'Hide' : 'Show'} transliteration
          </button>
        )}
        {showTranslation && (
          <button
            onClick={() => setShowTranslation(false)}
            className="text-sm text-slate-400 hover:text-slate-200 transition-colors"
          >
            Hide translation
          </button>
        )}
      </div>
    </div>
  );
}

// Component for displaying a list of verses
interface VerseListMemorizerProps {
  verses: Array<{
    ayahNumber?: number;
    arabic: string;
    transliteration?: string;
    english: string;
  }>;
  lessonId: string;
  surahNumber?: number;
  surahName?: string;
}

export function VerseListMemorizer({ verses, lessonId, surahNumber, surahName }: VerseListMemorizerProps) {
  const [activeVerse, setActiveVerse] = useState<number>(0);
  const [viewMode, setViewMode] = useState<'single' | 'all'>('single');

  if (verses.length === 0) return null;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-emerald-600" />
          Verses Covered
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode('single')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'single'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            One at a Time
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            Show All
          </button>
        </div>
      </div>

      {/* Instructions - Dark theme */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 border border-slate-700 rounded-xl p-4">
        <p className="text-sm text-slate-300">
          <strong className="text-emerald-400">Track your progress:</strong> Mark each ayah as you learn.
          <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-purple-900/50 text-purple-300 rounded border border-purple-700/50">
            <Brain className="w-3 h-3" /> Meaning
          </span>
          <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-blue-900/50 text-blue-300 rounded border border-blue-700/50">
            <Mic className="w-3 h-3" /> Fluent
          </span>
          <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-emerald-900/50 text-emerald-300 rounded border border-emerald-700/50">
            <Book className="w-3 h-3" /> Memorized
          </span>
        </p>
      </div>

      {viewMode === 'single' ? (
        <>
          <VerseMemorizer
            key={activeVerse}
            ayahNumber={verses[activeVerse].ayahNumber || activeVerse + 1}
            arabic={verses[activeVerse].arabic}
            transliteration={verses[activeVerse].transliteration}
            translation={verses[activeVerse].english}
            lessonId={lessonId}
            surahNumber={surahNumber}
            surahName={surahName}
          />

          {/* Navigation */}
          {verses.length > 1 && (
            <div className="flex items-center justify-between bg-slate-800/50 rounded-xl p-3">
              <button
                onClick={() => setActiveVerse(Math.max(0, activeVerse - 1))}
                disabled={activeVerse === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-slate-700 text-slate-200 hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-slate-400">
                {activeVerse + 1} of {verses.length}
              </span>
              <button
                onClick={() => setActiveVerse(Math.min(verses.length - 1, activeVerse + 1))}
                disabled={activeVerse === verses.length - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Verse selector dots */}
          {verses.length > 1 && (
            <div className="flex justify-center gap-2 flex-wrap bg-slate-800/30 rounded-xl p-3">
              {verses.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveVerse(idx)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    idx === activeVerse
                      ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/30'
                      : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                  }`}
                >
                  {v.ayahNumber || idx + 1}
                </button>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="space-y-4">
          {verses.map((verse, idx) => (
            <VerseMemorizer
              key={idx}
              ayahNumber={verse.ayahNumber || idx + 1}
              arabic={verse.arabic}
              transliteration={verse.transliteration}
              translation={verse.english}
              lessonId={lessonId}
              surahNumber={surahNumber}
              surahName={surahName}
            />
          ))}
        </div>
      )}
    </div>
  );
}
