import { useEffect, useState } from 'react';
import { Search, Filter, Plus, Calendar, Video, Users, CheckCircle, Clock, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface Session {
  id: string;
  title: string;
  type: 'private' | 'group';
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled';
  scheduled_time: string;
  duration_minutes: number;
  teacher_name: string;
  student_name: string;
  created_at: string;
}

export default function SessionsManagement() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [filteredSessions, setFilteredSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'private' | 'group'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'scheduled' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [stats, setStats] = useState({ total: 0, private: 0, group: 0 });

  useEffect(() => {
    fetchSessions();
  }, []);

  useEffect(() => {
    filterSessions();
  }, [searchQuery, typeFilter, statusFilter, sessions]);

  async function fetchSessions() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          title,
          type,
          status,
          scheduled_time,
          duration_minutes,
          created_at,
          teacher_id,
          learner_id
        `)
        .order('scheduled_time', { ascending: false });

      if (error) throw error;

      const sessionsData: Session[] = [];

      for (const lesson of data || []) {
        let teacherName = 'Unknown Teacher';
        let studentName = 'Unknown Student';

        if (lesson.teacher_id) {
          const { data: teacherProfile } = await supabase
            .from('teacher_profiles')
            .select('profiles!teacher_profiles_user_id_fkey(full_name)')
            .eq('id', lesson.teacher_id)
            .maybeSingle();

          if (teacherProfile) {
            teacherName = (teacherProfile as any).profiles?.full_name || 'Unknown Teacher';
          }
        }

        if (lesson.learner_id) {
          const { data: learner } = await supabase
            .from('learners')
            .select('name')
            .eq('id', lesson.learner_id)
            .maybeSingle();

          if (learner) {
            studentName = learner.name || 'Unknown Student';
          }
        }

        sessionsData.push({
          id: lesson.id,
          title: lesson.title || 'Untitled Session',
          type: lesson.type === 'group' ? 'group' : 'private',
          status: lesson.status || 'scheduled',
          scheduled_time: lesson.scheduled_time,
          duration_minutes: lesson.duration_minutes || 60,
          teacher_name: teacherName,
          student_name: studentName,
          created_at: lesson.created_at,
        });
      }

      setSessions(sessionsData);

      const privateCount = sessionsData.filter(s => s.type === 'private').length;
      const groupCount = sessionsData.filter(s => s.type === 'group').length;

      setStats({
        total: sessionsData.length,
        private: privateCount,
        group: groupCount,
      });
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  }

  function filterSessions() {
    let filtered = sessions;

    if (searchQuery) {
      filtered = filtered.filter(session =>
        session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.teacher_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.student_name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(session => session.type === typeFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(session => session.status === statusFilter);
    }

    setFilteredSessions(filtered);
  }

  function getStatusIcon(status: string) {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4" />;
      case 'confirmed': return <CheckCircle className="w-4 h-4" />;
      case 'scheduled': return <Clock className="w-4 h-4" />;
      case 'cancelled': return <XCircle className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  }

  function getStatusColor(status: string) {
    switch (status) {
      case 'completed': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'confirmed': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'scheduled': return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Sessions Management</h2>
            <p className="text-slate-400">Manage and schedule all learning sessions</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg font-semibold transition shadow-lg shadow-cyan-500/25 flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span>Create Session</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Calendar className="w-6 h-6 text-cyan-400" />
            <p className="text-slate-400 text-sm">Total Sessions</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.total}</p>
        </div>
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Video className="w-6 h-6 text-blue-400" />
            <p className="text-slate-400 text-sm">Private Sessions</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.private}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-2">
            <Users className="w-6 h-6 text-emerald-400" />
            <p className="text-slate-400 text-sm">Group Sessions</p>
          </div>
          <p className="text-3xl font-bold text-white">{stats.group}</p>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by title, teacher, or student..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            />
          </div>
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-slate-400" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="private">Private</option>
              <option value="group">Group</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-4 py-3 bg-slate-900 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="scheduled">Scheduled</option>
              <option value="confirmed">Confirmed</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-900/50 border-b border-slate-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Session</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Teacher</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Student</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Date & Time</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-slate-400 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredSessions.map((session) => (
                <tr key={session.id} className="hover:bg-slate-800/30 transition">
                  <td className="px-6 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
                        <Video className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{session.title}</p>
                        <p className="text-slate-400 text-xs">{session.duration_minutes} minutes</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      session.type === 'group'
                        ? 'bg-emerald-500/20 text-emerald-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}>
                      {session.type === 'group' ? 'Group' : 'Private'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-300 text-sm">{session.teacher_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-slate-300 text-sm">{session.student_name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-slate-300 text-sm">
                      <p>{new Date(session.scheduled_time).toLocaleDateString()}</p>
                      <p className="text-slate-400 text-xs">{new Date(session.scheduled_time).toLocaleTimeString()}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={`inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(session.status)}`}>
                      {getStatusIcon(session.status)}
                      <span className="capitalize">{session.status}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {filteredSessions.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No sessions found</p>
          </div>
        )}
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-8 max-w-2xl w-full">
            <h3 className="text-2xl font-bold text-white mb-6">Create New Session</h3>
            <p className="text-slate-400 mb-6">Session creation form coming soon. This will allow you to manually schedule private and group sessions.</p>
            <button
              onClick={() => setShowCreateModal(false)}
              className="w-full px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold transition"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
