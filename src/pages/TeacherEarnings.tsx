import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { PoundSterling, Clock, CheckCircle, TrendingUp, AlertCircle, Settings, ArrowLeft, Send, Loader2 } from 'lucide-react';

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
      name: string;
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
  const [requestingPayout, setRequestingPayout] = useState(false);
  const [payoutMessage, setPayoutMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [isTeacher, setIsTeacher] = useState(true);

  useEffect(() => {
    loadEarningsData();
  }, []);

  const loadEarningsData = async () => {
    try {
      setLoading(true);

      // Get teacher profile
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/', { state: { showSignIn: true } });
        return;
      }

      const { data: teacherProfile, error: profileError } = await supabase
        .from('teacher_profiles')
        .select('id, status, teacher_type, payment_collection')
        .eq('user_id', user.id)
        .single();

      // Independent teachers with external payment should not see this page
      if (teacherProfile?.teacher_type === 'independent' && teacherProfile?.payment_collection === 'external') {
        navigate('/teacher/hub');
        return;
      }

      if (profileError || !teacherProfile) {
        setIsTeacher(false);
        setLoading(false);
        return;
      }

      // Only approved teachers can access this page
      if (teacherProfile.status !== 'approved') {
        navigate('/teacher/pending-approval');
        return;
      }

      setTeacherId(teacherProfile.id);

      // Get earnings summary using RPC (may not exist)
      try {
        const { data: summaryData, error: summaryError } = await supabase
          .rpc('get_teacher_earnings_summary', { p_teacher_id: teacherProfile.id });

        if (!summaryError && summaryData && summaryData.length > 0) {
          setSummary(summaryData[0]);
        } else {
          // Set default summary if RPC doesn't exist
          setSummary({
            pending_amount: 0,
            held_amount: 0,
            cleared_amount: 0,
            paid_amount: 0,
            total_lifetime_earnings: 0,
            lessons_pending: 0,
            lessons_held: 0,
            lessons_cleared: 0,
            lessons_paid: 0,
          });
        }
      } catch (rpcError) {
        setSummary({
          pending_amount: 0,
          held_amount: 0,
          cleared_amount: 0,
          paid_amount: 0,
          total_lifetime_earnings: 0,
          lessons_pending: 0,
          lessons_held: 0,
          lessons_cleared: 0,
          lessons_paid: 0,
        });
      }

      // Get recent earnings with lesson details
      try {
        const { data: earningsData, error: earningsError } = await supabase
          .from('teacher_earnings')
          .select(`
            *,
            lesson:lessons(
              scheduled_time,
              duration_minutes,
              learner:learners(name)
            )
          `)
          .eq('teacher_id', teacherProfile.id)
          .order('created_at', { ascending: false })
          .limit(50);

        if (!earningsError) {
          setEarnings(earningsData || []);
        } else {
          setEarnings([]);
        }
      } catch {
        setEarnings([]);
      }

      // Get payout history
      try {
        const { data: payoutsData, error: payoutsError } = await supabase
          .from('teacher_payouts')
          .select('*')
          .eq('teacher_id', teacherProfile.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!payoutsError) {
          setPayouts(payoutsData || []);
          // Check if there's a pending payout request
          const pendingPayout = payoutsData?.find(p => p.status === 'requested' || p.status === 'processing');
          setHasPendingRequest(!!pendingPayout);
        } else {
          setPayouts([]);
        }
      } catch {
        setPayouts([]);
      }

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

  const requestPayout = async () => {
    if (!teacherId || !summary || summary.cleared_amount <= 0) return;

    setRequestingPayout(true);
    setPayoutMessage(null);

    try {
      // Get cleared earnings that haven't been assigned to a payout yet
      const { data: clearedEarnings, error: fetchError } = await supabase
        .from('teacher_earnings')
        .select('id, amount_earned')
        .eq('teacher_id', teacherId)
        .eq('status', 'cleared');

      if (fetchError) throw fetchError;

      if (!clearedEarnings || clearedEarnings.length === 0) {
        throw new Error('No cleared earnings available for payout');
      }

      const totalAmount = clearedEarnings.reduce((sum, e) => sum + e.amount_earned, 0);
      const earningIds = clearedEarnings.map(e => e.id);

      // Create the payout request
      const { data: payout, error: payoutError } = await supabase
        .from('teacher_payouts')
        .insert({
          teacher_id: teacherId,
          total_amount: totalAmount,
          currency: 'GBP',
          earnings_count: clearedEarnings.length,
          payout_method: 'bank_transfer',
          status: 'requested',
          notes: `Teacher requested payout of ${clearedEarnings.length} lessons totaling £${totalAmount.toFixed(2)}`
        })
        .select()
        .single();

      if (payoutError) throw payoutError;

      // Update earnings to reference this payout and mark as processing
      const { error: updateError } = await supabase
        .from('teacher_earnings')
        .update({
          payout_id: payout.id,
          status: 'processing'
        })
        .in('id', earningIds);

      if (updateError) {
        console.error('Error updating earnings:', updateError);
        // Don't throw - the payout request was created
      }

      setPayoutMessage({
        type: 'success',
        text: `Payout request submitted for ${formatCurrency(totalAmount)}! Our team will process it within 2-3 business days.`
      });

      setHasPendingRequest(true);

      // Reload data to show updated status
      await loadEarningsData();

    } catch (error: any) {
      console.error('Error requesting payout:', error);
      setPayoutMessage({
        type: 'error',
        text: error.message || 'Failed to submit payout request. Please try again.'
      });
    } finally {
      setRequestingPayout(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: 'bg-gray-200 text-gray-600',
      held: 'bg-amber-100 text-amber-700 border border-amber-300',
      cleared: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
      paid: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
      refunded: 'bg-red-100 text-red-700 border border-red-300',
      processing: 'bg-blue-100 text-blue-700 border border-blue-300',
      requested: 'bg-purple-100 text-purple-700 border border-purple-300',
      completed: 'bg-emerald-100 text-emerald-700 border border-emerald-300',
      failed: 'bg-red-100 text-red-700 border border-red-300',
    };
    return colors[status] || 'bg-gray-200 text-gray-600';
  };

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      pending: 'Pending',
      held: 'On Hold',
      cleared: 'Ready',
      paid: 'Paid',
      refunded: 'Refunded',
      processing: 'Processing',
      requested: 'Requested',
      completed: 'Completed',
      failed: 'Failed',
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading earnings...</p>
        </div>
      </div>
    );
  }

  if (!isTeacher) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-amber-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Teacher Access Required</h2>
          <p className="text-gray-500 mb-6">
            You need to be registered as a teacher to view earnings. If you believe this is an error, please contact support.
          </p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/teacher/hub')}
          className="flex items-center space-x-2 text-emerald-600 hover:text-emerald-800 transition mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span>Back to Teacher Account</span>
        </button>

        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Earnings</h1>
            <p className="text-gray-500 mt-1">Track your lesson earnings and payouts</p>
          </div>
          <button
            onClick={() => navigate('/teacher/payment-settings')}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 border border-gray-200 rounded-lg hover:bg-gray-200 transition-colors text-gray-700"
          >
            <Settings className="w-5 h-5" />
            Payment Settings
          </button>
        </div>

        {/* Payout Message Banner */}
        {payoutMessage && (
          <div className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
            payoutMessage.type === 'success'
              ? 'bg-emerald-500/20 border border-emerald-500/50'
              : 'bg-red-500/20 border border-red-500/50'
          }`}>
            {payoutMessage.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            )}
            <div className="flex-1">
              <p className={payoutMessage.type === 'success' ? 'text-emerald-700' : 'text-red-700'}>
                {payoutMessage.text}
              </p>
            </div>
            <button
              onClick={() => setPayoutMessage(null)}
              className="text-gray-500 hover:text-gray-900"
            >
              &times;
            </button>
          </div>
        )}

        {/* Earnings Summary Cards */}
        {summary && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Pending */}
            <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-gray-200 rounded-lg">
                  <Clock className="w-6 h-6 text-gray-500" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  {summary.lessons_pending} lessons
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Pending</h3>
              <p className="text-2xl font-bold text-gray-900">
                {formatCurrency(summary.pending_amount)}
              </p>
              <p className="text-xs text-gray-500 mt-2">Not yet completed</p>
            </div>

            {/* On Hold */}
            <div className="bg-gray-100 rounded-xl shadow-lg border border-amber-700/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-amber-500/20 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  {summary.lessons_held} lessons
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">On Hold</h3>
              <p className="text-2xl font-bold text-amber-600">
                {formatCurrency(summary.held_amount)}
              </p>
              <p className="text-xs text-gray-500 mt-2">7-day hold period</p>
            </div>

            {/* Ready for Payout */}
            <div className="bg-gradient-to-br from-emerald-500/20 to-emerald-500/20 rounded-xl shadow-lg border border-emerald-500/50 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-500/30 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-emerald-600">
                  {summary.lessons_cleared} lessons
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-600 mb-1">Ready for Payout</h3>
              <p className="text-2xl font-bold text-emerald-700">
                {formatCurrency(summary.cleared_amount)}
              </p>
              {summary.cleared_amount > 0 && !hasPendingRequest ? (
                <button
                  onClick={requestPayout}
                  disabled={requestingPayout}
                  className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-medium rounded-lg transition-colors"
                >
                  {requestingPayout ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Requesting...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Request Payout
                    </>
                  )}
                </button>
              ) : hasPendingRequest ? (
                <p className="text-xs text-purple-600 mt-2">Payout request pending</p>
              ) : (
                <p className="text-xs text-gray-500 mt-2">Available now</p>
              )}
            </div>

            {/* Lifetime Earnings */}
            <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="p-2 bg-emerald-500/20 rounded-lg">
                  <TrendingUp className="w-6 h-6 text-emerald-600" />
                </div>
                <span className="text-sm font-medium text-gray-500">
                  {summary.lessons_paid} lessons
                </span>
              </div>
              <h3 className="text-sm font-medium text-gray-500 mb-1">Total Paid Out</h3>
              <p className="text-2xl font-bold text-emerald-600">
                {formatCurrency(summary.paid_amount)}
              </p>
              <p className="text-xs text-gray-500 mt-2">All time</p>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-gray-100 rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="border-b border-gray-200">
            <div className="flex">
              <button
                onClick={() => setActiveTab('lessons')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'lessons'
                    ? 'text-emerald-600 border-b-2 border-emerald-500'
                    : 'text-gray-500 hover:text-gray-600'
                }`}
              >
                Lesson Earnings ({earnings.length})
              </button>
              <button
                onClick={() => setActiveTab('payouts')}
                className={`flex-1 px-6 py-4 text-sm font-medium transition-colors ${
                  activeTab === 'payouts'
                    ? 'text-emerald-600 border-b-2 border-emerald-500'
                    : 'text-gray-500 hover:text-gray-600'
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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Student
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Duration
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Your Earnings
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Available
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-100 divide-y divide-gray-700">
                  {earnings.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <PoundSterling className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">No earnings yet</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Complete some lessons to start earning!
                        </p>
                      </td>
                    </tr>
                  ) : (
                    earnings.map((earning) => (
                      <tr key={earning.id} className="hover:bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDateTime(earning.lesson.scheduled_time)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {earning.lesson.learner?.name || 'Unknown'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {earning.lesson.duration_minutes} mins
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                          {formatCurrency(earning.amount_earned)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(earning.status)}`}>
                            {getStatusBadge(earning.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Lessons
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Method
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Completed
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-gray-100 divide-y divide-gray-700">
                  {payouts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center">
                        <PoundSterling className="w-12 h-12 text-gray-600 mx-auto mb-4" />
                        <p className="text-gray-500">No payouts yet</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Your first payout will appear here once processed
                        </p>
                      </td>
                    </tr>
                  ) : (
                    payouts.map((payout) => (
                      <tr key={payout.id} className="hover:bg-gray-100">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {formatDate(payout.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                          {formatCurrency(payout.total_amount)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {payout.earnings_count}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                          {payout.payout_method.replace('_', ' ')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payout.status)}`}>
                            {getStatusBadge(payout.status)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
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
        <div className="mt-8 bg-gray-100 border border-emerald-500/30 rounded-lg p-6">
          <div className="flex gap-4">
            <AlertCircle className="w-6 h-6 text-emerald-600 flex-shrink-0" />
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">How earnings work</h3>
              <ul className="text-sm text-gray-600 space-y-1">
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
