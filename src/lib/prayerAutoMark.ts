import { SUNNAH_PRAYERS } from '../hooks/usePrayerTracking';

export const FARD_PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export interface SalahTrackerSettings {
  auto_mark_enabled: boolean;
  auto_mark_sunnah_enabled: boolean;
  auto_mark_enabled_at: string | null;
  last_nudge_shown_at?: string | null;
}

export interface EffectivePrayerRecord {
  record_date: string;
  prayer_name: string;
  status: string;
  location: string;
  sunnah_completed: string[];
  isAuto?: boolean;
}

/**
 * Single source of truth for "what counts as auto-marked" across the app.
 * A real logged row always wins - this only fills gaps.
 */

// Synthesizes auto-marked fard+sunnah entries for any past date (strictly before
// `todayStr`) with no real logged row, from the day auto-mark was enabled onward.
// Never touches today (PrayerTimeline handles that live, using real prayer-time
// windows) and never overwrites an explicit row.
export function buildEffectiveRecords<T extends EffectivePrayerRecord>(
  records: T[],
  settings: SalahTrackerSettings | null | undefined,
  todayStr: string
): T[] {
  if (!settings?.auto_mark_enabled || !settings.auto_mark_enabled_at) return records;

  const enabledDateStr = settings.auto_mark_enabled_at.slice(0, 10);
  const existing = new Set(records.map(r => `${r.record_date}|${r.prayer_name}`));
  const synthetic: T[] = [];

  const cursor = new Date(enabledDateStr + 'T00:00:00Z');
  const end = new Date(todayStr + 'T00:00:00Z');

  while (cursor < end) {
    const dateStr = cursor.toISOString().split('T')[0];
    for (const prayer of FARD_PRAYERS) {
      const key = `${dateStr}|${prayer}`;
      if (!existing.has(key)) {
        const sunnahKeys = settings.auto_mark_sunnah_enabled
          ? SUNNAH_PRAYERS.filter(s => s.fardPrayer === prayer).map(s => s.key)
          : [];
        synthetic.push({
          record_date: dateStr,
          prayer_name: prayer,
          status: 'prayed_on_time',
          location: 'home',
          sunnah_completed: sunnahKeys,
          isAuto: true,
        } as T);
      }
    }
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return [...records, ...synthetic];
}

// For the live "today" view: which fard prayers should be treated as auto-marked
// right now, given each prayer's time-window end and the current time. A prayer
// whose window hasn't passed yet is never assumed done.
export function computeTodayAutoMarked(
  segmentEndByPrayer: Record<string, number>,
  currentMinutes: number,
  alreadyCompleted: Set<string>,
  settings: SalahTrackerSettings | null | undefined,
  todayStr: string
): Set<string> {
  const result = new Set<string>();
  if (!settings?.auto_mark_enabled || !settings.auto_mark_enabled_at) return result;
  const enabledDateStr = settings.auto_mark_enabled_at.slice(0, 10);
  if (todayStr < enabledDateStr) return result;

  for (const prayer of FARD_PRAYERS) {
    if (alreadyCompleted.has(prayer)) continue;
    const end = segmentEndByPrayer[prayer];
    if (end !== undefined && currentMinutes >= end) {
      result.add(prayer);
    }
  }
  return result;
}

export function autoMarkedSunnahKeys(
  settings: SalahTrackerSettings | null | undefined,
  autoMarkedFard: Set<string>
): Set<string> {
  const result = new Set<string>();
  if (!settings?.auto_mark_sunnah_enabled) return result;
  for (const prayer of autoMarkedFard) {
    SUNNAH_PRAYERS.filter(s => s.fardPrayer === prayer).forEach(s => result.add(s.key));
  }
  return result;
}

// Days achievable this calendar month for the monthly tally (task: "targets for the month")
export function daysInMonth(year: number, monthIndex0: number): number {
  return new Date(year, monthIndex0 + 1, 0).getDate();
}
