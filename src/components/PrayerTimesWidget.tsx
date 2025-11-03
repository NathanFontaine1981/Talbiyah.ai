import { useEffect, useState } from 'react';
import { Clock, MapPin } from 'lucide-react';

interface PrayerTime {
  name: string;
  time: string;
  isPassed: boolean;
}

export default function PrayerTimesWidget() {
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);
  const [location, setLocation] = useState('Loading...');
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000);

    fetchPrayerTimes();

    return () => clearInterval(timer);
  }, []);

  async function fetchPrayerTimes() {
    setLocation('London, UK');

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

  const nextPrayer = prayerTimes.find(p => !p.isPassed) || prayerTimes[0];

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl h-full flex flex-col justify-center">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-semibold text-white">Prayer Times</h3>
        </div>
        <div className="flex items-center space-x-1 text-xs text-slate-400">
          <MapPin className="w-3 h-3" />
          <span>{location}</span>
        </div>
      </div>

      {nextPrayer && (
        <div className="p-6 bg-cyan-500/10 border border-cyan-500/30 rounded-xl">
          <p className="text-xs text-cyan-400 font-medium mb-2">Next Prayer</p>
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-white">{nextPrayer.name}</p>
            <p className="text-3xl font-bold text-cyan-400">{nextPrayer.time}</p>
          </div>
        </div>
      )}
    </div>
  );
}
