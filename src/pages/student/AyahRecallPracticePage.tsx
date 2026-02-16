import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  Shuffle,
  Keyboard,
  Layers,
  ChevronRight,
  Trophy,
  Target,
  Sparkles,
  Info,
  AlertCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { useSelfLearner } from '../../hooks/useSelfLearner';
import DashboardHeader from '../../components/DashboardHeader';
import AyahFlashcard from '../../components/games/AyahFlashcard';
import AyahMultipleChoice from '../../components/games/AyahMultipleChoice';
import AyahMatching from '../../components/games/AyahMatching';
import AyahTypeRecall from '../../components/games/AyahTypeRecall';
import { getVerses, QuranVerse, getAllSurahs, ChapterInfo } from '../../utils/quranApi';

// Surah name mapping
const SURAH_NAMES: { [key: number]: { name: string; arabicName: string } } = {
  1: { name: 'Al-Fatihah', arabicName: 'الفاتحة' },
  2: { name: 'Al-Baqarah', arabicName: 'البقرة' },
  3: { name: 'Ali-Imran', arabicName: 'آل عمران' },
  18: { name: 'Al-Kahf', arabicName: 'الكهف' },
  36: { name: 'Ya-Sin', arabicName: 'يس' },
  55: { name: 'Ar-Rahman', arabicName: 'الرحمن' },
  56: { name: "Al-Waqi'ah", arabicName: 'الواقعة' },
  67: { name: 'Al-Mulk', arabicName: 'الملك' },
  78: { name: 'An-Naba', arabicName: 'النبأ' },
  79: { name: "An-Nazi'at", arabicName: 'النازعات' },
  80: { name: "'Abasa", arabicName: 'عبس' },
  81: { name: 'At-Takwir', arabicName: 'التكوير' },
  82: { name: 'Al-Infitar', arabicName: 'الإنفطار' },
  83: { name: 'Al-Mutaffifin', arabicName: 'المطففين' },
  84: { name: 'Al-Inshiqaq', arabicName: 'الإنشقاق' },
  85: { name: 'Al-Buruj', arabicName: 'البروج' },
  86: { name: 'At-Tariq', arabicName: 'الطارق' },
  87: { name: "Al-A'la", arabicName: 'الأعلى' },
  88: { name: 'Al-Ghashiyah', arabicName: 'الغاشية' },
  89: { name: 'Al-Fajr', arabicName: 'الفجر' },
  90: { name: 'Al-Balad', arabicName: 'البلد' },
  91: { name: 'Ash-Shams', arabicName: 'الشمس' },
  92: { name: 'Al-Layl', arabicName: 'الليل' },
  93: { name: 'Ad-Duhaa', arabicName: 'الضحى' },
  94: { name: 'Ash-Sharh', arabicName: 'الشرح' },
  95: { name: 'At-Tin', arabicName: 'التين' },
  96: { name: "Al-'Alaq", arabicName: 'العلق' },
  97: { name: 'Al-Qadr', arabicName: 'القدر' },
  98: { name: 'Al-Bayyinah', arabicName: 'البينة' },
  99: { name: 'Az-Zalzalah', arabicName: 'الزلزلة' },
  100: { name: "Al-'Adiyat", arabicName: 'العاديات' },
  101: { name: "Al-Qari'ah", arabicName: 'القارعة' },
  102: { name: 'At-Takathur', arabicName: 'التكاثر' },
  103: { name: 'Al-Asr', arabicName: 'العصر' },
  104: { name: 'Al-Humazah', arabicName: 'الهمزة' },
  105: { name: 'Al-Fil', arabicName: 'الفيل' },
  106: { name: 'Quraysh', arabicName: 'قريش' },
  107: { name: "Al-Ma'un", arabicName: 'الماعون' },
  108: { name: 'Al-Kawthar', arabicName: 'الكوثر' },
  109: { name: 'Al-Kafirun', arabicName: 'الكافرون' },
  110: { name: 'An-Nasr', arabicName: 'النصر' },
  111: { name: 'Al-Masad', arabicName: 'المسد' },
  112: { name: 'Al-Ikhlas', arabicName: 'الإخلاص' },
  113: { name: 'Al-Falaq', arabicName: 'الفلق' },
  114: { name: 'An-Nas', arabicName: 'الناس' },
};

