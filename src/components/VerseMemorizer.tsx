import { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, CheckCircle, Book, Mic, Brain, Loader, Volume2, ChevronDown } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

// Clean footnote markers from translation text
function cleanTranslation(text: string): string {
  return text
    .replace(/(\w)(\d+)(?=\s|$|[.,;:!?])/g, '$1')
    .replace(/<sup>.*?<\/sup>/g, '')
    .replace(/\[\d+\]/g, '')
    .trim();
}

interface VerseMemorizerProps {
  ayahNumber: number;
  arabic: string;
  transliteration?: string;
  translation: string;
  lessonId: string;
  surahNumber?: number;
  surahName?: string;
  teacherNote?: string;
}

type Stage = 'understanding' | 'fluency' | 'memorization';

interface AyahProgress {
  understanding_completed: boolean;
  fluency_completed: boolean;
  memorization_completed: boolean;
}

// Premium Verse Card Component - Apple Aesthetic
export default function VerseMemorizer({
  ayahNumber,
  arabic,
  transliteration,
  translation,
  surahNumber,
  surahName,
  teacherNote
}: VerseMemorizerProps) {
  const [userId, setUserId] = useState<string | null>(null);
  const [showInsights, setShowInsights] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<AyahProgress>({
    understanding_completed: false,
    fluency_completed: false,
    memorization_completed: false
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<Stage | null>(null);
  const [showShimmer, setShowShimmer] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get current user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUserId(user?.id || null);
    };
    getUser();
  }, []);

  // Load existing progress
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
        // No existing progress
      } finally {
        setLoading(false);
      }
    };

    loadProgress();
  }, [userId, surahNumber, ayahNumber]);

  // Play audio for this ayah
  const playAudio = async () => {
    if (!surahNumber || !ayahNumber) return;
    setIsPlaying(true);

    const audioUrl = `https://cdn.islamic.network/quran/audio/128/ar.alafasy/${getAbsoluteAyahNumber(surahNumber, ayahNumber)}.mp3`;

    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play().catch(() => setIsPlaying(false));
    }
  };

  // Calculate absolute ayah number for audio API
  const getAbsoluteAyahNumber = (surah: number, ayah: number): number => {
    const surahStarts = [0, 1, 8, 142, 252, 372, 517, 680, 831, 956, 1070, 1178, 1265, 1319, 1371, 1423, 1480, 1573, 1670, 1766, 1846, 1923, 2012, 2085, 2166, 2236, 2326, 2406, 2455, 2520, 2591, 2653, 2708, 2766, 2808, 2853, 2911, 2993, 3066, 3143, 3187, 3253, 3296, 3349, 3395, 3441, 3508, 3563, 3598, 3647, 3690, 3730, 3780, 3844, 3899, 3968, 4024, 4108, 4175, 4218, 4259, 4297, 4333, 4369, 4415, 4452, 4497, 4543, 4591, 4634, 4689, 4716, 4755, 4782, 4810, 4829, 4856, 4907, 4953, 5000, 5053, 5082, 5104, 5140, 5168, 5192, 5210, 5232, 5255, 5280, 5309, 5329, 5352, 5363, 5380, 5390, 5402, 5413, 5421, 5433, 5440, 5452, 5457, 5466, 5471, 5479, 5486, 5491, 5496, 5502, 5507, 5511, 5515];
    return (surahStarts[surah - 1] || 0) + ayah;
  };

  // Toggle a stage completion
  const toggleStage = async (stage: Stage) => {
    if (!userId || !surahNumber) return;

    const stageKey = `${stage}_completed` as keyof AyahProgress;
    const newValue = !progress[stageKey];

    setSaving(stage);

    // Gold shimmer for memorization
    if (stage === 'memorization' && newValue) {
      setShowShimmer(true);
      setTimeout(() => setShowShimmer(false), 1500);
    }

    try {
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
        await supabase.from('quran_progress').update(updateData).eq('id', existing.id);
      } else {
        await supabase.from('quran_progress').insert({
          student_id: userId,
          surah_number: surahNumber,
          surah_name: surahName || `Surah ${surahNumber}`,
          ayah_number: ayahNumber,
          ...updateData,
          created_at: new Date().toISOString()
        });
      }

      setProgress(prev => ({ ...prev, [stageKey]: newValue }));
    } catch (err) {
      console.error('Error updating progress:', err);
    } finally {
      setSaving(null);
    }
  };

  const isMemorized = progress.memorization_completed;

  return (
    <>
      {/* Hidden audio element */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      {/* Inline styles for animations */}
      <style>{`
        @keyframes goldShimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        .gold-shimmer-effect {
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, rgba(212,175,55,0.2) 25%, rgba(212,175,55,0.4) 50%, rgba(212,175,55,0.2) 75%, transparent 100%);
          background-size: 200% 100%;
          animation: goldShimmer 1.5s ease-in-out;
          pointer-events: none;
          border-radius: inherit;
        }
        .audio-pulse {
          animation: pulse 1s ease-in-out infinite;
        }
      `}</style>

      {/* Main Card - Premium Apple Aesthetic */}
      <div
        className={`
          relative bg-white rounded-3xl overflow-visible
          transition-all duration-500
          ${isMemorized
            ? 'border-2 border-[#D4AF37] shadow-[0_0_30px_rgba(212,175,55,0.2)]'
            : 'border border-slate-100 shadow-sm'
          }
        `}
      >
        {/* Gold shimmer overlay */}
        {showShimmer && <div className="gold-shimmer-effect" />}

        {/* Main Content Area - Massive High-End Padding */}
        <div className="flex flex-col items-center justify-center p-10 sm:p-16 lg:p-20 overflow-visible">

          {/* Ayah Number Badge - Top Left */}
          <div className="absolute top-4 left-4">
            <div className={`
              w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm
              ${isMemorized
                ? 'bg-gradient-to-br from-amber-400 to-amber-500 text-white'
                : 'bg-slate-100 text-slate-500'
              }
            `}>
              {ayahNumber}
            </div>
          </div>

          {/* Audio Button - Top Right */}
          <div className="absolute top-4 right-4">
            <button
              onClick={playAudio}
              disabled={isPlaying}
              className={`
                w-10 h-10 rounded-xl flex items-center justify-center transition-all
                ${isPlaying
                  ? 'bg-emerald-100 text-emerald-600 audio-pulse'
                  : 'bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'
                }
              `}
            >
              <Volume2 className="w-5 h-5" />
            </button>
          </div>

          {/* Arabic Text - Premium Centered Display with Generous Line Height */}
          <div className="w-full flex flex-col items-center justify-center text-center overflow-visible py-8">
            <p
              className="text-center w-full overflow-visible px-4"
              dir="rtl"
              style={{
                fontFamily: "'Amiri Quran', 'Scheherazade New', 'Amiri', 'Traditional Arabic', serif",
                fontSize: 'clamp(2rem, 6vw, 3.5rem)',
                lineHeight: '2.8',
                color: '#0F172A',
                letterSpacing: '0.02em',
              }}
            >
              {arabic}
            </p>
          </div>

          {/* Surah Reference */}
          <p className="text-slate-400 text-sm font-medium mt-4">
            {surahName || 'Surah'} {surahNumber}:{ayahNumber}
          </p>

          {/* Reveal Insights Button */}
          <button
            onClick={() => setShowInsights(!showInsights)}
            className={`
              mt-6 flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
              transition-all duration-200
              ${showInsights
                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                : 'bg-slate-50 text-slate-500 border border-slate-200 hover:border-emerald-200 hover:text-emerald-600'
              }
            `}
          >
            <span>{showInsights ? 'Hide' : 'Show'} Translation & Notes</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showInsights ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Expandable Insights Section */}
        {showInsights && (
          <div className="border-t border-slate-100 bg-slate-50/50 p-6 sm:p-8">
            {/* Transliteration */}
            {transliteration && (
              <p className="text-center text-slate-500 italic text-lg mb-4 leading-relaxed">
                {transliteration}
              </p>
            )}

            {/* Translation */}
            <p className="text-center text-slate-700 text-lg leading-relaxed">
              "{cleanTranslation(translation)}"
            </p>

            {/* Teacher's Note */}
            {teacherNote && (
              <div className="mt-6 p-4 bg-amber-50 rounded-xl border-l-4 border-[#D4AF37]">
                <p className="text-xs text-amber-700 font-semibold uppercase tracking-wider mb-2">
                  Teacher's Note
                </p>
                <p className="text-amber-900 leading-relaxed">{teacherNote}</p>
              </div>
            )}
          </div>
        )}

        {/* Progress Toggles - Bottom Bar */}
        {userId && surahNumber && (
          <div className="border-t border-slate-100 px-6 py-4 bg-white rounded-b-2xl">
            <div className="flex items-center justify-center gap-2 sm:gap-3">
              {/* Meaning */}
              <button
                onClick={() => toggleStage('understanding')}
                disabled={loading || saving === 'understanding'}
                className={`
                  flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${progress.understanding_completed
                    ? 'bg-violet-100 text-violet-700 border border-violet-200'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-violet-200 hover:text-violet-600'
                  }
                  ${(loading || saving === 'understanding') ? 'opacity-50' : ''}
                `}
              >
                {saving === 'understanding' ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : progress.understanding_completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Brain className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Meaning</span>
              </button>

              {/* Fluent */}
              <button
                onClick={() => toggleStage('fluency')}
                disabled={loading || saving === 'fluency'}
                className={`
                  flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${progress.fluency_completed
                    ? 'bg-blue-100 text-blue-700 border border-blue-200'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-blue-200 hover:text-blue-600'
                  }
                  ${(loading || saving === 'fluency') ? 'opacity-50' : ''}
                `}
              >
                {saving === 'fluency' ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : progress.fluency_completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Mic className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Fluent</span>
              </button>

              {/* Memorized */}
              <button
                onClick={() => toggleStage('memorization')}
                disabled={loading || saving === 'memorization'}
                className={`
                  flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all
                  ${progress.memorization_completed
                    ? 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-700 border border-amber-300'
                    : 'bg-white text-slate-500 border border-slate-200 hover:border-amber-200 hover:text-amber-600'
                  }
                  ${(loading || saving === 'memorization') ? 'opacity-50' : ''}
                `}
              >
                {saving === 'memorization' ? (
                  <Loader className="w-4 h-4 animate-spin" />
                ) : progress.memorization_completed ? (
                  <CheckCircle className="w-4 h-4" />
                ) : (
                  <Book className="w-4 h-4" />
                )}
                <span className="hidden sm:inline">Memorized</span>
              </button>
            </div>

            {/* Progress saved indicator */}
            {(progress.understanding_completed || progress.fluency_completed || progress.memorization_completed) && (
              <div className="mt-3 flex items-center justify-center gap-1.5 text-xs text-emerald-600">
                <CheckCircle className="w-3 h-3" />
                <span>Progress saved</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// Verse List Component
interface VerseListMemorizerProps {
  verses: Array<{
    ayahNumber?: number;
    arabic: string;
    transliteration?: string;
    english: string;
    teacherNote?: string;
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
    <div className="space-y-6">
      {/* View Mode Toggle */}
      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setViewMode('single')}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${viewMode === 'single'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-200'
            }
          `}
        >
          Focus Mode
        </button>
        <button
          onClick={() => setViewMode('all')}
          className={`
            px-4 py-2 rounded-xl text-sm font-medium transition-all
            ${viewMode === 'all'
              ? 'bg-emerald-600 text-white'
              : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-200'
            }
          `}
        >
          View All
        </button>
      </div>

      {viewMode === 'single' ? (
        <>
          {/* Single Verse */}
          <VerseMemorizer
            key={activeVerse}
            ayahNumber={verses[activeVerse].ayahNumber || activeVerse + 1}
            arabic={verses[activeVerse].arabic}
            transliteration={verses[activeVerse].transliteration}
            translation={verses[activeVerse].english}
            teacherNote={verses[activeVerse].teacherNote}
            lessonId={lessonId}
            surahNumber={surahNumber}
            surahName={surahName}
          />

          {/* Navigation */}
          {verses.length > 1 && (
            <div className="flex items-center justify-between gap-4">
              <button
                onClick={() => setActiveVerse(Math.max(0, activeVerse - 1))}
                disabled={activeVerse === 0}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-white border border-slate-200 text-slate-600 hover:border-slate-300 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>

              {/* Ayah Selector Pills */}
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {verses.map((v, idx) => (
                  <button
                    key={idx}
                    onClick={() => setActiveVerse(idx)}
                    className={`
                      w-9 h-9 rounded-xl text-sm font-medium transition-all
                      ${idx === activeVerse
                        ? 'bg-emerald-600 text-white shadow-sm'
                        : 'bg-white text-slate-500 border border-slate-200 hover:border-emerald-200'
                      }
                    `}
                  >
                    {v.ayahNumber || idx + 1}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setActiveVerse(Math.min(verses.length - 1, activeVerse + 1))}
                disabled={activeVerse === verses.length - 1}
                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all font-medium"
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      ) : (
        /* All Verses Grid */
        <div className="space-y-6">
          {verses.map((verse, idx) => (
            <VerseMemorizer
              key={idx}
              ayahNumber={verse.ayahNumber || idx + 1}
              arabic={verse.arabic}
              transliteration={verse.transliteration}
              translation={verse.english}
              teacherNote={verse.teacherNote}
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
