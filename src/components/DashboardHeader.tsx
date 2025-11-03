import { useEffect, useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface DashboardHeaderProps {
  userName: string;
}

export default function DashboardHeader({ userName }: DashboardHeaderProps) {
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
      { text: 'Seeking knowledge is an obligation upon every Muslim.', source: 'Ibn Majah' },
    ],
    ayahs: [
      { arabic: 'رَبِّ زِدْنِي عِلْمًا', translation: 'My Lord, increase me in knowledge', reference: 'Surah Ta-Ha 20:114' },
      { arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship comes ease', reference: 'Surah Ash-Sharh 94:6' },
      { arabic: 'وَقُل رَّبِّ زِدْنِي عِلْمًا', translation: 'And say: My Lord, increase me in knowledge', reference: 'Surah Ta-Ha 20:114' },
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
  }, [carouselType]);

  const getArabicGreeting = () => {
    const hour = currentTime.getHours();
    if (hour >= 0 && hour < 12) {
      return { arabic: 'Sabah al-Khayr', english: 'Good Morning' };
    } else if (hour >= 12 && hour < 18) {
      return { arabic: 'Masaa al-Khayr', english: 'Good Afternoon' };
    } else {
      return { arabic: 'Laylat al-Khayr', english: 'Good Evening' };
    }
  };

  const greeting = getArabicGreeting();
  const gregorianDate = currentTime.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
  const islamicDate = '15 Jumada al-Awwal 1447';

  const currentContent = ISLAMIC_CONTENT[carouselType][carouselIndex];
  const contentArray = ISLAMIC_CONTENT[carouselType];
  const handleNext = () => setCarouselIndex((prev) => (prev + 1) % contentArray.length);
  const handlePrev = () => setCarouselIndex((prev) => (prev - 1 + contentArray.length) % contentArray.length);

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-3">
            <Clock className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div className="text-base">
              <p className="text-white font-semibold font-mono">
                {currentTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700"></div>

          <div className="flex items-center space-x-3">
            <Calendar className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div className="text-base">
              <p className="text-white font-semibold">{gregorianDate}</p>
              <p className="text-slate-400 text-xs">{islamicDate}</p>
            </div>
          </div>

          <div className="h-8 w-px bg-slate-700"></div>

          <div>
            <h2 className="text-2xl font-bold text-white">{greeting.arabic}, {userName}!</h2>
            <p className="text-sm text-slate-400">{greeting.english}</p>
          </div>
        </div>

        <div className="flex-1 lg:max-w-md">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center justify-between mb-3">
              <div className="flex space-x-2">
                <button
                  onClick={() => { setCarouselType('names'); setCarouselIndex(0); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    carouselType === 'names' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Names
                </button>
                <button
                  onClick={() => { setCarouselType('hadiths'); setCarouselIndex(0); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    carouselType === 'hadiths' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Hadith
                </button>
                <button
                  onClick={() => { setCarouselType('ayahs'); setCarouselIndex(0); }}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
                    carouselType === 'ayahs' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-slate-300'
                  }`}
                >
                  Ayah
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button onClick={handlePrev} className="p-1.5 text-slate-400 hover:text-cyan-400 transition hover:bg-slate-700/50 rounded">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleNext} className="p-1.5 text-slate-400 hover:text-cyan-400 transition hover:bg-slate-700/50 rounded">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-[100px] flex items-center justify-center text-center py-2">
              {carouselType === 'names' && 'arabic' in currentContent && (
                <div>
                  <p className="text-2xl font-arabic text-cyan-400 mb-1">{currentContent.arabic}</p>
                  <p className="text-sm text-white font-semibold">{currentContent.transliteration}</p>
                  <p className="text-xs text-slate-400 mt-1">{currentContent.meaning}</p>
                </div>
              )}

              {carouselType === 'hadiths' && 'text' in currentContent && (
                <div className="max-w-md">
                  <p className="text-sm text-slate-200 italic leading-relaxed">"{currentContent.text}"</p>
                  <p className="text-xs text-cyan-400 mt-2">{currentContent.source}</p>
                </div>
              )}

              {carouselType === 'ayahs' && 'arabic' in currentContent && 'translation' in currentContent && (
                <div>
                  <p className="text-xl font-arabic text-cyan-400 mb-1">{currentContent.arabic}</p>
                  <p className="text-sm text-slate-200">{currentContent.translation}</p>
                  <p className="text-xs text-cyan-400 mt-2">{currentContent.reference}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