type GameType = 'flashcard' | 'multiple_choice' | 'matching' | 'type_recall';

interface GameModeOption {
  type: GameType;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const GAME_MODES: GameModeOption[] = [
  {
    type: 'flashcard',
    title: 'Flashcards',
    description: 'See English, recall Arabic',
    icon: <Layers className="w-6 h-6" />,
    color: 'text-blue-600 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
  },
  {
    type: 'multiple_choice',
    title: 'Multiple Choice',
    description: 'Pick the correct Arabic ayah',
    icon: <Target className="w-6 h-6" />,
    color: 'text-purple-600 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/30',
  },
  {
    type: 'matching',
    title: 'Matching',
    description: 'Match English to Arabic pairs',
    icon: <Shuffle className="w-6 h-6" />,
    color: 'text-emerald-600 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/30',
  },
  {
    type: 'type_recall',
    title: 'Type Recall',
    description: 'Type the first words of the ayah',
    icon: <Keyboard className="w-6 h-6" />,
    color: 'text-orange-600 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/30',
  },
];

interface AyahData {
  surahNumber: number;
  ayahNumber: number;
  verseKey: string;
  arabicText: string;
  englishTranslation: string;
}

interface SessionResult {
  correct: number;
  total: number;
  accuracy: number;
}

interface AyahResult {
  ayahNumber: number;
  correct: boolean;
}

export default function AyahRecallPracticePage() {
  const navigate = useNavigate();
  const { learnerId, loading: learnerLoading } = useSelfLearner();

  // State
  const [loading, setLoading] = useState(true);
  const [loadingAyahs, setLoadingAyahs] = useState(false);
  const [memorizedSurahs, setMemorizedSurahs] = useState<number[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [selectedGameMode, setSelectedGameMode] = useState<GameType | null>(null);
  const [ayahs, setAyahs] = useState<AyahData[]>([]);
  const [allSurahInfo, setAllSurahInfo] = useState<ChapterInfo[]>([]);
  const [sessionResult, setSessionResult] = useState<SessionResult | null>(null);
  const [gameStarted, setGameStarted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load memorized surahs when learner is resolved
  useEffect(() => {
    if (learnerLoading) return;
    if (learnerId) {
      loadMemorizedSurahs(learnerId);
    } else {
      setLoading(false);
    }
  }, [learnerId, learnerLoading]);

  async function loadMemorizedSurahs(targetLearnerId: string) {
    try {
      setLoading(true);
      setError(null);

      // Load memorized surahs
      const { data: tracked, error: trackError } = await supabase
        .from('surah_retention_tracker')
        .select('surah_number')
        .eq('learner_id', targetLearnerId)
        .eq('memorization_status', 'memorized');

      if (trackError) throw trackError;

      const surahNumbers = (tracked || []).map(t => t.surah_number).sort((a, b) => a - b);
      setMemorizedSurahs(surahNumbers);

      // Also fetch all surah info from API for complete names
      const surahs = await getAllSurahs();
      setAllSurahInfo(surahs);

    } catch (err) {
      console.error('Error loading memorized surahs:', err);
      setError('Failed to load your memorized surahs. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  // Get surah name
  function getSurahName(surahNumber: number): string {
    const local = SURAH_NAMES[surahNumber];
    if (local) return local.name;

    const apiInfo = allSurahInfo.find(s => s.id === surahNumber);
    return apiInfo?.name_simple || `Surah ${surahNumber}`;
  }

  function getSurahArabicName(surahNumber: number): string {
    const local = SURAH_NAMES[surahNumber];
    if (local) return local.arabicName;

    const apiInfo = allSurahInfo.find(s => s.id === surahNumber);
    return apiInfo?.name_arabic || '';
  }

  // Load ayahs for selected surah
  const loadAyahs = useCallback(async (surahNumber: number) => {
    try {
      setLoadingAyahs(true);
      setError(null);

      // Find verse count for this surah
      const surahInfo = allSurahInfo.find(s => s.id === surahNumber);
      const verseCount = surahInfo?.verses_count || 7; // Default to 7 for Al-Fatihah

      // Fetch verses with translations
      const verses = await getVerses(surahNumber, 1, verseCount, { includeTranslation: true });

      if (!verses || verses.length === 0) {
        setError('Could not load ayahs for this surah. Please try again.');
        return;
      }

      // Transform to AyahData format
      const ayahData: AyahData[] = verses.map((verse: QuranVerse) => ({
        surahNumber,
        ayahNumber: verse.verse_number,
        verseKey: verse.verse_key,
        arabicText: verse.text_uthmani || verse.words?.filter(w => w.char_type_name === 'word').map(w => w.text_uthmani).join(' ') || '',
        englishTranslation: verse.translations?.[0]?.text?.replace(/<[^>]*>/g, '') || '', // Strip HTML tags
      }));

      setAyahs(ayahData);
    } catch (err) {
      console.error('Error loading ayahs:', err);
      setError('Failed to load ayahs. Please check your internet connection.');
    } finally {
      setLoadingAyahs(false);
    }
  }, [allSurahInfo]);

  // Handle surah selection
  function handleSurahSelect(surahNumber: number) {
    setSelectedSurah(surahNumber);
    setSelectedGameMode(null);
    setGameStarted(false);
    setSessionResult(null);
    loadAyahs(surahNumber);
  }

  // Handle game start
  function handleStartGame(gameType: GameType) {
    setSelectedGameMode(gameType);
    setGameStarted(true);
    setSessionResult(null);
  }

  // Handle game completion
  async function handleGameComplete(correct: number, total: number, results: AyahResult[]) {
    const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;
    setSessionResult({ correct, total, accuracy });
    setGameStarted(false);

    // Save progress to database - now per-ayah based on individual results
    if (learnerId && selectedSurah && results.length > 0) {
      try {
        // First, get existing progress for all ayahs
        const { data: existingProgress } = await supabase
          .from('ayah_progress')
          .select('ayah_number, recall_attempts, recall_correct_count, recall_score, recall_streak')
          .eq('learner_id', learnerId)
          .eq('surah_number', selectedSurah);

        const existingMap = new Map(
          (existingProgress || []).map(p => [p.ayah_number, p])
        );

        // Update recall stats for each ayah based on individual results
        for (const result of results) {
          const existing = existingMap.get(result.ayahNumber);
          const currentAttempts = (existing?.recall_attempts || 0) + 1;
          const currentCorrect = (existing?.recall_correct_count || 0) + (result.correct ? 1 : 0);
          const newScore = Math.round((currentCorrect / currentAttempts) * 100);
          const newStreak = result.correct ? (existing?.recall_streak || 0) + 1 : 0;

          await supabase
            .from('ayah_progress')
            .upsert({
              learner_id: learnerId,
              surah_number: selectedSurah,
              ayah_number: result.ayahNumber,
              recall_attempts: currentAttempts,
              recall_correct_count: currentCorrect,
              recall_score: newScore,
              recall_streak: newStreak,
              last_recall_at: new Date().toISOString(),
            }, {
              onConflict: 'learner_id,surah_number,ayah_number',
            });
        }
      } catch (err) {
        console.error('Error saving progress:', err);
      }
    }
  }

  // Handle back navigation
  function handleBack() {
    if (gameStarted) {
      // If in a game, go back to game mode selection
      setGameStarted(false);
      setSessionResult(null);
    } else if (selectedSurah) {
      // If viewing game modes (surah selected), go back to surah selection
      setSelectedSurah(null);
      setSelectedGameMode(null);
      setAyahs([]);
    } else {
      navigate('/dashboard');
    }
  }

  // Render loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <DashboardHeader />
        <main className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center py-20">
            <div className="w-12 h-12 border-4 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
          </div>
        </main>
      </div>
    );
  }

  // Render game component
  function renderGame() {
    if (!selectedGameMode || ayahs.length === 0) return null;

    const commonProps = {
      ayahs,
      surahName: getSurahName(selectedSurah!),
      onComplete: handleGameComplete,
    };

    switch (selectedGameMode) {
      case 'flashcard':
        return <AyahFlashcard {...commonProps} />;
      case 'multiple_choice':
        return <AyahMultipleChoice {...commonProps} />;
      case 'matching':
        return <AyahMatching {...commonProps} />;
      case 'type_recall':
        return <AyahTypeRecall {...commonProps} />;
      default:
        return null;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button
            onClick={handleBack}
            className="p-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Brain className="w-7 h-7 text-emerald-500" />
              Ayah Recall Practice
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Test your recall of memorized ayahs
            </p>
          </div>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-500" />
            <p className="text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* No memorized surahs */}
        {memorizedSurahs.length === 0 && !loading && (
          <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-8 text-center">
            <BookOpen className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              No Memorized Surahs Yet
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              Mark surahs as memorized in "My Memorisation" to practice recall here.
            </p>
            <button
              onClick={() => navigate('/my-memorization')}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 mx-auto"
            >
              <BookOpen className="w-5 h-5" />
              Set Up My Memorisation
            </button>
          </div>
        )}

        {/* Game in progress */}
        {gameStarted && selectedSurah && (
          <div className="space-y-6">
            {/* Current surah indicator */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getSurahName(selectedSurah)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">
                    {getSurahArabicName(selectedSurah)}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {ayahs.length} ayahs
              </span>
            </div>

            {/* Game component */}
            {renderGame()}
          </div>
        )}

        {/* Session results */}
        {sessionResult && !gameStarted && (
          <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 rounded-2xl border-2 border-emerald-200 dark:border-emerald-800 p-8 text-center mb-6">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-emerald-800 dark:text-emerald-200 mb-2">
              Session Complete!
            </h2>
            <p className="text-4xl font-bold text-emerald-600 dark:text-emerald-400 mb-2">
              {sessionResult.accuracy}%
            </p>
            <p className="text-emerald-700 dark:text-emerald-300 mb-6">
              {sessionResult.correct} out of {sessionResult.total} correct
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => handleStartGame(selectedGameMode!)}
                className="px-6 py-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 justify-center"
              >
                <Sparkles className="w-5 h-5" />
                Try Again
              </button>
              <button
                onClick={() => {
                  setSelectedGameMode(null);
                  setSessionResult(null);
                }}
                className="px-6 py-3 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Choose Different Game
              </button>
            </div>
          </div>
        )}

        {/* Surah selection */}
        {!selectedSurah && memorizedSurahs.length > 0 && (
          <div className="space-y-6">
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex items-start gap-3">
              <Info className="w-5 h-5 text-blue-500 mt-0.5" />
              <p className="text-sm text-blue-700 dark:text-blue-300">
                Select a surah you've memorized to practice recalling the Arabic from English translations.
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-500" />
                Your Memorized Surahs ({memorizedSurahs.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {memorizedSurahs.map(surahNum => (
                  <button
                    key={surahNum}
                    onClick={() => handleSurahSelect(surahNum)}
                    className="p-4 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-emerald-400 dark:hover:border-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center text-gray-600 dark:text-gray-300 font-bold">
                        {surahNum}
                      </div>
                      <div className="text-left">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {getSurahName(surahNum)}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">
                          {getSurahArabicName(surahNum)}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-emerald-500 transition" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Game mode selection */}
        {selectedSurah && !gameStarted && !sessionResult && (
          <div className="space-y-6">
            {/* Selected surah */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {getSurahName(selectedSurah)}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-arabic">
                    {getSurahArabicName(selectedSurah)}
                  </p>
                </div>
              </div>
              {loadingAyahs ? (
                <div className="w-5 h-5 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
              ) : (
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {ayahs.length} ayahs loaded
                </span>
              )}
            </div>

            {/* Game modes */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <Target className="w-5 h-5 text-purple-500" />
                Choose Game Mode
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {GAME_MODES.map(mode => (
                  <button
                    key={mode.type}
                    onClick={() => handleStartGame(mode.type)}
                    disabled={loadingAyahs || ayahs.length === 0}
                    className={`p-5 rounded-xl border-2 border-gray-200 dark:border-gray-700 hover:border-${mode.color.split('-')[1]}-400 transition text-left group disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    <div className={`w-12 h-12 ${mode.bgColor} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition`}>
                      <span className={mode.color}>{mode.icon}</span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white mb-1">
                      {mode.title}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {mode.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
