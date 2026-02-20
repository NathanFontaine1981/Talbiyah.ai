import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Moon,
  Heart,
  Target,
  CheckCircle,
  Calendar,
  Edit3,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Star,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import DashboardHeader from '../../components/DashboardHeader';
import {
  getRamadanYear,
  getRamadanDates,
  getRamadanDay,
  getDaysUntilRamadan,
  isRamadan,
  getRamadanDateForDay,
  TOTAL_QURAN_PAGES,
  RAMADAN_DAYS,
  MASJID_PRAYER_MULTIPLIER,
  DEFAULT_HABITS,
  PRAYER_NAMES,
} from '../../data/ramadanData';

interface RamadanPlan {
  id: string;
  quran_goal_pages_per_day: number;
  quran_reading_time: string;
  sadaqah_daily_amount: number;
  sadaqah_currency: string;
  taraweeh_target_nights: number;
  habits_to_cut: string[];
  masjid_prayer_daily_target: number;
  notes: string;
}

interface DailyLog {
  id: string;
  log_date: string;
  quran_pages_read: number;
  sadaqah_given: number;
  taraweeh_attended: boolean;
  masjid_prayers: number;
  habits_maintained: string[];
  fasted: boolean;
}

type View = 'loading' | 'setup' | 'dashboard';

