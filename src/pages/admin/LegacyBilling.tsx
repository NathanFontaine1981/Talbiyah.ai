import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { RefreshCw, Calendar, Users, Clock, PoundSterling, Download, ChevronDown, Mail, CheckCircle2, FileText, Search } from 'lucide-react';

interface BillingSummary {
  learner_id: string;
  student_name: string;
  student_email: string;
  billing_month: string;
  lesson_count: number;
  total_minutes: number;
  amount_owed: number;
  teacher_ids: string[];
}

interface LessonDetail {
  id: string;
  scheduled_time: string;
  duration_minutes: number;
  teacher_name: string;
  subject_name: string;
  amount: number;
}

export default function LegacyBilling() {
  const [loading, setLoading] = useState(true);
  const [billingSummary, setBillingSummary] = useState<BillingSummary[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedStudent, setExpandedStudent] = useState<string | null>(null);
  const [lessonDetails, setLessonDetails] = useState<Record<string, LessonDetail[]>>({});

  useEffect(() => {
    fetchBillingSummary();
  }, [selectedMonth]);

  async function fetchBillingSummary() {
    setLoading(true);
    try {
      // Parse selected month
      const [year, month] = selectedMonth.split('-').map(Number);
      const startOfMonth = new Date(year, month - 1, 1);
      const endOfMonth = new Date(year, month, 0, 23, 59, 59);

      // Fetch lessons with tier='standard' and status='completed' for the selected month
      const { data, error } = await supabase
        .from('lessons')
        .select(`
          id,
          learner_id,
          teacher_id,
          scheduled_time,
          duration_minutes,
          lesson_tier,
          status,
          learners!inner(
            name,
            parent_id,
            profiles:parent_id(
              full_name,
              email
            )
          ),
          teacher:teacher_id(
            id,
            profiles:id(full_name)
          ),
          subjects:subject_id(name)
        `)
        .eq('lesson_tier', 'standard')
        .eq('status', 'completed')
        .gte('scheduled_time', startOfMonth.toISOString())
        .lte('scheduled_time', endOfMonth.toISOString())
        .order('scheduled_time', { ascending: true });

      if (error) throw error;

      // Group by learner_id
      const grouped = new Map<string, BillingSummary>();
      const details: Record<string, LessonDetail[]> = {};

      (data || []).forEach((lesson: any) => {
        const learnerId = lesson.learner_id;
        const learnerName = lesson.learners?.name || 'Unknown Student';
        const parentProfile = lesson.learners?.profiles;
        const studentName = parentProfile?.full_name || learnerName;
        const studentEmail = parentProfile?.email || '';
        const teacherName = lesson.teacher?.profiles?.full_name || 'Unknown Teacher';
        const subjectName = lesson.subjects?.name || 'Unknown Subject';
        const amount = lesson.duration_minutes === 60 ? 12.0 : 6.0;

        // Update summary
        if (!grouped.has(learnerId)) {
          grouped.set(learnerId, {
            learner_id: learnerId,
            student_name: studentName,
            student_email: studentEmail,
            billing_month: selectedMonth,
            lesson_count: 0,
            total_minutes: 0,
            amount_owed: 0,
            teacher_ids: [],
          });
          details[learnerId] = [];
        }

        const summary = grouped.get(learnerId)!;
        summary.lesson_count += 1;
        summary.total_minutes += lesson.duration_minutes;
        summary.amount_owed += amount;
        if (!summary.teacher_ids.includes(lesson.teacher_id)) {
          summary.teacher_ids.push(lesson.teacher_id);
        }

        // Add detail
        details[learnerId].push({
          id: lesson.id,
          scheduled_time: lesson.scheduled_time,
          duration_minutes: lesson.duration_minutes,
          teacher_name: teacherName,
          subject_name: subjectName,
          amount,
        });
      });

      setBillingSummary(Array.from(grouped.values()));
      setLessonDetails(details);
    } catch (error) {
      console.error('Error fetching billing summary:', error);
      toast.error('Failed to load billing data');
    } finally {
      setLoading(false);
    }
  }

  function getMonthOptions() {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      options.push({ value, label });
    }
    return options;
  }

  function formatDate(dateStr: string) {
    return new Date(dateStr).toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function exportToCSV() {
    const headers = ['Student Name', 'Email', 'Lesson Count', 'Total Hours', 'Amount Owed'];
    const rows = filteredSummary.map(s => [
      s.student_name,
      s.student_email,
      s.lesson_count,
      (s.total_minutes / 60).toFixed(1),
      `£${s.amount_owed.toFixed(2)}`,
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `legacy-billing-${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success('CSV exported successfully');
  }

  async function sendInvoiceEmail(summary: BillingSummary) {
    if (!summary.student_email) {
      toast.error('No email address for this student');
      return;
    }

    const monthLabel = new Date(selectedMonth + '-01').toLocaleDateString('en-GB', {
      month: 'long',
      year: 'numeric',
    });

    try {
      const { error } = await supabase.functions.invoke('send-notification-email', {
        body: {
          type: 'admin_notification',
          recipient_email: summary.student_email,
          recipient_name: summary.student_name,
          data: {
            subject: `Talbiyah Lesson Invoice - ${monthLabel}`,
            message: `
Dear ${summary.student_name},

This is your lesson invoice for ${monthLabel}.

Lessons completed: ${summary.lesson_count}
Total hours: ${(summary.total_minutes / 60).toFixed(1)}
Amount due: £${summary.amount_owed.toFixed(2)}

Please arrange payment at your earliest convenience.

Best regards,
Talbiyah Team
            `.trim(),
          },
        },
      });

      if (error) throw error;
      toast.success(`Invoice sent to ${summary.student_email}`);
    } catch (error) {
      console.error('Error sending invoice:', error);
      toast.error('Failed to send invoice email');
    }
  }

  const filteredSummary = billingSummary.filter(
    s =>
      s.student_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.student_email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totals = filteredSummary.reduce(
    (acc, s) => ({
      lessons: acc.lessons + s.lesson_count,
      minutes: acc.minutes + s.total_minutes,
      amount: acc.amount + s.amount_owed,
    }),
    { lessons: 0, minutes: 0, amount: 0 }
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Legacy Billing</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Monthly invoice summary for legacy students (£12/hour)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchBillingSummary}
            disabled={loading}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={exportToCSV}
            disabled={filteredSummary.length === 0}
            className="px-4 py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 disabled:opacity-50 flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Month Selector */}
          <div className="relative flex-1 sm:max-w-xs">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 appearance-none"
            >
              {getMonthOptions().map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Students</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{filteredSummary.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <FileText className="w-5 h-5 text-emerald-500" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Lessons</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{totals.lessons}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Hours</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{(totals.minutes / 60).toFixed(1)}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500/10 rounded-lg">
              <PoundSterling className="w-5 h-5 text-amber-500" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Owed</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">£{totals.amount.toFixed(2)}</p>
        </div>
      </div>

      {/* Billing Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : filteredSummary.length === 0 ? (
          <div className="text-center py-12">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No billing data</h3>
            <p className="text-gray-500 dark:text-gray-400">
              No completed legacy lessons found for {new Date(selectedMonth + '-01').toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Lessons
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Hours
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Amount Owed
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredSummary.map((summary) => (
                  <>
                    <tr
                      key={summary.learner_id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer"
                      onClick={() => setExpandedStudent(expandedStudent === summary.learner_id ? null : summary.learner_id)}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <ChevronDown
                            className={`w-4 h-4 text-gray-400 transition-transform ${
                              expandedStudent === summary.learner_id ? 'rotate-180' : ''
                            }`}
                          />
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {summary.student_name}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              {summary.student_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">{summary.lesson_count}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-900 dark:text-white">
                          {(summary.total_minutes / 60).toFixed(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                          £{summary.amount_owed.toFixed(2)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => sendInvoiceEmail(summary)}
                            className="p-2 text-blue-500 hover:bg-blue-500/10 rounded-lg transition-colors"
                            title="Send invoice email"
                          >
                            <Mail className="w-4 h-4" />
                          </button>
                          <button
                            className="p-2 text-emerald-500 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Mark as paid"
                          >
                            <CheckCircle2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {/* Expanded Details */}
                    {expandedStudent === summary.learner_id && lessonDetails[summary.learner_id] && (
                      <tr>
                        <td colSpan={5} className="px-6 py-4 bg-gray-50 dark:bg-gray-900/30">
                          <div className="space-y-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">Lesson Details</h4>
                            <div className="grid gap-2">
                              {lessonDetails[summary.learner_id].map((lesson) => (
                                <div
                                  key={lesson.id}
                                  className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                                >
                                  <div className="flex items-center gap-4">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                                        {lesson.subject_name}
                                      </p>
                                      <p className="text-xs text-gray-500 dark:text-gray-400">
                                        {lesson.teacher_name}
                                      </p>
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <p className="text-sm text-gray-900 dark:text-white">
                                      {formatDate(lesson.scheduled_time)}
                                    </p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                      {lesson.duration_minutes} min - £{lesson.amount.toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </>
                ))}
              </tbody>
              {/* Totals Row */}
              <tfoot className="bg-gray-100 dark:bg-gray-900">
                <tr>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">TOTAL</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">{totals.lessons}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">
                      {(totals.minutes / 60).toFixed(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                      £{totals.amount.toFixed(2)}
                    </span>
                  </td>
                  <td className="px-6 py-4"></td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
