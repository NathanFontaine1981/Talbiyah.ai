import { useEffect, useState } from 'react';
import { Clock, MapPin } from 'lucide-react';

interface PrayerTime {
  name: string;
  time: string;
  isPassed: boolean;
}

interface PrayerTimesWidgetProps {
  userRole?: string;
}

export default function PrayerTimesWidget({ userRole = 'Student' }: PrayerTimesWidgetProps) {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [location, setLocation] = useState('Detecting location...');
  const [, setLocationPermission] = useState<'prompt' | 'granted' | 'denied'>('prompt');

  useEffect(() => {
    requestLocationAndFetchPrayers();
  }, []);

  async function requestLocationAndFetchPrayers() {
    // Check if geolocation is available
    if (!navigator.geolocation) {
      setLocation('London, UK (default)');
      fetchPrayerTimesForCoordinates(51.5074, -0.1278); // London fallback
      return;
    }

    // Request location permission
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationPermission('granted');
        const { latitude, longitude } = position.coords;

        // Get city name from reverse geocoding
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const city = data.address?.city || data.address?.town || data.address?.village || 'Your location';
          const country = data.address?.country || '';
          setLocation(`${city}${country ? ', ' + country : ''}`);
        } catch (error) {
          console.error('Error fetching location name:', error);
          setLocation('Your location');
        }

        // Fetch prayer times for this location
        await fetchPrayerTimesForCoordinates(latitude, longitude);
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLocationPermission('denied');
        setLocation('London, UK (default)');
        fetchPrayerTimesForCoordinates(51.5074, -0.1278); // London fallback
      }
    );
  }

  async function fetchPrayerTimesForCoordinates(latitude: number, longitude: number) {
    try {
      // Get current date
      const now = new Date();
      const day = now.getDate();
      const month = now.getMonth() + 1;
      const year = now.getFullYear();

      // Use Aladhan API with Shafi method (method=2)
      const response = await fetch(
        `https://api.aladhan.com/v1/timings/${day}-${month}-${year}?latitude=${latitude}&longitude=${longitude}&method=2`
      );

      const data = await response.json();

      if (data.code === 200 && data.data) {
        const timings = data.data.timings;
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const currentTimeInMinutes = currentHour * 60 + currentMinute;

        const times = [
          { name: 'Fajr', time: timings.Fajr, isPassed: false },
          { name: 'Dhuhr', time: timings.Dhuhr, isPassed: false },
          { name: 'Asr', time: timings.Asr, isPassed: false },
          { name: 'Maghrib', time: timings.Maghrib, isPassed: false },
          { name: 'Isha', time: timings.Isha, isPassed: false },
        ];

        const updatedTimes = times.map(prayer => {
          // Remove timezone suffix if present (e.g., "05:45 (GMT)" -> "05:45")
          const cleanTime = prayer.time.split(' ')[0];
          const [hours, minutes] = cleanTime.split(':').map(Number);
          const prayerTimeInMinutes = hours * 60 + minutes;
          return {
            ...prayer,
            time: cleanTime,
            isPassed: currentTimeInMinutes > prayerTimeInMinutes
          };
        });

        setPrayerTimes(updatedTimes);
      }
    } catch (error) {
      console.error('Error fetching prayer times:', error);
      // Fallback to default times
      setLocation('London, UK (default)');
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentTimeInMinutes = currentHour * 60 + currentMinute;

      const times = [
        { name: 'Fajr', time: '05:45', isPassed: false },
        { name: 'Dhuhr', time: '12:15', isPassed: false },
        { name: 'Asr', time: '14:30', isPassed: false },
        { name: 'Maghrib', time: '16:45', isPassed: false },
        { name: 'Isha', time: '18:30', isPassed: false },
      ];

      const updatedTimes = times.map(prayer => {
        const [hours, minutes] = prayer.time.split(':').map(Number);
        const prayerTimeInMinutes = hours * 60 + minutes;
        return {
          ...prayer,
          isPassed: currentTimeInMinutes > prayerTimeInMinutes
        };
      });

      setPrayerTimes(updatedTimes);
    }
  }

  const nextPrayer = prayerTimes.find(p => !p.isPassed) || prayerTimes[0];

  const getColorClasses = () => {
    switch (userRole) {
      case 'Student':
        return {
          mainBg: 'bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800',
          border: 'border-emerald-600/30',
          iconColor: 'text-emerald-300',
          nextPrayerBg: 'bg-emerald-900/30',
          nextPrayerBorder: 'border-emerald-600/30',
          nextPrayerAccent: 'text-emerald-400',
        };
      case 'Parent':
        return {
          mainBg: 'bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800',
          border: 'border-purple-600/30',
          iconColor: 'text-purple-300',
          nextPrayerBg: 'bg-purple-900/30',
          nextPrayerBorder: 'border-purple-600/30',
          nextPrayerAccent: 'text-purple-400',
        };
      case 'Teacher':
        return {
          mainBg: 'bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800',
          border: 'border-blue-600/30',
          iconColor: 'text-blue-300',
          nextPrayerBg: 'bg-blue-900/30',
          nextPrayerBorder: 'border-blue-600/30',
          nextPrayerAccent: 'text-blue-400',
        };
      case 'Admin':
        return {
          mainBg: 'bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700',
          border: 'border-amber-600/30',
          iconColor: 'text-amber-300',
          nextPrayerBg: 'bg-amber-900/30',
          nextPrayerBorder: 'border-amber-600/30',
          nextPrayerAccent: 'text-amber-400',
        };
      default:
        return {
          mainBg: 'bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800',
          border: 'border-emerald-600/30',
          iconColor: 'text-emerald-300',
          nextPrayerBg: 'bg-emerald-900/30',
          nextPrayerBorder: 'border-emerald-600/30',
          nextPrayerAccent: 'text-emerald-400',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`${colors.mainBg} rounded-2xl p-6 border ${colors.border} backdrop-blur-sm shadow-xl h-full flex flex-col justify-center`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className={`w-5 h-5 ${colors.iconColor}`} />
          <h3 className="text-lg font-semibold text-white">Prayer Times</h3>
        </div>
        <div className="flex items-center space-x-1 text-xs text-white/70">
          <MapPin className="w-3 h-3" />
          <span>{location}</span>
        </div>
      </div>

      {nextPrayer && (
        <div className={`p-6 ${colors.nextPrayerBg} border ${colors.nextPrayerBorder} rounded-xl`}>
          <p className={`text-xs ${colors.nextPrayerAccent} font-medium mb-2`}>Next Prayer</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-white">{nextPrayer.name}</p>
            <p className={`text-3xl font-bold ${colors.nextPrayerAccent}`}>{nextPrayer.time}</p>
          </div>
        </div>
      )}
    </div>
  );
}
