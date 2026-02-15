import { useState, useEffect } from 'react';
import { BookOpen, CheckCircle, Circle, Brain, Volume2, Heart } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useSelfLearner } from '../../hooks/useSelfLearner';
import { SURAHS_DATA, TOTAL_AYAHS, calculateOverallProgress } from '../../lib/quranData';

interface SurahStats {
  surahNumber: number;
  name: string;
  englishName: string;
  ayahCount: number;
  understanding: number;
  fluency: number;
  memorization: number;
}

interface SurahProgressProps {
  variant?: 'full' | 'compact';
}

export default function SurahProgress({
  variant = 'full',
}: SurahProgressProps) {
  const { learnerId, loading: learnerLoading } = useSelfLearner();
  const [loading, setLoading] = useState(true);
  const [surahStats, setSurahStats] = useState<SurahStats[]>([]);
  const [totalStats, setTotalStats] = useState({
    memorised: 0,
    understood: 0,
    fluent: 0,
    surahsMemorisedCount: 0,
    surahsInProgress: 0,
    totalAyahs: TOTAL_AYAHS,
  });

  useEffect(() => {
    if (learnerLoading) return;
    if (learnerId) {
      fetchProgress(learnerId);
    } else {
      setLoading(false);
    }
  }, [learnerId, learnerLoading]);

  async function fetchProgress(targetLearnerId: string) {
    try {
      const { data: ayahData } = await supabase
        .from('ayah_progress')
        .select('surah_number, understanding_complete, fluency_complete, memorization_complete')
        .eq('learner_id', targetLearnerId);

      if (!ayahData) {
        setLoading(false);
        return;
      }

      // Aggregate per-surah
      const surahMap = new Map<number, { understanding: number; fluency: number; memorization: number }>();

      for (const row of ayahData) {
        const existing = surahMap.get(row.surah_number) || { understanding: 0, fluency: 0, memorization: 0 };
        if (row.understanding_complete) existing.understanding++;
        if (row.fluency_complete) existing.fluency++;
        if (row.memorization_complete) existing.memorization++;
        surahMap.set(row.surah_number, existing);
      }

      let totalMemorised = 0;
      let totalUnderstood = 0;
      let totalFluent = 0;
      let surahsMemorisedCount = 0;
      let surahsInProgress = 0;

      const stats: SurahStats[] = [];

      for (const surah of SURAHS_DATA) {
        const data = surahMap.get(surah.number);
        if (data) {
          totalMemorised += data.memorization;
          totalUnderstood += data.understanding;
          totalFluent += data.fluency;

          if (data.memorization >= surah.ayahCount) {
            surahsMemorisedCount++;
          } else if (data.memorization > 0 || data.understanding > 0 || data.fluency > 0) {
            surahsInProgress++;
          }

          stats.push({
            surahNumber: surah.number,
            name: surah.name,
            englishName: surah.englishName,
            ayahCount: surah.ayahCount,
            ...data,
          });
        }
      }

      setSurahStats(stats);
      setTotalStats({
        memorised: totalMemorised,
        understood: totalUnderstood,
        fluent: totalFluent,
        surahsMemorisedCount,
        surahsInProgress,
        totalAyahs: TOTAL_AYAHS,
      });
    } catch (error) {
      console.error('Error fetching surah progress:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
        <div className="grid grid-cols-3 gap-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  const memorisationPercent = calculateOverallProgress(totalStats.memorised);

  if (variant === 'compact') {
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-6 text-sm flex-wrap">
          <div className="flex items-center gap-2">
            <Heart className="w-4 h-4 text-orange-500" />
            <span className="font-medium">{totalStats.memorised}</span>
            <span className="text-gray-500 dark:text-gray-400">ayahs memorised</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span className="font-medium">{totalStats.surahsMemorisedCount}</span>
            <span className="text-gray-500 dark:text-gray-400">surahs complete</span>
          </div>
          <div className="flex items-center gap-2">
            <Circle className="w-4 h-4 text-blue-600" />
            <span className="font-medium">{totalStats.surahsInProgress}</span>
            <span className="text-gray-500 dark:text-gray-400">in progress</span>
          </div>
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Qur'an Progress</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {totalStats.surahsMemorisedCount} surahs memorised, {totalStats.surahsInProgress} in progress
          </p>
        </div>
        <div className="text-right">
          <p className="text-2xl font-bold text-emerald-600">{memorisationPercent}%</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">Overall</p>
        </div>
      </div>

      {/* Three Pillars Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl border border-cyan-200 dark:border-cyan-800 text-center">
          <Brain className="w-5 h-5 text-cyan-600 dark:text-cyan-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-cyan-700 dark:text-cyan-300">{totalStats.understood}</p>
          <p className="text-xs text-cyan-600 dark:text-cyan-400">Understood</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-xl border border-blue-200 dark:border-blue-800 text-center">
          <Volume2 className="w-5 h-5 text-blue-600 dark:text-blue-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-blue-700 dark:text-blue-300">{totalStats.fluent}</p>
          <p className="text-xs text-blue-600 dark:text-blue-400">Fluent</p>
        </div>
        <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-xl border border-orange-200 dark:border-orange-800 text-center">
          <Heart className="w-5 h-5 text-orange-600 dark:text-orange-400 mx-auto mb-1" />
          <p className="text-lg font-bold text-orange-700 dark:text-orange-300">{totalStats.memorised}</p>
          <p className="text-xs text-orange-600 dark:text-orange-400">Memorised</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
          <span>Memorisation Progress</span>
          <span>{totalStats.memorised} / {totalStats.totalAyahs} ayahs</span>
        </div>
        <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-500"
            style={{ width: `${memorisationPercent}%` }}
          />
        </div>
      </div>
    </div>
  );
}

export function SurahProgressMini() {
  return <SurahProgress variant="compact" />;
}
