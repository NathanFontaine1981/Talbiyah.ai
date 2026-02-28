import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';

export interface PrayerTime {
  name: string;
  time: string;
  timeInMinutes: number;
  isPassed: boolean;
}

interface UsePrayerTimesResult {
  prayerTimes: PrayerTime[];
  location: string;
  loading: boolean;
  nextPrayer: PrayerTime | null;
  currentMinutes: number;
}

function parseTimeToMinutes(time: string): number {
  const clean = time.split(' ')[0]; // remove timezone suffix like "(GMT)"
  const [hours, minutes] = clean.split(':').map(Number);
  return hours * 60 + minutes;
}

function getNowMinutes(): number {
  const now = new Date();
  return now.getHours() * 60 + now.getMinutes();
}

// Geocode a "City, Country" string to coordinates using Nominatim
async function geocodeLocation(locationStr: string): Promise<{ lat: number; lon: number; display: string } | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(locationStr)}&limit=1`
    );
    const results = await response.json();
    if (results && results.length > 0) {
      return {
        lat: parseFloat(results[0].lat),
        lon: parseFloat(results[0].lon),
        display: results[0].display_name?.split(',').slice(0, 2).join(',').trim() || locationStr,
      };
    }
  } catch {
    // Geocoding failed — fall through
  }
  return null;
}

export function usePrayerTimes(): UsePrayerTimesResult {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [location, setLocation] = useState('Detecting location...');
  const [loading, setLoading] = useState(true);
  const [currentMinutes, setCurrentMinutes] = useState(getNowMinutes);

  // Update current time every 60s
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentMinutes(getNowMinutes());
    }, 60_000);
    return () => clearInterval(interval);
  }, []);

  // Re-derive isPassed when currentMinutes changes
  useEffect(() => {
    if (prayerTimes.length === 0) return;
    setPrayerTimes(prev =>
      prev.map(p => ({ ...p, isPassed: currentMinutes > p.timeInMinutes }))
    );
  }, [currentMinutes]);

  useEffect(() => {
    initPrayerTimes();
  }, []);

  async function initPrayerTimes() {
    // 1. Try user's saved location from profile settings
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('location')
          .eq('id', user.id)
          .single();

        if (profile?.location && profile.location.trim()) {
          const geo = await geocodeLocation(profile.location.trim());
          if (geo) {
            setLocation(geo.display);
            await fetchPrayerTimesForCoordinates(geo.lat, geo.lon);
            return;
          }
        }
      }
    } catch {
      // Profile fetch failed — fall through to geolocation
    }

    // 2. Fall back to browser geolocation
    requestLocationAndFetchPrayers();
  }

  async function requestLocationAndFetchPrayers() {
    if (!navigator.geolocation) {
      setLocation('London, UK (default)');
      await fetchPrayerTimesForCoordinates(51.5074, -0.1278);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Your location';
          const country = data.address?.country || '';
          setLocation(`${city}${country ? ', ' + country : ''}`);
        } catch {
          setLocation('Your location');
        }

        await fetchPrayerTimesForCoordinates(latitude, longitude);
      },
      (error) => {
        if (error.code !== 1) {
          console.warn('Geolocation unavailable:', error.message);
        }
        setLocation('London, UK (default)');
        fetchPrayerTimesForCoordinates(51.5074, -0.1278);
      }
    );
  }

  async function fetchPrayerTimesForCoordinates(latitude: number, longitude: number) {
    try {
      const now = new Date();
      const day = now.getDate();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=2`
      );
      const data = await response.json();

      if (data.code === 200 && data.data) {
        const timings = data.data.timings;
        const nowMins = getNowMinutes();

        const times: PrayerTime[] = [
          { name: 'Fajr', time: timings.Fajr, timeInMinutes: 0, isPassed: false },
          { name: 'Dhuhr', time: timings.Dhuhr, timeInMinutes: 0, isPassed: false },
          { name: 'Asr', time: timings.Asr, timeInMinutes: 0, isPassed: false },
          { name: 'Maghrib', time: timings.Maghrib, timeInMinutes: 0, isPassed: false },
          { name: 'Isha', time: timings.Isha, timeInMinutes: 0, isPassed: false },
        ].map(p => {
          const mins = parseTimeToMinutes(p.time);
          return {
            ...p,
            time: p.time.split(' ')[0],
            timeInMinutes: mins,
            isPassed: nowMins > mins,
          };
        });

        setPrayerTimes(times);
      }
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      setLocation('London, UK (default)');
      const nowMins = getNowMinutes();

      const fallback: PrayerTime[] = [
        { name: 'Fajr', time: '05:45', timeInMinutes: 345, isPassed: false },
        { name: 'Dhuhr', time: '12:15', timeInMinutes: 735, isPassed: false },
        { name: 'Asr', time: '14:30', timeInMinutes: 870, isPassed: false },
        { name: 'Maghrib', time: '16:45', timeInMinutes: 1005, isPassed: false },
        { name: 'Isha', time: '18:30', timeInMinutes: 1110, isPassed: false },
      ].map(p => ({ ...p, isPassed: nowMins > p.timeInMinutes }));

      setPrayerTimes(fallback);
    } finally {
      setLoading(false);
    }
  }

  const nextPrayer = prayerTimes.find(p => !p.isPassed) || null;

  return { prayerTimes, location, loading, nextPrayer, currentMinutes };
}
