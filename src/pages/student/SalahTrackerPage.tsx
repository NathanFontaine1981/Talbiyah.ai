import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Home,
  Castle,
  Flame,
  Trophy,
  ChevronLeft,
  ChevronRight,
  Check,
  X as XIcon,
  Clock,
  TrendingUp,
  Award,
  Star,
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const MASJID_MULTIPLIER = 27;

interface SalahRecord {
  record_date: string;
  prayer_name: string;
  status: string;
  location: string;
  sunnah_completed: string[];
}

interface DaySummary {
  date: string;
  prayers: Record<string, { status: string; location: string; sunnah: string[] }>;
  prayerCount: number;
  masjidCount: number;
  sunnahCount: number;
}

export default function SalahTrackerPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<SalahRecord[]>([]);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    loadAllRecords();
  }, []);

  async function loadAllRecords() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('salah_daily_record')
        .select('record_date, prayer_name, status, location, sunnah_completed')
        .eq('user_id', user.id)
        .order('record_date', { ascending: false });

      setRecords(data || []);
    } catch (err) {
      console.error('Failed to load salah history:', err);
    } finally {
      setLoading(false);
    }
  }

  // Group records by date
  const daySummaries = useMemo((): DaySummary[] => {
    const map = new Map<string, DaySummary>();

    for (const r of records) {
      if (!map.has(r.record_date)) {
        map.set(r.record_date, {
          date: r.record_date,
          prayers: {},
          prayerCount: 0,
          masjidCount: 0,
          sunnahCount: 0,
        });
      }
      const day = map.get(r.record_date)!;
      day.prayers[r.prayer_name] = {
        status: r.status,
        location: r.location,
        sunnah: r.sunnah_completed || [],
      };
      if (r.status !== 'missed') day.prayerCount++;
      if (r.location === 'masjid' && r.status !== 'missed') day.masjidCount++;
      day.sunnahCount += (r.sunnah_completed || []).length;
    }

    return Array.from(map.values()).sort((a, b) => b.date.localeCompare(a.date));
  }, [records]);

  // Stats
  const stats = useMemo(() => {
    const totalPrayed = records.filter(r => r.status !== 'missed').length;
    const masjidPrayed = records.filter(r => r.location === 'masjid' && r.status !== 'missed').length;
    const homePrayed = totalPrayed - masjidPrayed;
    const onTime = records.filter(r => r.status === 'prayed_on_time').length;
    const late = records.filter(r => r.status === 'prayed_late').length;

    // Sunnah count
    const allSunnahKeys = new Set<string>();
    const palaceDays: Set<string> = new Set();
    const sunnahByDay = new Map<string, Set<string>>();

    for (const r of records) {
      if (r.sunnah_completed) {
        for (const s of r.sunnah_completed) {
          allSunnahKeys.add(`${r.record_date}-${s}`);
          if (!sunnahByDay.has(r.record_date)) sunnahByDay.set(r.record_date, new Set());
          sunnahByDay.get(r.record_date)!.add(s);
        }
      }
    }

    for (const [date, keys] of sunnahByDay.entries()) {
      // 5 sunnah prayers = all 12 rak'ahs (palace day)
      if (keys.size >= 5) palaceDays.add(date);
    }

    // Streak calculation
    let currentStreak = 0;
    let bestStreak = 0;
    let tempStreak = 0;

    // Get unique dates with all 5 prayers
    const perfectDays = new Set(
      daySummaries.filter(d => d.prayerCount === 5).map(d => d.date)
    );

    // Calculate streaks by walking dates backwards from today
    const today = new Date();
    const checkDate = new Date(today);
    let streakBroken = false;

    for (let i = 0; i < 365; i++) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (perfectDays.has(dateStr)) {
        tempStreak++;
        if (!streakBroken) currentStreak = tempStreak;
      } else {
        streakBroken = true;
        if (tempStreak > bestStreak) bestStreak = tempStreak;
        tempStreak = 0;
      }
      checkDate.setDate(checkDate.getDate() - 1);
    }
    if (tempStreak > bestStreak) bestStreak = tempStreak;

    return {
      totalPrayed,
      masjidPrayed,
      homePrayed,
      onTime,
      late,
      totalSunnah: allSunnahKeys.size,
      palaceDays: palaceDays.size,
      currentStreak,
      bestStreak,
      uniqueDays: daySummaries.length,
    };
  }, [records, daySummaries]);

  // Week view
  const weekDays = useMemo(() => {
    const today = new Date();
    const start = new Date(today);
    start.setDate(start.getDate() - start.getDay() + (weekOffset * 7)); // Start of week (Sunday)
    const days: { date: string; label: string; dayName: string }[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(start);
      d.setDate(d.getDate() + i);
      days.push({
        date: d.toISOString().split('T')[0],
        label: d.getDate().toString(),
        dayName: d.toLocaleDateString('en-GB', { weekday: 'short' }),
      });
    }
    return days;
  }, [weekOffset]);

  const weekSummaryMap = useMemo(() => {
    const map = new Map<string, DaySummary>();
    for (const d of daySummaries) {
      map.set(d.date, d);
    }
    return map;
  }, [daySummaries]);

  // Milestones
  const milestones = [
    { target: 7, label: '7-day streak', icon: Flame },
    { target: 30, label: '30-day streak', icon: Trophy },
    { target: 100, label: '100-day streak', icon: Award },
    { target: 365, label: '1 year streak', icon: Star },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-white/80 hover:text-white mb-4 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Dashboard</span>
          </button>
          <h1 className="text-2xl font-bold">Salah Tracker</h1>
          <p className="text-emerald-100 text-sm mt-1">Track your prayers, build consistency, earn rewards</p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Check className="w-4 h-4 text-emerald-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Total Prayers</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalPrayed}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              {stats.onTime} on time, {stats.late} late
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Building2 className="w-4 h-4 text-amber-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Masjid</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.masjidPrayed}</p>
            <p className="text-xs text-amber-600 dark:text-amber-400 mt-0.5">
              = {stats.masjidPrayed * MASJID_MULTIPLIER} reward units
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Castle className="w-4 h-4 text-purple-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Palaces Built</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.palaceDays}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              12 sunnah rak'ahs = 1 palace
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2 mb-1">
              <Flame className="w-4 h-4 text-orange-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Current Streak</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.currentStreak}</p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
              Best: {stats.bestStreak} days
            </p>
          </div>
        </div>

        {/* Reward Summary */}
        {stats.totalPrayed > 0 && (
          <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 rounded-xl p-5 border border-amber-200 dark:border-amber-800/50">
            <h3 className="text-sm font-semibold text-amber-900 dark:text-amber-300 mb-3">Reward Summary</h3>
            <div className="space-y-2 text-sm">
              {stats.masjidPrayed > 0 && (
                <p className="text-amber-800 dark:text-amber-200">
                  <Building2 className="w-3.5 h-3.5 inline mr-1" />
                  You prayed {stats.masjidPrayed} times in the masjid = {stats.masjidPrayed} x {MASJID_MULTIPLIER} = <strong>{stats.masjidPrayed * MASJID_MULTIPLIER}</strong> reward units
                  <span className="block text-xs text-amber-600 dark:text-amber-400 mt-0.5 italic">
                    "Prayer in congregation is twenty-seven times better than prayer offered individually." — Bukhari & Muslim
                  </span>
                </p>
              )}
              {stats.palaceDays > 0 && (
                <p className="text-amber-800 dark:text-amber-200">
                  <Castle className="w-3.5 h-3.5 inline mr-1" />
                  You built <strong>{stats.palaceDays}</strong> {stats.palaceDays === 1 ? 'palace' : 'palaces'} in Jannah ({stats.palaceDays} days with all 12 sunnah rak'ahs)
                  <span className="block text-xs text-amber-600 dark:text-amber-400 mt-0.5 italic">
                    "Whoever prays 12 rak'ahs during the day and night, a house will be built for him in Paradise." — Tirmidhi
                  </span>
                </p>
              )}
              {stats.homePrayed > 0 && stats.masjidPrayed === 0 && (
                <p className="text-amber-800 dark:text-amber-200">
                  <Home className="w-3.5 h-3.5 inline mr-1" />
                  You've logged {stats.homePrayed} prayers at home. Try praying at the masjid for 27x the reward!
                </p>
              )}
            </div>
          </div>
        )}

        {/* Weekly Calendar */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">Weekly View</h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setWeekOffset(prev => prev - 1)}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                <ChevronLeft className="w-4 h-4 text-gray-500" />
              </button>
              <button
                onClick={() => setWeekOffset(0)}
                className="text-xs text-emerald-600 dark:text-emerald-400 font-medium px-2 py-1 rounded hover:bg-emerald-50 dark:hover:bg-emerald-900/30 transition"
              >
                This Week
              </button>
              <button
                onClick={() => setWeekOffset(prev => Math.min(prev + 1, 0))}
                disabled={weekOffset >= 0}
                className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {weekDays.map(d => (
              <div key={d.date} className="text-center">
                <p className="text-[10px] text-gray-400 dark:text-gray-500 uppercase">{d.dayName}</p>
                <p className={`text-xs font-medium ${d.date === todayStr ? 'text-emerald-600 dark:text-emerald-400' : 'text-gray-600 dark:text-gray-300'}`}>
                  {d.label}
                </p>
              </div>
            ))}
          </div>

          {/* Prayer grid */}
          {PRAYER_NAMES.map(prayer => (
            <div key={prayer} className="grid grid-cols-7 gap-1 mb-1">
              {weekDays.map(d => {
                const dayData = weekSummaryMap.get(d.date);
                const prayerData = dayData?.prayers[prayer];
                const isFuture = d.date > todayStr;

                let bgClass = 'bg-gray-100 dark:bg-gray-700/50'; // default
                let icon = null;

                if (isFuture) {
                  bgClass = 'bg-gray-50 dark:bg-gray-800/30';
                } else if (prayerData) {
                  if (prayerData.status === 'prayed_on_time') {
                    bgClass = prayerData.location === 'masjid'
                      ? 'bg-emerald-500 ring-2 ring-amber-400'
                      : 'bg-emerald-500';
                    icon = <Check className="w-3 h-3 text-white" />;
                  } else if (prayerData.status === 'prayed_late') {
                    bgClass = prayerData.location === 'masjid'
                      ? 'bg-amber-400 ring-2 ring-amber-600'
                      : 'bg-amber-400';
                    icon = <Clock className="w-3 h-3 text-white" />;
                  }
                } else if (!isFuture && d.date <= todayStr) {
                  // No record — could be missed or not tracked
                  bgClass = 'bg-red-100 dark:bg-red-900/20';
                  icon = <XIcon className="w-3 h-3 text-red-400" />;
                }

                return (
                  <div
                    key={`${prayer}-${d.date}`}
                    className={`h-7 rounded-md flex items-center justify-center ${bgClass} transition-colors`}
                    title={`${prayer} — ${d.date}${prayerData ? ` (${prayerData.status}, ${prayerData.location})` : ''}`}
                  >
                    {icon}
                  </div>
                );
              })}
            </div>
          ))}

          {/* Prayer name labels on the left — shown as a legend below */}
          <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
            {PRAYER_NAMES.map((p, i) => (
              <span key={p} className="text-[10px] text-gray-400 dark:text-gray-500">
                Row {i + 1}: {p}
              </span>
            ))}
          </div>

          {/* Legend */}
          <div className="flex flex-wrap gap-3 mt-2">
            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded bg-emerald-500 inline-block" /> On time
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded bg-amber-400 inline-block" /> Late
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded bg-red-100 dark:bg-red-900/20 inline-block" /> Missed
            </span>
            <span className="flex items-center gap-1 text-[10px] text-gray-500 dark:text-gray-400">
              <span className="w-3 h-3 rounded bg-emerald-500 ring-2 ring-amber-400 inline-block" /> Masjid
            </span>
          </div>
        </div>

        {/* Monthly Progress */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            <TrendingUp className="w-4 h-4 inline mr-1" />
            Last 30 Days
          </h3>
          <div className="flex items-end gap-[3px] h-24">
            {Array.from({ length: 30 }, (_, i) => {
              const d = new Date();
              d.setDate(d.getDate() - (29 - i));
              const dateStr = d.toISOString().split('T')[0];
              const dayData = weekSummaryMap.get(dateStr);
              const count = dayData?.prayerCount || 0;
              const heightPct = count > 0 ? (count / 5) * 100 : 4;
              const hasMasjid = (dayData?.masjidCount || 0) > 0;

              return (
                <div
                  key={dateStr}
                  className="flex-1 flex flex-col items-center justify-end"
                  title={`${dateStr}: ${count}/5 prayers${hasMasjid ? ` (${dayData?.masjidCount} at masjid)` : ''}`}
                >
                  <div
                    className={`w-full rounded-t transition-all ${
                      count === 5
                        ? hasMasjid
                          ? 'bg-gradient-to-t from-amber-400 to-emerald-500'
                          : 'bg-emerald-500'
                        : count > 0
                          ? 'bg-emerald-300 dark:bg-emerald-600'
                          : 'bg-gray-200 dark:bg-gray-700'
                    }`}
                    style={{ height: `${heightPct}%`, minHeight: '2px' }}
                  />
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[10px] text-gray-400">30 days ago</span>
            <span className="text-[10px] text-gray-400">Today</span>
          </div>
        </div>

        {/* Streaks & Milestones */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
            <Trophy className="w-4 h-4 inline mr-1" />
            Milestones
          </h3>
          <div className="space-y-3">
            {milestones.map(m => {
              const achieved = stats.bestStreak >= m.target;
              const progress = Math.min((stats.bestStreak / m.target) * 100, 100);

              return (
                <div key={m.target} className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    achieved
                      ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-500'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                  }`}>
                    <m.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${achieved ? 'text-amber-700 dark:text-amber-300' : 'text-gray-600 dark:text-gray-300'}`}>
                        {m.label}
                      </span>
                      <span className="text-[10px] text-gray-400">
                        {achieved ? 'Achieved!' : `${stats.bestStreak}/${m.target}`}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          achieved ? 'bg-amber-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {records.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-emerald-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Start Tracking Your Prayers</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
              Mark your prayers as completed on the dashboard prayer timeline. Your history will appear here automatically.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-lg text-sm font-medium hover:bg-emerald-600 transition"
            >
              Go to Dashboard
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
