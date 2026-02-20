import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateTTSAudio } from '../lib/ttsHelper';
import {
  ChevronLeft,
  Loader2,
  Copy,
  Check,
  Volume2,
  Pause,
  Play,
  StopCircle,
  Save,
  Heart,
  Search,
  Sparkles,
  BookOpen,
  Star,
  Trash2,
  ChevronDown,
  ChevronUp,
  Download,
  Coins,
  Layers,
  GraduationCap,
  Moon,
  Compass
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { ALLAH_NAMES, getNamesByCategory, searchNames, type AllahName } from '../data/allahNames';
import { DUA_LIBRARY, DUA_CATEGORIES, getDuasByCategory, searchDuas, type LibraryDua, type DuaCategory } from '../data/duaLibrary';

// New modular dua components
import DuaComposer from '../components/dua/DuaComposer';
import DuaLearnTab from '../components/dua/DuaLearnTab';
import DuaMyDuasTab from '../components/dua/DuaMyDuasTab';

const DUA_AUDIO_TOKEN_COST = 10;

// Types
interface GeneratedDua {
  title: string;
  titleArabic: string;
  arabic: string;
  transliteration: string;
  english: string;
  namesUsed: string[];
  category: string;
  structure?: {
    hamd: string;
    salawat: string;
    request: string;
    closing: string;
  };
}

type TabType = 'build' | 'library' | 'saved' | 'names' | 'learn';

export default function DuaBuilder() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('build');
  const [userId, setUserId] = useState<string | null>(null);

  // Library state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'core' | 'situational'>('all');
  const [librarySearch, setLibrarySearch] = useState('');
  const [expandedDuaId, setExpandedDuaId] = useState<string | null>(null);

  // Legacy Create state (for AI generation fallback)
  const [createCategory, setCreateCategory] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generatedDua, setGeneratedDua] = useState<GeneratedDua | null>(null);
  const [showAIGenerator, setShowAIGenerator] = useState(false);

  // Audio state
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLanguage, setAudioLanguage] = useState<'arabic' | 'english'>('arabic');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Saved duas state
  const [saving, setSaving] = useState(false);

  // Names state
  const [namesSearch, setNamesSearch] = useState('');
  const [namesCategory, setNamesCategory] = useState<string | null>(null);
  const [expandedNameNumber, setExpandedNameNumber] = useState<number | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Token state
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [downloadingAudio, setDownloadingAudio] = useState(false);

  // Get user and tokens on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        loadTokenBalance(user.id);
      }
    };
    getUser();
  }, []);

  // Load token balance
  const loadTokenBalance = async (uid: string) => {
    const { data } = await supabase
      .from('user_tokens')
      .select('tokens_remaining')
      .eq('user_id', uid)
      .maybeSingle();
    setTokenBalance(data?.tokens_remaining || 0);
  };

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Filter library duas
  const getFilteredDuas = (): LibraryDua[] => {
    let duas = selectedCategory
      ? getDuasByCategory(selectedCategory)
      : DUA_LIBRARY;

    if (libraryFilter === 'core') {
      duas = duas.filter(d => d.isCore);
    } else if (libraryFilter === 'situational') {
      duas = duas.filter(d => !d.isCore);
    }

    if (librarySearch.trim()) {
      duas = searchDuas(librarySearch);
    }

    return duas;
  };

  // Filter names
  const getFilteredNames = (): AllahName[] => {
    if (namesCategory) {
      return getNamesByCategory(namesCategory);
    }
    if (namesSearch.trim()) {
      return searchNames(namesSearch);
    }
    return ALLAH_NAMES;
  };

  // Generate dua (AI fallback)
  const handleGenerateDua = async () => {
    if (!createCategory) {
      toast.error('Please select a category');
      return;
    }

    setGenerating(true);
    setGeneratedDua(null);
    setAudioUrl(null);

    try {
      const category = DUA_CATEGORIES.find(c => c.id === createCategory);
      const suggestedNames = category?.suggestedNames || [];

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-dua`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            category: createCategory,
            suggestedNames,
            user_id: userId
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate dua');
      }

      const data = await response.json();
      setGeneratedDua(data);
      toast.success('Dua generated successfully!');
    } catch (error: any) {
      console.error('Error generating dua:', error);
      toast.error(error.message || 'Error generating dua');
    } finally {
      setGenerating(false);
    }
  };

  // Generate audio
  const handleGenerateAudio = async (text: string, language: 'arabic' | 'english') => {
    setGeneratingAudio(true);
    setAudioLanguage(language);

    try {
      const response = await generateTTSAudio(text, language);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const url = URL.createObjectURL(audioBlob);

      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
      setAudioUrl(url);

      // Auto-play the audio
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      audio.onplay = () => setIsPlaying(true);
      audio.onpause = () => setIsPlaying(false);
      await audio.play();

      toast.success('Playing audio!');
    } catch (error: any) {
      console.error('Error generating audio:', error);
      toast.error(error.message || 'Error generating audio');
    } finally {
      setGeneratingAudio(false);
    }
  };

  // Download audio (costs tokens)
  const handleDownloadAudio = async (text: string, language: 'arabic' | 'english', title: string) => {
    if (!userId) {
      toast.error('Please sign in to download audio');
      return;
    }

    if (tokenBalance < DUA_AUDIO_TOKEN_COST) {
      toast.error(`Insufficient tokens. You need ${DUA_AUDIO_TOKEN_COST} tokens to download audio.`, {
        action: {
          label: 'Buy Tokens',
          onClick: () => navigate('/buy-credits?tab=tokens')
        }
      });
      return;
    }

    setDownloadingAudio(true);
    setAudioLanguage(language);

    try {
      // Deduct tokens first
      const { data: deductResult, error: deductError } = await supabase.rpc('deduct_user_tokens', {
        p_user_id: userId,
        p_tokens: DUA_AUDIO_TOKEN_COST,
        p_feature: 'dua_audio',
        p_notes: `Downloaded ${language} audio for dua: ${title}`
      });

      if (deductError || !deductResult?.success) {
        throw new Error(deductResult?.error || 'Failed to deduct tokens');
      }

      // Update local token balance
      setTokenBalance(deductResult.new_balance);

      // Generate audio
      const response = await generateTTSAudio(text, language);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();

      // Download the file
      const url = URL.createObjectURL(audioBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dua-${title.toLowerCase().replace(/\s+/g, '-')}-${language}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success(`Audio downloaded! ${DUA_AUDIO_TOKEN_COST} tokens used.`);
    } catch (error: any) {
      console.error('Error downloading audio:', error);
      toast.error(error.message || 'Error downloading audio');
    } finally {
      setDownloadingAudio(false);
    }
  };

  // Audio controls
  const togglePlayback = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const stopPlayback = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    audioRef.current.currentTime = 0;
    setIsPlaying(false);
  };

  // Save dua
  const handleSaveDua = async (dua: GeneratedDua | LibraryDua, source: 'generated' | 'library') => {
    if (!userId) {
      toast.error('Please sign in to save duas');
      return;
    }

    setSaving(true);
    try {
      const duaData = {
        user_id: userId,
        category_id: 'category' in dua ? dua.category : (dua as LibraryDua).category,
        title: dua.title,
        arabic_text: 'arabic' in dua ? dua.arabic : (dua as LibraryDua).arabic,
        transliteration: dua.transliteration,
        english_text: 'english' in dua ? dua.english : (dua as LibraryDua).english,
        allah_names_used: 'namesUsed' in dua ? dua.namesUsed : [],
        source: source === 'library' ? `library:${(dua as LibraryDua).id}` : 'generated',
        is_favorite: false
      };

      const { error } = await supabase
        .from('saved_duas')
        .insert(duaData);

      if (error) throw error;

      toast.success('Dua saved to My Duas!');
    } catch (error: any) {
      console.error('Error saving dua:', error);
      toast.error('Error saving dua');
    } finally {
      setSaving(false);
    }
  };

  // Copy text
  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
      toast.success('Copied to clipboard');
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  // Render dua card
  const renderDuaCard = (dua: LibraryDua, isExpanded: boolean, onToggle: () => void) => (
    <div key={dua.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      <button
        onClick={onToggle}
        aria-expanded={isExpanded}
        className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
      >
        <div>
          <h3 className="font-medium text-gray-900">{dua.title}</h3>
          <p className="text-sm text-gray-500">{dua.titleArabic}</p>
        </div>
        <div className="flex items-center gap-2">
          {dua.isCore && (
            <span className="px-2 py-0.5 text-xs bg-emerald-100 text-emerald-700 rounded-full">
              Daily
            </span>
          )}
          {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </button>

      {isExpanded && (
        <div className="p-4 pt-0 border-t border-gray-100">
          {/* Arabic */}
          <div className="mb-4">
            <p className="text-xl text-right font-arabic leading-loose text-gray-900" dir="rtl">
              {dua.arabic}
            </p>
          </div>

          {/* Transliteration */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 italic">{dua.transliteration}</p>
          </div>

          {/* Translation */}
          <div className="mb-4">
            <p className="text-gray-800">{dua.english}</p>
          </div>

          {/* Source */}
          <p className="text-xs text-gray-500 mb-4">Source: {dua.source}</p>

          {/* Actions */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => handleGenerateAudio(dua.arabic, 'arabic')}
              disabled={generatingAudio}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 disabled:opacity-50"
            >
              {generatingAudio && audioLanguage === 'arabic' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Volume2 size={14} />
              )}
              Play Arabic
            </button>
            <button
              onClick={() => copyToClipboard(`${dua.arabic}\n\n${dua.transliteration}\n\n${dua.english}`, dua.id)}
              className="flex items-center gap-1 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              {copiedId === dua.id ? <Check size={14} /> : <Copy size={14} />}
              Copy
            </button>
            {userId && (
              <button
                onClick={() => handleSaveDua(dua, 'library')}
                disabled={saving}
                className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 disabled:opacity-50"
              >
                {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                Save
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-emerald-500 focus:text-white focus:rounded-lg"
      >
        Skip to content
      </a>

      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center gap-1 text-emerald-100 hover:text-white"
            >
              <ChevronLeft size={20} />
              Back
            </button>
            {userId && (
              <button
                onClick={() => navigate('/buy-credits?tab=tokens')}
                className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg text-sm transition"
              >
                <Coins size={16} />
                <span>{tokenBalance} tokens</span>
              </button>
            )}
          </div>
          <h1 className="text-2xl font-bold">Dua Builder</h1>
          <p className="text-emerald-100 mt-1">
            Build, learn, and memorize authentic duas
          </p>

          {/* Quick Links to Special Duas */}
          <div className="mt-4 space-y-2">
            {/* Qunut Practice Quick Link */}
            <button
              onClick={() => navigate('/qunut-practice')}
              className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
                  <Moon className="text-amber-300" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Qunut Dua for Witr</p>
                  <p className="text-xs text-emerald-200">Learn, practice & download PDF</p>
                </div>
              </div>
              <ChevronLeft className="rotate-180 text-emerald-200 group-hover:translate-x-1 transition-transform" size={20} />
            </button>

            {/* Istikhara Practice Quick Link */}
            <button
              onClick={() => navigate('/istikhara-practice')}
              className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Compass className="text-blue-300" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Salatul Istikhara</p>
                  <p className="text-xs text-emerald-200">Step-by-step guidance prayer</p>
                </div>
              </div>
              <ChevronLeft className="rotate-180 text-emerald-200 group-hover:translate-x-1 transition-transform" size={20} />
            </button>

            {/* Janazah Practice Quick Link */}
            <button
              onClick={() => navigate('/janazah-practice')}
              className="w-full flex items-center justify-between p-3 bg-white/10 hover:bg-white/20 rounded-xl border border-white/20 transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-slate-500/20 rounded-lg flex items-center justify-center">
                  <Heart className="text-slate-300" size={20} />
                </div>
                <div className="text-left">
                  <p className="font-semibold text-white">Salatul Janazah</p>
                  <p className="text-xs text-emerald-200">Learn the funeral prayer</p>
                </div>
              </div>
              <ChevronLeft className="rotate-180 text-emerald-200 group-hover:translate-x-1 transition-transform" size={20} />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4">
          <div
            role="tablist"
            aria-label="Dua Builder sections"
            className="flex gap-1 bg-emerald-700/50 rounded-lg p-1 overflow-x-auto"
          >
            {[
              { id: 'build' as TabType, label: 'Build', icon: Layers },
              { id: 'library' as TabType, label: 'Library', icon: BookOpen },
              { id: 'saved' as TabType, label: 'My Duas', icon: Heart },
              { id: 'names' as TabType, label: 'Names', icon: Star },
              { id: 'learn' as TabType, label: 'Learn', icon: GraduationCap }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                role="tab"
                aria-selected={activeTab === tab.id}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-sm font-medium transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-white text-emerald-700'
                    : 'text-emerald-100 hover:bg-emerald-600/50'
                }`}
              >
                <tab.icon size={16} />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <main id="main-content" className="max-w-4xl mx-auto px-4 py-6">
        {/* Build Tab - New Modular Composer */}
        {activeTab === 'build' && (
          <div className="space-y-6">
            {/* AI Generator toggle */}
            <div className="flex justify-end">
              <button
                onClick={() => setShowAIGenerator(!showAIGenerator)}
                className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1"
              >
                <Sparkles size={14} />
                {showAIGenerator ? 'Hide AI Generator' : 'Quick AI Generate'}
              </button>
            </div>

            {/* AI Generator (collapsed by default) */}
            {showAIGenerator && (
              <div className="bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200 rounded-xl p-6 space-y-4">
                <div className="flex items-center gap-2 text-violet-800">
                  <Sparkles size={20} />
                  <h3 className="font-semibold">Quick AI Generation</h3>
                </div>
                <p className="text-sm text-violet-700">
                  Let AI generate a complete dua for you. For more control and authentic content,
                  use the block-by-block builder below.
                </p>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {DUA_CATEGORIES.filter(c => !c.isCore).slice(0, 6).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setCreateCategory(cat.id)}
                      className={`p-3 rounded-lg text-left text-sm transition-all ${
                        createCategory === cat.id
                          ? 'bg-violet-600 text-white'
                          : 'bg-white border border-violet-200 hover:border-violet-300'
                      }`}
                    >
                      <span className="text-lg">{cat.icon}</span>
                      <span className={`ml-2 ${createCategory === cat.id ? 'text-white' : 'text-gray-700'}`}>
                        {cat.name}
                      </span>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleGenerateDua}
                  disabled={!createCategory || generating}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-lg hover:bg-violet-700 disabled:opacity-50"
                >
                  {generating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generate Dua
                    </>
                  )}
                </button>

                {/* Generated dua display */}
                {generatedDua && (
                  <div className="bg-white rounded-lg p-4 space-y-4">
                    <h4 className="font-medium text-gray-900">{generatedDua.title}</h4>
                    <p className="text-lg font-arabic text-right text-gray-900" dir="rtl">
                      {generatedDua.arabic}
                    </p>
                    <p className="text-sm text-gray-600 italic">{generatedDua.transliteration}</p>
                    <p className="text-gray-700">{generatedDua.english}</p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => handleGenerateAudio(generatedDua.arabic, 'arabic')}
                        disabled={generatingAudio}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100"
                      >
                        <Volume2 size={14} /> Play
                      </button>
                      <button
                        onClick={() => handleSaveDua(generatedDua, 'generated')}
                        disabled={saving}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
                      >
                        <Save size={14} /> Save
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Main Modular Composer */}
            <DuaComposer
              userId={userId}
              tokenBalance={tokenBalance}
              onTokensUsed={setTokenBalance}
            />
          </div>
        )}

        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <label htmlFor="library-search" className="sr-only">Search duas</label>
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  id="library-search"
                  type="text"
                  placeholder="Search duas..."
                  value={librarySearch}
                  onChange={e => setLibrarySearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                />
              </div>
              <div className="flex gap-2">
                {(['all', 'core', 'situational'] as const).map(filter => (
                  <button
                    key={filter}
                    onClick={() => setLibraryFilter(filter)}
                    className={`px-3 py-2 text-sm rounded-lg transition-colors ${
                      libraryFilter === filter
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {filter === 'all' ? 'All' : filter === 'core' ? 'Daily' : 'Situational'}
                  </button>
                ))}
              </div>
            </div>

            {/* Categories */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                  !selectedCategory
                    ? 'bg-emerald-600 text-white'
                    : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                }`}
              >
                All Categories
              </button>
              {DUA_CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1 ${
                    selectedCategory === cat.id
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <span>{cat.icon}</span>
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Duas list */}
            <div className="space-y-3">
              {getFilteredDuas().length === 0 ? (
                <p className="text-center text-gray-500 py-8">No duas found</p>
              ) : (
                getFilteredDuas().map(dua => renderDuaCard(
                  dua,
                  expandedDuaId === dua.id,
                  () => setExpandedDuaId(expandedDuaId === dua.id ? null : dua.id)
                ))
              )}
            </div>
          </div>
        )}

        {/* Saved Duas Tab */}
        {activeTab === 'saved' && (
          <DuaMyDuasTab
            userId={userId}
            onGenerateAudio={handleGenerateAudio}
            generatingAudio={generatingAudio}
          />
        )}

        {/* Names of Allah Tab */}
        {activeTab === 'names' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <label htmlFor="names-search" className="sr-only">Search Names of Allah</label>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                id="names-search"
                type="text"
                placeholder="Search by name, meaning, or description..."
                value={namesSearch}
                onChange={e => {
                  setNamesSearch(e.target.value);
                  setNamesCategory(null);
                }}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
              />
            </div>

            {/* Filter by dua category */}
            <div>
              <p className="text-sm text-gray-600 mb-2">Filter by what you're seeking:</p>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => {
                    setNamesCategory(null);
                    setNamesSearch('');
                  }}
                  className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                    !namesCategory && !namesSearch
                      ? 'bg-emerald-600 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  All Names
                </button>
                {DUA_CATEGORIES.filter(c => !c.isCore).slice(0, 8).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setNamesCategory(cat.id);
                      setNamesSearch('');
                    }}
                    className={`px-3 py-1.5 text-sm rounded-full transition-colors flex items-center gap-1 ${
                      namesCategory === cat.id
                        ? 'bg-emerald-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Names list */}
            <div className="space-y-2">
              {getFilteredNames().map(name => (
                <div
                  key={name.number}
                  className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedNameNumber(expandedNameNumber === name.number ? null : name.number)}
                    aria-expanded={expandedNameNumber === name.number}
                    className="w-full p-4 text-left flex items-center justify-between hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-4">
                      <span className="w-8 h-8 flex items-center justify-center bg-emerald-100 text-emerald-700 text-sm font-medium rounded-full">
                        {name.number}
                      </span>
                      <div>
                        <p className="text-xl font-arabic text-gray-900">{name.arabic}</p>
                        <p className="text-sm text-gray-600">{name.transliteration}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-gray-700 font-medium">{name.meaning}</span>
                      {expandedNameNumber === name.number ? (
                        <ChevronUp size={20} className="text-gray-400" />
                      ) : (
                        <ChevronDown size={20} className="text-gray-400" />
                      )}
                    </div>
                  </button>

                  {expandedNameNumber === name.number && (
                    <div className="p-4 pt-0 border-t border-gray-100">
                      <p className="text-gray-700 mb-3">{name.description}</p>
                      <div>
                        <p className="text-xs text-gray-500 mb-2">Best used when seeking:</p>
                        <div className="flex flex-wrap gap-1">
                          {name.duaCategories.map(catId => {
                            const cat = DUA_CATEGORIES.find(c => c.id === catId);
                            return cat ? (
                              <span
                                key={catId}
                                className="px-2 py-0.5 bg-emerald-50 text-emerald-700 text-xs rounded-full"
                              >
                                {cat.icon} {cat.name}
                              </span>
                            ) : null;
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Learn Tab */}
        {activeTab === 'learn' && <DuaLearnTab />}
      </main>

      {/* Global audio player */}
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onEnded={() => setIsPlaying(false)}
          className="hidden"
        />
      )}
    </div>
  );
}
