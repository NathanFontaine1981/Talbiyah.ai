import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft, ChevronDown, ChevronUp, Book, Check, BookOpen,
  MessageSquare, User, ChevronRight, Search, Brain, Volume2, Heart, Edit3, Loader
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { SURAHS_DATA, TOTAL_AYAHS, calculateOverallProgress } from '../lib/quranData';
import Breadcrumbs from '../components/Breadcrumbs';

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
  const [selectedJuz, setSelectedJuz] = useState(30);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAll, setShowAll] = useState(false);

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
      let memorizedSurahs: Set<number> = new Set();
      let understoodSurahsSet: Set<number> = new Set();
      let fluentSurahsSet: Set<number> = new Set();

      if (learner) {
        setLearnerId(learner.id);

        // Load ayah-level progress
        const { data: progressData } = await supabase
          .from('ayah_progress')
          .select('*')
          .eq('learner_id', learner.id);

        ayahProgressData = progressData || [];

        // Also load surah-level progress from surah_retention_tracker
        const { data: surahRetentionData } = await supabase
          .from('surah_retention_tracker')
          .select('surah_number, memorization_status, fluency_complete, understanding_complete')
          .eq('learner_id', learner.id);

        if (surahRetentionData) {
          surahRetentionData.forEach((record: any) => {
            if (record.memorization_status === 'memorized') {
              memorizedSurahs.add(record.surah_number);
            }
            if (record.fluency_complete) {
              fluentSurahsSet.add(record.surah_number);
            }
            if (record.understanding_complete) {
              understoodSurahsSet.add(record.surah_number);
            }
          });
        }
      }

      const surahsWithProgress: SurahProgress[] = SURAHS_DATA.map(surah => {
        const ayahs: AyahProgress[] = [];
        const isSurahMemorized = memorizedSurahs.has(surah.number);
        const isSurahFluent = fluentSurahsSet.has(surah.number);
        const isSurahUnderstood = understoodSurahsSet.has(surah.number);

        for (let i = 1; i <= surah.ayahCount; i++) {
          const progressRecord = ayahProgressData?.find(
            p => p.surah_number === surah.number && p.ayah_number === i
          );

          // Use ayah-level data if available, otherwise fall back to surah-level data
          ayahs.push({
            ayahNumber: i,
            understanding: progressRecord?.understanding_complete || isSurahUnderstood,
            fluency: progressRecord?.fluency_complete || isSurahFluent,
            memorization: progressRecord?.memorization_complete || isSurahMemorized,
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
      toast.error('Failed to save progress. Please try again.');
      await loadProgress();
    } finally {
      setSavingAyah(null);
    }
  }

  async function toggleAllAyahsInSurah(
    surahNumber: number,
    field: 'understanding' | 'fluency' | 'memorization'
  ) {
    if (!learnerId) return;

    const surah = surahs.find(s => s.number === surahNumber);
    if (!surah) return;

    // Check if all ayahs already have this field set - if so, unset all
    const allSet = surah.ayahs.every(a => a[field]);
    const newValue = !allSet;

    setSavingAyah(`all-${surahNumber}-${field}`);

    try {
      // Update local state first
      setSurahs(prev => prev.map(s => {
        if (s.number === surahNumber) {
          return {
            ...s,
            ayahs: s.ayahs.map(a => ({ ...a, [field]: newValue }))
          };
        }
        return s;
      }));

      // Batch upsert all ayahs
      const upsertData = surah.ayahs.map(ayah => ({
        learner_id: learnerId,
        surah_number: surahNumber,
        ayah_number: ayah.ayahNumber,
        understanding_complete: field === 'understanding' ? newValue : ayah.understanding,
        fluency_complete: field === 'fluency' ? newValue : ayah.fluency,
        memorization_complete: field === 'memorization' ? newValue : ayah.memorization,
        teacher_notes: ayah.teacherNotes || null
      }));

      const { error } = await supabase
        .from('ayah_progress')
        .upsert(upsertData, {
          onConflict: 'learner_id,surah_number,ayah_number'
        });

      if (error) throw error;

      toast.success(`${newValue ? 'Marked' : 'Unmarked'} all ayahs as ${field}`);
    } catch (error) {
      console.error('Error updating all ayahs:', error);
      toast.error('Failed to update. Please try again.');
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
    surah.ayahs.every(ayah => ayah.memorization)
  ).length;

  const understoodSurahs = surahs.filter(surah =>
    surah.ayahs.length > 0 &&
    surah.ayahs.every(ayah => ayah.understanding)
  ).length;

  const overallProgress = calculateOverallProgress(totalAyahsMemorized);
  const understandingProgress = calculateOverallProgress(totalAyahsUnderstanding);

  // Circular progress calculation
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (overallProgress / 100) * circumference;

  // Understanding progress (smaller ring)
  const understandingCircumference = 2 * Math.PI * 90;
  const understandingStrokeDashoffset = understandingCircumference - (understandingProgress / 100) * understandingCircumference;

  // Get surahs for current Juz
  const currentJuz = JUZ_RANGES.find(j => j.juz === selectedJuz);
  const surahsInJuz = currentJuz
    ? surahs.filter(s => currentJuz.surahs.includes(s.number))
    : [];

  // Filter surahs by search or show all
  const filteredSurahs = searchQuery
    ? surahs.filter(
        s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.number.toString().includes(searchQuery)
      )
    : showAll
    ? surahs
    : surahsInJuz;

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-200 backdrop-blur-sm shadow-xl m-6">
          <div className="animate-pulse flex flex-col items-center justify-center py-12">
            <div className="w-32 h-32 bg-gray-700 rounded-full mb-4"></div>
            <div className="h-4 bg-gray-700 rounded w-32"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to Quran progress
      </a>

      <header className="bg-gray-900/80 backdrop-blur-md border-b border-gray-700/50 sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Breadcrumbs
            items={[
              { label: 'Dashboard', path: '/dashboard' },
              { label: 'Quran Progress' }
            ]}
            homePath="/dashboard"
            darkMode
          />
        </div>
      </header>

      <main id="main-content" className="max-w-4xl mx-auto px-4 py-6">
        {/* Main Progress Card - Similar to ArabicProgressTracker */}
        <div className="bg-gradient-to-br from-gray-800/90 to-gray-900/90 rounded-2xl p-6 border border-gray-700/50 backdrop-blur-sm shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white flex items-center space-x-2">
              <Book className="w-5 h-5 text-emerald-400" />
              <span>Qur'an Progress Tracker</span>
            </h3>
            {learnerId && (
              <span className="text-xs text-gray-500 flex items-center gap-1">
                <Edit3 className="w-3 h-3" />
                Click circles to update
              </span>
            )}
          </div>

          {/* Dual Circular Progress */}
          <div className="flex flex-col items-center mb-8">
            <div className="grid grid-cols-2 gap-6 mb-6">
              {/* Memorisation Progress */}
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 mb-2">
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
                      strokeDasharray={2 * Math.PI * 70}
                      strokeDashoffset={(2 * Math.PI * 70) - (overallProgress / 100) * (2 * Math.PI * 70)}
                      className="text-emerald-400 transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-emerald-400">{overallProgress}%</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-emerald-400">Memorised</p>
                <p className="text-xs text-gray-500">{completedSurahs} surahs complete</p>
              </div>

              {/* Understanding Progress */}
              <div className="flex flex-col items-center">
                <div className="relative w-40 h-40 mb-2">
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
                      strokeDasharray={2 * Math.PI * 70}
                      strokeDashoffset={(2 * Math.PI * 70) - (understandingProgress / 100) * (2 * Math.PI * 70)}
                      className="text-cyan-400 transition-all duration-1000 ease-out"
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <p className="text-3xl font-bold text-cyan-400">{understandingProgress}%</p>
                  </div>
                </div>
                <p className="text-sm font-medium text-cyan-400">Understood</p>
                <p className="text-xs text-gray-500">{understoodSurahs} surahs complete</p>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex items-center justify-center space-x-6 text-sm">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{completedSurahs}</p>
                <p className="text-gray-500">Surahs Memorised</p>
              </div>
              <div className="w-px h-12 bg-gray-700"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-cyan-400">{understoodSurahs}</p>
                <p className="text-gray-500">Surahs Understood</p>
              </div>
              <div className="w-px h-12 bg-gray-700"></div>
              <div className="text-center">
                <p className="text-2xl font-bold text-white">{114 - completedSurahs}</p>
                <p className="text-gray-500">To Memorise</p>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-cyan-500/10 rounded-lg p-3 border border-cyan-500/30 text-center">
              <Brain className="w-5 h-5 text-cyan-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-cyan-400">{totalAyahsUnderstanding}</p>
              <p className="text-xs text-cyan-300">Understood</p>
            </div>
            <div className="bg-blue-500/10 rounded-lg p-3 border border-blue-500/30 text-center">
              <Volume2 className="w-5 h-5 text-blue-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-blue-400">{totalAyahsFluency}</p>
              <p className="text-xs text-blue-300">Fluent</p>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-3 border border-orange-500/30 text-center">
              <Heart className="w-5 h-5 text-orange-400 mx-auto mb-1" />
              <p className="text-lg font-bold text-orange-400">{totalAyahsMemorized}</p>
              <p className="text-xs text-orange-300">Memorised</p>
            </div>
          </div>

          {/* Teacher Notes */}
          {teacherNotes && (
            <div className="bg-purple-500/10 rounded-lg p-4 border border-purple-500/30 mb-6">
              <div className="flex items-start gap-3">
                <MessageSquare className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-purple-400">Notes from {teacherName}</p>
                    <User className="w-3 h-3 text-purple-400" />
                  </div>
                  <p className="text-sm text-purple-200">{teacherNotes}</p>
                </div>
              </div>
            </div>
          )}

          {/* Juz Selector - Similar to Book Selector */}
          <div className="flex gap-2 mb-4 overflow-x-auto pb-2" role="group" aria-label="View mode">
            <button
              onClick={() => { setShowAll(false); setSearchQuery(''); }}
              aria-pressed={!showAll && !searchQuery}
              className={`flex-shrink-0 py-2 px-4 rounded-lg text-sm font-medium transition ${
                !showAll && !searchQuery
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              By Juz
            </button>
            <button
              onClick={() => { setShowAll(true); setSearchQuery(''); }}
              aria-pressed={showAll}
              className={`flex-shrink-0 py-2 px-4 rounded-lg text-sm font-medium transition ${
                showAll
                  ? 'bg-emerald-600 text-white'
                  : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600/50'
              }`}
            >
              All 114 Surahs
            </button>
          </div>

          {/* Juz Navigation (when By Juz is selected) */}
          {!showAll && !searchQuery && (
            <div className="flex items-center gap-2 mb-4">
              <button
                onClick={() => setSelectedJuz(Math.max(1, selectedJuz - 1))}
                disabled={selectedJuz <= 1}
                className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4 text-white" />
              </button>

              <div className="flex-1 flex gap-1 overflow-x-auto pb-1">
                {JUZ_RANGES.map((juz) => (
                  <button
                    key={juz.juz}
                    onClick={() => setSelectedJuz(juz.juz)}
                    className={`flex-shrink-0 w-8 h-8 rounded-lg text-xs font-medium transition ${
                      selectedJuz === juz.juz
                        ? 'bg-emerald-500 text-white'
                        : 'bg-gray-700/50 text-gray-400 hover:bg-gray-600/50'
                    }`}
                  >
                    {juz.juz}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setSelectedJuz(Math.min(30, selectedJuz + 1))}
                disabled={selectedJuz >= 30}
                className="p-2 bg-gray-700/50 hover:bg-gray-600/50 rounded-lg transition disabled:opacity-30"
              >
                <ChevronRight className="w-4 h-4 text-white" />
              </button>
            </div>
          )}

          {/* Current Juz Info */}
          {currentJuz && !showAll && !searchQuery && (
            <div className="text-center text-gray-400 text-sm mb-4">
              <span className="font-semibold text-white">Juz {selectedJuz}:</span> {currentJuz.name}
            </div>
          )}

          {/* Search */}
          <div className="relative mb-4">
            <label htmlFor="surah-search" className="sr-only">Search surah by name or number</label>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              id="surah-search"
              type="text"
              placeholder="Search surah by name or number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
            />
          </div>

          {/* Legend Header */}
          <div className="flex items-center justify-between mb-3 px-2">
            <span className="text-xs font-medium text-gray-500 uppercase">Surah</span>
            <div className="flex items-center gap-2 pr-8">
              <span className="text-xs font-medium text-cyan-400 uppercase w-8 text-center" title="Understanding">
                U
              </span>
              <span className="text-xs font-medium text-blue-400 uppercase w-8 text-center" title="Fluency">
                F
              </span>
              <span className="text-xs font-medium text-orange-400 uppercase w-8 text-center" title="Memorisation">
                M
              </span>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-end gap-4 mb-4 px-2 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-cyan-500 bg-cyan-500/20"></div>
              <span>Understanding</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-blue-500 bg-blue-500/20"></div>
              <span>Fluency</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-full border-2 border-orange-500 bg-orange-500/20"></div>
              <span>Memorisation</span>
            </div>
          </div>

          {/* Surah List */}
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {filteredSurahs.map((surah) => {
              const stats = getSurahStats(surah.number);
              const isComplete = stats.memorization === stats.total && stats.total > 0;

              return (
                <div key={surah.number} className="bg-gray-700/30 rounded-lg overflow-hidden">
                  <div className="flex items-center justify-between p-3">
                    <button
                      onClick={() => toggleSurahExpansion(surah.number)}
                      aria-expanded={surah.expanded}
                      className="flex-1 text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          isComplete
                            ? 'bg-emerald-500/20 text-emerald-400'
                            : 'bg-gray-600/50 text-gray-400'
                        }`}>
                          {surah.number}
                        </span>
                        <div>
                          <span className="text-sm font-medium text-white">
                            {surah.englishName}
                          </span>
                          <span className="text-emerald-400 text-sm ml-2 font-arabic">
                            {surah.name}
                          </span>
                          <p className="text-xs text-gray-500">{surah.ayahCount} Ayahs</p>
                        </div>
                      </div>
                    </button>

                    <div className="flex items-center gap-2">
                      {/* Progress circles showing surah-level aggregated stats */}
                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        stats.understanding === stats.total && stats.total > 0
                          ? 'bg-cyan-500/20 border-cyan-500'
                          : 'border-gray-600'
                      }`} title={`Understanding: ${stats.understanding}/${stats.total}`}>
                        {stats.understanding === stats.total && stats.total > 0 && (
                          <Check className="w-4 h-4 text-cyan-400" />
                        )}
                      </div>

                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        stats.fluency === stats.total && stats.total > 0
                          ? 'bg-blue-500/20 border-blue-500'
                          : 'border-gray-600'
                      }`} title={`Fluency: ${stats.fluency}/${stats.total}`}>
                        {stats.fluency === stats.total && stats.total > 0 && (
                          <Check className="w-4 h-4 text-blue-400" />
                        )}
                      </div>

                      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                        stats.memorization === stats.total && stats.total > 0
                          ? 'bg-orange-500/20 border-orange-500'
                          : 'border-gray-600'
                      }`} title={`Memorisation: ${stats.memorization}/${stats.total}`}>
                        {stats.memorization === stats.total && stats.total > 0 && (
                          <Check className="w-4 h-4 text-orange-400" />
                        )}
                      </div>

                      <button
                        onClick={() => toggleSurahExpansion(surah.number)}
                        aria-expanded={surah.expanded}
                        aria-label={surah.expanded ? `Collapse ${surah.englishName}` : `Expand ${surah.englishName}`}
                        className="p-1 text-gray-500 hover:text-emerald-400 transition ml-1"
                      >
                        {surah.expanded ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {surah.expanded && (
                    <div className="px-3 pb-3 pt-0 space-y-3">
                      {/* Theme */}
                      <div className="bg-gray-600/30 rounded-lg p-3 border border-gray-500/30">
                        <p className="text-xs font-medium text-emerald-400 mb-1">Theme</p>
                        <p className="text-sm text-gray-300">{surah.theme}</p>
                      </div>

                      {/* Progress Stats - Clickable to Select All */}
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <button
                          onClick={() => toggleAllAyahsInSurah(surah.number, 'understanding')}
                          disabled={savingAyah?.startsWith('all-') || !learnerId}
                          className={`bg-cyan-500/10 rounded-lg p-2 border border-cyan-500/20 hover:bg-cyan-500/20 transition cursor-pointer ${
                            stats.understanding === stats.total ? 'ring-2 ring-cyan-500' : ''
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <p className="text-lg font-bold text-cyan-400">{stats.understanding}/{stats.total}</p>
                          <p className="text-xs text-cyan-300">Understood</p>
                          <p className="text-[10px] text-cyan-400/70 mt-1">
                            {stats.understanding === stats.total ? 'Tap to unselect all' : 'Tap to select all'}
                          </p>
                        </button>
                        <button
                          onClick={() => toggleAllAyahsInSurah(surah.number, 'fluency')}
                          disabled={savingAyah?.startsWith('all-') || !learnerId}
                          className={`bg-blue-500/10 rounded-lg p-2 border border-blue-500/20 hover:bg-blue-500/20 transition cursor-pointer ${
                            stats.fluency === stats.total ? 'ring-2 ring-blue-500' : ''
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <p className="text-lg font-bold text-blue-400">{stats.fluency}/{stats.total}</p>
                          <p className="text-xs text-blue-300">Fluent</p>
                          <p className="text-[10px] text-blue-400/70 mt-1">
                            {stats.fluency === stats.total ? 'Tap to unselect all' : 'Tap to select all'}
                          </p>
                        </button>
                        <button
                          onClick={() => toggleAllAyahsInSurah(surah.number, 'memorization')}
                          disabled={savingAyah?.startsWith('all-') || !learnerId}
                          className={`bg-orange-500/10 rounded-lg p-2 border border-orange-500/20 hover:bg-orange-500/20 transition cursor-pointer ${
                            stats.memorization === stats.total ? 'ring-2 ring-orange-500' : ''
                          } disabled:opacity-50 disabled:cursor-not-allowed`}
                        >
                          <p className="text-lg font-bold text-orange-400">{stats.memorization}/{stats.total}</p>
                          <p className="text-xs text-orange-300">Memorised</p>
                          <p className="text-[10px] text-orange-400/70 mt-1">
                            {stats.memorization === stats.total ? 'Tap to unselect all' : 'Tap to select all'}
                          </p>
                        </button>
                      </div>

                      {/* Ayah Grid */}
                      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
                        {surah.ayahs.map((ayah) => {
                          const key = `${surah.number}-${ayah.ayahNumber}`;
                          const isSaving = savingAyah === key;

                          return (
                            <div
                              key={ayah.ayahNumber}
                              className="bg-gray-600/30 rounded-lg p-3 border border-gray-500/30"
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <div className="w-8 h-8 bg-gray-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                    <span className="text-gray-300 font-semibold text-xs">
                                      {ayah.ayahNumber}
                                    </span>
                                  </div>
                                  <span className="text-xs text-gray-400">Ayah {ayah.ayahNumber}</span>
                                </div>

                                <div className="flex items-center space-x-2">
                                  <button
                                    onClick={() => toggleAyahProgress(surah.number, ayah.ayahNumber, 'understanding')}
                                    disabled={isSaving || !learnerId}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                      ayah.understanding
                                        ? 'bg-cyan-500/20 border-cyan-500'
                                        : 'border-gray-500 hover:border-cyan-400'
                                    } ${learnerId ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                                    title="Understanding"
                                  >
                                    {isSaving ? (
                                      <Loader className="w-3 h-3 text-gray-500 animate-spin" />
                                    ) : ayah.understanding ? (
                                      <Check className="w-4 h-4 text-cyan-400" />
                                    ) : null}
                                  </button>

                                  <button
                                    onClick={() => toggleAyahProgress(surah.number, ayah.ayahNumber, 'fluency')}
                                    disabled={isSaving || !learnerId}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                      ayah.fluency
                                        ? 'bg-blue-500/20 border-blue-500'
                                        : 'border-gray-500 hover:border-blue-400'
                                    } ${learnerId ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                                    title="Fluency"
                                  >
                                    {isSaving ? (
                                      <Loader className="w-3 h-3 text-gray-500 animate-spin" />
                                    ) : ayah.fluency ? (
                                      <Check className="w-4 h-4 text-blue-400" />
                                    ) : null}
                                  </button>

                                  <button
                                    onClick={() => toggleAyahProgress(surah.number, ayah.ayahNumber, 'memorization')}
                                    disabled={isSaving || !learnerId}
                                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${
                                      ayah.memorization
                                        ? 'bg-orange-500/20 border-orange-500'
                                        : 'border-gray-500 hover:border-orange-400'
                                    } ${learnerId ? 'cursor-pointer hover:scale-110' : 'cursor-default'}`}
                                    title="Memorisation"
                                  >
                                    {isSaving ? (
                                      <Loader className="w-3 h-3 text-gray-500 animate-spin" />
                                    ) : ayah.memorization ? (
                                      <Check className="w-4 h-4 text-orange-400" />
                                    ) : null}
                                  </button>
                                </div>
                              </div>

                              {/* Teacher Notes for this Ayah */}
                              {ayah.teacherNotes && (
                                <div className="mt-2 bg-purple-500/10 rounded-lg p-2 border border-purple-500/30">
                                  <p className="text-xs text-purple-300">{ayah.teacherNotes}</p>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Show All Button */}
          {!showAll && !searchQuery && (
            <button
              onClick={() => setShowAll(true)}
              className="w-full mt-4 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-emerald-400 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <span className="text-sm font-medium">Show All 114 Surahs</span>
              <ChevronDown className="w-4 h-4" />
            </button>
          )}

          {showAll && (
            <button
              onClick={() => setShowAll(false)}
              className="w-full mt-4 px-4 py-2 bg-gray-700/50 hover:bg-gray-600/50 text-emerald-400 rounded-lg transition flex items-center justify-center space-x-2"
            >
              <span className="text-sm font-medium">Show Less</span>
              <ChevronUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
