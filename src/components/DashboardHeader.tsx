import { useEffect, useState } from 'react';
import { Calendar, Zap, BookOpen } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
  userLevel?: number;
  userPoints?: number;
}

interface PrayerTime {
  name: string;
  time: string;
  isPassed: boolean;
}

export default function DashboardHeader({ userName, userLevel = 1, userPoints = 75 }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentVerse, setCurrentVerse] = useState(0);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTime[]>([]);

  const verses = [
    {
      arabic: 'وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا',
      translation: '"And whoever fears Allah - He will make for him a way out"',
      reference: 'At-Talaq 65:2'
    },
    {
      arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا',
      translation: '"Indeed, with hardship comes ease"',
      reference: 'Ash-Sharh 94:6'
    },
    {
      arabic: 'رَبِّ زِدْنِي عِلْمًا',
      translation: '"My Lord, increase me in knowledge"',
      reference: 'Ta-Ha 20:114'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const verseTimer = setInterval(() => {
      setCurrentVerse(prev => (prev + 1) % verses.length);
    }, 15000);

    fetchPrayerTimes();

    return () => {
      clearInterval(timer);
      clearInterval(verseTimer);
    };
  }, []);

  async function fetchPrayerTimes() {
    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    const currentTimeInMinutes = currentHour * 60 + currentMinute;

    const times = [
      { name: 'Fajr', time: '05:45', isPassed: false },
      { name: 'Dhuhr', time: '11:53', isPassed: false },
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

  const getGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 0 && hour < 12) {
      return 'Sabah al-khair';
    } else if (hour >= 12 && hour < 18) {
      return 'Masaa al-khair';
    } else {
      return 'Masaa al-khair';
    }
  };

  const gregorianDate = currentTime.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric'
  });

  const islamicDate = '11 Jumādá al-ūlá, 1447 AH';
  const nextPrayer = prayerTimes.find(p => !p.isPassed) || prayerTimes[0];
  const verse = verses[currentVerse];

  return (
    <div className="bg-gradient-to-br from-teal-800 via-teal-700 to-teal-900 rounded-3xl p-8 shadow-2xl">
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            {getGreeting()}, {userName} <span className="text-2xl">👋</span>
          </h1>
          <div className="flex items-center gap-4 text-white/80 text-sm">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{gregorianDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{islamicDate}</span>
            </div>
          </div>
        </div>

        <div className="bg-teal-900/50 backdrop-blur-sm rounded-2xl px-6 py-3 border border-teal-600/30">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-amber-400" />
            <div className="flex items-center gap-4">
              <div className="text-white/90">
                <span className="text-sm">Level {userLevel}</span>
                <span className="mx-2">•</span>
                <span className="font-bold">{userPoints} pts</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-6">
        <div className="bg-teal-900/30 backdrop-blur-sm rounded-2xl p-6 border border-teal-600/30">
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className="w-5 h-5 text-pink-300" />
            <h3 className="text-white font-semibold">Daily Quran Verse</h3>
          </div>

          <div className="flex items-center gap-3 mb-2">
            {verses.map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full transition-colors ${
                  idx === currentVerse ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center justify-between gap-8">
            <div className="flex-1">
              <p className="text-white/90 text-lg italic mb-2">{verse.translation}</p>
              <p className="text-white/60 text-sm">— {verse.reference}</p>
            </div>
            <div className="text-right">
              <p className="text-white font-arabic text-3xl leading-relaxed">{verse.arabic}</p>
            </div>
          </div>
        </div>

        {nextPrayer && (
          <div className="bg-teal-900/30 backdrop-blur-sm rounded-2xl p-6 border border-teal-600/30 flex flex-col items-center justify-center text-center min-w-[280px]">
            <p className="text-white/70 text-sm mb-2">Next Prayer</p>
            <p className="text-white text-3xl font-bold mb-1">{nextPrayer.name}</p>
            <p className="text-white text-4xl font-bold mb-4">{nextPrayer.time}</p>
            <button className="flex items-center gap-2 px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-medium transition shadow-lg">
              <Zap className="w-4 h-4" />
              Daily Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
