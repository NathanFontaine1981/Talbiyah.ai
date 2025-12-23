import { useEffect, useState } from 'react';
import { Search, RefreshCw, Play, Download, Trash2, X, FileText, CheckSquare, Square, HardDrive, Calendar } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Recording {
  id: string;
  lesson_id: string;
  recording_url: string;
  duration_minutes: number;
  file_size_mb: number;
  status: 'processing' | 'ready' | 'failed';
  created_at: string;
  lesson?: {
    title: string;
    subject?: { name: string };
    teacher?: { full_name: string };
    student?: { full_name: string };
    scheduled_date: string;
  };
  ai_notes?: {
    summary: string;
    topics: string[];
    questions: string[];
    homework: string;
    feedback: string;
  };
}

interface StorageStats {
  totalRecordings: number;
  totalStorageGB: number;
  oldestRecording: string;
}

type DateFilter = 'all' | '7days' | '30days' | '90days' | 'custom';

export default function Recordings() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [filteredRecordings, setFilteredRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState<DateFilter>('all');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });

  // Data for filters
  const [subjects, setSubjects] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);

  // Bulk actions
  const [selectedRecordings, setSelectedRecordings] = useState<string[]>([]);

  // Modals
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedRecording, setSelectedRecording] = useState<Recording | null>(null);

  // Storage stats
  const [storageStats, setStorageStats] = useState<StorageStats>({
    totalRecordings: 0,
    totalStorageGB: 0,
    oldestRecording: '',
  });

  useEffect(() => {
    fetchInitialData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, subjectFilter, teacherFilter, dateFilter, customDateRange, recordings]);

  async function fetchInitialData() {
    await Promise.all([
      fetchRecordings(),
      fetchSubjects(),
      fetchTeachers(),
      calculateStorageStats(),
    ]);
  }

  async function fetchRecordings() {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from('lesson_recordings')
        .select(`
          *,
          lesson:bookings(
            id,
            subject:subjects(name),
            teacher:profiles!teacher_id(full_name),
            student:profiles!student_id(full_name),
            scheduled_date
          )
        `)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching recordings:', error);
        setRecordings([]);
      } else {
        setRecordings(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setRecordings([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchSubjects() {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    setSubjects(data || []);
  }

  async function fetchTeachers() {
    const { data } = await supabase
      .from('teacher_profiles')
      .select('user_id, profiles!inner(id, full_name)')
      .eq('status', 'approved');
    setTeachers(data || []);
  }

  async function calculateStorageStats() {
    try {
      const { data } = await supabase
        .from('lesson_recordings')
        .select('file_size_mb, created_at');

      if (data && data.length > 0) {
        const totalStorage = data.reduce((sum, r) => sum + (r.file_size_mb || 0), 0);
        const oldest = data.reduce((oldest, r) => {
          return new Date(r.created_at) < new Date(oldest.created_at) ? r : oldest;
        }, data[0]);

        setStorageStats({
          totalRecordings: data.length,
          totalStorageGB: totalStorage / 1024,
          oldestRecording: oldest.created_at,
        });
      }
    } catch (error) {
      console.error('Error calculating storage stats:', error);
    }
  }

  function applyFilters() {
    let filtered = [...recordings];

    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(recording =>
        recording.lesson?.teacher?.full_name?.toLowerCase().includes(query) ||
        recording.lesson?.student?.full_name?.toLowerCase().includes(query) ||
        recording.lesson?.subject?.name?.toLowerCase().includes(query)
      );
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(r =>
        r.lesson?.subject?.name?.toLowerCase() === subjectFilter.toLowerCase()
      );
    }

    // Teacher filter
    if (teacherFilter !== 'all') {
      filtered = filtered.filter(r =>
        (r.lesson?.teacher as any)?.id === teacherFilter
      );
    }

    // Date filter
    if (dateFilter !== 'all') {
      const now = new Date();
      let startDate: Date;

      switch (dateFilter) {
        case '7days':
          startDate = new Date(now.setDate(now.getDate() - 7));
          break;
        case '30days':
          startDate = new Date(now.setDate(now.getDate() - 30));
          break;
        case '90days':
          startDate = new Date(now.setDate(now.getDate() - 90));
          break;
        case 'custom':
          if (customDateRange.start) {
            startDate = new Date(customDateRange.start);
            const endDate = customDateRange.end ? new Date(customDateRange.end) : new Date();
            filtered = filtered.filter(r => {
              const recDate = new Date(r.created_at);
              return recDate >= startDate && recDate <= endDate;
            });
          }
          return setFilteredRecordings(filtered);
        default:
          return setFilteredRecordings(filtered);
      }

      filtered = filtered.filter(r => new Date(r.created_at) >= startDate);
    }

    setFilteredRecordings(filtered);
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchInitialData();
    setRefreshing(false);
  }

  function handlePlayRecording(recording: Recording) {
    setSelectedRecording(recording);
    setShowPlayerModal(true);
  }

  function handleViewNotes(recording: Recording) {
    setSelectedRecording(recording);
    setShowNotesModal(true);
  }

  async function handleDownload(recording: Recording) {
    if (!recording.recording_url) {
      toast.error('Recording URL not available');
      return;
    }

    try {
      // In production, this would download from your storage service
      window.open(recording.recording_url, '_blank');
    } catch (error) {
      console.error('Error downloading recording:', error);
      toast.error('Failed to download recording');
    }
  }

  async function handleDelete(recording: Recording) {
    if (!confirm('Permanently delete this recording? This action cannot be undone.')) return;

    try {
      const { error } = await supabase
        .from('lesson_recordings')
        .delete()
        .eq('id', recording.id);

      if (error) throw error;

      await fetchRecordings();
      await calculateStorageStats();
      toast.success('Recording deleted successfully');
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording');
    }
  }

  function toggleSelectRecording(recordingId: string) {
    setSelectedRecordings(prev =>
      prev.includes(recordingId)
        ? prev.filter(id => id !== recordingId)
        : [...prev, recordingId]
    );
  }

  function selectAllRecordings() {
    if (selectedRecordings.length === filteredRecordings.length) {
      setSelectedRecordings([]);
    } else {
      setSelectedRecordings(filteredRecordings.map(r => r.id));
    }
  }

  async function handleBulkDelete() {
    if (selectedRecordings.length === 0) return;

    if (!confirm(`Delete ${selectedRecordings.length} recordings? This cannot be undone.`)) return;

    try {
      const { error } = await supabase
        .from('lesson_recordings')
        .delete()
        .in('id', selectedRecordings);

      if (error) throw error;

      setSelectedRecordings([]);
      await fetchRecordings();
      await calculateStorageStats();
      toast.success('Recordings deleted successfully');
    } catch (error) {
      console.error('Error deleting recordings:', error);
      toast.error('Failed to delete recordings');
    }
  }

  function handleBulkDownload() {
    toast.info('Bulk download feature - Coming soon! Will download all selected recordings as a ZIP file.');
  }

  function getSubjectIcon(name?: string) {
    if (!name) return '📚';
    if (name.toLowerCase().includes('quran')) return '📗';
    if (name.toLowerCase().includes('arabic')) return '✏️';
    if (name.toLowerCase().includes('islamic')) return '🕌';
    return '📚';
  }

  function getStatusBadge(status: string) {
    const badges = {
      processing: { label: 'Processing', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400' },
      ready: { label: 'Ready', color: 'bg-green-500/10 border-green-500/20 text-green-400' },
      failed: { label: 'Failed', color: 'bg-red-500/10 border-red-500/20 text-red-400' },
    };
    return badges[status as keyof typeof badges] || badges.ready;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Class Recordings</h1>
          <p className="text-gray-600 dark:text-gray-400">Review and manage session recordings</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-200 text-gray-700 rounded-lg transition flex items-center space-x-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Storage Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <HardDrive className="w-6 h-6 text-emerald-600" />
            <p className="text-gray-600 dark:text-gray-400">Total Recordings</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{storageStats.totalRecordings}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <HardDrive className="w-6 h-6 text-emerald-400" />
            <p className="text-gray-600 dark:text-gray-400">Storage Used</p>
          </div>
          <p className="text-3xl font-bold text-gray-900 dark:text-white">{storageStats.totalStorageGB.toFixed(2)} GB</p>
        </div>
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-6 h-6 text-purple-400" />
            <p className="text-gray-600 dark:text-gray-400">Oldest Recording</p>
          </div>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {storageStats.oldestRecording ? format(new Date(storageStats.oldestRecording), 'MMM d, yyyy') : 'N/A'}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500" />
            <input
              type="text"
              placeholder="Search by student, teacher, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.name}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Teacher</label>
            <select
              value={teacherFilter}
              onChange={(e) => setTeacherFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Teachers</option>
              {teachers.map((teacher) => (
                <option key={teacher.user_id} value={(teacher.profiles as any).id}>
                  {(teacher.profiles as any).full_name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Date Range</label>
            <select
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value as DateFilter)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>
        </div>

        {/* Custom Date Range */}
        {dateFilter === 'custom' && (
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Start Date</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">End Date</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* Bulk Actions */}
      {selectedRecordings.length > 0 && (
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4 mb-6 flex items-center justify-between">
          <p className="text-emerald-600">
            {selectedRecordings.length} recording{selectedRecordings.length !== 1 ? 's' : ''} selected
          </p>
          <div className="flex space-x-2">
            <button
              onClick={handleBulkDownload}
              className="px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-600 rounded-lg text-sm transition flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>Download All</span>
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg text-sm transition flex items-center space-x-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Selected</span>
            </button>
            <button
              onClick={() => setSelectedRecordings([])}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-200 text-gray-700 rounded-lg text-sm transition"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Results Count */}
      <div className="mb-4 flex items-center justify-between">
        <p className="text-gray-600 dark:text-gray-400">
          Showing {filteredRecordings.length} of {recordings.length} recordings
        </p>
        <button
          onClick={selectAllRecordings}
          className="text-sm text-emerald-600 hover:text-cyan-300 transition"
        >
          {selectedRecordings.length === filteredRecordings.length && filteredRecordings.length > 0
            ? 'Deselect All'
            : 'Select All'}
        </button>
      </div>

      {/* Recordings List */}
      <div className="space-y-4">
        {filteredRecordings.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <FileText className="w-16 h-16 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No recordings found</p>
            <p className="text-gray-600 dark:text-gray-400 text-sm mt-2">Try adjusting your filters</p>
          </div>
        ) : (
          filteredRecordings.map((recording) => (
            <RecordingCard
              key={recording.id}
              recording={recording}
              isSelected={selectedRecordings.includes(recording.id)}
              onToggleSelect={() => toggleSelectRecording(recording.id)}
              onPlay={() => handlePlayRecording(recording)}
              onDownload={() => handleDownload(recording)}
              onDelete={() => handleDelete(recording)}
              onViewNotes={() => handleViewNotes(recording)}
              getSubjectIcon={getSubjectIcon}
              getStatusBadge={getStatusBadge}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showPlayerModal && selectedRecording && (
        <VideoPlayerModal
          recording={selectedRecording}
          onClose={() => {
            setShowPlayerModal(false);
            setSelectedRecording(null);
          }}
        />
      )}

      {showNotesModal && selectedRecording && (
        <AINotesModal
          recording={selectedRecording}
          onClose={() => {
            setShowNotesModal(false);
            setSelectedRecording(null);
          }}
        />
      )}
    </div>
  );
}

// Recording Card Component
function RecordingCard({ recording, isSelected, onToggleSelect, onPlay, onDownload, onDelete, onViewNotes, getSubjectIcon, getStatusBadge }: any) {
  const statusBadge = getStatusBadge(recording.status);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="flex items-start space-x-4">
        {/* Checkbox */}
        <button
          onClick={onToggleSelect}
          className="mt-1"
        >
          {isSelected ? (
            <CheckSquare className="w-5 h-5 text-emerald-600" />
          ) : (
            <Square className="w-5 h-5 text-gray-500 hover:text-gray-600" />
          )}
        </button>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-2">
                <span className="text-2xl">{getSubjectIcon(recording.lesson?.subject?.name)}</span>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {recording.lesson?.subject?.name || 'Unknown Subject'} Session
                </h3>
                <span className={`px-3 py-1 ${statusBadge.color} border rounded-full text-xs font-medium`}>
                  {statusBadge.label}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400 space-y-1">
                <p>
                  <span className="font-medium">Teacher:</span> {recording.lesson?.teacher?.full_name || 'Unknown'}
                  {' | '}
                  <span className="font-medium">Student:</span> {recording.lesson?.student?.full_name || 'Unknown'}
                </p>
                <p>
                  <span className="font-medium">Date:</span> {recording.lesson?.scheduled_date ? format(new Date(recording.lesson.scheduled_date), 'MMM d, yyyy') : 'Unknown'}
                  {' | '}
                  <span className="font-medium">Duration:</span> {recording.duration_minutes || 0} min
                  {recording.file_size_mb && (
                    <span> | <span className="font-medium">Size:</span> {recording.file_size_mb.toFixed(1)} MB</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap items-center gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={onPlay}
              disabled={recording.status !== 'ready'}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 rounded-lg transition text-sm flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-4 h-4" />
              <span>Play Recording</span>
            </button>
            <button
              onClick={onDownload}
              disabled={recording.status !== 'ready'}
              className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition text-sm flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className="w-4 h-4" />
              <span>Download</span>
            </button>
            <button
              onClick={onDelete}
              className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition text-sm flex items-center space-x-1"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete</span>
            </button>
            <button
              onClick={onViewNotes}
              className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg transition text-sm flex items-center space-x-1"
            >
              <FileText className="w-4 h-4" />
              <span>View AI Notes</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// Video Player Modal
function VideoPlayerModal({ recording, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl max-w-5xl w-full">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Recording Playback</h3>
          <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Video Player */}
          <div className="bg-black rounded-lg mb-4" style={{ aspectRatio: '16/9' }}>
            {recording.recording_url ? (
              <video
                controls
                className="w-full h-full rounded-lg"
                src={recording.recording_url}
              >
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <p>Video not available</p>
              </div>
            )}
          </div>

          {/* Recording Info */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Subject</p>
                <p className="text-gray-900 dark:text-white">{recording.lesson?.subject?.name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Teacher</p>
                <p className="text-gray-900 dark:text-white">{recording.lesson?.teacher?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Student</p>
                <p className="text-gray-900 dark:text-white">{recording.lesson?.student?.full_name || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-gray-600 dark:text-gray-400 mb-1">Duration</p>
                <p className="text-gray-900 dark:text-white">{recording.duration_minutes} minutes</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// AI Notes Modal
function AINotesModal({ recording, onClose }: any) {
  const notes = recording.ai_notes || {
    summary: 'AI-generated summary not available for this recording.',
    topics: [],
    questions: [],
    homework: '',
    feedback: '',
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">AI Study Notes</h3>
          <button onClick={onClose} className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Summary */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Summary</h4>
            <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{notes.summary}</p>
          </div>

          {/* Key Topics */}
          {notes.topics && notes.topics.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Key Topics Covered</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                {notes.topics.map((topic: string, index: number) => (
                  <li key={index}>{topic}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Questions Asked */}
          {notes.questions && notes.questions.length > 0 && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Questions Asked/Answered</h4>
              <ul className="list-disc list-inside space-y-1 text-gray-600 dark:text-gray-400">
                {notes.questions.map((question: string, index: number) => (
                  <li key={index}>{question}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Homework */}
          {notes.homework && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Homework Assigned</h4>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-400">{notes.homework}</p>
              </div>
            </div>
          )}

          {/* Teacher Feedback */}
          {notes.feedback && (
            <div>
              <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Teacher Feedback</h4>
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <p className="text-gray-600 dark:text-gray-400">{notes.feedback}</p>
              </div>
            </div>
          )}

          {/* Next Lesson Recommendations */}
          <div>
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Next Lesson Recommendations</h4>
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-lg p-4">
              <p className="text-emerald-600 text-sm">
                Continue with advanced topics in {recording.lesson?.subject?.name}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-gray-200 hover:bg-gray-200 text-gray-700 rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}
