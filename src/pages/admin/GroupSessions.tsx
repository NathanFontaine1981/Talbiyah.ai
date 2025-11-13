import { useEffect, useState } from 'react';
import { Plus, Search, Users, Calendar, Clock, DollarSign, X, Edit, UserPlus, Mail, AlertCircle, Check } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { format } from 'date-fns';

interface GroupSession {
  id: string;
  name: string;
  subject_id: string;
  subject?: { name: string };
  teacher_id: string;
  teacher?: { full_name: string };
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
  created_by: string;
  created_at: string;
}

interface Participant {
  id: string;
  group_session_id: string;
  student_id: string;
  student?: { full_name: string; email: string };
  enrolled_at: string;
}

type TabView = 'browse' | 'my-sessions';
type SubjectFilter = 'all' | string;
type TypeFilter = 'all' | 'free' | 'paid';
type LevelFilter = 'all' | 'beginner' | 'intermediate' | 'advanced';

export default function GroupSessions() {
  const [currentTab, setCurrentTab] = useState<TabView>('browse');
  const [sessions, setSessions] = useState<GroupSession[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<GroupSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Filters
  const [subjectFilter, setSubjectFilter] = useState<SubjectFilter>('all');
  const [typeFilter, setTypeFilter] = useState<TypeFilter>('all');
  const [levelFilter, setLevelFilter] = useState<LevelFilter>('all');
  const [subjects, setSubjects] = useState<any[]>([]);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showParticipantsModal, setShowParticipantsModal] = useState(false);
  const [selectedSession, setSelectedSession] = useState<GroupSession | null>(null);

  useEffect(() => {
    fetchCurrentUser();
    fetchSubjects();
    fetchGroupSessions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [currentTab, subjectFilter, typeFilter, levelFilter, sessions, currentUser]);

  async function fetchCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  }

  async function fetchSubjects() {
    const { data } = await supabase
      .from('subjects')
      .select('*')
      .order('name');
    setSubjects(data || []);
  }

  async function fetchGroupSessions() {
    try {
      setLoading(true);

      // Note: This assumes a group_sessions table exists
      // If it doesn't, we'll create a migration for it
      const { data, error } = await supabase
        .from('group_sessions')
        .select(`
          *,
          subject:subjects(name),
          teacher:profiles!teacher_id(full_name)
        `)
        .order('created_at', { ascending: false });

      if (error) {
        // Table might not exist yet
        console.error('Error fetching group sessions:', error);
        setSessions([]);
      } else {
        setSessions(data || []);
      }
    } catch (error) {
      console.error('Error:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }

  function applyFilters() {
    let filtered = [...sessions];

    // Tab filter
    if (currentTab === 'my-sessions' && currentUser) {
      filtered = filtered.filter(s => s.created_by === currentUser.id || s.teacher_id === currentUser.id);
    }

    // Subject filter
    if (subjectFilter !== 'all') {
      filtered = filtered.filter(s => s.subject_id === subjectFilter);
    }

    // Type filter
    if (typeFilter === 'free') {
      filtered = filtered.filter(s => s.is_free);
    } else if (typeFilter === 'paid') {
      filtered = filtered.filter(s => !s.is_free);
    }

    // Level filter
    if (levelFilter !== 'all') {
      filtered = filtered.filter(s => s.level === levelFilter);
    }

    setFilteredSessions(filtered);
  }

  function handleManageParticipants(session: GroupSession) {
    setSelectedSession(session);
    setShowParticipantsModal(true);
  }

  function handleEditSession(session: GroupSession) {
    setSelectedSession(session);
    setShowEditModal(true);
  }

  function getSessionStatus(session: GroupSession) {
    if (session.status === 'cancelled') return { label: 'Cancelled', color: 'bg-red-500/10 border-red-500/20 text-red-400', icon: '❌' };
    if (session.status === 'closed') return { label: 'Closed', color: 'bg-slate-500/10 border-slate-500/20 text-slate-400', icon: '⚫' };
    if (session.current_participants >= session.max_participants) return { label: 'Full', color: 'bg-red-500/10 border-red-500/20 text-red-400', icon: '🔴' };

    const startDate = new Date(session.start_date);
    const daysUntilStart = Math.ceil((startDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilStart <= 3 && daysUntilStart >= 0) {
      return { label: 'Starting Soon', color: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400', icon: '🟡' };
    }

    return { label: 'Open', color: 'bg-green-500/10 border-green-500/20 text-green-400', icon: '🟢' };
  }

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
          <h1 className="text-3xl font-bold text-white mb-2">Group Sessions</h1>
          <p className="text-slate-400">Manage group learning sessions</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Create Group Session</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 mb-6 bg-slate-800/50 border border-slate-700 rounded-lg p-1">
        <button
          onClick={() => setCurrentTab('browse')}
          className={`flex-1 px-4 py-2 rounded-md transition ${
            currentTab === 'browse'
              ? 'bg-cyan-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Browse Sessions
        </button>
        <button
          onClick={() => setCurrentTab('my-sessions')}
          className={`flex-1 px-4 py-2 rounded-md transition ${
            currentTab === 'my-sessions'
              ? 'bg-cyan-500 text-white'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          My Sessions
        </button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Subjects</option>
              {subjects.map((subject) => (
                <option key={subject.id} value={subject.id}>{subject.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Type</label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as TypeFilter)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All</option>
              <option value="free">Free Sessions</option>
              <option value="paid">Paid Sessions</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">Level</label>
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as LevelFilter)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="all">All Levels</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>
        </div>
      </div>

      {/* Sessions List */}
      <div className="space-y-4">
        {filteredSessions.length === 0 ? (
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
            <Users className="w-16 h-16 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 text-lg mb-2">No group sessions found</p>
            <p className="text-slate-500 text-sm">
              {currentTab === 'my-sessions'
                ? "You haven't created any group sessions yet"
                : "Try adjusting your filters or create a new group session"}
            </p>
          </div>
        ) : (
          filteredSessions.map((session) => (
            <GroupSessionCard
              key={session.id}
              session={session}
              status={getSessionStatus(session)}
              onManageParticipants={() => handleManageParticipants(session)}
              onEdit={() => handleEditSession(session)}
            />
          ))
        )}
      </div>

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupSessionModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            fetchGroupSessions();
            setShowCreateModal(false);
          }}
          subjects={subjects}
        />
      )}

      {showEditModal && selectedSession && (
        <EditGroupSessionModal
          session={selectedSession}
          onClose={() => {
            setShowEditModal(false);
            setSelectedSession(null);
          }}
          onSuccess={() => {
            fetchGroupSessions();
            setShowEditModal(false);
            setSelectedSession(null);
          }}
          subjects={subjects}
        />
      )}

      {showParticipantsModal && selectedSession && (
        <ManageParticipantsModal
          session={selectedSession}
          onClose={() => {
            setShowParticipantsModal(false);
            setSelectedSession(null);
          }}
          onUpdate={fetchGroupSessions}
        />
      )}
    </div>
  );
}

// Group Session Card Component
function GroupSessionCard({ session, status, onManageParticipants, onEdit }: any) {
  const getSubjectIcon = (name: string) => {
    if (name?.toLowerCase().includes('quran')) return '📗';
    if (name?.toLowerCase().includes('arabic')) return '✏️';
    if (name?.toLowerCase().includes('islamic')) return '🕌';
    return '📚';
  };

  const getLevelColor = (level: string) => {
    const colors = {
      beginner: 'bg-green-500/10 border-green-500/20 text-green-400',
      intermediate: 'bg-yellow-500/10 border-yellow-500/20 text-yellow-400',
      advanced: 'bg-red-500/10 border-red-500/20 text-red-400',
    };
    return colors[level as keyof typeof colors] || colors.beginner;
  };

  return (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-2xl">{getSubjectIcon(session.subject?.name)}</span>
            <h3 className="text-xl font-semibold text-white">{session.name}</h3>
            <span className={`px-3 py-1 ${status.color} border rounded-full text-xs font-medium`}>
              {status.icon} {status.label}
            </span>
          </div>
          <p className="text-slate-400 text-sm mb-3">Teacher: {session.teacher?.full_name || 'Unknown'}</p>
        </div>
        <div className="text-right">
          {session.is_free ? (
            <span className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-400 rounded-lg text-sm font-medium">
              FREE
            </span>
          ) : (
            <span className="px-4 py-2 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 rounded-lg text-sm font-medium">
              £{((session.price_per_session || 0) / 100).toFixed(2)}/session
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <div className={`px-3 py-1 ${getLevelColor(session.level)} border rounded-lg text-sm capitalize`}>
            {session.level}
          </div>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <Users className="w-4 h-4 text-slate-400" />
          <span className="text-sm">
            {session.current_participants || 0}/{session.max_participants}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-sm">Every {session.schedule_day}</span>
        </div>
        <div className="flex items-center space-x-2 text-slate-300">
          <Clock className="w-4 h-4 text-slate-400" />
          <span className="text-sm">{session.schedule_time} ({session.duration_minutes}m)</span>
        </div>
      </div>

      <div className="mb-4">
        <p className="text-slate-400 text-sm">
          <span className="font-medium">Starts:</span> {format(new Date(session.start_date), 'MMMM d, yyyy')}
          {session.end_date && (
            <span className="ml-4">
              <span className="font-medium">Ends:</span> {format(new Date(session.end_date), 'MMMM d, yyyy')}
            </span>
          )}
        </p>
      </div>

      {session.description && (
        <p className="text-slate-300 text-sm mb-4 line-clamp-2">{session.description}</p>
      )}

      <div className="flex items-center space-x-2 pt-4 border-t border-slate-700">
        <button className="px-4 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 text-cyan-400 rounded-lg transition text-sm">
          View Details
        </button>
        <button
          onClick={onEdit}
          className="px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition text-sm flex items-center space-x-1"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </button>
        <button
          onClick={onManageParticipants}
          className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 rounded-lg transition text-sm flex items-center space-x-1"
        >
          <Users className="w-4 h-4" />
          <span>Manage Participants</span>
        </button>
      </div>
    </div>
  );
}

// Create Group Session Modal
function CreateGroupSessionModal({ onClose, onSuccess, subjects }: any) {
  const [loading, setLoading] = useState(false);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    name: '',
    subject_id: '',
    teacher_id: '',
    level: 'beginner' as 'beginner' | 'intermediate' | 'advanced',
    max_participants: 6,
    schedule_day: 'Monday',
    schedule_time: '17:00',
    duration_minutes: 60,
    start_date: '',
    end_date: '',
    is_free: true,
    price_per_session: 0,
    description: '',
  });

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    const { data } = await supabase
      .from('teacher_profiles')
      .select('id, user_id, profiles!inner(full_name)')
      .eq('status', 'approved');
    setTeachers(data || []);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      const { error } = await supabase.from('group_sessions').insert([{
        ...formData,
        current_participants: 0,
        status: 'open',
        created_by: user?.id,
      }]);

      if (error) throw error;

      await onSuccess();
    } catch (error: any) {
      console.error('Error creating group session:', error);
      alert('Failed to create group session: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Create Group Session</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Session Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="Beginner Quran Group"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Subject</label>
              <select
                required
                value={formData.subject_id}
                onChange={(e) => setFormData({ ...formData, subject_id: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="">Select Subject</option>
                {subjects.map((subject: any) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
              </select>
            </div>

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
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Level</label>
            <div className="flex space-x-4">
              {['beginner', 'intermediate', 'advanced'].map((level) => (
                <label key={level} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="level"
                    value={level}
                    checked={formData.level === level}
                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                    className="w-4 h-4 text-cyan-500"
                  />
                  <span className="text-white capitalize">{level}</span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Max Participants</label>
            <input
              type="number"
              required
              min="2"
              max="20"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="border border-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Schedule</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2">Day</label>
                <select
                  value={formData.schedule_day}
                  onChange={(e) => setFormData({ ...formData, schedule_day: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                >
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day) => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm text-slate-400 mb-2">Time</label>
                <input
                  type="time"
                  required
                  value={formData.schedule_time}
                  onChange={(e) => setFormData({ ...formData, schedule_time: e.target.value })}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm text-slate-400 mb-2">Duration (minutes)</label>
              <select
                value={formData.duration_minutes}
                onChange={(e) => setFormData({ ...formData, duration_minutes: parseInt(e.target.value) })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="30">30 minutes</option>
                <option value="45">45 minutes</option>
                <option value="60">60 minutes</option>
                <option value="90">90 minutes</option>
                <option value="120">120 minutes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">Start Date</label>
              <input
                type="date"
                required
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-2">End Date (optional)</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="border border-slate-700 rounded-lg p-4">
            <h4 className="text-sm font-medium text-slate-300 mb-3">Pricing</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={formData.is_free}
                  onChange={() => setFormData({ ...formData, is_free: true, price_per_session: 0 })}
                  className="w-4 h-4 text-cyan-500"
                />
                <span className="text-white">Free</span>
              </label>
              <label className="flex items-center space-x-2">
                <input
                  type="radio"
                  checked={!formData.is_free}
                  onChange={() => setFormData({ ...formData, is_free: false })}
                  className="w-4 h-4 text-cyan-500"
                />
                <span className="text-white">Paid</span>
              </label>
              {!formData.is_free && (
                <div className="ml-6">
                  <label className="block text-sm text-slate-400 mb-2">Price per session (£)</label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price_per_session / 100}
                    onChange={(e) => setFormData({ ...formData, price_per_session: Math.round(parseFloat(e.target.value) * 100) })}
                    className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              placeholder="Describe the group session, learning objectives, and requirements..."
            ></textarea>
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

// Edit Group Session Modal (similar to Create)
function EditGroupSessionModal({ session, onClose, onSuccess, subjects }: any) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: session.name,
    subject_id: session.subject_id,
    level: session.level,
    max_participants: session.max_participants,
    schedule_day: session.schedule_day,
    schedule_time: session.schedule_time,
    duration_minutes: session.duration_minutes,
    start_date: session.start_date,
    end_date: session.end_date || '',
    is_free: session.is_free,
    price_per_session: session.price_per_session || 0,
    description: session.description || '',
    status: session.status,
  });

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase
        .from('group_sessions')
        .update(formData)
        .eq('id', session.id);

      if (error) throw error;

      await onSuccess();
    } catch (error) {
      console.error('Error updating group session:', error);
      alert('Failed to update group session');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">Edit Group Session</h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Session Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            >
              <option value="open">Open</option>
              <option value="closed">Closed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Max Participants</label>
            <input
              type="number"
              required
              min="2"
              max="20"
              value={formData.max_participants}
              onChange={(e) => setFormData({ ...formData, max_participants: parseInt(e.target.value) })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">Description</label>
            <textarea
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
            ></textarea>
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

// Manage Participants Modal
function ManageParticipantsModal({ session, onClose, onUpdate }: any) {
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [selectedStudent, setSelectedStudent] = useState('');

  useEffect(() => {
    fetchParticipants();
    fetchStudents();
  }, []);

  async function fetchParticipants() {
    try {
      const { data } = await supabase
        .from('group_session_participants')
        .select(`
          *,
          student:profiles!student_id(full_name, email)
        `)
        .eq('group_session_id', session.id);

      setParticipants(data || []);
    } catch (error) {
      console.error('Error fetching participants:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudents() {
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, email, roles')
      .contains('roles', ['student']);
    setStudents(data || []);
  }

  async function handleRemoveParticipant(participantId: string) {
    if (!confirm('Remove this student from the group session?')) return;

    try {
      const { error } = await supabase
        .from('group_session_participants')
        .delete()
        .eq('id', participantId);

      if (error) throw error;

      // Update participant count
      await supabase
        .from('group_sessions')
        .update({ current_participants: session.current_participants - 1 })
        .eq('id', session.id);

      await fetchParticipants();
      await onUpdate();
    } catch (error) {
      console.error('Error removing participant:', error);
      alert('Failed to remove participant');
    }
  }

  async function handleAddStudent() {
    if (!selectedStudent) return;

    try {
      const { error } = await supabase
        .from('group_session_participants')
        .insert([{
          group_session_id: session.id,
          student_id: selectedStudent,
        }]);

      if (error) throw error;

      // Update participant count
      await supabase
        .from('group_sessions')
        .update({ current_participants: session.current_participants + 1 })
        .eq('id', session.id);

      await fetchParticipants();
      await onUpdate();
      setShowAddStudent(false);
      setSelectedStudent('');
    } catch (error) {
      console.error('Error adding student:', error);
      alert('Failed to add student');
    }
  }

  const openSpots = session.max_participants - (participants.length || 0);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 max-w-md w-full">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold text-white">
            Participants ({participants.length}/{session.max_participants})
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <p className="text-slate-400">Loading...</p>
        ) : (
          <>
            {/* Current Students */}
            <div className="mb-6">
              <h4 className="text-sm font-medium text-slate-300 mb-3">Current Students:</h4>
              {participants.length === 0 ? (
                <p className="text-slate-400 text-sm">No students enrolled yet</p>
              ) : (
                <div className="space-y-2">
                  {participants.map((participant, index) => (
                    <div key={participant.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-700 rounded-lg p-3">
                      <div className="flex items-center space-x-3">
                        <span className="text-slate-400 text-sm">{index + 1}.</span>
                        <div>
                          <p className="text-white text-sm">{(participant.student as any)?.full_name}</p>
                          <p className="text-slate-400 text-xs">{(participant.student as any)?.email}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveParticipant(participant.id)}
                        className="px-3 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded text-xs transition"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Open Spots */}
            <div className="mb-6 p-3 bg-cyan-500/10 border border-cyan-500/20 rounded-lg">
              <p className="text-cyan-400 text-sm">
                Open Spots: <span className="font-bold">{openSpots}</span>
              </p>
            </div>

            {/* Add Student */}
            {!showAddStudent ? (
              <button
                onClick={() => setShowAddStudent(true)}
                disabled={openSpots === 0}
                className="w-full px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center justify-center space-x-2 mb-3"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            ) : (
              <div className="mb-3">
                <select
                  value={selectedStudent}
                  onChange={(e) => setSelectedStudent(e.target.value)}
                  className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500 mb-2"
                >
                  <option value="">Select Student</option>
                  {students.filter(s => !participants.find(p => p.student_id === s.id)).map((student) => (
                    <option key={student.id} value={student.id}>
                      {student.full_name} ({student.email})
                    </option>
                  ))}
                </select>
                <div className="flex space-x-2">
                  <button
                    onClick={() => {
                      setShowAddStudent(false);
                      setSelectedStudent('');
                    }}
                    className="flex-1 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddStudent}
                    disabled={!selectedStudent}
                    className="flex-1 px-4 py-2 bg-cyan-500 hover:bg-cyan-600 disabled:opacity-50 text-white rounded-lg transition"
                  >
                    Add
                  </button>
                </div>
              </div>
            )}

            {/* Additional Actions */}
            <div className="space-y-2">
              <button className="w-full px-4 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-400 rounded-lg transition flex items-center justify-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Send Group Email</span>
              </button>
              <button
                onClick={onClose}
                className="w-full px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition"
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
