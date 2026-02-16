import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Calendar,
  Clock,
  BookOpen,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Filter,
  Search,
  User,
  AlertCircle,
  Video,
  ExternalLink,
  CreditCard,
  MapPin,
  Monitor,
  Radio,
  Sparkles
} from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface GroupSession {
  id: string;
  name: string;
  subject_id: string;
  subject?: { name: string };
  teacher_id: string;
  teacher?: { full_name: string; avatar_url?: string };
  level: 'beginner' | 'intermediate' | 'advanced';
  max_participants: number;
  current_participants: number;
  schedule_day: string;
  schedule_time: string;
  duration_minutes: number;
  start_date: string;
  end_date?: string;
  is_free: boolean;
  price_per_session?: number;
  description?: string;
  status: 'open' | 'full' | 'closed' | 'cancelled';
  '100ms_room_id'?: string;
  teacher_room_code?: string;
  student_room_code?: string;
  course_type?: 'live' | 'course' | 'workshop';
  slug?: string;
  delivery_mode?: 'online' | 'in_person' | 'hybrid';
  location?: string;
  poster_url?: string;
}

interface Learner {
  id: string;
  name: string;
  parent_id: string;
}

type LevelFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';
type SubjectFilter = 'all' | string;

function formatTime(time: string | null | undefined) {
  if (!time) return '';
  const [h, m] = time.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function GroupClasses() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [learners, setLearners] = useState<Learner[]>([]);
  const [enrolledSessions, setEnrolledSessions] = useState<Set<string>>(new Set());
  const [sessionsWithAccess, setSessionsWithAccess] = useState<Set<string>>(new Set()); // Paid sessions with access
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  // Filters
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [subjects, setSubjects] = useState<any[]>([]);

  // Enrollment modal
  const [showEnrollModal, setShowEnrollModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<GroupSession | null>(null);
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    fetchData();

    // Check if returning from successful enrollment
    const enrolledId = searchParams.get('enrolled');
    if (enrolledId) {
      setShowSuccessMessage(true);
      setTimeout(() => setShowSuccessMessage(false), 5000);
    }
  }, []);

  useEffect(() => {
    applyFilters();
  }, [sessions, levelFilter, subjectFilter, searchQuery]);

  async function fetchData() {
    try {
      setLoading(true);

      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // Fetch subjects
      const { data: subjectsData } = await supabase
        .from('subjects')
        .select('id, name')
        .order('name');
      setSubjects(subjectsData || []);

      // Fetch group sessions with related data
      const { data: sessionsData, error: sessionsError } = await supabase
        .from('group_sessions')
        .select(`
          *,
          subject:subjects(name),
          teacher:profiles!teacher_id(full_name, avatar_url),
          "100ms_room_id",
          teacher_room_code,
          student_room_code,
          course_type,
          slug,
          delivery_mode,
          location
        `)
        .in('status', ['open', 'full'])
        .order('start_date', { ascending: true });

      if (sessionsError) {
        console.error('Error fetching sessions:', sessionsError);
      }

      setSessions(sessionsData || []);

      // If user is logged in, fetch their learners and enrollments
      if (user) {
        // Fetch learners for this parent
        const { data: learnersData } = await supabase
          .from('learners')
          .select('id, name, parent_id')
          .eq('parent_id', user.id);
        setLearners(learnersData || []);

        // Fetch existing enrollments
        const { data: enrollmentsData } = await supabase
          .from('group_session_participants')
          .select('group_session_id, student_id')
          .eq('student_id', user.id);

        const enrolled = new Set<string>();
        enrollmentsData?.forEach(e => enrolled.add(e.group_session_id));
        setEnrolledSessions(enrolled);

        // For enrolled sessions, check payment status for paid sessions
        // Free sessions automatically have access, paid sessions need completed payment
        const accessSet = new Set<string>();

        // Check all enrolled sessions
        for (const enrollment of enrollmentsData || []) {
          const session = sessionsData?.find(s => s.id === enrollment.group_session_id);
          if (session) {
            if (session.is_free) {
              // Free sessions - immediate access
              accessSet.add(session.id);
            } else {
              // Check for completed payment
              const { data: payment } = await supabase
                .from('group_session_payments')
                .select('status')
                .eq('group_session_id', session.id)
                .eq('student_id', user.id)
                .eq('status', 'completed')
                .single();

              if (payment) {
                accessSet.add(session.id);
              }
            }
          }
        }
        setSessionsWithAccess(accessSet);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...sessions];

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(s => s.level === levelFilter);
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(s => s.subject_id === subjectFilter);
    }

    // Search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.name.toLowerCase().includes(query) ||
        s.description?.toLowerCase().includes(query) ||
        s.teacher?.full_name?.toLowerCase().includes(query)
      );
    }

    setFilteredSessions(filtered);
  }

  function handleEnrollClick(session: GroupSession) {
    if (!currentUser) {
      navigate('/signup?redirect=/group-classes');
      return;
    }
    setSelectedSession(session);
    setShowEnrollModal(true);
  }

  async function handleEnroll() {
    if (!selectedSession || !currentUser) return;

    setEnrolling(true);
    try {
      // For paid sessions, redirect to Stripe checkout
      if (!selectedSession.is_free) {
        const { data: { session: authSession } } = await supabase.auth.getSession();

        const response = await fetch(
          `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/group-session-checkout`,
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authSession?.access_token}`,
            },
            body: JSON.stringify({
              group_session_id: selectedSession.id,
              success_url: `${window.location.origin}/group-classes?enrolled=${selectedSession.id}`,
              cancel_url: `${window.location.origin}/group-classes?cancelled=true`,
            }),
          }
        );

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error || 'Failed to create checkout session');
        }

        // If it's a free enrollment (shouldn't happen but just in case)
        if (result.type === 'free_enrollment') {
          setEnrolledSessions(prev => new Set([...prev, selectedSession.id]));
          setSessionsWithAccess(prev => new Set([...prev, selectedSession.id]));
          setShowEnrollModal(false);
          setSelectedSession(null);
          fetchData();
          return;
        }

        // Redirect to Stripe checkout
        window.location.href = result.checkout_url;
        return;
      }

      // For free sessions, enroll directly
      const { error } = await supabase
        .from('group_session_participants')
        .insert({
          group_session_id: selectedSession.id,
          student_id: currentUser.id,
        });

      if (error) {
        if (error.code === '23505') {
          toast.info('You are already enrolled in this class!');
        } else {
          throw error;
        }
      } else {
        // Update local state
        setEnrolledSessions(prev => new Set([...prev, selectedSession.id]));
        setSessionsWithAccess(prev => new Set([...prev, selectedSession.id]));

        // Refresh sessions to get updated participant count
        const { data: updatedSession } = await supabase
          .from('group_sessions')
          .select('*, subject:subjects(name), teacher:profiles!teacher_id(full_name, avatar_url), "100ms_room_id", teacher_room_code, student_room_code')
          .eq('id', selectedSession.id)
          .single();

        if (updatedSession) {
          setSessions(prev => prev.map(s =>
            s.id === updatedSession.id ? updatedSession : s
          ));
        }

        setShowEnrollModal(false);
        setSelectedSession(null);
      }
    } catch (error: any) {
      console.error('Error enrolling:', error);
      toast.error('Failed to enroll: ' + (error.message || 'Please try again.'));
    } finally {
      setEnrolling(false);
    }
  }

  function getSubjectIcon(name?: string) {
    if (!name) return '📚';
    if (name.toLowerCase().includes('quran')) return '📗';
    if (name.toLowerCase().includes('arabic')) return '✏️';
    if (name.toLowerCase().includes('islamic')) return '🕌';
    return '📚';
  }

  function getLevelBadge(level: string) {
    const styles = {
      beginner: 'bg-green-100 border-green-300 text-green-700 dark:bg-green-900/30 dark:border-green-700 dark:text-green-400',
      intermediate: 'bg-amber-100 border-amber-300 text-amber-700 dark:bg-amber-900/30 dark:border-amber-700 dark:text-amber-400',
      advanced: 'bg-purple-100 border-purple-300 text-purple-700 dark:bg-purple-900/30 dark:border-purple-700 dark:text-purple-400',
    };
    return styles[level as keyof typeof styles] || styles.beginner;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-500 dark:text-gray-400">Loading group classes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Success Message */}
        {showSuccessMessage && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl flex items-center space-x-3">
            <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-emerald-700 dark:text-emerald-400 font-medium">Successfully enrolled!</p>
              <p className="text-gray-500 dark:text-gray-400 text-sm">You can now join the class when the session starts.</p>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-700 transition mb-4"
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Back to Dashboard</span>
          </button>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Group Classes</h1>
          <p className="text-gray-500 dark:text-gray-400">
            Join group learning sessions with other students. Learn together, grow together.
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
          <div className="flex items-center space-x-2 mb-4">
            <Filter className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Filter Classes</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search classes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:border-emerald-500"
              />
            </div>

            {/* Subject filter */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map(subject => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>

            {/* Level filter */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
              className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>

            {/* Reset button */}
            <button
              onClick={() => {
                setSearchQuery('');
                setSubjectFilter('all');
                setLevelFilter('all');
              }}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-600 hover:bg-gray-200 dark:hover:bg-gray-500 text-gray-700 dark:text-gray-200 rounded-lg transition"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* My Enrolled Classes */}
        {(() => {
          const myClasses = filteredSessions.filter(s => enrolledSessions.has(s.id));
          const browseClasses = filteredSessions.filter(s => !enrolledSessions.has(s.id));

          return (
            <>
              {myClasses.length > 0 && (
                <div className="mb-10">
                  <div className="flex items-center space-x-2 mb-4">
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">My Classes</h2>
                    <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-xs font-medium rounded-full">
                      {myClasses.length}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myClasses.map((session) => (
                      <GroupClassCard
                        key={session.id}
                        session={session}
                        isEnrolled={true}
                        hasAccess={sessionsWithAccess.has(session.id)}
                        onEnroll={() => handleEnrollClick(session)}
                        getSubjectIcon={getSubjectIcon}
                        getLevelBadge={getLevelBadge}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Browse Classes */}
              <div>
                {myClasses.length > 0 && (
                  <div className="flex items-center space-x-2 mb-4">
                    <Search className="w-5 h-5 text-gray-500" />
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Browse Classes</h2>
                  </div>
                )}

                {browseClasses.length === 0 && myClasses.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
                    <Users className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No Classes Found</h3>
                    <p className="text-gray-500 dark:text-gray-400">
                      {sessions.length === 0
                        ? "There are no group classes available at the moment. Check back soon!"
                        : "Try adjusting your filters to find more classes."}
                    </p>
                  </div>
                ) : browseClasses.length === 0 ? (
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">
                      You're enrolled in all available classes. Check back for new ones!
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {browseClasses.map((session) => (
                      <GroupClassCard
                        key={session.id}
                        session={session}
                        isEnrolled={false}
                        hasAccess={false}
                        onEnroll={() => handleEnrollClick(session)}
                        getSubjectIcon={getSubjectIcon}
                        getLevelBadge={getLevelBadge}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          );
        })()}

        {/* Enrollment Modal */}
        {showEnrollModal && selectedSession && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl max-w-md w-full shadow-xl overflow-hidden">
              {selectedSession.poster_url && (
                <div className="h-32 overflow-hidden">
                  <img src={selectedSession.poster_url} alt={selectedSession.name} className="w-full h-full object-cover" />
                </div>
              )}
              <div className="p-6">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Enroll in Class</h3>

              <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl p-4 mb-6">
                <div className="flex items-center space-x-3 mb-2">
                  <span className="text-2xl">{getSubjectIcon(selectedSession.subject?.name)}</span>
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white">{selectedSession.name}</h4>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
                  with {selectedSession.teacher?.full_name}
                </p>
                <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                  <span className="flex items-center space-x-1">
                    <Calendar className="w-4 h-4" />
                    <span>{selectedSession.schedule_day}s</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <Clock className="w-4 h-4" />
                    <span>{formatTime(selectedSession.schedule_time)}</span>
                  </span>
                </div>
              </div>

              {selectedSession.is_free ? (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-3 mb-6">
                  <p className="text-green-700 dark:text-green-400 font-medium">This is a FREE class!</p>
                </div>
              ) : (
                <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 mb-6">
                  <p className="text-emerald-700 dark:text-emerald-400">
                    Cost: <span className="font-bold">£{((selectedSession.price_per_session || 0) / 100).toFixed(2)}</span> per session
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  onClick={() => setShowEnrollModal(false)}
                  className="flex-1 px-4 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-xl transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEnroll}
                  disabled={enrolling}
                  className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-semibold transition flex items-center justify-center space-x-2"
                >
                  {enrolling ? (
                    <span>Enrolling...</span>
                  ) : (
                    <>
                      <CheckCircle className="w-5 h-5" />
                      <span>Enroll Now</span>
                    </>
                  )}
                </button>
              </div>
            </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Group Class Card Component
function GroupClassCard({
  session,
  isEnrolled,
  hasAccess,
  onEnroll,
  getSubjectIcon,
  getLevelBadge
}: {
  session: GroupSession;
  isEnrolled: boolean;
  hasAccess: boolean;
  onEnroll: () => void;
  getSubjectIcon: (name?: string) => string;
  getLevelBadge: (level: string) => string;
}) {
  const navigate = useNavigate();
  const spotsLeft = session.max_participants - session.current_participants;
  const isFull = spotsLeft <= 0;
  const hasRoom = session['100ms_room_id'] && session.student_room_code;
  const isCourse = session.course_type === 'course' && session.slug;

  function getDeliveryBadge() {
    const mode = session.delivery_mode || 'online';
    const styles = {
      online: { icon: Monitor, label: 'Online', className: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400' },
      in_person: { icon: MapPin, label: 'In Person', className: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
      hybrid: { icon: Radio, label: 'Hybrid', className: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400' },
    };
    return styles[mode] || styles.online;
  }

  const delivery = getDeliveryBadge();
  const DeliveryIcon = delivery.icon;

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden hover:border-emerald-400 dark:hover:border-emerald-600 transition group shadow-sm">
      {/* Poster */}
      {session.poster_url ? (
        <div className="relative bg-gray-100 dark:bg-gray-900 overflow-hidden">
          <img
            src={session.poster_url}
            alt={session.name}
            className="w-full max-h-56 object-contain mx-auto group-hover:scale-[1.02] transition-transform duration-300"
          />
        </div>
      ) : (
        <div className="h-24 bg-gradient-to-br from-emerald-500 to-teal-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-2 right-2 text-6xl font-bold text-white">{getSubjectIcon(session.subject?.name)}</div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3 min-w-0">
            <span className="text-3xl flex-shrink-0">{getSubjectIcon(session.subject?.name)}</span>
            <div className="min-w-0">
              <h3 className="text-lg font-bold text-gray-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition truncate">
                {session.name}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-sm">{session.subject?.name}</p>
            </div>
          </div>
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 ml-2">
            <span className={`px-3 py-1 ${getLevelBadge(session.level)} border rounded-full text-xs font-medium capitalize`}>
              {session.level}
            </span>
            {isCourse && (
              <span className="px-2 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-full text-[10px] font-semibold flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Course
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Teacher */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              {session.teacher?.avatar_url ? (
                <img
                  src={session.teacher.avatar_url}
                  alt={session.teacher.full_name}
                  className="w-8 h-8 rounded-full object-cover"
                />
              ) : (
                <User className="w-4 h-4 text-gray-400" />
              )}
            </div>
            <span className="text-gray-700 dark:text-gray-300 text-sm">{session.teacher?.full_name || 'TBA'}</span>
          </div>
          <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${delivery.className}`}>
            <DeliveryIcon className="w-3 h-3" />
            {delivery.label}
          </span>
        </div>

        {/* Schedule */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Every {session.schedule_day}</span>
          </div>
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
            <Clock className="w-4 h-4 text-gray-400" />
            <span>{formatTime(session.schedule_time)} ({session.duration_minutes} min)</span>
          </div>
          {session.location && (
            <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span className="truncate">{session.location}</span>
            </div>
          )}
          <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-400 text-sm">
            <BookOpen className="w-4 h-4 text-gray-400" />
            <span>Starts {format(new Date(session.start_date), 'MMM d, yyyy')}</span>
          </div>
        </div>

        {/* Description */}
        {session.description && (
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4 line-clamp-2">
            {session.description}
          </p>
        )}

        {/* Spots & Price */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <Users className="w-4 h-4 text-gray-400" />
            <span className={`text-sm font-medium ${isFull ? 'text-red-600 dark:text-red-400' : spotsLeft <= 2 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-600 dark:text-gray-400'}`}>
              {isFull ? 'Class Full' : `${spotsLeft} spots left`}
            </span>
          </div>
          {session.is_free ? (
            <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 text-green-700 dark:text-green-400 rounded-lg text-sm font-medium">
              FREE
            </span>
          ) : (
            <span className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-400 rounded-lg text-sm font-medium">
              £{((session.price_per_session || 0) / 100).toFixed(2)}/session
            </span>
          )}
        </div>

        {/* Study Notes add-on for courses */}
        {isCourse && session.is_free && (
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/10 dark:to-teal-900/10 border border-emerald-200 dark:border-emerald-800 rounded-xl p-3 mb-4">
            <div className="flex items-start gap-2.5">
              <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-gray-600 dark:text-gray-300">
                <p className="font-semibold text-gray-900 dark:text-white text-sm mb-1">
                  Free: 7-day video recordings + download
                </p>
                <p>
                  <span className="font-semibold text-emerald-700 dark:text-emerald-400">Optional:</span> AI Study Notes — <span className="font-bold">£5</span> one-off for all sessions.
                  Session 1 notes free to preview.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {isCourse && isEnrolled ? (
          <button
            onClick={() => navigate(`/course/${session.slug}`)}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition flex items-center justify-center space-x-2"
          >
            <BookOpen className="w-5 h-5" />
            <span>Go to Course</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : isCourse && !isEnrolled ? (
          <button
            onClick={() => navigate(`/course/${session.slug}`)}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition flex items-center justify-center space-x-2"
          >
            <span>View Course</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        ) : isEnrolled && hasAccess && hasRoom ? (
          <a
            href={`https://talbiyah.app.100ms.live/meeting/${session.student_room_code}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition flex items-center justify-center space-x-2"
          >
            <Video className="w-5 h-5" />
            <span>Join Class</span>
            <ExternalLink className="w-4 h-4" />
          </a>
        ) : isEnrolled && hasAccess ? (
          <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Enrolled - Room not ready yet</span>
          </div>
        ) : isEnrolled && !hasAccess && !session.is_free ? (
          <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded-xl">
            <CreditCard className="w-5 h-5" />
            <span className="font-medium">Payment Pending</span>
          </div>
        ) : isEnrolled ? (
          <div className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 rounded-xl">
            <CheckCircle className="w-5 h-5" />
            <span className="font-medium">Enrolled</span>
          </div>
        ) : isFull ? (
          <button
            disabled
            className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 rounded-xl cursor-not-allowed flex items-center justify-center space-x-2"
          >
            <AlertCircle className="w-5 h-5" />
            <span>Class Full</span>
          </button>
        ) : (
          <button
            onClick={onEnroll}
            className="w-full px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold transition flex items-center justify-center space-x-2"
          >
            <span>{session.is_free ? 'Enroll Now' : 'Pay & Enroll'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}
