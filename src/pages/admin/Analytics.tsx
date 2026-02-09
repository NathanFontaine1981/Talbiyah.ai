import { useEffect, useState } from 'react';
import { RefreshCw, Download, TrendingUp, TrendingDown, Users, BookOpen, DollarSign, Clock, Star, AlertTriangle, LayoutDashboard, Activity, GraduationCap, Zap } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { toast } from 'sonner';
import { format, subDays, startOfMonth, endOfMonth, startOfYear, differenceInDays } from 'date-fns';
import UserActivityTab from '../../components/admin/analytics/UserActivityTab';
import FinancialTab from '../../components/admin/analytics/FinancialTab';
import LearningProgressTab from '../../components/admin/analytics/LearningProgressTab';

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
type TabType = 'overview' | 'activity' | 'financial' | 'learning';

const tabs = [
  { id: 'overview' as TabType, label: 'Overview', icon: LayoutDashboard },
  { id: 'activity' as TabType, label: 'User Activity', icon: Activity },
  { id: 'financial' as TabType, label: 'Financial', icon: DollarSign },
  { id: 'learning' as TabType, label: 'Learning Progress', icon: GraduationCap },
];

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('7days');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [lastUpdated, setLastUpdated] = useState(new Date());
  const [activeTab, setActiveTab] = useState<TabType>('overview');

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

  // Independent teacher & insights metrics
  const [independentMetrics, setIndependentMetrics] = useState({
    totalIndependentTeachers: 0,
    independentLessons: 0,
    lessonsWithInsights: 0,
    insightsAdoptionRate: 0,
    insightsRevenue: 0,
  });

  useEffect(() => {
    if (activeTab === 'overview') {
      fetchAnalytics();
    }
  }, [timePeriod, customDateRange, activeTab]);

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
      case 'lastMonth': {
        const lastMonth = subDays(startOfMonth(now), 1);
        start = startOfMonth(lastMonth);
        end = endOfMonth(lastMonth);
        break;
      }
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

      await Promise.all([
        fetchMetrics(start, end, prevStart, prevEnd),
        fetchSubjectStats(start, end),
        fetchTeacherPerformance(start, end),
        fetchDailyActivity(start, end),
        fetchIndependentMetrics(start, end),
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
      const { count: newUsersCurrent } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const { count: newUsersPrev } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      const newUsersChange = newUsersPrev ? ((newUsersCurrent || 0) - newUsersPrev) / newUsersPrev * 100 : 0;

      const { count: sessionsCurrent } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const { count: sessionsPrev } = await supabase
        .from('lessons')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      const sessionsChange = sessionsPrev ? ((sessionsCurrent || 0) - sessionsPrev) / sessionsPrev * 100 : 0;

      const { data: creditPurchasesCurrent } = await supabase
        .from('credit_purchases')
        .select('pack_price')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const revenueCurrentTotal = (creditPurchasesCurrent || []).reduce((sum, p) => sum + (p.pack_price || 0), 0);

      const { data: creditPurchasesPrev } = await supabase
        .from('credit_purchases')
        .select('pack_price')
        .gte('created_at', prevStart.toISOString())
        .lte('created_at', prevEnd.toISOString());

      const revenuePrevTotal = (creditPurchasesPrev || []).reduce((sum, p) => sum + (p.pack_price || 0), 0);
      const revenueChange = revenuePrevTotal ? (revenueCurrentTotal - revenuePrevTotal) / revenuePrevTotal * 100 : 0;

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
      const { count: totalTeachers } = await supabase
        .from('teacher_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'approved');

      const { data: activeLessons } = await supabase
        .from('lessons')
        .select('teacher_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const uniqueTeachers = new Set(activeLessons?.map(s => s.teacher_id) || []);

      const { data: teacherData } = await supabase
        .from('teacher_profiles')
        .select(`id, user_id, profiles!inner(full_name), average_rating`)
        .eq('status', 'approved');

      const { data: lessonCounts } = await supabase
        .from('lessons')
        .select('teacher_id')
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .eq('status', 'completed');

      const teacherLessonCounts: { [key: string]: number } = {};
      lessonCounts?.forEach((lesson: any) => {
        teacherLessonCounts[lesson.teacher_id] = (teacherLessonCounts[lesson.teacher_id] || 0) + 1;
      });

      const topPerformers: TeacherPerformance[] = (teacherData || [])
        .map((teacher: any) => ({
          id: teacher.id,
          name: teacher.profiles?.full_name || 'Unknown',
          rating: teacher.average_rating || 4.5,
          sessionCount: teacherLessonCounts[teacher.id] || 0,
        }))
        .filter(t => t.sessionCount > 0)
        .sort((a, b) => {
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

  async function fetchIndependentMetrics(start: Date, end: Date) {
    try {
      const { count: totalIndependentTeachers } = await supabase
        .from('teacher_profiles')
        .select('*', { count: 'exact', head: true })
        .eq('teacher_type', 'independent')
        .eq('status', 'approved');

      const { data: independentLessons } = await supabase
        .from('lessons')
        .select('id, insights_addon, insights_addon_price')
        .eq('is_independent', true)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString());

      const total = independentLessons?.length || 0;
      const withInsights = independentLessons?.filter(l => l.insights_addon)?.length || 0;
      const insightsRevenuePence = independentLessons
        ?.filter(l => l.insights_addon)
        ?.reduce((sum, l) => sum + (l.insights_addon_price || 250), 0) || 0;

      setIndependentMetrics({
        totalIndependentTeachers: totalIndependentTeachers || 0,
        independentLessons: total,
        lessonsWithInsights: withInsights,
        insightsAdoptionRate: total > 0 ? Math.round((withInsights / total) * 100) : 0,
        insightsRevenue: insightsRevenuePence / 100,
      });
    } catch (error) {
      console.error('Error fetching independent metrics:', error);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    if (activeTab === 'overview') {
      await fetchAnalytics();
    }
    setRefreshing(false);
    toast.success('Data refreshed');
  }

  function handleExport(formatType: 'csv' | 'pdf' | 'excel') {
    const exportData = {
      period: timePeriod,
      dateRange: getDateRange(),
      metrics,
      subjectStats,
      teacherPerformance,
      dailyActivity,
      generatedAt: new Date().toISOString(),
    };

    if (formatType === 'csv') {
      const csv = generateCSV(exportData);
      downloadFile(csv, 'analytics-report.csv', 'text/csv');
      toast.success('CSV exported successfully');
    } else {
      toast.info(`Export as ${formatType.toUpperCase()} - Coming soon!`);
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

  const { start, end } = getDateRange();

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Analytics Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Last updated: {format(lastUpdated, 'h:mm a')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            value={timePeriod}
            onChange={(e) => setTimePeriod(e.target.value as TimePeriod)}
            className="px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
          >
            <option value="7days">Last 7 days</option>
            <option value="30days">Last 30 days</option>
            <option value="90days">Last 90 days</option>
            <option value="thisMonth">This Month</option>
            <option value="lastMonth">Last Month</option>
            <option value="thisYear">This Year</option>
            <option value="custom">Custom Range</option>
          </select>

          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition flex items-center space-x-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <div className="relative group">
            <button className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <button
                onClick={() => handleExport('csv')}
                className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg"
              >
                Export as CSV
              </button>
              <button
                onClick={() => handleExport('pdf')}
                className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Export as PDF
              </button>
              <button
                onClick={() => handleExport('excel')}
                className="w-full px-4 py-2 text-left text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg"
              >
                Export as Excel
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Custom Date Range */}
      {timePeriod === 'custom' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">Start Date</label>
              <input
                type="date"
                value={customDateRange.start}
                onChange={(e) => setCustomDateRange({ ...customDateRange, start: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">End Date</label>
              <input
                type="date"
                value={customDateRange.end}
                onChange={(e) => setCustomDateRange({ ...customDateRange, end: e.target.value })}
                className="w-full px-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg text-gray-900 dark:text-white focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-1 mb-6 border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : (
            <>
              {/* Key Metrics */}
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Key Metrics</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <MetricCard icon={Users} label="New Users" value={metrics.newUsers.value} change={metrics.newUsers.change} color="cyan" />
                  <MetricCard icon={BookOpen} label="Total Sessions" value={metrics.totalSessions.value} change={metrics.totalSessions.change} color="emerald" />
                  <MetricCard icon={DollarSign} label="Revenue" value={`£${metrics.revenue.value.toFixed(2)}`} change={metrics.revenue.change} color="green" />
                  <MetricCard icon={Clock} label="Avg Session Duration" value={`${metrics.avgDuration.value} min`} subtitle={`Target: ${metrics.avgDuration.target} min`} warning={metrics.avgDuration.value < 55} color="purple" />
                </div>
              </div>

              {/* Subject Popularity */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Subject Popularity</h2>
                <div className="space-y-4">
                  {subjectStats.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No data available for this period</p>
                  ) : (
                    subjectStats.map((subject, index) => (
                      <SubjectBar key={index} subject={subject} />
                    ))
                  )}
                </div>
              </div>

              {/* Teacher Performance */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Teacher Performance</h2>
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Total Teachers</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacherPerformance.total}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Active This Period</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacherPerformance.activeThisPeriod}</p>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-1">Average Rating</p>
                    <div className="flex items-center space-x-2">
                      <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{teacherPerformance.avgRating.toFixed(1)}</p>
                      <span className="text-gray-600 dark:text-gray-400">/ 5.0</span>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Top Performers</h3>
                  {teacherPerformance.topPerformers.length === 0 ? (
                    <p className="text-gray-500 dark:text-gray-400">No teacher data available</p>
                  ) : (
                    <div className="space-y-2">
                      {teacherPerformance.topPerformers.map((teacher, index) => (
                        <div key={teacher.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-4">
                          <div className="flex items-center space-x-4">
                            <div className="w-8 h-8 bg-emerald-500/20 border border-emerald-500/30 rounded-full flex items-center justify-center">
                              <span className="text-emerald-600 font-bold text-sm">{index + 1}</span>
                            </div>
                            <div>
                              <p className="text-gray-900 dark:text-white font-medium">{teacher.name}</p>
                              <p className="text-gray-600 dark:text-gray-400 text-sm">{teacher.sessionCount} sessions</p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-gray-900 dark:text-white font-medium">{teacher.rating.toFixed(1)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Independent Teachers & Insights Addon */}
              {(independentMetrics.totalIndependentTeachers > 0 || independentMetrics.independentLessons > 0) && (
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 mb-8">
                  <div className="flex items-center space-x-2 mb-4">
                    <Zap className="w-5 h-5 text-blue-500" />
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Independent Teachers & Insights Addon</h2>
                  </div>
                  <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-blue-600 dark:text-blue-400 text-sm mb-1">Independent Teachers</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{independentMetrics.totalIndependentTeachers}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-blue-600 dark:text-blue-400 text-sm mb-1">Lessons (Period)</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{independentMetrics.independentLessons}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-blue-600 dark:text-blue-400 text-sm mb-1">With Insights Addon</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{independentMetrics.lessonsWithInsights}</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <p className="text-blue-600 dark:text-blue-400 text-sm mb-1">Adoption Rate</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">{independentMetrics.insightsAdoptionRate}%</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-lg p-4">
                      <p className="text-emerald-600 dark:text-emerald-400 text-sm mb-1">Insights Revenue</p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">&pound;{independentMetrics.insightsRevenue.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Daily Activity Charts */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Sessions per Day</h2>
                  <LineChart data={dailyActivity.map(d => d.sessions)} labels={dailyActivity.map(d => format(new Date(d.date), 'MMM d'))} color="cyan" />
                </div>
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Active Users per Day</h2>
                  <BarChart data={dailyActivity.map(d => d.activeUsers)} labels={dailyActivity.map(d => format(new Date(d.date), 'MMM d'))} color="emerald" />
                </div>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'activity' && (
        <UserActivityTab startDate={start} endDate={end} />
      )}

      {activeTab === 'financial' && (
        <FinancialTab startDate={start} endDate={end} />
      )}

      {activeTab === 'learning' && (
        <LearningProgressTab startDate={start} endDate={end} />
      )}
    </div>
  );
}

// Metric Card Component
function MetricCard({ icon: Icon, label, value, change, subtitle, warning, color }: any) {
  const colors: Record<string, string> = {
    cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-600 dark:text-cyan-400',
    emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
    green: 'bg-green-500/10 border-green-500/20 text-green-600 dark:text-green-400',
    purple: 'bg-purple-500/10 border-purple-500/20 text-purple-600 dark:text-purple-400',
  };

  return (
    <div className={`${colors[color]} border rounded-xl p-6`}>
      <div className="flex items-center justify-between mb-3">
        <Icon className="w-8 h-8" />
        {warning && <AlertTriangle className="w-5 h-5 text-yellow-400" />}
      </div>
      <p className="text-sm opacity-75 mb-1">{label}</p>
      <p className="text-3xl font-bold mb-2">{value}</p>
      {change !== undefined && (
        <div className="flex items-center space-x-1">
          {change >= 0 ? (
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          ) : (
            <TrendingDown className="w-4 h-4 text-red-500" />
          )}
          <span className={`text-sm font-medium ${change >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
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
          <span className="text-gray-900 dark:text-white font-medium">{subject.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          <span className="text-gray-500 dark:text-gray-400 text-sm">{subject.count} sessions</span>
          <span className="text-emerald-600 font-medium">{subject.percentage.toFixed(0)}%</span>
        </div>
      </div>
      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-500"
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
    const x = (index / (data.length - 1 || 1)) * 100;
    const y = 100 - (value / maxValue) * 80;
    return `${x},${y}`;
  }).join(' ');

  const colors: Record<string, { line: string; fill: string }> = {
    cyan: { line: '#06b6d4', fill: 'rgba(6, 182, 212, 0.1)' },
    emerald: { line: '#10b981', fill: 'rgba(16, 185, 129, 0.1)' },
  };

  const colorScheme = colors[color] || colors.cyan;

  return (
    <div>
      <div className="relative h-48 mb-4">
        <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <line x1="0" y1="20" x2="100" y2="20" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="0.2" />
          <line x1="0" y1="40" x2="100" y2="40" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="0.2" />
          <line x1="0" y1="60" x2="100" y2="60" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="0.2" />
          <line x1="0" y1="80" x2="100" y2="80" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="0.2" />
          <polygon points={`0,100 ${points} 100,100`} fill={colorScheme.fill} />
          <polyline points={points} fill="none" stroke={colorScheme.line} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          {data.map((value, index) => {
            const x = (index / (data.length - 1 || 1)) * 100;
            const y = 100 - (value / maxValue) * 80;
            return <circle key={index} cx={x} cy={y} r="1.5" fill={colorScheme.line} />;
          })}
        </svg>
        <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 -translate-x-8">
          <span>{maxValue}</span>
          <span>{Math.round(maxValue * 0.5)}</span>
          <span>0</span>
        </div>
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
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

// Bar Chart Component
function BarChart({ data, labels, color }: { data: number[]; labels: string[]; color: string }) {
  const maxValue = Math.max(...data, 1);

  const colors: Record<string, string> = {
    cyan: 'bg-cyan-500',
    emerald: 'bg-emerald-500',
  };

  const barColor = colors[color] || colors.emerald;

  return (
    <div>
      <div className="h-48 flex items-end justify-between space-x-1 mb-4">
        {data.map((value, index) => (
          <div key={index} className="flex-1 flex flex-col items-center">
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-t relative group">
              <div
                className={`${barColor} rounded-t transition-all duration-500`}
                style={{ height: `${(value / maxValue) * 192}px` }}
              >
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded text-xs text-gray-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                  {value}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
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
