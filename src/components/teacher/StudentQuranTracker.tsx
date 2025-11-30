import { useState, useEffect, useCallback } from 'react';
import {
  ChevronDown, ChevronUp, BookOpen, Brain, Volume2, Heart,
  Edit3, Save, X, Check, ChevronLeft, ChevronRight, Search,
  MessageSquare, Loader2
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { SURAHS_DATA, TOTAL_AYAHS } from '../../lib/quranData';

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
  id?: string;
  surah_number: number;
  ayah_number: number;
  understanding_complete: boolean;
  fluency_complete: boolean;
  memorization_complete: boolean;
  teacher_notes: string | null;
}

interface StudentQuranTrackerProps {
  studentId: string;
  studentName: string;
  onClose?: () => void;
}

export default function StudentQuranTracker({
  studentId,
  studentName,
  onClose,
}: StudentQuranTrackerProps) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [ayahProgress, setAyahProgress] = useState<AyahProgress[]>([]);
  const [selectedJuz, setSelectedJuz] = useState(30); // Start with Juz Amma
  const [expandedSurah, setExpandedSurah] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');
  const [editingGeneralNotes, setEditingGeneralNotes] = useState(false);

  useEffect(() => {
    loadProgress();
  }, [studentId]);

  const loadProgress = async () => {
    setLoading(true);
    try {
      // Load ayah-level progress
      const { data: progressData, error } = await supabase
        .from('ayah_progress')
        .select('*')
        .eq('learner_id', studentId);

      if (error) throw error;
      setAyahProgress(progressData || []);

      // Load general notes for the student
      const { data: notesData } = await supabase
        .from('student_teacher_relationships')
        .select('teacher_general_notes')
        .eq('student_id', studentId)
        .maybeSingle();

      if (notesData?.teacher_general_notes) {
        setGeneralNotes(notesData.teacher_general_notes);
      }
    } catch (error) {
      console.error('Error loading progress:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgressForAyah = (surahNumber: number, ayahNumber: number) => {
    return ayahProgress.find(
      (p) => p.surah_number === surahNumber && p.ayah_number === ayahNumber
    );
  };

  const getSurahStats = useCallback((surahNumber: number) => {
    const surah = SURAHS_DATA.find((s) => s.number === surahNumber);
    if (!surah) return { understanding: 0, fluency: 0, memorization: 0, total: 0 };

    const surahAyahs = ayahProgress.filter((p) => p.surah_number === surahNumber);
    return {
      understanding: surahAyahs.filter((a) => a.understanding_complete).length,
      fluency: surahAyahs.filter((a) => a.fluency_complete).length,
      memorization: surahAyahs.filter((a) => a.memorization_complete).length,
      total: surah.ayahCount,
    };
  }, [ayahProgress]);

  const handleToggleAyah = async (
    surahNumber: number,
    ayahNumber: number,
    field: 'understanding_complete' | 'fluency_complete' | 'memorization_complete'
  ) => {
    setSaving(true);
    try {
      const existing = getProgressForAyah(surahNumber, ayahNumber);
      const newValue = existing ? !existing[field] : true;

      if (existing?.id) {
        // Update existing
        const { error } = await supabase
          .from('ayah_progress')
          .update({ [field]: newValue })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        // Create new
        const { error } = await supabase.from('ayah_progress').insert({
          learner_id: studentId,
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          [field]: newValue,
        });
        if (error) throw error;
      }

      // Update local state
      setAyahProgress((prev) => {
        const existingIndex = prev.findIndex(
          (p) => p.surah_number === surahNumber && p.ayah_number === ayahNumber
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], [field]: newValue };
          return updated;
        } else {
          return [
            ...prev,
            {
              surah_number: surahNumber,
              ayah_number: ayahNumber,
              understanding_complete: field === 'understanding_complete' ? newValue : false,
              fluency_complete: field === 'fluency_complete' ? newValue : false,
              memorization_complete: field === 'memorization_complete' ? newValue : false,
              teacher_notes: null,
            },
          ];
        }
      });
    } catch (error) {
      console.error('Error updating ayah:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAyahNotes = async (surahNumber: number, ayahNumber: number) => {
    setSaving(true);
    try {
      const existing = getProgressForAyah(surahNumber, ayahNumber);

      if (existing?.id) {
        const { error } = await supabase
          .from('ayah_progress')
          .update({ teacher_notes: notesText })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ayah_progress').insert({
          learner_id: studentId,
          surah_number: surahNumber,
          ayah_number: ayahNumber,
          teacher_notes: notesText,
        });
        if (error) throw error;
      }

      // Update local state
      setAyahProgress((prev) => {
        const existingIndex = prev.findIndex(
          (p) => p.surah_number === surahNumber && p.ayah_number === ayahNumber
        );
        if (existingIndex >= 0) {
          const updated = [...prev];
          updated[existingIndex] = { ...updated[existingIndex], teacher_notes: notesText };
          return updated;
        } else {
          return [
            ...prev,
            {
              surah_number: surahNumber,
              ayah_number: ayahNumber,
              understanding_complete: false,
              fluency_complete: false,
              memorization_complete: false,
              teacher_notes: notesText,
            },
          ];
        }
      });

      setEditingNotes(null);
      setNotesText('');
    } catch (error) {
      console.error('Error saving notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveGeneralNotes = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('student_teacher_relationships')
        .update({ teacher_general_notes: generalNotes })
        .eq('student_id', studentId);

      if (error) throw error;
      setEditingGeneralNotes(false);
    } catch (error) {
      console.error('Error saving general notes:', error);
    } finally {
      setSaving(false);
    }
  };

  const markAllAyahs = async (
    surahNumber: number,
    field: 'understanding_complete' | 'fluency_complete' | 'memorization_complete',
    value: boolean
  ) => {
    const surah = SURAHS_DATA.find((s) => s.number === surahNumber);
    if (!surah) return;

    setSaving(true);
    try {
      // Create or update all ayahs for this surah
      const ayahsToUpsert = [];
      for (let i = 1; i <= surah.ayahCount; i++) {
        const existing = getProgressForAyah(surahNumber, i);
        ayahsToUpsert.push({
          learner_id: studentId,
          surah_number: surahNumber,
          ayah_number: i,
          understanding_complete: field === 'understanding_complete' ? value : (existing?.understanding_complete || false),
          fluency_complete: field === 'fluency_complete' ? value : (existing?.fluency_complete || false),
          memorization_complete: field === 'memorization_complete' ? value : (existing?.memorization_complete || false),
          teacher_notes: existing?.teacher_notes || null,
        });
      }

      const { error } = await supabase
        .from('ayah_progress')
        .upsert(ayahsToUpsert, { onConflict: 'learner_id,surah_number,ayah_number' });

      if (error) throw error;
      await loadProgress();
    } catch (error) {
      console.error('Error marking all ayahs:', error);
    } finally {
      setSaving(false);
    }
  };

  // Calculate overall stats
  const totalStats = {
    understanding: ayahProgress.filter((a) => a.understanding_complete).length,
    fluency: ayahProgress.filter((a) => a.fluency_complete).length,
    memorization: ayahProgress.filter((a) => a.memorization_complete).length,
  };

  // Get surahs for current Juz
  const currentJuz = JUZ_RANGES.find((j) => j.juz === selectedJuz);
  const surahsInJuz = currentJuz
    ? SURAHS_DATA.filter((s) => currentJuz.surahs.includes(s.number))
    : [];

  // Filter surahs by search
  const filteredSurahs = searchQuery
    ? SURAHS_DATA.filter(
        (s) =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.englishName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.number.toString().includes(searchQuery)
      )
    : surahsInJuz;

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 rounded-2xl border border-slate-700/50 overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-600 to-cyan-600 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <BookOpen className="w-7 h-7" />
              Quran Progress - {studentName}
            </h2>
            <p className="text-emerald-100 mt-1">
              Track {studentName}'s Quran memorization journey
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition"
            >
              <X className="w-6 h-6 text-white" />
            </button>
          )}
        </div>
      </div>

      {/* Stats Overview */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Brain className="w-5 h-5 text-cyan-400" />
              <span className="text-slate-400 text-sm">Understanding</span>
            </div>
            <p className="text-2xl font-bold text-cyan-400">{totalStats.understanding}</p>
            <p className="text-xs text-slate-500">of {TOTAL_AYAHS} ayahs ({Math.round((totalStats.understanding / TOTAL_AYAHS) * 100)}%)</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Volume2 className="w-5 h-5 text-blue-400" />
              <span className="text-slate-400 text-sm">Fluency</span>
            </div>
            <p className="text-2xl font-bold text-blue-400">{totalStats.fluency}</p>
            <p className="text-xs text-slate-500">of {TOTAL_AYAHS} ayahs ({Math.round((totalStats.fluency / TOTAL_AYAHS) * 100)}%)</p>
          </div>
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-emerald-400" />
              <span className="text-slate-400 text-sm">Memorized</span>
            </div>
            <p className="text-2xl font-bold text-emerald-400">{totalStats.memorization}</p>
            <p className="text-xs text-slate-500">of {TOTAL_AYAHS} ayahs ({Math.round((totalStats.memorization / TOTAL_AYAHS) * 100)}%)</p>
          </div>
          <div className="bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-xl p-4 border border-purple-500/30">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-purple-400" />
              <span className="text-purple-300 text-sm">Overall Hifdh</span>
            </div>
            <p className="text-3xl font-bold text-purple-400">
              {Math.round((totalStats.memorization / TOTAL_AYAHS) * 100)}%
            </p>
            <p className="text-xs text-purple-400/70">Complete</p>
          </div>
        </div>
      </div>

      {/* General Notes Section */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-white font-semibold flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-cyan-400" />
            General Notes for Student
          </h3>
          {!editingGeneralNotes && (
            <button
              onClick={() => setEditingGeneralNotes(true)}
              className="text-cyan-400 hover:text-cyan-300 text-sm flex items-center gap-1"
            >
              <Edit3 className="w-4 h-4" />
              Edit
            </button>
          )}
        </div>
        {editingGeneralNotes ? (
          <div className="space-y-3">
            <textarea
              value={generalNotes}
              onChange={(e) => setGeneralNotes(e.target.value)}
              placeholder="Add general notes about the student's Quran progress, goals, areas to improve..."
              className="w-full px-4 py-3 bg-slate-700/50 border border-slate-600 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
              rows={4}
            />
            <div className="flex gap-2">
              <button
                onClick={handleSaveGeneralNotes}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Save Notes
              </button>
              <button
                onClick={() => setEditingGeneralNotes(false)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50">
            {generalNotes ? (
              <p className="text-slate-300 whitespace-pre-wrap">{generalNotes}</p>
            ) : (
              <p className="text-slate-500 italic">No general notes yet. Click Edit to add notes.</p>
            )}
          </div>
        )}
        <p className="text-xs text-slate-500 mt-2">
          These notes are visible to the student on their Quran Progress page.
        </p>
      </div>

      {/* Juz Navigation */}
      <div className="p-6 border-b border-slate-700/50">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-white font-semibold">Navigate by Juz</h3>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search surah..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500 text-sm w-48"
            />
          </div>
        </div>

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

        {currentJuz && !searchQuery && (
          <div className="text-center text-slate-400 text-sm">
            <span className="font-semibold text-white">Juz {selectedJuz}:</span> {currentJuz.name} • Surahs {currentJuz.surahs[0]}-{currentJuz.surahs[currentJuz.surahs.length - 1]}
          </div>
        )}
      </div>

      {/* Surah List */}
      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="space-y-3">
          {filteredSurahs.map((surah) => {
            const stats = getSurahStats(surah.number);
            const isExpanded = expandedSurah === surah.number;
            const isComplete = stats.memorization === stats.total && stats.total > 0;

            return (
              <div
                key={surah.number}
                className={`bg-slate-800/50 rounded-xl border overflow-hidden transition ${
                  isComplete ? 'border-emerald-500/50' : 'border-slate-700/50'
                }`}
              >
                {/* Surah Header */}
                <button
                  onClick={() => setExpandedSurah(isExpanded ? null : surah.number)}
                  className="w-full p-4 flex items-center justify-between hover:bg-slate-800/70 transition"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold ${
                      isComplete
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-slate-700/50 text-cyan-400'
                    }`}>
                      {surah.number}
                    </div>
                    <div className="text-left">
                      <h4 className="text-white font-semibold">{surah.name}</h4>
                      <p className="text-slate-400 text-sm">{surah.englishName} • {surah.ayahCount} ayahs</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-3 text-sm">
                      <span className="text-cyan-400">{stats.understanding}/{stats.total}</span>
                      <span className="text-blue-400">{stats.fluency}/{stats.total}</span>
                      <span className="text-emerald-400">{stats.memorization}/{stats.total}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    )}
                  </div>
                </button>

                {/* Expanded Content */}
                {isExpanded && (
                  <div className="px-4 pb-4 border-t border-slate-700/50 pt-4">
                    {/* Quick Actions */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <button
                        onClick={() => markAllAyahs(surah.number, 'understanding_complete', true)}
                        className="px-3 py-1.5 bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 rounded-lg text-xs font-medium transition"
                      >
                        Mark All Understanding
                      </button>
                      <button
                        onClick={() => markAllAyahs(surah.number, 'fluency_complete', true)}
                        className="px-3 py-1.5 bg-blue-500/20 text-blue-400 hover:bg-blue-500/30 rounded-lg text-xs font-medium transition"
                      >
                        Mark All Fluency
                      </button>
                      <button
                        onClick={() => markAllAyahs(surah.number, 'memorization_complete', true)}
                        className="px-3 py-1.5 bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 rounded-lg text-xs font-medium transition"
                      >
                        Mark All Memorized
                      </button>
                    </div>

                    {/* Theme */}
                    <div className="bg-slate-900/50 rounded-lg p-3 mb-4 border border-slate-700/30">
                      <p className="text-xs text-cyan-400 font-medium mb-1">Theme</p>
                      <p className="text-sm text-slate-300">{surah.theme}</p>
                    </div>

                    {/* Legend */}
                    <div className="flex items-center gap-4 mb-4 text-xs">
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-cyan-500 rounded" />
                        <span className="text-slate-400">Understanding</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-blue-500 rounded" />
                        <span className="text-slate-400">Fluency</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <div className="w-3 h-3 bg-emerald-500 rounded" />
                        <span className="text-slate-400">Memorized</span>
                      </div>
                    </div>

                    {/* Ayah Grid */}
                    <div className="max-h-[400px] overflow-y-auto space-y-2">
                      {Array.from({ length: surah.ayahCount }, (_, i) => i + 1).map((ayahNum) => {
                        const progress = getProgressForAyah(surah.number, ayahNum);
                        const noteKey = `${surah.number}-${ayahNum}`;
                        const isEditingNote = editingNotes === noteKey;

                        return (
                          <div
                            key={ayahNum}
                            className="bg-slate-900/30 rounded-lg p-3 border border-slate-700/30"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="w-10 h-10 bg-slate-700/50 rounded-lg flex items-center justify-center text-slate-300 font-medium text-sm">
                                  {ayahNum}
                                </span>
                                <span className="text-sm text-slate-400">Ayah {ayahNum}</span>
                              </div>

                              <div className="flex items-center gap-2">
                                {/* Understanding */}
                                <button
                                  onClick={() => handleToggleAyah(surah.number, ayahNum, 'understanding_complete')}
                                  disabled={saving}
                                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition ${
                                    progress?.understanding_complete
                                      ? 'bg-cyan-500/20 border-cyan-500'
                                      : 'border-slate-600 hover:border-cyan-500/50'
                                  }`}
                                  title="Understanding"
                                >
                                  {progress?.understanding_complete && <Check className="w-5 h-5 text-cyan-400" />}
                                </button>

                                {/* Fluency */}
                                <button
                                  onClick={() => handleToggleAyah(surah.number, ayahNum, 'fluency_complete')}
                                  disabled={saving}
                                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition ${
                                    progress?.fluency_complete
                                      ? 'bg-blue-500/20 border-blue-500'
                                      : 'border-slate-600 hover:border-blue-500/50'
                                  }`}
                                  title="Fluency"
                                >
                                  {progress?.fluency_complete && <Check className="w-5 h-5 text-blue-400" />}
                                </button>

                                {/* Memorization */}
                                <button
                                  onClick={() => handleToggleAyah(surah.number, ayahNum, 'memorization_complete')}
                                  disabled={saving}
                                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition ${
                                    progress?.memorization_complete
                                      ? 'bg-emerald-500/20 border-emerald-500'
                                      : 'border-slate-600 hover:border-emerald-500/50'
                                  }`}
                                  title="Memorized"
                                >
                                  {progress?.memorization_complete && <Check className="w-5 h-5 text-emerald-400" />}
                                </button>

                                {/* Notes Button */}
                                <button
                                  onClick={() => {
                                    if (isEditingNote) {
                                      setEditingNotes(null);
                                    } else {
                                      setEditingNotes(noteKey);
                                      setNotesText(progress?.teacher_notes || '');
                                    }
                                  }}
                                  className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition ${
                                    progress?.teacher_notes
                                      ? 'bg-purple-500/20 border-purple-500'
                                      : 'border-slate-600 hover:border-purple-500/50'
                                  }`}
                                  title="Notes"
                                >
                                  <MessageSquare className={`w-4 h-4 ${progress?.teacher_notes ? 'text-purple-400' : 'text-slate-400'}`} />
                                </button>
                              </div>
                            </div>

                            {/* Notes Editor */}
                            {isEditingNote && (
                              <div className="mt-3 space-y-2">
                                <textarea
                                  value={notesText}
                                  onChange={(e) => setNotesText(e.target.value)}
                                  placeholder="Add notes for this ayah..."
                                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none text-sm"
                                  rows={2}
                                />
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => handleSaveAyahNotes(surah.number, ayahNum)}
                                    disabled={saving}
                                    className="flex-1 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50"
                                  >
                                    {saving ? 'Saving...' : 'Save Note'}
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingNotes(null);
                                      setNotesText('');
                                    }}
                                    className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white rounded-lg text-sm transition"
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}

                            {/* Display existing note */}
                            {!isEditingNote && progress?.teacher_notes && (
                              <div className="mt-2 bg-purple-500/10 rounded-lg p-2 border border-purple-500/30">
                                <p className="text-xs text-purple-300">{progress.teacher_notes}</p>
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
      </div>
    </div>
  );
}
