import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useSelfLearner } from '../../hooks/useSelfLearner';
import { Book, ChevronRight } from 'lucide-react';

// Compact dashboard version of the Qur'an Progress Tracker's three rings
// (Understood / Fluent / Memorised, as % of the 114 surahs). Same visual
// language as /progress/quran, sized for the dashboard; tapping through opens
// the full tracker. Light mode uses the -600 accent steps (validated for
// contrast on the white card), dark mode the page's original -400s.

const TOTAL_SURAHS = 114;
const R = 30;
const CIRC = 2 * Math.PI * R;

function Ring({ pct, count, label, colorClass }: { pct: number; count: number; label: string; colorClass: string }) {
  return (
    <div className="flex flex-col items-center">
      <div className="relative w-20 h-20 mb-1.5">
        <svg className="transform -rotate-90 w-full h-full" viewBox="0 0 72 72">
          <circle cx="36" cy="36" r={R} stroke="currentColor" strokeWidth="6" fill="transparent" className="text-gray-100 dark:text-gray-700" />
          <circle
            cx="36" cy="36" r={R} stroke="currentColor" strokeWidth="6" fill="transparent"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC - (pct / 100) * CIRC}
            strokeLinecap="round"
            className={`${colorClass} transition-all duration-1000 ease-out`}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-sm font-bold ${colorClass}`}>{pct}%</span>
        </div>
      </div>
      <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">{label}</p>
      <p className="text-[11px] text-gray-400 dark:text-gray-500">{count} sūrahs</p>
    </div>
  );
}

export default function QuranTrackerCard() {
  const navigate = useNavigate();
  const { learnerId } = useSelfLearner();
  const [counts, setCounts] = useState<{ understood: number; fluent: number; memorized: number } | null>(null);

  useEffect(() => {
    if (!learnerId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('surah_retention_tracker')
        .select('memorization_status, fluency_complete, understanding_complete')
        .eq('learner_id', learnerId);
      if (cancelled || !data) return;
      setCounts({
        understood: data.filter((r) => r.understanding_complete).length,
        fluent: data.filter((r) => r.fluency_complete).length,
        memorized: data.filter((r) => r.memorization_status === 'memorized').length,
      });
    })();
    return () => { cancelled = true; };
  }, [learnerId]);

  if (!learnerId || !counts) return null;

  const pct = (n: number) => Math.round((n / TOTAL_SURAHS) * 100);

  return (
    <button
      onClick={() => navigate('/progress/quran')}
      className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-sm group"
    >
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Book className="w-4 h-4 text-emerald-500" />
          Qur'an Progress Tracker
        </h2>
        <span className="text-xs font-medium text-gray-400 group-hover:text-emerald-500 flex items-center gap-0.5 transition-colors">
          Open tracker <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <Ring pct={pct(counts.understood)} count={counts.understood} label="Understood" colorClass="text-cyan-600 dark:text-cyan-400" />
        <Ring pct={pct(counts.fluent)} count={counts.fluent} label="Fluent" colorClass="text-blue-600 dark:text-blue-400" />
        <Ring pct={pct(counts.memorized)} count={counts.memorized} label="Memorised" colorClass="text-emerald-600 dark:text-emerald-400" />
      </div>
    </button>
  );
}
