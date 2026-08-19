import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Volume2, Star, Link2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabaseClient';
import { useSelfLearner } from '../../hooks/useSelfLearner';
import DashboardHeader from '../../components/DashboardHeader';
import { ALPHABET_LETTERS, TOTAL_LETTERS, AlphabetLetter, HARAKAT_MARKS, letterWithHarakat, harakatTranslit } from '../../lib/alphabetData';

function shuffleArray<T>(items: T[]): T[] {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

interface QuizState {
  targetId: number;
  options: number[];
}

export default function ArabicAlphabetPage() {
  const navigate = useNavigate();
  const { learnerId, loading: learnerLoading } = useSelfLearner();

  const [learned, setLearned] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [section, setSection] = useState<'letters' | 'tashkeel'>('letters');
  const [tashkeelLetterId, setTashkeelLetterId] = useState<number>(1); // default to Bā', a clean connecting letter

  const [quiz, setQuiz] = useState<QuizState | null>(null);
  const [quizAnswer, setQuizAnswer] = useState<number | null>(null);
  const [quizScore, setQuizScore] = useState({ correct: 0, total: 0 });

  useEffect(() => {
    if (learnerLoading || !learnerId) return;
    (async () => {
      const { data } = await supabase
        .from('learner_alphabet_progress')
        .select('letter_id, status')
        .eq('learner_id', learnerId)
        .eq('status', 'learned');
      setLearned(new Set((data || []).map(r => r.letter_id)));
      setLoading(false);
    })();
  }, [learnerId, learnerLoading]);

  async function toggleLearned(letterId: number) {
    if (!learnerId || saving) return;
    setSaving(true);
    const willBeLearned = !learned.has(letterId);
    const next = new Set(learned);
    if (willBeLearned) next.add(letterId); else next.delete(letterId);
    setLearned(next);

    const { error } = await supabase
      .from('learner_alphabet_progress')
      .upsert(
        { learner_id: learnerId, letter_id: letterId, status: willBeLearned ? 'learned' : 'learning' },
        { onConflict: 'learner_id,letter_id' }
      );

    if (error) {
      // revert on failure
      const reverted = new Set(learned);
      setLearned(reverted);
      toast.error('Could not save progress. Please try again.');
    }
    setSaving(false);
  }

  function playAudio(letter: AlphabetLetter) {
    toast(`Audio for ${letter.name} is coming soon`, {
      description: 'Real pronunciation recordings are being prepared - text and forms are ready to use now.',
    });
  }

  function nextQuizQuestion(pool: number[]) {
    const target = pool[Math.floor(Math.random() * pool.length)];
    let distractPool = pool.filter(id => id !== target);
    if (distractPool.length < 3) {
      const rest = ALPHABET_LETTERS.map(l => l.id).filter(id => id !== target && !distractPool.includes(id));
      distractPool = distractPool.concat(rest);
    }
    const distractors = shuffleArray(distractPool).slice(0, 3);
    const options = shuffleArray([target, ...distractors]);
    setQuiz({ targetId: target, options });
    setQuizAnswer(null);
  }

  function answerQuiz(optionId: number) {
    if (!quiz || quizAnswer !== null) return;
    setQuizAnswer(optionId);
    setQuizScore(prev => ({
      correct: prev.correct + (optionId === quiz.targetId ? 1 : 0),
      total: prev.total + 1,
    }));
    setTimeout(() => {
      nextQuizQuestion(Array.from(learned));
    }, 900);
  }

  useEffect(() => {
    if (learned.size >= 4 && !quiz) {
      nextQuizQuestion(Array.from(learned));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learned.size]);

  if (learnerLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <DashboardHeader />
        <div className="max-w-4xl mx-auto px-4 py-12 flex items-center justify-center">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  const active = activeId !== null ? ALPHABET_LETTERS[activeId] : null;
  const progressPct = Math.round((learned.size / TOTAL_LETTERS) * 100);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header banner */}
        <div className="bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-600 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-3xl">🔤</span>
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold text-white">Huruf Hijaiyyah</h1>
              <p className="text-white/80 text-sm">Learn the Arabic alphabet from scratch - 28 letters, real words, at your pace</p>
            </div>
          </div>
        </div>

        {/* Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex-1 h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-300 whitespace-nowrap">
              {learned.size} of {TOTAL_LETTERS} learned
            </span>
          </div>
        </div>

        {/* Section switcher */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setSection('letters')}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              section === 'letters'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-400'
            }`}
          >
            1. The 28 Letters
          </button>
          <button
            onClick={() => setSection('tashkeel')}
            className={`flex-1 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
              section === 'tashkeel'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-400'
            }`}
          >
            2. Letters with Tashkeel
          </button>
        </div>

        {section === 'letters' && (
        <>
        {/* Letter grid + detail */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">The 28 letters</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Tap any letter to see its forms, sound, and an example word</p>
          </div>

          <div className="p-6">
            <div className="grid grid-cols-5 sm:grid-cols-7 gap-2" dir="rtl">
              {ALPHABET_LETTERS.map(L => (
                <button
                  key={L.id}
                  onClick={() => setActiveId(L.id)}
                  className={`relative aspect-square rounded-xl border-2 flex flex-col items-center justify-center gap-0.5 transition-all ${
                    activeId === L.id
                      ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30'
                      : 'border-gray-200 dark:border-gray-700 hover:border-emerald-400'
                  }`}
                >
                  {learned.has(L.id) && (
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500 absolute top-1 right-1.5" />
                  )}
                  <span className="font-arabic text-2xl text-gray-900 dark:text-white leading-none">{L.glyph}</span>
                  <span className="text-[9px] font-semibold text-gray-400">{L.translit}</span>
                </button>
              ))}
            </div>

            {active && (
              <div className="mt-6 pt-6 border-t border-dashed border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap items-center gap-4 mb-5">
                  <div className="w-24 h-24 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                    <span className="font-arabic text-6xl text-gray-900 dark:text-white">{active.glyph}</span>
                  </div>
                  <div>
                    <div className="text-xl font-bold text-gray-900 dark:text-white">{active.name}</div>
                    <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">{active.translit}</div>
                  </div>
                  <div className="ml-auto flex gap-2 flex-wrap">
                    <button
                      onClick={() => playAudio(active)}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:bg-emerald-50 dark:hover:bg-gray-700"
                    >
                      <Volume2 className="w-4 h-4" /> Hear it
                    </button>
                    <button
                      onClick={() => toggleLearned(active.id)}
                      disabled={saving}
                      className={`px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50 ${
                        learned.has(active.id)
                          ? 'bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400'
                          : 'bg-emerald-600 text-white hover:bg-emerald-700'
                      }`}
                    >
                      {learned.has(active.id) ? '★ Learned' : 'Mark as learned'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-2 mb-3">
                  {(['isolated', 'initial', 'medial', 'final'] as const).map(pos => (
                    <div key={pos} className="bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-center">
                      <div className="font-arabic text-3xl text-gray-900 dark:text-white">{active.forms[pos]}</div>
                      <div className="text-[10px] uppercase tracking-wide text-gray-400 mt-1">
                        {pos === 'isolated' ? 'Isolated' : pos === 'initial' ? 'Begins' : pos === 'medial' ? 'Middle' : 'Ends'}
                      </div>
                    </div>
                  ))}
                </div>
                {!active.connects && (
                  <p className="flex items-center gap-1.5 text-xs text-gray-400 mb-4">
                    <Link2 className="w-3.5 h-3.5" />
                    This letter never joins to the one after it - so its "begins" and "middle" shapes look the same as "isolated" and "ends".
                  </p>
                )}

                <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5 mb-4">
                  <span className="font-semibold text-gray-900 dark:text-white">How it sounds:</span> {active.sound}
                </div>

                <div className="flex items-center gap-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-4">
                  <div className="font-arabic text-3xl text-gray-900 dark:text-white">{active.exampleArabic}</div>
                  <div className="text-sm text-gray-600 dark:text-gray-300">
                    <div>{active.exampleTranslit}</div>
                    <div className="font-semibold text-gray-900 dark:text-white capitalize">{active.exampleEnglish}</div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quiz */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
            <h2 className="text-base font-semibold text-gray-900 dark:text-white">Quick recognition quiz</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pulls only from letters you've marked as learned</p>
          </div>
          <div className="p-6">
            {learned.size < 4 || !quiz ? (
              <p className="text-center text-sm text-gray-400 py-6">
                Mark at least 4 letters as learned above to unlock a quiz round. ({learned.size}/4)
              </p>
            ) : (
              <div>
                <div className="text-center bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl py-7 px-5 mb-5">
                  <p className="text-[11px] uppercase tracking-wide text-gray-400 mb-2">What is this letter called?</p>
                  <p className="font-arabic text-5xl text-gray-900 dark:text-white">{ALPHABET_LETTERS[quiz.targetId].glyph}</p>
                </div>
                <div className="grid gap-2.5">
                  {quiz.options.map((id, i) => {
                    const isCorrectOption = id === quiz.targetId;
                    const isSelected = id === quizAnswer;
                    let cls = 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-emerald-400';
                    if (quizAnswer !== null) {
                      if (isCorrectOption) cls = 'border-emerald-400 bg-emerald-50 dark:bg-emerald-900/30';
                      else if (isSelected) cls = 'border-red-400 bg-red-50 dark:bg-red-900/20';
                      else cls = 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 opacity-50';
                    }
                    return (
                      <button
                        key={id}
                        onClick={() => answerQuiz(id)}
                        disabled={quizAnswer !== null}
                        className={`flex items-center gap-3 text-left px-4 py-3 rounded-xl border-2 transition-all text-sm font-medium text-gray-900 dark:text-white ${cls}`}
                      >
                        <span className="w-5 h-5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                          {String.fromCharCode(65 + i)}
                        </span>
                        {ALPHABET_LETTERS[id].name}
                      </button>
                    );
                  })}
                </div>
                <p className="text-center text-xs text-gray-400 mt-4">{quizScore.correct} / {quizScore.total} correct this round</p>
              </div>
            )}
          </div>
        </div>
        </>
        )}

        {section === 'tashkeel' && (
          <div className="space-y-6">
            {/* Intro to the 8 marks */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">What is tashkeel?</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Small marks placed above or below a letter that tell you exactly how to pronounce it. The same mark
                  always makes the same sound change, no matter which letter it sits on.
                </p>
              </div>
              <div className="p-6 grid sm:grid-cols-2 gap-3">
                {HARAKAT_MARKS.map(h => (
                  <div
                    key={h.id}
                    className="flex items-start gap-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-700 rounded-xl p-3.5"
                  >
                    <div className="w-14 h-14 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                      <span className="font-arabic text-3xl text-gray-900 dark:text-white">{'ا' + h.mark}</span>
                    </div>
                    <div>
                      <div className="text-sm font-bold text-gray-900 dark:text-white">{h.name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{h.description}</div>
                      <div className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">{h.sound}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pick a letter, see it with every mark */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-700">
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Try it on a letter</h2>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Pick a letter below to see how each mark changes the way it sounds</p>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-7 sm:grid-cols-9 gap-2 mb-6" dir="rtl">
                  {ALPHABET_LETTERS.map(L => (
                    <button
                      key={L.id}
                      onClick={() => setTashkeelLetterId(L.id)}
                      className={`aspect-square rounded-lg border-2 flex items-center justify-center font-arabic text-lg transition-all ${
                        tashkeelLetterId === L.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-900/30 text-gray-900 dark:text-white'
                          : 'border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-400'
                      }`}
                    >
                      {L.glyph}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {HARAKAT_MARKS.map(h => {
                    const letter = ALPHABET_LETTERS[tashkeelLetterId];
                    return (
                      <div
                        key={h.id}
                        className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-900 rounded-xl p-4 text-center"
                      >
                        <div className="font-arabic text-4xl text-gray-900 dark:text-white mb-1">
                          {letterWithHarakat(letter, h)}
                        </div>
                        <div className="text-xs font-semibold text-gray-500 dark:text-gray-400">{h.name}</div>
                        <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                          {harakatTranslit(letter, h)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
