import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { PoundSterling, Send, CheckCircle, XCircle, AlertCircle, Filter, Search } from 'lucide-react';

interface TeacherEarningsOverview {
  teacher_profile_id: string;
  teacher_user_id: string;
  teacher_name: string;
  teacher_email: string;
  pending_earnings: number;
  held_earnings: number;
  cleared_earnings: number;
  paid_earnings: number;
  total_lifetime_earnings: number;
  pending_lessons: number;
  held_lessons: number;
  cleared_lessons: number;
  paid_lessons: number;
  preferred_payout_method: string;
  minimum_payout_amount: number;
  stripe_account_id: string | null;
  eligible_for_payout: boolean;
}

interface TeacherPayout {
  id: string;
  teacher_id: string;
  total_amount: number;
  currency: string;
  earnings_count: number;
  payout_method: string;
  status: string;
  completed_at: string | null;
  failed_at: string | null;
  failure_reason: string | null;
  created_at: string;
  teacher_profiles: {
    user_id: string;
    profiles: {
      full_name: string;
      email: string;
    };
  };
}

export default function TeacherPayouts() {
  const [loading, setLoading] = useState(true);
  const [teachers, setTeachers] = useState<TeacherEarningsOverview[]>([]);
  const [recentPayouts, setRecentPayouts] = useState<TeacherPayout[]>([]);
  const [selectedTeachers, setSelectedTeachers] = useState<Set<string>>(new Set());
  const [processingPayout, setProcessingPayout] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'eligible' | 'pending'>('eligible');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    loadPayoutsData();
  }, []);

  const loadPayoutsData = async () => {
    try {
      setLoading(true);

      // Load teacher earnings overview
      const { data: teachersData, error: teachersError } = await supabase
        .from('teacher_earnings_overview')
        .select('*')
        .order('cleared_earnings', { ascending: false });

      if (teachersError) throw teachersError;
      setTeachers(teachersData || []);

      // Load recent payouts
      const { data: payoutsData, error: payoutsError } = await supabase
        .from('teacher_payouts')
        .select(`
          *,
          teacher_profiles!inner(
            user_id,
            profiles!inner(full_name, email)
          )
        `)
        .order('created_at', { ascending: false })
        .limit(20);

      if (payoutsError) throw payoutsError;
      setRecentPayouts(payoutsData || []);

    } catch (error) {
      console.error('Error loading payouts data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processPayouts = async () => {
    if (selectedTeachers.size === 0) {
      toast.warning('Please select at least one teacher');
      return;
    }

    if (!confirm(`Process payouts for ${selectedTeachers.size} teacher(s)?`)) {
      return;
    }

    setProcessingPayout(true);

    let successCount = 0;
    let failureCount = 0;
    const errors: string[] = [];

    try {
      for (const teacherId of selectedTeachers) {
        try {
          const teacher = teachers.find(t => t.teacher_profile_id === teacherId);
          if (!teacher || teacher.cleared_earnings <= 0) continue;

          // Check if teacher has Stripe Connect enabled
          if (teacher.stripe_account_id && teacher.preferred_payout_method === 'stripe_connect') {
            // Use Stripe Connect edge function
            const { data, error } = await supabase.functions.invoke('process-stripe-payout', {
              body: { teacher_id: teacherId }
            });

            if (error) throw new Error(`Stripe payout failed: ${error.message}`);
            if (!data.success) throw new Error(data.error || 'Stripe payout failed');

            successCount++;
          } else {
            // Manual payout flow (existing logic)
            const { data: clearedEarnings, error: earningsError } = await supabase
              .from('teacher_earnings')
              .select('id, amount_earned')
              .eq('teacher_id', teacherId)
              .eq('status', 'cleared');

            if (earningsError) throw earningsError;

            if (!clearedEarnings || clearedEarnings.length === 0) continue;

            const totalAmount = clearedEarnings.reduce((sum, e) => sum + Number(e.amount_earned), 0);

            // Create payout record
            const { data: payout, error: payoutError } = await supabase
              .from('teacher_payouts')
              .insert({
                teacher_id: teacherId,
                total_amount: totalAmount,
                currency: 'gbp',
                earnings_count: clearedEarnings.length,
                payout_method: teacher.preferred_payout_method || 'manual',
                status: 'pending',
                notes: `Manual payout created by admin for ${clearedEarnings.length} lessons`,
              })
              .select()
              .single();

            if (payoutError) throw payoutError;

            // Update earnings to 'paid' status and link to payout
            const { error: updateError } = await supabase
              .from('teacher_earnings')
              .update({
                status: 'paid',
                payout_id: payout.id,
                paid_at: new Date().toISOString(),
              })
              .in('id', clearedEarnings.map(e => e.id));

            if (updateError) throw updateError;

            // Mark payout as completed (for manual payouts)
            const { error: completeError } = await supabase
              .from('teacher_payouts')
              .update({
                status: 'completed',
                completed_at: new Date().toISOString(),
              })
              .eq('id', payout.id);

            if (completeError) throw completeError;

            successCount++;
          }
        } catch (teacherError: any) {
          const teacher = teachers.find(t => t.teacher_profile_id === teacherId);
          console.error(`Error processing payout for teacher ${teacherId}:`, teacherError);
          failureCount++;
          errors.push(`${teacher?.teacher_name || 'Unknown'}: ${teacherError.message}`);
        }
      }

      // Show summary
      if (successCount > 0) {
        toast.success(`Successfully processed ${successCount} payout(s)`);
      }
      if (failureCount > 0) {
        toast.error(`${failureCount} payout(s) failed:\n${errors.join('\n')}`);
      }

      setSelectedTeachers(new Set());
      loadPayoutsData();

    } catch (error) {
      console.error('Error processing payouts:', error);
      toast.error('Error processing payouts. Check console for details.');
    } finally {
      setProcessingPayout(false);
    }
  };

  const toggleTeacherSelection = (teacherId: string) => {
    const newSelection = new Set(selectedTeachers);
    if (newSelection.has(teacherId)) {
      newSelection.delete(teacherId);
    } else {
      newSelection.add(teacherId);
    }
    setSelectedTeachers(newSelection);
  };

  const selectAllEligible = () => {
    const eligible = filteredTeachers
      .filter(t => t.eligible_for_payout && t.cleared_earnings > 0)
      .map(t => t.teacher_profile_id);
    setSelectedTeachers(new Set(eligible));
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

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      requested: 'bg-purple-500/20 text-purple-400 border border-purple-500/50',
      pending: 'bg-amber-500/20 text-amber-400 border border-amber-500/50',
      processing: 'bg-emerald-500/20 text-emerald-600 border border-emerald-500/50',
      completed: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50',
      failed: 'bg-red-500/20 text-red-400 border border-red-500/50',
    };
    return colors[status] || 'bg-gray-200 text-gray-600';
  };

  const processPayoutRequest = async (payout: TeacherPayout, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this payout request for ${formatCurrency(payout.total_amount)}?`)) {
      return;
    }

    try {
      if (action === 'approve') {
        // Mark earnings as paid
        const { data: earningsToUpdate, error: fetchError } = await supabase
          .from('teacher_earnings')
          .select('id')
          .eq('payout_id', payout.id);

        if (fetchError) throw fetchError;

        if (earningsToUpdate && earningsToUpdate.length > 0) {
          const { error: updateError } = await supabase
            .from('teacher_earnings')
            .update({
              status: 'paid',
              paid_at: new Date().toISOString(),
            })
            .in('id', earningsToUpdate.map(e => e.id));

          if (updateError) throw updateError;
        }

        // Mark payout as completed
        const { error: payoutError } = await supabase
          .from('teacher_payouts')
          .update({
            status: 'completed',
            completed_at: new Date().toISOString(),
            notes: `Approved by admin on ${new Date().toLocaleDateString()}`
          })
          .eq('id', payout.id);

        if (payoutError) throw payoutError;

        toast.success('Payout approved and marked as completed!');
      } else {
        // Reject - revert earnings back to cleared status
        const { data: earningsToRevert, error: fetchError } = await supabase
          .from('teacher_earnings')
          .select('id')
          .eq('payout_id', payout.id);

        if (fetchError) throw fetchError;

        if (earningsToRevert && earningsToRevert.length > 0) {
          const { error: updateError } = await supabase
            .from('teacher_earnings')
            .update({
              status: 'cleared',
              payout_id: null,
            })
            .in('id', earningsToRevert.map(e => e.id));

          if (updateError) throw updateError;
        }

        // Mark payout as failed
        const { error: payoutError } = await supabase
          .from('teacher_payouts')
          .update({
            status: 'failed',
            failed_at: new Date().toISOString(),
            failure_reason: 'Rejected by admin'
          })
          .eq('id', payout.id);

        if (payoutError) throw payoutError;

        toast.info('Payout request rejected. Earnings returned to cleared status.');
      }

      loadPayoutsData();
    } catch (error) {
      console.error('Error processing payout request:', error);
      toast.error('Error processing payout request. Check console for details.');
    }
  };

  const filteredTeachers = teachers.filter(teacher => {
    // Filter by status
    if (filterStatus === 'eligible' && !teacher.eligible_for_payout) return false;
    if (filterStatus === 'pending' && teacher.cleared_earnings <= 0) return false;

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      return (
        teacher.teacher_name.toLowerCase().includes(query) ||
        teacher.teacher_email.toLowerCase().includes(query)
      );
    }

    return true;
  });

  const totalSelectedAmount = Array.from(selectedTeachers).reduce((sum, teacherId) => {
    const teacher = teachers.find(t => t.teacher_profile_id === teacherId);
    return sum + (teacher?.cleared_earnings || 0);
  }, 0);

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 mx-auto"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading payouts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Teacher Payouts</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Process teacher payments and view payout history</p>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-emerald-500/30 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Ready for Payout</h3>
            </div>
            <p className="text-2xl font-bold text-emerald-300">
              {formatCurrency(teachers.reduce((sum, t) => sum + t.cleared_earnings, 0))}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              {teachers.filter(t => t.cleared_earnings > 0).length} teachers
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-amber-500/30 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-amber-500/20 rounded-lg">
                <AlertCircle className="w-5 h-5 text-amber-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">On Hold</h3>
            </div>
            <p className="text-2xl font-bold text-amber-400">
              {formatCurrency(teachers.reduce((sum, t) => sum + t.held_earnings, 0))}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">7-day hold period</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-emerald-500/30 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-emerald-500/20 rounded-lg">
                <PoundSterling className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Paid</h3>
            </div>
            <p className="text-2xl font-bold text-cyan-300">
              {formatCurrency(teachers.reduce((sum, t) => sum + t.paid_earnings, 0))}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">All time</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Send className="w-5 h-5 text-purple-400" />
              </div>
              <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400">Eligible</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">
              {teachers.filter(t => t.eligible_for_payout).length}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">Above minimum threshold</p>
          </div>
        </div>

        {/* Filters and Actions */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 mb-6">
          <div className="p-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between">
              {/* Search */}
              <div className="flex-1 max-w-md">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-600 dark:text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teachers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-white placeholder-gray-600 dark:placeholder-gray-400"
                  />
                </div>
              </div>

              {/* Filter */}
              <div className="flex items-center gap-3">
                <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value as any)}
                  className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 text-gray-900 dark:text-white"
                >
                  <option value="all">All Teachers</option>
                  <option value="eligible">Eligible for Payout</option>
                  <option value="pending">With Balance</option>
                </select>
              </div>
            </div>

            {/* Batch Actions */}
            {selectedTeachers.size > 0 && (
              <div className="mt-4 p-4 bg-emerald-500/20 border border-emerald-500/50 rounded-lg flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedTeachers.size} teacher(s) selected
                  </p>
                  <p className="text-sm text-cyan-300">
                    Total: {formatCurrency(totalSelectedAmount)}
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setSelectedTeachers(new Set())}
                    className="px-4 py-2 text-gray-600 dark:text-gray-400 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
                  >
                    Clear Selection
                  </button>
                  <button
                    onClick={processPayouts}
                    disabled={processingPayout}
                    className="px-6 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                    {processingPayout ? 'Processing...' : 'Process Payouts'}
                  </button>
                </div>
              </div>
            )}

            {selectedTeachers.size === 0 && (
              <div className="mt-4">
                <button
                  onClick={selectAllEligible}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Select all eligible teachers
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Teachers Table */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-8">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedTeachers.size === filteredTeachers.filter(t => t.eligible_for_payout).length && filteredTeachers.length > 0}
                      onChange={(e) => {
                        if (e.target.checked) {
                          selectAllEligible();
                        } else {
                          setSelectedTeachers(new Set());
                        }
                      }}
                      className="w-4 h-4 text-emerald-600 border-gray-200 dark:border-gray-700 rounded focus:ring-emerald-500 bg-gray-50 dark:bg-gray-700"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Cleared Balance
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    On Hold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Total Paid
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Lessons
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredTeachers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <PoundSterling className="w-12 h-12 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No teachers found</p>
                    </td>
                  </tr>
                ) : (
                  filteredTeachers.map((teacher) => (
                    <tr key={teacher.teacher_profile_id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedTeachers.has(teacher.teacher_profile_id)}
                          onChange={() => toggleTeacherSelection(teacher.teacher_profile_id)}
                          disabled={teacher.cleared_earnings <= 0}
                          className="w-4 h-4 text-emerald-600 border-gray-200 dark:border-gray-700 rounded focus:ring-emerald-500 disabled:opacity-50 bg-gray-50 dark:bg-gray-700"
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{teacher.teacher_name}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">{teacher.teacher_email}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`font-medium ${teacher.cleared_earnings > 0 ? 'text-emerald-400' : 'text-gray-600 dark:text-gray-400'}`}>
                          {formatCurrency(teacher.cleared_earnings)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(teacher.held_earnings)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatCurrency(teacher.paid_earnings)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {teacher.cleared_lessons} cleared
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {teacher.eligible_for_payout ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
                            <CheckCircle className="w-3 h-3 inline mr-1" />
                            Eligible
                          </span>
                        ) : teacher.cleared_earnings > 0 ? (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/50">
                            Below minimum
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            No balance
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pending Requests Alert */}
        {recentPayouts.filter(p => p.status === 'requested').length > 0 && (
          <div className="mb-6 p-4 bg-purple-500/20 border border-purple-500/50 rounded-lg flex items-center gap-3">
            <AlertCircle className="w-6 h-6 text-purple-400" />
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {recentPayouts.filter(p => p.status === 'requested').length} pending payout request(s)
              </p>
              <p className="text-sm text-purple-300">
                Teachers have requested payouts - please review and process them below.
              </p>
            </div>
          </div>
        )}

        {/* Recent Payouts */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Recent Payouts</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Teacher
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Lessons
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {recentPayouts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <Send className="w-12 h-12 text-gray-600 dark:text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 dark:text-gray-400">No payouts processed yet</p>
                    </td>
                  </tr>
                ) : (
                  recentPayouts.map((payout) => (
                    <tr key={payout.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(payout.created_at)}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {payout.teacher_profiles.profiles.full_name}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {payout.teacher_profiles.profiles.email}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-emerald-600">
                        {formatCurrency(payout.total_amount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                        {payout.earnings_count}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 capitalize">
                        {payout.payout_method.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(payout.status)}`}>
                          {payout.status === 'completed' && <CheckCircle className="w-3 h-3 inline mr-1" />}
                          {payout.status === 'failed' && <XCircle className="w-3 h-3 inline mr-1" />}
                          {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {payout.status === 'requested' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => processPayoutRequest(payout, 'approve')}
                              className="px-3 py-1 text-xs font-medium bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <CheckCircle className="w-3 h-3" />
                              Approve
                            </button>
                            <button
                              onClick={() => processPayoutRequest(payout, 'reject')}
                              className="px-3 py-1 text-xs font-medium bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors flex items-center gap-1"
                            >
                              <XCircle className="w-3 h-3" />
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-gray-600 dark:text-gray-400 text-sm">-</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
