import { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Video, FileText, Clock, Calendar, Loader2, Search, Filter, X } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { format, parseISO } from 'date-fns';

interface Recording {
  id: string;
  scheduled_time: string;
  duration_minutes: number;
  subject_name: string;
  teacher_name: string;
  has_insights: boolean;
  recording_url: string | null;
}

export default function RecordingsHistory() {
  const navigate = useNavigate();
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTeacher, setIsTeacher] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [insightsFilter, setInsightsFilter] = useState<'all' | 'with' | 'without'>('all');

  // Get unique subjects for filter
  const subjects = useMemo(() => {
    const uniqueSubjects = [...new Set(recordings.map(r => r.subject_name))];
    return uniqueSubjects.sort();
  }, [recordings]);

  // Filter recordings based on search and filters
  const filteredRecordings = useMemo(() => {
    return recordings.filter(recording => {
      // Search filter
      const matchesSearch = searchQuery === '' ||
        recording.subject_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        recording.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        format(parseISO(recording.scheduled_time), 'MMMM d, yyyy').toLowerCase().includes(searchQuery.toLowerCase());

      // Subject filter
      const matchesSubject = subjectFilter === 'all' || recording.subject_name === subjectFilter;

      // Insights filter
      const matchesInsights = insightsFilter === 'all' ||
        (insightsFilter === 'with' && recording.has_insights) ||
        (insightsFilter === 'without' && !recording.has_insights);

      return matchesSearch && matchesSubject && matchesInsights;
    });
  }, [recordings, searchQuery, subjectFilter, insightsFilter]);

  const clearFilters = () => {
    setSearchQuery('');
    setSubjectFilter('all');
    setInsightsFilter('all');
  };

  const hasActiveFilters = searchQuery !== '' || subjectFilter !== 'all' || insightsFilter !== 'all';

  useEffect(() => {
    loadRecordings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadRecordings() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/');
        return;
      }

      // Check if user is a teacher
      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (teacherProfile) {
        // Load recordings as teacher
        setIsTeacher(true);

        const { data: lessonsData, error } = await supabase
          .from('lessons')
          .select(`
            id,
            scheduled_time,
            duration_minutes,
            recording_url,
            learners!inner(
              parent_id,
              profiles!inner(
                full_name
              )
            ),
            subjects!inner(
              name
            ),
            talbiyah_insights(id)
          `)
          .eq('teacher_id', teacherProfile.id)
          .eq('status', 'completed')
          .order('scheduled_time', { ascending: false });

        if (error) throw error;

        if (lessonsData) {
          const formattedRecordings: Recording[] = lessonsData.map((lesson: any) => ({
            id: lesson.id,
            scheduled_time: lesson.scheduled_time,
            duration_minutes: lesson.duration_minutes,
            subject_name: lesson.subjects.name,
            teacher_name: lesson.learners.profiles.full_name || 'Student',
            has_insights: lesson.talbiyah_insights && lesson.talbiyah_insights.length > 0,
            recording_url: lesson.recording_url
          }));
          setRecordings(formattedRecordings);
        }
      } else {
        // Load recordings as student
        setIsTeacher(false);

        const { data: learner } = await supabase
          .from('learners')
          .select('id')
          .eq('parent_id', user.id)
          .maybeSingle();

        if (!learner) {
          setLoading(false);
          return;
        }

        const { data: lessonsData, error } = await supabase
          .from('lessons')
          .select(`
            id,
            scheduled_time,
            duration_minutes,
            recording_url,
            teacher_profiles!inner(
              user_id,
              profiles!teacher_profiles_user_id_fkey(
                full_name
              )
            ),
            subjects!inner(
              name
            ),
            talbiyah_insights(id)
          `)
          .eq('learner_id', learner.id)
          .eq('status', 'completed')
          .order('scheduled_time', { ascending: false });

        if (error) throw error;

        if (lessonsData) {
          const formattedRecordings: Recording[] = lessonsData.map((lesson: any) => ({
            id: lesson.id,
            scheduled_time: lesson.scheduled_time,
            duration_minutes: lesson.duration_minutes,
            subject_name: lesson.subjects.name,
            teacher_name: lesson.teacher_profiles.profiles.full_name || 'Teacher',
            has_insights: lesson.talbiyah_insights && lesson.talbiyah_insights.length > 0,
            recording_url: lesson.recording_url
          }));
          setRecordings(formattedRecordings);
        }
      }
    } catch (error) {
      console.error('Error loading recordings:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <Loader2 className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading recordings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/dashboard')}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition"
            >
              <ChevronLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </button>

            <h1 className="text-xl font-bold text-gray-900 flex items-center space-x-2">
              <Video className="w-6 h-6 text-emerald-500" />
              <span>My Recordings</span>
            </h1>

            <div className="w-40"></div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 lg:px-8 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-2xl p-4 mb-6 border border-gray-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by subject, teacher, or date..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 transition"
              />
            </div>

            {/* Subject Filter */}
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                className="pl-10 pr-8 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white cursor-pointer min-w-[160px]"
              >
                <option value="all">All Subjects</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Insights Filter */}
            <select
              value={insightsFilter}
              onChange={(e) => setInsightsFilter(e.target.value as 'all' | 'with' | 'without')}
              className="px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white cursor-pointer min-w-[160px]"
            >
              <option value="all">All Recordings</option>
              <option value="with">With AI Notes</option>
              <option value="without">Without AI Notes</option>
            </select>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition flex items-center space-x-2"
              >
                <X className="w-4 h-4" />
                <span>Clear</span>
              </button>
            )}
          </div>
        </div>

        {/* Results Count */}
        <div className="mb-6">
          <p className="text-gray-600">
            {filteredRecordings.length} of {recordings.length} {recordings.length === 1 ? 'recording' : 'recordings'}
            {hasActiveFilters && ' (filtered)'}
          </p>
        </div>

        {recordings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <Video className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No recordings yet</h3>
            <p className="text-gray-600 mb-6">
              {isTeacher
                ? 'Your completed lessons will appear here with recordings'
                : 'Complete some lessons to see your recordings here'
              }
            </p>
            {!isTeacher && (
              <button
                onClick={() => navigate('/subjects')}
                className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-lg font-semibold transition"
              >
                Book a Lesson
              </button>
            )}
          </div>
        ) : filteredRecordings.length === 0 ? (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-200">
            <Search className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No recordings found</h3>
            <p className="text-gray-600 mb-6">
              Try adjusting your search or filters
            </p>
            <button
              onClick={clearFilters}
              className="px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-semibold transition"
            >
              Clear Filters
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecordings.map((recording) => (
              <div
                key={recording.id}
                className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-gray-300 transition shadow-sm hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                        <Video className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">{recording.subject_name}</h3>
                        <p className="text-sm text-gray-600">
                          {isTeacher ? `Student: ${recording.teacher_name}` : `with ${recording.teacher_name}`}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-6 text-sm text-gray-600 mb-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span>{format(parseISO(recording.scheduled_time), 'MMMM d, yyyy')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{format(parseISO(recording.scheduled_time), 'h:mm a')}</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span>{recording.duration_minutes} min duration</span>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {recording.has_insights && (
                        <button
                          onClick={() => navigate(`/lesson/${recording.id}/insights`)}
                          className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-400 hover:to-blue-500 text-white rounded-lg font-medium transition flex items-center space-x-2"
                        >
                          <FileText className="w-4 h-4" />
                          <span>View AI Notes</span>
                        </button>
                      )}

                      {recording.recording_url ? (
                        <button
                          onClick={() => window.open(recording.recording_url!, '_blank')}
                          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium transition flex items-center space-x-2"
                        >
                          <Video className="w-4 h-4" />
                          <span>Watch Video</span>
                        </button>
                      ) : (
                        <button
                          disabled
                          className="px-4 py-2 bg-gray-200 text-gray-500 rounded-lg font-medium cursor-not-allowed flex items-center space-x-2"
                        >
                          <Video className="w-4 h-4" />
                          <span>Video Processing</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
