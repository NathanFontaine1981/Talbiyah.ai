import { useEffect, useState } from 'react';
import { Shield, Check, X, Loader2, User, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useNavigate } from 'react-router-dom';

interface TeacherProfile {
  id: string;
  user_id: string;
  bio: string;
  hourly_rate: number;
  status: string;
  full_name: string;
  email: string;
  created_at: string;
}

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  async function fetchPendingApplications() {
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
          created_at,
          profiles!inner(
            full_name,
            email
          )
        `)
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const formattedData = (data || []).map((item: any) => ({
        id: item.id,
        user_id: item.user_id,
        bio: item.bio,
        hourly_rate: item.hourly_rate,
        status: item.status,
        created_at: item.created_at,
        full_name: item.profiles?.full_name || 'Unknown',
        email: item.profiles?.email || 'N/A'
      }));

      setApplications(formattedData);
    } catch (error) {
      console.error('Error fetching applications:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      setProcessingId(id);
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ status: 'approved' })
        .eq('id', id);

      if (error) throw error;

      setApplications(applications.filter(app => app.id !== id));
    } catch (error) {
      console.error('Error approving application:', error);
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    try {
      setProcessingId(id);
      const { error } = await supabase
        .from('teacher_profiles')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (error) throw error;

      setApplications(applications.filter(app => app.id !== id));
    } catch (error) {
      console.error('Error rejecting application:', error);
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <header className="bg-slate-900/80 backdrop-blur-md border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-slate-400 hover:text-white transition"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Home</span>
            </button>

            <h1 className="text-xl font-bold text-white flex items-center space-x-2">
              <Shield className="w-6 h-6 text-emerald-400" />
              <span>Admin Dashboard</span>
            </h1>

            <div className="w-32"></div>
          </div>
        </div>
      </header>

      <div className="max-w-[1800px] mx-auto px-6 lg:px-8 py-8">
        <div className="bg-gradient-to-br from-slate-800/90 to-slate-900/90 rounded-2xl border border-slate-700/50 backdrop-blur-sm shadow-xl overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-700/50">
            <h2 className="text-2xl font-bold text-white">Pending Teacher Applications</h2>
            <p className="text-sm text-slate-400 mt-1">
              {applications.length} {applications.length === 1 ? 'application' : 'applications'} awaiting review
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
            </div>
          ) : applications.length === 0 ? (
            <div className="text-center py-12 text-slate-400">
              <Shield className="w-16 h-16 mx-auto mb-4 text-slate-600" />
              <p className="text-lg font-medium">No pending applications</p>
              <p className="text-sm mt-2">All teacher applications have been reviewed</p>
            </div>
          ) : (
            <div className="p-6 space-y-4">
              {applications.map((app) => (
                <div key={app.id} className="bg-slate-800/50 rounded-xl p-6 border border-slate-700/50 hover:border-slate-600 transition">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4 mb-3">
                        <div className="w-12 h-12 bg-slate-700 rounded-full flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-white">{app.full_name}</h3>
                          <p className="text-sm text-slate-400">{app.email}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Bio</p>
                          <p className="text-sm text-slate-300">{app.bio || 'No bio provided'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">Hourly Rate</p>
                          <p className="text-lg font-bold text-cyan-400">£{app.hourly_rate.toFixed(2)}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-4">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {app.status}
                        </span>
                        <span className="text-xs text-slate-500">
                          Applied: {new Date(app.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col space-y-2 ml-6">
                      <button
                        onClick={() => handleApprove(app.id)}
                        disabled={processingId === app.id}
                        className="inline-flex items-center px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {processingId === app.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Approve
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => handleReject(app.id)}
                        disabled={processingId === app.id}
                        className="inline-flex items-center px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                      >
                        {processingId === app.id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <>
                            <X className="w-4 h-4 mr-2" />
                            Reject
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
