import { useState, useEffect } from 'react';
import { ChevronDown, ChevronUp, Book, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface SurahProgress {
  surahNumber: number;
  surahName: string;
  understanding: boolean;
  fluency: boolean;
  memorization: boolean;
  teacherNotes?: string;
}

const SURAHS = [
  'Al-Fatihah', 'Al-Baqarah', 'Ali \'Imran', 'An-Nisa', 'Al-Ma\'idah', 'Al-An\'am',
  'Al-A\'raf', 'Al-Anfal', 'At-Tawbah', 'Yunus', 'Hud', 'Yusuf', 'Ar-Ra\'d',
  'Ibrahim', 'Al-Hijr', 'An-Nahl', 'Al-Isra', 'Al-Kahf', 'Maryam', 'Ta-Ha',
  'Al-Anbiya', 'Al-Hajj', 'Al-Mu\'minun', 'An-Nur', 'Al-Furqan', 'Ash-Shu\'ara',
  'An-Naml', 'Al-Qasas', 'Al-\'Ankabut', 'Ar-Rum', 'Luqman', 'As-Sajdah',
  'Al-Ahzab', 'Saba', 'Fatir', 'Ya-Sin', 'As-Saffat', 'Sad', 'Az-Zumar',
  'Ghafir', 'Fussilat', 'Ash-Shuraa', 'Az-Zukhruf', 'Ad-Dukhan', 'Al-Jathiyah',
  'Al-Ahqaf', 'Muhammad', 'Al-Fath', 'Al-Hujurat', 'Qaf', 'Adh-Dhariyat',
  'At-Tur', 'An-Najm', 'Al-Qamar', 'Ar-Rahman', 'Al-Waqi\'ah', 'Al-Hadid',
  'Al-Mujadila', 'Al-Hashr', 'Al-Mumtahanah', 'As-Saff', 'Al-Jumu\'ah',
  'Al-Munafiqun', 'At-Taghabun', 'At-Talaq', 'At-Tahrim', 'Al-Mulk', 'Al-Qalam',
  'Al-Haqqah', 'Al-Ma\'arij', 'Nuh', 'Al-Jinn', 'Al-Muzzammil', 'Al-Muddaththir',
  'Al-Qiyamah', 'Al-Insan', 'Al-Mursalat', 'An-Naba', 'An-Nazi\'at', '\'Abasa',
  'At-Takwir', 'Al-Infitar', 'Al-Mutaffifin', 'Al-Inshiqaq', 'Al-Buruj',
  'At-Tariq', 'Al-A\'la', 'Al-Ghashiyah', 'Al-Fajr', 'Al-Balad', 'Ash-Shams',
  'Al-Layl', 'Ad-Duhaa', 'Ash-Sharh', 'At-Tin', 'Al-\'Alaq', 'Al-Qadr',
  'Al-Bayyinah', 'Az-Zalzalah', 'Al-\'Adiyat', 'Al-Qari\'ah', 'At-Takathur',
  'Al-\'Asr', 'Al-Humazah', 'Al-Fil', 'Quraysh', 'Al-Ma\'un', 'Al-Kawthar',
  'Al-Kafirun', 'An-Nasr', 'Al-Masad', 'Al-Ikhlas', 'Al-Falaq', 'An-Nas'
];

interface QuranProgressTrackerProps {
  learnerId?: string;
}

export default function QuranProgressTracker({ learnerId }: QuranProgressTrackerProps) {
  const [progress, setProgress] = useState<SurahProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedSurah, setExpandedSurah] = useState<number | null>(null);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    if (learnerId) {
      loadProgress();
    } else {
      initializeProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [learnerId]);

  async function loadProgress() {
    try {
      // Load from BOTH sources and merge them:
      // 1. surah_retention_tracker (My Memorisation page)
      // 2. lesson_progress_tracker (Teacher updates)

      // Source 1: surah_retention_tracker
      let retentionData: { surah_number: number; fluency_complete?: boolean; understanding_complete?: boolean }[] = [];
      try {
        const { data, error } = await supabase
          .from('surah_retention_tracker')
          .select('surah_number, fluency_complete, understanding_complete')
          .eq('learner_id', learnerId)
          .eq('memorization_status', 'memorized');

        if (!error && data) {
          retentionData = data;
        }
      } catch {
        // Table or columns may not exist
      }

      // Source 2: lesson_progress_tracker (where teacher updates go)
      let lessonData: { topic: string; understanding_complete?: boolean; fluency_complete?: boolean; memorization_complete?: boolean; teacher_notes?: string }[] = [];
      try {
        const { data, error } = await supabase
          .from('lesson_progress_tracker')
          .select('topic, understanding_complete, fluency_complete, memorization_complete, teacher_notes')
          .eq('learner_id', learnerId);

        if (!error && data) {
          lessonData = data;
        }
      } catch {
        // Table may not exist
      }

      // Helper to extract surah number from topic like "Surah Al-Fatiha" or "Surah 1"
      const getSurahNumberFromTopic = (topic: string, surahName: string): boolean => {
        const topicLower = topic.toLowerCase();
        const nameLower = surahName.toLowerCase();
        // Match by name (e.g., "Surah Al-Fatiha" contains "al-fatihah")
        if (topicLower.includes(nameLower.replace(/['-]/g, '')) ||
            nameLower.includes(topicLower.replace(/['-]/g, '').replace('surah ', ''))) {
          return true;
        }
        // Also try without "al-" prefix
        const nameWithoutAl = nameLower.replace(/^al-/, '');
        if (topicLower.includes(nameWithoutAl)) {
          return true;
        }
        return false;
      };

      const surahProgress = SURAHS.map((surahName, index) => {
        const surahNumber = index + 1;

        // Check surah_retention_tracker
        const retentionRecord = retentionData.find(p => p.surah_number === surahNumber);

        // Check lesson_progress_tracker (match by surah name in topic)
        const lessonRecord = lessonData.find(p =>
          getSurahNumberFromTopic(p.topic, surahName) ||
          p.topic.includes(`Surah ${surahNumber}`) ||
          p.topic === `Surah ${surahNumber}`
        );

        // Merge both sources - if either says complete, it's complete
        return {
          surahNumber,
          surahName,
          understanding: (retentionRecord?.understanding_complete ?? false) || (lessonRecord?.understanding_complete ?? false),
          fluency: (retentionRecord?.fluency_complete ?? false) || (lessonRecord?.fluency_complete ?? false),
          memorization: (retentionRecord ? true : false) || (lessonRecord?.memorization_complete ?? false),
          teacherNotes: lessonRecord?.teacher_notes
        };
      });

      setProgress(surahProgress);
    } catch (error) {
      console.error('Error loading progress:', error);
      initializeProgress();
    } finally {
      setLoading(false);
    }
  }

  function initializeProgress() {
    const initialProgress = SURAHS.map((surahName, index) => ({
      surahNumber: index + 1,
      surahName,
      understanding: false,
      fluency: false,
      memorization: false
    }));
    setProgress(initialProgress);
    setLoading(false);
  }

  const totalSurahs = 114;
  const memorisedSurahs = progress.filter(s => s.memorization).length;
  const understoodSurahs = progress.filter(s => s.understanding).length;

  // Calculate percentages
  const memorisedPercent = Math.round((memorisedSurahs / totalSurahs) * 100);
  const understoodPercent = Math.round((understoodSurahs / totalSurahs) * 100);

  // For the smaller dual circles
  const smallCircumference = 2 * Math.PI * 70;
  const memorisedOffset = smallCircumference - (memorisedPercent / 100) * smallCircumference;
  const understoodOffset = smallCircumference - (understoodPercent / 100) * smallCircumference;

  const displayedSurahs = showAll ? progress : progress.slice(0, 10);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-200 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse flex flex-col items-center justify-center py-12">
          <div className="w-32 h-32 bg-gray-200 rounded-full mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-200 backdrop-blur-sm shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
        <Book className="w-5 h-5 text-orange-500" />
        <span>Qur'an Progress Tracker</span>
      </h3>

      {/* Two Circular Progress Indicators */}
      <div className="grid grid-cols-2 gap-6 mb-8">
        {/* Understanding Circle */}
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-3">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-gray-700"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={smallCircumference}
                strokeDashoffset={understoodOffset}
                className="text-sky-400 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-sky-400">{understoodPercent}%</p>
              <p className="text-xs text-gray-500 mt-1">Understood</p>
            </div>
          </div>
          <p className="text-sm font-medium text-sky-300">{understoodSurahs}/114 surahs</p>
        </div>

        {/* Memorisation Circle */}
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40 mb-3">
            <svg className="transform -rotate-90 w-40 h-40">
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                className="text-gray-700"
              />
              <circle
                cx="80"
                cy="80"
                r="70"
                stroke="currentColor"
                strokeWidth="10"
                fill="transparent"
                strokeDasharray={smallCircumference}
                strokeDashoffset={memorisedOffset}
                className="text-orange-500 transition-all duration-1000 ease-out"
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <p className="text-3xl font-bold text-orange-500">{memorisedPercent}%</p>
              <p className="text-xs text-gray-500 mt-1">Memorised</p>
            </div>
          </div>
          <p className="text-sm font-medium text-orange-300">{memorisedSurahs}/114 surahs</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-medium text-gray-500 uppercase">Surah Name</span>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-medium text-orange-400 uppercase w-20 text-center">
              Memorised
            </span>
            <span className="text-xs font-medium text-blue-600 uppercase w-20 text-center">
              Fluency
            </span>
            <span className="text-xs font-medium text-sky-400 uppercase w-20 text-center">
              Understanding
            </span>
          </div>
        </div>

        {displayedSurahs.map((surah) => (
          <div key={surah.surahNumber} className="bg-gray-50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3">
              <button
                onClick={() => setExpandedSurah(expandedSurah === surah.surahNumber ? null : surah.surahNumber)}
                className="flex-1 text-left"
              >
                <span className="text-sm font-medium text-gray-700">
                  {surah.surahNumber}. {surah.surahName}
                </span>
              </button>

              <div className="flex items-center space-x-4">
                {/* Memorised - Orange */}
                <div className="w-20 flex justify-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    surah.memorization
                      ? 'bg-orange-500/20 border-orange-500'
                      : 'border-orange-300'
                  }`}>
                    {surah.memorization && <Check className="w-4 h-4 text-orange-500" />}
                  </div>
                </div>

                {/* Fluency - Dark Blue */}
                <div className="w-20 flex justify-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    surah.fluency
                      ? 'bg-blue-600/20 border-blue-600'
                      : 'border-blue-300'
                  }`}>
                    {surah.fluency && <Check className="w-4 h-4 text-blue-600" />}
                  </div>
                </div>

                {/* Understanding - Light Blue */}
                <div className="w-20 flex justify-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    surah.understanding
                      ? 'bg-sky-400/20 border-sky-400'
                      : 'border-sky-300'
                  }`}>
                    {surah.understanding && <Check className="w-4 h-4 text-sky-400" />}
                  </div>
                </div>

                {surah.teacherNotes && (
                  <button
                    onClick={() => setExpandedSurah(expandedSurah === surah.surahNumber ? null : surah.surahNumber)}
                    className="p-1 text-gray-500 hover:text-emerald-600 transition"
                  >
                    {expandedSurah === surah.surahNumber ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            {expandedSurah === surah.surahNumber && surah.teacherNotes && (
              <div className="px-3 pb-3 pt-0">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-medium text-emerald-600 mb-1">Teacher's Notes:</p>
                  <p className="text-sm text-gray-600">{surah.teacherNotes}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {progress.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 px-4 py-2 bg-gray-100/80 hover:bg-gray-200/80 text-orange-500 rounded-lg transition flex items-center justify-center space-x-2"
        >
          <span className="text-sm font-medium">
            {showAll ? 'Show Less' : `Show All ${totalSurahs} Surahs`}
          </span>
          {showAll ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>
      )}
    </div>
  );
}
