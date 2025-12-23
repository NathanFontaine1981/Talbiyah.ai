import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Circle, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// Surah data for Juz Amma (30th Juz)
const JUZ_AMMA_SURAHS = [
  { number: 78, name: 'An-Naba', nameArabic: 'النبأ', ayat: 40 },
  { number: 79, name: 'An-Naziat', nameArabic: 'النازعات', ayat: 46 },
  { number: 80, name: 'Abasa', nameArabic: 'عبس', ayat: 42 },
  { number: 81, name: 'At-Takwir', nameArabic: 'التكوير', ayat: 29 },
  { number: 82, name: 'Al-Infitar', nameArabic: 'الانفطار', ayat: 19 },
  { number: 83, name: 'Al-Mutaffifin', nameArabic: 'المطففين', ayat: 36 },
  { number: 84, name: 'Al-Inshiqaq', nameArabic: 'الانشقاق', ayat: 25 },
  { number: 85, name: 'Al-Buruj', nameArabic: 'البروج', ayat: 22 },
  { number: 86, name: 'At-Tariq', nameArabic: 'الطارق', ayat: 17 },
  { number: 87, name: 'Al-Ala', nameArabic: 'الأعلى', ayat: 19 },
  { number: 88, name: 'Al-Ghashiyah', nameArabic: 'الغاشية', ayat: 26 },
  { number: 89, name: 'Al-Fajr', nameArabic: 'الفجر', ayat: 30 },
  { number: 90, name: 'Al-Balad', nameArabic: 'البلد', ayat: 20 },
  { number: 91, name: 'Ash-Shams', nameArabic: 'الشمس', ayat: 15 },
  { number: 92, name: 'Al-Layl', nameArabic: 'الليل', ayat: 21 },
  { number: 93, name: 'Ad-Duha', nameArabic: 'الضحى', ayat: 11 },
  { number: 94, name: 'Ash-Sharh', nameArabic: 'الشرح', ayat: 8 },
  { number: 95, name: 'At-Tin', nameArabic: 'التين', ayat: 8 },
  { number: 96, name: 'Al-Alaq', nameArabic: 'العلق', ayat: 19 },
  { number: 97, name: 'Al-Qadr', nameArabic: 'القدر', ayat: 5 },
  { number: 98, name: 'Al-Bayyinah', nameArabic: 'البينة', ayat: 8 },
  { number: 99, name: 'Az-Zalzalah', nameArabic: 'الزلزلة', ayat: 8 },
  { number: 100, name: 'Al-Adiyat', nameArabic: 'العاديات', ayat: 11 },
  { number: 101, name: 'Al-Qariah', nameArabic: 'القارعة', ayat: 11 },
  { number: 102, name: 'At-Takathur', nameArabic: 'التكاثر', ayat: 8 },
  { number: 103, name: 'Al-Asr', nameArabic: 'العصر', ayat: 3 },
  { number: 104, name: 'Al-Humazah', nameArabic: 'الهمزة', ayat: 9 },
  { number: 105, name: 'Al-Fil', nameArabic: 'الفيل', ayat: 5 },
  { number: 106, name: 'Quraysh', nameArabic: 'قريش', ayat: 4 },
  { number: 107, name: 'Al-Maun', nameArabic: 'الماعون', ayat: 7 },
  { number: 108, name: 'Al-Kawthar', nameArabic: 'الكوثر', ayat: 3 },
  { number: 109, name: 'Al-Kafirun', nameArabic: 'الكافرون', ayat: 6 },
  { number: 110, name: 'An-Nasr', nameArabic: 'النصر', ayat: 3 },
  { number: 111, name: 'Al-Masad', nameArabic: 'المسد', ayat: 5 },
  { number: 112, name: 'Al-Ikhlas', nameArabic: 'الإخلاص', ayat: 4 },
  { number: 113, name: 'Al-Falaq', nameArabic: 'الفلق', ayat: 5 },
  { number: 114, name: 'An-Nas', nameArabic: 'الناس', ayat: 6 },
];

// Essential surahs (Al-Fatiha)
const ESSENTIAL_SURAHS = [
  { number: 1, name: 'Al-Fatiha', nameArabic: 'الفاتحة', ayat: 7 },
];

interface SurahProgressData {
  surah_number: number;
  fahm_progress: number;
  fahm_completed: boolean;
  itqan_progress: number;
  itqan_completed: boolean;
  hifz_progress: number;
  hifz_completed: boolean;
  status: 'not_started' | 'in_progress' | 'completed';
}

interface SurahCardProps {
  surah: typeof JUZ_AMMA_SURAHS[0];
  progress: SurahProgressData | null;
  variant: 'compact' | 'detailed';
}

