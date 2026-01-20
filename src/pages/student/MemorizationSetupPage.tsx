import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Square,
  BookOpen,
  ArrowLeft,
  Save,
  Check,
  ChevronDown,
  ChevronUp,
  Brain,
  Volume2,
  Heart,
  ClipboardCheck,
  Play,
  X
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import DashboardHeader from '../../components/DashboardHeader';
import SurahUnderstandingQuiz from '../../components/SurahUnderstandingQuiz';

type TabType = 'memorisation' | 'fluency' | 'understanding';

interface Surah {
  number: number;
  nameEnglish: string;
  nameArabic: string;
  verses: number;
  juz: number[];
}

// Complete list of all 114 surahs
const ALL_SURAHS: Surah[] = [
  { number: 1, nameEnglish: 'Al-Fatihah', nameArabic: 'الفاتحة', verses: 7, juz: [1] },
  { number: 2, nameEnglish: 'Al-Baqarah', nameArabic: 'البقرة', verses: 286, juz: [1, 2, 3] },
  { number: 3, nameEnglish: 'Ali \'Imran', nameArabic: 'آل عمران', verses: 200, juz: [3, 4] },
  { number: 4, nameEnglish: 'An-Nisa', nameArabic: 'النساء', verses: 176, juz: [4, 5, 6] },
  { number: 5, nameEnglish: 'Al-Ma\'idah', nameArabic: 'المائدة', verses: 120, juz: [6, 7] },
  { number: 6, nameEnglish: 'Al-An\'am', nameArabic: 'الأنعام', verses: 165, juz: [7, 8] },
  { number: 7, nameEnglish: 'Al-A\'raf', nameArabic: 'الأعراف', verses: 206, juz: [8, 9] },
  { number: 8, nameEnglish: 'Al-Anfal', nameArabic: 'الأنفال', verses: 75, juz: [9, 10] },
  { number: 9, nameEnglish: 'At-Tawbah', nameArabic: 'التوبة', verses: 129, juz: [10, 11] },
  { number: 10, nameEnglish: 'Yunus', nameArabic: 'يونس', verses: 109, juz: [11] },
  { number: 11, nameEnglish: 'Hud', nameArabic: 'هود', verses: 123, juz: [11, 12] },
  { number: 12, nameEnglish: 'Yusuf', nameArabic: 'يوسف', verses: 111, juz: [12, 13] },
  { number: 13, nameEnglish: 'Ar-Ra\'d', nameArabic: 'الرعد', verses: 43, juz: [13] },
  { number: 14, nameEnglish: 'Ibrahim', nameArabic: 'إبراهيم', verses: 52, juz: [13] },
  { number: 15, nameEnglish: 'Al-Hijr', nameArabic: 'الحجر', verses: 99, juz: [14] },
  { number: 16, nameEnglish: 'An-Nahl', nameArabic: 'النحل', verses: 128, juz: [14] },
  { number: 17, nameEnglish: 'Al-Isra', nameArabic: 'الإسراء', verses: 111, juz: [15] },
  { number: 18, nameEnglish: 'Al-Kahf', nameArabic: 'الكهف', verses: 110, juz: [15, 16] },
  { number: 19, nameEnglish: 'Maryam', nameArabic: 'مريم', verses: 98, juz: [16] },
  { number: 20, nameEnglish: 'Ta-Ha', nameArabic: 'طه', verses: 135, juz: [16] },
  { number: 21, nameEnglish: 'Al-Anbiya', nameArabic: 'الأنبياء', verses: 112, juz: [17] },
  { number: 22, nameEnglish: 'Al-Hajj', nameArabic: 'الحج', verses: 78, juz: [17] },
  { number: 23, nameEnglish: 'Al-Mu\'minun', nameArabic: 'المؤمنون', verses: 118, juz: [18] },
  { number: 24, nameEnglish: 'An-Nur', nameArabic: 'النور', verses: 64, juz: [18] },
  { number: 25, nameEnglish: 'Al-Furqan', nameArabic: 'الفرقان', verses: 77, juz: [18, 19] },
  { number: 26, nameEnglish: 'Ash-Shu\'ara', nameArabic: 'الشعراء', verses: 227, juz: [19] },
  { number: 27, nameEnglish: 'An-Naml', nameArabic: 'النمل', verses: 93, juz: [19, 20] },
  { number: 28, nameEnglish: 'Al-Qasas', nameArabic: 'القصص', verses: 88, juz: [20] },
  { number: 29, nameEnglish: 'Al-Ankabut', nameArabic: 'العنكبوت', verses: 69, juz: [20, 21] },
  { number: 30, nameEnglish: 'Ar-Rum', nameArabic: 'الروم', verses: 60, juz: [21] },
  { number: 31, nameEnglish: 'Luqman', nameArabic: 'لقمان', verses: 34, juz: [21] },
  { number: 32, nameEnglish: 'As-Sajdah', nameArabic: 'السجدة', verses: 30, juz: [21] },
  { number: 33, nameEnglish: 'Al-Ahzab', nameArabic: 'الأحزاب', verses: 73, juz: [21, 22] },
  { number: 34, nameEnglish: 'Saba', nameArabic: 'سبأ', verses: 54, juz: [22] },
  { number: 35, nameEnglish: 'Fatir', nameArabic: 'فاطر', verses: 45, juz: [22] },
  { number: 36, nameEnglish: 'Ya-Sin', nameArabic: 'يس', verses: 83, juz: [22, 23] },
  { number: 37, nameEnglish: 'As-Saffat', nameArabic: 'الصافات', verses: 182, juz: [23] },
  { number: 38, nameEnglish: 'Sad', nameArabic: 'ص', verses: 88, juz: [23] },
  { number: 39, nameEnglish: 'Az-Zumar', nameArabic: 'الزمر', verses: 75, juz: [23, 24] },
  { number: 40, nameEnglish: 'Ghafir', nameArabic: 'غافر', verses: 85, juz: [24] },
  { number: 41, nameEnglish: 'Fussilat', nameArabic: 'فصلت', verses: 54, juz: [24, 25] },
  { number: 42, nameEnglish: 'Ash-Shura', nameArabic: 'الشورى', verses: 53, juz: [25] },
  { number: 43, nameEnglish: 'Az-Zukhruf', nameArabic: 'الزخرف', verses: 89, juz: [25] },
  { number: 44, nameEnglish: 'Ad-Dukhan', nameArabic: 'الدخان', verses: 59, juz: [25] },
  { number: 45, nameEnglish: 'Al-Jathiyah', nameArabic: 'الجاثية', verses: 37, juz: [25] },
  { number: 46, nameEnglish: 'Al-Ahqaf', nameArabic: 'الأحقاف', verses: 35, juz: [26] },
  { number: 47, nameEnglish: 'Muhammad', nameArabic: 'محمد', verses: 38, juz: [26] },
  { number: 48, nameEnglish: 'Al-Fath', nameArabic: 'الفتح', verses: 29, juz: [26] },
  { number: 49, nameEnglish: 'Al-Hujurat', nameArabic: 'الحجرات', verses: 18, juz: [26] },
  { number: 50, nameEnglish: 'Qaf', nameArabic: 'ق', verses: 45, juz: [26] },
  { number: 51, nameEnglish: 'Adh-Dhariyat', nameArabic: 'الذاريات', verses: 60, juz: [26, 27] },
  { number: 52, nameEnglish: 'At-Tur', nameArabic: 'الطور', verses: 49, juz: [27] },
  { number: 53, nameEnglish: 'An-Najm', nameArabic: 'النجم', verses: 62, juz: [27] },
  { number: 54, nameEnglish: 'Al-Qamar', nameArabic: 'القمر', verses: 55, juz: [27] },
  { number: 55, nameEnglish: 'Ar-Rahman', nameArabic: 'الرحمن', verses: 78, juz: [27] },
  { number: 56, nameEnglish: 'Al-Waqi\'ah', nameArabic: 'الواقعة', verses: 96, juz: [27] },
  { number: 57, nameEnglish: 'Al-Hadid', nameArabic: 'الحديد', verses: 29, juz: [27] },
  { number: 58, nameEnglish: 'Al-Mujadila', nameArabic: 'المجادلة', verses: 22, juz: [28] },
  { number: 59, nameEnglish: 'Al-Hashr', nameArabic: 'الحشر', verses: 24, juz: [28] },
  { number: 60, nameEnglish: 'Al-Mumtahanah', nameArabic: 'الممتحنة', verses: 13, juz: [28] },
  { number: 61, nameEnglish: 'As-Saff', nameArabic: 'الصف', verses: 14, juz: [28] },
  { number: 62, nameEnglish: 'Al-Jumu\'ah', nameArabic: 'الجمعة', verses: 11, juz: [28] },
  { number: 63, nameEnglish: 'Al-Munafiqun', nameArabic: 'المنافقون', verses: 11, juz: [28] },
  { number: 64, nameEnglish: 'At-Taghabun', nameArabic: 'التغابن', verses: 18, juz: [28] },
  { number: 65, nameEnglish: 'At-Talaq', nameArabic: 'الطلاق', verses: 12, juz: [28] },
  { number: 66, nameEnglish: 'At-Tahrim', nameArabic: 'التحريم', verses: 12, juz: [28] },
  { number: 67, nameEnglish: 'Al-Mulk', nameArabic: 'الملك', verses: 30, juz: [29] },
  { number: 68, nameEnglish: 'Al-Qalam', nameArabic: 'القلم', verses: 52, juz: [29] },
  { number: 69, nameEnglish: 'Al-Haqqah', nameArabic: 'الحاقة', verses: 52, juz: [29] },
  { number: 70, nameEnglish: 'Al-Ma\'arij', nameArabic: 'المعارج', verses: 44, juz: [29] },
  { number: 71, nameEnglish: 'Nuh', nameArabic: 'نوح', verses: 28, juz: [29] },
  { number: 72, nameEnglish: 'Al-Jinn', nameArabic: 'الجن', verses: 28, juz: [29] },
  { number: 73, nameEnglish: 'Al-Muzzammil', nameArabic: 'المزمل', verses: 20, juz: [29] },
  { number: 74, nameEnglish: 'Al-Muddaththir', nameArabic: 'المدثر', verses: 56, juz: [29] },
  { number: 75, nameEnglish: 'Al-Qiyamah', nameArabic: 'القيامة', verses: 40, juz: [29] },
  { number: 76, nameEnglish: 'Al-Insan', nameArabic: 'الإنسان', verses: 31, juz: [29] },
  { number: 77, nameEnglish: 'Al-Mursalat', nameArabic: 'المرسلات', verses: 50, juz: [29] },
  { number: 78, nameEnglish: 'An-Naba', nameArabic: 'النبأ', verses: 40, juz: [30] },
  { number: 79, nameEnglish: 'An-Nazi\'at', nameArabic: 'النازعات', verses: 46, juz: [30] },
  { number: 80, nameEnglish: 'Abasa', nameArabic: 'عبس', verses: 42, juz: [30] },
  { number: 81, nameEnglish: 'At-Takwir', nameArabic: 'التكوير', verses: 29, juz: [30] },
  { number: 82, nameEnglish: 'Al-Infitar', nameArabic: 'الانفطار', verses: 19, juz: [30] },
  { number: 83, nameEnglish: 'Al-Mutaffifin', nameArabic: 'المطففين', verses: 36, juz: [30] },
  { number: 84, nameEnglish: 'Al-Inshiqaq', nameArabic: 'الانشقاق', verses: 25, juz: [30] },
  { number: 85, nameEnglish: 'Al-Buruj', nameArabic: 'البروج', verses: 22, juz: [30] },
  { number: 86, nameEnglish: 'At-Tariq', nameArabic: 'الطارق', verses: 17, juz: [30] },
  { number: 87, nameEnglish: 'Al-A\'la', nameArabic: 'الأعلى', verses: 19, juz: [30] },
  { number: 88, nameEnglish: 'Al-Ghashiyah', nameArabic: 'الغاشية', verses: 26, juz: [30] },
  { number: 89, nameEnglish: 'Al-Fajr', nameArabic: 'الفجر', verses: 30, juz: [30] },
  { number: 90, nameEnglish: 'Al-Balad', nameArabic: 'البلد', verses: 20, juz: [30] },
  { number: 91, nameEnglish: 'Ash-Shams', nameArabic: 'الشمس', verses: 15, juz: [30] },
  { number: 92, nameEnglish: 'Al-Layl', nameArabic: 'الليل', verses: 21, juz: [30] },
  { number: 93, nameEnglish: 'Ad-Duhaa', nameArabic: 'الضحى', verses: 11, juz: [30] },
  { number: 94, nameEnglish: 'Ash-Sharh', nameArabic: 'الشرح', verses: 8, juz: [30] },
  { number: 95, nameEnglish: 'At-Tin', nameArabic: 'التين', verses: 8, juz: [30] },
  { number: 96, nameEnglish: 'Al-\'Alaq', nameArabic: 'العلق', verses: 19, juz: [30] },
  { number: 97, nameEnglish: 'Al-Qadr', nameArabic: 'القدر', verses: 5, juz: [30] },
  { number: 98, nameEnglish: 'Al-Bayyinah', nameArabic: 'البينة', verses: 8, juz: [30] },
  { number: 99, nameEnglish: 'Az-Zalzalah', nameArabic: 'الزلزلة', verses: 8, juz: [30] },
  { number: 100, nameEnglish: 'Al-\'Adiyat', nameArabic: 'العاديات', verses: 11, juz: [30] },
  { number: 101, nameEnglish: 'Al-Qari\'ah', nameArabic: 'القارعة', verses: 11, juz: [30] },
  { number: 102, nameEnglish: 'At-Takathur', nameArabic: 'التكاثر', verses: 8, juz: [30] },
  { number: 103, nameEnglish: 'Al-\'Asr', nameArabic: 'العصر', verses: 3, juz: [30] },
  { number: 104, nameEnglish: 'Al-Humazah', nameArabic: 'الهمزة', verses: 9, juz: [30] },
  { number: 105, nameEnglish: 'Al-Fil', nameArabic: 'الفيل', verses: 5, juz: [30] },
  { number: 106, nameEnglish: 'Quraysh', nameArabic: 'قريش', verses: 4, juz: [30] },
  { number: 107, nameEnglish: 'Al-Ma\'un', nameArabic: 'الماعون', verses: 7, juz: [30] },
  { number: 108, nameEnglish: 'Al-Kawthar', nameArabic: 'الكوثر', verses: 3, juz: [30] },
  { number: 109, nameEnglish: 'Al-Kafirun', nameArabic: 'الكافرون', verses: 6, juz: [30] },
  { number: 110, nameEnglish: 'An-Nasr', nameArabic: 'النصر', verses: 3, juz: [30] },
  { number: 111, nameEnglish: 'Al-Masad', nameArabic: 'المسد', verses: 5, juz: [30] },
  { number: 112, nameEnglish: 'Al-Ikhlas', nameArabic: 'الإخلاص', verses: 4, juz: [30] },
  { number: 113, nameEnglish: 'Al-Falaq', nameArabic: 'الفلق', verses: 5, juz: [30] },
  { number: 114, nameEnglish: 'An-Nas', nameArabic: 'الناس', verses: 6, juz: [30] },
];

