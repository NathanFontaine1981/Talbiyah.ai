import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  X,
  ChevronDown,
  ChevronUp,
  Download
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { toast } from 'sonner';
import { ALLAH_NAMES, getNamesByCategory, searchNames, type AllahName } from '../data/allahNames';
import { DUA_LIBRARY, DUA_CATEGORIES, getDuasByCategory, searchDuas, type LibraryDua, type DuaCategory } from '../data/duaLibrary';

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

interface SavedDua {
  id: string;
  title: string;
  arabic_text: string;
  transliteration: string;
  english_text: string;
  category_id: string;
  allah_names_used: string[];
  is_favorite: boolean;
  source: string;
  created_at: string;
}

type TabType = 'library' | 'create' | 'saved' | 'names';

export default function DuaBuilder() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [userId, setUserId] = useState<string | null>(null);

  // Library state
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [libraryFilter, setLibraryFilter] = useState<'all' | 'core' | 'situational'>('all');
  const [librarySearch, setLibrarySearch] = useState('');
  const [expandedDuaId, setExpandedDuaId] = useState<string | null>(null);

  // Create state
  const [createCategory, setCreateCategory] = useState<string>('');
  const [generating, setGenerating] = useState(false);
  const [generatedDua, setGeneratedDua] = useState<GeneratedDua | null>(null);

  // Audio state
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioLanguage, setAudioLanguage] = useState<'arabic' | 'english'>('arabic');
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Saved duas state
  const [savedDuas, setSavedDuas] = useState<SavedDua[]>([]);
  const [loadingSaved, setLoadingSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  // Names state
  const [namesSearch, setNamesSearch] = useState('');
  const [namesCategory, setNamesCategory] = useState<string | null>(null);
  const [expandedNameNumber, setExpandedNameNumber] = useState<number | null>(null);

  // Copy state
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Get user on mount
  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUser();
  }, []);

  // Cleanup audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Load saved duas when tab is opened
  useEffect(() => {
    if (activeTab === 'saved' && userId && savedDuas.length === 0) {
      loadSavedDuas();
    }
  }, [activeTab, userId]);

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

  // Generate dua
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-dua-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({
            text,
            language
          }),
        }
      );

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

      const { data, error } = await supabase
        .from('saved_duas')
        .insert(duaData)
        .select()
        .single();

      if (error) throw error;

      setSavedDuas(prev => [data, ...prev]);
      toast.success('Dua saved to My Duas!');
    } catch (error: any) {
      console.error('Error saving dua:', error);
      toast.error('Error saving dua');
    } finally {
      setSaving(false);
    }
  };

  // Load saved duas
  const loadSavedDuas = async () => {
    if (!userId) return;
    setLoadingSaved(true);

    try {
      const { data, error } = await supabase
        .from('saved_duas')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSavedDuas(data || []);
    } catch (error: any) {
      console.error('Error loading saved duas:', error);
      toast.error('Error loading saved duas');
    } finally {
      setLoadingSaved(false);
    }
  };

  // Toggle favorite
  const toggleFavorite = async (id: string, currentState: boolean) => {
    try {
      const { error } = await supabase
        .from('saved_duas')
        .update({ is_favorite: !currentState })
        .eq('id', id);

      if (error) throw error;

      setSavedDuas(prev =>
        prev.map(d => d.id === id ? { ...d, is_favorite: !currentState } : d)
      );
    } catch (error: any) {
      console.error('Error updating favorite:', error);
      toast.error('Error updating favorite');
    }
  };

  // Delete saved dua
  const deleteSavedDua = async (id: string) => {
    try {
      const { error } = await supabase
        .from('saved_duas')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setSavedDuas(prev => prev.filter(d => d.id !== id));
      toast.success('Dua removed');
    } catch (error: any) {
      console.error('Error deleting dua:', error);
      toast.error('Error deleting dua');
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
      {/* Header */}
      <div className="bg-gradient-to-br from-emerald-600 to-emerald-800 text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-emerald-100 hover:text-white mb-4"
          >
            <ChevronLeft size={20} />
            Back
          </button>
          <h1 className="text-2xl font-bold">Dua Builder</h1>
          <p className="text-emerald-100 mt-1">
            Learn, memorize, and create personalized duas
          </p>
        </div>

        {/* Tabs */}
        <div className="max-w-4xl mx-auto px-4">
          <div className="flex gap-1 bg-emerald-700/50 rounded-lg p-1">
            {[
              { id: 'library' as TabType, label: 'Library', icon: BookOpen },
              { id: 'create' as TabType, label: 'Create', icon: Sparkles },
              { id: 'saved' as TabType, label: 'My Duas', icon: Heart },
              { id: 'names' as TabType, label: 'Names', icon: Star }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
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
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Library Tab */}
        {activeTab === 'library' && (
          <div className="space-y-4">
            {/* Search and filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
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

        {/* Create Tab */}
        {activeTab === 'create' && (
          <div className="space-y-6">
            {/* Category selection */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-3">
                What are you seeking?
              </h2>
              <p className="text-sm text-gray-600 mb-4">
                Select a category and we'll generate a personalized dua with the proper Islamic structure.
                Your privacy is maintained - you don't need to share specific details.
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {DUA_CATEGORIES.filter(c => !c.isCore).map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => setCreateCategory(cat.id)}
                    className={`p-4 rounded-xl text-left transition-all ${
                      createCategory === cat.id
                        ? 'bg-emerald-600 text-white shadow-lg scale-[1.02]'
                        : 'bg-white border border-gray-200 hover:border-emerald-300 hover:shadow'
                    }`}
                  >
                    <span className="text-2xl mb-2 block">{cat.icon}</span>
                    <span className={`font-medium ${createCategory === cat.id ? 'text-white' : 'text-gray-900'}`}>
                      {cat.name}
                    </span>
                    <p className={`text-xs mt-1 ${createCategory === cat.id ? 'text-emerald-100' : 'text-gray-500'}`}>
                      {cat.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Generate button */}
            <div className="flex justify-center">
              <button
                onClick={handleGenerateDua}
                disabled={!createCategory || generating}
                className="flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white rounded-xl font-medium hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {generating ? (
                  <>
                    <Loader2 size={20} className="animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Sparkles size={20} />
                    Generate Dua
                  </>
                )}
              </button>
            </div>

            {/* Generated dua */}
            {generatedDua && (
              <div className="bg-white rounded-xl shadow-lg p-6 space-y-6">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-900">{generatedDua.title}</h3>
                  <p className="text-gray-500">{generatedDua.titleArabic}</p>
                </div>

                {/* Names used */}
                {generatedDua.namesUsed && generatedDua.namesUsed.length > 0 && (
                  <div className="flex flex-wrap gap-2 justify-center">
                    {generatedDua.namesUsed.map(name => (
                      <span
                        key={name}
                        className="px-2 py-1 bg-emerald-50 text-emerald-700 text-sm rounded-full"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                {/* Arabic */}
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-2xl text-right font-arabic leading-loose text-gray-900" dir="rtl">
                    {generatedDua.arabic}
                  </p>
                </div>

                {/* Transliteration */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Transliteration</h4>
                  <p className="text-gray-700 italic">{generatedDua.transliteration}</p>
                </div>

                {/* Translation */}
                <div>
                  <h4 className="text-sm font-medium text-gray-500 mb-1">Translation</h4>
                  <p className="text-gray-800">{generatedDua.english}</p>
                </div>

                {/* Audio controls */}
                <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => handleGenerateAudio(generatedDua.arabic, 'arabic')}
                    disabled={generatingAudio}
                    className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                  >
                    {generatingAudio && audioLanguage === 'arabic' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Volume2 size={16} />
                    )}
                    Arabic Audio
                  </button>
                  <button
                    onClick={() => handleGenerateAudio(generatedDua.english, 'english')}
                    disabled={generatingAudio}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {generatingAudio && audioLanguage === 'english' ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Volume2 size={16} />
                    )}
                    English Audio
                  </button>

                  {audioUrl && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={togglePlayback}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        {isPlaying ? <Pause size={16} /> : <Play size={16} />}
                      </button>
                      <button
                        onClick={stopPlayback}
                        className="p-2 bg-gray-100 rounded-lg hover:bg-gray-200"
                      >
                        <StopCircle size={16} />
                      </button>
                    </div>
                  )}
                </div>

                {/* Save and copy */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => copyToClipboard(`${generatedDua.arabic}\n\n${generatedDua.transliteration}\n\n${generatedDua.english}`, 'generated')}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    {copiedId === 'generated' ? <Check size={16} /> : <Copy size={16} />}
                    Copy
                  </button>
                  {userId && (
                    <button
                      onClick={() => handleSaveDua(generatedDua, 'generated')}
                      disabled={saving}
                      className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save to My Duas
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Saved Duas Tab */}
        {activeTab === 'saved' && (
          <div className="space-y-4">
            {!userId ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Heart size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">Sign in to save duas</h3>
                <p className="text-gray-500">Create an account to save and organize your favorite duas.</p>
              </div>
            ) : loadingSaved ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-emerald-600" size={32} />
              </div>
            ) : savedDuas.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No saved duas yet</h3>
                <p className="text-gray-500">
                  Save duas from the Library or Create tabs to build your personal collection.
                </p>
              </div>
            ) : (
              <>
                {/* Favorites first */}
                {savedDuas.filter(d => d.is_favorite).length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1">
                      <Heart size={14} className="text-red-500" /> Favorites
                    </h3>
                    <div className="space-y-3">
                      {savedDuas.filter(d => d.is_favorite).map(dua => (
                        <div key={dua.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                          <div className="flex items-start justify-between mb-3">
                            <h4 className="font-medium text-gray-900">{dua.title}</h4>
                            <div className="flex gap-1">
                              <button
                                onClick={() => toggleFavorite(dua.id, dua.is_favorite)}
                                className="p-1.5 text-red-500 hover:bg-red-50 rounded"
                              >
                                <Heart size={16} fill="currentColor" />
                              </button>
                              <button
                                onClick={() => deleteSavedDua(dua.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </div>
                          <p className="text-lg text-right font-arabic text-gray-900 mb-2" dir="rtl">
                            {dua.arabic_text}
                          </p>
                          <p className="text-sm text-gray-600 italic mb-2">{dua.transliteration}</p>
                          <p className="text-sm text-gray-700">{dua.english_text}</p>
                          <div className="flex gap-2 mt-3">
                            <button
                              onClick={() => handleGenerateAudio(dua.arabic_text, 'arabic')}
                              disabled={generatingAudio}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                            >
                              <Volume2 size={12} /> Play
                            </button>
                            <button
                              onClick={() => copyToClipboard(`${dua.arabic_text}\n\n${dua.transliteration}\n\n${dua.english_text}`, dua.id)}
                              className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                            >
                              {copiedId === dua.id ? <Check size={12} /> : <Copy size={12} />} Copy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* All saved */}
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-gray-500 mb-3">All Saved ({savedDuas.length})</h3>
                  {savedDuas.filter(d => !d.is_favorite).map(dua => (
                    <div key={dua.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                      <div className="flex items-start justify-between mb-3">
                        <h4 className="font-medium text-gray-900">{dua.title}</h4>
                        <div className="flex gap-1">
                          <button
                            onClick={() => toggleFavorite(dua.id, dua.is_favorite)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Heart size={16} />
                          </button>
                          <button
                            onClick={() => deleteSavedDua(dua.id)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <p className="text-lg text-right font-arabic text-gray-900 mb-2" dir="rtl">
                        {dua.arabic_text}
                      </p>
                      <p className="text-sm text-gray-600 italic mb-2">{dua.transliteration}</p>
                      <p className="text-sm text-gray-700">{dua.english_text}</p>
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleGenerateAudio(dua.arabic_text, 'arabic')}
                          disabled={generatingAudio}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-emerald-50 text-emerald-700 rounded hover:bg-emerald-100"
                        >
                          <Volume2 size={12} /> Play
                        </button>
                        <button
                          onClick={() => copyToClipboard(`${dua.arabic_text}\n\n${dua.transliteration}\n\n${dua.english_text}`, dua.id)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                        >
                          {copiedId === dua.id ? <Check size={12} /> : <Copy size={12} />} Copy
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}

        {/* Names of Allah Tab */}
        {activeTab === 'names' && (
          <div className="space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
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
      </div>

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
