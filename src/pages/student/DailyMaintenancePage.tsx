import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  CheckCircle,
  Square,
  CheckSquare,
  Trophy,
  Calendar,
  ChevronRight,
  Headphones,
  Mic,
  Star,
  Target,
  ArrowLeft,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import DashboardHeader from '../../components/DashboardHeader';

interface SurahReview {
  surah: number;
  surahName: string;
  surahNameArabic: string;
  listeningCompleted: boolean;
  recitingCompleted: boolean;
  quality: number;
}

interface DailySession {
  id: string;
  sessionDate: string;
  surahsReviewed: SurahReview[];
  tasksCompleted: number;
  totalTasks: number;
  status: 'in_progress' | 'completed' | 'partial';
  completedAt: string | null;
}

interface LearnerStats {
  currentStreak: number;
  longestStreak: number;
  totalSessions: number;
  lastMaintenanceDate: string | null;
}

// All 114 Surah names
const SURAH_NAMES: { [key: number]: { english: string; arabic: string } } = {
  1: { english: 'Al-Fatihah', arabic: 'الفاتحة' },
  2: { english: 'Al-Baqarah', arabic: 'البقرة' },
  3: { english: "Ali 'Imran", arabic: 'آل عمران' },
  4: { english: 'An-Nisa', arabic: 'النساء' },
  5: { english: "Al-Ma'idah", arabic: 'المائدة' },
  6: { english: "Al-An'am", arabic: 'الأنعام' },
  7: { english: "Al-A'raf", arabic: 'الأعراف' },
  8: { english: 'Al-Anfal', arabic: 'الأنفال' },
  9: { english: 'At-Tawbah', arabic: 'التوبة' },
  10: { english: 'Yunus', arabic: 'يونس' },
  11: { english: 'Hud', arabic: 'هود' },
  12: { english: 'Yusuf', arabic: 'يوسف' },
  13: { english: "Ar-Ra'd", arabic: 'الرعد' },
  14: { english: 'Ibrahim', arabic: 'إبراهيم' },
  15: { english: 'Al-Hijr', arabic: 'الحجر' },
  16: { english: 'An-Nahl', arabic: 'النحل' },
  17: { english: 'Al-Isra', arabic: 'الإسراء' },
  18: { english: 'Al-Kahf', arabic: 'الكهف' },
  19: { english: 'Maryam', arabic: 'مريم' },
  20: { english: 'Ta-Ha', arabic: 'طه' },
  21: { english: 'Al-Anbiya', arabic: 'الأنبياء' },
  22: { english: 'Al-Hajj', arabic: 'الحج' },
  23: { english: "Al-Mu'minun", arabic: 'المؤمنون' },
  24: { english: 'An-Nur', arabic: 'النور' },
  25: { english: 'Al-Furqan', arabic: 'الفرقان' },
  26: { english: "Ash-Shu'ara", arabic: 'الشعراء' },
  27: { english: 'An-Naml', arabic: 'النمل' },
  28: { english: 'Al-Qasas', arabic: 'القصص' },
  29: { english: 'Al-Ankabut', arabic: 'العنكبوت' },
  30: { english: 'Ar-Rum', arabic: 'الروم' },
  31: { english: 'Luqman', arabic: 'لقمان' },
  32: { english: 'As-Sajdah', arabic: 'السجدة' },
  33: { english: 'Al-Ahzab', arabic: 'الأحزاب' },
  34: { english: 'Saba', arabic: 'سبأ' },
  35: { english: 'Fatir', arabic: 'فاطر' },
  36: { english: 'Ya-Sin', arabic: 'يس' },
  37: { english: 'As-Saffat', arabic: 'الصافات' },
  38: { english: 'Sad', arabic: 'ص' },
  39: { english: 'Az-Zumar', arabic: 'الزمر' },
  40: { english: 'Ghafir', arabic: 'غافر' },
  41: { english: 'Fussilat', arabic: 'فصلت' },
  42: { english: 'Ash-Shura', arabic: 'الشورى' },
  43: { english: 'Az-Zukhruf', arabic: 'الزخرف' },
  44: { english: 'Ad-Dukhan', arabic: 'الدخان' },
  45: { english: 'Al-Jathiyah', arabic: 'الجاثية' },
  46: { english: 'Al-Ahqaf', arabic: 'الأحقاف' },
  47: { english: 'Muhammad', arabic: 'محمد' },
  48: { english: 'Al-Fath', arabic: 'الفتح' },
  49: { english: 'Al-Hujurat', arabic: 'الحجرات' },
  50: { english: 'Qaf', arabic: 'ق' },
  51: { english: 'Adh-Dhariyat', arabic: 'الذاريات' },
  52: { english: 'At-Tur', arabic: 'الطور' },
  53: { english: 'An-Najm', arabic: 'النجم' },
  54: { english: 'Al-Qamar', arabic: 'القمر' },
  55: { english: 'Ar-Rahman', arabic: 'الرحمن' },
  56: { english: "Al-Waqi'ah", arabic: 'الواقعة' },
  57: { english: 'Al-Hadid', arabic: 'الحديد' },
  58: { english: 'Al-Mujadila', arabic: 'المجادلة' },
  59: { english: 'Al-Hashr', arabic: 'الحشر' },
  60: { english: 'Al-Mumtahanah', arabic: 'الممتحنة' },
  61: { english: 'As-Saff', arabic: 'الصف' },
  62: { english: "Al-Jumu'ah", arabic: 'الجمعة' },
  63: { english: 'Al-Munafiqun', arabic: 'المنافقون' },
  64: { english: 'At-Taghabun', arabic: 'التغابن' },
  65: { english: 'At-Talaq', arabic: 'الطلاق' },
  66: { english: 'At-Tahrim', arabic: 'التحريم' },
  67: { english: 'Al-Mulk', arabic: 'الملك' },
  68: { english: 'Al-Qalam', arabic: 'القلم' },
  69: { english: 'Al-Haqqah', arabic: 'الحاقة' },
  70: { english: "Al-Ma'arij", arabic: 'المعارج' },
  71: { english: 'Nuh', arabic: 'نوح' },
  72: { english: 'Al-Jinn', arabic: 'الجن' },
  73: { english: 'Al-Muzzammil', arabic: 'المزمل' },
  74: { english: 'Al-Muddaththir', arabic: 'المدثر' },
  75: { english: 'Al-Qiyamah', arabic: 'القيامة' },
  76: { english: 'Al-Insan', arabic: 'الإنسان' },
  77: { english: 'Al-Mursalat', arabic: 'المرسلات' },
  78: { english: "An-Naba'", arabic: 'النبأ' },
  79: { english: "An-Nazi'at", arabic: 'النازعات' },
  80: { english: 'Abasa', arabic: 'عبس' },
  81: { english: 'At-Takwir', arabic: 'التكوير' },
  82: { english: 'Al-Infitar', arabic: 'الانفطار' },
  83: { english: 'Al-Mutaffifin', arabic: 'المطففين' },
  84: { english: 'Al-Inshiqaq', arabic: 'الانشقاق' },
  85: { english: 'Al-Buruj', arabic: 'البروج' },
  86: { english: 'At-Tariq', arabic: 'الطارق' },
  87: { english: "Al-A'la", arabic: 'الأعلى' },
  88: { english: 'Al-Ghashiyah', arabic: 'الغاشية' },
  89: { english: 'Al-Fajr', arabic: 'الفجر' },
  90: { english: 'Al-Balad', arabic: 'البلد' },
  91: { english: 'Ash-Shams', arabic: 'الشمس' },
  92: { english: 'Al-Layl', arabic: 'الليل' },
  93: { english: 'Ad-Duhaa', arabic: 'الضحى' },
  94: { english: 'Ash-Sharh', arabic: 'الشرح' },
  95: { english: 'At-Tin', arabic: 'التين' },
  96: { english: "Al-'Alaq", arabic: 'العلق' },
  97: { english: 'Al-Qadr', arabic: 'القدر' },
  98: { english: 'Al-Bayyinah', arabic: 'البينة' },
  99: { english: 'Az-Zalzalah', arabic: 'الزلزلة' },
  100: { english: "Al-'Adiyat", arabic: 'العاديات' },
  101: { english: "Al-Qari'ah", arabic: 'القارعة' },
  102: { english: 'At-Takathur', arabic: 'التكاثر' },
  103: { english: "Al-'Asr", arabic: 'العصر' },
  104: { english: 'Al-Humazah', arabic: 'الهمزة' },
  105: { english: 'Al-Fil', arabic: 'الفيل' },
  106: { english: 'Quraysh', arabic: 'قريش' },
  107: { english: "Al-Ma'un", arabic: 'الماعون' },
  108: { english: 'Al-Kawthar', arabic: 'الكوثر' },
  109: { english: 'Al-Kafirun', arabic: 'الكافرون' },
  110: { english: 'An-Nasr', arabic: 'النصر' },
  111: { english: 'Al-Masad', arabic: 'المسد' },
  112: { english: 'Al-Ikhlas', arabic: 'الإخلاص' },
  113: { english: 'Al-Falaq', arabic: 'الفلق' },
  114: { english: 'An-Nas', arabic: 'الناس' },
};

