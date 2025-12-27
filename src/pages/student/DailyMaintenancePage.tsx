import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  CheckCircle,
  Circle,
  Play,
  Pause,
  RotateCcw,
  Trophy,
  Calendar,
  ChevronRight,
  Volume2,
  Mic,
  Star,
  Target,
  Clock,
  ArrowLeft,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import DashboardHeader from '../../components/DashboardHeader';

interface SurahReview {
  surah: number;
  surahName: string;
  surahNameArabic: string;
  listeningCompleted: boolean;
  recitingCompleted: boolean;
  quality: number; // 1-5 rating
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

// Surah names for reference
const SURAH_NAMES: { [key: number]: { english: string; arabic: string } } = {
  1: { english: 'Al-Fatihah', arabic: 'الفاتحة' },
  112: { english: 'Al-Ikhlas', arabic: 'الإخلاص' },
  113: { english: 'Al-Falaq', arabic: 'الفلق' },
  114: { english: 'An-Nas', arabic: 'الناس' },
  111: { english: 'Al-Masad', arabic: 'المسد' },
  110: { english: 'An-Nasr', arabic: 'النصر' },
  109: { english: 'Al-Kafirun', arabic: 'الكافرون' },
  108: { english: 'Al-Kawthar', arabic: 'الكوثر' },
  107: { english: 'Al-Ma\'un', arabic: 'الماعون' },
  106: { english: 'Quraysh', arabic: 'قريش' },
  105: { english: 'Al-Fil', arabic: 'الفيل' },
  104: { english: 'Al-Humazah', arabic: 'الهمزة' },
  103: { english: 'Al-Asr', arabic: 'العصر' },
  102: { english: 'At-Takathur', arabic: 'التكاثر' },
  101: { english: 'Al-Qari\'ah', arabic: 'القارعة' },
  100: { english: 'Al-Adiyat', arabic: 'العاديات' },
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
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTask, setCurrentTask] = useState<'listening' | 'reciting' | null>(null);

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

      if (!learner) {
        // Try as direct student
        setLearnerId(user.id);
      } else {
        setLearnerId(learner.id);
        setLearnerStats({
          currentStreak: learner.current_streak || 0,
          longestStreak: learner.longest_streak || 0,
          totalSessions: learner.total_maintenance_sessions || 0,
          lastMaintenanceDate: learner.last_maintenance_date
        });
      }

      // Check for today's session
      const today = new Date().toISOString().split('T')[0];
      const targetLearnerId = learner?.id || user.id;

      const { data: existingSession } = await supabase
        .from('daily_maintenance_sessions')
        .select('*')
        .eq('learner_id', targetLearnerId)
        .eq('session_date', today)
        .maybeSingle();

