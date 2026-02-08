import { useEffect, useState } from 'react';
import { RefreshCw, Activity, Users, MousePointer, Eye, Search, TrendingUp, Clock, Globe, Smartphone, Monitor, ChevronDown, ChevronUp } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';
import { format, formatDistanceToNow } from 'date-fns';

interface PageView {
  page_path: string;
  page_title: string;
  view_count: number;
  unique_users: number;
  avg_duration_ms: number;
}

interface FeatureUsage {
  component: string;
  action: string;
  usage_count: number;
  unique_users: number;
}

interface UserEngagement {
  user_id: string;
  full_name: string;
  total_events: number;
  total_sessions: number;
  active_days: number;
  last_active: string;
  first_seen: string;
}

interface RecentActivity {
  id: string;
  user_id: string;
  full_name: string;
  event_type: string;
  event_category: string;
  page_path: string;
  component: string;
  action: string;
  device_type: string;
  created_at: string;
}

interface DashboardStats {
  total_events_today: number;
  total_events_week: number;
  active_users_today: number;
  active_users_week: number;
  top_pages: { page_path: string; views: number }[];
  top_features: { component: string; action: string; uses: number }[];
}

export default function UserActivity() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'pages' | 'features' | 'users' | 'live'>('overview');

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [popularPages, setPopularPages] = useState<PageView[]>([]);
  const [featureUsage, setFeatureUsage] = useState<FeatureUsage[]>([]);
  const [userEngagement, setUserEngagement] = useState<UserEngagement[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      await Promise.all([
        fetchDashboardStats(),
        fetchPopularPages(),
        fetchFeatureUsage(),
        fetchUserEngagement(),
        fetchRecentActivity(),
      ]);
    } catch (error) {
      console.error('Error fetching activity data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDashboardStats() {
    try {
      const { data, error } = await supabase.rpc('get_activity_dashboard_stats');
      if (error) throw error;
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  }

  async function fetchPopularPages() {
    try {
      const { data, error } = await supabase
        .from('popular_pages')
        .select('*')
        .limit(20);

      if (error) throw error;
      setPopularPages(data || []);
    } catch (error) {
      console.error('Error fetching popular pages:', error);
    }
  }

  async function fetchFeatureUsage() {
    try {
      const { data, error } = await supabase
        .from('feature_usage')
        .select('*')
        .limit(20);

      if (error) throw error;
      setFeatureUsage(data || []);
    } catch (error) {
      console.error('Error fetching feature usage:', error);
    }
  }

  async function fetchUserEngagement() {
    try {
      const { data, error } = await supabase.rpc('get_user_engagement_summary');
      if (error) throw error;
      setUserEngagement(data || []);
    } catch (error) {
      console.error('Error fetching user engagement:', error);
    }
  }

  async function fetchRecentActivity() {
    try {
      const { data, error } = await supabase
        .from('user_activity')
        .select(`
          id,
          user_id,
          event_type,
          event_category,
          page_path,
          component,
          action,
          device_type,
          created_at
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Fetch user names
      const userIds = [...new Set(data?.map(a => a.user_id) || [])];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p.full_name]) || []);

      setRecentActivity(
        (data || []).map(a => ({
          ...a,
          full_name: profileMap.get(a.user_id) || 'Unknown User',
        }))
      );
    } catch (error) {
      console.error('Error fetching recent activity:', error);
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const getDeviceIcon = (deviceType: string) => {
    switch (deviceType) {
      case 'mobile': return <Smartphone className="w-4 h-4" />;
      case 'tablet': return <Monitor className="w-4 h-4" />;
      default: return <Monitor className="w-4 h-4" />;
    }
  };

  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'page_view': return <Eye className="w-4 h-4 text-blue-500" />;
      case 'feature_use': return <MousePointer className="w-4 h-4 text-emerald-500" />;
      case 'click': return <MousePointer className="w-4 h-4 text-purple-500" />;
      case 'search': return <Search className="w-4 h-4 text-orange-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatPagePath = (path: string) => {
    if (!path) return 'Unknown';
    // Make paths more readable
    return path
      .replace(/^\//, '')
      .replace(/-/g, ' ')
      .replace(/\//g, ' > ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ') || 'Home';
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">User Activity</h1>
          <p className="text-gray-500 dark:text-gray-400">Track where users browse and what features they use</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-gray-200 dark:border-gray-700">
        {[
          { id: 'overview', label: 'Overview', icon: Activity },
          { id: 'pages', label: 'Popular Pages', icon: Eye },
          { id: 'features', label: 'Feature Usage', icon: MousePointer },
          { id: 'users', label: 'User Engagement', icon: Users },
          { id: 'live', label: 'Live Activity', icon: Globe },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                  <Activity className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Events Today</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_events_today || 0}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Events This Week</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.total_events_week || 0}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Active Users Today</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.active_users_today || 0}</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                  <Users className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                </div>
                <span className="text-gray-500 dark:text-gray-400 text-sm">Active Users This Week</span>
              </div>
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{stats?.active_users_week || 0}</p>
            </div>
          </div>

          {/* Top Pages & Features */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Eye className="w-5 h-5 text-blue-500" />
                  Top Pages (This Week)
                </h3>
              </div>
              <div className="p-4">
                {stats?.top_pages?.length ? (
                  <div className="space-y-3">
                    {stats.top_pages.slice(0, 10).map((page, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                          {formatPagePath(page.page_path)}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-mono text-sm ml-4">
                          {page.views} views
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data yet</p>
                )}
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <MousePointer className="w-5 h-5 text-emerald-500" />
                  Top Features (This Week)
                </h3>
              </div>
              <div className="p-4">
                {stats?.top_features?.length ? (
                  <div className="space-y-3">
                    {stats.top_features.slice(0, 10).map((feature, idx) => (
                      <div key={idx} className="flex items-center justify-between">
                        <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                          {feature.component} - {feature.action}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 font-mono text-sm ml-4">
                          {feature.uses} uses
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 dark:text-gray-400 text-center py-4">No data yet</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Popular Pages Tab */}
      {activeTab === 'pages' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Page</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Views</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unique Users</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Avg Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {popularPages.length > 0 ? popularPages.map((page, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{formatPagePath(page.page_path)}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 font-mono">{page.page_path}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-mono">{page.view_count}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-mono">{page.unique_users}</td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400">
                      {page.avg_duration_ms ? `${Math.round(page.avg_duration_ms / 1000)}s` : '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No page view data yet. Activity tracking will populate as users browse.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Feature Usage Tab */}
      {activeTab === 'features' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Component</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Action</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Usage Count</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Unique Users</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {featureUsage.length > 0 ? featureUsage.map((feature, idx) => (
                  <tr key={idx} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{feature.component}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{feature.action}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-mono">{feature.usage_count}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-mono">{feature.unique_users}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={4} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No feature usage data yet. Use trackFeature() in components to track usage.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* User Engagement Tab */}
      {activeTab === 'users' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">User</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Events</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Sessions</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Active Days</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Last Active</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {userEngagement.length > 0 ? userEngagement.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                      {user.full_name || 'Unknown User'}
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-mono">{user.total_events}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-mono">{user.total_sessions}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white font-mono">{user.active_days}</td>
                    <td className="px-4 py-3 text-right text-gray-500 dark:text-gray-400 text-sm">
                      {user.last_active ? formatDistanceToNow(new Date(user.last_active), { addSuffix: true }) : '-'}
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      No user engagement data yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Live Activity Tab */}
      {activeTab === 'live' && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900 dark:text-white">Recent Activity (Last 50 events)</h3>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Auto-refreshes every 30 seconds
            </span>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
            {recentActivity.length > 0 ? recentActivity.map((activity) => (
              <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-gray-100 dark:bg-gray-700 rounded-lg">
                    {getEventIcon(activity.event_type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900 dark:text-white">{activity.full_name}</span>
                      <span className="text-gray-400">•</span>
                      <span className="text-sm text-gray-500 dark:text-gray-400 capitalize">{activity.event_type.replace('_', ' ')}</span>
                    </div>
                    <p className="text-gray-600 dark:text-gray-300 text-sm truncate">
                      {activity.page_path && formatPagePath(activity.page_path)}
                      {activity.component && ` ${activity.component}`}
                      {activity.action && ` - ${activity.action}`}
                    </p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        {getDeviceIcon(activity.device_type)}
                        {activity.device_type}
                      </span>
                      <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                No recent activity yet. Activity will appear as users browse.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
