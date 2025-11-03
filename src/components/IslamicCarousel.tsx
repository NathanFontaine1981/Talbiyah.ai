import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const NAMES_OF_ALLAH = [
  { arabic: 'ٱلرَّحْمَـٰنُ', transliteration: 'Ar-Rahman', meaning: 'The Most Merciful' },
  { arabic: 'ٱلرَّحِيمُ', transliteration: 'Ar-Rahim', meaning: 'The Most Compassionate' },
  { arabic: 'ٱلْمَلِكُ', transliteration: 'Al-Malik', meaning: 'The King' },
  { arabic: 'ٱلْقُدُّوسُ', transliteration: 'Al-Quddus', meaning: 'The Most Holy' },
  { arabic: 'ٱلسَّلَامُ', transliteration: 'As-Salam', meaning: 'The Source of Peace' },
];

const HADITHS = [
  {
    text: 'The best among you are those who learn the Quran and teach it.',
    source: 'Sahih al-Bukhari 5027'
  },
  {
    text: 'Whoever treads a path in search of knowledge, Allah will make easy for him the path to Paradise.',
    source: 'Sahih Muslim 2699'
  },
  {
    text: 'The seeking of knowledge is obligatory for every Muslim.',
    source: 'Sunan Ibn Majah 224'
  },
];

const AYAHS = [
  {
    arabic: 'رَبِّ زِدْنِي عِلْمًا',
    transliteration: 'Rabbi zidni ilma',
    translation: 'My Lord, increase me in knowledge',
    reference: 'Surah Ta-Ha 20:114'
  },
  {
    arabic: 'إِنَّ مَعَ ٱلْعُسْرِ يُسْرًا',
    transliteration: 'Inna ma\'al usri yusra',
    translation: 'Indeed, with hardship comes ease',
    reference: 'Surah Ash-Sharh 94:6'
  },
];

type CarouselType = 'names' | 'hadith' | 'ayah';

export default function IslamicCarousel() {
  const [carouselType, setCarouselType] = useState<CarouselType>('names');
  const [currentIndex, setCurrentIndex] = useState(0);

  const content = carouselType === 'names' ? NAMES_OF_ALLAH : carouselType === 'hadith' ? HADITHS : AYAHS;

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % content.length);
    }, 8000);

    return () => clearInterval(timer);
  }, [content.length]);

  const handlePrevious = () => {
    setCurrentIndex((prev) => (prev - 1 + content.length) % content.length);
  };

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % content.length);
  };

  const current = content[currentIndex];

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <div className="flex items-center justify-between mb-4">
        <div className="flex space-x-2">
          <button
            onClick={() => {
              setCarouselType('names');
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              carouselType === 'names'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-300 border border-transparent'
            }`}
          >
            Names of Allah
          </button>
          <button
            onClick={() => {
              setCarouselType('hadith');
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              carouselType === 'hadith'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-300 border border-transparent'
            }`}
          >
            Hadith
          </button>
          <button
            onClick={() => {
              setCarouselType('ayah');
              setCurrentIndex(0);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg transition ${
              carouselType === 'ayah'
                ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-300 border border-transparent'
            }`}
          >
            Ayah
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handlePrevious}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={handleNext}
            className="p-1.5 text-slate-400 hover:text-cyan-400 hover:bg-slate-700/50 rounded-lg transition"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="min-h-[120px] flex items-center justify-center">
        {carouselType === 'names' && 'arabic' in current && (
          <div className="text-center space-y-2">
            <p className="text-4xl font-arabic text-cyan-400 mb-3">{current.arabic}</p>
            <p className="text-lg font-semibold text-white">{current.transliteration}</p>
            <p className="text-sm text-slate-400">{current.meaning}</p>
          </div>
        )}

        {carouselType === 'hadith' && 'text' in current && (
          <div className="text-center space-y-3">
            <p className="text-base text-slate-200 italic leading-relaxed max-w-2xl">
              "{current.text}"
            </p>
            <p className="text-xs text-cyan-400 font-medium">{current.source}</p>
          </div>
        )}

        {carouselType === 'ayah' && 'arabic' in current && 'translation' in current && (
          <div className="text-center space-y-3">
            <p className="text-3xl font-arabic text-cyan-400 mb-3">{current.arabic}</p>
            <p className="text-sm text-slate-300 italic">{current.transliteration}</p>
            <p className="text-base text-slate-200 leading-relaxed">{current.translation}</p>
            <p className="text-xs text-cyan-400 font-medium">{current.reference}</p>
          </div>
        )}
      </div>

      <div className="flex justify-center space-x-2 mt-4">
        {content.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrentIndex(index)}
            className={`w-1.5 h-1.5 rounded-full transition ${
              index === currentIndex ? 'bg-cyan-400 w-6' : 'bg-slate-600'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