export default function DailyMaintenancePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [learnerStats, setLearnerStats] = useState<LearnerStats>({
    currentStreak: 0,
    longestStreak: 0,
    totalSessions: 0,
    lastMaintenanceDate: null
  });
  const [todaySession, setTodaySession] = useState<DailySession | null>(null);

  // Default surahs for daily review (can be customized based on learner's progress)
  const [dailySurahs, setDailySurahs] = useState<number[]>([114, 113, 112, 1]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get learner
      const { data: learner } = await supabase
        .from('learners')
        .select('id, current_streak, longest_streak, total_maintenance_sessions, last_maintenance_date')
        .eq('parent_id', user.id)
        .maybeSingle();

      let targetLearnerId = user.id;

      if (learner) {
        targetLearnerId = learner.id;
        setLearnerId(learner.id);
        setLearnerStats({
          currentStreak: learner.current_streak || 0,
          longestStreak: learner.longest_streak || 0,
          totalSessions: learner.total_maintenance_sessions || 0,
          lastMaintenanceDate: learner.last_maintenance_date
        });
      } else {
        setLearnerId(user.id);
      }

      // Load memorized surahs from surah_retention_tracker if available
      const { data: trackedSurahs } = await supabase
        .from('surah_retention_tracker')
        .select('surah_number')
        .eq('learner_id', targetLearnerId)
        .eq('memorization_status', 'memorized');

      if (trackedSurahs && trackedSurahs.length > 0) {
        // Use memorised surahs for daily review
        const surahNumbers = trackedSurahs.map(s => s.surah_number);
        // Shuffle and pick up to 4 surahs for daily review
        const shuffled = [...surahNumbers].sort(() => Math.random() - 0.5);
        const numToReview = Math.min(4, shuffled.length);
        setDailySurahs(shuffled.slice(0, numToReview));
      }

      // Check for today's session
      const today = new Date().toISOString().split('T')[0];

      const { data: existingSession } = await supabase
        .from('daily_maintenance_sessions')
        .select('*')
        .eq('learner_id', targetLearnerId)
        .eq('session_date', today)
        .maybeSingle();

      if (existingSession) {
        // Refresh surah names in case they were missing in old sessions
        const refreshedSurahs = (existingSession.surahs_reviewed || []).map((s: SurahReview) => ({
          ...s,
          surahName: SURAH_NAMES[s.surah]?.english || s.surahName || `Surah ${s.surah}`,
          surahNameArabic: SURAH_NAMES[s.surah]?.arabic || s.surahNameArabic || ''
        }));

        setTodaySession({
          id: existingSession.id,
          sessionDate: existingSession.session_date,
          surahsReviewed: refreshedSurahs,
          tasksCompleted: existingSession.tasks_completed,
          totalTasks: existingSession.total_tasks,
          status: existingSession.status,
          completedAt: existingSession.completed_at
        });
      } else {
        // Create new session for today
        // Shuffle memorised surahs and pick random ones for variety
        let surahsToUse: number[];
        if (trackedSurahs && trackedSurahs.length > 0) {
          const allMemorised = trackedSurahs.map(s => s.surah_number);
          // Shuffle using Fisher-Yates algorithm
          const shuffled = [...allMemorised];
          for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
          }
          surahsToUse = shuffled.slice(0, Math.min(4, shuffled.length));
        } else {
          surahsToUse = dailySurahs;
        }

        const initialSurahs = surahsToUse.map(surah => ({
          surah,
          surahName: SURAH_NAMES[surah]?.english || `Surah ${surah}`,
          surahNameArabic: SURAH_NAMES[surah]?.arabic || '',
          listeningCompleted: false,
          recitingCompleted: false,
          quality: 0
        }));

        const { data: newSession } = await supabase
          .from('daily_maintenance_sessions')
          .insert({
            learner_id: targetLearnerId,
            session_date: today,
            surahs_reviewed: initialSurahs,
            tasks_completed: 0,
            total_tasks: surahsToUse.length * 2,
            status: 'in_progress'
          })
          .select()
          .single();

        if (newSession) {
          setTodaySession({
            id: newSession.id,
            sessionDate: newSession.session_date,
            surahsReviewed: initialSurahs,
            tasksCompleted: 0,
            totalTasks: surahsToUse.length * 2,
            status: 'in_progress',
            completedAt: null
          });
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleTask(surahNumber: number, taskType: 'listening' | 'reciting') {
    if (!todaySession || !learnerId) return;

    const currentSurah = todaySession.surahsReviewed.find(s => s.surah === surahNumber);
    if (!currentSurah) return;

    const currentValue = taskType === 'listening' ? currentSurah.listeningCompleted : currentSurah.recitingCompleted;
    const newValue = !currentValue;

    const updatedSurahs = todaySession.surahsReviewed.map(s => {
      if (s.surah === surahNumber) {
        return {
          ...s,
          listeningCompleted: taskType === 'listening' ? newValue : s.listeningCompleted,
          recitingCompleted: taskType === 'reciting' ? newValue : s.recitingCompleted
        };
      }
      return s;
    });

    const tasksCompleted = updatedSurahs.reduce((count, s) => {
      return count + (s.listeningCompleted ? 1 : 0) + (s.recitingCompleted ? 1 : 0);
    }, 0);

    const allComplete = tasksCompleted === todaySession.totalTasks;
    const newStatus = allComplete ? 'completed' : 'in_progress';

    const { error } = await supabase
      .from('daily_maintenance_sessions')
      .update({
        surahs_reviewed: updatedSurahs,
        tasks_completed: tasksCompleted,
        status: newStatus,
        completed_at: allComplete ? new Date().toISOString() : null
      })
      .eq('id', todaySession.id);

    if (!error) {
      setTodaySession({
        ...todaySession,
        surahsReviewed: updatedSurahs,
        tasksCompleted,
        status: newStatus,
        completedAt: allComplete ? new Date().toISOString() : null
      });

      // Update surah_retention_tracker last_reviewed_at when task is completed
      if (newValue) {
        await supabase
          .from('surah_retention_tracker')
          .upsert({
            learner_id: learnerId,
            surah_number: surahNumber,
            last_reviewed_at: new Date().toISOString(),
            memorization_status: 'memorized'
          }, {
            onConflict: 'learner_id,surah_number'
          });
      }

      // If all complete, update streak
      if (allComplete && todaySession.status !== 'completed') {
        await supabase
          .from('learners')
          .update({
            current_streak: learnerStats.currentStreak + 1,
            longest_streak: Math.max(learnerStats.longestStreak, learnerStats.currentStreak + 1),
            last_maintenance_date: new Date().toISOString().split('T')[0],
            total_maintenance_sessions: learnerStats.totalSessions + 1
          })
          .eq('id', learnerId);

        setLearnerStats(prev => ({
          ...prev,
          currentStreak: prev.currentStreak + 1,
          longestStreak: Math.max(prev.longestStreak, prev.currentStreak + 1),
          totalSessions: prev.totalSessions + 1
        }));
      }
    }
  }

  async function rateQuality(surahNumber: number, quality: number) {
    if (!todaySession) return;

    const updatedSurahs = todaySession.surahsReviewed.map(s => {
      if (s.surah === surahNumber) {
        return { ...s, quality };
      }
      return s;
    });

    await supabase
      .from('daily_maintenance_sessions')
      .update({ surahs_reviewed: updatedSurahs })
      .eq('id', todaySession.id);

    setTodaySession({
      ...todaySession,
      surahsReviewed: updatedSurahs
    });
  }

  const progressPercent = todaySession
    ? Math.round((todaySession.tasksCompleted / todaySession.totalTasks) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header */}
        <div className="bg-gradient-to-br from-orange-500 via-amber-500 to-yellow-500 rounded-2xl p-6 mb-6 shadow-lg">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center">
              <span className="text-3xl">📖</span>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                Daily Quran Review
              </h1>
              <p className="text-white/80 text-sm">Keep your memorisation strong with daily practice</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="text-4xl font-arabic text-white/90">حَافِظُوا عَلَى الْقُرْآن</span>
          </div>
          <p className="text-white/70 text-xs mt-1">Guard the Quran (through regular review)</p>
        </div>

        {/* Streak and Progress Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                learnerStats.currentStreak > 0 ? 'bg-orange-100 dark:bg-orange-900/30' : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                <Flame className={`w-6 h-6 ${learnerStats.currentStreak > 0 ? 'text-orange-500' : 'text-gray-400'}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{learnerStats.currentStreak}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Day Streak</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 dark:text-gray-400">Today's Progress</p>
              <p className="font-semibold text-gray-900 dark:text-white">
                {todaySession?.tasksCompleted || 0}/{todaySession?.totalTasks || 0} tasks
              </p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{learnerStats.longestStreak}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Best Streak</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{learnerStats.totalSessions}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Total Sessions</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700 text-center">
            <Target className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{todaySession?.surahsReviewed.length || 0}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Surahs Today</p>
          </div>
        </div>

        {/* Completion celebration */}
        {todaySession?.status === 'completed' && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-2 border-yellow-300 dark:border-yellow-600 rounded-2xl p-6 mb-6 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 dark:text-yellow-200 mb-2">Today's Review Complete!</h2>
            <p className="text-yellow-700 dark:text-yellow-300 mb-4">
              Excellent work! You've maintained your {learnerStats.currentStreak}-day streak.
            </p>
            <p className="text-sm text-yellow-600 dark:text-yellow-400">
              Come back tomorrow to keep your streak going!
            </p>
          </div>
        )}

        {/* External app recommendation */}
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <ExternalLink className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">Recommended Apps</h3>
              <p className="text-sm text-blue-700 dark:text-blue-300 mb-2">
                Use these apps for listening and recitation practice:
              </p>
              <div className="flex flex-wrap gap-2">
                <a
                  href="https://tarteel.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-700 transition flex items-center gap-1"
                >
                  🎙️ Tarteel AI
                </a>
                <a
                  href="https://quranic.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-700 transition flex items-center gap-1"
                >
                  📚 Quranic
                </a>
                <a
                  href="https://quran.com/1?wbw=true"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-100 dark:bg-blue-800 text-blue-700 dark:text-blue-200 rounded-full text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-700 transition flex items-center gap-1"
                >
                  📖 Quran by Word
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Surah Task Checklist */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            Today's Tasks
          </h2>

          {todaySession?.surahsReviewed.map((surah) => {
            const isComplete = surah.listeningCompleted && surah.recitingCompleted;

            return (
              <div
                key={surah.surah}
                className={`bg-white dark:bg-gray-800 rounded-xl border-2 transition-all ${
                  isComplete
                    ? 'border-emerald-300 dark:border-emerald-600 bg-emerald-50/50 dark:bg-emerald-900/20'
                    : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                {/* Surah header */}
                <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isComplete ? 'bg-emerald-100 dark:bg-emerald-800' : 'bg-gray-100 dark:bg-gray-700'
                    }`}>
                      {isComplete ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <span className="text-lg font-bold text-gray-600 dark:text-gray-300">{surah.surah}</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">{surah.surahName}</p>
                      <p className="text-lg font-arabic text-gray-600 dark:text-gray-400" dir="rtl">
                        {surah.surahNameArabic}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Task checklist */}
                <div className="p-4 space-y-3">
                  {/* Task A: Listening */}
                  <button
                    onClick={() => toggleTask(surah.surah, 'listening')}
                    className={`w-full p-4 rounded-xl border-2 flex items-start gap-4 transition text-left ${
                      surah.listeningCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {surah.listeningCompleted ? (
                        <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Headphones className="w-4 h-4 text-blue-500" />
                        <p className={`font-medium ${
                          surah.listeningCompleted
                            ? 'text-emerald-800 dark:text-emerald-200'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          Listen to {surah.surahName} x3
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Use one of the recommended apps above.
                      </p>
                    </div>
                  </button>

                  {/* Task B: Reciting */}
                  <button
                    onClick={() => toggleTask(surah.surah, 'reciting')}
                    className={`w-full p-4 rounded-xl border-2 flex items-start gap-4 transition text-left ${
                      surah.recitingCompleted
                        ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-700'
                        : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-600'
                    }`}
                  >
                    <div className="flex-shrink-0 mt-0.5">
                      {surah.recitingCompleted ? (
                        <CheckSquare className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      ) : (
                        <Square className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Mic className="w-4 h-4 text-purple-500" />
                        <p className={`font-medium ${
                          surah.recitingCompleted
                            ? 'text-emerald-800 dark:text-emerald-200'
                            : 'text-gray-900 dark:text-white'
                        }`}>
                          Recite {surah.surahName} from memory
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Use Tarteel for mistake detection or recite on your own.
                      </p>
                    </div>
                  </button>

                  {/* Quality rating (after both complete) */}
                  {isComplete && (
                    <div className="p-4 rounded-xl bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700">
                      <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">How was your recitation?</p>
                      <div className="flex gap-2">
                        {[1, 2, 3, 4, 5].map((rating) => (
                          <button
                            key={rating}
                            onClick={() => rateQuality(surah.surah, rating)}
                            className={`p-2 rounded-lg transition ${
                              surah.quality >= rating
                                ? 'bg-yellow-400 text-yellow-900'
                                : 'bg-white dark:bg-gray-700 border border-yellow-200 dark:border-yellow-600 text-yellow-600 dark:text-yellow-400 hover:bg-yellow-100 dark:hover:bg-yellow-800'
                            }`}
                          >
                            <Star className={`w-5 h-5 ${surah.quality >= rating ? 'fill-current' : ''}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Link to homework */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-700">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-900 dark:text-purple-100 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Want more practice?
              </h3>
              <p className="text-purple-700 dark:text-purple-300 text-sm mt-1">
                Try our Smart Homework to strengthen vocabulary
              </p>
            </div>
            <button
              onClick={() => navigate('/homework')}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition flex items-center gap-2"
            >
              Start Homework
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
