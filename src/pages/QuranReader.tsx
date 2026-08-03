import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  ArrowLeft, Search, ChevronDown, ChevronUp, Loader, BookOpen, Play, Pause,
  AlignJustify, Rows3, Star, StickyNote, Bookmark, X
} from 'lucide-react';
import { toast } from 'sonner';
import DashboardHeader from '../components/DashboardHeader';
import { supabase } from '../lib/supabaseClient';
import { useSelfLearner } from '../hooks/useSelfLearner';
import { SURAHS_DATA } from '../lib/quranData';
import { getVerses, getTafsir, getAyahAudioUrl, getTajweedVerses, tajweedHtmlToSpans, QuranVerse } from '../utils/quranApi';

// Standard tajweed colour families (as used by Qur'an.com's own tajweed Mushaf
// view, based on the Dar Al-Ma'arifah tajweed colour scheme): green for
// nasalisation/merging rules, orange for concealment, pink for iqlab, blue for
// qalqalah, red for elongation (madd), grey for silent letters.
const TAJWEED_STYLES = `
  .tajweed-ghunnah, .tajweed-idgham_ghunnah, .tajweed-idgham_wo_ghunnah,
  .tajweed-idgham_shafawi, .tajweed-idgham_mutajanisayn, .tajweed-idgham_mutaqaribayn { color: #2e8b57; }
  .tajweed-ikhafa, .tajweed-ikhafa_shafawi { color: #d2691e; }
  .tajweed-iqlab { color: #c2185b; }
  .tajweed-qalaqah { color: #1565c0; }
  .tajweed-madda_normal, .tajweed-madda_permissible { color: #dc143c; }
  .tajweed-madda_necessary, .tajweed-madda_obligatory { color: #8b0000; }
  .tajweed-laam_shamsiyah, .tajweed-ham_wasl, .tajweed-slnt { color: #9ca3af; }
  .tajweed-ayah-end { color: inherit; }
`;

const TAJWEED_LEGEND = [
  { label: 'Ghunnah / Idgham', color: '#2e8b57' },
  { label: 'Ikhfa', color: '#d2691e' },
  { label: 'Iqlab', color: '#c2185b' },
  { label: 'Qalqalah', color: '#1565c0' },
  { label: 'Madd', color: '#dc143c' },
  { label: 'Silent letters', color: '#9ca3af' },
];

const TRANSLATIONS = [
  { id: 20, label: 'Saheeh International' },
  { id: 85, label: 'Abdul Haleem' },
];

const FONT_SIZES = [
  { key: 'md', arabicClass: 'text-3xl', translationClass: 'text-base', label: 'A' },
  { key: 'lg', arabicClass: 'text-4xl', translationClass: 'text-lg', label: 'A+' },
  { key: 'xl', arabicClass: 'text-5xl', translationClass: 'text-xl', label: 'A++' },
] as const;

// Warm, contemplative page background - a fine diamond lattice (classic
// Islamic tilework motif) laid over a soft ivory ground in light mode and a
// deep teal-black in dark mode. Pure CSS, no image request.
const PAGE_BG_LIGHT: React.CSSProperties = {
  backgroundColor: '#fbf7ee',
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(180,140,50,0.07) 0, rgba(180,140,50,0.07) 1px, transparent 1px, transparent 26px),' +
    'repeating-linear-gradient(-45deg, rgba(180,140,50,0.07) 0, rgba(180,140,50,0.07) 1px, transparent 1px, transparent 26px)',
};
const PAGE_BG_DARK: React.CSSProperties = {
  backgroundColor: '#0b1512',
  backgroundImage:
    'repeating-linear-gradient(45deg, rgba(212,175,90,0.05) 0, rgba(212,175,90,0.05) 1px, transparent 1px, transparent 26px),' +
    'repeating-linear-gradient(-45deg, rgba(212,175,90,0.05) 0, rgba(212,175,90,0.05) 1px, transparent 1px, transparent 26px)',
};

interface BookmarkRow {
  surah_number: number;
  ayah_number: number;
  note: string | null;
  updated_at: string;
}

