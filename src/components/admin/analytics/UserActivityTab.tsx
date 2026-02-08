import { useState, useEffect } from 'react';
import { Eye, Users, Clock, Monitor, Smartphone, Tablet, Globe } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { format } from 'date-fns';
import MetricCard from './charts/MetricCard';
import AreaChartCard from './charts/AreaChartCard';
import BarChartCard from './charts/BarChartCard';
import PieChartCard from './charts/PieChartCard';

// Format duration from milliseconds to human readable format
function formatDuration(ms: number): string {
  if (!ms || ms <= 0) return '0s';

  const totalSeconds = Math.round(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
  } else if (minutes > 0) {
    return seconds > 0 ? `${minutes}m ${seconds}s` : `${minutes}m`;
  } else {
    return `${seconds}s`;
  }
}

interface UserActivityTabProps {
  startDate: Date;
  endDate: Date;
}

interface ActivityData {
  page_views_by_day: Array<{ date: string; views: number }>;
  total_page_views: number;
  unique_users: number;
  total_sessions: number;
  avg_session_duration: number;
  device_breakdown: Array<{ name: string; value: number }>;
  browser_breakdown: Array<{ name: string; value: number }>;
  top_pages: Array<{ page_path: string; views: number; unique_users: number; avg_duration: number }>;
  feature_usage: Array<{ component: string; action: string; uses: number; unique_users: number }>;
  hourly_activity: Array<{ hour: number; events: number }>;
}

export default function UserActivityTab({ startDate, endDate }: UserActivityTabProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ActivityData | null>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: result, error } = await supabase.rpc('get_user_activity_analytics', {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      setData(result);
    } catch (error) {
      console.error('Error fetching user activity:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12 text-gray-500 dark:text-gray-400">
        Failed to load activity data
      </div>
    );
  }

  const pageViewsChartData = (data.page_views_by_day || []).map((item) => ({
    date: format(new Date(item.date), 'MMM d'),
    views: item.views,
  }));

  const hourlyData = Array.from({ length: 24 }, (_, i) => {
    const found = (data.hourly_activity || []).find((h) => h.hour === i);
    return { hour: `${i}:00`, events: found?.events || 0 };
  });

  const getDeviceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="w-4 h-4" />;
      case 'tablet':
        return <Tablet className="w-4 h-4" />;
      default:
        return <Monitor className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={Eye}
          label="Page Views"
          value={data.total_page_views || 0}
          color="cyan"
        />
        <MetricCard
          icon={Users}
          label="Unique Users"
          value={data.unique_users || 0}
          color="emerald"
        />
        <MetricCard
          icon={Globe}
          label="Sessions"
          value={data.total_sessions || 0}
          color="blue"
        />
        <MetricCard
          icon={Clock}
          label="Avg Duration"
          value={formatDuration(data.avg_session_duration || 0)}
          color="purple"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AreaChartCard
          title="Page Views Over Time"
          data={pageViewsChartData}
          dataKey="views"
          color="#06b6d4"
        />
        <BarChartCard
          title="Hourly Activity Pattern"
          data={hourlyData}
          dataKey="events"
          xAxisKey="hour"
          color="#10b981"
        />
      </div>

      {/* Pie Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartCard
          title="Device Breakdown"
          data={data.device_breakdown || []}
          colors={['#10b981', '#06b6d4', '#8b5cf6']}
        />
        <PieChartCard
          title="Browser Breakdown"
          data={data.browser_breakdown || []}
          colors={['#f59e0b', '#ec4899', '#14b8a6', '#6366f1', '#84cc16']}
        />
      </div>

      {/* Top Pages Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Top Pages</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Page Path</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Views</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Unique Users</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Avg Duration</th>
              </tr>
            </thead>
            <tbody>
              {(data.top_pages || []).map((page, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white font-mono">{page.page_path}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">{page.views.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">{page.unique_users.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">{formatDuration(page.avg_duration)}</td>
                </tr>
              ))}
              {(data.top_pages || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">No page data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Feature Usage Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Feature Usage</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Component</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Action</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Uses</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Unique Users</th>
              </tr>
            </thead>
            <tbody>
              {(data.feature_usage || []).map((feature, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">{feature.component}</td>
                  <td className="py-3 px-4 text-sm text-gray-600 dark:text-gray-300">{feature.action}</td>
                  <td className="py-3 px-4 text-sm text-right text-emerald-600 dark:text-emerald-400 font-medium">{feature.uses.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">{feature.unique_users.toLocaleString()}</td>
                </tr>
              ))}
              {(data.feature_usage || []).length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 text-center text-gray-500 dark:text-gray-400">No feature usage data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
