import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { DollarSign, Clock, CheckCircle, TrendingUp, AlertCircle, Settings, ArrowLeft } from 'lucide-react';

interface EarningsSummary {
  pending_amount: number;
  held_amount: number;
  cleared_amount: number;
  paid_amount: number;
  total_lifetime_earnings: number;
  lessons_pending: number;
  lessons_held: number;
  lessons_cleared: number;
  lessons_paid: number;
}

interface TeacherEarning {
  id: string;
  lesson_id: string;
  amount_earned: number;
  platform_fee: number;
  total_lesson_cost: number;
  status: string;
  lesson_completed_at: string | null;
  cleared_at: string | null;
  paid_at: string | null;
  created_at: string;
  lesson: {
    scheduled_time: string;
    duration_minutes: number;
    learner?: {
      child_name: string;
    };
    profiles?: {
      full_name: string;
    };
  };
}

interface TeacherPayout {
  id: string;
  total_amount: number;
  currency: string;
  earnings_count: number;
  payout_method: string;
  status: string;
  completed_at: string | null;
  created_at: string;
}

export default function TeacherEarnings() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<EarningsSummary | null>(null);
  const [earnings, setEarnings] = useState<TeacherEarning[]>([]);
  const [payouts, setPayouts] = useState<TeacherPayout[]>([]);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'lessons' | 'payouts'>('lessons');

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);

      // Get teacher profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/login');
        return;
      }

      const { data: teacherProfile } = await supabase
        .from('teacher_profiles')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!teacherProfile) {
        console.error('No teacher profile found');
        return;
      }

      setTeacherId(teacherProfile.id);

      // Get earnings summary using RPC
      const { data: summaryData, error: summaryError } = await supabase
        .rpc('get_teacher_earnings_summary', { p_teacher_id: teacherProfile.id });

      if (summaryError) throw summaryError;

      if (summaryData && summaryData.length > 0) {
        setSummary(summaryData[0]);
      }

      // Get recent earnings with lesson details
      const { data: earningsData, error: earningsError } = await supabase
        .from('teacher_earnings')
        .select(`
          *,
          lesson:lessons!inner(
            scheduled_time,
            duration_minutes,
            learner:learners(child_name),
            profiles!lessons_student_id_fkey(full_name)
          )
        `)
        .eq('teacher_id', teacherProfile.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (earningsError) throw earningsError;
      setEarnings(earningsData || []);

      // Get payout history
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('teacher_payouts')
        .select('*')
        .eq('teacher_id', teacherProfile.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (payoutsError) throw payoutsError;
      setPayouts(payoutsData || []);

    } catch (error) {
      console.error('Error loading earnings:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'GBP',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-slate-700 text-slate-300',
      held: 'bg-amber-500/20 text-amber-400 border border-amber-500/50',
      cleared: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50',
      paid: 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/50',
      refunded: 'bg-red-500/20 text-red-400 border border-red-500/50',
      processing: 'bg-blue-500/20 text-blue-400 border border-blue-500/50',
      completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50',
      failed: 'bg-red-500/20 text-red-400 border border-red-500/50',
    };
    return colors[status] || 'bg-slate-700 text-slate-300';
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      held: 'On Hold',
      cleared: 'Ready',
      paid: 'Paid',
      refunded: 'Refunded',
      processing: 'Processing',
      completed: 'Completed',
      failed: 'Failed',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-cyan-500 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading earnings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/teacher/hub')}
          className="flex items-center space-x-2 text-cyan-400 hover:text-cyan-300 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Teacher Account</span>
        </button>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white">My Earnings</h1>
            <p className="text-slate-400 mt-1">Track your lesson earnings and payouts</p>
          </div>
          <button
            onClick={() => navigate('/teacher/payment-settings')}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg hover:bg-slate-700 transition-colors text-white"
          >
            <Settings className="w-5 h-5" />
            Payment Settings
          </button>
        </div>

        {/* Earnings Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pending */}
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-slate-700 rounded-lg">
                  <Clock className="w-6 h-6 text-slate-400" />
                </div>
                <span className="text-sm font-medium text-slate-400">
                  {summary.lessons_pending} lessons
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Pending</h3>
              <p className="text-2xl font-bold text-white">
                {formatCurrency(summary.pending_amount)}
              </p>
              <p className="text-xs text-slate-500 mt-2">Not yet completed</p>
            </div>

            {/* On Hold */}
            <div className="bg-slate-800 rounded-xl shadow-lg border border-amber-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-amber-400" />
                </div>
                <span className="text-sm font-medium text-slate-400">
                  {summary.lessons_held} lessons
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">On Hold</h3>
              <p className="text-2xl font-bold text-amber-400">
                {formatCurrency(summary.held_amount)}
              </p>
              <p className="text-xs text-slate-500 mt-2">7-day hold period</p>
            </div>

            {/* Ready for Payout */}
            <div className="bg-gradient-to-br from-cyan-500/20 to-emerald-500/20 rounded-xl shadow-lg border border-cyan-500/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-cyan-500/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-cyan-400" />
                </div>
                <span className="text-sm font-medium text-cyan-400">
                  {summary.lessons_cleared} lessons
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-300 mb-1">Ready for Payout</h3>
              <p className="text-2xl font-bold text-cyan-300">
                {formatCurrency(summary.cleared_amount)}
              </p>
              <p className="text-xs text-slate-400 mt-2">Available now</p>
            </div>

            {/* Lifetime Earnings */}
            <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-emerald-400" />
                </div>
                <span className="text-sm font-medium text-slate-400">
                  {summary.lessons_paid} lessons
                </span>
              </div>
              <h3 className="text-sm font-medium text-slate-400 mb-1">Total Paid Out</h3>
              <p className="text-2xl font-bold text-emerald-400">
                {formatCurrency(summary.paid_amount)}
              </p>
              <p className="text-xs text-slate-500 mt-2">All time</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-slate-800 rounded-xl shadow-lg border border-slate-700 overflow-hidden">
          <div className="border-b border-slate-700">
            <div className="flex">
              <button
                onClick={() => setActiveTab('lessons')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'lessons'
                    ? 'text-cyan-400 border-b-2 border-cyan-500'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Lesson Earnings ({earnings.length})
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'payouts'
                    ? 'text-cyan-400 border-b-2 border-cyan-500'
                    : 'text-slate-400 hover:text-slate-300'
                }`}
              >
                Payout History ({payouts.length})
              </button>
            </div>
          </div>

          {/* Lessons Tab */}
          {activeTab === 'lessons' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Your Earnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Available
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {earnings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No earnings yet</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Complete some lessons to start earning!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    earnings.map((earning) => (
                      <tr key={earning.id} className="hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {formatDateTime(earning.lesson.scheduled_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {earning.lesson.learner?.child_name ||
                           earning.lesson.profiles?.full_name ||
                           'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {earning.lesson.duration_minutes} mins
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-400">
                          {formatCurrency(earning.amount_earned)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(earning.status)}`}>
                            {getStatusBadge(earning.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {earning.status === 'held' && earning.cleared_at
                            ? formatDate(earning.cleared_at)
                            : earning.status === 'cleared'
                            ? 'Now'
                            : earning.status === 'paid' && earning.paid_at
                            ? formatDate(earning.paid_at)
                            : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Payouts Tab */}
          {activeTab === 'payouts' && (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Lessons
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-slate-800 divide-y divide-slate-700">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <DollarSign className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-400">No payouts yet</p>
                        <p className="text-sm text-slate-500 mt-1">
                          Your first payout will appear here once processed
                        </p>
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-slate-700/50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-300">
                          {formatDate(payout.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-cyan-400">
                          {formatCurrency(payout.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {payout.earnings_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400 capitalize">
                          {payout.payout_method.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payout.status)}`}>
                            {getStatusBadge(payout.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {payout.completed_at ? formatDate(payout.completed_at) : '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info Banner */}
        <div className="mt-8 bg-slate-800 border border-cyan-500/30 rounded-lg p-6">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-cyan-400 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-white mb-2">How earnings work</h3>
              <ul className="text-sm text-slate-300 space-y-1">
                <li>• Earnings are created when a lesson is marked as complete</li>
                <li>• Funds are held for 7 days to allow for disputes or refunds</li>
                <li>• After the hold period, funds become available for payout</li>
                <li>• Payouts are processed when your balance reaches the minimum threshold (default £50)</li>
                <li>• Update your payment settings to configure payout preferences</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
