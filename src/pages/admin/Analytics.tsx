import { useEffect, useState } from 'react';
import { RefreshCw, Download, TrendingUp, TrendingDown, Users, BookOpen, DollarSign, Clock, Star, Calendar, AlertTriangle } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, differenceInDays } from 'date-fns';

interface Metrics {
  newUsers: { value: number; change: number };
  totalSessions: { value: number; change: number };
  revenue: { value: number; change: number };
  avgDuration: { value: number; target: number };
}

interface SubjectStats {
  name: string;
  count: number;
  percentage: number;
}

interface TeacherPerformance {
  id: string;
  name: string;
  rating: number;
  sessionCount: number;
}

interface DailyActivity {
  date: string;
  sessions: number;
  activeUsers: number;
}

type TimePeriod = '7days' | '30days' | '90days' | 'thisMonth' | 'lastMonth' | 'thisYear' | 'custom';

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7days');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // Metrics
  const [metrics, setMetrics] = useState<Metrics>({
    newUsers: { value: 0, change: 0 },
    totalSessions: { value: 0, change: 0 },
    revenue: { value: 0, change: 0 },
    avgDuration: { value: 0, target: 60 },
  });

  // Analytics data
  const [subjectStats, setSubjectStats] = useState<SubjectStats[]>([]);
  const [teacherPerformance, setTeacherPerformance] = useState({
    total: 0,
    activeThisPeriod: 0,
    avgRating: 0,
    topPerformers: [] as TeacherPerformance[],
  });
  const [dailyActivity, setDailyActivity] = useState<DailyActivity[]>([]);

  useEffect(() => {
    fetchAnalytics();
  }, [timePeriod, customDateRange]);

  function getDateRange() {
    const now = new Date();
    let start: Date;
    let end: Date = now;

    switch (timePeriod) {
      case '7days':
        start = subDays(now, 7);
        break;
      case '30days':
        start = subDays(now, 30);
        break;
      case '90days':
        start = subDays(now, 90);
        break;
      case 'thisMonth':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'lastMonth':
        const lastMonth = subDays(startOfMonth(now), 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      case 'thisYear':
        start = startOfYear(now);
        break;
      case 'custom':
        start = customDateRange.start ? new Date(customDateRange.start) : subDays(now, 7);
        end = customDateRange.end ? new Date(customDateRange.end) : now;
        break;
      default:
        start = subDays(now, 7);
    }

    return { start, end };
  }

  function getPreviousDateRange() {
    const current = getDateRange();
    const days = differenceInDays(current.end, current.start);
    const start = subDays(current.start, days);
    const end = current.start;
    return { start, end };
  }

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const { start, end } = getDateRange();
      const { start: prevStart, end: prevEnd } = getPreviousDateRange();

      // Fetch all data in parallel
      await Promise.all([
        fetchMetrics(start, end, prevStart, prevEnd),
        fetchSubjectStats(start, end),
        fetchTeacherPerformance(start, end),
        fetchDailyActivity(start, end),
      ]);

      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchMetrics(start: Date, end: Date, prevStart: Date, prevEnd: Date) {
    try {
      // New Users - Current Period
      const { count: newUsersCurrent } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // New Users - Previous Period
      const { count: newUsersPrev } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      const newUsersChange = newUsersPrev ? ((newUsersCurrent || 0) - newUsersPrev) / newUsersPrev * 100 : 0;

      // Total Sessions - Current Period
      const { count: sessionsCurrent } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      // Total Sessions - Previous Period
      const { count: sessionsPrev } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      const sessionsChange = sessionsPrev ? ((sessionsCurrent || 0) - sessionsPrev) / sessionsPrev * 100 : 0;

      // Revenue - Current Period (from credit_purchases and lessons)
      const { data: creditPurchasesCurrent } = await supabase
        .from('credit_purchases')
        .select('amount')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const revenueCurrentTotal = (creditPurchasesCurrent || []).reduce((sum, p) => sum + (p.amount / 100), 0);

      // Revenue - Previous Period
      const { data: creditPurchasesPrev } = await supabase
        .from('credit_purchases')
        .select('amount')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      const revenuePrevTotal = (creditPurchasesPrev || []).reduce((sum, p) => sum + (p.amount / 100), 0);
      const revenueChange = revenuePrevTotal ? (revenueCurrentTotal - revenuePrevTotal) / revenuePrevTotal * 100 : 0;

      // Average Duration
      const { data: durations } = await supabase
        .from('lessons')
        .select('duration_minutes')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const avgDuration = durations && durations.length > 0
        ? durations.reduce((sum, d) => sum + (d.duration_minutes || 0), 0) / durations.length
        : 0;

      setMetrics({
        newUsers: { value: newUsersCurrent || 0, change: newUsersChange },
        totalSessions: { value: sessionsCurrent || 0, change: sessionsChange },
        revenue: { value: revenueCurrentTotal, change: revenueChange },
        avgDuration: { value: Math.round(avgDuration), target: 60 },
      });
    } catch (error) {
      console.error('Error fetching metrics:', error);
    }
  }

  async function fetchSubjectStats(start: Date, end: Date) {
    try {
      const { data } = await supabase
        .from('lessons')
        .select('subject_id, subjects!inner(name)')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      if (!data) return;

      // Count by subject
      const subjectCounts: { [key: string]: number } = {};
      data.forEach((lesson: any) => {
        const subjectName = lesson.subjects?.name || 'Unknown';
        subjectCounts[subjectName] = (subjectCounts[subjectName] || 0) + 1;
      });

      const total = data.length;
      const stats: SubjectStats[] = Object.entries(subjectCounts).map(([name, count]) => ({
        name,
        count,
        percentage: total > 0 ? (count / total) * 100 : 0,
      }));

      stats.sort((a, b) => b.count - a.count);
      setSubjectStats(stats);
    } catch (error) {
      console.error('Error fetching subject stats:', error);
    }
  }

  async function fetchTeacherPerformance(start: Date, end: Date) {
    try {
      // Total approved teachers
      const { count: totalTeachers } = await supabase
        .from('teacher_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      // Teachers active in period
      const { data: activeLessons } = await supabase
        .from('lessons')
        .select('teacher_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const uniqueTeachers = new Set(activeLessons?.map(s => s.teacher_id) || []);

      // Get teacher profiles and their lessons
      const { data: teacherData } = await supabase
        .from('teacher_profiles')
        .select(`
          id,
          user_id,
          profiles!inner(full_name),
          teacher_ratings(rating)
        `)
        .eq('status', 'approved');

      // Get lesson counts per teacher
      const { data: lessonCounts } = await supabase
        .from('lessons')
        .select('teacher_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'completed');

      // Count lessons per teacher
      const teacherLessonCounts: { [key: string]: number } = {};
      lessonCounts?.forEach((lesson: any) => {
        teacherLessonCounts[lesson.teacher_id] = (teacherLessonCounts[lesson.teacher_id] || 0) + 1;
      });

      // Build top performers list
      const topPerformers: TeacherPerformance[] = (teacherData || [])
        .map((teacher: any) => {
          // Calculate average rating
          const ratings = teacher.teacher_ratings || [];
          const avgRating = ratings.length > 0
            ? ratings.reduce((sum: number, r: any) => sum + r.rating, 0) / ratings.length
            : 4.5; // Default rating

          return {
            id: teacher.id,
            name: teacher.profiles?.full_name || 'Unknown',
            rating: avgRating,
            sessionCount: teacherLessonCounts[teacher.id] || 0,
          };
        })
        .filter(t => t.sessionCount > 0) // Only teachers with sessions in period
        .sort((a, b) => {
          // Sort by session count primarily, then by rating
          if (b.sessionCount !== a.sessionCount) return b.sessionCount - a.sessionCount;
          return b.rating - a.rating;
        })
        .slice(0, 10);

      const avgRating = topPerformers.length > 0
        ? topPerformers.reduce((sum, t) => sum + t.rating, 0) / topPerformers.length
        : 0;

      setTeacherPerformance({
        total: totalTeachers || 0,
        activeThisPeriod: uniqueTeachers.size,
        avgRating: Math.round(avgRating * 10) / 10,
        topPerformers,
      });
    } catch (error) {
      console.error('Error fetching teacher performance:', error);
    }
  }

  async function fetchDailyActivity(start: Date, end: Date) {
    try {
      const { data: lessons } = await supabase
        .from('lessons')
        .select('created_at, learner_id, teacher_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at');

      if (!lessons) return;

      // Group by date
      const dailyData: { [key: string]: { sessions: number; users: Set<string> } } = {};

      lessons.forEach((lesson: any) => {
        const date = format(new Date(lesson.created_at), 'yyyy-MM-dd');
        if (!dailyData[date]) {
          dailyData[date] = { sessions: 0, users: new Set() };
        }
        dailyData[date].sessions++;
        if (lesson.learner_id) dailyData[date].users.add(lesson.learner_id);
        if (lesson.teacher_id) dailyData[date].users.add(lesson.teacher_id);
      });

      // Fill in missing dates
      const days = differenceInDays(end, start);
      const activity: DailyActivity[] = [];
      for (let i = 0; i <= days; i++) {
        const date = format(subDays(end, days - i), 'yyyy-MM-dd');
        activity.push({
          date,
          sessions: dailyData[date]?.sessions || 0,
          activeUsers: dailyData[date]?.users.size || 0,
        });
      }

      setDailyActivity(activity);
    } catch (error) {
      console.error('Error fetching daily activity:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  }

  function handleExport(format: 'csv' | 'pdf' | 'excel') {
    // Prepare export data
    const exportData = {
      period: timePeriod,
      dateRange: getDateRange(),
      metrics,
      subjectStats,
      teacherPerformance,
      dailyActivity,
      generatedAt: new Date().toISOString(),
    };

    if (format === 'csv') {
      // Simple CSV export
      const csv = generateCSV(exportData);
      downloadFile(csv, 'analytics-report.csv', 'text/csv');
    } else {
      alert(`Export as ${format.toUpperCase()} - Coming soon!`);
    }
  }

  function generateCSV(data: any) {
    let csv = 'Talbiyah Analytics Report\n\n';
    csv += `Generated: ${format(new Date(), 'MMMM d, yyyy HH:mm')}\n`;
    csv += `Period: ${timePeriod}\n\n`;

    csv += 'KEY METRICS\n';
    csv += 'Metric,Value,Change\n';
    csv += `New Users,${data.metrics.newUsers.value},${data.metrics.newUsers.change.toFixed(1)}%\n`;
    csv += `Total Sessions,${data.metrics.totalSessions.value},${data.metrics.totalSessions.change.toFixed(1)}%\n`;
    csv += `Revenue,£${data.metrics.revenue.value.toFixed(2)},${data.metrics.revenue.change.toFixed(1)}%\n`;
    csv += `Avg Duration,${data.metrics.avgDuration.value} min\n\n`;

    csv += 'SUBJECT POPULARITY\n';
    csv += 'Subject,Sessions,Percentage\n';
    data.subjectStats.forEach((s: SubjectStats) => {
      csv += `${s.name},${s.count},${s.percentage.toFixed(1)}%\n`;
    });
    csv += '\n';

    csv += 'TOP PERFORMING TEACHERS\n';
    csv += 'Rank,Name,Rating,Sessions\n';
    data.teacherPerformance.topPerformers.forEach((t: TeacherPerformance, i: number) => {
      csv += `${i + 1},${t.name},${t.rating.toFixed(1)},${t.sessionCount}\n`;
    });

    return csv;
  }

  function downloadFile(content: string, filename: string, type: string) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }

  function getTimePeriodLabel() {
    const labels = {
      '7days': 'Last 7 days',
      '30days': 'Last 30 days',
      '90days': 'Last 90 days',
      'thisMonth': 'This Month',
      'lastMonth': 'Last Month',
      'thisYear': 'This Year',
      'custom': 'Custom Range',
    };
    return labels[timePeriod];
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
          <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
          <p className="text-slate-400">
            Last updated: {format(lastUpdated, 'h:mm a')}
          </p>
        </div>
        <div className="flex items-center space-x-3">
          {/* Time Period Selector */}
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          {/* Export */}
          <div className="relative group">
            <button className="px-4 py-2 bg-cyan-500 hover:bg-cyan-600 text-white rounded-lg transition flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-40 bg-slate-800 border border-slate-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 rounded-t-lg"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left text-white hover:bg-slate-700"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left text-white hover:bg-slate-700 rounded-b-lg"
              >
                Export as Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Date Range */}
      {timePeriod === 'custom' && (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-8">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">Start Date</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-400 mb-2">End Date</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="w-full px-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Key Metrics */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard
            icon={Users}
            label="New Users"
            value={metrics.newUsers.value}
            change={metrics.newUsers.change}
            color="cyan"
          />
          <MetricCard
            icon={BookOpen}
            label="Total Sessions"
            value={metrics.totalSessions.value}
            change={metrics.totalSessions.change}
            color="emerald"
          />
          <MetricCard
            icon={DollarSign}
            label="Revenue"
            value={`£${metrics.revenue.value.toFixed(2)}`}
            change={metrics.revenue.change}
            color="green"
          />
          <MetricCard
            icon={Clock}
            label="Avg Session Duration"
            value={`${metrics.avgDuration.value} min`}
            subtitle={`Target: ${metrics.avgDuration.target} min`}
            warning={metrics.avgDuration.value < 55}
            color="purple"
          />
        </div>
      </div>

      {/* Subject Popularity */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Subject Popularity</h2>
        <div className="space-y-4">
          {subjectStats.length === 0 ? (
            <p className="text-slate-400">No data available for this period</p>
          ) : (
            subjectStats.map((subject, index) => (
              <SubjectBar key={index} subject={subject} />
            ))
          )}
        </div>
      </div>

      {/* Teacher Performance */}
      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Teacher Performance</h2>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Total Teachers</p>
            <p className="text-2xl font-bold text-white">{teacherPerformance.total}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Active This Period</p>
            <p className="text-2xl font-bold text-white">{teacherPerformance.activeThisPeriod}</p>
          </div>
          <div className="bg-slate-900/50 border border-slate-700 rounded-lg p-4">
            <p className="text-slate-400 text-sm mb-1">Average Rating</p>
            <div className="flex items-center space-x-2">
              <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
              <p className="text-2xl font-bold text-white">{teacherPerformance.avgRating.toFixed(1)}</p>
              <span className="text-slate-400">/ 5.0</span>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold text-white mb-3">Top Performers</h3>
          {teacherPerformance.topPerformers.length === 0 ? (
            <p className="text-slate-400">No teacher data available</p>
          ) : (
            <div className="space-y-2">
              {teacherPerformance.topPerformers.map((teacher, index) => (
                <div key={teacher.id} className="flex items-center justify-between bg-slate-900/50 border border-slate-700 rounded-lg p-4">
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-cyan-500/20 border border-cyan-500/30 rounded-full flex items-center justify-center">
                      <span className="text-cyan-400 font-bold text-sm">{index + 1}</span>
                    </div>
                    <div>
                      <p className="text-white font-medium">{teacher.name}</p>
                      <p className="text-slate-400 text-sm">{teacher.sessionCount} sessions</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    <span className="text-white font-medium">{teacher.rating.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily Activity Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Sessions per Day */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Sessions per Day</h2>
          <LineChart data={dailyActivity.map(d => d.sessions)} labels={dailyActivity.map(d => format(new Date(d.date), 'MMM d'))} color="cyan" />
        </div>

        {/* Active Users per Day */}
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <h2 className="text-xl font-semibold text-white mb-4">Active Users per Day</h2>
          <BarChart data={dailyActivity.map(d => d.activeUsers)} labels={dailyActivity.map(d => format(new Date(d.date), 'MMM d'))} color="emerald" />
        </div>
      </div>
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, change, subtitle, warning, color }: any) {
  const colors = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
  };

  return (
    <div className={`${colors[color as keyof typeof colors]} border rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-8 h-8" />
        {warning && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
      </div>
      <p className="text-sm opacity-75 mb-1">{label}</p>
      <p className="text-3xl font-bold mb-2">{value}</p>
      {change !== undefined && (
        <div className="flex items-center space-x-1">
          {change >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-400" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-400" />
          )}
          <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {change >= 0 ? '+' : ''}{change.toFixed(1)}%
          </span>
        </div>
      )}
      {subtitle && <p className="text-xs opacity-60 mt-1">{subtitle}</p>}
    </div>
  );
}

// Subject Bar Component
function SubjectBar({ subject }: { subject: SubjectStats }) {
  const getSubjectIcon = (name: string) => {
    if (name.toLowerCase().includes('quran')) return '📗';
    if (name.toLowerCase().includes('arabic')) return '✏️';
    if (name.toLowerCase().includes('islamic')) return '🕌';
    return '📚';
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-xl">{getSubjectIcon(subject.name)}</span>
          <span className="text-white font-medium">{subject.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-slate-400 text-sm">{subject.count} sessions</span>
          <span className="text-cyan-400 font-medium">{subject.percentage.toFixed(0)}%</span>
        </div>
      </div>
      <div className="w-full bg-slate-900 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400 rounded-full transition-all duration-500"
          style={{ width: `${subject.percentage}%` }}
        ></div>
      </div>
    </div>
  );
}

// Line Chart Component
function LineChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const maxValue = Math.max(...data, 1);
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - (value / maxValue) * 80;
    return `${x},${y}`;
  }).join(' ');

  const colors = {
    cyan: { line: '#06b6d4', fill: 'rgba(6, 182, 212, 0.1)' },
    emerald: { line: '#10b981', fill: 'rgba(16, 185, 129, 0.1)' },
  };

  const colorScheme = colors[color as keyof typeof colors];

  return (
    <div>
      <div className="relative h-48 mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          {/* Grid lines */}
          <line x1="0" y1="20" x2="100" y2="20" stroke="#334155" strokeWidth="0.2" />
          <line x1="0" y1="40" x2="100" y2="40" stroke="#334155" strokeWidth="0.2" />
          <line x1="0" y1="60" x2="100" y2="60" stroke="#334155" strokeWidth="0.2" />
          <line x1="0" y1="80" x2="100" y2="80" stroke="#334155" strokeWidth="0.2" />

          {/* Area fill */}
          <polygon
            points={`0,100 ${points} 100,100`}
            fill={colorScheme.fill}
          />

          {/* Line */}
          <polyline
            points={points}
            fill="none"
            stroke={colorScheme.line}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Points */}
          {data.map((value, index) => {
            const x = (index / (data.length - 1)) * 100;
            const y = 100 - (value / maxValue) * 80;
            return (
              <circle
                key={index}
                cx={x}
                cy={y}
                r="1.5"
                fill={colorScheme.line}
              />
            );
          })}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-slate-500 -translate-x-8">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>0</span>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-slate-500">
        {labels.map((label, index) => {
          // Show every nth label to avoid crowding
          const showEvery = Math.ceil(labels.length / 7);
          if (index % showEvery === 0 || index === labels.length - 1) {
            return <span key={index}>{label}</span>;
          }
          return null;
        })}
      </div>
    </div>
  );
}

// Bar Chart Component
function BarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const maxValue = Math.max(...data, 1);

  const colors = {
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
  };

  const barColor = colors[color as keyof typeof colors];

  return (
    <div>
      <div className="h-48 flex items-end justify-between space-x-1 mb-4">
        {data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-slate-900 rounded-t relative group">
              <div
                className={`${barColor} rounded-t transition-all duration-500`}
                style={{ height: `${(value / maxValue) * 192}px` }}
              >
                {/* Tooltip on hover */}
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-slate-700 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between text-xs text-slate-500">
        {labels.map((label, index) => {
          const showEvery = Math.ceil(labels.length / 7);
          if (index % showEvery === 0 || index === labels.length - 1) {
            return <span key={index}>{label}</span>;
          }
          return null;
        })}
      </div>
    </div>
  );
}
