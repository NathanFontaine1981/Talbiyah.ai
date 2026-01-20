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
          .single();

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
        .single();

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
    <div className="bg-white rounded-xl border-l-4 border-emerald-500 border border-gray-200 overflow-hidden shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-3 text-white">
        <div className="flex items-center gap-3">
          <span className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center font-bold text-lg">
            {ayahNumber}
          </span>
          <div>
            <p className="font-medium">Ayah {ayahNumber}</p>
            {surahNumber && <p className="text-xs text-white/80">Surah {surahNumber}{surahName ? ` - ${surahName}` : ''}</p>}
          </div>
        </div>
      </div>

      {/* Arabic */}
      <div className="p-6 bg-gray-50">
        <p className="font-arabic text-3xl sm:text-4xl text-right leading-[2.2] text-gray-900" dir="rtl">
          {arabic}
        </p>
      </div>

      {/* Transliteration */}
      {transliteration && showTransliteration && (
        <div className="px-6 py-3 bg-cyan-50 border-t border-cyan-100">
          <p className="text-cyan-800 italic text-lg">{transliteration}</p>
        </div>
      )}

      {/* Translation - Tap to Reveal */}
      <div className="px-6 py-4 border-t border-gray-100">
        {showTranslation ? (
          <div>
            <p className="text-gray-700 text-lg leading-relaxed">{cleanTranslation(translation)}</p>
            <button
              onClick={() => setShowTranslation(false)}
              className="mt-2 text-sm text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Hide translation
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowTranslation(true)}
            className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 rounded-lg text-emerald-600 font-medium text-sm flex items-center justify-center gap-2 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
            Tap to reveal translation
          </button>
        )}
      </div>

      {/* Progress tracking buttons */}
      {userId && surahNumber && (
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
          <p className="text-xs text-gray-500 mb-3">Mark your progress for this ayah:</p>
          <div className="flex flex-wrap gap-2">
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
            <div className="mt-3 flex items-center gap-2 text-xs text-gray-500">
              <CheckCircle className="w-3 h-3 text-emerald-500" />
              <span>
                Progress saved to your Quran tracker
              </span>
            </div>
          )}
        </div>
      )}

      {/* Toggle transliteration */}
      {transliteration && (
        <div className="px-6 py-3 border-t border-gray-100">
          <button
            onClick={() => setShowTransliteration(!showTransliteration)}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            {showTransliteration ? 'Hide' : 'Show'} transliteration
          </button>
        </div>
      )}
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
      <div className="flex items-center justify-between">
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
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            One at a Time
          </button>
          <button
            onClick={() => setViewMode('all')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              viewMode === 'all'
                ? 'bg-emerald-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            Show All
          </button>
        </div>
      </div>

      {/* Instructions */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <p className="text-sm text-emerald-800">
          <strong>Track your progress:</strong> Mark each ayah as you learn.
          <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
            <Brain className="w-3 h-3" /> Meaning
          </span>
          <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
            <Mic className="w-3 h-3" /> Fluent
          </span>
          <span className="inline-flex items-center gap-1 mx-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 rounded">
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
            <div className="flex items-center justify-between">
              <button
                onClick={() => setActiveVerse(Math.max(0, activeVerse - 1))}
                disabled={activeVerse === 0}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
              <span className="text-sm text-gray-500">
                {activeVerse + 1} of {verses.length}
              </span>
              <button
                onClick={() => setActiveVerse(Math.min(verses.length - 1, activeVerse + 1))}
                disabled={activeVerse === verses.length - 1}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Verse selector dots */}
          {verses.length > 1 && (
            <div className="flex justify-center gap-2 flex-wrap">
              {verses.map((v, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveVerse(idx)}
                  className={`w-8 h-8 rounded-full text-sm font-medium transition-all ${
                    idx === activeVerse
                      ? 'bg-emerald-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
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