      if (existingSession) {
        setTodaySession({
          id: existingSession.id,
          sessionDate: existingSession.session_date,
          surahsReviewed: existingSession.surahs_reviewed || [],
          tasksCompleted: existingSession.tasks_completed,
          totalTasks: existingSession.total_tasks,
          status: existingSession.status,
          completedAt: existingSession.completed_at
        });
      } else {
        // Create new session for today
        const initialSurahs = dailySurahs.map(surah => ({
          surah,
          surahName: SURAH_NAMES[surah]?.english || `Surah ${surah}`,
          surahNameArabic: SURAH_NAMES[surah]?.arabic || '',
          listeningCompleted: false,
          recitingCompleted: false,
          quality: 0
        }));

        const { data: newSession, error } = await supabase
          .from('daily_maintenance_sessions')
          .insert({
            learner_id: targetLearnerId,
            session_date: today,
            surahs_reviewed: initialSurahs,
            tasks_completed: 0,
            total_tasks: dailySurahs.length * 2, // 2 tasks per surah (listen + recite)
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
            totalTasks: dailySurahs.length * 2,
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

  async function markTaskComplete(surahNumber: number, taskType: 'listening' | 'reciting') {
    if (!todaySession || !learnerId) return;

    const updatedSurahs = todaySession.surahsReviewed.map(s => {
      if (s.surah === surahNumber) {
        return {
          ...s,
          listeningCompleted: taskType === 'listening' ? true : s.listeningCompleted,
          recitingCompleted: taskType === 'reciting' ? true : s.recitingCompleted
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

      // If all complete, update streak
      if (allComplete) {
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

    setCurrentTask(null);
    setSelectedSurah(null);
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
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
        <DashboardHeader />
        <div className="flex items-center justify-center h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-teal-50">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>

        {/* Header with streak */}
        <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Sparkles className="w-7 h-7" />
                Daily Quran Review
              </h1>
              <p className="text-emerald-100 mt-1">Maintain your memorization with daily practice</p>
            </div>
            <div className="text-right">
              <div className="flex items-center gap-2 text-3xl font-bold">
                <Flame className="w-8 h-8 text-orange-300" />
                {learnerStats.currentStreak}
              </div>
              <p className="text-emerald-100 text-sm">Day Streak</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Today's Progress</span>
              <span>{todaySession?.tasksCompleted || 0}/{todaySession?.totalTasks || 0} tasks</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{learnerStats.longestStreak}</p>
            <p className="text-xs text-gray-500">Best Streak</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <Calendar className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{learnerStats.totalSessions}</p>
            <p className="text-xs text-gray-500">Total Sessions</p>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-200 text-center">
            <Target className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-gray-900">{dailySurahs.length}</p>
            <p className="text-xs text-gray-500">Surahs Today</p>
          </div>
        </div>

        {/* Completion celebration */}
        {todaySession?.status === 'completed' && (
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 border-2 border-yellow-300 rounded-2xl p-6 mb-6 text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-yellow-800 mb-2">Today's Review Complete!</h2>
            <p className="text-yellow-700 mb-4">
              Excellent work! You've maintained your {learnerStats.currentStreak}-day streak.
            </p>
            <p className="text-sm text-yellow-600">
              Come back tomorrow to keep your streak going!
            </p>
          </div>
        )}

        {/* Surah list */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-emerald-600" />
            Today's Surahs
          </h2>

          {todaySession?.surahsReviewed.map((surah) => {
            const isExpanded = selectedSurah === surah.surah;
            const isComplete = surah.listeningCompleted && surah.recitingCompleted;

            return (
              <div
                key={surah.surah}
                className={`bg-white rounded-xl border-2 transition-all ${
                  isComplete
                    ? 'border-emerald-300 bg-emerald-50/50'
                    : isExpanded
                    ? 'border-emerald-500 shadow-lg'
                    : 'border-gray-200'
                }`}
              >
                {/* Surah header */}
                <button
                  onClick={() => setSelectedSurah(isExpanded ? null : surah.surah)}
                  className="w-full p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                      isComplete ? 'bg-emerald-100' : 'bg-gray-100'
                    }`}>
                      {isComplete ? (
                        <CheckCircle className="w-6 h-6 text-emerald-600" />
                      ) : (
                        <span className="text-lg font-bold text-gray-600">{surah.surah}</span>
                      )}
                    </div>
                    <div className="text-left">
                      <p className="font-semibold text-gray-900">{surah.surahName}</p>
                      <p className="text-lg font-arabic text-gray-600" dir="rtl">
                        {surah.surahNameArabic}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Task indicators */}
                    <div className="flex gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        surah.listeningCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Volume2 className="w-4 h-4" />
                      </div>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        surah.recitingCompleted ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-100 text-gray-400'
                      }`}>
                        <Mic className="w-4 h-4" />
                      </div>
                    </div>
                    <ChevronRight className={`w-5 h-5 text-gray-400 transition-transform ${
                      isExpanded ? 'rotate-90' : ''
                    }`} />
                  </div>
                </button>

                {/* Expanded content */}
                {isExpanded && (
                  <div className="px-4 pb-4 space-y-4">
                    <div className="h-px bg-gray-100" />

                    {/* Listening task */}
                    <div className={`p-4 rounded-xl border-2 ${
                      surah.listeningCompleted
                        ? 'bg-emerald-50 border-emerald-200'
                        : currentTask === 'listening'
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Volume2 className={`w-5 h-5 ${
                            surah.listeningCompleted ? 'text-emerald-600' : 'text-gray-600'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">Listen to Recitation</p>
                            <p className="text-sm text-gray-500">Play and follow along</p>
                          </div>
                        </div>
                        {surah.listeningCompleted ? (
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <button
                            onClick={() => {
                              setCurrentTask('listening');
                              // In real app, would play audio here
                              setTimeout(() => markTaskComplete(surah.surah, 'listening'), 1000);
                            }}
                            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                          >
                            <Play className="w-4 h-4" />
                            {currentTask === 'listening' ? 'Playing...' : 'Play'}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Reciting task */}
                    <div className={`p-4 rounded-xl border-2 ${
                      surah.recitingCompleted
                        ? 'bg-emerald-50 border-emerald-200'
                        : currentTask === 'reciting'
                        ? 'bg-blue-50 border-blue-300'
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <Mic className={`w-5 h-5 ${
                            surah.recitingCompleted ? 'text-emerald-600' : 'text-gray-600'
                          }`} />
                          <div>
                            <p className="font-medium text-gray-900">Recite Yourself</p>
                            <p className="text-sm text-gray-500">Practice your recitation</p>
                          </div>
                        </div>
                        {surah.recitingCompleted ? (
                          <CheckCircle className="w-6 h-6 text-emerald-600" />
                        ) : (
                          <button
                            onClick={() => markTaskComplete(surah.surah, 'reciting')}
                            disabled={!surah.listeningCompleted}
                            className={`px-4 py-2 rounded-lg transition flex items-center gap-2 ${
                              surah.listeningCompleted
                                ? 'bg-emerald-600 text-white hover:bg-emerald-700'
                                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                          >
                            <CheckCircle className="w-4 h-4" />
                            Mark Done
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Quality rating (after both complete) */}
                    {isComplete && (
                      <div className="p-4 rounded-xl bg-yellow-50 border border-yellow-200">
                        <p className="text-sm text-yellow-800 mb-2">How was your recitation?</p>
                        <div className="flex gap-2">
                          {[1, 2, 3, 4, 5].map((rating) => (
                            <button
                              key={rating}
                              onClick={() => rateQuality(surah.surah, rating)}
                              className={`p-2 rounded-lg transition ${
                                surah.quality >= rating
                                  ? 'bg-yellow-400 text-yellow-900'
                                  : 'bg-white border border-yellow-200 text-yellow-600 hover:bg-yellow-100'
                              }`}
                            >
                              <Star className={`w-5 h-5 ${surah.quality >= rating ? 'fill-current' : ''}`} />
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Link to homework */}
        <div className="mt-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 rounded-2xl border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-purple-900 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Want more practice?
              </h3>
              <p className="text-purple-700 text-sm mt-1">
                Try our Smart Homework to strengthen weak areas
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
