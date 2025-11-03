import { useEffect, useState } from 'react';
import { Check, X, Loader2, Mail, Calendar, User, Clock, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface TeacherApplication {
  id: string;
  user_id: string;
  bio: string;
  hourly_rate: number;
  status: string;
  full_name: string;
  email: string;
  created_at: string;
}

export default function TeacherManagement() {
  const [pendingApplications, setPendingApplications] = useState<TeacherApplication[]>([]);
  const [approvedTeachers, setApprovedTeachers] = useState<TeacherApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'all'>('pending');

  useEffect(() => {
    fetchTeachers();
  }, []);

  async function fetchTeachers() {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          bio,
          hourly_rate,
          status,
          profiles!teacher_profiles_user_id_fkey (
            full_name
          )
        `)
        .order('id', { ascending: false });

      if (error) {
        console.error('Fetch error:', error);
        throw error;
      }

      console.log('Raw data:', data);

      const formattedData = data?.map(teacher => ({
        id: teacher.id,
        user_id: teacher.user_id,
        bio: teacher.bio,
        hourly_rate: teacher.hourly_rate,
        status: teacher.status,
        created_at: new Date().toISOString(),
        full_name: (teacher.profiles as any)?.full_name || 'Unknown',
        email: 'N/A',
      })) || [];

      console.log('Formatted data:', formattedData);

      setPendingApplications(formattedData.filter(t => t.status === 'pending_approval'));
      setApprovedTeachers(formattedData.filter(t => t.status === 'approved'));
    } catch (error) {
      console.error('Error fetching teachers:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(teacherId: string) {
    setProcessingId(teacherId);
    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ status: 'approved' })
        .eq('id', teacherId);

      if (error) throw error;

      await fetchTeachers();
      alert('Teacher approved successfully!');
    } catch (error) {
      console.error('Error approving teacher:', error);
      alert('Failed to approve teacher. Please try again.');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(teacherId: string) {
    setProcessingId(teacherId);
    try {
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ status: 'rejected' })
        .eq('id', teacherId);

      if (error) throw error;

      await fetchTeachers();
      alert('Teacher application rejected.');
    } catch (error) {
      console.error('Error rejecting teacher:', error);
      alert('Failed to reject teacher. Please try again.');
    } finally {
      setProcessingId(null);
    }
  }

  const TeacherCard = ({ teacher }: { teacher: TeacherApplication }) => (
    <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center">
            <User className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white">{teacher.full_name}</h3>
            <div className="flex items-center space-x-2 mt-1">
              <Mail className="w-4 h-4 text-slate-400" />
              <span className="text-sm text-slate-400">{teacher.email}</span>
            </div>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
          teacher.status === 'pending_approval' ? 'bg-amber-500/20 text-amber-400' :
          teacher.status === 'approved' ? 'bg-green-500/20 text-green-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {teacher.status === 'pending_approval' ? 'Pending' : teacher.status.charAt(0).toUpperCase() + teacher.status.slice(1)}
        </div>
      </div>

      <div className="space-y-2 mb-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-400">Hourly Rate:</span>
          <span className="text-white font-semibold">${teacher.hourly_rate}/hr</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <Calendar className="w-4 h-4 text-slate-400" />
          <span className="text-slate-400">Applied:</span>
          <span className="text-white">{new Date(teacher.created_at).toLocaleDateString()}</span>
        </div>
      </div>

      {teacher.bio && (
        <div className="mb-4">
          <p className="text-sm text-slate-400 mb-1">Bio:</p>
          <p className="text-sm text-slate-300">{teacher.bio.substring(0, 150)}...</p>
        </div>
      )}

      {teacher.status === 'pending_approval' && (
        <div className="flex space-x-3 mt-4 pt-4 border-t border-slate-700">
          <button
            onClick={() => handleApprove(teacher.id)}
            disabled={processingId === teacher.id}
            className="flex-1 px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 rounded-lg font-medium transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {processingId === teacher.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4" />
                <span>Approve</span>
              </>
            )}
          </button>
          <button
            onClick={() => handleReject(teacher.id)}
            disabled={processingId === teacher.id}
            className="flex-1 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-400 rounded-lg font-medium transition flex items-center justify-center space-x-2 disabled:opacity-50"
          >
            {processingId === teacher.id ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4" />
                <span>Reject</span>
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );

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
        <h2 className="text-2xl font-bold text-white mb-2">Teacher Management</h2>
        <p className="text-slate-400">Review and manage teacher applications</p>
      </div>

      <div className="flex space-x-4 mb-6">
        <button
          onClick={() => setActiveTab('pending')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'pending'
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
              : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <Clock className="w-4 h-4" />
            <span>Pending ({pendingApplications.length})</span>
          </div>
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            activeTab === 'approved'
              ? 'bg-green-500/20 text-green-400 border border-green-500/30'
              : 'bg-slate-800/50 text-slate-400 hover:text-white'
          }`}
        >
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4" />
            <span>Approved ({approvedTeachers.length})</span>
          </div>
        </button>
      </div>

      {activeTab === 'pending' && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Pending Teacher Applications</h3>
          {pendingApplications.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
              <Clock className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No pending applications at this time</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {pendingApplications.map(teacher => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'approved' && (
        <div>
          <h3 className="text-xl font-semibold text-white mb-4">Approved Teachers</h3>
          {approvedTeachers.length === 0 ? (
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-12 text-center">
              <CheckCircle className="w-12 h-12 text-slate-600 mx-auto mb-4" />
              <p className="text-slate-400">No approved teachers yet</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {approvedTeachers.map(teacher => (
                <TeacherCard key={teacher.id} teacher={teacher} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
