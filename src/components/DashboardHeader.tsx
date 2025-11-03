import { useEffect, useState } from 'react';
import { Calendar, Zap, BookOpen } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
  userLevel?: number;
  userPoints?: number;
  userRole?: string;
}

interface PrayerTime {
  name: string;
  time: string;
  isPassed: boolean;
}

export default function DashboardHeader({ userName, userLevel = 1, userPoints = 75, userRole = 'Student' }: DashboardHeaderProps) {
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
  const verse = verses[currentVerse];

  const getColorClasses = () => {
    switch (userRole) {
      case 'Student':
        return {
          mainBg: 'bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800',
          cardBg: 'bg-emerald-900/30',
          cardBorder: 'border-emerald-600/30',
          levelBg: 'bg-emerald-900/50',
          levelBorder: 'border-emerald-600/30',
          levelIcon: 'text-amber-400',
          textPrimary: 'text-white',
          textSecondary: 'text-white/80',
          iconPrimary: 'text-pink-300',
        };
      case 'Teacher':
        return {
          mainBg: 'bg-gradient-to-br from-blue-700 via-blue-600 to-blue-800',
          cardBg: 'bg-blue-900/30',
          cardBorder: 'border-blue-600/30',
          levelBg: 'bg-blue-900/50',
          levelBorder: 'border-blue-600/30',
          levelIcon: 'text-amber-400',
          textPrimary: 'text-white',
          textSecondary: 'text-white/80',
          iconPrimary: 'text-cyan-300',
        };
      case 'Admin':
        return {
          mainBg: 'bg-gradient-to-br from-amber-600 via-amber-500 to-amber-700',
          cardBg: 'bg-amber-900/30',
          cardBorder: 'border-amber-600/30',
          levelBg: 'bg-amber-900/50',
          levelBorder: 'border-amber-600/30',
          levelIcon: 'text-amber-300',
          textPrimary: 'text-white',
          textSecondary: 'text-white/80',
          iconPrimary: 'text-amber-200',
        };
      default:
        return {
          mainBg: 'bg-gradient-to-br from-emerald-700 via-emerald-600 to-emerald-800',
          cardBg: 'bg-emerald-900/30',
          cardBorder: 'border-emerald-600/30',
          levelBg: 'bg-emerald-900/50',
          levelBorder: 'border-emerald-600/30',
          levelIcon: 'text-amber-400',
          textPrimary: 'text-white',
          textSecondary: 'text-white/80',
          iconPrimary: 'text-pink-300',
        };
    }
  };

  const colors = getColorClasses();

  return (
    <div className={`${colors.mainBg} rounded-3xl p-8 shadow-2xl`}>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2 flex items-center gap-2">
            {getGreeting()}, {userName} <span className="text-2xl">👋</span>
          </h1>
          <div className={`flex items-center gap-4 ${colors.textSecondary} text-sm`}>
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

        <div className={`${colors.levelBg} backdrop-blur-sm rounded-2xl px-6 py-3 border ${colors.levelBorder}`}>
          <div className="flex items-center gap-3">
            <Zap className={`w-5 h-5 ${colors.levelIcon}`} />
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

      <div className="grid grid-cols-1 gap-6">
        <div className={`${colors.cardBg} backdrop-blur-sm rounded-2xl p-6 border ${colors.cardBorder}`}>
          <div className="flex items-center gap-3 mb-4">
            <BookOpen className={`w-5 h-5 ${colors.iconPrimary}`} />
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
      </div>
    </div>
  );
}