function SurahCard({ surah, progress, variant }: SurahCardProps) {
  const fahmPercent = progress ? Math.round((progress.fahm_progress / surah.ayat) * 100) : 0;
  const itqanPercent = progress ? Math.round((progress.itqan_progress / surah.ayat) * 100) : 0;
  const hifzPercent = progress ? Math.round((progress.hifz_progress / surah.ayat) * 100) : 0;

  const isComplete = progress?.hifz_completed;
  const inProgress = progress?.status === 'in_progress';

  if (variant === 'compact') {
    return (
      <div
        className={`relative p-3 rounded-lg border transition-all ${
          isComplete
            ? 'border-emerald-200 bg-emerald-50'
            : inProgress
            ? 'border-blue-200 bg-blue-50'
            : 'border-gray-200 bg-white hover:border-gray-300'
        }`}
      >
        {isComplete && (
          <CheckCircle className="absolute top-2 right-2 w-4 h-4 text-emerald-600" />
        )}
        <p className="font-arabic text-lg text-gray-800">{surah.nameArabic}</p>
        <p className="text-xs text-gray-500">{surah.name}</p>
        <p className="text-xs text-gray-400 mt-1">{surah.ayat} ayat</p>

        {/* Mini progress bars */}
        <div className="mt-2 flex gap-1">
          <div
            className="h-1 rounded-full bg-blue-500"
            style={{ width: `${fahmPercent}%`, minWidth: fahmPercent > 0 ? '4px' : '0' }}
            title={`Understanding: ${fahmPercent}%`}
          />
          <div
            className="h-1 rounded-full bg-emerald-500"
            style={{ width: `${itqanPercent}%`, minWidth: itqanPercent > 0 ? '4px' : '0' }}
            title={`Fluency: ${itqanPercent}%`}
          />
          <div
            className="h-1 rounded-full bg-purple-500"
            style={{ width: `${hifzPercent}%`, minWidth: hifzPercent > 0 ? '4px' : '0' }}
            title={`Memorization: ${hifzPercent}%`}
          />
        </div>
      </div>
    );
  }

  // Detailed variant
  return (
    <div
      className={`p-4 rounded-xl border ${
        isComplete
          ? 'border-emerald-200 bg-emerald-50'
          : inProgress
          ? 'border-blue-200 bg-blue-50'
          : 'border-gray-200 bg-white'
      }`}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">#{surah.number}</span>
            <h3 className="font-semibold text-gray-900">{surah.name}</h3>
            {isComplete && (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            )}
          </div>
          <p className="font-arabic text-xl text-gray-800 mt-1">{surah.nameArabic}</p>
        </div>
        <span className="text-sm text-gray-500">{surah.ayat} ayat</span>
      </div>

      {/* Three Pillars Progress */}
      <div className="space-y-2">
        {/* Fahm - Understanding */}
        <div className="flex items-center gap-3">
          <div className="w-20 flex items-center gap-1.5">
            {progress?.fahm_completed ? (
              <CheckCircle className="w-4 h-4 text-blue-600" />
            ) : (
              <Circle className="w-4 h-4 text-blue-300" />
            )}
            <span className="text-xs text-blue-600">Fahm</span>
          </div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full transition-all"
              style={{ width: `${fahmPercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-12 text-right">
            {progress?.fahm_progress || 0}/{surah.ayat}
          </span>
        </div>

        {/* Itqan - Fluency */}
        <div className="flex items-center gap-3">
          <div className="w-20 flex items-center gap-1.5">
            {progress?.itqan_completed ? (
              <CheckCircle className="w-4 h-4 text-emerald-600" />
            ) : (
              <Circle className="w-4 h-4 text-emerald-300" />
            )}
            <span className="text-xs text-emerald-600">Itqan</span>
          </div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${itqanPercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-12 text-right">
            {progress?.itqan_progress || 0}/{surah.ayat}
          </span>
        </div>

        {/* Hifz - Memorization */}
        <div className="flex items-center gap-3">
          <div className="w-20 flex items-center gap-1.5">
            {progress?.hifz_completed ? (
              <CheckCircle className="w-4 h-4 text-purple-600" />
            ) : (
              <Circle className="w-4 h-4 text-purple-300" />
            )}
            <span className="text-xs text-purple-600">Hifz</span>
          </div>
          <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all"
              style={{ width: `${hifzPercent}%` }}
            />
          </div>
          <span className="text-xs text-gray-500 w-12 text-right">
            {progress?.hifz_progress || 0}/{surah.ayat}
          </span>
        </div>
      </div>
    </div>
  );
}

interface SurahProgressProps {
  studentId?: string;
  variant?: 'full' | 'compact' | 'juz-amma-only';
  showEssential?: boolean;
}

export default function SurahProgress({
  studentId,
  variant = 'full',
  showEssential = true,
}: SurahProgressProps) {
  const [progressData, setProgressData] = useState<Map<number, SurahProgressData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    async function fetchProgress() {
      // Get current user if studentId not provided
      let targetId = studentId;
      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetId = user?.id;
      }
      if (!targetId) {
        setLoading(false);
        return;
      }

      try {
        const { data } = await supabase
          .from('student_surah_progress')
          .select('*')
          .eq('student_id', targetId);

        const progressMap = new Map<number, SurahProgressData>();
        (data || []).forEach((item) => {
          progressMap.set(item.surah_number, item);
        });
        setProgressData(progressMap);
      } catch (error) {
        console.error('Error fetching surah progress:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchProgress();
  }, [studentId]);

  const getStats = () => {
    let totalAyatMemorized = 0;
    let surahsComplete = 0;
    let surahsInProgress = 0;

    progressData.forEach((progress) => {
      totalAyatMemorized += progress.hifz_progress;
      if (progress.hifz_completed) {
        surahsComplete++;
      } else if (progress.status === 'in_progress') {
        surahsInProgress++;
      }
    });

    return { totalAyatMemorized, surahsComplete, surahsInProgress };
  };

  const stats = getStats();
  const displaySurahs = variant === 'juz-amma-only' ? JUZ_AMMA_SURAHS : [...ESSENTIAL_SURAHS, ...JUZ_AMMA_SURAHS];
  const visibleSurahs = showAll ? displaySurahs : displaySurahs.slice(0, 12);

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-48" />
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        {/* Stats Summary */}
        <div className="flex items-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <BookOpen className="w-4 h-4 text-purple-600" />
            <span className="font-medium">{stats.totalAyatMemorized}</span>
            <span className="text-gray-500">ayat memorized</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{stats.surahsComplete}</span>
            <span className="text-gray-500">surahs complete</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{stats.surahsInProgress}</span>
            <span className="text-gray-500">in progress</span>
          </div>
        </div>

        {/* Compact Surah Grid */}
        <div className="grid grid-cols-4 md:grid-cols-8 gap-2">
          {JUZ_AMMA_SURAHS.slice(-12).map((surah) => (
            <SurahCard
              key={surah.number}
              surah={surah}
              progress={progressData.get(surah.number) || null}
              variant="compact"
            />
          ))}
        </div>
      </div>
    );
  }

  // Full variant
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Surah Progress</h2>
          <p className="text-sm text-gray-500">Track your journey through the Quran</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <p className="text-2xl font-bold text-purple-600">{stats.totalAyatMemorized}</p>
            <p className="text-xs text-gray-500">Ayat Memorized</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-emerald-600">{stats.surahsComplete}</p>
            <p className="text-xs text-gray-500">Surahs Complete</p>
          </div>
        </div>
      </div>

      {/* Three Pillars Legend */}
      <div className="flex flex-wrap items-center gap-4 p-3 bg-gray-50 rounded-lg text-sm">
        <span className="text-gray-500">The Three Pillars:</span>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500" />
          <span className="text-blue-600">Fahm</span>
          <span className="text-gray-400">(Understanding)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-emerald-500" />
          <span className="text-emerald-600">Itqan</span>
          <span className="text-gray-400">(Fluency)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-purple-500" />
          <span className="text-purple-600">Hifz</span>
          <span className="text-gray-400">(Memorization)</span>
        </div>
      </div>

      {/* Essential Surahs */}
      {showEssential && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-gray-700">Essential Surahs</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {ESSENTIAL_SURAHS.map((surah) => (
              <SurahCard
                key={surah.number}
                surah={surah}
                progress={progressData.get(surah.number) || null}
                variant="detailed"
              />
            ))}
          </div>
        </div>
      )}

      {/* Juz Amma */}
      <div className="space-y-3">
        <h3 className="text-sm font-medium text-gray-700">Juz Amma (30th Juz)</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(showAll ? JUZ_AMMA_SURAHS : JUZ_AMMA_SURAHS.slice(-12)).map((surah) => (
            <SurahCard
              key={surah.number}
              surah={surah}
              progress={progressData.get(surah.number) || null}
              variant="detailed"
            />
          ))}
        </div>

        {JUZ_AMMA_SURAHS.length > 12 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="w-full py-3 text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {showAll ? (
              <>
                <ChevronUp className="w-4 h-4" />
                Show Less
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4" />
                Show All {JUZ_AMMA_SURAHS.length} Surahs
              </>
            )}
          </button>
        )}
      </div>
    </div>
  );
}

// Export compact version for dashboard
export function SurahProgressMini({ studentId }: { studentId?: string }) {
  return <SurahProgress studentId={studentId} variant="compact" showEssential={false} />;
}
