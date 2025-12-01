import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronDown, ChevronUp, Book, Check, BookOpen, Award,
  TrendingUp, MessageSquare, User, ChevronRight, Search, Brain, Volume2, Heart
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { SURAHS_DATA, TOTAL_AYAHS, calculateOverallProgress } from '../lib/quranData';
import TalbiyahBot from '../components/TalbiyahBot';

// Juz (Para) mapping - which surahs are in each Juz
const JUZ_RANGES = [
  { juz: 1, name: 'Alif Lam Meem', surahs: [1, 2], startAyah: { 2: 1 }, endAyah: { 2: 141 } },
  { juz: 2, name: 'Sayaqool', surahs: [2], startAyah: { 2: 142 }, endAyah: { 2: 252 } },
  { juz: 3, name: 'Tilkar Rusul', surahs: [2, 3], startAyah: { 2: 253, 3: 1 }, endAyah: { 2: 286, 3: 92 } },
  { juz: 4, name: 'Lan Tana Loo', surahs: [3, 4], startAyah: { 3: 93, 4: 1 }, endAyah: { 3: 200, 4: 23 } },
  { juz: 5, name: 'Wal Mohsanaat', surahs: [4], startAyah: { 4: 24 }, endAyah: { 4: 147 } },
  { juz: 6, name: 'La Yuhibbullah', surahs: [4, 5], startAyah: { 4: 148, 5: 1 }, endAyah: { 4: 176, 5: 81 } },
  { juz: 7, name: 'Wa Iza Samiu', surahs: [5, 6], startAyah: { 5: 82, 6: 1 }, endAyah: { 5: 120, 6: 110 } },
  { juz: 8, name: 'Wa Lau Annana', surahs: [6, 7], startAyah: { 6: 111, 7: 1 }, endAyah: { 6: 165, 7: 87 } },
  { juz: 9, name: 'Qalal Malao', surahs: [7, 8], startAyah: { 7: 88, 8: 1 }, endAyah: { 7: 206, 8: 40 } },
  { juz: 10, name: 'Wa Alamu', surahs: [8, 9], startAyah: { 8: 41, 9: 1 }, endAyah: { 8: 75, 9: 92 } },
  { juz: 11, name: 'Yatazeroon', surahs: [9, 10, 11], startAyah: { 9: 93, 10: 1, 11: 1 }, endAyah: { 9: 129, 10: 109, 11: 5 } },
  { juz: 12, name: 'Wa Mamin Daabbah', surahs: [11, 12], startAyah: { 11: 6, 12: 1 }, endAyah: { 11: 123, 12: 52 } },
  { juz: 13, name: 'Wa Ma Ubarrio', surahs: [12, 13, 14], startAyah: { 12: 53, 13: 1, 14: 1 }, endAyah: { 12: 111, 13: 43, 14: 52 } },
  { juz: 14, name: 'Rubama', surahs: [15, 16], startAyah: { 15: 1, 16: 1 }, endAyah: { 15: 99, 16: 128 } },
  { juz: 15, name: 'Subhanallazi', surahs: [17, 18], startAyah: { 17: 1, 18: 1 }, endAyah: { 17: 111, 18: 74 } },
  { juz: 16, name: 'Qal Alam', surahs: [18, 19, 20], startAyah: { 18: 75, 19: 1, 20: 1 }, endAyah: { 18: 110, 19: 98, 20: 135 } },
  { juz: 17, name: 'Aqtarabo', surahs: [21, 22], startAyah: { 21: 1, 22: 1 }, endAyah: { 21: 112, 22: 78 } },
  { juz: 18, name: 'Qad Aflaha', surahs: [23, 24, 25], startAyah: { 23: 1, 24: 1, 25: 1 }, endAyah: { 23: 118, 24: 64, 25: 20 } },
  { juz: 19, name: 'Wa Qalallazina', surahs: [25, 26, 27], startAyah: { 25: 21, 26: 1, 27: 1 }, endAyah: { 25: 77, 26: 227, 27: 55 } },
  { juz: 20, name: 'Amman Khalaq', surahs: [27, 28, 29], startAyah: { 27: 56, 28: 1, 29: 1 }, endAyah: { 27: 93, 28: 88, 29: 45 } },
  { juz: 21, name: 'Utlu Ma Uhia', surahs: [29, 30, 31, 32, 33], startAyah: { 29: 46, 30: 1, 31: 1, 32: 1, 33: 1 }, endAyah: { 29: 69, 30: 60, 31: 34, 32: 30, 33: 30 } },
  { juz: 22, name: 'Wa Manyaqnut', surahs: [33, 34, 35, 36], startAyah: { 33: 31, 34: 1, 35: 1, 36: 1 }, endAyah: { 33: 73, 34: 54, 35: 45, 36: 27 } },
  { juz: 23, name: 'Wa Mali', surahs: [36, 37, 38, 39], startAyah: { 36: 28, 37: 1, 38: 1, 39: 1 }, endAyah: { 36: 83, 37: 182, 38: 88, 39: 31 } },
  { juz: 24, name: 'Faman Azlamu', surahs: [39, 40, 41], startAyah: { 39: 32, 40: 1, 41: 1 }, endAyah: { 39: 75, 40: 85, 41: 46 } },
  { juz: 25, name: 'Ilaihi Yuraddu', surahs: [41, 42, 43, 44, 45], startAyah: { 41: 47, 42: 1, 43: 1, 44: 1, 45: 1 }, endAyah: { 41: 54, 42: 53, 43: 89, 44: 59, 45: 37 } },
  { juz: 26, name: 'Ha Meem', surahs: [46, 47, 48, 49, 50, 51], startAyah: { 46: 1, 47: 1, 48: 1, 49: 1, 50: 1, 51: 1 }, endAyah: { 46: 35, 47: 38, 48: 29, 49: 18, 50: 45, 51: 30 } },
  { juz: 27, name: 'Qala Fama Khatbukum', surahs: [51, 52, 53, 54, 55, 56, 57], startAyah: { 51: 31, 52: 1, 53: 1, 54: 1, 55: 1, 56: 1, 57: 1 }, endAyah: { 51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29 } },
  { juz: 28, name: 'Qad Samiallah', surahs: [58, 59, 60, 61, 62, 63, 64, 65, 66], startAyah: { 58: 1, 59: 1, 60: 1, 61: 1, 62: 1, 63: 1, 64: 1, 65: 1, 66: 1 }, endAyah: { 58: 22, 59: 24, 60: 13, 61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12 } },
  { juz: 29, name: 'Tabarakallazi', surahs: [67, 68, 69, 70, 71, 72, 73, 74, 75, 76, 77], startAyah: { 67: 1, 68: 1, 69: 1, 70: 1, 71: 1, 72: 1, 73: 1, 74: 1, 75: 1, 76: 1, 77: 1 }, endAyah: { 67: 30, 68: 52, 69: 52, 70: 44, 71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50 } },
  { juz: 30, name: 'Amma', surahs: [78, 79, 80, 81, 82, 83, 84, 85, 86, 87, 88, 89, 90, 91, 92, 93, 94, 95, 96, 97, 98, 99, 100, 101, 102, 103, 104, 105, 106, 107, 108, 109, 110, 111, 112, 113, 114], startAyah: {}, endAyah: {} },
];

