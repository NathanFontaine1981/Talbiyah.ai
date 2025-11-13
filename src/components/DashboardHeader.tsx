import { useEffect, useState } from 'react';
import { Calendar, Zap, ChevronLeft, ChevronRight, Clock } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
  userLevel?: number;
  userPoints?: number;
  userRole?: string;
}

export default function DashboardHeader({ userName, userLevel = 1, userPoints = 75, userRole = 'Student' }: DashboardHeaderProps) {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselType, setCarouselType] = useState<'names' | 'hadiths' | 'ayahs'>('names');

  const ISLAMIC_CONTENT = {
    names: [
      { arabic: 'ٱلرَّحْمَـٰنُ', transliteration: 'Ar-Rahman', meaning: 'The Most Merciful' },
      { arabic: 'ٱلرَّحِيمُ', transliteration: 'Ar-Rahim', meaning: 'The Most Compassionate' },
      { arabic: 'ٱلْمَلِكُ', transliteration: 'Al-Malik', meaning: 'The King' },
      { arabic: 'ٱلْقُدُّوسُ', transliteration: 'Al-Quddus', meaning: 'The Most Holy' },
      { arabic: 'ٱلسَّلَامُ', transliteration: 'As-Salam', meaning: 'The Source of Peace' },
    ],
    hadiths: [
      { text: 'The best among you are those who learn the Quran and teach it.', source: 'Sahih al-Bukhari' },
      { text: 'Whoever treads a path in search of knowledge, Allah will make easy the path to Paradise.', source: 'Sahih Muslim' },
      { text: 'The strong person is not the one who can wrestle someone else down. The strong person is the one who can control himself when he is angry.', source: 'Sahih al-Bukhari' },
    ],
    ayahs: [
      { arabic: 'رَبِّ زِدْنِي عِلْمًا', translation: 'My Lord, increase me in knowledge', reference: 'Surah Ta-Ha 20:114' },
      { arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship comes ease', reference: 'Surah Ash-Sharh 94:6' },
      { arabic: 'وَمَن يَتَّقِ ٱللَّهَ يَجْعَل لَّهُۥ مَخْرَجًا', translation: 'And whoever fears Allah - He will make for him a way out', reference: 'Surah At-Talaq 65:2' },
    ]
  };

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    const carousel = setInterval(() => {
      setCarouselIndex(prev => {
        const content = ISLAMIC_CONTENT[carouselType];
        return (prev + 1) % content.length;
      });
    }, 10000);

    return () => {
      clearInterval(timer);
      clearInterval(carousel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [carouselType]);

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
  const currentContent = ISLAMIC_CONTENT[carouselType][carouselIndex];
  const contentArray = ISLAMIC_CONTENT[carouselType];

  const handleNext = () => setCarouselIndex((prev) => (prev + 1) % contentArray.length);
  const handlePrev = () => setCarouselIndex((prev) => (prev - 1 + contentArray.length) % contentArray.length);

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
      case 'Parent':
        return {
          mainBg: 'bg-gradient-to-br from-purple-700 via-purple-600 to-purple-800',
          cardBg: 'bg-purple-900/30',
          cardBorder: 'border-purple-600/30',
          levelBg: 'bg-purple-900/50',
          levelBorder: 'border-purple-600/30',
          levelIcon: 'text-amber-400',
          textPrimary: 'text-white',
          textSecondary: 'text-white/80',
          iconPrimary: 'text-purple-300',
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
    <div className={`${colors.mainBg} rounded-3xl p-6 shadow-2xl`}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1 flex items-center gap-2">
            {getGreeting()}, {userName} <span className="text-xl">👋</span>
          </h1>
          <div className={`flex items-center gap-3 ${colors.textSecondary} text-xs`}>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{gregorianDate}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5" />
              <span>{islamicDate}</span>
            </div>
          </div>
        </div>

        <div className={`${colors.levelBg} backdrop-blur-sm rounded-xl px-4 py-2 border ${colors.levelBorder}`}>
          <div className="flex items-center gap-2">
            <Zap className={`w-4 h-4 ${colors.levelIcon}`} />
            <div className="text-white/90 text-sm">
              <span className="text-xs">Level {userLevel}</span>
              <span className="mx-1.5">•</span>
              <span className="font-bold">{userPoints} pts</span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr,auto] gap-3">
        <div className={`${colors.cardBg} backdrop-blur-sm rounded-xl px-6 py-4 border ${colors.cardBorder}`}>
          <div className="flex items-center justify-between mb-2">
            <div className="flex space-x-2">
              <button
                onClick={() => { setCarouselType('names'); setCarouselIndex(0); }}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  carouselType === 'names' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                Names
              </button>
              <button
                onClick={() => { setCarouselType('hadiths'); setCarouselIndex(0); }}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  carouselType === 'hadiths' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                Hadith
              </button>
              <button
                onClick={() => { setCarouselType('ayahs'); setCarouselIndex(0); }}
                className={`px-2 py-1 text-xs font-medium rounded transition ${
                  carouselType === 'ayahs' ? 'text-cyan-400' : 'text-slate-300 hover:text-white'
                }`}
              >
                Ayah
              </button>
            </div>

            <div className="flex items-center space-x-1">
              <button onClick={handlePrev} className="p-1 text-slate-400 hover:text-cyan-400 transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={handleNext} className="p-1 text-slate-400 hover:text-cyan-400 transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="min-h-[70px] flex items-center justify-center text-center">
            {carouselType === 'names' && 'arabic' in currentContent && 'transliteration' in currentContent && 'meaning' in currentContent && (
              <div>
                <p className="text-3xl font-arabic text-cyan-400 mb-1">{currentContent.arabic}</p>
                <p className="text-sm text-white font-semibold">{currentContent.transliteration}</p>
                <p className="text-xs text-slate-400">{currentContent.meaning}</p>
              </div>
            )}

            {carouselType === 'hadiths' && 'text' in currentContent && (
              <div className="max-w-3xl">
                <p className="text-sm text-slate-200 italic">"{currentContent.text}"</p>
                <p className="text-xs text-cyan-400 mt-1">{currentContent.source}</p>
              </div>
            )}

            {carouselType === 'ayahs' && 'arabic' in currentContent && 'translation' in currentContent && (
              <div>
                <p className="text-2xl font-arabic text-cyan-400 mb-1">{currentContent.arabic}</p>
                <p className="text-sm text-slate-200">{currentContent.translation}</p>
                <p className="text-xs text-cyan-400 mt-1">{currentContent.reference}</p>
              </div>
            )}
          </div>
        </div>

        <div className={`${colors.cardBg} backdrop-blur-sm rounded-xl px-3 py-2 border ${colors.cardBorder} flex items-center space-x-2`}>
          <Clock className="w-4 h-4 text-cyan-400 flex-shrink-0" />
          <div>
            <p className="text-[10px] text-slate-400 mb-0.5">Time</p>
            <p className="text-sm font-bold text-white">
              {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
