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
  List,
  X,
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
  qiyam_attended: boolean;
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
  const [showHistory, setShowHistory] = useState(false);

  // Plan form state — per-prayer Quran pages (before + after each salah)
  const [salahPages, setSalahPages] = useState<Record<string, number>>({
    fajr: 2, dhuhr: 2, asr: 2, maghrib: 2, isha: 2,
  });
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
  const [logQiyam, setLogQiyam] = useState(false);
  const [logMasjidPrayers, setLogMasjidPrayers] = useState<string[]>([]);
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
    // quran_reading_time stores JSON of per-prayer pages; fall back to even split
    try {
      const parsed = JSON.parse(p.quran_reading_time);
      if (parsed && typeof parsed === 'object' && 'fajr' in parsed) {
        setSalahPages(parsed);
      } else {
        throw new Error('legacy format');
      }
    } catch {
      const perPrayer = Math.round(p.quran_goal_pages_per_day / 10) || 2;
      setSalahPages({ fajr: perPrayer, dhuhr: perPrayer, asr: perPrayer, maghrib: perPrayer, isha: perPrayer });
    }
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
      quran_goal_pages_per_day: Object.values(salahPages).reduce((sum, v) => sum + v * 2, 0),
      quran_reading_time: JSON.stringify(salahPages),
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
      qiyam_attended: logQiyam,
      masjid_prayers: logMasjidPrayers.length,
      masjid_prayers_list: logMasjidPrayers,
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
      setLogQiyam(existingLog.qiyam_attended || false);
      setLogMasjidPrayers((existingLog as any).masjid_prayers_list?.length ? (existingLog as any).masjid_prayers_list : []);
      setLogHabitsMaintained(existingLog.habits_maintained || []);
      setLogFasted(existingLog.fasted);
    } else {
      setLogQuranPages(0);
      setLogSadaqah(0);
      setLogTaraweeh(false);
      setLogQiyam(false);
      setLogMasjidPrayers([]);
      setLogHabitsMaintained([]);
      setLogFasted(true);
    }
  }

  // Progress calculations
  const totalQuranPages = logs.reduce((sum, l) => sum + l.quran_pages_read, 0);
  const totalSadaqah = logs.reduce((sum, l) => sum + Number(l.sadaqah_given), 0);
  const taraweehNights = logs.filter(l => l.taraweeh_attended).length;
  const qiyamNights = logs.filter(l => l.qiyam_attended).length;
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
  const quranGoal = Object.values(salahPages).reduce((sum, v) => sum + v * 2, 0); // pages before + after per prayer
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
                Set how many pages to read before & after each salah. Adjust per prayer — set 0 for prayers when you're busy (e.g. at work).
              </p>

              <div className="space-y-2 mb-4">
                {PRAYER_NAMES.map(name => {
                  const key = name.toLowerCase();
                  const val = salahPages[key] || 0;
                  return (
                    <div key={key} className="flex items-center gap-3">
                      <span className="w-20 text-sm font-medium text-gray-700 dark:text-gray-300">{name}</span>
                      <button
                        onClick={() => setSalahPages(prev => ({ ...prev, [key]: Math.max(0, val - 1) }))}
                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        -
                      </button>
                      <span className="w-6 text-center text-sm font-bold text-gray-900 dark:text-white">{val}</span>
                      <button
                        onClick={() => setSalahPages(prev => ({ ...prev, [key]: Math.min(6, val + 1) }))}
                        className="w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                      >
                        +
                      </button>
                      <span className="text-xs text-gray-400 dark:text-gray-500">
                        = {val * 2} pages
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 text-sm text-emerald-800 dark:text-emerald-200">
                <p>
                  Total: <span className="font-bold">{quranGoal} pages/day</span>
                  {' '}({Object.entries(salahPages).filter(([, v]) => v > 0).map(([k, v]) => `${k.charAt(0).toUpperCase() + k.slice(1)}: ${v}×2`).join(', ')})
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
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
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
            <Star className="w-5 h-5 text-purple-500 mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{qiyamNights}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Qiyam nights</p>
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

        {/* View Toggle */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={() => setShowHistory(false)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              !showHistory
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <Calendar className="w-4 h-4" /> Calendar
          </button>
          <button
            onClick={() => setShowHistory(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition ${
              showHistory
                ? 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 border border-indigo-300 dark:border-indigo-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <List className="w-4 h-4" /> History
          </button>
        </div>

        {/* History View */}
        {showHistory && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <List className="w-5 h-5 text-indigo-500" />
              Ramadan {ramadanYear} — Full History
            </h3>
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                    <th className="pb-2 pr-2">Day</th>
                    <th className="pb-2 pr-2">Date</th>
                    <th className="pb-2 pr-2">Fast</th>
                    <th className="pb-2 pr-2">Quran</th>
                    <th className="pb-2 pr-2">Sadaqah</th>
                    <th className="pb-2 pr-2">Taraweeh</th>
                    <th className="pb-2 pr-2">Qiyam</th>
                    <th className="pb-2 pr-2">Masjid</th>
                    <th className="pb-2">Edit</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from({ length: RAMADAN_DAYS }, (_, i) => i + 1).map(day => {
                    const logDate = getRamadanDateForDay(ramadanYear, day);
                    const log = logs.find(l => l.log_date === logDate);
                    const status = getDayStatus(day);
                    const isToday = currentDay === day;
                    const dateObj = logDate ? new Date(logDate + 'T12:00:00') : null;
                    const dateLabel = dateObj ? dateObj.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '';
                    const dayName = dateObj ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][dateObj.getDay()] : '';

                    return (
                      <tr
                        key={day}
                        className={`border-b border-gray-100 dark:border-gray-700/50 ${
                          isToday ? 'bg-indigo-50/50 dark:bg-indigo-900/10' : ''
                        } ${selectedDay === day ? 'bg-indigo-50 dark:bg-indigo-900/20' : ''}`}
                      >
                        <td className="py-2 pr-2">
                          <span className={`font-medium ${isToday ? 'text-indigo-600 dark:text-indigo-400' : 'text-gray-900 dark:text-white'}`}>
                            N{day}
                          </span>
                          {isToday && <span className="ml-1 text-[10px] text-indigo-500 font-medium">TODAY</span>}
                        </td>
                        <td className="py-2 pr-2 text-gray-500 dark:text-gray-400">
                          {dayName} {dateLabel}
                        </td>
                        <td className="py-2 pr-2">
                          {day === 1 ? (
                            <span className="text-gray-400 text-xs">—</span>
                          ) : log ? (
                            log.fasted ? (
                              <CheckCircle className="w-4 h-4 text-emerald-500" />
                            ) : (
                              <X className="w-4 h-4 text-rose-400" />
                            )
                          ) : status === 'future' ? (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600 text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          {log ? (
                            <span className={`font-medium ${
                              log.quran_pages_read >= (plan?.quran_goal_pages_per_day || 0)
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-gray-900 dark:text-white'
                            }`}>
                              {log.quran_pages_read}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          {log && log.sadaqah_given > 0 ? (
                            <span className="text-pink-600 dark:text-pink-400">{log.sadaqah_given}</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          {log ? (
                            log.taraweeh_attended ? (
                              <CheckCircle className="w-4 h-4 text-indigo-500" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            )
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          {log ? (
                            log.qiyam_attended ? (
                              <CheckCircle className="w-4 h-4 text-purple-500" />
                            ) : (
                              <X className="w-4 h-4 text-gray-300 dark:text-gray-600" />
                            )
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="py-2 pr-2">
                          {log && log.masjid_prayers > 0 ? (
                            <span className="text-amber-600 dark:text-amber-400 font-medium">{log.masjid_prayers}/5</span>
                          ) : (
                            <span className="text-gray-300 dark:text-gray-600">—</span>
                          )}
                        </td>
                        <td className="py-2">
                          <button
                            onClick={() => { selectDay(day); setShowHistory(false); }}
                            className="px-2 py-1 text-xs text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded transition"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Totals row */}
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Fasts: </span>
                  <span className="font-bold text-gray-900 dark:text-white">{fastDays}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Quran: </span>
                  <span className="font-bold text-gray-900 dark:text-white">{totalQuranPages} pages</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Sadaqah: </span>
                  <span className="font-bold text-gray-900 dark:text-white">{plan?.sadaqah_currency || 'GBP'} {totalSadaqah.toFixed(0)}</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Taraweeh: </span>
                  <span className="font-bold text-gray-900 dark:text-white">{taraweehNights} nights</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Qiyam: </span>
                  <span className="font-bold text-gray-900 dark:text-white">{qiyamNights} nights</span>
                </div>
                <div>
                  <span className="text-gray-500 dark:text-gray-400">Masjid: </span>
                  <span className="font-bold text-gray-900 dark:text-white">{totalMasjidPrayers} prayers</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        {!showHistory && (
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-indigo-500" />
            30-Day Calendar
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
            Night = Taraweeh &middot; Fast starts the following morning (Night 1 has no fast)
          </p>
          <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
            {Array.from({ length: RAMADAN_DAYS }, (_, i) => i + 1).map(day => {
              const status = getDayStatus(day);
              const isSelected = selectedDay === day;
              const isToday = currentDay === day;
              const fastDay = day - 1;
              const dateStr = getRamadanDateForDay(ramadanYear, day);
              const dayName = dateStr ? ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][new Date(dateStr + 'T12:00:00').getDay()] : '';
              return (
                <button
                  key={day}
                  onClick={() => selectDay(day)}
                  className={`relative rounded-lg border-2 flex flex-col items-center justify-center py-2 px-1 transition ${
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
                  <span className="text-[10px] opacity-60 leading-none">{dayName}</span>
                  <span className="text-xs font-bold leading-tight">N{day}</span>
                  <span className="text-[10px] opacity-60 leading-none">{fastDay > 0 ? `F${fastDay}` : '—'}</span>
                  {isToday && (
                    <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-indigo-500 rounded-full" />
                  )}
                  {status === 'logged' && <CheckCircle className="w-3 h-3 text-emerald-500 mt-0.5" />}
                </button>
              );
            })}
          </div>
        </div>
        )}

        {/* Daily Check-In */}
        {selectedDay && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Night {selectedDay} Check-In
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {selectedDay > 1 ? `Fast day ${selectedDay - 1}` : 'No fast (first night of Ramadan)'}
                </p>
              </div>
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
                <span className="text-sm text-gray-700 dark:text-gray-300">
                  {selectedDay > 1 ? `Fasted? (Fast ${selectedDay - 1})` : 'Fasted? (No fast day 1)'}
                </span>
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

              {/* Qiyam al-Layl */}
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">Qiyam al-Layl?</span>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Last third of the night</p>
                </div>
                <button
                  onClick={() => setLogQiyam(!logQiyam)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition ${
                    logQiyam
                      ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border border-purple-300 dark:border-purple-700'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                  }`}
                >
                  {logQiyam ? 'Yes' : 'No'}
                </button>
              </div>

              {/* Masjid Prayers */}
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 block mb-2">Masjid prayers today</label>
                <div className="flex flex-wrap gap-2">
                  {PRAYER_NAMES.map(name => {
                    const selected = logMasjidPrayers.includes(name);
                    return (
                      <button
                        key={name}
                        onClick={() => setLogMasjidPrayers(prev =>
                          selected ? prev.filter(p => p !== name) : [...prev, name]
                        )}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
                          selected
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600'
                        }`}
                      >
                        {selected && <CheckCircle className="w-3 h-3 inline mr-1" />}
                        {name}
                      </button>
                    );
                  })}
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

        {/* Year-over-Year Motivation Card */}
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <TrendingUp className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100">Your Ramadan Journey is Being Saved</h3>
              <p className="text-sm text-purple-800 dark:text-purple-200 mt-1">
                Every page of Quran, every sadaqah, every prayer in the masjid, every night of Taraweeh — your totals are saved for Ramadan {ramadanYear}.
              </p>
              <p className="text-sm text-purple-800 dark:text-purple-200 mt-2">
                Next year, you'll be able to see how you did and aim to better it, in shaa Allah.
                <span className="font-semibold"> How much sawab did you earn this Ramadan?</span> Challenge yourself to go further in {ramadanYear + 1}.
              </p>
              <div className="mt-3 bg-white/60 dark:bg-gray-800/60 rounded-lg p-3">
                <p className="text-xs text-purple-700 dark:text-purple-300 font-medium mb-1">Your {ramadanYear} totals so far:</p>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-purple-600 dark:text-purple-400">
                  <span>{totalQuranPages} Quran pages</span>
                  <span>&middot;</span>
                  <span>{fastDays} fasts</span>
                  <span>&middot;</span>
                  <span>{taraweehNights} Taraweeh nights</span>
                  <span>&middot;</span>
                  <span>{qiyamNights} Qiyam nights</span>
                  <span>&middot;</span>
                  <span>{totalMasjidPrayers} masjid prayers</span>
                  <span>&middot;</span>
                  <span>{plan?.sadaqah_currency || 'GBP'} {totalSadaqah.toFixed(0)} sadaqah</span>
                </div>
              </div>
              <p className="text-xs text-purple-600 dark:text-purple-400 mt-2 italic">
                "The most beloved deeds to Allah are those done consistently, even if they are small." — Sahih al-Bukhari 6464
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
