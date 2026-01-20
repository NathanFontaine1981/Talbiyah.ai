import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { ChevronDown, ChevronUp, BookOpen, Brain, Volume2, Heart, Edit3, Save, X, Check, CheckSquare, Square, Layers } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

// All 114 Surahs of the Quran with their ayah counts
const SURAHS = [
  { number: 1, name: 'Al-Fatiha', nameAr: 'الفاتحة', ayahs: 7 },
  { number: 2, name: 'Al-Baqarah', nameAr: 'البقرة', ayahs: 286 },
  { number: 3, name: 'Aal-E-Imran', nameAr: 'آل عمران', ayahs: 200 },
  { number: 4, name: 'An-Nisa', nameAr: 'النساء', ayahs: 176 },
  { number: 5, name: 'Al-Maidah', nameAr: 'المائدة', ayahs: 120 },
  { number: 6, name: 'Al-Anam', nameAr: 'الأنعام', ayahs: 165 },
  { number: 7, name: 'Al-Araf', nameAr: 'الأعراف', ayahs: 206 },
  { number: 8, name: 'Al-Anfal', nameAr: 'الأنفال', ayahs: 75 },
  { number: 9, name: 'At-Tawbah', nameAr: 'التوبة', ayahs: 129 },
  { number: 10, name: 'Yunus', nameAr: 'يونس', ayahs: 109 },
  { number: 11, name: 'Hud', nameAr: 'هود', ayahs: 123 },
  { number: 12, name: 'Yusuf', nameAr: 'يوسف', ayahs: 111 },
  { number: 13, name: 'Ar-Rad', nameAr: 'الرعد', ayahs: 43 },
  { number: 14, name: 'Ibrahim', nameAr: 'ابراهيم', ayahs: 52 },
  { number: 15, name: 'Al-Hijr', nameAr: 'الحجر', ayahs: 99 },
  { number: 16, name: 'An-Nahl', nameAr: 'النحل', ayahs: 128 },
  { number: 17, name: 'Al-Isra', nameAr: 'الإسراء', ayahs: 111 },
  { number: 18, name: 'Al-Kahf', nameAr: 'الكهف', ayahs: 110 },
  { number: 19, name: 'Maryam', nameAr: 'مريم', ayahs: 98 },
  { number: 20, name: 'Ta-Ha', nameAr: 'طه', ayahs: 135 },
  { number: 21, name: 'Al-Anbiya', nameAr: 'الأنبياء', ayahs: 112 },
  { number: 22, name: 'Al-Hajj', nameAr: 'الحج', ayahs: 78 },
  { number: 23, name: 'Al-Muminun', nameAr: 'المؤمنون', ayahs: 118 },
  { number: 24, name: 'An-Nur', nameAr: 'النور', ayahs: 64 },
  { number: 25, name: 'Al-Furqan', nameAr: 'الفرقان', ayahs: 77 },
  { number: 26, name: 'Ash-Shuara', nameAr: 'الشعراء', ayahs: 227 },
  { number: 27, name: 'An-Naml', nameAr: 'النمل', ayahs: 93 },
  { number: 28, name: 'Al-Qasas', nameAr: 'القصص', ayahs: 88 },
  { number: 29, name: 'Al-Ankabut', nameAr: 'العنكبوت', ayahs: 69 },
  { number: 30, name: 'Ar-Rum', nameAr: 'الروم', ayahs: 60 },
  { number: 31, name: 'Luqman', nameAr: 'لقمان', ayahs: 34 },
  { number: 32, name: 'As-Sajdah', nameAr: 'السجدة', ayahs: 30 },
  { number: 33, name: 'Al-Ahzab', nameAr: 'الأحزاب', ayahs: 73 },
  { number: 34, name: 'Saba', nameAr: 'سبإ', ayahs: 54 },
  { number: 35, name: 'Fatir', nameAr: 'فاطر', ayahs: 45 },
  { number: 36, name: 'Ya-Sin', nameAr: 'يس', ayahs: 83 },
  { number: 37, name: 'As-Saffat', nameAr: 'الصافات', ayahs: 182 },
  { number: 38, name: 'Sad', nameAr: 'ص', ayahs: 88 },
  { number: 39, name: 'Az-Zumar', nameAr: 'الزمر', ayahs: 75 },
  { number: 40, name: 'Ghafir', nameAr: 'غافر', ayahs: 85 },
  { number: 41, name: 'Fussilat', nameAr: 'فصلت', ayahs: 54 },
  { number: 42, name: 'Ash-Shura', nameAr: 'الشورى', ayahs: 53 },
  { number: 43, name: 'Az-Zukhruf', nameAr: 'الزخرف', ayahs: 89 },
  { number: 44, name: 'Ad-Dukhan', nameAr: 'الدخان', ayahs: 59 },
  { number: 45, name: 'Al-Jathiyah', nameAr: 'الجاثية', ayahs: 37 },
  { number: 46, name: 'Al-Ahqaf', nameAr: 'الأحقاف', ayahs: 35 },
  { number: 47, name: 'Muhammad', nameAr: 'محمد', ayahs: 38 },
  { number: 48, name: 'Al-Fath', nameAr: 'الفتح', ayahs: 29 },
  { number: 49, name: 'Al-Hujurat', nameAr: 'الحجرات', ayahs: 18 },
  { number: 50, name: 'Qaf', nameAr: 'ق', ayahs: 45 },
  { number: 51, name: 'Adh-Dhariyat', nameAr: 'الذاريات', ayahs: 60 },
  { number: 52, name: 'At-Tur', nameAr: 'الطور', ayahs: 49 },
  { number: 53, name: 'An-Najm', nameAr: 'النجم', ayahs: 62 },
  { number: 54, name: 'Al-Qamar', nameAr: 'القمر', ayahs: 55 },
  { number: 55, name: 'Ar-Rahman', nameAr: 'الرحمن', ayahs: 78 },
  { number: 56, name: 'Al-Waqiah', nameAr: 'الواقعة', ayahs: 96 },
  { number: 57, name: 'Al-Hadid', nameAr: 'الحديد', ayahs: 29 },
  { number: 58, name: 'Al-Mujadila', nameAr: 'المجادلة', ayahs: 22 },
  { number: 59, name: 'Al-Hashr', nameAr: 'الحشر', ayahs: 24 },
  { number: 60, name: 'Al-Mumtahanah', nameAr: 'الممتحنة', ayahs: 13 },
  { number: 61, name: 'As-Saf', nameAr: 'الصف', ayahs: 14 },
  { number: 62, name: 'Al-Jumuah', nameAr: 'الجمعة', ayahs: 11 },
  { number: 63, name: 'Al-Munafiqun', nameAr: 'المنافقون', ayahs: 11 },
  { number: 64, name: 'At-Taghabun', nameAr: 'التغابن', ayahs: 18 },
  { number: 65, name: 'At-Talaq', nameAr: 'الطلاق', ayahs: 12 },
  { number: 66, name: 'At-Tahrim', nameAr: 'التحريم', ayahs: 12 },
  { number: 67, name: 'Al-Mulk', nameAr: 'الملك', ayahs: 30 },
  { number: 68, name: 'Al-Qalam', nameAr: 'القلم', ayahs: 52 },
  { number: 69, name: 'Al-Haqqah', nameAr: 'الحاقة', ayahs: 52 },
  { number: 70, name: 'Al-Maarij', nameAr: 'المعارج', ayahs: 44 },
  { number: 71, name: 'Nuh', nameAr: 'نوح', ayahs: 28 },
  { number: 72, name: 'Al-Jinn', nameAr: 'الجن', ayahs: 28 },
  { number: 73, name: 'Al-Muzzammil', nameAr: 'المزمل', ayahs: 20 },
  { number: 74, name: 'Al-Muddaththir', nameAr: 'المدثر', ayahs: 56 },
  { number: 75, name: 'Al-Qiyamah', nameAr: 'القيامة', ayahs: 40 },
  { number: 76, name: 'Al-Insan', nameAr: 'الانسان', ayahs: 31 },
  { number: 77, name: 'Al-Mursalat', nameAr: 'المرسلات', ayahs: 50 },
  { number: 78, name: 'An-Naba', nameAr: 'النبأ', ayahs: 40 },
  { number: 79, name: 'An-Naziat', nameAr: 'النازعات', ayahs: 46 },
  { number: 80, name: 'Abasa', nameAr: 'عبس', ayahs: 42 },
  { number: 81, name: 'At-Takwir', nameAr: 'التكوير', ayahs: 29 },
  { number: 82, name: 'Al-Infitar', nameAr: 'الإنفطار', ayahs: 19 },
  { number: 83, name: 'Al-Mutaffifin', nameAr: 'المطففين', ayahs: 36 },
  { number: 84, name: 'Al-Inshiqaq', nameAr: 'الإنشقاق', ayahs: 25 },
  { number: 85, name: 'Al-Buruj', nameAr: 'البروج', ayahs: 22 },
  { number: 86, name: 'At-Tariq', nameAr: 'الطارق', ayahs: 17 },
  { number: 87, name: 'Al-Ala', nameAr: 'الأعلى', ayahs: 19 },
  { number: 88, name: 'Al-Ghashiyah', nameAr: 'الغاشية', ayahs: 26 },
  { number: 89, name: 'Al-Fajr', nameAr: 'الفجر', ayahs: 30 },
  { number: 90, name: 'Al-Balad', nameAr: 'البلد', ayahs: 20 },
  { number: 91, name: 'Ash-Shams', nameAr: 'الشمس', ayahs: 15 },
  { number: 92, name: 'Al-Layl', nameAr: 'الليل', ayahs: 21 },
  { number: 93, name: 'Ad-Duha', nameAr: 'الضحى', ayahs: 11 },
  { number: 94, name: 'Ash-Sharh', nameAr: 'الشرح', ayahs: 8 },
  { number: 95, name: 'At-Tin', nameAr: 'التين', ayahs: 8 },
  { number: 96, name: 'Al-Alaq', nameAr: 'العلق', ayahs: 19 },
  { number: 97, name: 'Al-Qadr', nameAr: 'القدر', ayahs: 5 },
  { number: 98, name: 'Al-Bayyinah', nameAr: 'البينة', ayahs: 8 },
  { number: 99, name: 'Az-Zalzalah', nameAr: 'الزلزلة', ayahs: 8 },
  { number: 100, name: 'Al-Adiyat', nameAr: 'العاديات', ayahs: 11 },
  { number: 101, name: 'Al-Qariah', nameAr: 'القارعة', ayahs: 11 },
  { number: 102, name: 'At-Takathur', nameAr: 'التكاثر', ayahs: 8 },
  { number: 103, name: 'Al-Asr', nameAr: 'العصر', ayahs: 3 },
  { number: 104, name: 'Al-Humazah', nameAr: 'الهمزة', ayahs: 9 },
  { number: 105, name: 'Al-Fil', nameAr: 'الفيل', ayahs: 5 },
  { number: 106, name: 'Quraysh', nameAr: 'قريش', ayahs: 4 },
  { number: 107, name: 'Al-Maun', nameAr: 'الماعون', ayahs: 7 },
  { number: 108, name: 'Al-Kawthar', nameAr: 'الكوثر', ayahs: 3 },
  { number: 109, name: 'Al-Kafirun', nameAr: 'الكافرون', ayahs: 6 },
  { number: 110, name: 'An-Nasr', nameAr: 'النصر', ayahs: 3 },
  { number: 111, name: 'Al-Masad', nameAr: 'المسد', ayahs: 5 },
  { number: 112, name: 'Al-Ikhlas', nameAr: 'الإخلاص', ayahs: 4 },
  { number: 113, name: 'Al-Falaq', nameAr: 'الفلق', ayahs: 5 },
  { number: 114, name: 'An-Nas', nameAr: 'الناس', ayahs: 6 },
];

