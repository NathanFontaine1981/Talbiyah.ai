import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Volume2,
  Loader2,
  Check,
  BookOpen,
  Sun,
  Moon,
  ChevronDown,
  ChevronUp,
  Repeat,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import TTSProvider, { useTTS } from '../../components/shared/TTSProvider';
import { getAthkarByCategory, type Athkar } from '../../data/athkarData';

type Category = 'post_salah' | 'morning' | 'evening';

const CATEGORIES: { key: Category; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'post_salah', label: 'Post-Salah', icon: BookOpen },
  { key: 'morning', label: 'Morning', icon: Sun },
  { key: 'evening', label: 'Evening', icon: Moon },
];

export default function DailyAthkarPage() {
  return (
    <TTSProvider>
      <DailyAthkarPageInner />
    </TTSProvider>
  );
}

function DailyAthkarPageInner() {
  const navigate = useNavigate();
  const { playTTS, isLoading: ttsLoading, activeSectionId } = useTTS();
  const [category, setCategory] = useState<Category>('post_salah');
  const [completed, setCompleted] = useState<Set<string>>(new Set());
  const [counters, setCounters] = useState<Record<string, number>>({});
  const [memorised, setMemorised] = useState<Record<string, boolean>>({});
  const [expandedTranslations, setExpandedTranslations] = useState<Set<string>>(new Set());
  const [memLoading, setMemLoading] = useState(true);

  const athkarList = getAthkarByCategory(category);
  const completedCount = athkarList.filter(a => completed.has(a.id)).length;

  // Load memorisation state from Supabase
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setMemLoading(false); return; }

        const { data } = await supabase
          .from('athkar_memorisation')
          .select('athkar_id, memorised')
          .eq('user_id', user.id);

        if (data) {
          const map: Record<string, boolean> = {};
          for (const r of data) map[r.athkar_id] = r.memorised;
          setMemorised(map);
        }
      } catch {
        // Offline — graceful fallback
      } finally {
        setMemLoading(false);
      }
    })();
  }, []);

  const toggleMemorised = useCallback(async (athkarId: string) => {
    const newVal = !memorised[athkarId];
    setMemorised(prev => ({ ...prev, [athkarId]: newVal }));

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('athkar_memorisation').upsert(
        {
          user_id: user.id,
          athkar_id: athkarId,
          memorised: newVal,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,athkar_id' }
      );
    } catch (err) {
      console.error('Failed to save memorisation:', err);
    }
  }, [memorised]);

  const handleTap = useCallback((athkar: Athkar) => {
    if (athkar.repetitions <= 1) {
      // Single rep — toggle complete
      setCompleted(prev => {
        const next = new Set(prev);
        if (next.has(athkar.id)) next.delete(athkar.id);
        else next.add(athkar.id);
        return next;
      });
      return;
    }

    // Multi-rep — increment counter
    setCounters(prev => {
      const current = prev[athkar.id] || 0;
      const next = current + 1;
      if (next >= athkar.repetitions) {
        setCompleted(p => new Set(p).add(athkar.id));
        return { ...prev, [athkar.id]: athkar.repetitions };
      }
      return { ...prev, [athkar.id]: next };
    });
  }, []);

  const resetCounter = useCallback((athkarId: string) => {
    setCounters(prev => ({ ...prev, [athkarId]: 0 }));
    setCompleted(prev => {
      const next = new Set(prev);
      next.delete(athkarId);
      return next;
    });
  }, []);

  const toggleTranslation = useCallback((id: string) => {
    setExpandedTranslations(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const handleAudio = useCallback(async (athkar: Athkar) => {
    await playTTS(athkar.arabic, `athkar-${athkar.id}`, 'Daily Athkar', 'arabic');
  }, [playTTS]);

  // Reset completed when changing category
  useEffect(() => {
    setCompleted(new Set());
    setCounters({});
  }, [category]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold">Daily Athkar</h1>
          <p className="text-indigo-100 text-sm mt-1">Remembrance of Allah — after every prayer, morning, and evening</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6">
        {/* Category Tabs */}
        <div className="flex gap-2 mb-6 bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-gray-200 dark:border-gray-700">
          {CATEGORIES.map(cat => {
            const isActive = category === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setCategory(cat.key)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-sm font-medium transition ${
                  isActive
                    ? 'bg-indigo-500 text-white shadow-md'
                    : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <cat.icon className="w-4 h-4" />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Progress */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {completedCount}/{athkarList.length} completed
          </span>
          <div className="flex-1 mx-4 h-2 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
            <div
              className="h-full rounded-full bg-indigo-500 transition-all duration-500"
              style={{ width: `${athkarList.length > 0 ? (completedCount / athkarList.length) * 100 : 0}%` }}
            />
          </div>
          {completedCount === athkarList.length && athkarList.length > 0 && (
            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">Done!</span>
          )}
        </div>

        {/* Athkar List */}
        <div className="space-y-4">
          {athkarList.map(athkar => {
            const isDone = completed.has(athkar.id);
            const count = counters[athkar.id] || 0;
            const isExpanded = expandedTranslations.has(athkar.id);
            const isThisPlaying = activeSectionId === `athkar-${athkar.id}`;
            const isMemorisedItem = memorised[athkar.id] || false;

            return (
              <div
                key={athkar.id}
                className={`bg-white dark:bg-gray-800 rounded-xl border transition-all ${
                  isDone
                    ? 'border-emerald-300 dark:border-emerald-700 bg-emerald-50/50 dark:bg-emerald-900/10'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Arabic text — large, RTL */}
                <div
                  className="p-5 pb-3 cursor-pointer"
                  onClick={() => handleTap(athkar)}
                >
                  <p
                    dir="rtl"
                    className={`text-xl sm:text-2xl leading-loose font-arabic text-right ${
                      isDone ? 'text-emerald-800 dark:text-emerald-200' : 'text-gray-900 dark:text-white'
                    }`}
                    style={{ fontFamily: "'Scheherazade New', 'Amiri', 'Traditional Arabic', serif", lineHeight: '2.2' }}
                  >
                    {athkar.arabic}
                  </p>
                </div>

                {/* Transliteration */}
                <div className="px-5 pb-2">
                  <p className={`text-sm italic ${isDone ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400'}`}>
                    {athkar.transliteration}
                  </p>
                </div>

                {/* Translation (collapsible) */}
                <div className="px-5 pb-3">
                  <button
                    onClick={() => toggleTranslation(athkar.id)}
                    className="flex items-center gap-1 text-xs text-indigo-500 dark:text-indigo-400 hover:text-indigo-600 transition"
                  >
                    {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                    {isExpanded ? 'Hide translation' : 'Show translation'}
                  </button>
                  {isExpanded && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-2 leading-relaxed">
                      {athkar.english}
                    </p>
                  )}
                </div>

                {/* Action bar */}
                <div className="px-5 pb-4 flex items-center justify-between flex-wrap gap-2">
                  {/* Left: counter/complete + audio */}
                  <div className="flex items-center gap-2">
                    {/* Tap counter or done indicator */}
                    {athkar.repetitions > 1 ? (
                      <button
                        onClick={() => handleTap(athkar)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-200 dark:hover:bg-indigo-900/50'
                        }`}
                      >
                        {isDone ? (
                          <Check className="w-3.5 h-3.5" />
                        ) : (
                          <Repeat className="w-3.5 h-3.5" />
                        )}
                        <span>{count}/{athkar.repetitions}</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => handleTap(athkar)}
                        className={`w-7 h-7 rounded-full flex items-center justify-center transition ${
                          isDone
                            ? 'bg-emerald-500 text-white'
                            : 'border-2 border-gray-300 dark:border-gray-600 text-gray-400 hover:border-emerald-400 hover:text-emerald-500'
                        }`}
                      >
                        {isDone && <Check className="w-4 h-4" strokeWidth={3} />}
                      </button>
                    )}

                    {/* Reset button for multi-rep */}
                    {athkar.repetitions > 1 && count > 0 && (
                      <button
                        onClick={() => resetCounter(athkar.id)}
                        className="text-[10px] text-gray-400 hover:text-red-400 transition"
                      >
                        Reset
                      </button>
                    )}

                    {/* Audio button */}
                    <button
                      onClick={() => handleAudio(athkar)}
                      className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
                        isThisPlaying
                          ? 'bg-indigo-500 text-white'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 hover:text-indigo-500'
                      }`}
                      aria-label="Play audio"
                    >
                      {ttsLoading && isThisPlaying ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Volume2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  {/* Right: reference + memorised toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                      {athkar.reference}
                    </span>

                    {!memLoading && (
                      <button
                        onClick={() => toggleMemorised(athkar.id)}
                        className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition ${
                          isMemorisedItem
                            ? 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20'
                        }`}
                      >
                        {isMemorisedItem ? 'Memorised' : 'Learning'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Reward text */}
                {athkar.reward && isExpanded && (
                  <div className="px-5 pb-4 -mt-1">
                    <p className="text-xs text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/20 rounded-lg px-3 py-2">
                      <span className="font-medium">Reward:</span> {athkar.reward}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Completion celebration */}
        {completedCount === athkarList.length && athkarList.length > 0 && (
          <div className="mt-6 text-center bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-xl p-6 border border-emerald-200 dark:border-emerald-800">
            <p className="text-lg font-semibold text-emerald-800 dark:text-emerald-200 mb-1">
              May Allah accept your remembrance
            </p>
            <p className="text-sm text-emerald-600 dark:text-emerald-400 italic">
              "Verily, in the remembrance of Allah do hearts find rest." — Qur'an 13:28
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