export default function RamadanPlannerPage() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [view, setView] = useState<View>('loading');
  const [plan, setPlan] = useState<RamadanPlan | null>(null);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [editingPlan, setEditingPlan] = useState(false);
  const [saving, setSaving] = useState(false);

  // Plan form state
  const [pagesPerSalah, setPagesPerSalah] = useState(2);
  const [sadaqahAmount, setSadaqahAmount] = useState(1);
  const [sadaqahCurrency, setSadaqahCurrency] = useState('GBP');
  const [taraweehTarget, setTaraweehTarget] = useState(30);
  const [habitsToCut, setHabitsToCut] = useState<string[]>([]);
  const [customHabit, setCustomHabit] = useState('');
  const [masjidTarget, setMasjidTarget] = useState(1);
  const [planNotes, setPlanNotes] = useState('');

  // Daily log form state
  const [logQuranPages, setLogQuranPages] = useState(0);
  const [logSadaqah, setLogSadaqah] = useState(0);
  const [logTaraweeh, setLogTaraweeh] = useState(false);
  const [logMasjidPrayers, setLogMasjidPrayers] = useState(0);
  const [logHabitsMaintained, setLogHabitsMaintained] = useState<string[]>([]);
  const [logFasted, setLogFasted] = useState(true);

  const ramadanYear = getRamadanYear();
  const currentDay = getRamadanDay(ramadanYear);
  const daysUntil = getDaysUntilRamadan(ramadanYear);
  const isCurrentlyRamadan = isRamadan(ramadanYear);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setView('setup'); return; }
    setUserId(user.id);

    const { data: existingPlan } = await supabase
      .from('ramadan_plans')
      .select('*')
      .eq('user_id', user.id)
      .eq('year', ramadanYear)
      .maybeSingle();

    if (existingPlan) {
      setPlan(existingPlan);
      populateFormFromPlan(existingPlan);

      // Load logs
      const { data: logData } = await supabase
        .from('ramadan_daily_log')
        .select('*')
        .eq('user_id', user.id)
        .eq('year', ramadanYear)
        .order('log_date', { ascending: true });

      setLogs(logData || []);
      setView('dashboard');

      // Auto-select today if in Ramadan
      if (currentDay) setSelectedDay(currentDay);
    } else {
      setView('setup');
    }
  }

  function populateFormFromPlan(p: RamadanPlan) {
    // quran_reading_time stores pages-per-salah; fall back to deriving from daily total
    const storedPps = parseInt(p.quran_reading_time) || 0;
    setPagesPerSalah(storedPps > 0 ? storedPps : Math.round(p.quran_goal_pages_per_day / 10) || 2);
    setSadaqahAmount(p.sadaqah_daily_amount);
    setSadaqahCurrency(p.sadaqah_currency);
    setTaraweehTarget(p.taraweeh_target_nights);
    setHabitsToCut(p.habits_to_cut || []);
    setMasjidTarget(p.masjid_prayer_daily_target);
    setPlanNotes(p.notes || '');
  }

  async function savePlan() {
    if (!userId) return;
    setSaving(true);
    const planData = {
      user_id: userId,
      year: ramadanYear,
      quran_goal_pages_per_day: pagesPerSalah * 10,
      quran_reading_time: String(pagesPerSalah),
      sadaqah_daily_amount: sadaqahAmount,
      sadaqah_currency: sadaqahCurrency,
      taraweeh_target_nights: taraweehTarget,
      habits_to_cut: habitsToCut,
      masjid_prayer_daily_target: masjidTarget,
      notes: planNotes,
      updated_at: new Date().toISOString(),
    };

    if (plan) {
      const { data } = await supabase
        .from('ramadan_plans')
        .update(planData)
        .eq('id', plan.id)
        .select()
        .single();
      if (data) setPlan(data);
    } else {
      const { data } = await supabase
        .from('ramadan_plans')
        .insert(planData)
        .select()
        .single();
      if (data) setPlan(data);
    }
    setSaving(false);
    setEditingPlan(false);
    setView('dashboard');
  }

  async function saveDailyLog() {
    if (!userId || !selectedDay) return;
    setSaving(true);
    const logDate = getRamadanDateForDay(ramadanYear, selectedDay);
    if (!logDate) { setSaving(false); return; }

    const logData = {
      user_id: userId,
      log_date: logDate,
      year: ramadanYear,
      quran_pages_read: logQuranPages,
      sadaqah_given: logSadaqah,
      taraweeh_attended: logTaraweeh,
      masjid_prayers: logMasjidPrayers,
      habits_maintained: logHabitsMaintained,
      fasted: logFasted,
      updated_at: new Date().toISOString(),
    };

    const existingLog = logs.find(l => l.log_date === logDate);
    if (existingLog) {
      const { data } = await supabase
        .from('ramadan_daily_log')
        .update(logData)
        .eq('id', existingLog.id)
        .select()
        .single();
      if (data) setLogs(prev => prev.map(l => l.id === existingLog.id ? data : l));
    } else {
      const { data } = await supabase
        .from('ramadan_daily_log')
        .insert(logData)
        .select()
        .single();
      if (data) setLogs(prev => [...prev, data]);
    }
    setSaving(false);
  }

  function selectDay(day: number) {
    setSelectedDay(day);
    const logDate = getRamadanDateForDay(ramadanYear, day);
    const existingLog = logs.find(l => l.log_date === logDate);
    if (existingLog) {
      setLogQuranPages(existingLog.quran_pages_read);
      setLogSadaqah(existingLog.sadaqah_given);
      setLogTaraweeh(existingLog.taraweeh_attended);
      setLogMasjidPrayers(existingLog.masjid_prayers);
      setLogHabitsMaintained(existingLog.habits_maintained || []);
      setLogFasted(existingLog.fasted);
    } else {
      setLogQuranPages(0);
      setLogSadaqah(0);
      setLogTaraweeh(false);
      setLogMasjidPrayers(0);
      setLogHabitsMaintained([]);
      setLogFasted(true);
    }
  }

  // Progress calculations
  const totalQuranPages = logs.reduce((sum, l) => sum + l.quran_pages_read, 0);
  const totalSadaqah = logs.reduce((sum, l) => sum + Number(l.sadaqah_given), 0);
  const taraweehNights = logs.filter(l => l.taraweeh_attended).length;
  const totalMasjidPrayers = logs.reduce((sum, l) => sum + l.masjid_prayers, 0);
  const fastDays = logs.filter(l => l.fasted).length;

  function getDayStatus(day: number): 'logged' | 'partial' | 'future' | 'missed' {
    const logDate = getRamadanDateForDay(ramadanYear, day);
    const log = logs.find(l => l.log_date === logDate);
    if (!log) {
      if (currentDay && day < currentDay) return 'missed';
      return 'future';
    }
    if (!plan) return 'logged';
    const goalsMetCount = [
      log.quran_pages_read >= (plan.quran_goal_pages_per_day || 0),
      log.fasted,
      !plan.taraweeh_target_nights || log.taraweeh_attended,
    ].filter(Boolean).length;
    return goalsMetCount >= 2 ? 'logged' : 'partial';
  }

  function toggleHabit(habit: string) {
    setHabitsToCut(prev =>
      prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit]
    );
  }

  function addCustomHabit() {
    if (customHabit.trim() && !habitsToCut.includes(customHabit.trim())) {
      setHabitsToCut(prev => [...prev, customHabit.trim()]);
      setCustomHabit('');
    }
  }

  function toggleLogHabit(habit: string) {
    setLogHabitsMaintained(prev =>
      prev.includes(habit) ? prev.filter(h => h !== habit) : [...prev, habit]
    );
  }

  const quranCompletionPercent = Math.round((totalQuranPages / TOTAL_QURAN_PAGES) * 100);
  const quranGoal = pagesPerSalah * 10; // 2 pages × (before + after) × 5 prayers
  const projectedPages = quranGoal * RAMADAN_DAYS;

  if (view === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  // Setup / Edit Plan View
  if (view === 'setup' || editingPlan) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <DashboardHeader />
        <main className="max-w-2xl mx-auto px-4 py-8">
          <button
            onClick={() => {
              if (editingPlan && plan) { setEditingPlan(false); }
              else { navigate(-1); }
            }}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
          >
            <ArrowLeft className="w-5 h-5" />
            {editingPlan ? 'Back to Planner' : 'Back'}
          </button>

          <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-2xl p-6 mb-6 shadow-lg">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Moon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Ramadan {ramadanYear} Plan</h1>
                <p className="text-white/80 text-sm">
                  {editingPlan ? 'Edit your goals' : 'Set your goals for the blessed month'}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <p className="text-sm text-amber-800 dark:text-amber-200 italic">
              "Only commit to what you know you can maintain this year. Small consistent deeds are more beloved to Allah than large inconsistent ones."
            </p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 font-medium">— Based on Sahih al-Bukhari 6464</p>
          </div>

          <div className="space-y-6">
            {/* Quran Goal */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <BookOpen className="w-5 h-5 text-emerald-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Quran Reading</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Read a set number of pages before and after each of the 5 daily prayers.
              </p>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Pages before & after each salah: <span className="font-bold text-gray-900 dark:text-white">{pagesPerSalah}</span>
              </label>
              <div className="flex items-center gap-3 mb-3">
                <button
                  onClick={() => setPagesPerSalah(Math.max(0, pagesPerSalah - 1))}
                  className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-lg"
                >
                  -
                </button>
                <input
                  type="range"
                  min={0}
                  max={6}
                  value={pagesPerSalah}
                  onChange={e => setPagesPerSalah(Number(e.target.value))}
                  className="flex-1 accent-emerald-600"
                />
                <button
                  onClick={() => setPagesPerSalah(Math.min(6, pagesPerSalah + 1))}
                  className="w-9 h-9 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition text-lg"
                >
                  +
                </button>
              </div>
              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 text-sm text-emerald-800 dark:text-emerald-200">
                <p>
                  {pagesPerSalah} page{pagesPerSalah !== 1 ? 's' : ''} before + {pagesPerSalah} after = <span className="font-bold">{pagesPerSalah * 2} pages/salah</span>
                </p>
                <p>
                  {pagesPerSalah * 2} pages x 5 prayers = <span className="font-bold">{quranGoal} pages/day</span>
                </p>
                <p className="mt-1 font-medium">
                  {projectedPages >= TOTAL_QURAN_PAGES
                    ? `You'll complete the Quran ${Math.floor(projectedPages / TOTAL_QURAN_PAGES)} time(s) in Ramadan!`
                    : `That's ${projectedPages} pages over 30 days — ${Math.round((projectedPages / TOTAL_QURAN_PAGES) * 100)}% of the Quran.`
                  }
                </p>
              </div>
            </div>

            {/* Habits to Cut */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Target className="w-5 h-5 text-red-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Habits to Cut</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Select habits you want to reduce or eliminate during Ramadan.</p>
              <div className="flex flex-wrap gap-2 mb-3">
                {DEFAULT_HABITS.map(habit => (
                  <button
                    key={habit}
                    onClick={() => toggleHabit(habit)}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                      habitsToCut.includes(habit)
                        ? 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {habitsToCut.includes(habit) && <CheckCircle className="w-3.5 h-3.5 inline mr-1" />}
                    {habit}
                  </button>
                ))}
                {habitsToCut.filter(h => !DEFAULT_HABITS.includes(h)).map(habit => (
                  <button
                    key={habit}
                    onClick={() => toggleHabit(habit)}
                    className="px-3 py-1.5 rounded-full text-sm font-medium bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700 transition"
                  >
                    <CheckCircle className="w-3.5 h-3.5 inline mr-1" />{habit}
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={customHabit}
                  onChange={e => setCustomHabit(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomHabit()}
                  placeholder="Add custom habit..."
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                />
                <button
                  onClick={addCustomHabit}
                  className="px-3 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200 rounded-lg text-sm hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                >
                  Add
                </button>
              </div>
            </div>

            {/* Sadaqah */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Heart className="w-5 h-5 text-pink-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Daily Sadaqah</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Even a small daily amount is beloved to Allah. Consistency is key.</p>
              <div className="flex gap-2">
                <select
                  value={sadaqahCurrency}
                  onChange={e => setSadaqahCurrency(e.target.value)}
                  className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                >
                  <option value="GBP">GBP</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="SAR">SAR</option>
                  <option value="AED">AED</option>
                </select>
                <input
                  type="number"
                  min={0}
                  step={0.5}
                  value={sadaqahAmount}
                  onChange={e => setSadaqahAmount(Number(e.target.value))}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
                />
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                That's {sadaqahCurrency} {(sadaqahAmount * RAMADAN_DAYS).toFixed(2)} over 30 days.
              </p>
            </div>

            {/* Taraweeh */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Moon className="w-5 h-5 text-indigo-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Taraweeh Target</h3>
              </div>
              <label className="block text-sm text-gray-600 dark:text-gray-400 mb-2">
                Nights: <span className="font-bold text-gray-900 dark:text-white">{taraweehTarget}</span> / 30
              </label>
              <input
                type="range"
                min={0}
                max={30}
                value={taraweehTarget}
                onChange={e => setTaraweehTarget(Number(e.target.value))}
                className="w-full accent-indigo-600"
              />
            </div>

            {/* Masjid Prayers */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center gap-3 mb-3">
                <Star className="w-5 h-5 text-amber-500" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Daily Masjid Prayers</h3>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">Target daily prayers in the masjid (0-5).</p>
              <div className="flex gap-2">
                {[0, 1, 2, 3, 4, 5].map(n => (
                  <button
                    key={n}
                    onClick={() => setMasjidTarget(n)}
                    className={`w-10 h-10 rounded-lg border-2 text-sm font-bold transition ${
                      masjidTarget === n
                        ? 'bg-amber-100 dark:bg-amber-900/40 border-amber-500 text-amber-700 dark:text-amber-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 hover:border-amber-300'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            {/* Notes */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Personal Notes</h3>
              <textarea
                value={planNotes}
                onChange={e => setPlanNotes(e.target.value)}
                placeholder="Any personal du'as, goals, or reminders..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white resize-none"
              />
            </div>

            <button
              onClick={savePlan}
              disabled={saving}
              className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:from-indigo-700 hover:to-purple-700 transition shadow-lg disabled:opacity-60"
            >
              {saving ? 'Saving...' : (plan ? 'Update Plan' : 'Save My Ramadan Plan')}
            </button>
          </div>
        </main>
      </div>
    );
  }

  // Dashboard View
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader />
      <main className="max-w-4xl mx-auto px-4 py-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header Banner */}
        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-fuchsia-600 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
                <Moon className="w-7 h-7 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Ramadan {ramadanYear}</h1>
                <p className="text-white/80 text-sm">
                  {isCurrentlyRamadan && currentDay
                    ? `Day ${currentDay} of 30`
                    : daysUntil
                    ? `${daysUntil} day${daysUntil === 1 ? '' : 's'} until Ramadan`
                    : 'Track your blessed month'
                  }
                </p>
              </div>
            </div>
            <button
              onClick={() => setEditingPlan(true)}
              className="px-3 py-2 bg-white/20 backdrop-blur text-white rounded-lg text-sm hover:bg-white/30 transition flex items-center gap-1.5"
            >
              <Edit3 className="w-4 h-4" /> Edit Plan
            </button>
          </div>
          {isCurrentlyRamadan && currentDay && (
            <div className="mt-4">
              <div className="w-full bg-white/20 rounded-full h-2.5">
                <div
                  className="bg-white rounded-full h-2.5 transition-all"
                  style={{ width: `${Math.round((currentDay / RAMADAN_DAYS) * 100)}%` }}
                />
              </div>
              <p className="text-white/70 text-xs mt-1">{Math.round((currentDay / RAMADAN_DAYS) * 100)}% complete</p>
            </div>
          )}
        </div>

        {/* Progress Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <BookOpen className="w-5 h-5 text-emerald-600 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalQuranPages}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">/ {TOTAL_QURAN_PAGES} pages ({quranCompletionPercent}%)</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <Heart className="w-5 h-5 text-pink-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{plan?.sadaqah_currency || 'GBP'} {totalSadaqah.toFixed(0)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Sadaqah given</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <Moon className="w-5 h-5 text-indigo-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{taraweehNights}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">/ {plan?.taraweeh_target_nights || 30} Taraweeh nights</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <Star className="w-5 h-5 text-amber-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{totalMasjidPrayers}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Masjid prayers</p>
          </div>
        </div>

        {/* Masjid Prayer Reward Card */}
        {totalMasjidPrayers > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-amber-100 dark:bg-amber-800 rounded-lg flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <h3 className="font-semibold text-amber-900 dark:text-amber-100">Masjid Prayer Reward</h3>
                <p className="text-sm text-amber-800 dark:text-amber-200 mt-1">
                  You prayed <span className="font-bold">{totalMasjidPrayers}</span> time{totalMasjidPrayers !== 1 ? 's' : ''} in the masjid this Ramadan.
                  That's {totalMasjidPrayers} x {MASJID_PRAYER_MULTIPLIER} = <span className="font-bold">{totalMasjidPrayers * MASJID_PRAYER_MULTIPLIER}</span> reward units.
                  To equal this praying at home, you'd need {totalMasjidPrayers * MASJID_PRAYER_MULTIPLIER} prayers.
                </p>
                <p className="text-xs text-amber-600 dark:text-amber-400 mt-1 italic">
                  "Prayer in congregation is twenty-seven times better than prayer offered alone." — Sahih al-Bukhari 619
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            30-Day Calendar
          </h3>
          <div className="grid grid-cols-6 sm:grid-cols-10 gap-2">
            {Array.from({ length: RAMADAN_DAYS }, (_, i) => i + 1).map(day => {
              const status = getDayStatus(day);
              const isSelected = selectedDay === day;
              const isToday = currentDay === day;
              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={`relative aspect-square rounded-lg border-2 flex flex-col items-center justify-center text-xs font-bold transition ${
                    isSelected
                      ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 ring-2 ring-indigo-300'
                      : status === 'logged'
                      ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300'
                      : status === 'partial'
                      ? 'border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                      : status === 'missed'
                      ? 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 text-gray-400 dark:text-gray-500'
                      : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-gray-500 dark:text-gray-400'
                  }`}
                >
                  {day}
                  {isToday && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                  )}
                  {status === 'logged' && <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Daily Check-In */}
        {selectedDay && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-gray-900 dark:text-white">
                Day {selectedDay} Check-In
              </h3>
              <div className="flex gap-1">
                <button
                  onClick={() => selectedDay > 1 && selectDay(selectedDay - 1)}
                  disabled={selectedDay <= 1}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => selectedDay < RAMADAN_DAYS && selectDay(selectedDay + 1)}
                  disabled={selectedDay >= RAMADAN_DAYS}
                  className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-30 transition"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {/* Fasted */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Fasted today?</span>
                <button
                  onClick={() => setLogFasted(!logFasted)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    logFasted
                      ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {logFasted ? 'Yes' : 'No'}
                </button>
              </div>

              {/* Quran pages */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">Quran pages read</label>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setLogQuranPages(Math.max(0, logQuranPages - 1))}
                    className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={0}
                    value={logQuranPages}
                    onChange={e => setLogQuranPages(Math.max(0, Number(e.target.value)))}
                    className="w-20 text-center px-2 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                  <button
                    onClick={() => setLogQuranPages(logQuranPages + 1)}
                    className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  >
                    +
                  </button>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    / {plan?.quran_goal_pages_per_day || 0} goal
                  </span>
                </div>
              </div>

              {/* Sadaqah */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-1">Sadaqah given</label>
                <div className="flex gap-2">
                  <span className="px-2 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-lg text-sm text-gray-600 dark:text-gray-300">
                    {plan?.sadaqah_currency || 'GBP'}
                  </span>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    value={logSadaqah}
                    onChange={e => setLogSadaqah(Math.max(0, Number(e.target.value)))}
                    className="flex-1 px-3 py-1.5 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
              </div>

              {/* Taraweeh */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Taraweeh attended?</span>
                <button
                  onClick={() => setLogTaraweeh(!logTaraweeh)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    logTaraweeh
                      ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {logTaraweeh ? 'Yes' : 'No'}
                </button>
              </div>

              {/* Masjid Prayers */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">Masjid prayers today</label>
                <div className="flex flex-wrap gap-2">
                  {PRAYER_NAMES.map((name, i) => (
                    <button
                      key={name}
                      onClick={() => {
                        if (logMasjidPrayers > i) {
                          setLogMasjidPrayers(i);
                        } else {
                          setLogMasjidPrayers(i + 1);
                        }
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                        logMasjidPrayers > i
                          ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                          : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                      }`}
                    >
                      {logMasjidPrayers > i && <CheckCircle className="w-3 h-3 inline mr-1" />}
                      {name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Habits maintained */}
              {plan && plan.habits_to_cut.length > 0 && (
                <div>
                  <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">Habits maintained (avoided today)</label>
                  <div className="flex flex-wrap gap-2">
                    {plan.habits_to_cut.map(habit => (
                      <button
                        key={habit}
                        onClick={() => toggleLogHabit(habit)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium transition ${
                          logHabitsMaintained.includes(habit)
                            ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {logHabitsMaintained.includes(habit) && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {habit}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={saveDailyLog}
                disabled={saving}
                className="w-full py-2.5 bg-indigo-600 text-white rounded-lg font-medium text-sm hover:bg-indigo-700 transition disabled:opacity-60"
              >
                {saving ? 'Saving...' : 'Save Day ' + selectedDay}
              </button>
            </div>
          </div>
        )}

        {/* Year-over-Year comparison placeholder */}
        {/* This would show if previous year data exists */}
      </main>
    </div>
  );
}