interface ProgressRecord {
  id: string;
  topic: string;
  understanding_complete: boolean;
  fluency_complete: boolean;
  memorization_complete: boolean;
  teacher_notes: string | null;
  understanding_range: string | null;
  fluency_notes: string | null;
  memorization_range: string | null;
}

interface StudentProgressPanelProps {
  studentId: string;
  studentName: string;
  subjectId: string;
  subjectName: string;
  onNotesUpdate?: () => void;
}

// Juz groupings for batch selection
const JUZ_GROUPS = [
  { name: "Juz 30 (Amma)", start: 78, end: 114 },
  { name: "Juz 29 (Tabarak)", start: 67, end: 77 },
  { name: "Juz 28 (Qad Sami'a)", start: 58, end: 66 },
  { name: "Last 10 Surahs", start: 105, end: 114 },
  { name: "Last 5 Surahs", start: 110, end: 114 },
];

export default function StudentProgressPanel({
  studentId,
  onNotesUpdate,
}: StudentProgressPanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [progress, setProgress] = useState<ProgressRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedSurah, setSelectedSurah] = useState<number | null>(null);
  const [editingNotes, setEditingNotes] = useState(false);
  const [notesText, setNotesText] = useState('');
  const [saving, setSaving] = useState(false);

  // Batch mode state
  const [batchMode, setBatchMode] = useState(false);
  const [selectedSurahs, setSelectedSurahs] = useState<Set<number>>(new Set());
  const [batchSaving, setBatchSaving] = useState(false);

  useEffect(() => {
    if (isExpanded) {
      loadProgress();
    }
  }, [isExpanded, studentId]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('lesson_progress_tracker')
        .select('*')
        .eq('learner_id', studentId);

      if (error) throw error;
      setProgress(data || []);
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressForSurah = (surahNumber: number) => {
    const surahName = SURAHS[surahNumber - 1]?.name || '';
    return progress.find(p =>
      p.topic.toLowerCase().includes(surahName.toLowerCase()) ||
      p.topic.includes(`Surah ${surahNumber}`) ||
      p.topic === `Surah ${surahNumber}`
    );
  };

  const calculateOverallProgress = () => {
    let understood = 0;
    let fluent = 0;
    let memorized = 0;

    progress.forEach(p => {
      if (p.understanding_complete) understood++;
      if (p.fluency_complete) fluent++;
      if (p.memorization_complete) memorized++;
    });

    return {
      understood,
      fluent,
      memorized,
      total: 114,
      understoodPercent: Math.round((understood / 114) * 100),
      fluentPercent: Math.round((fluent / 114) * 100),
      memorizedPercent: Math.round((memorized / 114) * 100),
    };
  };

  const handleSaveNotes = async (surahNumber: number) => {
    const surah = SURAHS[surahNumber - 1];
    if (!surah) return;

    setSaving(true);
    try {
      const existingProgress = getProgressForSurah(surahNumber);

      if (existingProgress) {
        // Update existing record
        const { error } = await supabase
          .from('lesson_progress_tracker')
          .update({ teacher_notes: notesText })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new record
        // We need to get the subject ID for Quran
        const { data: subjectData } = await supabase
          .from('subjects')
          .select('id')
          .ilike('name', '%quran%')
          .single();

        const { error } = await supabase
          .from('lesson_progress_tracker')
          .insert({
            learner_id: studentId,
            subject_id: subjectData?.id,
            topic: `Surah ${surah.name}`,
            teacher_notes: notesText,
          });

        if (error) throw error;
      }

      await loadProgress();
      setEditingNotes(false);
      onNotesUpdate?.();
    } catch (error: any) {
      console.error('Error saving notes:', error);
      toast.error('Failed to save notes: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStage = async (surahNumber: number, stage: 'understanding' | 'fluency' | 'memorization') => {
    const surah = SURAHS[surahNumber - 1];
    if (!surah) return;

    const existingProgress = getProgressForSurah(surahNumber);
    const fieldName = `${stage}_complete`;

    try {
      if (existingProgress) {
        const { error } = await supabase
          .from('lesson_progress_tracker')
          .update({ [fieldName]: !existingProgress[fieldName as keyof ProgressRecord] })
          .eq('id', existingProgress.id);

        if (error) throw error;
      } else {
        // Create new record with this stage marked
        const { data: subjectData } = await supabase
          .from('subjects')
          .select('id')
          .ilike('name', '%quran%')
          .single();

        const { error } = await supabase
          .from('lesson_progress_tracker')
          .insert({
            learner_id: studentId,
            subject_id: subjectData?.id,
            topic: `Surah ${surah.name}`,
            [fieldName]: true,
          });

        if (error) throw error;
      }

      await loadProgress();
    } catch (error: any) {
      console.error('Error updating progress:', error);
      toast.error('Failed to update progress: ' + error.message);
    }
  };

  // Toggle surah selection for batch mode
  const toggleSurahSelection = (surahNumber: number) => {
    const newSelected = new Set(selectedSurahs);
    if (newSelected.has(surahNumber)) {
      newSelected.delete(surahNumber);
    } else {
      newSelected.add(surahNumber);
    }
    setSelectedSurahs(newSelected);
  };

  // Select a range of surahs (for Juz selection)
  const selectSurahRange = (start: number, end: number) => {
    const newSelected = new Set(selectedSurahs);
    for (let i = start; i <= end; i++) {
      newSelected.add(i);
    }
    setSelectedSurahs(newSelected);
  };

  // Clear all selections
  const clearSelection = () => {
    setSelectedSurahs(new Set());
  };

  // Batch update selected surahs
  const handleBatchUpdate = async (stage: 'understanding' | 'fluency' | 'memorization', value: boolean) => {
    if (selectedSurahs.size === 0) {
      toast.error('Please select at least one surah');
      return;
    }

    setBatchSaving(true);
    const fieldName = `${stage}_complete`;

    try {
      // Get subject ID for Quran
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('id')
        .ilike('name', '%quran%')
        .single();

      const updates: Promise<void>[] = [];

      for (const surahNumber of selectedSurahs) {
        const surah = SURAHS[surahNumber - 1];
        if (!surah) continue;

        const existingProgress = getProgressForSurah(surahNumber);

        if (existingProgress) {
          // Update existing record
          updates.push(
            supabase
              .from('lesson_progress_tracker')
              .update({ [fieldName]: value })
              .eq('id', existingProgress.id)
              .then(({ error }) => {
                if (error) throw error;
              })
          );
        } else if (value) {
          // Only create new record if setting to true
          updates.push(
            supabase
              .from('lesson_progress_tracker')
              .insert({
                learner_id: studentId,
                subject_id: subjectData?.id,
                topic: `Surah ${surah.name}`,
                [fieldName]: true,
              })
              .then(({ error }) => {
                if (error) throw error;
              })
          );
        }
      }

      await Promise.all(updates);
      await loadProgress();

      const stageLabel = stage === 'understanding' ? 'Understanding' : stage === 'fluency' ? 'Fluency' : 'Memorisation';
      toast.success(`Updated ${stageLabel} for ${selectedSurahs.size} surahs`);

      // Clear selection after successful batch update
      setSelectedSurahs(new Set());
      setBatchMode(false);
    } catch (error: any) {
      console.error('Error in batch update:', error);
      toast.error('Failed to update: ' + error.message);
    } finally {
      setBatchSaving(false);
    }
  };

  const stats = calculateOverallProgress();

  return (
    <div className="mt-4 border-t border-gray-200 pt-4">
      {/* Expandable Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-3 bg-gray-50 hover:bg-gray-100 rounded-lg transition"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-emerald-400" />
          <span className="font-medium text-white">Quran Progress Tracker</span>
          {progress.length > 0 && (
            <span className="text-xs px-2 py-0.5 bg-orange-500/20 text-orange-400 rounded-full">
              {stats.memorizedPercent}% memorised
            </span>
          )}
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="mt-4 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* Progress Summary - Two Circular Progress Indicators */}
              <div className="grid grid-cols-2 gap-4">
                {/* Understanding Progress Circle */}
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-2">
                    {/* Background circle */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-blue-900/30"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${stats.understoodPercent} 100`}
                        className="text-blue-400"
                      />
                    </svg>
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Brain className="w-4 h-4 text-blue-400 mb-0.5" />
                      <span className="text-lg font-bold text-blue-400">{stats.understoodPercent}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-blue-300">Understanding</p>
                  <p className="text-xs text-blue-400/70">{stats.understood}/114 surahs</p>
                </div>

                {/* Memorisation Progress Circle */}
                <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4 flex flex-col items-center">
                  <div className="relative w-20 h-20 mb-2">
                    {/* Background circle */}
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        className="text-orange-900/30"
                      />
                      {/* Progress circle */}
                      <circle
                        cx="18"
                        cy="18"
                        r="15.5"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={`${stats.memorizedPercent} 100`}
                        className="text-orange-400"
                      />
                    </svg>
                    {/* Center content */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <Heart className="w-4 h-4 text-orange-400 mb-0.5" />
                      <span className="text-lg font-bold text-orange-400">{stats.memorizedPercent}%</span>
                    </div>
                  </div>
                  <p className="text-sm font-medium text-orange-300">Memorised</p>
                  <p className="text-xs text-orange-400/70">{stats.memorized}/114 surahs</p>
                </div>
              </div>

              {/* Batch Mode Toggle and Actions */}
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <button
                  onClick={() => {
                    setBatchMode(!batchMode);
                    if (batchMode) {
                      setSelectedSurahs(new Set());
                    }
                    setSelectedSurah(null);
                  }}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition ${
                    batchMode
                      ? 'bg-amber-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  {batchMode ? 'Exit Batch Mode' : 'Batch Update'}
                </button>

                {batchMode && (
                  <>
                    <span className="text-xs text-gray-500">|</span>
                    <span className="text-xs text-amber-600 font-medium">
                      {selectedSurahs.size} selected
                    </span>
                    {selectedSurahs.size > 0 && (
                      <button
                        onClick={clearSelection}
                        className="text-xs text-gray-500 hover:text-gray-700 underline"
                      >
                        Clear
                      </button>
                    )}
                  </>
                )}
              </div>

              {/* Batch Quick Select (Juz Groups) */}
              {batchMode && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-3">
                  <p className="text-xs font-medium text-amber-800 mb-2">Quick Select:</p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {JUZ_GROUPS.map((group) => (
                      <button
                        key={group.name}
                        onClick={() => selectSurahRange(group.start, group.end)}
                        className="px-2 py-1 text-xs bg-amber-100 hover:bg-amber-200 text-amber-800 rounded transition"
                      >
                        {group.name}
                      </button>
                    ))}
                  </div>

                  {/* Batch Actions */}
                  {selectedSurahs.size > 0 && (
                    <div className="border-t border-amber-200 pt-3 mt-2">
                      <p className="text-xs font-medium text-amber-800 mb-2">
                        Apply to {selectedSurahs.size} surahs:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => handleBatchUpdate('understanding', true)}
                          disabled={batchSaving}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                          <Brain className="w-3 h-3" />
                          Mark Understanding
                        </button>
                        <button
                          onClick={() => handleBatchUpdate('fluency', true)}
                          disabled={batchSaving}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition disabled:opacity-50"
                        >
                          <Volume2 className="w-3 h-3" />
                          Mark Fluency
                        </button>
                        <button
                          onClick={() => handleBatchUpdate('memorization', true)}
                          disabled={batchSaving}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition disabled:opacity-50"
                        >
                          <Heart className="w-3 h-3" />
                          Mark Memorised
                        </button>
                        <span className="text-gray-300">|</span>
                        <button
                          onClick={() => handleBatchUpdate('understanding', false)}
                          disabled={batchSaving}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                        >
                          Clear Understanding
                        </button>
                        <button
                          onClick={() => handleBatchUpdate('fluency', false)}
                          disabled={batchSaving}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                        >
                          Clear Fluency
                        </button>
                        <button
                          onClick={() => handleBatchUpdate('memorization', false)}
                          disabled={batchSaving}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-500 hover:bg-gray-600 text-white rounded-lg transition disabled:opacity-50"
                        >
                          Clear Memorised
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Surah Grid - show last 30 (Juz Amma) by default for quick access */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-gray-500">Juz Amma (78-114)</h4>
                <div className="grid grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-2">
                  {SURAHS.slice(77).map((surah) => {
                    const surahProgress = getProgressForSurah(surah.number);
                    const hasAnyProgress = surahProgress && (
                      surahProgress.understanding_complete ||
                      surahProgress.fluency_complete ||
                      surahProgress.memorization_complete
                    );
                    const isComplete = surahProgress?.memorization_complete;
                    const isSelected = selectedSurahs.has(surah.number);

                    return (
                      <button
                        key={surah.number}
                        onClick={() => {
                          if (batchMode) {
                            toggleSurahSelection(surah.number);
                          } else {
                            setSelectedSurah(selectedSurah === surah.number ? null : surah.number);
                            setNotesText(surahProgress?.teacher_notes || '');
                            setEditingNotes(false);
                          }
                        }}
                        className={`p-2 rounded-lg text-center transition relative ${
                          batchMode && isSelected
                            ? 'bg-amber-500 ring-2 ring-amber-300'
                            : selectedSurah === surah.number
                            ? 'bg-emerald-600 ring-2 ring-emerald-400'
                            : isComplete
                            ? 'bg-orange-500/50 hover:bg-orange-500'
                            : hasAnyProgress
                            ? 'bg-blue-600/50 hover:bg-blue-600'
                            : 'bg-gray-100 hover:bg-gray-200'
                        }`}
                        title={surah.name}
                      >
                        {batchMode && (
                          <span className="absolute -top-1 -right-1">
                            {isSelected ? (
                              <CheckSquare className="w-3 h-3 text-amber-200" />
                            ) : (
                              <Square className="w-3 h-3 text-gray-400" />
                            )}
                          </span>
                        )}
                        <span className="text-xs font-medium text-white">{surah.number}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Selected Surah Details */}
              {selectedSurah && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                  {(() => {
                    const surah = SURAHS[selectedSurah - 1];
                    const surahProgress = getProgressForSurah(selectedSurah);

                    return (
                      <div className="space-y-4">
                        {/* Surah Header */}
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-lg font-bold text-white">
                              {selectedSurah}. {surah.name}
                            </h4>
                            <p className="text-sm text-gray-500">
                              {surah.nameAr} • {surah.ayahs} ayahs
                            </p>
                          </div>
                          <button
                            onClick={() => setSelectedSurah(null)}
                            className="p-2 hover:bg-gray-200 rounded-lg transition"
                          >
                            <X className="w-4 h-4 text-gray-500" />
                          </button>
                        </div>

                        {/* Three Stage Toggles */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleToggleStage(selectedSurah, 'understanding')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                              surahProgress?.understanding_complete
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Brain className="w-4 h-4" />
                            <span className="text-sm">Understanding</span>
                            {surahProgress?.understanding_complete && <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleToggleStage(selectedSurah, 'fluency')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                              surahProgress?.fluency_complete
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Volume2 className="w-4 h-4" />
                            <span className="text-sm">Fluency</span>
                            {surahProgress?.fluency_complete && <Check className="w-4 h-4" />}
                          </button>
                          <button
                            onClick={() => handleToggleStage(selectedSurah, 'memorization')}
                            className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                              surahProgress?.memorization_complete
                                ? 'bg-orange-500 text-white'
                                : 'bg-gray-200 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            <Heart className="w-4 h-4" />
                            <span className="text-sm">Memorised</span>
                            {surahProgress?.memorization_complete && <Check className="w-4 h-4" />}
                          </button>
                        </div>

                        {/* Teacher Notes */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="text-sm font-medium text-gray-500">Teacher Notes</label>
                            {!editingNotes && (
                              <button
                                onClick={() => {
                                  setEditingNotes(true);
                                  setNotesText(surahProgress?.teacher_notes || '');
                                }}
                                className="flex items-center gap-1 text-xs text-emerald-600 hover:text-cyan-300 transition"
                              >
                                <Edit3 className="w-3 h-3" />
                                Edit
                              </button>
                            )}
                          </div>

                          {editingNotes ? (
                            <div className="space-y-2">
                              <textarea
                                value={notesText}
                                onChange={(e) => setNotesText(e.target.value)}
                                placeholder="Add notes about student's progress on this surah..."
                                className="w-full px-3 py-2 bg-gray-200 border border-gray-300 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                                rows={3}
                              />
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleSaveNotes(selectedSurah)}
                                  disabled={saving}
                                  className="flex-1 flex items-center justify-center gap-2 py-2 bg-emerald-600 hover:bg-cyan-700 text-white rounded-lg transition disabled:opacity-50"
                                >
                                  <Save className="w-4 h-4" />
                                  {saving ? 'Saving...' : 'Save Notes'}
                                </button>
                                <button
                                  onClick={() => setEditingNotes(false)}
                                  className="px-4 py-2 bg-gray-200 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="bg-gray-100 rounded-lg p-3 min-h-[60px]">
                              {surahProgress?.teacher_notes ? (
                                <p className="text-sm text-gray-600 whitespace-pre-wrap">
                                  {surahProgress.teacher_notes}
                                </p>
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  No notes yet. Click Edit to add notes.
                                </p>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