export default function QuranReader() {
  const navigate = useNavigate();
  const { surahNumber: surahParam } = useParams<{ surahNumber?: string }>();
  const { learnerId } = useSelfLearner();

  const [selectedSurah, setSelectedSurah] = useState<number>(surahParam ? parseInt(surahParam, 10) : 1);
  const [search, setSearch] = useState('');
  const [showSurahList, setShowSurahList] = useState(!surahParam);

  const [verses, setVerses] = useState<QuranVerse[]>([]);
  const [loadingVerses, setLoadingVerses] = useState(true);
  const [translationId, setTranslationId] = useState(20);
  const [fontSizeIdx, setFontSizeIdx] = useState(1);

  const [expandedTafsir, setExpandedTafsir] = useState<number | null>(null);
  const [tafsirCache, setTafsirCache] = useState<Record<number, { text: string; tafsirName: string } | 'loading' | 'error'>>({});

  const [viewMode, setViewMode] = useState<'ayah' | 'mushaf' | 'word'>('ayah');
  const [showTranslation, setShowTranslation] = useState(true);
  const [showTajweed, setShowTajweed] = useState(false);
  const [tajweedMap, setTajweedMap] = useState<Map<number, string>>(new Map());
  const [loadingTajweed, setLoadingTajweed] = useState(false);
  const [playingAyah, setPlayingAyah] = useState<number | null>(null);
  const [autoAdvance, setAutoAdvance] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const versesRef = useRef<QuranVerse[]>([]);

  const [allBookmarks, setAllBookmarks] = useState<BookmarkRow[]>([]);
  const [showBookmarksPanel, setShowBookmarksPanel] = useState(false);
  const [noteDraftAyah, setNoteDraftAyah] = useState<number | null>(null);
  const [noteDraftText, setNoteDraftText] = useState('');
  const [savingBookmark, setSavingBookmark] = useState<number | null>(null);

  const surahInfo = SURAHS_DATA.find(s => s.number === selectedSurah);
  const fontSize = FONT_SIZES[fontSizeIdx];

  const bookmarkMap = useMemo(() => {
    const map = new Map<number, string | null>();
    allBookmarks.filter(b => b.surah_number === selectedSurah).forEach(b => map.set(b.ayah_number, b.note));
    return map;
  }, [allBookmarks, selectedSurah]);

  useEffect(() => {
    if (!learnerId) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('quran_bookmarks')
        .select('surah_number, ayah_number, note, updated_at')
        .eq('learner_id', learnerId)
        .order('updated_at', { ascending: false });
      if (!cancelled) setAllBookmarks(data || []);
    })();
    return () => { cancelled = true; };
  }, [learnerId]);

  useEffect(() => {
    if (!showTajweed) return;
    let cancelled = false;
    setLoadingTajweed(true);
    (async () => {
      const map = await getTajweedVerses(selectedSurah);
      if (!cancelled) {
        setTajweedMap(map);
        setLoadingTajweed(false);
      }
    })();
    return () => { cancelled = true; };
  }, [showTajweed, selectedSurah]);

  useEffect(() => {
    if (!surahInfo) return;
    let cancelled = false;
    setLoadingVerses(true);
    setTafsirCache({});
    setExpandedTafsir(null);
    setPlayingAyah(null);
    setNoteDraftAyah(null);
    if (audioRef.current) audioRef.current.pause();
    (async () => {
      const data = await getVerses(selectedSurah, 1, surahInfo.ayahCount, {
        includeTranslation: true,
        translationId,
      });
      if (!cancelled) {
        setVerses(data);
        versesRef.current = data;
        setLoadingVerses(false);
      }
    })();
    return () => { cancelled = true; };
  }, [selectedSurah, translationId, surahInfo]);

  function playAyah(ayahNumber: number) {
    if (!audioRef.current) return;
    if (playingAyah === ayahNumber) {
      audioRef.current.pause();
      setPlayingAyah(null);
      return;
    }
    audioRef.current.src = getAyahAudioUrl(selectedSurah, ayahNumber);
    audioRef.current.play().catch(() => setPlayingAyah(null));
    setPlayingAyah(ayahNumber);
  }

  function handleAudioEnded() {
    const current = playingAyah;
    setPlayingAyah(null);
    if (!current || !autoAdvance) return;
    const next = versesRef.current.find(v => v.verse_number === current + 1);
    if (next) playAyah(next.verse_number);
  }

  async function toggleTafsir(ayahNumber: number) {
    if (expandedTafsir === ayahNumber) {
      setExpandedTafsir(null);
      return;
    }
    setExpandedTafsir(ayahNumber);
    if (!tafsirCache[ayahNumber]) {
      setTafsirCache(prev => ({ ...prev, [ayahNumber]: 'loading' }));
      const result = await getTafsir(selectedSurah, ayahNumber);
      setTafsirCache(prev => ({ ...prev, [ayahNumber]: result || 'error' }));
    }
  }

  async function toggleBookmark(ayahNumber: number) {
    if (!learnerId || savingBookmark) return;
    const isBookmarked = bookmarkMap.has(ayahNumber);
    setSavingBookmark(ayahNumber);

    if (isBookmarked) {
      const { error } = await supabase
        .from('quran_bookmarks')
        .delete()
        .eq('learner_id', learnerId)
        .eq('surah_number', selectedSurah)
        .eq('ayah_number', ayahNumber);
      if (!error) {
        setAllBookmarks(prev => prev.filter(b => !(b.surah_number === selectedSurah && b.ayah_number === ayahNumber)));
        if (noteDraftAyah === ayahNumber) setNoteDraftAyah(null);
      } else {
        toast.error('Could not remove bookmark. Please try again.');
      }
    } else {
      const { error } = await supabase.from('quran_bookmarks').upsert(
        { learner_id: learnerId, surah_number: selectedSurah, ayah_number: ayahNumber, note: null },
        { onConflict: 'learner_id,surah_number,ayah_number' }
      );
      if (!error) {
        setAllBookmarks(prev => [
          { surah_number: selectedSurah, ayah_number: ayahNumber, note: null, updated_at: new Date().toISOString() },
          ...prev.filter(b => !(b.surah_number === selectedSurah && b.ayah_number === ayahNumber)),
        ]);
      } else {
        toast.error('Could not save bookmark. Please try again.');
      }
    }
    setSavingBookmark(null);
  }

  function openNoteEditor(ayahNumber: number) {
    setNoteDraftAyah(ayahNumber);
    setNoteDraftText(bookmarkMap.get(ayahNumber) || '');
  }

  async function saveNote() {
    if (!learnerId || noteDraftAyah === null) return;
    const ayahNumber = noteDraftAyah;
    const text = noteDraftText.trim();
    const { error } = await supabase.from('quran_bookmarks').upsert(
      { learner_id: learnerId, surah_number: selectedSurah, ayah_number: ayahNumber, note: text || null },
      { onConflict: 'learner_id,surah_number,ayah_number' }
    );
    if (!error) {
      setAllBookmarks(prev => [
        { surah_number: selectedSurah, ayah_number: ayahNumber, note: text || null, updated_at: new Date().toISOString() },
        ...prev.filter(b => !(b.surah_number === selectedSurah && b.ayah_number === ayahNumber)),
      ]);
      setNoteDraftAyah(null);
      toast.success('Note saved');
    } else {
      toast.error('Could not save note. Please try again.');
    }
  }

  function jumpToBookmark(b: BookmarkRow) {
    setShowBookmarksPanel(false);
    if (b.surah_number !== selectedSurah) {
      setSelectedSurah(b.surah_number);
      navigate(`/quran-reader/${b.surah_number}`, { replace: true });
    }
    setTimeout(() => {
      document.getElementById(`ayah-${b.surah_number}-${b.ayah_number}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, 400);
  }

  const filteredSurahs = useMemo(() => {
    if (!search.trim()) return SURAHS_DATA;
    const q = search.trim().toLowerCase();
    return SURAHS_DATA.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.englishName.toLowerCase().includes(q) ||
      String(s.number) === q
    );
  }, [search]);

  function selectSurah(num: number) {
    setSelectedSurah(num);
    setShowSurahList(false);
    navigate(`/quran-reader/${num}`, { replace: true });
  }

  // Verified tajweed markup for one ayah, converted to safe spans, with the
  // API's own ayah-end marker stripped (we already render our own ayah number).
  function tajweedHtmlFor(verseNumber: number): string | null {
    const raw = tajweedMap.get(verseNumber);
    if (!raw) return null;
    return tajweedHtmlToSpans(raw).replace(/<span class="tajweed-ayah-end">.*?<\/span>\s*$/, '');
  }

  return (
    <div
      className="min-h-screen"
      style={PAGE_BG_LIGHT}
    >
      <style>{`
        @media (prefers-color-scheme: dark) {
          .quran-reader-bg { background-color: ${PAGE_BG_DARK.backgroundColor} !important; background-image: ${PAGE_BG_DARK.backgroundImage} !important; }
        }
        ${TAJWEED_STYLES}
      `}</style>
      <div className="quran-reader-bg min-h-screen" style={PAGE_BG_LIGHT}>
        <DashboardHeader />

        <main className="max-w-3xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6 gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Dashboard
            </button>
            <button
              onClick={() => setShowBookmarksPanel(v => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 px-3 py-1.5 rounded-full hover:bg-amber-100 dark:hover:bg-amber-900/50 transition-colors"
            >
              <Bookmark className="w-3.5 h-3.5" />
              My Bookmarks {allBookmarks.length > 0 && `(${allBookmarks.length})`}
            </button>
          </div>

          {showBookmarksPanel && (
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl border border-amber-200 dark:border-amber-900 mb-4 overflow-hidden">
              <div className="px-5 py-3 border-b border-amber-100 dark:border-amber-900/60 flex items-center justify-between">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">Your bookmarks</p>
                <button onClick={() => setShowBookmarksPanel(false)} className="text-gray-400 hover:text-gray-600"><X className="w-4 h-4" /></button>
              </div>
              {allBookmarks.length === 0 ? (
                <p className="text-sm text-gray-400 px-5 py-6 text-center">No bookmarks yet - tap the star on any ayah to save it here.</p>
              ) : (
                <div className="max-h-72 overflow-y-auto divide-y divide-amber-50 dark:divide-amber-900/40">
                  {allBookmarks.map(b => {
                    const s = SURAHS_DATA.find(x => x.number === b.surah_number);
                    return (
                      <button
                        key={`${b.surah_number}-${b.ayah_number}`}
                        onClick={() => jumpToBookmark(b)}
                        className="w-full text-left px-5 py-3 hover:bg-amber-50/60 dark:hover:bg-amber-900/20 flex items-start gap-3"
                      >
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500 flex-shrink-0 mt-0.5" />
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">
                            {s?.englishName || `Surah ${b.surah_number}`} {b.surah_number}:{b.ayah_number}
                          </p>
                          {b.note && <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{b.note}</p>}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          <div className="bg-gradient-to-br from-emerald-600 via-emerald-700 to-teal-700 rounded-2xl p-6 mb-6 shadow-lg relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-[0.15]"
              style={{
                backgroundImage: 'repeating-linear-gradient(45deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 20px), repeating-linear-gradient(-45deg, rgba(255,255,255,0.6) 0, rgba(255,255,255,0.6) 1px, transparent 1px, transparent 20px)',
              }}
            />
            <div className="flex items-center gap-4 relative">
              <div className="w-14 h-14 bg-white/15 backdrop-blur border border-white/20 rounded-xl flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-white">Read the Qur'an</h1>
                <p className="text-white/75 text-sm">Uthmani script, with translation, tafsir, bookmarks & notes</p>
              </div>
            </div>
          </div>

          {/* Surah picker toggle */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-2xl border border-amber-200/70 dark:border-gray-700 overflow-hidden mb-4 shadow-sm">
            <button
              onClick={() => setShowSurahList(v => !v)}
              className="w-full flex items-center justify-between px-5 py-4"
            >
              <div className="text-left">
                <p className="text-xs text-gray-400 dark:text-gray-500">Currently reading</p>
                <p className="text-base font-semibold text-gray-900 dark:text-white">
                  {surahInfo ? `${surahInfo.number}. ${surahInfo.englishName} (${surahInfo.name})` : 'Choose a surah'}
                </p>
              </div>
              {showSurahList ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {showSurahList && (
              <div className="border-t border-amber-100 dark:border-gray-700">
                <div className="p-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      placeholder="Search surah name or number..."
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {filteredSurahs.map(s => (
                    <button
                      key={s.number}
                      onClick={() => selectSurah(s.number)}
                      className={`w-full flex items-center justify-between px-5 py-3 text-left border-t border-amber-50 dark:border-gray-700/50 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 ${
                        s.number === selectedSurah ? 'bg-emerald-50 dark:bg-emerald-900/30' : ''
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="w-7 h-7 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-300 text-xs font-semibold flex items-center justify-center flex-shrink-0">
                          {s.number}
                        </span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate">{s.englishName}</span>
                        <span className="text-xs text-gray-400 flex-shrink-0">{s.ayahCount} ayat</span>
                      </div>
                      <span className="font-arabic text-lg text-gray-700 dark:text-gray-300 flex-shrink-0">{s.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reading options */}
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur rounded-xl border border-amber-200/70 dark:border-gray-700 p-4 mb-6 flex flex-wrap items-center gap-4 shadow-sm">
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">Translation</span>
              <select
                value={translationId}
                onChange={e => setTranslationId(parseInt(e.target.value, 10))}
                className="text-sm rounded-lg border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {TRANSLATIONS.map(t => (
                  <option key={t.id} value={t.id}>{t.label}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">Text size</span>
              <div className="flex gap-1">
                {FONT_SIZES.map((fs, i) => (
                  <button
                    key={fs.key}
                    onClick={() => setFontSizeIdx(i)}
                    className={`px-2.5 py-1 rounded-md text-xs font-bold border ${
                      i === fontSizeIdx
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    }`}
                  >
                    {fs.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 dark:text-gray-500">View</span>
              <div className="flex gap-1">
                <button
                  onClick={() => setViewMode('ayah')}
                  title="Ayah view - study with translation, tafsir, bookmarks"
                  className={`p-1.5 rounded-md border ${viewMode === 'ayah' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
                >
                  <AlignJustify className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('mushaf')}
                  title="Mushaf view - continuous page, Arabic only"
                  className={`p-1.5 rounded-md border ${viewMode === 'mushaf' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('word')}
                  title="Word by word"
                  className={`p-1.5 rounded-md border ${viewMode === 'word' ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-300 border-gray-200 dark:border-gray-600'}`}
                >
                  <Rows3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
            {viewMode === 'ayah' && (
              <label className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 cursor-pointer">
                <input type="checkbox" checked={showTranslation} onChange={e => setShowTranslation(e.target.checked)} className="accent-emerald-600" />
                Show translation
              </label>
            )}
            {viewMode !== 'word' && (
              <label className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 cursor-pointer">
                <input type="checkbox" checked={showTajweed} onChange={e => setShowTajweed(e.target.checked)} className="accent-emerald-600" />
                Tajweed colours{loadingTajweed && ' (loading...)'}
              </label>
            )}
            <label className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 cursor-pointer">
              <input type="checkbox" checked={autoAdvance} onChange={e => setAutoAdvance(e.target.checked)} className="accent-emerald-600" />
              Auto-play next ayah
            </label>
          </div>

          {showTajweed && viewMode !== 'word' && (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mb-6 px-1">
              {TAJWEED_LEGEND.map(l => (
                <span key={l.label} className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400">
                  <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: l.color }} />
                  {l.label}
                </span>
              ))}
            </div>
          )}

          {/* Verses */}
          {loadingVerses ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader className="w-5 h-5 animate-spin mr-2" /> Loading surah...
            </div>
          ) : viewMode === 'mushaf' ? (
            <div className="bg-[#fdf9ee] dark:bg-[#141f1a] rounded-3xl border-[6px] border-double border-amber-300/70 dark:border-amber-800/50 p-8 sm:p-12 shadow-md">
              <p dir="rtl" className={`font-arabic ${fontSize.arabicClass} leading-[2.6] text-justify text-gray-900 dark:text-amber-50`}>
                {verses.map(v => (
                  <span key={v.verse_key}>
                    {showTajweed && tajweedHtmlFor(v.verse_number) ? (
                      <span dangerouslySetInnerHTML={{ __html: tajweedHtmlFor(v.verse_number)! }} />
                    ) : (
                      v.text_uthmani
                    )}
                    <button
                      onClick={() => playAyah(v.verse_number)}
                      className={`inline-flex items-center justify-center w-7 h-7 mx-1.5 rounded-full border align-middle text-xs font-sans font-semibold transition-colors ${
                        playingAyah === v.verse_number
                          ? 'bg-emerald-600 border-emerald-600 text-white'
                          : 'border-amber-400 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-900/40'
                      }`}
                      title={`Play ayah ${v.verse_number}`}
                    >
                      {v.verse_number}
                    </button>
                    {' '}
                  </span>
                ))}
              </p>
              <p className="text-center text-xs text-amber-700/60 dark:text-amber-500/50 mt-8 italic">
                Tap an ayah number to listen · switch to Ayah View for translation, tafsir, bookmarks & notes
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {verses.map(v => {
                const tafsirState = tafsirCache[v.verse_number];
                const isPlaying = playingAyah === v.verse_number;
                const isBookmarked = bookmarkMap.has(v.verse_number);
                const noteText = bookmarkMap.get(v.verse_number);
                const isEditingNote = noteDraftAyah === v.verse_number;

                return (
                  <div
                    key={v.verse_key}
                    id={`ayah-${selectedSurah}-${v.verse_number}`}
                    className={`bg-white/95 dark:bg-gray-800/90 backdrop-blur rounded-3xl border p-6 transition-all duration-300 shadow-sm hover:shadow-md ${
                      isPlaying
                        ? 'border-emerald-400 ring-2 ring-emerald-200 dark:ring-emerald-900 shadow-emerald-100'
                        : 'border-amber-200/60 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-start gap-4 mb-4">
                      {/* Ornate ayah medallion */}
                      <div className="relative flex-shrink-0 mt-1">
                        <div className="w-9 h-9 rounded-full border-2 border-amber-300 dark:border-amber-700 p-[2px]">
                          <div className="w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-white text-xs font-bold flex items-center justify-center">
                            {v.verse_number}
                          </div>
                        </div>
                      </div>

                      {viewMode === 'word' ? (
                        <div dir="rtl" className="flex flex-wrap gap-x-4 gap-y-3 flex-1">
                          {v.words?.filter(w => w.char_type_name === 'word').map((w, i) => (
                            <div key={i} className="flex flex-col items-center">
                              <span className={`font-arabic ${fontSize.arabicClass} text-gray-900 dark:text-white leading-tight`}>{w.text_uthmani}</span>
                              {w.translation?.text && (
                                <span className="text-[11px] text-gray-400 dark:text-gray-500 mt-1 whitespace-nowrap">{w.translation.text}</span>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : showTajweed && tajweedHtmlFor(v.verse_number) ? (
                        <p
                          dir="rtl"
                          className={`font-arabic ${fontSize.arabicClass} leading-loose text-gray-900 dark:text-white flex-1`}
                          dangerouslySetInnerHTML={{ __html: tajweedHtmlFor(v.verse_number)! }}
                        />
                      ) : (
                        <p dir="rtl" className={`font-arabic ${fontSize.arabicClass} leading-loose text-gray-900 dark:text-white flex-1`}>
                          {v.text_uthmani}
                        </p>
                      )}
                    </div>

                    {viewMode === 'ayah' && showTranslation && v.translations?.[0]?.text && (
                      <div className="ml-[52px] mt-1 bg-gray-50/80 dark:bg-gray-900/30 border-l-2 border-gray-200 dark:border-gray-700 rounded-r-xl px-4 py-3">
                        <p className={`${fontSize.translationClass} text-gray-500 dark:text-gray-400 leading-relaxed italic`}>
                          {v.translations[0].text}
                        </p>
                      </div>
                    )}

                    {noteText && !isEditingNote && (
                      <div className="mt-3 ml-[52px] bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/50 rounded-xl px-3 py-2 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                        <StickyNote className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                        <span className="flex-1">{noteText}</span>
                      </div>
                    )}

                    {isEditingNote && (
                      <div className="mt-3 ml-[52px]">
                        <textarea
                          value={noteDraftText}
                          onChange={e => setNoteDraftText(e.target.value)}
                          placeholder="Write a note for this ayah..."
                          rows={2}
                          autoFocus
                          className="w-full text-sm rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50/60 dark:bg-amber-900/20 text-gray-900 dark:text-white placeholder-gray-400 p-3 focus:outline-none focus:ring-2 focus:ring-amber-400 resize-none"
                        />
                        <div className="flex gap-2 mt-1.5">
                          <button onClick={saveNote} className="text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg">Save note</button>
                          <button onClick={() => setNoteDraftAyah(null)} className="text-xs font-semibold text-gray-500 hover:text-gray-700 px-3 py-1.5">Cancel</button>
                        </div>
                      </div>
                    )}

                    {/* Action toolbar */}
                    <div className="flex items-center gap-2 mt-4 ml-[52px]">
                      <button
                        onClick={() => playAyah(v.verse_number)}
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          isPlaying
                            ? 'bg-emerald-600 text-white'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/30'
                        }`}
                        aria-label={isPlaying ? `Pause ayah ${v.verse_number}` : `Play ayah ${v.verse_number}`}
                      >
                        {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
                      </button>

                      <button
                        onClick={() => toggleBookmark(v.verse_number)}
                        disabled={savingBookmark === v.verse_number}
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors disabled:opacity-50 ${
                          isBookmarked
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                        }`}
                        aria-label={isBookmarked ? 'Remove bookmark' : 'Bookmark this ayah'}
                        title={isBookmarked ? 'Remove bookmark' : 'Bookmark this ayah'}
                      >
                        <Star className={`w-3.5 h-3.5 ${isBookmarked ? 'fill-amber-500' : ''}`} />
                      </button>

                      <button
                        onClick={() => (isEditingNote ? setNoteDraftAyah(null) : openNoteEditor(v.verse_number))}
                        className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                          noteText || isEditingNote
                            ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/30'
                        }`}
                        aria-label={noteText ? 'Edit note' : 'Add a note'}
                        title={noteText ? 'Edit note' : 'Add a note'}
                      >
                        <StickyNote className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => toggleTafsir(v.verse_number)}
                        className="text-xs font-semibold text-emerald-700 dark:text-emerald-400 hover:text-emerald-800 ml-1"
                      >
                        {expandedTafsir === v.verse_number ? 'Hide tafsir' : 'Show tafsir'}
                      </button>
                    </div>

                    {expandedTafsir === v.verse_number && (
                      <div className="mt-3 ml-[52px] bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                        {tafsirState === 'loading' && <span className="text-gray-400">Loading tafsir...</span>}
                        {tafsirState === 'error' && <span className="text-gray-400">Tafsir not available for this ayah.</span>}
                        {tafsirState && tafsirState !== 'loading' && tafsirState !== 'error' && (
                          <>
                            <p>{tafsirState.text}</p>
                            <p className="text-xs text-gray-400 mt-3">Source: {tafsirState.tafsirName}</p>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </main>

        <audio ref={audioRef} onEnded={handleAudioEnded} className="hidden" />
      </div>
    </div>
  );
}
