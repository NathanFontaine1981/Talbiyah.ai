import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronDown, ChevronUp, Book, Check, BookOpen, Award, TrendingUp, MessageSquare, User } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { SURAHS_DATA, TOTAL_AYAHS, calculateOverallProgress } from '../lib/quranData';
import TalbiyahBot from '../components/TalbiyahBot';

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

      console.log('=== QURAN PROGRESS TRACKER DEBUG ===');
      console.log('Current User ID:', user.id);

      // Try multiple ways to find the learner:
      // 1. Check if current user is a parent and has a learner record (student case)
      let learner = null;

      const { data: learnerAsParent } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      if (learnerAsParent) {
        learner = learnerAsParent;
        console.log('Found learner as parent (student account):', learner.id);
      }

      // 2. If not found, check if there's a profile with linked_parent_id (child with full account)
      if (!learner) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('linked_parent_id')
          .eq('id', user.id)
          .maybeSingle();

        if (profile?.linked_parent_id) {
          // This is a child with a full account - find their learner record
          const { data: childLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('parent_id', user.id)
            .maybeSingle();

          if (childLearner) {
            learner = childLearner;
            console.log('Found learner as child with full account:', learner.id);
          }
        }
      }

      // 3. If still not found, check parent_children table (lightweight child case)
      if (!learner) {
        const { data: parentChild } = await supabase
          .from('parent_children')
          .select('id, child_name, child_age, child_gender')
          .eq('account_id', user.id)
          .maybeSingle();

        if (parentChild) {
          // Create or find learner for this lightweight child
          const { data: existingLearner } = await supabase
            .from('learners')
            .select('id')
            .eq('parent_id', user.id)
            .maybeSingle();

          if (existingLearner) {
            learner = existingLearner;
            console.log('Found existing learner for lightweight child:', learner.id);
          } else {
            // Create new learner record
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
              console.log('Created new learner for lightweight child:', learner.id);
            }
          }
        }
      }

      if (!learner) {
        console.log('No learner found for this user - creating default learner');

        // Last resort: Create a default learner for this user
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', user.id)
          .maybeSingle();

        const { data: newLearner, error: createError } = await supabase
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
          console.log('Created default learner:', learner.id);
        } else {
          console.log('Failed to create learner:', createError);
          // Continue anyway and load Surahs in read-only mode
        }
      }

      // Load Surahs data regardless of learner status
      let ayahProgressData: any[] = [];

      if (learner) {
        console.log('Final Learner ID:', learner.id);
        setLearnerId(learner.id);

        const { data: progressData } = await supabase
          .from('ayah_progress')
          .select('*')
          .eq('learner_id', learner.id);

        ayahProgressData = progressData || [];
      } else {
        console.log('No learner - showing Surahs in read-only mode');
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

      console.log('Setting surahs array with', surahsWithProgress.length, 'surahs');
      setSurahs(surahsWithProgress);

      const completedSurahs = surahsWithProgress.filter(surah =>
        surah.ayahs.length > 0 &&
        surah.ayahs.every(ayah => ayah.understanding && ayah.fluency && ayah.memorization)
      ).length;

      console.log('Total Surahs:', surahsWithProgress.length);
      console.log('Ayah Progress Records:', ayahProgressData?.length || 0);
      console.log('Completed Surahs (all 3 criteria):', completedSurahs);
      console.log('===================================');

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

  const totalSurahs = surahs.length;

  const overallProgress = calculateOverallProgress(totalAyahsMemorized);

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
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Book className="w-6 h-6 text-cyan-400" />
              <span>Qur'an Progress Tracker - Ayah Level</span>
            </h1>

            <div className="w-40"></div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl mb-8">
          <h2 className="text-2xl font-bold text-white mb-6">Overall Progress</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-6 border border-purple-500/50">
              <div className="flex items-center justify-between mb-2">
                <Book className="w-8 h-8 text-purple-400" />
              </div>
              <p className="text-4xl font-bold text-purple-400 mb-1">{completedSurahs}</p>
              <p className="text-sm text-purple-300 font-semibold">of {totalSurahs} Surahs</p>
              <p className="text-xs text-purple-400/70 mt-1">Fully Completed</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="w-8 h-8 text-slate-400" />
              </div>
              <p className="text-4xl font-bold text-white mb-1">{TOTAL_AYAHS}</p>
              <p className="text-sm text-slate-400 font-medium">Total Ayahs</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <Check className="w-8 h-8 text-cyan-400" />
              </div>
              <p className="text-4xl font-bold text-cyan-400 mb-1">{totalAyahsUnderstanding}</p>
              <p className="text-sm text-slate-400 font-medium">Ayahs Understood</p>
              <p className="text-xs text-slate-500 mt-1">{Math.round((totalAyahsUnderstanding / TOTAL_AYAHS) * 100)}%</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-blue-400" />
              </div>
              <p className="text-4xl font-bold text-blue-400 mb-1">{totalAyahsFluency}</p>
              <p className="text-sm text-slate-400 font-medium">Ayahs Fluent</p>
              <p className="text-xs text-slate-500 mt-1">{Math.round((totalAyahsFluency / TOTAL_AYAHS) * 100)}%</p>
            </div>

            <div className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-4xl font-bold text-emerald-400 mb-1">{totalAyahsMemorized}</p>
              <p className="text-sm text-slate-400 font-medium">Ayahs Memorized</p>
              <p className="text-xs text-slate-500 mt-1">{Math.round((totalAyahsMemorized / TOTAL_AYAHS) * 100)}%</p>
            </div>

            <div className="bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 rounded-xl p-6 border border-emerald-500/50">
              <div className="flex items-center justify-between mb-2">
                <Award className="w-8 h-8 text-emerald-400" />
              </div>
              <p className="text-5xl font-bold text-emerald-400 mb-1">{overallProgress}%</p>
              <p className="text-sm text-emerald-300 font-semibold">Overall Hifdh Progress</p>
              <p className="text-xs text-emerald-400/70 mt-1">Based on memorized Ayahs</p>
            </div>
          </div>
        </div>

        {/* Teacher Notes Section */}
        {teacherNotes && (
          <div className="bg-gradient-to-br from-purple-800/40 to-pink-800/40 rounded-2xl p-8 border border-purple-500/50 backdrop-blur-sm shadow-xl mb-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-6 h-6 text-purple-400" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <h3 className="text-lg font-bold text-white">Notes from {teacherName}</h3>
                  <User className="w-4 h-4 text-purple-400" />
                </div>
                <p className="text-purple-100 whitespace-pre-wrap leading-relaxed">{teacherNotes}</p>
              </div>
            </div>
          </div>
        )}

        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl p-8 border border-slate-700/50 backdrop-blur-sm shadow-xl">
          <h2 className="text-2xl font-bold text-white mb-6">Surah Syllabus - Ayah Level Tracking</h2>

          <div className="space-y-2 max-h-[1000px] overflow-y-auto pr-2">
            {surahs.map((surah) => {
              const memorizedAyahs = surah.ayahs.filter(a => a.memorization).length;
              const understandingAyahs = surah.ayahs.filter(a => a.understanding).length;
              const fluencyAyahs = surah.ayahs.filter(a => a.fluency).length;

              return (
                <div
                  key={surah.number}
                  className="bg-slate-800/50 rounded-xl border border-slate-700/50 overflow-hidden"
                >
                  <button
                    onClick={() => toggleSurahExpansion(surah.number)}
                    className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-800/70 transition"
                  >
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-slate-700/50 rounded-lg flex items-center justify-center">
                        <span className="text-cyan-400 font-bold">{surah.number}</span>
                      </div>

                      <div className="text-left">
                        <h3 className="text-lg font-semibold text-white">{surah.name}</h3>
                        <p className="text-sm text-slate-400">{surah.englishName} • {surah.ayahCount} Ayahs</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6">
                      <div className="text-right text-sm">
                        <div className="flex items-center space-x-2">
                          <span className="text-cyan-400 font-semibold">{understandingAyahs}/{surah.ayahCount}</span>
                          <span className="text-slate-500">Understanding</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-blue-400 font-semibold">{fluencyAyahs}/{surah.ayahCount}</span>
                          <span className="text-slate-500">Fluency</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="text-emerald-400 font-semibold">{memorizedAyahs}/{surah.ayahCount}</span>
                          <span className="text-slate-500">Memorized</span>
                        </div>
                      </div>

                      {surah.expanded ? (
                        <ChevronUp className="w-5 h-5 text-slate-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {surah.expanded && (
                    <div className="px-6 pb-6 border-t border-slate-700/50">
                      <div className="pt-6 space-y-6">
                        <div className="bg-slate-900/50 rounded-lg p-4 border border-slate-700/30">
                          <h4 className="text-sm font-semibold text-cyan-400 mb-2">Theme Summary</h4>
                          <p className="text-sm text-slate-300 leading-relaxed">{surah.theme}</p>
                        </div>

                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-semibold text-white">Individual Ayah Progress</h4>
                            <div className="flex items-center space-x-4 text-xs">
                              <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-cyan-500 rounded"></div>
                                <span className="text-slate-400">Understanding</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                <span className="text-slate-400">Fluency</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <div className="w-3 h-3 bg-emerald-500 rounded"></div>
                                <span className="text-slate-400">Memorized</span>
                              </div>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 gap-2 max-h-[600px] overflow-y-auto pr-2">
                            {surah.ayahs.map((ayah) => {
                              const key = `${surah.number}-${ayah.ayahNumber}`;
                              const isSaving = savingAyah === key;

                              return (
                                <div
                                  key={ayah.ayahNumber}
                                  className="bg-slate-900/30 rounded-lg p-4 border border-slate-700/30 hover:border-slate-600/50 transition"
                                >
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center flex-shrink-0">
                                        <span className="text-slate-300 font-semibold text-sm">
                                          {ayah.ayahNumber}
                                        </span>
                                      </div>
                                      <span className="text-sm text-slate-400">Ayah {ayah.ayahNumber}</span>
                                    </div>

                                    <div className="flex items-center space-x-2">
                                      <button
                                        onClick={() => toggleAyahProgress(surah.number, ayah.ayahNumber, 'understanding')}
                                        disabled={isSaving}
                                        className={`w-10 h-10 rounded-lg border-2 transition flex items-center justify-center ${
                                          ayah.understanding
                                            ? 'bg-cyan-500/20 border-cyan-500 hover:bg-cyan-500/30'
                                            : 'border-slate-600 hover:border-cyan-500/50'
                                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Understanding"
                                      >
                                        {ayah.understanding && (
                                          <Check className="w-5 h-5 text-cyan-400" />
                                        )}
                                      </button>

                                      <button
                                        onClick={() => toggleAyahProgress(surah.number, ayah.ayahNumber, 'fluency')}
                                        disabled={isSaving}
                                        className={`w-10 h-10 rounded-lg border-2 transition flex items-center justify-center ${
                                          ayah.fluency
                                            ? 'bg-blue-500/20 border-blue-500 hover:bg-blue-500/30'
                                            : 'border-slate-600 hover:border-blue-500/50'
                                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Fluency"
                                      >
                                        {ayah.fluency && (
                                          <Check className="w-5 h-5 text-blue-400" />
                                        )}
                                      </button>

                                      <button
                                        onClick={() => toggleAyahProgress(surah.number, ayah.ayahNumber, 'memorization')}
                                        disabled={isSaving}
                                        className={`w-10 h-10 rounded-lg border-2 transition flex items-center justify-center ${
                                          ayah.memorization
                                            ? 'bg-emerald-500/20 border-emerald-500 hover:bg-emerald-500/30'
                                            : 'border-slate-600 hover:border-emerald-500/50'
                                        } ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Memorization"
                                      >
                                        {ayah.memorization && (
                                          <Check className="w-5 h-5 text-emerald-400" />
                                        )}
                                      </button>

                                      {isSaving && (
                                        <div className="w-5 h-5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
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
