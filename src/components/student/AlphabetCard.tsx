import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import { useSelfLearner } from '../../hooks/useSelfLearner';
import { TOTAL_LETTERS } from '../../lib/alphabetData';
import { Type, ChevronRight } from 'lucide-react';

// Compact dashboard entry point for the Huruf Hijaiyyah (Arabic alphabet) lesson -
// aimed at students starting completely from scratch, especially new Muslims.
export default function AlphabetCard() {
  const navigate = useNavigate();
  const { learnerId } = useSelfLearner();
  const [learnedCount, setLearnedCount] = useState<number | null>(null);

  useEffect(() => {
    if (!learnerId) return;
    let cancelled = false;
    (async () => {
      const { count } = await supabase
        .from('learner_alphabet_progress')
        .select('*', { count: 'exact', head: true })
        .eq('learner_id', learnerId)
        .eq('status', 'learned');
      if (!cancelled) setLearnedCount(count || 0);
    })();
    return () => { cancelled = true; };
  }, [learnerId]);

  if (!learnerId || learnedCount === null) return null;

  const pct = Math.round((learnedCount / TOTAL_LETTERS) * 100);

  return (
    <button
      onClick={() => navigate('/alphabet')}
      className="w-full text-left bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-5 mb-6 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors shadow-sm group"
    >
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Type className="w-4 h-4 text-emerald-500" />
          Learn the Arabic Alphabet
        </h2>
        <span className="text-xs font-medium text-gray-400 group-hover:text-emerald-500 flex items-center gap-0.5 transition-colors">
          Open <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {learnedCount === 0 ? 'Start from scratch - 28 letters, real words, no prior reading needed.' : `${learnedCount} of ${TOTAL_LETTERS} letters learned`}
      </p>
      <div className="h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
    </button>
  );
}
