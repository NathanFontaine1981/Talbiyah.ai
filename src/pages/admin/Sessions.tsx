import { useEffect, useState } from 'react';
import { Search, Plus, Calendar, Clock, Users, BookOpen, Filter, Eye, Edit, RefreshCw, X as XIcon, ChevronDown, ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';

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
  scheduled_date: string;
  scheduled_time: string;
  duration_minutes: number;
  type: 'private' | 'group';
  price: number;
  status: 'scheduled' | 'confirmed' | 'pending' | 'completed' | 'cancelled';
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

      // Fetch all bookings with related data
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          *,
          teacher:profiles!teacher_id(full_name),
          student:profiles!student_id(full_name),
          subject:subjects(name)
        `)
        .order('scheduled_date', { ascending: false })
        .order('scheduled_time', { ascending: false });

      if (error) throw error;

      // Transform data
      const sessionData: Session[] = bookings?.map((booking: any) => ({
        id: booking.id,
        subject: booking.subject?.name || 'Unknown',
        teacher_name: booking.teacher?.full_name || 'Unknown Teacher',
        student_name: booking.student?.full_name || 'Unknown Student',
        scheduled_date: booking.scheduled_date,
        scheduled_time: booking.scheduled_time,
        duration_minutes: booking.duration_minutes,
        type: 'private', // Default to private for now
        price: booking.price,
        status: booking.status || 'pending',
        payment_status: booking.payment_status || 'unpaid',
        room_id: booking.room_id,
        teacher_room_code: booking.teacher_room_code,
        student_room_code: booking.student_room_code,
      })) || [];

      setSessions(sessionData);

      // Calculate stats
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
      completed: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
      cancelled: 'bg-red-500/10 border-red-500/20 text-red-400',
    };
    return colors[status as keyof typeof colors] || colors.pending;
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
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', selectedSession.id);

      if (error) throw error;

      // Refresh data
      await fetchSessionData();
      setShowCancelModal(false);
      setSelectedSession(null);
    } catch (error) {
      console.error('Error cancelling session:', error);
      alert('Failed to cancel session');
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
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Session Management</h1>
          <p className="text-slate-400">Manage all student and group sessions</p>
        </div>
        <button
          onClick={() => setShowNewSession(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition flex items-center space-x-2"
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
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        {/* Search */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by teacher, student, or session ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Filter by Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Types</option>
              <option value="private">Private</option>
              <option value="group">Group</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Filter by Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
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
            <label className="block text-sm font-medium text-slate-400 mb-2">Filter by Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
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
      <div className="mb-4 text-slate-400">
        Showing {indexOfFirstSession + 1}-{Math.min(indexOfLastSession, filteredSessions.length)} of {filteredSessions.length} sessions
      </div>

      {/* Session List */}
      <div className="space-y-4 mb-8">
        {currentSessions.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <BookOpen className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg">No sessions found</p>
            <p className="text-slate-500 text-sm mt-2">Try adjusting your filters or create a new session</p>
          </div>
        ) : (
          currentSessions.map(session => (
            <SessionCard
              key={session.id}
              session={session}
              onView={handleViewSession}
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
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center space-x-1"
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
                    ? 'bg-cyan-500 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-white'
                }`}
              >
                {pageNum}
              </button>
            );
          })}

          <button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center space-x-1"
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
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-8 h-8" />
      </div>
      <p className="text-sm opacity-75 mb-1">{label}</p>
      <p className="text-3xl font-bold">{value}</p>
    </div>
  );
}

