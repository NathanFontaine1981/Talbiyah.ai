// Ramadan start dates (1st Ramadan in Gregorian calendar)
// These are approximate — actual dates depend on moon sighting
const RAMADAN_DATES: Record<number, { start: string; end: string }> = {
  2025: { start: '2025-03-01', end: '2025-03-30' },
  2026: { start: '2026-02-18', end: '2026-03-19' },
  2027: { start: '2027-02-08', end: '2027-03-09' },
  2028: { start: '2028-01-28', end: '2028-02-26' },
};

export const TOTAL_QURAN_PAGES = 604;
export const RAMADAN_DAYS = 30;
export const MASJID_PRAYER_MULTIPLIER = 27;

export const READING_TIME_OPTIONS = [
  { value: 'after_fajr', label: 'After Fajr' },
  { value: 'after_dhuhr', label: 'After Dhuhr' },
  { value: 'after_asr', label: 'After Asr' },
  { value: 'after_maghrib', label: 'After Maghrib' },
  { value: 'after_isha', label: 'After Isha' },
  { value: 'after_taraweeh', label: 'After Taraweeh' },
];

export const DEFAULT_HABITS = [
  'Social Media',
  'Music',
  'Movies/TV',
  'Video Games',
];

export const PRAYER_NAMES = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export function getRamadanDates(year: number): { start: Date; end: Date } | null {
  const entry = RAMADAN_DATES[year];
  if (!entry) return null;
  return { start: new Date(entry.start), end: new Date(entry.end) };
}

export function getRamadanDay(year: number): number | null {
  const dates = getRamadanDates(year);
  if (!dates) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(dates.start);
  start.setHours(0, 0, 0, 0);
  const end = new Date(dates.end);
  end.setHours(0, 0, 0, 0);
  if (today < start || today > end) return null;
  return Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
}

export function getDaysUntilRamadan(year: number): number | null {
  const dates = getRamadanDates(year);
  if (!dates) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const start = new Date(dates.start);
  start.setHours(0, 0, 0, 0);
  const diff = Math.ceil((start.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : null;
}

export function isRamadan(year: number): boolean {
  return getRamadanDay(year) !== null;
}

export function getRamadanYear(): number {
  const now = new Date();
  const year = now.getFullYear();
  // Check if we're currently in or approaching this year's Ramadan
  const dates = getRamadanDates(year);
  if (dates) {
    const end = new Date(dates.end);
    // If Ramadan this year hasn't ended yet, use this year
    if (now <= end) return year;
  }
  // Otherwise use next year
  return year + 1;
}

export function getRamadanDateForDay(year: number, dayNum: number): string | null {
  const dates = getRamadanDates(year);
  if (!dates || dayNum < 1 || dayNum > RAMADAN_DAYS) return null;
  const d = new Date(dates.start);
  d.setDate(d.getDate() + dayNum - 1);
  return d.toISOString().split('T')[0];
}