// Quick select presets
const QUICK_SELECTS = [
  { label: 'Juz Amma (78-114)', surahs: Array.from({ length: 37 }, (_, i) => 78 + i) },
  { label: 'Last 10 Surahs (105-114)', surahs: Array.from({ length: 10 }, (_, i) => 105 + i) },
  { label: 'Al-Fatihah + Last 3', surahs: [1, 112, 113, 114] },
  { label: 'Common Surahs (Mulk, Kahf, Yaseen)', surahs: [36, 18, 67] },
];

export default function MemorizationSetupPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('memorisation');
  const [selectedSurahs, setSelectedSurahs] = useState<Set<number>>(new Set());
  const [fluencySurahs, setFluencySurahs] = useState<Set<number>>(new Set());
  const [understandingSurahs, setUnderstandingSurahs] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [learnerId, setLearnerId] = useState<string | null>(null);
  const [expandedJuz, setExpandedJuz] = useState<number | null>(30); // Start with Juz 30 expanded
  const [quizSurah, setQuizSurah] = useState<number | null>(null);

  // Surahs that have quizzes available
  const SURAHS_WITH_QUIZZES = [1, 112, 113, 114, 36, 67, 18];

  useEffect(() => {
    loadExistingData();
  }, []);

  async function loadExistingData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      // Get learner
      const { data: learner } = await supabase
        .from('learners')
        .select('id')
        .eq('parent_id', user.id)
        .maybeSingle();

      const targetLearnerId = learner?.id || user.id;
      setLearnerId(targetLearnerId);

      // Load existing memorized surahs
      const { data: memorized } = await supabase
        .from('surah_retention_tracker')
        .select('surah_number')
        .eq('learner_id', targetLearnerId)
        .eq('memorization_status', 'memorized');

      if (memorized) {
        setSelectedSurahs(new Set(memorized.map(s => s.surah_number)));

        // Try to load fluency/understanding data if columns exist
        try {
          const { data: extendedData } = await supabase
            .from('surah_retention_tracker')
            .select('surah_number, fluency_complete, understanding_complete')
            .eq('learner_id', targetLearnerId)
            .eq('memorization_status', 'memorized');

          if (extendedData) {
            setFluencySurahs(new Set(extendedData.filter(s => s.fluency_complete).map(s => s.surah_number)));
            setUnderstandingSurahs(new Set(extendedData.filter(s => s.understanding_complete).map(s => s.surah_number)));
          }
        } catch {
          // Columns may not exist yet - use empty sets
          setFluencySurahs(new Set());
          setUnderstandingSurahs(new Set());
        }
      }
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get current selection based on active tab
  function getCurrentSelection(): Set<number> {
    switch (activeTab) {
      case 'fluency': return fluencySurahs;
      case 'understanding': return understandingSurahs;
      default: return selectedSurahs;
    }
  }

  // Set selection for current tab
  function setCurrentSelection(newSet: Set<number>) {
    switch (activeTab) {
      case 'fluency': setFluencySurahs(newSet); break;
      case 'understanding': setUnderstandingSurahs(newSet); break;
      default: setSelectedSurahs(newSet); break;
    }
  }

  function toggleSurah(surahNumber: number) {
    const setter = activeTab === 'fluency' ? setFluencySurahs :
                   activeTab === 'understanding' ? setUnderstandingSurahs :
                   setSelectedSurahs;
    setter(prev => {
      const newSet = new Set(prev);
      if (newSet.has(surahNumber)) {
        newSet.delete(surahNumber);
      } else {
        newSet.add(surahNumber);
      }
      return newSet;
    });
  }

  function selectRange(start: number, end: number) {
    const setter = activeTab === 'fluency' ? setFluencySurahs :
                   activeTab === 'understanding' ? setUnderstandingSurahs :
                   setSelectedSurahs;
    setter(prev => {
      const newSet = new Set(prev);
      for (let i = start; i <= end; i++) {
        newSet.add(i);
      }
      return newSet;
    });
  }

  function deselectRange(start: number, end: number) {
    const setter = activeTab === 'fluency' ? setFluencySurahs :
                   activeTab === 'understanding' ? setUnderstandingSurahs :
                   setSelectedSurahs;
    setter(prev => {
      const newSet = new Set(prev);
      for (let i = start; i <= end; i++) {
        newSet.delete(i);
      }
      return newSet;
    });
  }

  function applyQuickSelect(surahs: number[]) {
    const setter = activeTab === 'fluency' ? setFluencySurahs :
                   activeTab === 'understanding' ? setUnderstandingSurahs :
                   setSelectedSurahs;
    setter(prev => {
      const newSet = new Set(prev);
      surahs.forEach(s => newSet.add(s));
      return newSet;
    });
  }

  function clearCurrentSelection() {
    const setter = activeTab === 'fluency' ? setFluencySurahs :
                   activeTab === 'understanding' ? setUnderstandingSurahs :
                   setSelectedSurahs;
    setter(new Set());
  }

  function selectAll() {
    const setter = activeTab === 'fluency' ? setFluencySurahs :
                   activeTab === 'understanding' ? setUnderstandingSurahs :
                   setSelectedSurahs;
    setter(new Set(ALL_SURAHS.map(s => s.number)));
  }

  async function saveSelection() {
    if (!learnerId) return;
    setSaving(true);

    try {
      const today = new Date().toISOString();

      // Build records for all memorised surahs
      // Only include base columns that definitely exist
      const records = Array.from(selectedSurahs).map(surah => ({
        learner_id: learnerId,
        surah_number: surah,
        memorization_status: 'memorized',
        memorization_completed_at: today,
        retention_score: 100,
        next_review_date: new Date().toISOString().split('T')[0],
        review_interval_days: 7,
        ease_factor: 2.5,
        consecutive_correct: 5
      }));

      // Upsert all selected surahs
      const { error } = await supabase
        .from('surah_retention_tracker')
        .upsert(records, {
          onConflict: 'learner_id,surah_number',
          ignoreDuplicates: false
        });

      if (error) throw error;

      // Try to update fluency/understanding columns if they exist
      // This is a separate update to handle cases where the columns may not exist yet
      for (const surahNum of selectedSurahs) {
        try {
          await supabase
            .from('surah_retention_tracker')
            .update({
              fluency_complete: fluencySurahs.has(surahNum),
              understanding_complete: understandingSurahs.has(surahNum)
            })
            .eq('learner_id', learnerId)
            .eq('surah_number', surahNum);
        } catch {
          // Columns may not exist yet - silently ignore
        }
      }

      // Delete unselected surahs
      const allSurahNumbers = ALL_SURAHS.map(s => s.number);
      const unselectedSurahs = allSurahNumbers.filter(n => !selectedSurahs.has(n));

      if (unselectedSurahs.length > 0) {
        await supabase
          .from('surah_retention_tracker')
          .delete()
          .eq('learner_id', learnerId)
          .in('surah_number', unselectedSurahs);
      }

      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving:', error);
      alert('Failed to save. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // Get tab info
  const tabInfo = {
    memorisation: { icon: Heart, label: 'Memorised', color: 'emerald', description: 'Surahs you have memorised' },
    fluency: { icon: Volume2, label: 'Fluency', color: 'blue', description: 'Surahs you can recite fluently with tajweed' },
    understanding: { icon: Brain, label: 'Understanding', color: 'purple', description: 'Surahs you understand the meaning of' }
  };

  const currentSelection = getCurrentSelection();

  // Group surahs by Juz - show surah in ALL its Juz sections
  const surahsByJuz = ALL_SURAHS.reduce((acc, surah) => {
    surah.juz.forEach(juzNum => {
      if (!acc[juzNum]) acc[juzNum] = [];
      // Only add if not already present (avoid duplicates)
      if (!acc[juzNum].find(s => s.number === surah.number)) {
        acc[juzNum].push(surah);
      }
    });
    return acc;
  }, {} as { [key: number]: Surah[] });

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  const currentTab = tabInfo[activeTab];
  const TabIcon = currentTab.icon;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <DashboardHeader />

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                My Qur'an Progress
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                Track your memorisation, fluency, and understanding
              </p>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-2 mb-6 flex gap-2">
          {(['memorisation', 'fluency', 'understanding'] as TabType[]).map((tab) => {
            const info = tabInfo[tab];
            const Icon = info.icon;
            const count = tab === 'memorisation' ? selectedSurahs.size :
                          tab === 'fluency' ? fluencySurahs.size : understandingSurahs.size;
            const isActive = activeTab === tab;
            const colorClasses = {
              emerald: isActive ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 border-emerald-500' : 'hover:bg-emerald-50 dark:hover:bg-emerald-900/20',
              blue: isActive ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border-blue-500' : 'hover:bg-blue-50 dark:hover:bg-blue-900/20',
              purple: isActive ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300 border-purple-500' : 'hover:bg-purple-50 dark:hover:bg-purple-900/20'
            };
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition border-2 ${
                  isActive ? colorClasses[info.color as keyof typeof colorClasses] : `border-transparent text-gray-600 dark:text-gray-400 ${colorClasses[info.color as keyof typeof colorClasses]}`
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="hidden sm:inline">{info.label}</span>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Tab Description */}
        <div className={`rounded-xl p-4 mb-6 border-2 ${
          activeTab === 'memorisation' ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800' :
          activeTab === 'fluency' ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800' :
          'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800'
        }`}>
          <div className="flex items-center gap-3">
            <TabIcon className={`w-6 h-6 ${
              activeTab === 'memorisation' ? 'text-emerald-600 dark:text-emerald-400' :
              activeTab === 'fluency' ? 'text-blue-600 dark:text-blue-400' :
              'text-purple-600 dark:text-purple-400'
            }`} />
            <div>
              <p className={`font-semibold ${
                activeTab === 'memorisation' ? 'text-emerald-900 dark:text-emerald-100' :
                activeTab === 'fluency' ? 'text-blue-900 dark:text-blue-100' :
                'text-purple-900 dark:text-purple-100'
              }`}>{currentTab.label}</p>
              <p className={`text-sm ${
                activeTab === 'memorisation' ? 'text-emerald-700 dark:text-emerald-300' :
                activeTab === 'fluency' ? 'text-blue-700 dark:text-blue-300' :
                'text-purple-700 dark:text-purple-300'
              }`}>{currentTab.description}</p>
            </div>
          </div>
        </div>

        {/* Stats and Save */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div>
              <p className={`text-3xl font-bold ${
                activeTab === 'memorisation' ? 'text-emerald-600' :
                activeTab === 'fluency' ? 'text-blue-600' :
                'text-purple-600'
              }`}>{currentSelection.size}</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">{currentTab.label}</p>
            </div>
            {activeTab !== 'memorisation' && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                of {selectedSurahs.size} memorised
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/progress/quran')}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium flex items-center gap-2 hover:bg-gray-200 dark:hover:bg-gray-600"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Detailed Tracker</span>
            </button>
            <button
              onClick={saveSelection}
              disabled={saving}
              className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium flex items-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
            >
              {saving ? (
                <>Saving...</>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  Save
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick Selects */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 mb-6">
          <h3 className="font-medium text-gray-900 dark:text-white mb-3">Quick Select</h3>
          <div className="flex flex-wrap gap-2">
            {QUICK_SELECTS.map((preset, idx) => (
              <button
                key={idx}
                onClick={() => applyQuickSelect(preset.surahs)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  activeTab === 'memorisation' ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50' :
                  activeTab === 'fluency' ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50' :
                  'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/50'
                }`}
              >
                {preset.label}
              </button>
            ))}
            <button
              onClick={selectAll}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Select All
            </button>
            <button
              onClick={clearCurrentSelection}
              className="px-4 py-2 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-lg text-sm font-medium hover:bg-red-100 dark:hover:bg-red-900/50 transition"
            >
              Clear All
            </button>
          </div>
        </div>

        {/* Surah List by Juz */}
        <div className="space-y-4">
          {[30, 29, 28, 27, 26, 25, 24, 23, 22, 21, 20, 19, 18, 17, 16, 15, 14, 13, 12, 11, 10, 9, 8, 7, 6, 5, 4, 3, 2, 1].map(juz => {
            const juzSurahs = surahsByJuz[juz] || [];
            if (juzSurahs.length === 0) return null;
            const isExpanded = expandedJuz === juz;
            const selectedInJuz = juzSurahs.filter(s => currentSelection.has(s.number)).length;

            return (
              <div key={juz} className="bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
                <button
                  onClick={() => setExpandedJuz(isExpanded ? null : juz)}
                  className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700/50"
                >
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-emerald-600">Juz {juz}</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({juzSurahs.length} surahs)
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-sm text-emerald-600 font-medium">
                      {selectedInJuz}/{juzSurahs.length} selected
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-4 pb-4">
                    <div className="flex gap-2 mb-3">
                      <button
                        onClick={() => selectRange(juzSurahs[0].number, juzSurahs[juzSurahs.length - 1].number)}
                        className="text-xs px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full"
                      >
                        Select Juz {juz}
                      </button>
                      <button
                        onClick={() => deselectRange(juzSurahs[0].number, juzSurahs[juzSurahs.length - 1].number)}
                        className="text-xs px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full"
                      >
                        Deselect Juz {juz}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {juzSurahs.sort((a, b) => a.number - b.number).map(surah => {
                        const isSelected = currentSelection.has(surah.number);
                        const hasQuiz = SURAHS_WITH_QUIZZES.includes(surah.number);
                        const colorClasses = activeTab === 'memorisation'
                          ? (isSelected ? 'bg-emerald-100 dark:bg-emerald-900/40 border-emerald-500' : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:border-gray-300 dark:hover:border-gray-600')
                          : activeTab === 'fluency'
                          ? (isSelected ? 'bg-blue-100 dark:bg-blue-900/40 border-blue-500' : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:border-gray-300 dark:hover:border-gray-600')
                          : (isSelected ? 'bg-purple-100 dark:bg-purple-900/40 border-purple-500' : 'bg-gray-50 dark:bg-gray-700 border-transparent hover:border-gray-300 dark:hover:border-gray-600');
                        const textColorClasses = activeTab === 'memorisation'
                          ? (isSelected ? 'text-emerald-900 dark:text-emerald-100' : 'text-gray-900 dark:text-white')
                          : activeTab === 'fluency'
                          ? (isSelected ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white')
                          : (isSelected ? 'text-purple-900 dark:text-purple-100' : 'text-gray-900 dark:text-white');
                        const subTextColorClasses = activeTab === 'memorisation'
                          ? (isSelected ? 'text-emerald-700 dark:text-emerald-300' : 'text-gray-500 dark:text-gray-400')
                          : activeTab === 'fluency'
                          ? (isSelected ? 'text-blue-700 dark:text-blue-300' : 'text-gray-500 dark:text-gray-400')
                          : (isSelected ? 'text-purple-700 dark:text-purple-300' : 'text-gray-500 dark:text-gray-400');
                        const iconColorClass = activeTab === 'memorisation'
                          ? 'text-emerald-600'
                          : activeTab === 'fluency'
                          ? 'text-blue-600'
                          : 'text-purple-600';

                        return (
                          <div
                            key={surah.number}
                            className={`p-3 rounded-lg text-left flex items-center gap-3 transition border-2 ${colorClasses}`}
                          >
                            <button
                              onClick={() => toggleSurah(surah.number)}
                              className="flex items-center gap-3 flex-1 min-w-0"
                            >
                              {isSelected ? (
                                <CheckSquare className={`w-5 h-5 ${iconColorClass} flex-shrink-0`} />
                              ) : (
                                <Square className="w-5 h-5 text-gray-400 flex-shrink-0" />
                              )}
                              <div className="min-w-0">
                                <p className={`font-medium truncate ${textColorClasses}`}>
                                  {surah.number}. {surah.nameEnglish}
                                </p>
                                <p className={`text-sm truncate ${subTextColorClasses}`}>
                                  {surah.nameArabic} • {surah.verses} verses
                                </p>
                              </div>
                            </button>
                            {activeTab === 'understanding' && hasQuiz && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setQuizSurah(surah.number);
                                }}
                                className="flex-shrink-0 px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg flex items-center gap-1 transition"
                              >
                                <Play className="w-3 h-3" />
                                Quiz
                              </button>
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

        {/* Save button fixed at bottom on mobile */}
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 md:hidden">
          <button
            onClick={saveSelection}
            disabled={saving}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-emerald-700 disabled:opacity-50"
          >
            {saving ? (
              <>Saving...</>
            ) : (
              <>
                <Save className="w-5 h-5" />
                Save All ({selectedSurahs.size} memorised, {fluencySurahs.size} fluent, {understandingSurahs.size} understood)
              </>
            )}
          </button>
        </div>
        <div className="h-20 md:hidden" /> {/* Spacer for fixed button */}
      </main>

      {/* Quiz Modal */}
      {quizSurah && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-auto shadow-2xl">
            <div className="sticky top-0 bg-white dark:bg-gray-800 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-600" />
                Understanding Quiz
              </h2>
              <button
                onClick={() => setQuizSurah(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>
            <div className="p-4">
              <SurahUnderstandingQuiz
                surahNumber={quizSurah}
                onComplete={(passed) => {
                  if (passed) {
                    // Mark as understood if quiz passed
                    setUnderstandingSurahs(prev => {
                      const newSet = new Set(prev);
                      newSet.add(quizSurah);
                      return newSet;
                    });
                  }
                  setQuizSurah(null);
                }}
                onClose={() => setQuizSurah(null)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
