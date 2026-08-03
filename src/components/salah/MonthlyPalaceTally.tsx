import { useMemo } from 'react';
import { Castle, Trophy } from 'lucide-react';
import { FARD_PRAYERS, daysInMonth, EffectivePrayerRecord } from '../../lib/prayerAutoMark';

interface Props {
  effectiveRecords: EffectivePrayerRecord[];
}

interface MonthAgg {
  key: string; // YYYY-MM
  label: string;
  fardCount: number;
  palaceDays: number;
}

function aggregateByMonth(records: EffectivePrayerRecord[]): Map<string, MonthAgg> {
  const byDate = new Map<string, { fard: Set<string>; sunnah: Set<string> }>();
  for (const r of records) {
    if (!byDate.has(r.record_date)) byDate.set(r.record_date, { fard: new Set(), sunnah: new Set() });
    const day = byDate.get(r.record_date)!;
    if (FARD_PRAYERS.includes(r.prayer_name) && r.status !== 'missed') day.fard.add(r.prayer_name);
    if (r.status !== 'missed') (r.sunnah_completed || []).forEach(s => day.sunnah.add(s));
  }

  const months = new Map<string, MonthAgg>();
  for (const [date, day] of byDate.entries()) {
    const monthKey = date.slice(0, 7); // YYYY-MM
    if (!months.has(monthKey)) {
      const [y, m] = monthKey.split('-').map(Number);
      months.set(monthKey, {
        key: monthKey,
        label: new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }),
        fardCount: 0,
        palaceDays: 0,
      });
    }
    const agg = months.get(monthKey)!;
    agg.fardCount += day.fard.size;
    if (day.sunnah.size >= 5) agg.palaceDays += 1; // 5 sunnah rawatib entries = all 12 rak'ahs
  }
  return months;
}

export default function MonthlyPalaceTally({ effectiveRecords }: Props) {
  const now = useMemo(() => new Date(), []);
  const currentMonthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const maxDaysThisMonth = daysInMonth(now.getFullYear(), now.getMonth());
  const maxFardThisMonth = maxDaysThisMonth * FARD_PRAYERS.length;

  const { thisMonth, best } = useMemo(() => {
    const months = aggregateByMonth(effectiveRecords);
    const thisMonthAgg = months.get(currentMonthKey) || { key: currentMonthKey, label: '', fardCount: 0, palaceDays: 0 };

    let bestAgg: MonthAgg | null = null;
    for (const [key, agg] of months.entries()) {
      if (key === currentMonthKey) continue; // compare against other months only
      if (!bestAgg || agg.palaceDays > bestAgg.palaceDays) bestAgg = agg;
    }
    return { thisMonth: thisMonthAgg, best: bestAgg };
  }, [effectiveRecords, currentMonthKey]);

  const fardPct = Math.min(100, Math.round((thisMonth.fardCount / maxFardThisMonth) * 100));
  const palacePct = Math.min(100, Math.round((thisMonth.palaceDays / maxDaysThisMonth) * 100));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">
        {now.toLocaleDateString('en-GB', { month: 'long' })} - monthly targets
      </h3>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
            {thisMonth.fardCount} <span className="text-sm font-semibold text-gray-400">/ {maxFardThisMonth}</span>
          </p>
          <p className="text-[11px] uppercase tracking-wide text-gray-400 mt-0.5">Fard prayed</p>
          <div className="h-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden mt-2.5">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${fardPct}%` }} />
          </div>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
          <p className="text-xl font-bold text-emerald-700 dark:text-emerald-400">
            {thisMonth.palaceDays} <span className="text-sm font-semibold text-gray-400">/ {maxDaysThisMonth}</span>
          </p>
          <p className="text-[11px] uppercase tracking-wide text-gray-400 mt-0.5">Palace days</p>
          <div className="h-1.5 rounded-full bg-emerald-100 dark:bg-emerald-900/40 overflow-hidden mt-2.5">
            <div className="h-full bg-emerald-600 rounded-full" style={{ width: `${palacePct}%` }} />
          </div>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900 rounded-xl p-4">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
            <Castle className="w-4 h-4" /> Palace days
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          One palace per day you complete all 12 rak'ahs of confirmed sunnah - {maxDaysThisMonth} possible this month.
        </p>
        {best && (
          <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-300 pt-2 border-t border-amber-100 dark:border-amber-900/60">
            <Trophy className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <span>
              Your personal best month: <b className="text-amber-700 dark:text-amber-400">{best.palaceDays} / {daysInMonth(Number(best.key.slice(0, 4)), Number(best.key.slice(5, 7)) - 1)} days</b> ({best.label})
              {best.palaceDays > thisMonth.palaceDays && (
                <> - <b>{best.palaceDays - thisMonth.palaceDays} more</b> to beat it this month.</>
              )}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
