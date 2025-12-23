import { useEffect, useState } from 'react';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';

interface TeacherProfile {
  id: string;
  bio: string;
  hourly_rate: number;
  status: string;
}

export default function Admin() {
  const [applications, setApplications] = useState<TeacherProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchPendingApplications();
  }, []);

  async function fetchPendingApplications() {
    try {
      setLoading(true);
      setError('');

      const { data, error: fetchError } = await supabase
        .from('teacher_profiles')
        .select('id, bio, hourly_rate, status')
        .eq('status', 'pending_approval')
        .order('created_at', { ascending: false });

      if (fetchError) throw fetchError;

      setApplications(data || []);
    } catch (err: any) {
      console.error('Error fetching applications:', err);
      setError(err.message || 'Failed to load applications');
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    try {
      setProcessingId(id);
      setError('');

      const { error: updateError } = await supabase
        .from('teacher_profiles')
        .update({ status: 'approved' })
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchPendingApplications();
    } catch (err: any) {
      console.error('Error approving application:', err);
      setError(err.message || 'Failed to approve application');
    } finally {
      setProcessingId(null);
    }
  }

  async function handleReject(id: string) {
    try {
      setProcessingId(id);
      setError('');

      const { error: updateError } = await supabase
        .from('teacher_profiles')
        .update({ status: 'rejected' })
        .eq('id', id);

      if (updateError) throw updateError;

      await fetchPendingApplications();
    } catch (err: any) {
      console.error('Error rejecting application:', err);
      setError(err.message || 'Failed to reject application');
    } finally {
      setProcessingId(null);
    }
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center space-x-4 mb-12">
          <div className="w-14 h-14 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Shield className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white">Admin Dashboard - Pending Teachers</h1>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="w-12 h-12 text-emerald-400 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading applications...</p>
            </div>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-gray-50 backdrop-blur rounded-2xl border border-gray-200 p-12 text-center">
            <p className="text-gray-500 text-lg">No pending applications at this time.</p>
          </div>
        ) : (
          <div className="bg-gray-50 backdrop-blur rounded-2xl border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Bio</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Hourly Rate</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Status</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-600">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-700">
                  {applications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4 text-gray-600 max-w-md">
                        <p className="line-clamp-2">{app.bio}</p>
                      </td>
                      <td className="px-6 py-4 text-gray-600">
                        ${app.hourly_rate}/hr
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-1 bg-yellow-500/10 text-yellow-400 text-xs font-medium rounded-full border border-yellow-500/30">
                          {app.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => handleApprove(app.id)}
                            disabled={processingId === app.id}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {processingId === app.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Check className="w-4 h-4" />
                            )}
                            <span>Approve</span>
                          </button>
                          <button
                            onClick={() => handleReject(app.id)}
                            disabled={processingId === app.id}
                            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                          >
                            {processingId === app.id ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <X className="w-4 h-4" />
                            )}
                            <span>Reject</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
