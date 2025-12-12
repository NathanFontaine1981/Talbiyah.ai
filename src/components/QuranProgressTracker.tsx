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
      const { data, error } = await supabase
        .from('lesson_progress_tracker')
        .select('*')
        .eq('learner_id', learnerId)
        .like('topic', 'Surah%');

      if (error) throw error;

      const surahProgress = SURAHS.map((surahName, index) => {
        const progressRecord = data?.find(p => p.topic.includes(surahName));
        return {
          surahNumber: index + 1,
          surahName,
          understanding: progressRecord?.understanding_complete || false,
          fluency: progressRecord?.fluency_complete || false,
          memorization: progressRecord?.memorization_complete || false,
          teacherNotes: progressRecord?.teacher_notes
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
  const completedSurahs = progress.filter(
    s => s.understanding && s.fluency && s.memorization
  ).length;
  const percentageComplete = Math.round((completedSurahs / totalSurahs) * 100);

  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (percentageComplete / 100) * circumference;

  const displayedSurahs = showAll ? progress : progress.slice(0, 10);

  if (loading) {
    return (
      <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
        <div className="animate-pulse flex flex-col items-center justify-center py-12">
          <div className="w-32 h-32 bg-slate-700 rounded-full mb-4"></div>
          <div className="h-4 bg-slate-700 rounded w-32"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-6 border border-slate-700/50 backdrop-blur-sm shadow-xl">
      <h3 className="text-lg font-semibold text-white mb-6 flex items-center space-x-2">
        <Book className="w-5 h-5 text-cyan-400" />
        <span>Qur'an Progress Tracker</span>
      </h3>

      <div className="flex flex-col items-center mb-8">
        <div className="relative w-64 h-64 mb-4">
          <svg className="transform -rotate-90 w-64 h-64">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              className="text-slate-700"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="currentColor"
              strokeWidth="12"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="text-cyan-400 transition-all duration-1000 ease-out"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <p className="text-5xl font-bold text-cyan-400">{percentageComplete}%</p>
            <p className="text-sm text-slate-400 mt-2">Qur'an Mastered</p>
          </div>
        </div>

        <div className="flex items-center justify-center space-x-6 text-sm">
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{completedSurahs}</p>
            <p className="text-slate-400">Surahs Complete</p>
          </div>
          <div className="w-px h-12 bg-slate-700"></div>
          <div className="text-center">
            <p className="text-2xl font-bold text-white">{totalSurahs - completedSurahs}</p>
            <p className="text-slate-400">Remaining</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-medium text-slate-500 uppercase">Surah Name</span>
          <div className="flex items-center space-x-4">
            <span className="text-xs font-medium text-slate-500 uppercase w-20 text-center">
              Understanding
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase w-20 text-center">
              Fluency
            </span>
            <span className="text-xs font-medium text-slate-500 uppercase w-20 text-center">
              Memorisation
            </span>
          </div>
        </div>

        {displayedSurahs.map((surah) => (
          <div key={surah.surahNumber} className="bg-slate-800/50 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-3">
              <button
                onClick={() => setExpandedSurah(expandedSurah === surah.surahNumber ? null : surah.surahNumber)}
                className="flex-1 text-left"
              >
                <span className="text-sm font-medium text-slate-200">
                  {surah.surahNumber}. {surah.surahName}
                </span>
              </button>

              <div className="flex items-center space-x-4">
                <div className="w-20 flex justify-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    surah.understanding
                      ? 'bg-cyan-500/20 border-cyan-500'
                      : 'border-slate-600'
                  }`}>
                    {surah.understanding && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                </div>

                <div className="w-20 flex justify-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    surah.fluency
                      ? 'bg-cyan-500/20 border-cyan-500'
                      : 'border-slate-600'
                  }`}>
                    {surah.fluency && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                </div>

                <div className="w-20 flex justify-center">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                    surah.memorization
                      ? 'bg-cyan-500/20 border-cyan-500'
                      : 'border-slate-600'
                  }`}>
                    {surah.memorization && <Check className="w-4 h-4 text-cyan-400" />}
                  </div>
                </div>

                {surah.teacherNotes && (
                  <button
                    onClick={() => setExpandedSurah(expandedSurah === surah.surahNumber ? null : surah.surahNumber)}
                    className="p-1 text-slate-400 hover:text-cyan-400 transition"
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
                <div className="bg-slate-900/50 rounded-lg p-3 border border-slate-700/50">
                  <p className="text-xs font-medium text-cyan-400 mb-1">Teacher's Notes:</p>
                  <p className="text-sm text-slate-300">{surah.teacherNotes}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {progress.length > 10 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="w-full mt-4 px-4 py-2 bg-slate-800/80 hover:bg-slate-700/80 text-cyan-400 rounded-lg transition flex items-center justify-center space-x-2"
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
