import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';

const STORAGE_KEY = 'talbiyah_prayer_tracking';

interface PrayerTrackingData {
  date: string;
  completed: string[];
  sunnahCompleted: string[];
  locations: Record<string, 'home' | 'masjid'>; // prayerName -> location
  statuses: Record<string, 'prayed_on_time' | 'prayed_late'>; // prayerName -> status
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

function loadToday(): PrayerTrackingData {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { date: getTodayString(), completed: [], sunnahCompleted: [], locations: {}, statuses: {} };
    const data: PrayerTrackingData = JSON.parse(raw);
    if (data.date !== getTodayString()) return { date: getTodayString(), completed: [], sunnahCompleted: [], locations: {}, statuses: {} };
    return {
      date: data.date,
      completed: data.completed || [],
      sunnahCompleted: data.sunnahCompleted || [],
      locations: data.locations || {},
      statuses: data.statuses || {},
    };
  } catch {
    return { date: getTodayString(), completed: [], sunnahCompleted: [], locations: {}, statuses: {} };
  }
}

function saveToday(data: PrayerTrackingData) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

// Upsert a prayer record to Supabase (fire-and-forget, no await in toggle)
async function syncToSupabase(
  prayerName: string,
  status: 'prayed_on_time' | 'prayed_late' | 'missed',
  location: 'home' | 'masjid',
  sunnahCompleted: string[],
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const relevantSunnah = sunnahCompleted.filter(
      (k) => k.startsWith(prayerName + '-')
    );

    await supabase.from('salah_daily_record').upsert(
      {
        user_id: user.id,
        record_date: getTodayString(),
        prayer_name: prayerName,
        status,
        location,
        sunnah_completed: relevantSunnah,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'user_id,record_date,prayer_name' }
    );
  } catch (err) {
    console.error('Failed to sync salah record:', err);
  }
}

// Delete a prayer record from Supabase when unchecked
async function deleteFromSupabase(prayerName: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
      .from('salah_daily_record')
      .delete()
      .eq('user_id', user.id)
      .eq('record_date', getTodayString())
      .eq('prayer_name', prayerName);
  } catch (err) {
    console.error('Failed to delete salah record:', err);
  }
}

export function usePrayerTracking() {
  const [state, setState] = useState<PrayerTrackingData>(loadToday);
  const stateRef = useRef(state);
  stateRef.current = state;

  // Load from Supabase on mount to sync across devices
  useEffect(() => {
    (async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: records } = await supabase
          .from('salah_daily_record')
          .select('prayer_name, status, location, sunnah_completed')
          .eq('user_id', user.id)
          .eq('record_date', getTodayString());

        if (records && records.length > 0) {
          const completed: string[] = [];
          const locations: Record<string, 'home' | 'masjid'> = {};
          const statuses: Record<string, 'prayed_on_time' | 'prayed_late'> = {};
          const allSunnah: string[] = [];

          for (const r of records) {
            if (r.status !== 'missed') {
              completed.push(r.prayer_name);
              locations[r.prayer_name] = r.location as 'home' | 'masjid';
              statuses[r.prayer_name] = r.status as 'prayed_on_time' | 'prayed_late';
            }
            if (r.sunnah_completed) {
              allSunnah.push(...r.sunnah_completed);
            }
          }

          const merged: PrayerTrackingData = {
            date: getTodayString(),
            completed: [...new Set([...stateRef.current.completed, ...completed])],
            sunnahCompleted: [...new Set([...stateRef.current.sunnahCompleted, ...allSunnah])],
            locations: { ...stateRef.current.locations, ...locations },
            statuses: { ...stateRef.current.statuses, ...statuses },
          };
          setState(merged);
          saveToday(merged);
        }
      } catch {
        // Offline — localStorage is the fallback
      }
    })();
  }, []);

  const togglePrayer = useCallback((name: string, prayerTimeEnd?: number, currentMinutes?: number) => {
    setState(prev => {
      const wasCompleted = prev.completed.includes(name);
      const next = wasCompleted
        ? prev.completed.filter(p => p !== name)
        : [...prev.completed, name];

      // Auto-detect on-time vs late
      let status: 'prayed_on_time' | 'prayed_late' = 'prayed_on_time';
      if (!wasCompleted && prayerTimeEnd !== undefined && currentMinutes !== undefined) {
        status = currentMinutes > prayerTimeEnd ? 'prayed_late' : 'prayed_on_time';
      }

      const newStatuses = { ...prev.statuses };
      if (!wasCompleted) {
        newStatuses[name] = status;
      } else {
        delete newStatuses[name];
      }

      const newState: PrayerTrackingData = { ...prev, completed: next, statuses: newStatuses };
      saveToday(newState);

      // Sync to Supabase
      if (!wasCompleted) {
        syncToSupabase(name, status, prev.locations[name] || 'home', newState.sunnahCompleted);
      } else {
        deleteFromSupabase(name);
      }

      return newState;
    });
  }, []);

  const toggleLocation = useCallback((prayerName: string) => {
    setState(prev => {
      const current = prev.locations[prayerName] || 'home';
      const next = current === 'home' ? 'masjid' : 'home';
      const newLocations = { ...prev.locations, [prayerName]: next };
      const newState: PrayerTrackingData = { ...prev, locations: newLocations };
      saveToday(newState);

      // Sync to Supabase if prayer is completed
      if (prev.completed.includes(prayerName)) {
        syncToSupabase(
          prayerName,
          prev.statuses[prayerName] || 'prayed_on_time',
          next,
          prev.sunnahCompleted
        );
      }

      return newState;
    });
  }, []);

  const toggleSunnah = useCallback((key: string) => {
    setState(prev => {
      const next = prev.sunnahCompleted.includes(key)
        ? prev.sunnahCompleted.filter(s => s !== key)
        : [...prev.sunnahCompleted, key];
      const newState: PrayerTrackingData = { ...prev, sunnahCompleted: next };
      saveToday(newState);

      // Sync sunnah to the relevant fard prayer record
      const fardPrayer = key.split('-')[0]; // e.g. 'Fajr-before' -> 'Fajr'
      if (prev.completed.includes(fardPrayer)) {
        syncToSupabase(
          fardPrayer,
          prev.statuses[fardPrayer] || 'prayed_on_time',
          prev.locations[fardPrayer] || 'home',
          next
        );
      }

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

  const getLocation = useCallback(
    (prayerName: string): 'home' | 'masjid' => state.locations[prayerName] || 'home',
    [state.locations]
  );

  const sunnahRakahsDone = state.sunnahCompleted.reduce((sum, key) => {
    const sunnah = SUNNAH_PRAYERS.find(s => s.key === key);
    return sum + (sunnah?.rakahs || 0);
  }, 0);

  return {
    completedPrayers: state.completed,
    sunnahCompleted: state.sunnahCompleted,
    locations: state.locations,
    togglePrayer,
    toggleSunnah,
    toggleLocation,
    isPrayerCompleted,
    isSunnahCompleted,
    getLocation,
    sunnahRakahsDone,
  };
}
