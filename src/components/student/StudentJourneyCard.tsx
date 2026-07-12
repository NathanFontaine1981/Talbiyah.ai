import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabaseClient';
import {
  Sparkles, ClipboardCheck, CalendarPlus, FileText, Moon, Landmark,
  HeartHandshake, Flame, CheckCircle2, ChevronRight, ChevronDown, ChevronUp, BookOpen,
} from 'lucide-react';

// "Your Journey" — a self-ticking feature-discovery checklist for new students
// and parents. Items live in student_onboarding_items (edit copy in the DB, no
// deploy needed); completion is detected from real usage and stored per user in
// student_onboarding_progress (synced across devices). Collapses to a slim strip
// once complete, and can be collapsed early.

const ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Sparkles, ClipboardCheck, CalendarPlus, FileText, Moon, Landmark, HeartHandshake, Flame, BookOpen,
};

interface JourneyItem {
  item_key: string;
  title: string;
  parent_title: string | null;
  hook: string;
  parent_hook: string | null;
  icon: string;
  route: string;
  sort_order: number;
}

const COLLAPSE_KEY = 'talbiyah_journey_collapsed';

export default function StudentJourneyCard({ isParent = false }: { isParent?: boolean }) {
  const navigate = useNavigate();
  const [items, setItems] = useState<JourneyItem[]>([]);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem(COLLAPSE_KEY) === 'true');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const [{ data: itemRows }, { data: progressRows }] = await Promise.all([
          supabase.from('student_onboarding_items').select('*').eq('is_active', true).order('sort_order'),
          supabase.from('student_onboarding_progress').select('item_key').eq('user_id', user.id),
        ]);
        if (cancelled || !itemRows?.length) return;

        const completed = new Set((progressRows || []).map((r) => r.item_key));
        const pending = itemRows.filter((i) => !completed.has(i.item_key));

        // Auto-detect completion from real usage for anything still pending.
        if (pending.length > 0) {
          const { data: learners } = await supabase
            .from('learners').select('id, login_streak, current_streak').eq('parent_id', user.id);
          const learnerIds = (learners || []).map((l) => l.id);

          const detected: string[] = [];
          const pendingKeys = new Set(pending.map((p) => p.item_key));

          if (learnerIds.length > 0) {
            if (pendingKeys.has('quran_tracker')) {
              const { count } = await supabase.from('surah_retention_tracker')
                .select('id', { count: 'exact', head: true }).in('learner_id', learnerIds);
              if ((count || 0) > 0) detected.push('quran_tracker');
            }
            if (pendingKeys.has('diagnostic')) {
              const { count } = await supabase.from('diagnostic_assessments')
                .select('id', { count: 'exact', head: true }).in('learner_id', learnerIds);
              if ((count || 0) > 0) detected.push('diagnostic');
            }
            let lessonIds: string[] = [];
            if (pendingKeys.has('first_lesson') || pendingKeys.has('study_notes')) {
              const { data: lessons } = await supabase.from('lessons')
                .select('id').in('learner_id', learnerIds).limit(100);
              lessonIds = (lessons || []).map((l) => l.id);
              if (pendingKeys.has('first_lesson') && lessonIds.length > 0) detected.push('first_lesson');
            }
            if (pendingKeys.has('study_notes') && lessonIds.length > 0) {
              const { count } = await supabase.from('lesson_insights')
                .select('id', { count: 'exact', head: true })
                .in('lesson_id', lessonIds).eq('viewed_by_student', true);
              if ((count || 0) > 0) detected.push('study_notes');
            }
            if (pendingKeys.has('daily_habit')) {
              const habit = (learners || []).some(
                (l) => (l.login_streak || 0) >= 2 || (l.current_streak || 0) >= 2
              );
              if (habit) detected.push('daily_habit');
            }
          }
          if (pendingKeys.has('salah')) {
            const { count } = await supabase.from('salah_daily_record')
              .select('id', { count: 'exact', head: true }).eq('user_id', user.id);
            if ((count || 0) > 0) detected.push('salah');
          }
          if (pendingKeys.has('foundations')) {
            const { count } = await supabase.from('foundation_progress')
              .select('id', { count: 'exact', head: true }).eq('user_id', user.id);
            if ((count || 0) > 0) detected.push('foundations');
          }
          if (pendingKeys.has('dua')) {
            const [a, b] = await Promise.all([
              supabase.from('saved_duas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
              supabase.from('user_dua_compositions').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
            ]);
            if ((a.count || 0) + (b.count || 0) > 0) detected.push('dua');
          }

          if (detected.length > 0) {
            await supabase.from('student_onboarding_progress').upsert(
              detected.map((k) => ({ user_id: user.id, item_key: k, source: 'auto' })),
              { onConflict: 'user_id,item_key', ignoreDuplicates: true }
            );
            detected.forEach((k) => completed.add(k));
          }
        }

        if (!cancelled) {
          setItems(itemRows);
          setDone(completed);
        }
      } catch (e) {
        console.error('Journey card load error:', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, []);

  if (loading || items.length === 0) return null;

  const doneCount = items.filter((i) => done.has(i.item_key)).length;
  const allDone = doneCount === items.length;
  const pct = Math.round((doneCount / items.length) * 100);

  function toggleCollapsed() {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(COLLAPSE_KEY, String(next));
  }

  // Slim strip: collapsed early, or journey complete
  if (collapsed || allDone) {
    return (
      <button
        onClick={toggleCollapsed}
        className="w-full flex items-center justify-between gap-3 bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-2xl px-5 py-3 mb-6 hover:border-emerald-400 transition-colors text-left"
      >
        <div className="flex items-center gap-3 min-w-0">
          <Sparkles className="w-5 h-5 text-emerald-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
            {allDone ? 'Your Journey — complete, māshāʼAllāh!' : `Your Journey — ${doneCount}/${items.length} discovered`}
          </span>
        </div>
        {!allDone && <ChevronDown className="w-4 h-4 text-gray-400 flex-shrink-0" />}
      </button>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-emerald-200 dark:border-emerald-800 rounded-2xl p-6 mb-6 shadow-sm">
      <div className="flex items-start justify-between gap-4 mb-1">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-500" />
            Your Journey
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
            {isParent
              ? 'Everything the Hub can do for your family — discover each one.'
              : 'Everything the Hub can do for you — discover each one.'}
          </p>
        </div>
        <button
          onClick={toggleCollapsed}
          aria-label="Collapse"
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="flex items-center gap-3 mb-5">
        <div className="flex-1 h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
        </div>
        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex-shrink-0">{doneCount}/{items.length}</span>
      </div>

      <div className="space-y-2">
        {items.map((item) => {
          const isDone = done.has(item.item_key);
          const Icon = ICONS[item.icon] || Sparkles;
          const title = isParent && item.parent_title ? item.parent_title : item.title;
          const hook = isParent && item.parent_hook ? item.parent_hook : item.hook;
          return (
            <button
              key={item.item_key}
              onClick={() => !isDone && navigate(item.route)}
              disabled={isDone}
              className={`w-full flex items-start gap-3 rounded-xl px-4 py-3 text-left transition-colors border ${
                isDone
                  ? 'bg-emerald-50/60 dark:bg-emerald-900/20 border-transparent'
                  : 'bg-gray-50 dark:bg-gray-700/40 border-gray-100 dark:border-gray-700 hover:border-emerald-300 hover:bg-emerald-50/40 cursor-pointer'
              }`}
            >
              <div className={`p-2 rounded-lg flex-shrink-0 ${isDone ? 'bg-emerald-100 dark:bg-emerald-900/40' : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-600'}`}>
                {isDone
                  ? <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  : <Icon className="w-4 h-4 text-emerald-600" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className={`text-sm font-semibold ${isDone ? 'text-emerald-700 dark:text-emerald-300 line-through decoration-emerald-300' : 'text-gray-900 dark:text-white'}`}>
                  {title}
                </p>
                {!isDone && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 leading-5">{hook}</p>}
              </div>
              {!isDone && <ChevronRight className="w-4 h-4 text-gray-300 mt-2 flex-shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
