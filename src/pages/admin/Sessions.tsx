import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Calendar, Clock, Users, BookOpen, Eye, Edit, RefreshCw, X as XIcon, ChevronLeft, ChevronRight, DollarSign, Gift, CreditCard, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { formatLessonTime, formatLessonDate } from '../../lib/formatLessonTime';

interface SessionStats {
  total: number;
  private: number;
  group: number;
  today: number;
}

interface Session {
  id: string;
  subject: string;
  teacher_name: string;
  student_name: string;
  teacher_tz: string | null;
  student_tz: string | null;
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  type: 'private' | 'group';
  price: number;
  status: string;
  payment_status: string;
  room_id?: string;
  teacher_room_code?: string;
  student_room_code?: string;
  participants?: any[];
}

export default function Sessions() {
  const [stats, setStats] = useState<SessionStats>({
    total: 0,
    private: 0,
    group: 0,
    today: 0,
  });
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const sessionsPerPage = 20;

  // Modals
  const [showNewSession, setShowNewSession] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    fetchSessionData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchQuery, typeFilter, statusFilter, subjectFilter, sessions]);

  async function fetchSessionData() {
    try {
      setLoading(true);

      // Real 1:1 bookings live in `lessons` (UTC timestamptz scheduled_time).
      const { data: lessonRows, error } = await supabase
        .from('lessons')
        .select(`
          id, scheduled_time, duration_minutes, status, payment_status,
          teacher_id, learner_id, student_id, subject_id, total_cost_paid,
          "100ms_room_id", teacher_room_code, student_room_code,
          subject:subjects!subject_id(name)
        `)
        .order('scheduled_time', { ascending: false });

      if (error) throw error;

      const rows: any[] = lessonRows || [];

      // Resolve names + timezones via id->record lookup maps (avoids fragile deep embeds).
      const uniq = (vals: any[]) => [...new Set(vals.filter(Boolean))];
      const teacherIds = uniq(rows.map(r => r.teacher_id));
      const learnerIds = uniq(rows.map(r => r.learner_id));
      const studentIds = uniq(rows.map(r => r.student_id));

      const teacherMap: Record<string, { name: string; tz: string | null }> = {};
      if (teacherIds.length) {
        const { data: teachers } = await supabase
          .from('teacher_profiles')
          .select('id, user:profiles!user_id(full_name, timezone)')
          .in('id', teacherIds);
        (teachers || []).forEach((t: any) => {
          teacherMap[t.id] = { name: t.user?.full_name || 'Unknown Teacher', tz: t.user?.timezone ?? null };
        });
      }

      const learnerMap: Record<string, { name: string; tz: string | null }> = {};
      if (learnerIds.length) {
        const { data: learners } = await supabase
          .from('learners')
          .select('id, name, owner:profiles!parent_id(full_name, timezone)')
          .in('id', learnerIds);
        (learners || []).forEach((l: any) => {
          learnerMap[l.id] = { name: l.name || l.owner?.full_name || 'Unknown Student', tz: l.owner?.timezone ?? null };
        });
      }

      const studentMap: Record<string, { name: string; tz: string | null }> = {};
      if (studentIds.length) {
        const { data: studentProfiles } = await supabase
          .from('profiles')
          .select('id, full_name, timezone')
          .in('id', studentIds);
        (studentProfiles || []).forEach((s: any) => {
          studentMap[s.id] = { name: s.full_name || 'Unknown Student', tz: s.timezone ?? null };
        });
      }

      // Transform data
      const sessionData: Session[] = rows.map((lesson: any) => {
        const teacher = lesson.teacher_id ? teacherMap[lesson.teacher_id] : undefined;
        const student = (lesson.learner_id ? learnerMap[lesson.learner_id] : undefined)
          || (lesson.student_id ? studentMap[lesson.student_id] : undefined);
        const scheduledIso: string = lesson.scheduled_time || '';
        return {
          id: lesson.id,
          subject: lesson.subject?.name || 'Unknown',
          teacher_name: teacher?.name || 'Unknown Teacher',
          student_name: student?.name || 'Unknown Student',
          teacher_tz: teacher?.tz ?? null,
          student_tz: student?.tz ?? null,
          scheduled_date: scheduledIso ? scheduledIso.split('T')[0] : '',
          scheduled_time: scheduledIso,
          duration_minutes: lesson.duration_minutes || 0,
          type: 'private',
          price: Number(lesson.total_cost_paid || 0),
          status: lesson.status || 'pending',
          payment_status: lesson.payment_status || 'unpaid',
          room_id: lesson['100ms_room_id'],
          teacher_room_code: lesson.teacher_room_code,
          student_room_code: lesson.student_room_code,
        };
      });

      setSessions(sessionData);

      // Calculate stats (today = same UTC calendar day)
      const today = new Date().toISOString().split('T')[0];
      const todaySessions = sessionData.filter(s => s.scheduled_date === today);

      setStats({
        total: sessionData.length,
        private: sessionData.filter(s => s.type === 'private').length,
        group: sessionData.filter(s => s.type === 'group').length,
        today: todaySessions.length,
      });

    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...sessions];

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(session =>
        session.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.subject.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(session => session.type === typeFilter);
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(session =>
        session.subject.toLowerCase() === subjectFilter.toLowerCase()
      );
    }

    setFilteredSessions(filtered);
    setCurrentPage(1); // Reset to first page when filters change
  }

  function getStatusColor(status: string) {
    const colors = {
      scheduled: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
      confirmed: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
      pending: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
      completed: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
      cancelled: 'bg-red-500/10 border-red-500/20 text-red-400',
    };
    return colors[status as keyof typeof colors] || colors.pending;
  }

  const navigate = useNavigate();

  function handleViewInsights(session: Session) {
    navigate(`/lesson/${session.id}/insights`);
  }

  function handleViewSession(session: Session) {
    setSelectedSession(session);
    setShowViewModal(true);
  }

  function handleEditSession(session: Session) {
    setSelectedSession(session);
    setShowEditModal(true);
  }

  function handleRescheduleSession(session: Session) {
    setSelectedSession(session);
    setShowRescheduleModal(true);
  }

  function handleCancelSession(session: Session) {
    setSelectedSession(session);
    setShowCancelModal(true);
  }

  async function confirmCancelSession() {
    if (!selectedSession) return;

    try {
      const { error } = await supabase
        .from('lessons')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', selectedSession.id);

      if (error) throw error;

      // Refresh data
      await fetchSessionData();
      setShowCancelModal(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Error cancelling session:', error);
      toast.error('Failed to cancel session');
    }
  }

  // Pagination
  const indexOfLastSession = currentPage * sessionsPerPage;
  const indexOfFirstSession = indexOfLastSession - sessionsPerPage;
  const currentSessions = filteredSessions.slice(indexOfFirstSession, indexOfLastSession);
  const totalPages = Math.ceil(filteredSessions.length / sessionsPerPage);

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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Session Management</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage all student and group sessions</p>
        </div>
        <button
          onClick={() => setShowNewSession(true)}
          className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>New Session</span>
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard
          label="Total Sessions"
          value={stats.total}
          icon={BookOpen}
          color="blue"
        />
        <StatCard
          label="Private Sessions"
          value={stats.private}
          icon={Users}
          color="cyan"
        />
        <StatCard
          label="Group Sessions"
          value={stats.group}
          icon={Users}
          color="emerald"
        />
        <StatCard
          label="Today's Sessions"
          value={stats.today}
          icon={Calendar}
          color="purple"
        />
      </div>

      {/* Search and Filters */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-500 dark:text-gray-400" />
            <input
              type="text"
              placeholder="Search by teacher, student, or session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Types</option>
              <option value="private">Private</option>
              <option value="group">Group</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Filter by Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="all">All Subjects</option>
              <option value="quran">Quran</option>
              <option value="arabic">Arabic</option>
              <option value="islamic studies">Islamic Studies</option>
            </select>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="mb-4 text-gray-600 dark:text-gray-400">
        Showing {indexOfFirstSession + 1}-{Math.min(indexOfLastSession, filteredSessions.length)} of {filteredSessions.length} sessions
      </div>

      {/* Session List */}
      <div className="space-y-4 mb-8">
        {currentSessions.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400 text-lg">No sessions found</p>
            <p className="text-gray-500 dark:text-gray-500 text-sm mt-2">Try adjusting your filters or create a new session</p>
          </div>
        ) : (
          currentSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onView={handleViewSession}
              onInsights={handleViewInsights}
              onEdit={handleEditSession}
              onReschedule={handleRescheduleSession}
              onCancel={handleCancelSession}
              getStatusColor={getStatusColor}
            />
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center space-x-2 mb-8">
          <button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center space-x-1"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Previous</span>
          </button>

          {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
            const pageNum = currentPage <= 3 ? i + 1 : currentPage - 2 + i;
            if (pageNum > totalPages) return null;
            return (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-4 py-2 rounded-lg transition ${
                  currentPage === pageNum
                    ? 'bg-emerald-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center space-x-1"
          >
            <span>Next</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Modals */}
      {showNewSession && <NewSessionModal onClose={() => setShowNewSession(false)} onSuccess={fetchSessionData} />}
      {showViewModal && selectedSession && <ViewSessionModal session={selectedSession} onClose={() => setShowViewModal(false)} />}
      {showEditModal && selectedSession && <EditSessionModal session={selectedSession} onClose={() => setShowEditModal(false)} onSuccess={fetchSessionData} />}
      {showRescheduleModal && selectedSession && <RescheduleModal session={selectedSession} onClose={() => setShowRescheduleModal(false)} onSuccess={fetchSessionData} />}
      {showCancelModal && selectedSession && (
        <CancelConfirmModal
          session={selectedSession}
          onClose={() => setShowCancelModal(false)}
          onConfirm={confirmCancelSession}
        />
      )}
    </div>
  );
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color }: any) {
  const colors = {
    blue: 'bg-blue-500/10 border-blue-500/20 text-blue-400',
    cyan: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`${colors[color as keyof typeof colors]} border rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <p className="text-sm opacity-75 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

// Session Card Component
function SessionCard({ session, onView, onInsights, onEdit, onReschedule, onCancel, getStatusColor }: any) {
  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{session.subject} Session</h3>
            <span className={`px-3 py-1 ${getStatusColor(session.status)} border rounded-full text-xs font-medium`}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
          </div>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p><span className="text-gray-500 dark:text-gray-400">Teacher:</span> {session.teacher_name}</p>
            <p><span className="text-gray-500 dark:text-gray-400">Student:</span> {session.student_name}</p>
            <div className="space-y-1 mt-2">
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span><span className="text-gray-500 dark:text-gray-400">Teacher:</span> {formatLessonDate(session.scheduled_time, session.teacher_tz)} · {formatLessonTime(session.scheduled_time, session.teacher_tz)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span><span className="text-gray-500 dark:text-gray-400">Student:</span> {formatLessonDate(session.scheduled_time, session.student_tz)} · {formatLessonTime(session.scheduled_time, session.student_tz)}</span>
              </div>
              <div className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{session.duration_minutes}m</span>
              </div>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-emerald-600 dark:text-emerald-400">Type: {session.type.charAt(0).toUpperCase() + session.type.slice(1)}</span>
              <span className="flex items-center space-x-1 text-emerald-500 dark:text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <span>£{Number(session.price || 0).toFixed(2)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={() => onView(session)}
          className="px-3 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-600 rounded-lg transition text-sm flex items-center space-x-1"
        >
          <Eye className="w-4 h-4" />
          <span>View Details</span>
        </button>
        <button
          onClick={() => onInsights(session)}
          className="px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/20 text-purple-600 rounded-lg transition text-sm flex items-center space-x-1"
          title="View lesson insights"
        >
          <BookOpen className="w-4 h-4" />
          <span>Insights</span>
        </button>
        <button
          onClick={() => onEdit(session)}
          className="px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition text-sm flex items-center space-x-1"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={() => onReschedule(session)}
          className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-400 rounded-lg transition text-sm flex items-center space-x-1"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Reschedule</span>
        </button>
        {session.status !== 'cancelled' && (
          <button
            onClick={() => onCancel(session)}
            className="px-3 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-lg transition text-sm flex items-center space-x-1"
          >
            <XIcon className="w-4 h-4" />
            <span>Cancel</span>
          </button>
        )}
      </div>
    </div>
  );
}

// Modal Components
function NewSessionModal({ onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);

  // Selected student's credit standing (loaded when a student is picked)
  const [creditBalance, setCreditBalance] = useState<number | null>(null);
  const [unlimitedCredits, setUnlimitedCredits] = useState(false);
  const [loadingCredits, setLoadingCredits] = useState(false);

  const [formData, setFormData] = useState({
    teacher_id: '',
    student_id: '',
    subject_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    type: 'private',
    // How the lesson is paid for: charge the student's credits, or gift it free.
    payment_method: 'credits' as 'credits' | 'gift',
  });

  // Credits needed = 1 credit per 60 min.
  const creditsNeeded = (Number(formData.duration_minutes) || 60) / 60;
  const chargingCredits = formData.payment_method === 'credits';
  const insufficientCredits =
    chargingCredits &&
    !unlimitedCredits &&
    formData.student_id !== '' &&
    creditBalance !== null &&
    creditBalance < creditsNeeded;

  useEffect(() => {
    fetchFormData();
  }, []);

  // Load the selected student's credit balance whenever the student changes.
  useEffect(() => {
    if (!formData.student_id) {
      setCreditBalance(null);
      setUnlimitedCredits(false);
      return;
    }

    let cancelled = false;
    (async () => {
      setLoadingCredits(true);
      try {
        const [{ data: profileRow }, { data: creditRow }] = await Promise.all([
          supabase.from('profiles').select('unlimited_credits').eq('id', formData.student_id).maybeSingle(),
          supabase.from('user_credits').select('credits_remaining').eq('user_id', formData.student_id).maybeSingle(),
        ]);
        if (cancelled) return;
        setUnlimitedCredits(!!profileRow?.unlimited_credits);
        setCreditBalance(Number(creditRow?.credits_remaining ?? 0));
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading student credits:', error);
          setCreditBalance(0);
          setUnlimitedCredits(false);
        }
      } finally {
        if (!cancelled) setLoadingCredits(false);
      }
    })();

    return () => { cancelled = true; };
  }, [formData.student_id]);

  async function fetchFormData() {
    try {
      // Fetch approved teachers
      const { data: teacherData } = await supabase
        .from('teacher_profiles')
        .select('id, user_id, profiles!teacher_profiles_user_id_fkey(full_name)')
        .eq('status', 'approved');

      setTeachers(teacherData || []);

      // Fetch students (users with student role)
      const { data: studentData } = await supabase
        .from('profiles')
        .select('id, full_name, roles')
        .contains('roles', ['student']);

      setStudents(studentData || []);

      // Fetch subjects
      const { data: subjectData } = await supabase
        .from('subjects')
        .select('*')
        .order('name');

      setSubjects(subjectData || []);
    } catch (error) {
      console.error('Error fetching form data:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (insufficientCredits) {
      toast.error(`Student only has ${creditBalance} credit(s) but ${creditsNeeded} are needed. Add credits or gift the lesson.`);
      return;
    }

    setLoading(true);

    try {
      // Create via the internal booking function so a 100ms room is provisioned
      // (raw-inserting into `lessons` would create a room-less, unjoinable lesson).
      const scheduledIso = new Date(
        `${formData.scheduled_date}T${formData.scheduled_time}`
      ).toISOString();

      const { data, error } = await supabase.functions.invoke('create-single-booking-internal', {
        body: {
          user_id: formData.student_id,        // student profiles.id
          teacher_id: formData.teacher_id,      // teacher_profiles.id
          date: formData.scheduled_date,        // YYYY-MM-DD
          time: scheduledIso,                   // full ISO -> stored as scheduled_time
          subject: formData.subject_id,         // subjects.id
          duration: Number(formData.duration_minutes) || 60,
          payment_method: formData.payment_method, // 'credits' | 'gift'
        },
      });

      if (error) throw error;
      if (data && (data as any).error) throw new Error((data as any).error);

      const charged = (data as any)?.credits_charged || 0;
      toast.success(
        formData.payment_method === 'gift'
          ? 'Lesson gifted to student (free).'
          : charged > 0
            ? `Lesson booked — ${charged} credit${charged === 1 ? '' : 's'} charged.`
            : 'Lesson booked.'
      );

      await onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Error creating session:', error);
      toast.error(error?.message || 'Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Create New Session</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Teacher</label>
              <select
                required
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {(teacher.profiles as any)?.full_name || 'Unknown'}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Student</label>
              <select
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="">Select Student</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.full_name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Subject</label>
            <select
              required
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Select Subject</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Date</label>
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Time</label>
              <input
                type="time"
                required
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Duration (minutes)</label>
              <input
                type="number"
                required
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex items-end">
              <div className="w-full text-sm text-gray-600 dark:text-gray-400 px-1 pb-2">
                {creditsNeeded} credit{creditsNeeded === 1 ? '' : 's'} needed
                <span className="text-gray-400 dark:text-gray-500"> (1 credit = 60 min)</span>
              </div>
            </div>
          </div>

          {/* Payment method: charge the student's credits, or gift the lesson free */}
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Payment</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'credits' })}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-left transition ${
                  formData.payment_method === 'credits'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <CreditCard className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Use student's credits</span>
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, payment_method: 'gift' })}
                className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-left transition ${
                  formData.payment_method === 'gift'
                    ? 'border-pink-500 bg-pink-50 dark:bg-pink-500/10 text-pink-700 dark:text-pink-300'
                    : 'border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }`}
              >
                <Gift className="w-5 h-5 shrink-0" />
                <span className="text-sm font-medium">Gift free lesson</span>
              </button>
            </div>

            {/* Live credit standing for the selected student */}
            {formData.student_id && chargingCredits && (
              <div className="mt-2 text-sm">
                {loadingCredits ? (
                  <span className="text-gray-500 dark:text-gray-400">Checking credit balance…</span>
                ) : unlimitedCredits ? (
                  <span className="text-emerald-600 dark:text-emerald-400">✨ Student has unlimited credits — nothing will be charged.</span>
                ) : insufficientCredits ? (
                  <span className="flex items-center gap-1.5 text-red-600 dark:text-red-400">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Balance {creditBalance} credit{creditBalance === 1 ? '' : 's'} — not enough for this {creditsNeeded}-credit lesson.
                  </span>
                ) : (
                  <span className="text-gray-600 dark:text-gray-400">
                    Balance: <span className="font-medium text-gray-900 dark:text-white">{creditBalance}</span> credit{creditBalance === 1 ? '' : 's'} — {creditsNeeded} will be charged.
                  </span>
                )}
              </div>
            )}
            {formData.student_id && !chargingCredits && (
              <div className="mt-2 text-sm text-pink-600 dark:text-pink-400">
                This lesson will be free for the student (no credits charged).
              </div>
            )}
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || insufficientCredits}
              className="flex-1 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition"
            >
              {loading
                ? 'Creating...'
                : formData.payment_method === 'gift'
                  ? 'Gift Lesson'
                  : 'Book & Charge Credits'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ViewSessionModal({ session, onClose }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Session Details</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 text-gray-900 dark:text-gray-400">
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Session ID</p>
            <p className="font-mono text-sm">{session.id}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Subject</p>
            <p>{session.subject}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Teacher</p>
            <p>{session.teacher_name}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Student</p>
            <p>{session.student_name}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Scheduled</p>
            <p>Teacher: {formatLessonDate(session.scheduled_time, session.teacher_tz)} · {formatLessonTime(session.scheduled_time, session.teacher_tz)}</p>
            <p>Student: {formatLessonDate(session.scheduled_time, session.student_tz)} · {formatLessonTime(session.scheduled_time, session.student_tz)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Duration</p>
            <p>{session.duration_minutes} minutes</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Price</p>
            <p>£{Number(session.price || 0).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-gray-500 dark:text-gray-400 text-sm">Payment Status</p>
            <p className="capitalize">{session.payment_status}</p>
          </div>
          {session.room_id && (
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">100ms Room ID</p>
              <p className="font-mono text-sm">{session.room_id}</p>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function EditSessionModal({ session, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const [subjects, setSubjects] = useState<any[]>([]);

  const _editInit = new Date(session.scheduled_time);
  const _pad = (n: number) => String(n).padStart(2, '0');
  const [formData, setFormData] = useState({
    subject_id: '',
    scheduled_date: `${_editInit.getFullYear()}-${_pad(_editInit.getMonth() + 1)}-${_pad(_editInit.getDate())}`,
    scheduled_time: `${_pad(_editInit.getHours())}:${_pad(_editInit.getMinutes())}`,
    duration_minutes: session.duration_minutes,
    price: session.price,
    status: session.status,
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  async function fetchSubjects() {
    try {
      const { data } = await supabase
        .from('subjects')
        .select('*')
        .order('name');
      setSubjects(data || []);
    } catch (error) {
      console.error('Error fetching subjects:', error);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const updateData: any = {
        scheduled_time: new Date(
          `${formData.scheduled_date}T${formData.scheduled_time}`
        ).toISOString(),
        duration_minutes: formData.duration_minutes,
        status: formData.status,
      };

      if (formData.subject_id) {
        updateData.subject_id = formData.subject_id;
      }

      const { error } = await supabase
        .from('lessons')
        .update(updateData)
        .eq('id', session.id);

      if (error) throw error;

      await onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
      toast.error('Failed to update session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Edit Session</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">Editing session for:</p>
            <p className="text-gray-900 dark:text-white font-medium">{session.teacher_name} → {session.student_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Subject (optional)</label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="">Keep current ({session.subject})</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Date</label>
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Time</label>
              <input
                type="time"
                required
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Duration (minutes)</label>
              <input
                type="number"
                required
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Price (£)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 text-white rounded-lg transition"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function RescheduleModal({ session, onClose, onSuccess }: any) {
  const [loading, setLoading] = useState(false);
  const _rInit = new Date(session.scheduled_time);
  const _pad = (n: number) => String(n).padStart(2, '0');
  const [formData, setFormData] = useState({
    scheduled_date: `${_rInit.getFullYear()}-${_pad(_rInit.getMonth() + 1)}-${_pad(_rInit.getDate())}`,
    scheduled_time: `${_pad(_rInit.getHours())}:${_pad(_rInit.getMinutes())}`,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('lessons')
        .update({
          scheduled_time: new Date(
            `${formData.scheduled_date}T${formData.scheduled_time}`
          ).toISOString(),
        })
        .eq('id', session.id);

      if (error) throw error;

      await onSuccess();
      onClose();
    } catch (error) {
      console.error('Error rescheduling session:', error);
      toast.error('Failed to reschedule session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Reschedule Session</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4 mb-4">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Current Schedule:</p>
          <p className="text-gray-900 dark:text-white font-medium">
            {formatLessonDate(session.scheduled_time, null)} at {formatLessonTime(session.scheduled_time, null)}
          </p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
            {session.teacher_name} → {session.student_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">New Date</label>
            <input
              type="date"
              required
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-900 dark:text-gray-400 mb-2">New Time</label>
            <input
              type="time"
              required
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3">
            <p className="text-amber-400 text-sm">
              Note: Both teacher and student should be notified about this schedule change.
            </p>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white rounded-lg transition"
            >
              {loading ? 'Rescheduling...' : 'Reschedule'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CancelConfirmModal({ session, onClose, onConfirm }: any) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 border border-gray-200 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Cancel Session</h3>
          <button onClick={onClose} className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-gray-900 dark:text-gray-400 mb-6">
          Are you sure you want to cancel this session with <strong>{session.teacher_name}</strong> and <strong>{session.student_name}</strong>?
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm mb-6">This action will update the session status to cancelled.</p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition"
          >
            Keep Session
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition"
          >
            Cancel Session
          </button>
        </div>
      </div>
    </div>
  );
}
