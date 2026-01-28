import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  ChevronLeft,
  Loader2,
  Brain,
  Search,
  Calendar,
  User,
  MapPin,
  BookOpen,
  Download,
  Eye,
  Trash2,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Volume2,
  Pause,
  Play,
  Coins
} from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { generateTalbiyahInsightsPDF } from '../utils/generateInsightsPDF';

interface KhutbaInsight {
  id: string;
  title: string;
  speaker: string | null;
  location: string | null;
  khutba_date: string | null;
  insights: any;
  created_at: string;
  created_by: string;
}

// Token costs for premium features
const INSIGHT_AUDIO_TOKEN_COST = 15;
const INSIGHT_PDF_TOKEN_COST = 10;

// Quiz Question Component - hides answer until student selects
function QuizQuestion({ question, index }: { question: any; index: number }) {
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);

  const handleSelect = (option: string) => {
    if (showResult) return; // Already answered
    setSelectedAnswer(option.charAt(0));
    setShowResult(true);
  };

  const isCorrect = selectedAnswer === question.correct_answer;

  return (
    <div className="bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
      <p className="text-gray-700 font-medium mb-3">{index + 1}. {question.question}</p>
      <div className="space-y-2 ml-4">
        {question.options.map((opt: string, optIdx: number) => {
          const optionLetter = opt.charAt(0);
          const isThisCorrect = optionLetter === question.correct_answer;
          const isSelected = selectedAnswer === optionLetter;

          let bgColor = 'bg-gray-50 hover:bg-gray-100';
          let textColor = 'text-gray-600';

          if (showResult) {
            if (isThisCorrect) {
              bgColor = 'bg-emerald-500/20';
              textColor = 'text-emerald-400';
            } else if (isSelected && !isThisCorrect) {
              bgColor = 'bg-red-500/20';
              textColor = 'text-red-400';
            }
          }

          return (
            <button
              key={optIdx}
              onClick={() => handleSelect(opt)}
              disabled={showResult}
              className={`w-full text-left px-3 py-2 rounded-lg transition ${bgColor} ${textColor} ${!showResult ? 'cursor-pointer' : 'cursor-default'}`}
            >
              {opt}
              {showResult && isThisCorrect && ' ✓'}
              {showResult && isSelected && !isThisCorrect && ' ✗'}
            </button>
          );
        })}
      </div>
      {showResult && (
        <div className={`mt-3 p-2 rounded ${isCorrect ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
          {isCorrect ? '✓ Correct!' : `✗ Incorrect. The correct answer is ${question.correct_answer}.`}
          {question.explanation && (
            <p className="text-gray-500 text-sm mt-1">{question.explanation}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function InsightsLibrary() {
  const navigate = useNavigate();
  const [insights, setInsights] = useState<KhutbaInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSpeaker, setFilterSpeaker] = useState('');
  const [selectedInsight, setSelectedInsight] = useState<KhutbaInsight | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [downloadingPDF, setDownloadingPDF] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // TTS playback states
  const [ttsLoading, setTtsLoading] = useState(false);
  const [ttsPlaying, setTtsPlaying] = useState(false);
  const [ttsAudioUrl, setTtsAudioUrl] = useState<string | null>(null);
  const [ttsSection, setTtsSection] = useState<string | null>(null);
  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);

  // Token balance state
  const [tokenBalance, setTokenBalance] = useState<number>(0);
  const [tokenLoading, setTokenLoading] = useState(true);

  // Get unique speakers for filter
  const speakers = [...new Set(insights.filter(i => i.speaker).map(i => i.speaker as string))];

  useEffect(() => {
    fetchInsights();
    checkAdmin();
    loadTokenBalance();
  }, []);

  async function loadTokenBalance() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setTokenLoading(false);
        return;
      }

      const { data, error } = await supabase.rpc('get_user_tokens', {
        p_user_id: user.id
      });

      if (error) {
        console.error('Error loading token balance:', error);
      } else {
        setTokenBalance(data || 0);
      }
    } catch (error) {
      console.error('Error loading token balance:', error);
    } finally {
      setTokenLoading(false);
    }
  }

  async function checkAdmin() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
        setIsAdmin(profile?.role === 'admin');
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  }

  async function fetchInsights() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('khutba_insights')
        .select('*')
        .order('khutba_date', { ascending: false, nullsFirst: false });

      if (error) {
        // Handle case where table doesn't exist yet
        if (error.code === 'PGRST205' || error.code === '42P01') {
          setInsights([]);
          return;
        }
        throw error;
      }
      setInsights(data || []);
    } catch (error: any) {
      console.error('Error fetching insights:', error);
      setInsights([]);
    } finally {
      setLoading(false);
    }
  }

  async function deleteInsight(id: string) {
    if (!isAdmin) return;
    if (!confirm('Are you sure you want to delete this insight? This cannot be undone.')) return;

    setDeleting(id);
    try {
      const { error } = await supabase
        .from('khutba_insights')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setInsights(insights.filter(i => i.id !== id));
      if (selectedInsight?.id === id) setSelectedInsight(null);
    } catch (error: any) {
      console.error('Error deleting insight:', error);
      toast.error('Error deleting insight: ' + error.message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleDownloadPDF(insight: KhutbaInsight) {
    // Check token balance first
    if (tokenBalance < INSIGHT_PDF_TOKEN_COST) {
      toast.error(`Not enough tokens. PDF download costs ${INSIGHT_PDF_TOKEN_COST} tokens.`, {
        action: {
          label: 'Buy Tokens',
          onClick: () => navigate('/buy-credits?tab=tokens')
        }
      });
      return;
    }

    setDownloadingPDF(insight.id);
    try {
      // Deduct tokens first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to download PDFs');
        return;
      }

      const { data: deductResult, error: deductError } = await supabase.rpc('deduct_user_tokens', {
        p_user_id: user.id,
        p_tokens: INSIGHT_PDF_TOKEN_COST,
        p_feature: 'insight_pdf_download',
        p_notes: `PDF download: ${insight.title}`
      });

      if (deductError || !deductResult?.success) {
        toast.error(deductResult?.error || 'Failed to deduct tokens');
        return;
      }

      // Update local balance
      setTokenBalance(deductResult.new_balance);

      await generateTalbiyahInsightsPDF({
        ...insight.insights,
        title: insight.title,
        speaker: insight.speaker || insight.insights.speaker,
        khutba_date: insight.khutba_date,
        location: insight.location
      });

      toast.success(`PDF downloaded! ${INSIGHT_PDF_TOKEN_COST} tokens used.`);
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      toast.error('Error generating PDF. Please try again.');
    } finally {
      setDownloadingPDF(null);
    }
  }

  // Text-to-Speech function
  const playTTS = async (text: string, sectionId: string) => {
    // If same section is playing, pause it
    if (ttsSection === sectionId && ttsPlaying) {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        setTtsPlaying(false);
      }
      return;
    }

    // If same section is paused, resume
    if (ttsSection === sectionId && ttsAudioUrl && ttsAudioRef.current) {
      ttsAudioRef.current.play();
      setTtsPlaying(true);
      return;
    }

    // Check token balance before generating new audio
    if (tokenBalance < INSIGHT_AUDIO_TOKEN_COST) {
      toast.error(`Not enough tokens. Audio costs ${INSIGHT_AUDIO_TOKEN_COST} tokens.`, {
        action: {
          label: 'Buy Tokens',
          onClick: () => navigate('/buy-credits?tab=tokens')
        }
      });
      return;
    }

    // Stop any currently playing audio
    if (ttsAudioRef.current) {
      ttsAudioRef.current.pause();
      ttsAudioRef.current = null;
    }
    if (ttsAudioUrl) {
      URL.revokeObjectURL(ttsAudioUrl);
      setTtsAudioUrl(null);
    }

    setTtsLoading(true);
    setTtsSection(sectionId);
    setTtsPlaying(false);

    try {
      // Deduct tokens first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('Please sign in to use audio');
        setTtsLoading(false);
        setTtsSection(null);
        return;
      }

      const { data: deductResult, error: deductError } = await supabase.rpc('deduct_user_tokens', {
        p_user_id: user.id,
        p_tokens: INSIGHT_AUDIO_TOKEN_COST,
        p_feature: 'insight_audio',
        p_notes: `Audio playback: ${sectionId}`
      });

      if (deductError || !deductResult?.success) {
        toast.error(deductResult?.error || 'Failed to deduct tokens');
        setTtsLoading(false);
        setTtsSection(null);
        return;
      }

      // Update local balance
      setTokenBalance(deductResult.new_balance);

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-khutba-audio`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ text })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to generate audio');
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      setTtsAudioUrl(audioUrl);

      const audio = new Audio(audioUrl);
      ttsAudioRef.current = audio;

      audio.onended = () => {
        setTtsPlaying(false);
        setTtsSection(null);
      };

      audio.onerror = () => {
        setTtsPlaying(false);
        setTtsSection(null);
        toast.error('Error playing audio');
      };

      audio.onplay = () => {
        setTtsPlaying(true);
        setTtsLoading(false);
      };

      audio.onpause = () => {
        setTtsPlaying(false);
      };

      try {
        await audio.play();
      } catch (playError: any) {
        // Ignore AbortError - it's not a real error, just interrupted playback
        if (playError.name !== 'AbortError') {
          throw playError;
        }
      }

    } catch (error: any) {
      console.error('Error generating TTS:', error);
      // Don't show error toast for AbortError
      if (error.name !== 'AbortError') {
        toast.error(`Error: ${error.message}`);
      }
      setTtsSection(null);
    } finally {
      setTtsLoading(false);
    }
  };

  // Cleanup TTS audio on unmount
  useEffect(() => {
    return () => {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
      }
      if (ttsAudioUrl) {
        URL.revokeObjectURL(ttsAudioUrl);
      }
    };
  }, [ttsAudioUrl]);

  // Filter insights
  const filteredInsights = insights.filter(insight => {
    const matchesSearch = !searchQuery ||
      insight.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.speaker?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      insight.location?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesSpeaker = !filterSpeaker || insight.speaker === filterSpeaker;

    return matchesSearch && matchesSpeaker;
  });

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Date not specified';
    return new Date(dateStr).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-amber-500 focus:text-white focus:rounded-lg"
      >
        Skip to insights
      </a>

      {/* Floating Audio Player */}
      {(ttsPlaying || ttsLoading) && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[60] bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-4 rounded-2xl shadow-2xl shadow-violet-500/40 flex items-center space-x-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            {ttsLoading ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <Volume2 className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <p className="font-semibold">
              {ttsLoading ? 'Generating Audio...' : 'Now Playing'}
            </p>
            <p className="text-violet-200 text-sm">
              {ttsSection === 'summary' ? 'Summary' : ttsSection === 'transcript' ? 'Full Khutbah' : 'Audio'}
            </p>
          </div>
          <button
            onClick={() => {
              if (ttsAudioRef.current) {
                if (ttsPlaying) {
                  ttsAudioRef.current.pause();
                  setTtsPlaying(false);
                } else {
                  ttsAudioRef.current.play();
                  setTtsPlaying(true);
                }
              }
            }}
            disabled={ttsLoading}
            aria-label={ttsPlaying ? 'Pause audio' : 'Play audio'}
            className="w-12 h-12 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition disabled:opacity-50"
          >
            {ttsPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
          </button>
          <button
            onClick={() => {
              if (ttsAudioRef.current) {
                ttsAudioRef.current.pause();
                ttsAudioRef.current = null;
              }
              if (ttsAudioUrl) {
                URL.revokeObjectURL(ttsAudioUrl);
                setTtsAudioUrl(null);
              }
              setTtsPlaying(false);
              setTtsSection(null);
            }}
            aria-label="Stop and close audio player"
            className="w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-500 hover:text-emerald-600 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-amber-500 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Talbiyah Insights Library</h1>
                <p className="text-xs text-gray-500">Weekly Khutba Study Notes</p>
              </div>
            </div>

            {/* Token Balance Display */}
            <div className="flex items-center space-x-2">
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-lg">
                <Coins className="w-4 h-4 text-violet-600" />
                {tokenLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-violet-600" />
                ) : (
                  <span className="text-sm font-semibold text-violet-700">{tokenBalance} tokens</span>
                )}
              </div>
              <button
                onClick={() => navigate('/buy-credits?tab=tokens')}
                className="text-xs text-violet-600 hover:text-violet-700 font-medium"
              >
                Get More
              </button>
            </div>
          </div>
        </div>
      </header>

      <main id="main-content" className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Explore Khutba Insights
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Access comprehensive study materials from weekly khutbas. Each insight includes
            Quranic vocabulary, hadith, quizzes, homework, and family discussion guides.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-8 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <label htmlFor="insights-search" className="sr-only">Search insights</label>
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                id="insights-search"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, speaker, or location..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              aria-expanded={showFilters}
              className="flex items-center space-x-2 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="filter-speaker" className="block text-gray-600 text-sm mb-2">Speaker / Imam</label>
                  <select
                    id="filter-speaker"
                    value={filterSpeaker}
                    onChange={(e) => setFilterSpeaker(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="">All Speakers</option>
                    {speakers.map(speaker => (
                      <option key={speaker} value={speaker}>{speaker}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-16">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">Loading insights...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredInsights.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Insights Found</h3>
            <p className="text-gray-500">
              {searchQuery || filterSpeaker
                ? 'Try adjusting your search or filters.'
                : 'Check back soon for new khutba insights.'}
            </p>
          </div>
        )}

        {/* Insights Grid */}
        {!loading && filteredInsights.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredInsights.map(insight => (
              <div
                key={insight.id}
                className="bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-amber-400 hover:shadow-md transition group"
              >
                {/* Card Header */}
                <div className="bg-amber-50 px-4 py-3 border-b border-amber-100">
                  <p className="text-amber-600 text-xs font-medium">Talbiyah Insights</p>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                    {insight.title}
                  </h3>

                  <div className="space-y-2 text-sm">
                    {insight.speaker && (
                      <div className="flex items-center text-gray-500">
                        <User className="w-4 h-4 mr-2 text-emerald-500" />
                        <span>{insight.speaker}</span>
                      </div>
                    )}
                    {insight.location && (
                      <div className="flex items-center text-gray-500">
                        <MapPin className="w-4 h-4 mr-2 text-emerald-500" />
                        <span>{insight.location}</span>
                      </div>
                    )}
                    <div className="flex items-center text-gray-500">
                      <Calendar className="w-4 h-4 mr-2 text-purple-500" />
                      <span>{formatDate(insight.khutba_date)}</span>
                    </div>
                  </div>

                  {/* Key Themes Preview */}
                  {insight.insights?.key_themes?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {insight.insights.key_themes.slice(0, 2).map((theme: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full"
                        >
                          {theme.theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedInsight(insight)}
                    className="flex items-center space-x-1 text-amber-600 hover:text-amber-700 transition text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadPDF(insight)}
                      disabled={downloadingPDF === insight.id}
                      className="flex items-center space-x-1 text-emerald-600 hover:text-emerald-700 transition text-sm disabled:opacity-50"
                      title={`Download PDF (${INSIGHT_PDF_TOKEN_COST} tokens)`}
                    >
                      {downloadingPDF === insight.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>PDF</span>
                      <span className="text-xs text-gray-400">({INSIGHT_PDF_TOKEN_COST})</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => deleteInsight(insight.id)}
                        disabled={deleting === insight.id}
                        className="flex items-center space-x-1 text-red-500 hover:text-red-600 transition text-sm disabled:opacity-50"
                      >
                        {deleting === insight.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Trash2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Results Count */}
        {!loading && filteredInsights.length > 0 && (
          <p className="text-center text-gray-500 text-sm mt-6">
            Showing {filteredInsights.length} of {insights.length} insights
          </p>
        )}
      </main>

      {/* Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="insight-modal-title"
            className="bg-white border border-gray-200 rounded-2xl max-w-4xl w-full my-8"
          >
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 px-6 py-4 border-b border-amber-500/20 flex items-start justify-between sticky top-0 z-10">
              <div>
                <p className="text-amber-400 text-sm font-medium">Talbiyah Insights</p>
                <h2 id="insight-modal-title" className="text-xl font-bold text-white">{selectedInsight.title}</h2>
                {selectedInsight.speaker && (
                  <p className="text-emerald-600 text-sm mt-1">By {selectedInsight.speaker}</p>
                )}
                <p className="text-gray-500 text-sm">
                  {formatDate(selectedInsight.khutba_date)}
                  {selectedInsight.location && ` | ${selectedInsight.location}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-gray-500 hover:text-white transition p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content - FULL view of all insights */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* 1. Full Khutba Summary */}
              {selectedInsight.insights?.cleaned_transcript && (
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-3">Full Khutba Summary</h3>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-gray-700 whitespace-pre-line">
                      {selectedInsight.insights.cleaned_transcript}
                    </p>
                  </div>
                </div>
              )}

              {/* 2. Main Points */}
              {selectedInsight.insights?.main_points?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3">Main Points to Reflect Upon</h3>
                  <div className="space-y-2">
                    {selectedInsight.insights.main_points.map((point: any, idx: number) => (
                      <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                        <p className="text-amber-400 font-medium">{idx + 1}. {point.point}</p>
                        <p className="text-gray-500 text-sm mt-1">{point.reflection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Key Themes */}
              {selectedInsight.insights?.key_themes?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-yellow-400 mb-3">Key Themes</h3>
                  <div className="flex flex-wrap gap-2">
                    {selectedInsight.insights.key_themes.map((theme: any, idx: number) => (
                      <span key={idx} className="px-3 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-sm">
                        {theme.theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Quranic Words & Phrases */}
              {selectedInsight.insights?.quranic_words_phrases?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-3">Key Quranic Words & Phrases</h3>
                  <div className="space-y-4">
                    {selectedInsight.insights.quranic_words_phrases.map((word: any, idx: number) => (
                      <div key={idx} className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                        <p className="text-4xl text-center font-arabic text-gray-800 mb-3 leading-loose" dir="rtl">
                          {word.arabic}
                        </p>
                        <p className="text-teal-400 font-semibold">{word.transliteration}</p>
                        <p className="text-gray-700 mt-1"><span className="text-gray-500">Meaning:</span> {word.meaning}</p>
                        <p className="text-gray-500 text-sm mt-2">{word.context}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 5. Key Vocabulary */}
              {selectedInsight.insights?.key_vocabulary?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-purple-400 mb-3">Arabic Vocabulary</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-purple-500/20 text-purple-300">
                          <th className="px-4 py-2 text-left rounded-tl-lg">Term</th>
                          <th className="px-4 py-2 text-right">Arabic</th>
                          <th className="px-4 py-2 text-left rounded-tr-lg">Definition</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedInsight.insights.key_vocabulary.map((vocab: any, idx: number) => (
                          <tr key={idx} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                            <td className="px-4 py-2 text-gray-700">{vocab.term}</td>
                            <td className="px-4 py-2 text-2xl font-arabic text-gray-800" dir="rtl">{vocab.arabic || '-'}</td>
                            <td className="px-4 py-2 text-gray-500">{vocab.definition}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* 6. Quran References */}
              {selectedInsight.insights?.quran_references?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-3">Quran References</h3>
                  <div className="space-y-4">
                    {selectedInsight.insights.quran_references.map((ref: any, idx: number) => (
                      <div key={idx} className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                        {ref.arabic && (
                          <p className="text-3xl text-center font-arabic text-gray-800 mb-3 leading-loose" dir="rtl">
                            {ref.arabic}
                          </p>
                        )}
                        <p className="text-gray-700 italic border-l-2 border-emerald-500 pl-4">"{ref.translation}"</p>
                        <p className="text-emerald-400 font-semibold mt-2">{ref.reference}</p>
                        <p className="text-gray-500 text-sm mt-2 bg-emerald-500/10 p-2 rounded">Reflection: {ref.reflection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 7. Hadith References */}
              {selectedInsight.insights?.hadith_references?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3">Hadith References</h3>
                  <div className="space-y-4">
                    {selectedInsight.insights.hadith_references.map((ref: any, idx: number) => (
                      <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4">
                        <p className="text-gray-700 italic">"{ref.translation}"</p>
                        <p className="text-amber-400 font-semibold mt-2">{ref.reference}</p>
                        <p className="text-gray-500 text-sm mt-2">Reflection: {ref.reflection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 8. Action Items */}
              {selectedInsight.insights?.action_items?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-3">Action Items</h3>
                  <div className="space-y-2">
                    {selectedInsight.insights.action_items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-400 font-medium">{idx + 1}. {item.action}</p>
                        <p className="text-gray-500 text-sm mt-1">How: {item.how_to}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. Quiz - Answers hidden until clicked */}
              {selectedInsight.insights?.quiz?.multiple_choice?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-blue-400 mb-3">Quiz</h3>
                  <div className="space-y-4">
                    {selectedInsight.insights.quiz.multiple_choice.map((q: any, idx: number) => (
                      <QuizQuestion key={idx} question={q} index={idx} />
                    ))}
                  </div>
                </div>
              )}

              {/* 10. Homework */}
              {selectedInsight.insights?.homework?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-orange-400 mb-3">Homework</h3>
                  <div className="space-y-2">
                    {selectedInsight.insights.homework.map((hw: any, idx: number) => (
                      <div key={idx} className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-orange-400 font-medium">{idx + 1}. {hw.task}</p>
                          <span className="text-gray-500 text-sm">({hw.duration})</span>
                        </div>
                        <p className="text-gray-500 text-sm mt-1">{hw.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 11. Age-Appropriate Summaries */}
              {(selectedInsight.insights?.summary_for_children || selectedInsight.insights?.summary_for_teens) && (
                <div>
                  <h3 className="text-lg font-semibold text-emerald-600 mb-3">Age-Appropriate Summaries</h3>
                  <div className="space-y-4">
                    {selectedInsight.insights.summary_for_children && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4">
                        <p className="text-emerald-600 font-semibold mb-2">For Children (5-10):</p>
                        <p className="text-gray-700">{selectedInsight.insights.summary_for_children}</p>
                      </div>
                    )}
                    {selectedInsight.insights.summary_for_teens && (
                      <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-4">
                        <p className="text-purple-400 font-semibold mb-2">For Teens (11-17):</p>
                        <p className="text-gray-700">{selectedInsight.insights.summary_for_teens}</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 12. Family Discussion Guide */}
              {selectedInsight.insights?.family_discussion_guide?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-teal-400 mb-3">Family Discussion Guide</h3>
                  <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                    <ol className="space-y-2">
                      {selectedInsight.insights.family_discussion_guide.map((item: string, idx: number) => (
                        <li key={idx} className="text-gray-700">
                          <span className="text-teal-400 font-medium mr-2">{idx + 1}.</span>
                          {item}
                        </li>
                      ))}
                    </ol>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3 sticky bottom-0">
              <button
                onClick={() => {
                  // Build summary text for TTS
                  const insights = selectedInsight.insights;
                  let summaryText = `${selectedInsight.title}. `;
                  if (selectedInsight.speaker) summaryText += `By ${selectedInsight.speaker}. `;
                  if (insights?.main_points?.length > 0) {
                    summaryText += 'Main points: ';
                    insights.main_points.forEach((p: any, i: number) => {
                      summaryText += `${i + 1}. ${p.point}. ${p.reflection}. `;
                    });
                  }
                  if (insights?.key_themes?.length > 0) {
                    summaryText += 'Key themes: ';
                    insights.key_themes.forEach((t: any) => {
                      summaryText += `${t.theme}: ${t.explanation}. `;
                    });
                  }
                  playTTS(summaryText, 'summary');
                }}
                disabled={ttsLoading && ttsSection === 'summary'}
                className="flex items-center space-x-2 px-5 py-2.5 bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-400 hover:to-purple-500 text-white rounded-lg font-semibold transition disabled:opacity-50 shadow-lg shadow-violet-500/30"
              >
                {ttsLoading && ttsSection === 'summary' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : ttsPlaying && ttsSection === 'summary' ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
                <span>{ttsLoading && ttsSection === 'summary' ? 'Loading...' : ttsPlaying && ttsSection === 'summary' ? 'Pause' : `Listen (${INSIGHT_AUDIO_TOKEN_COST} tokens)`}</span>
              </button>
              <button
                onClick={() => handleDownloadPDF(selectedInsight)}
                disabled={downloadingPDF === selectedInsight.id}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white rounded-lg transition disabled:opacity-50"
              >
                {downloadingPDF === selectedInsight.id ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Download className="w-4 h-4" />
                )}
                <span>Download PDF ({INSIGHT_PDF_TOKEN_COST} tokens)</span>
              </button>
              <button
                onClick={() => setSelectedInsight(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
