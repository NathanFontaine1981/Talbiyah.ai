import { useState, useCallback } from 'react';

const STORAGE_KEY = 'talbiyah_prayer_tracking';

interface PrayerTrackingData {
  date: string;
  completed: string[];
  sunnahCompleted: string[];
}

// 12 Sunnah Rawatib — "a house in Paradise" (Tirmidhi 415)
// Keys follow pattern: "PrayerName-before" or "PrayerName-after"
export const SUNNAH_PRAYERS: { key: string; label: string; rakahs: number; fardPrayer: string; position: 'before' | 'after' }[] = [
  { key: 'Fajr-before', label: '2 before Fajr', rakahs: 2, fardPrayer: 'Fajr', position: 'before' },
  { key: 'Dhuhr-before', label: '4 before Dhuhr', rakahs: 4, fardPrayer: 'Dhuhr', position: 'before' },
  { key: 'Dhuhr-after', label: '2 after Dhuhr', rakahs: 2, fardPrayer: 'Dhuhr', position: 'after' },
  { key: 'Maghrib-after', label: '2 after Maghrib', rakahs: 2, fardPrayer: 'Maghrib', position: 'after' },
  { key: 'Isha-after', label: '2 after Isha', rakahs: 2, fardPrayer: 'Isha', position: 'after' },
];

export const TOTAL_SUNNAH_RAKAHS = SUNNAH_PRAYERS.reduce((sum, s) => sum + s.rakahs, 0); // 12

function getTodayString(): string {
  return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
}

function loadToday(): { completed: string[]; sunnahCompleted: string[] } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { completed: [], sunnahCompleted: [] };
    const data: PrayerTrackingData = JSON.parse(raw);
    if (data.date !== getTodayString()) return { completed: [], sunnahCompleted: [] };
    return { completed: data.completed, sunnahCompleted: data.sunnahCompleted || [] };
  } catch {
    return { completed: [], sunnahCompleted: [] };
  }
}

function saveToday(completed: string[], sunnahCompleted: string[]) {
  const data: PrayerTrackingData = { date: getTodayString(), completed, sunnahCompleted };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function usePrayerTracking() {
  const [state, setState] = useState(loadToday);

  const togglePrayer = useCallback((name: string) => {
    setState(prev => {
      const next = prev.completed.includes(name)
        ? prev.completed.filter(p => p !== name)
        : [...prev.completed, name];
      const newState = { ...prev, completed: next };
      saveToday(newState.completed, newState.sunnahCompleted);
      return newState;
    });
  }, []);

  const toggleSunnah = useCallback((key: string) => {
    setState(prev => {
      const next = prev.sunnahCompleted.includes(key)
        ? prev.sunnahCompleted.filter(s => s !== key)
        : [...prev.sunnahCompleted, key];
      const newState = { ...prev, sunnahCompleted: next };
      saveToday(newState.completed, newState.sunnahCompleted);
      return newState;
    });
  }, []);

  const isPrayerCompleted = useCallback(
    (name: string) => state.completed.includes(name),
    [state.completed]
  );

  const isSunnahCompleted = useCallback(
    (key: string) => state.sunnahCompleted.includes(key),
    [state.sunnahCompleted]
  );

  const sunnahRakahsDone = state.sunnahCompleted.reduce((sum, key) => {
    const sunnah = SUNNAH_PRAYERS.find(s => s.key === key);
    return sum + (sunnah?.rakahs || 0);
  }, 0);

  return {
    completedPrayers: state.completed,
    sunnahCompleted: state.sunnahCompleted,
    togglePrayer,
    toggleSunnah,
    isPrayerCompleted,
    isSunnahCompleted,
    sunnahRakahsDone,
  };
}
