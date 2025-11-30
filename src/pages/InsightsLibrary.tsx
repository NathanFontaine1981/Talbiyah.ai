import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  ChevronUp
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

  // Get unique speakers for filter
  const speakers = [...new Set(insights.filter(i => i.speaker).map(i => i.speaker as string))];

  useEffect(() => {
    fetchInsights();
    checkAdmin();
  }, []);

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
          console.log('Khutba insights table not yet available');
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
      alert('Error deleting insight: ' + error.message);
    } finally {
      setDeleting(null);
    }
  }

  async function handleDownloadPDF(insight: KhutbaInsight) {
    setDownloadingPDF(insight.id);
    try {
      await generateTalbiyahInsightsPDF({
        ...insight.insights,
        title: insight.title,
        speaker: insight.speaker || insight.insights.speaker,
        khutba_date: insight.khutba_date,
        location: insight.location
      });
    } catch (error: any) {
      console.error('Error generating PDF:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      setDownloadingPDF(null);
    }
  }

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
    <div className="min-h-screen bg-slate-950">
      {/* Header */}
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-full flex items-center justify-center">
                <Brain className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-white">Talbiyah Insights Library</h1>
                <p className="text-xs text-slate-400">Weekly Khutba Study Notes</p>
              </div>
            </div>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 lg:px-8 py-8">
        {/* Hero */}
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Explore Khutba Insights
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto">
            Access comprehensive study materials from weekly khutbas. Each insight includes
            Quranic vocabulary, hadith, quizzes, homework, and family discussion guides.
          </p>
        </div>

        {/* Search and Filters */}
        <div className="bg-slate-800/30 border border-slate-700/50 rounded-xl p-4 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, speaker, or location..."
                className="w-full pl-10 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-3 bg-slate-700/50 hover:bg-slate-700 text-slate-300 rounded-xl transition"
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {showFilters ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-400 text-sm mb-2">Speaker / Imam</label>
                  <select
                    value={filterSpeaker}
                    onChange={(e) => setFilterSpeaker(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-amber-500"
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
            <p className="text-slate-400">Loading insights...</p>
          </div>
        )}

        {/* No Results */}
        {!loading && filteredInsights.length === 0 && (
          <div className="text-center py-16">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-white mb-2">No Insights Found</h3>
            <p className="text-slate-400">
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
                className="bg-slate-800/30 border border-slate-700/50 rounded-xl overflow-hidden hover:border-amber-500/50 transition group"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 px-4 py-3 border-b border-amber-500/20">
                  <p className="text-amber-400 text-xs font-medium">Talbiyah Insights</p>
                </div>

                {/* Card Content */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">
                    {insight.title}
                  </h3>

                  <div className="space-y-2 text-sm">
                    {insight.speaker && (
                      <div className="flex items-center text-slate-400">
                        <User className="w-4 h-4 mr-2 text-cyan-400" />
                        <span>{insight.speaker}</span>
                      </div>
                    )}
                    {insight.location && (
                      <div className="flex items-center text-slate-400">
                        <MapPin className="w-4 h-4 mr-2 text-emerald-400" />
                        <span>{insight.location}</span>
                      </div>
                    )}
                    <div className="flex items-center text-slate-400">
                      <Calendar className="w-4 h-4 mr-2 text-purple-400" />
                      <span>{formatDate(insight.khutba_date)}</span>
                    </div>
                  </div>

                  {/* Key Themes Preview */}
                  {insight.insights?.key_themes?.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {insight.insights.key_themes.slice(0, 2).map((theme: any, idx: number) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full"
                        >
                          {theme.theme}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Card Actions */}
                <div className="px-4 py-3 bg-slate-900/50 border-t border-slate-700/50 flex items-center justify-between">
                  <button
                    onClick={() => setSelectedInsight(insight)}
                    className="flex items-center space-x-1 text-amber-400 hover:text-amber-300 transition text-sm"
                  >
                    <Eye className="w-4 h-4" />
                    <span>View</span>
                  </button>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleDownloadPDF(insight)}
                      disabled={downloadingPDF === insight.id}
                      className="flex items-center space-x-1 text-emerald-400 hover:text-emerald-300 transition text-sm disabled:opacity-50"
                    >
                      {downloadingPDF === insight.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>PDF</span>
                    </button>

                    {isAdmin && (
                      <button
                        onClick={() => deleteInsight(insight.id)}
                        disabled={deleting === insight.id}
                        className="flex items-center space-x-1 text-red-400 hover:text-red-300 transition text-sm disabled:opacity-50"
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
          <p className="text-center text-slate-500 text-sm mt-6">
            Showing {filteredInsights.length} of {insights.length} insights
          </p>
        )}
      </main>

      {/* Detail Modal */}
      {selectedInsight && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-start justify-center overflow-y-auto p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-4xl w-full my-8">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-amber-500/20 to-orange-600/20 px-6 py-4 border-b border-amber-500/20 flex items-start justify-between sticky top-0 z-10">
              <div>
                <p className="text-amber-400 text-sm font-medium">Talbiyah Insights</p>
                <h2 className="text-xl font-bold text-white">{selectedInsight.title}</h2>
                {selectedInsight.speaker && (
                  <p className="text-cyan-400 text-sm mt-1">By {selectedInsight.speaker}</p>
                )}
                <p className="text-slate-400 text-sm">
                  {formatDate(selectedInsight.khutba_date)}
                  {selectedInsight.location && ` | ${selectedInsight.location}`}
                </p>
              </div>
              <button
                onClick={() => setSelectedInsight(null)}
                className="text-slate-400 hover:text-white transition p-2"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Modal Content - Simplified view of insights */}
            <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
              {/* Cleaned Transcript */}
              {selectedInsight.insights?.cleaned_transcript && (
                <div>
                  <h3 className="text-lg font-semibold text-emerald-400 mb-3">Full Khutba</h3>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4">
                    <p className="text-slate-200 whitespace-pre-line">
                      {selectedInsight.insights.cleaned_transcript}
                    </p>
                  </div>
                </div>
              )}

              {/* Main Points */}
              {selectedInsight.insights?.main_points?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-amber-400 mb-3">Main Points</h3>
                  <div className="space-y-2">
                    {selectedInsight.insights.main_points.map((point: any, idx: number) => (
                      <div key={idx} className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-3">
                        <p className="text-amber-400 font-medium">{idx + 1}. {point.point}</p>
                        <p className="text-slate-400 text-sm mt-1">{point.reflection}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Themes */}
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

              {/* Action Items */}
              {selectedInsight.insights?.action_items?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-red-400 mb-3">Action Items</h3>
                  <div className="space-y-2">
                    {selectedInsight.insights.action_items.map((item: any, idx: number) => (
                      <div key={idx} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
                        <p className="text-red-400 font-medium">{idx + 1}. {item.action}</p>
                        <p className="text-slate-400 text-sm mt-1">How: {item.how_to}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Family Discussion */}
              {selectedInsight.insights?.family_discussion_guide?.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold text-teal-400 mb-3">Family Discussion Guide</h3>
                  <div className="bg-teal-500/10 border border-teal-500/30 rounded-lg p-4">
                    <ol className="space-y-2">
                      {selectedInsight.insights.family_discussion_guide.map((item: string, idx: number) => (
                        <li key={idx} className="text-slate-200">
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
            <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex justify-end space-x-3 sticky bottom-0">
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
                <span>Download PDF</span>
              </button>
              <button
                onClick={() => setSelectedInsight(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
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