// Session Card Component
function SessionCard({ session, onView, onEdit, onReschedule, onCancel, getStatusColor }: any) {
  const sessionDate = session.scheduled_date ? new Date(session.scheduled_date) : new Date();
  const formattedDate = format(sessionDate, 'MMM d, yyyy');

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <h3 className="text-lg font-semibold text-white">{session.subject} Session</h3>
            <span className={`px-3 py-1 ${getStatusColor(session.status)} border rounded-full text-xs font-medium`}>
              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
            </span>
          </div>
          <div className="space-y-1 text-sm text-slate-400">
            <p><span className="text-slate-500">Teacher:</span> {session.teacher_name}</p>
            <p><span className="text-slate-500">Student:</span> {session.student_name}</p>
            <div className="flex items-center space-x-4 mt-2">
              <span className="flex items-center space-x-1">
                <Calendar className="w-4 h-4" />
                <span>{formattedDate}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{session.scheduled_time}</span>
              </span>
              <span className="flex items-center space-x-1">
                <Clock className="w-4 h-4" />
                <span>{session.duration_minutes}m</span>
              </span>
            </div>
            <div className="flex items-center space-x-4 mt-2">
              <span className="text-cyan-400">Type: {session.type.charAt(0).toUpperCase() + session.type.slice(1)}</span>
              <span className="flex items-center space-x-1 text-emerald-400">
                <DollarSign className="w-4 h-4" />
                <span>£{(session.price / 100).toFixed(2)}</span>
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center space-x-2 pt-4 border-t border-slate-700">
        <button
          onClick={() => onView(session)}
          className="px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-lg transition text-sm flex items-center space-x-1"
        >
          <Eye className="w-4 h-4" />
          <span>View Details</span>
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

  const [formData, setFormData] = useState({
    teacher_id: '',
    student_id: '',
    subject_id: '',
    scheduled_date: '',
    scheduled_time: '',
    duration_minutes: 60,
    type: 'private',
    price: 1500, // £15.00 in pence
    status: 'scheduled',
  });

  useEffect(() => {
    fetchFormData();
  }, []);

  async function fetchFormData() {
    try {
      // Fetch approved teachers
      const { data: teacherData } = await supabase
        .from('teacher_profiles')
        .select('id, user_id, profiles!inner(full_name)')
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
    setLoading(true);

    try {
      const { error } = await supabase.from('bookings').insert([{
        teacher_id: formData.teacher_id,
        student_id: formData.student_id,
        subject_id: formData.subject_id,
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        status: formData.status,
        payment_status: 'unpaid',
      }]);

      if (error) throw error;

      await onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating session:', error);
      alert('Failed to create session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Create New Session</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Teacher</label>
              <select
                required
                value={formData.teacher_id}
                onChange={(e) => setFormData({ ...formData, teacher_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select Teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.user_id}>
                    {(teacher.profiles as any).full_name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Student</label>
              <select
                required
                value={formData.student_id}
                onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
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
            <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
            <select
              required
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
              <input
                type="time"
                required
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Duration (minutes)</label>
              <input
                type="number"
                required
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Price (£)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price / 100}
                onChange={(e) => setFormData({ ...formData, price: Math.round(parseFloat(e.target.value) * 100) })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg transition"
            >
              {loading ? 'Creating...' : 'Create Session'}
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
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Session Details</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <div className="space-y-4 text-slate-300">
          <div>
            <p className="text-slate-500 text-sm">Session ID</p>
            <p className="font-mono text-sm">{session.id}</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Subject</p>
            <p>{session.subject}</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Teacher</p>
            <p>{session.teacher_name}</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Student</p>
            <p>{session.student_name}</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Scheduled</p>
            <p>{format(new Date(session.scheduled_date), 'MMMM d, yyyy')} at {session.scheduled_time}</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Duration</p>
            <p>{session.duration_minutes} minutes</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Price</p>
            <p>£{(session.price / 100).toFixed(2)}</p>
          </div>
          <div>
            <p className="text-slate-500 text-sm">Payment Status</p>
            <p className="capitalize">{session.payment_status}</p>
          </div>
          {session.room_id && (
            <div>
              <p className="text-slate-500 text-sm">100ms Room ID</p>
              <p className="font-mono text-sm">{session.room_id}</p>
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          className="mt-6 w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
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

  const [formData, setFormData] = useState({
    subject_id: '',
    scheduled_date: session.scheduled_date,
    scheduled_time: session.scheduled_time,
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
        scheduled_date: formData.scheduled_date,
        scheduled_time: formData.scheduled_time,
        duration_minutes: formData.duration_minutes,
        price: formData.price,
        status: formData.status,
      };

      if (formData.subject_id) {
        updateData.subject_id = formData.subject_id;
      }

      const { error } = await supabase
        .from('bookings')
        .update(updateData)
        .eq('id', session.id);

      if (error) throw error;

      await onSuccess();
      onClose();
    } catch (error) {
      console.error('Error updating session:', error);
      alert('Failed to update session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Edit Session</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-400">Editing session for:</p>
            <p className="text-white font-medium">{session.teacher_name} → {session.student_name}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Subject (optional)</label>
            <select
              value={formData.subject_id}
              onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
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
              <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
              <input
                type="date"
                required
                value={formData.scheduled_date}
                onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Time</label>
              <input
                type="time"
                required
                value={formData.scheduled_time}
                onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Duration (minutes)</label>
              <input
                type="number"
                required
                min="15"
                step="15"
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Price (£)</label>
              <input
                type="number"
                required
                min="0"
                step="0.01"
                value={formData.price / 100}
                onChange={(e) => setFormData({ ...formData, price: Math.round(parseFloat(e.target.value) * 100) })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
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
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
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
  const [formData, setFormData] = useState({
    scheduled_date: session.scheduled_date,
    scheduled_time: session.scheduled_time,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('bookings')
        .update({
          scheduled_date: formData.scheduled_date,
          scheduled_time: formData.scheduled_time,
        })
        .eq('id', session.id);

      if (error) throw error;

      await onSuccess();
      onClose();
    } catch (error) {
      console.error('Error rescheduling session:', error);
      alert('Failed to reschedule session. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Reschedule Session</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>

        <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4 mb-4">
          <p className="text-sm text-slate-400 mb-1">Current Schedule:</p>
          <p className="text-white font-medium">
            {format(new Date(session.scheduled_date), 'MMMM d, yyyy')} at {session.scheduled_time}
          </p>
          <p className="text-slate-400 text-sm mt-2">
            {session.teacher_name} → {session.student_name}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Date</label>
            <input
              type="date"
              required
              value={formData.scheduled_date}
              onChange={(e) => setFormData({ ...formData, scheduled_date: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">New Time</label>
            <input
              type="time"
              required
              value={formData.scheduled_time}
              onChange={(e) => setFormData({ ...formData, scheduled_time: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
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
              className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
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
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Cancel Session</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <XIcon className="w-5 h-5" />
          </button>
        </div>
        <p className="text-slate-300 mb-6">
          Are you sure you want to cancel this session with <strong>{session.teacher_name}</strong> and <strong>{session.student_name}</strong>?
        </p>
        <p className="text-slate-400 text-sm mb-6">This action will update the session status to cancelled.</p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
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
