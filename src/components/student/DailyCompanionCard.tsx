import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useSelfLearner } from '../../hooks/useSelfLearner';
import { SURAHS_DATA } from '../../lib/quranData';
import {
  BookOpen, Flame, CheckCircle2, ChevronRight, Moon, HeartHandshake,
  Sparkles, ScrollText, Compass,
} from 'lucide-react';

// The Daily Companion — the centrepiece of the student dashboard.
// Gated on the Qur'an tracker being filled in first: once the learner records
// which surahs they've memorised (/progress/quran), the companion plans each
// day — which surahs to review to RETAIN memorisation (rotation), which to
// recite in today's prayers, and quick access to the daily/frequent du'ās.

const PRAYERS = ['Fajr', 'Dhuhr', 'ʿAsr', 'Maghrib', 'ʿIshā'];

function surahName(n: number): string {
  return SURAHS_DATA.find((s) => s.number === n)?.name || `Sūrah ${n}`;
}
function ayahCount(n: number): number {
  return SURAHS_DATA.find((s) => s.number === n)?.ayahCount || 999;
}

export default function DailyCompanionCard() {
  const navigate = useNavigate();
  const { learnerId } = useSelfLearner();
  const [loading, setLoading] = useState(true);
  const [memorized, setMemorized] = useState<number[]>([]);
  const [streak, setStreak] = useState(0);
  const [reviewIdx, setReviewIdx] = useState(0);
  const [salahIdx, setSalahIdx] = useState(0);
  const [doneToday, setDoneToday] = useState(false);

  useEffect(() => {
    if (!learnerId) return;
    let cancelled = false;

    async function load() {
      try {
        const [{ data: learner }, { data: tracker }] = await Promise.all([
          supabase
            .from('learners')
            .select('current_streak, login_streak, last_maintenance_date, daily_review_rotation_index, salah_surah_rotation_index')
            .eq('id', learnerId)
            .single(),
          supabase
            .from('surah_retention_tracker')
            .select('surah_number, memorization_status')
            .eq('learner_id', learnerId),
        ]);
        if (cancelled) return;

        const memo = (tracker || [])
          .filter((r) => r.memorization_status === 'memorized')
          .map((r) => r.surah_number)
          .sort((a, b) => a - b);
        setMemorized(memo);
        setStreak(Math.max(learner?.current_streak || 0, learner?.login_streak || 0));
        setReviewIdx(learner?.daily_review_rotation_index || 0);
        setSalahIdx(learner?.salah_surah_rotation_index || 0);
        const today = new Date().toISOString().slice(0, 10);
        setDoneToday(learner?.last_maintenance_date === today);
      } catch (e) {
        console.error('Daily companion load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [learnerId]);

  if (!learnerId || loading) return null;

  // ---- SETUP STATE: the tracker must be filled in first ----
  if (memorized.length === 0) {
    return (
      <div className="mb-6 rounded-2xl overflow-hidden border border-emerald-300 dark:border-emerald-700 shadow-md">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 p-6 text-white">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-white/15 rounded-xl flex items-center justify-center flex-shrink-0">
              <BookOpen className="w-6 h-6" />
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-bold mb-1">Set up your Daily Companion</h2>
              <p className="text-emerald-50 text-sm leading-6 mb-4">
                Tell us which sūrahs you've memorised — even if it's just Al-Fātiḥah. Your
                companion will then plan every day for you: which sūrahs to review so you
                never lose them, which to recite in each prayer, and what to learn next.
              </p>
              <button
                onClick={() => navigate('/progress/quran')}
                className="px-6 py-3 bg-white text-emerald-700 rounded-xl font-bold hover:bg-emerald-50 transition flex items-center gap-2"
              >
                Fill in my Qur'an tracker
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- ACTIVE STATE: today's plan ----
  // Review rotation: next 3 memorised surahs from the rotation index.
  const reviewToday = Array.from(
    { length: Math.min(3, memorized.length) },
    (_, i) => memorized[(reviewIdx + i) % memorized.length]
  );
  // Salah plan: memorised surahs practical for prayer (≤40 āyāt, not Al-Fātiḥah), rotated.
  const salahPool = memorized.filter((s) => s !== 1 && ayahCount(s) <= 40);
  const salahPlan = salahPool.length > 0
    ? PRAYERS.map((p, i) => ({ prayer: p, surah: salahPool[(salahIdx + i) % salahPool.length] }))
    : [];

  return (
    <div className="mb-6 rounded-2xl overflow-hidden border border-emerald-200 dark:border-emerald-800 bg-white dark:bg-gray-800 shadow-sm">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-white" />
          <h2 className="text-lg font-bold text-white">Your Day with the Qur'an</h2>
        </div>
        <div className="flex items-center gap-1.5 bg-white/15 rounded-full px-3 py-1">
          <Flame className="w-4 h-4 text-amber-300" />
          <span className="text-white text-sm font-bold">{streak}</span>
        </div>
      </div>

      <div className="p-6">
        <div className="grid md:grid-cols-2 gap-5">
          {/* Today's review — retain what's memorised */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5" /> Today's review
            </h3>
            <div className="space-y-1.5 mb-3">
              {reviewToday.map((s) => (
                <div key={s} className="flex items-center gap-2 text-sm text-gray-800 dark:text-gray-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 flex-shrink-0" />
                  <span className="font-medium">{surahName(s)}</span>
                </div>
              ))}
            </div>
            {doneToday ? (
              <div className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-4 h-4" /> Today's session complete — māshāʼAllāh
              </div>
            ) : (
              <button
                onClick={() => navigate('/daily-review')}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold transition flex items-center gap-2"
              >
                Start today's session <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* In your prayers today */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2 flex items-center gap-1.5">
              <Moon className="w-3.5 h-3.5" /> In your prayers today
            </h3>
            {salahPlan.length > 0 ? (
              <div className="space-y-1">
                {salahPlan.map(({ prayer, surah }) => (
                  <div key={prayer} className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">{prayer}</span>
                    <span className="font-medium text-gray-800 dark:text-gray-200">{surahName(surah)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 leading-6">
                Memorise a short sūrah with your teacher and it will appear here, rotating
                through your prayers so nothing fades.
              </p>
            )}
          </div>
        </div>

        {/* Du'ā strip */}
        <div className="mt-5 pt-4 border-t border-gray-100 dark:border-gray-700">
          <div className="flex flex-wrap gap-2">
            <button onClick={() => navigate('/dua-builder')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300 text-xs font-semibold hover:bg-amber-100 transition">
              <HeartHandshake className="w-3.5 h-3.5" /> Daily du'ās
            </button>
            <button onClick={() => navigate('/istikhara-practice')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 transition">
              <Compass className="w-3.5 h-3.5" /> Istikhārah
            </button>
            <button onClick={() => navigate('/janazah-practice')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 transition">
              <ScrollText className="w-3.5 h-3.5" /> Janāzah
            </button>
            <button onClick={() => navigate('/jummah-guide')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 text-xs font-semibold hover:bg-gray-100 transition">
              <Moon className="w-3.5 h-3.5" /> Jumu'ah
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