interface AyahProgress {
  ayahNumber: number;
  understanding: boolean;
  fluency: boolean;
  memorization: boolean;
  teacherNotes?: string;
}

interface SurahProgress {
  number: number;
  name: string;
  englishName: string;
  theme: string;
  ayahCount: number;
  ayahs: AyahProgress[];
  expanded: boolean;
}

export default function QuranProgress() {
  const navigate = useNavigate();
  const [surahs, setSurahs] = useState<SurahProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [savingAyah, setSavingAyah] = useState<string | null>(null);
  const [teacherNotes, setTeacherNotes] = useState<string | null>(null);
  const [teacherName, setTeacherName] = useState<string | null>(null);
  const [selectedJuz, setSelectedJuz] = useState(30); // Start with Juz Amma (most common starting point)
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadProgress();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadProgress() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Try multiple ways to find the learner
      let learner = null;

      const { data: learnerAsParent } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (learnerAsParent) {
        learner = learnerAsParent;
      }

      if (!learner) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('linked_parent_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.linked_parent_id) {
          const { data: childLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('parent_id', user.id)
            .maybeSingle();

          if (childLearner) {
            learner = childLearner;
          }
        }
      }

      if (!learner) {
        const { data: parentChild } = await supabase
          .from('parent_children')
          .select('id, child_name, child_age, child_gender')
          .eq('account_id', user.id)
          .maybeSingle();

        if (parentChild) {
          const { data: existingLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('parent_id', user.id)
            .maybeSingle();

          if (existingLearner) {
            learner = existingLearner;
          } else {
            const { data: newLearner } = await supabase
              .from('learners')
              .insert({
                parent_id: user.id,
                name: parentChild.child_name,
                age: parentChild.child_age,
                gender: parentChild.child_gender,
                gamification_points: 0
              })
              .select('id')
              .single();

            if (newLearner) {
              learner = newLearner;
            }
          }
        }
      }

      if (!learner) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        const { data: newLearner } = await supabase
          .from('learners')
          .insert({
            parent_id: user.id,
            name: userProfile?.full_name || 'Student',
            gamification_points: 0
          })
          .select('id')
          .single();

        if (newLearner) {
          learner = newLearner;
        }
      }

      let ayahProgressData: any[] = [];

      if (learner) {
        setLearnerId(learner.id);

        const { data: progressData } = await supabase
          .from('ayah_progress')
          .select('*')
          .eq('learner_id', learner.id);

        ayahProgressData = progressData || [];
      }

      const surahsWithProgress: SurahProgress[] = SURAHS_DATA.map(surah => {
        const ayahs: AyahProgress[] = [];

        for (let i = 1; i <= surah.ayahCount; i++) {
          const progressRecord = ayahProgressData?.find(
            p => p.surah_number === surah.number && p.ayah_number === i
          );

          ayahs.push({
            ayahNumber: i,
            understanding: progressRecord?.understanding_complete || false,
            fluency: progressRecord?.fluency_complete || false,
            memorization: progressRecord?.memorization_complete || false,
            teacherNotes: progressRecord?.teacher_notes || ''
          });
        }

        return {
          number: surah.number,
          name: surah.name,
          englishName: surah.englishName,
          theme: surah.theme,
          ayahCount: surah.ayahCount,
          ayahs,
          expanded: false
        };
      });

      setSurahs(surahsWithProgress);

      // Load teacher notes if learner exists
      if (learner) {
        const { data: relationshipData } = await supabase
          .from('student_teacher_relationships')
          .select(`
            teacher_general_notes,
            teacher:teacher_profiles!student_teacher_relationships_teacher_id_fkey (
              user:profiles!teacher_profiles_user_id_fkey (
                full_name
              )
            )
          `)
          .eq('student_id', learner.id)
          .eq('status', 'active')
          .maybeSingle();

        if (relationshipData?.teacher_general_notes) {
          setTeacherNotes(relationshipData.teacher_general_notes);
          setTeacherName((relationshipData.teacher as any)?.user?.full_name || 'Your Teacher');
        }
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleAyahProgress(
    surahNumber: number,
    ayahNumber: number,
    field: 'understanding' | 'fluency' | 'memorization'
  ) {
    if (!learnerId) return;

    const key = `${surahNumber}-${ayahNumber}`;
    setSavingAyah(key);

    try {
      const surah = surahs.find(s => s.number === surahNumber);
      const ayah = surah?.ayahs.find(a => a.ayahNumber === ayahNumber);

      if (!ayah) return;

      const newValue = !ayah[field];

      setSurahs(prev => prev.map(s => {
        if (s.number === surahNumber) {
          return {
            ...s,
            ayahs: s.ayahs.map(a => {
              if (a.ayahNumber === ayahNumber) {
                return { ...a, [field]: newValue };
              }
              return a;
            })
          };
        }
        return s;
      }));

      const { error } = await supabase
        .from('ayah_progress')
        .upsert({
          learner_id: learnerId,
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          understanding_complete: field === 'understanding' ? newValue : ayah.understanding,
          fluency_complete: field === 'fluency' ? newValue : ayah.fluency,
          memorization_complete: field === 'memorization' ? newValue : ayah.memorization,
          teacher_notes: ayah.teacherNotes || null
        }, {
          onConflict: 'learner_id,surah_number,ayah_number'
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error updating ayah progress:', error);
      alert('Failed to save progress. Please try again.');
      await loadProgress();
    } finally {
      setSavingAyah(null);
    }
  }

  function toggleSurahExpansion(surahNumber: number) {
    setSurahs(prev => prev.map(s =>
      s.number === surahNumber ? { ...s, expanded: !s.expanded } : s
    ));
  }

  const getSurahStats = useCallback((surahNumber: number) => {
    const surah = surahs.find(s => s.number === surahNumber);
    if (!surah) return { understanding: 0, fluency: 0, memorization: 0, total: 0 };

    return {
      understanding: surah.ayahs.filter(a => a.understanding).length,
      fluency: surah.ayahs.filter(a => a.fluency).length,
      memorization: surah.ayahs.filter(a => a.memorization).length,
      total: surah.ayahCount,
    };
  }, [surahs]);

  const totalAyahsMemorized = surahs.reduce((sum, surah) =>
    sum + surah.ayahs.filter(a => a.memorization).length, 0
  );

  const totalAyahsUnderstanding = surahs.reduce((sum, surah) =>
    sum + surah.ayahs.filter(a => a.understanding).length, 0
  );

  const totalAyahsFluency = surahs.reduce((sum, surah) =>
    sum + surah.ayahs.filter(a => a.fluency).length, 0
  );

  const completedSurahs = surahs.filter(surah =>
    surah.ayahs.length > 0 &&
    surah.ayahs.every(ayah => ayah.understanding && ayah.fluency && ayah.memorization)
  ).length;

  const overallProgress = calculateOverallProgress(totalAyahsMemorized);

  // Get surahs for current Juz
  const currentJuz = JUZ_RANGES.find(j => j.juz === selectedJuz);
  const surahsInJuz = currentJuz
    ? surahs.filter(s => currentJuz.surahs.includes(s.number))
    : [];

  // Filter surahs by search
  const filteredSurahs = searchQuery
    ? surahs.filter(
        s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.number.toString().includes(searchQuery)
      )
    : surahsInJuz;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading Quran Progress...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-40">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </button>

            <h1 className="text-lg sm:text-xl font-bold text-white flex items-center space-x-2">
              <Book className="w-5 sm:w-6 h-5 sm:h-6 text-cyan-400" />
              <span className="hidden sm:inline">Qur'an Progress Tracker</span>
              <span className="sm:hidden">Quran Progress</span>
            </h1>

            <div className="w-20 sm:w-40"></div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {/* Stats Overview */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl mb-6 sm:mb-8">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-4 sm:mb-6">Overall Progress</h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 lg:gap-6">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 sm:p-6 border border-purple-500/50">
              <div className="flex items-center justify-between mb-2">
                <Book className="w-6 sm:w-8 h-6 sm:h-8 text-purple-400" />
              </div>
              <p className="text-2xl sm:text-4xl font-bold text-purple-400 mb-1">{completedSurahs}</p>
              <p className="text-xs sm:text-sm text-purple-300 font-semibold">of 114 Surahs</p>
              <p className="text-xs text-purple-400/70 mt-1">Fully Completed</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="w-6 sm:w-8 h-6 sm:h-8 text-slate-400" />
              </div>
              <p className="text-2xl sm:text-4xl font-bold text-white mb-1">{TOTAL_AYAHS}</p>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">Total Ayahs</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <Brain className="w-6 sm:w-8 h-6 sm:h-8 text-cyan-400" />
              </div>
              <p className="text-2xl sm:text-4xl font-bold text-cyan-400 mb-1">{totalAyahsUnderstanding}</p>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">Understood</p>
              <p className="text-xs text-slate-500 mt-1">{Math.round((totalAyahsUnderstanding / TOTAL_AYAHS) * 100)}%</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <Volume2 className="w-6 sm:w-8 h-6 sm:h-8 text-blue-400" />
              </div>
              <p className="text-2xl sm:text-4xl font-bold text-blue-400 mb-1">{totalAyahsFluency}</p>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">Fluent</p>
              <p className="text-xs text-slate-500 mt-1">{Math.round((totalAyahsFluency / TOTAL_AYAHS) * 100)}%</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-4 sm:p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <Heart className="w-6 sm:w-8 h-6 sm:h-8 text-emerald-400" />
              </div>
              <p className="text-2xl sm:text-4xl font-bold text-emerald-400 mb-1">{totalAyahsMemorized}</p>
              <p className="text-xs sm:text-sm text-slate-400 font-medium">Memorized</p>
              <p className="text-xs text-slate-500 mt-1">{Math.round((totalAyahsMemorized / TOTAL_AYAHS) * 100)}%</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl p-4 sm:p-6 border border-emerald-500/50">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-6 sm:w-8 h-6 sm:h-8 text-emerald-400" />
              </div>
              <p className="text-3xl sm:text-5xl font-bold text-emerald-400 mb-1">{overallProgress}%</p>
              <p className="text-xs sm:text-sm text-emerald-300 font-semibold">Overall Hifdh</p>
            </div>
          </div>
        </div>

        {/* Teacher Notes Section */}
        {teacherNotes && (
          <div className="bg-gradient-to-br from-purple-800/40 to-pink-800/40 rounded-2xl p-4 sm:p-6 lg:p-8 border border-purple-500/50 backdrop-blur-sm shadow-xl mb-6 sm:mb-8">
            <div className="flex items-start gap-3 sm:gap-4">
              <div className="w-10 sm:w-12 h-10 sm:h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-5 sm:w-6 h-5 sm:h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">Notes from {teacherName}</h3>
                  <User className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-sm sm:text-base text-purple-100 whitespace-pre-wrap leading-relaxed">{teacherNotes}</p>
              </div>
            </div>
          </div>
        )}

        {/* Juz Navigation */}
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-4 sm:p-6 lg:p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-white">Navigate by Juz</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search surah..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-48 pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm"
              />
            </div>
          </div>

          {/* Juz Selector */}
          <div className="flex items-center gap-2 mb-4">
            <button
              onClick={() => setSelectedJuz(Math.max(1, selectedJuz - 1))}
              disabled={selectedJuz <= 1}
              className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition disabled:opacity-30"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>

            <div className="flex-1 flex gap-1 overflow-x-auto pb-2 scrollbar-thin">
              {JUZ_RANGES.map((juz) => (
                <button
                  key={juz.juz}
                  onClick={() => {
                    setSelectedJuz(juz.juz);
                    setSearchQuery('');
                  }}
                  className={`flex-shrink-0 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    selectedJuz === juz.juz
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-700/50 text-slate-300 hover:bg-slate-700'
                  }`}
                >
                  {juz.juz}
                </button>
              ))}
            </div>

            <button
              onClick={() => setSelectedJuz(Math.min(30, selectedJuz + 1))}
              disabled={selectedJuz >= 30}
              className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition disabled:opacity-30"
            >
              <ChevronRight className="w-5 h-5 text-white" />
            </button>
          </div>

          {/* Current Juz Info */}
          {currentJuz && !searchQuery && (
            <div className="text-center text-slate-400 text-sm mb-6">
              <span className="font-semibold text-white">Juz {selectedJuz}:</span> {currentJuz.name} • {currentJuz.surahs.length} Surah{currentJuz.surahs.length > 1 ? 's' : ''}
            </div>
          )}

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-6 text-xs sm:text-sm">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-cyan-500 rounded" />
              <span className="text-slate-400">Understanding</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span className="text-slate-400">Fluency</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-emerald-500 rounded" />
              <span className="text-slate-400">Memorized</span>
            </div>
          </div>

          {/* Surah List */}
          <div className="space-y-2 max-h-[800px] overflow-y-auto pr-2">
            {filteredSurahs.map((surah) => {
              const stats = getSurahStats(surah.number);
              const isComplete = stats.memorization === stats.total && stats.total > 0;

              return (
                <div
                  key={surah.number}
                  className={`bg-slate-800/50 rounded-xl border overflow-hidden transition ${
                    isComplete ? 'border-emerald-500/50' : 'border-slate-700/50'
                  }`}
                >
                  <button
                    onClick={() => toggleSurahExpansion(surah.number)}
                    className="w-full px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between hover:bg-slate-800/70 transition"
                  >
                    <div className="flex items-center space-x-3 sm:space-x-4">
                      <div className={`w-10 sm:w-12 h-10 sm:h-12 rounded-lg flex items-center justify-center ${
                        isComplete
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : 'bg-slate-700/50 text-cyan-400'
                      }`}>
                        <span className="font-bold text-sm sm:text-base">{surah.number}</span>
                      </div>

                      <div className="text-left">
                        <h3 className="text-sm sm:text-lg font-semibold text-white">{surah.name}</h3>
                        <p className="text-xs sm:text-sm text-slate-400">{surah.englishName} • {surah.ayahCount} Ayahs</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 sm:space-x-6">
                      <div className="hidden sm:flex items-center gap-3 text-sm">
                        <span className="text-cyan-400 font-semibold">{stats.understanding}/{stats.total}</span>
                        <span className="text-blue-400 font-semibold">{stats.fluency}/{stats.total}</span>
                        <span className="text-emerald-400 font-semibold">{stats.memorization}/{stats.total}</span>
                      </div>
                      {/* Mobile stats */}
                      <div className="flex sm:hidden items-center gap-1.5 text-xs">
                        <span className="text-emerald-400 font-semibold">{stats.memorization}/{stats.total}</span>
                      </div>

                      {surah.expanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {surah.expanded && (
                    <div className="px-4 sm:px-6 pb-4 sm:pb-6 border-t border-slate-700/50">
                      <div className="pt-4 sm:pt-6 space-y-4 sm:space-y-6">
                        {/* Theme */}
                        <div className="bg-slate-900/50 rounded-lg p-3 sm:p-4 border border-slate-700/30">
                          <h4 className="text-xs sm:text-sm font-semibold text-cyan-400 mb-1 sm:mb-2">Theme Summary</h4>
                          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">{surah.theme}</p>
                        </div>

                        {/* Mobile stats row */}
                        <div className="flex sm:hidden justify-around bg-slate-900/30 rounded-lg p-3">
                          <div className="text-center">
                            <p className="text-cyan-400 font-bold">{stats.understanding}</p>
                            <p className="text-xs text-slate-500">Understood</p>
                          </div>
                          <div className="text-center">
                            <p className="text-blue-400 font-bold">{stats.fluency}</p>
                            <p className="text-xs text-slate-500">Fluent</p>
                          </div>
                          <div className="text-center">
                            <p className="text-emerald-400 font-bold">{stats.memorization}</p>
                            <p className="text-xs text-slate-500">Memorized</p>
                          </div>
                        </div>

                        {/* Ayah Grid */}
                        <div className="grid grid-cols-1 gap-2 max-h-[500px] overflow-y-auto pr-2">
                          {surah.ayahs.map((ayah) => {
                            const key = `${surah.number}-${ayah.ayahNumber}`;
                            const isSaving = savingAyah === key;

                            return (
                              <div
                                key={ayah.ayahNumber}
                                className="bg-slate-900/30 rounded-lg p-3 sm:p-4 border border-slate-700/30 hover:border-slate-600/50 transition"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center space-x-2 sm:space-x-3">
                                    <div className="w-8 sm:w-10 h-8 sm:h-10 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                      <span className="text-slate-300 font-semibold text-xs sm:text-sm">
                                        {ayah.ayahNumber}
                                      </span>
                                    </div>
                                    <span className="text-xs sm:text-sm text-slate-400">Ayah {ayah.ayahNumber}</span>
                                  </div>

                                  <div className="flex items-center space-x-1.5 sm:space-x-2">
                                    <button
                                      onClick={() => toggleAyahProgress(surah.number, ayah.ayahNumber, 'understanding')}
                                      disabled={isSaving}
                                      className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg border-2 transition flex items-center justify-center ${
                                        ayah.understanding
                                          ? 'bg-cyan-500/20 border-cyan-500 hover:bg-cyan-500/30'
                                          : 'border-slate-600 hover:border-cyan-500/50'
                                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title="Understanding"
                                    >
                                      {ayah.understanding && (
                                        <Check className="w-4 sm:w-5 h-4 sm:h-5 text-cyan-400" />
                                      )}
                                    </button>

                                    <button
                                      onClick={() => toggleAyahProgress(surah.number, ayah.ayahNumber, 'fluency')}
                                      disabled={isSaving}
                                      className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg border-2 transition flex items-center justify-center ${
                                        ayah.fluency
                                          ? 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30'
                                          : 'border-slate-600 hover:border-blue-500/50'
                                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title="Fluency"
                                    >
                                      {ayah.fluency && (
                                        <Check className="w-4 sm:w-5 h-4 sm:h-5 text-blue-400" />
                                      )}
                                    </button>

                                    <button
                                      onClick={() => toggleAyahProgress(surah.number, ayah.ayahNumber, 'memorization')}
                                      disabled={isSaving}
                                      className={`w-8 sm:w-10 h-8 sm:h-10 rounded-lg border-2 transition flex items-center justify-center ${
                                        ayah.memorization
                                          ? 'bg-emerald-500/20 border-emerald-500 hover:bg-emerald-500/30'
                                          : 'border-slate-600 hover:border-emerald-500/50'
                                      } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                      title="Memorization"
                                    >
                                      {ayah.memorization && (
                                        <Check className="w-4 sm:w-5 h-4 sm:h-5 text-emerald-400" />
                                      )}
                                    </button>

                                    {isSaving && (
                                      <div className="w-4 sm:w-5 h-4 sm:h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                    )}
                                  </div>
                                </div>

                                {/* Teacher Notes for this Ayah */}
                                {ayah.teacherNotes && (
                                  <div className="mt-2 sm:mt-3 bg-purple-500/10 rounded-lg p-2 sm:p-3 border border-purple-500/30">
                                    <p className="text-xs text-purple-300">{ayah.teacherNotes}</p>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </main>
      <TalbiyahBot />
    </div>
  );
}
