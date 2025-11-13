import { useEffect, useState } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const ISLAMIC_CONTENT = {
  names: [
    { arabic: 'ٱلرَّحْمَـٰنُ', transliteration: 'Ar-Rahman', meaning: 'The Most Merciful' },
    { arabic: 'ٱلرَّحِيمُ', transliteration: 'Ar-Rahim', meaning: 'The Most Compassionate' },
    { arabic: 'ٱلْمَلِكُ', transliteration: 'Al-Malik', meaning: 'The King' },
  ],
  hadiths: [
    { text: 'The best among you are those who learn the Quran and teach it.', source: 'Sahih al-Bukhari' },
    { text: 'Whoever treads a path in search of knowledge, Allah will make easy the path to Paradise.', source: 'Sahih Muslim' },
  ],
  ayahs: [
    { arabic: 'رَبِّ زِدْنِي عِلْمًا', translation: 'My Lord, increase me in knowledge', reference: 'Surah Ta-Ha 20:114' },
    { arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا', translation: 'Indeed, with hardship comes ease', reference: 'Surah Ash-Sharh 94:6' },
  ]
};

export default function DashboardHeaderWidget() {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [carouselType, setCarouselType] = useState<'names' | 'hadiths' | 'ayahs'>('names');

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
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

  const nextPrayer = { name: 'Dhuhr', time: '12:15' };
  const currentContent = ISLAMIC_CONTENT[carouselType][carouselIndex];
  const contentArray = ISLAMIC_CONTENT[carouselType];

  const handleNext = () => setCarouselIndex((prev) => (prev + 1) % contentArray.length);
  const handlePrev = () => setCarouselIndex((prev) => (prev - 1 + contentArray.length) % contentArray.length);

  const islamicDate = '15 Jumada al-Awwal 1447';
  const gregorianDate = currentTime.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="bg-gradient-to-r from-slate-800/90 via-slate-900/90 to-slate-800/90 border-b border-slate-700/50 backdrop-blur-sm">
      <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
          <div className="lg:col-span-3 flex items-center space-x-4">
            <div className="flex-1 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-cyan-400 font-medium mb-1">Next Prayer</p>
                  <p className="text-lg font-bold text-white">{nextPrayer.name}</p>
                </div>
                <div className="text-right">
                  <Clock className="w-4 h-4 text-slate-400 mb-1 ml-auto" />
                  <p className="text-xl font-bold text-cyan-400">{nextPrayer.time}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 bg-slate-800/50 rounded-xl px-6 py-3 border border-slate-700/50">
            <div className="flex items-center justify-between mb-2">
              <div className="flex space-x-2">
                <button
                  onClick={() => { setCarouselType('names'); setCarouselIndex(0); }}
                  className={`px-2 py-1 text-xs font-medium rounded transition ${
                    carouselType === 'names' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Names
                </button>
                <button
                  onClick={() => { setCarouselType('hadiths'); setCarouselIndex(0); }}
                  className={`px-2 py-1 text-xs font-medium rounded transition ${
                    carouselType === 'hadiths' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Hadith
                </button>
                <button
                  onClick={() => { setCarouselType('ayahs'); setCarouselIndex(0); }}
                  className={`px-2 py-1 text-xs font-medium rounded transition ${
                    carouselType === 'ayahs' ? 'text-cyan-400' : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Ayah
                </button>
              </div>

              <div className="flex items-center space-x-2">
                <button onClick={handlePrev} className="p-1 text-slate-400 hover:text-cyan-400 transition">
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button onClick={handleNext} className="p-1 text-slate-400 hover:text-cyan-400 transition">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="min-h-[60px] flex items-center justify-center text-center">
              {carouselType === 'names' && 'arabic' in currentContent && 'transliteration' in currentContent && 'meaning' in currentContent && (
                <div>
                  <p className="text-2xl font-arabic text-cyan-400 mb-1">{currentContent.arabic}</p>
                  <p className="text-sm text-white font-semibold">{currentContent.transliteration}</p>
                  <p className="text-xs text-slate-400">{currentContent.meaning}</p>
                </div>
              )}

              {carouselType === 'hadiths' && 'text' in currentContent && (
                <div className="max-w-2xl">
                  <p className="text-sm text-slate-200 italic">"{currentContent.text}"</p>
                  <p className="text-xs text-cyan-400 mt-1">{currentContent.source}</p>
                </div>
              )}

              {carouselType === 'ayahs' && 'arabic' in currentContent && 'translation' in currentContent && (
                <div>
                  <p className="text-xl font-arabic text-cyan-400 mb-1">{currentContent.arabic}</p>
                  <p className="text-sm text-slate-200">{currentContent.translation}</p>
                  <p className="text-xs text-cyan-400 mt-1">{currentContent.reference}</p>
                </div>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 bg-slate-800/50 rounded-xl px-4 py-3 border border-slate-700/50">
            <div className="flex items-center space-x-3">
              <Calendar className="w-5 h-5 text-cyan-400 flex-shrink-0" />
              <div className="text-sm">
                <p className="text-white font-semibold">{gregorianDate}</p>
                <p className="text-slate-400 text-xs">{islamicDate}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
