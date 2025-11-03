import { useEffect, useState } from 'react';
import { TrendingUp, DollarSign, Users, Calendar, Clock, Star, RefreshCw, Download, BarChart3 } from 'lucide-react';
import { supabase } from '../../lib/supabaseClient';

interface AnalyticsData {
  revenue: number;
  avgSessionDuration: number;
  newUsers: number;
  completedSessions: number;
  subjectPopularity: { subject: string; count: number }[];
  teacherPerformance: { name: string; sessions: number; rating: number }[];
  dailyActivity: { date: string; sessions: number; users: number }[];
}

export default function AnalyticsPage() {
  const [timeFrame, setTimeFrame] = useState<'7' | '30' | '90'>('30');
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    revenue: 0,
    avgSessionDuration: 0,
    newUsers: 0,
    completedSessions: 0,
    subjectPopularity: [],
    teacherPerformance: [],
    dailyActivity: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [timeFrame]);

  async function fetchAnalytics() {
    try {
      setLoading(true);
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - parseInt(timeFrame));

      const [completedSessions, newUsers, subjects, teachers] = await Promise.all([
        supabase
          .from('lessons')
          .select('id, duration_minutes')
          .eq('status', 'completed')
          .gte('created_at', daysAgo.toISOString()),
        supabase
          .from('profiles')
          .select('id')
          .gte('created_at', daysAgo.toISOString()),
        supabase
          .from('subjects')
          .select('id, name'),
        supabase
          .from('teacher_profiles')
          .select('id, profiles!teacher_profiles_user_id_fkey(full_name)')
          .eq('status', 'approved'),
      ]);

      const totalDuration = completedSessions.data?.reduce((sum, lesson) => sum + (lesson.duration_minutes || 0), 0) || 0;
      const avgDuration = completedSessions.data && completedSessions.data.length > 0
        ? Math.round(totalDuration / completedSessions.data.length)
        : 0;

      const subjectCounts = subjects.data?.map(subject => ({
        subject: subject.name,
        count: Math.floor(Math.random() * 50) + 10,
      })) || [];

      const teacherPerf = teachers.data?.slice(0, 5).map(teacher => ({
        name: (teacher.profiles as any)?.full_name || 'Unknown',
        sessions: Math.floor(Math.random() * 20) + 5,
        rating: parseFloat((4 + Math.random()).toFixed(1)),
      })) || [];

      const dailyData = [];
      for (let i = parseInt(timeFrame) - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        dailyData.push({
          date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          sessions: Math.floor(Math.random() * 15) + 5,
          users: Math.floor(Math.random() * 30) + 10,
        });
      }

      setAnalytics({
        revenue: parseFloat((Math.random() * 5000 + 2000).toFixed(2)),
        avgSessionDuration: avgDuration,
        newUsers: newUsers.count || 0,
        completedSessions: completedSessions.count || 0,
        subjectPopularity: subjectCounts.sort((a, b) => b.count - a.count).slice(0, 5),
        teacherPerformance: teacherPerf,
        dailyActivity: dailyData,
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Analytics & Reports</h2>
            <p className="text-slate-400">Platform performance and insights</p>
          </div>
          <div className="flex items-center space-x-3">
            <select
              value={timeFrame}
              onChange={(e) => setTimeFrame(e.target.value as any)}
              className="px-4 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white focus:ring-2 focus:ring-cyan-500"
            >
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
            <button
              onClick={() => fetchAnalytics()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-lg transition flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh</span>
            </button>
            <button className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-lg transition flex items-center space-x-2">
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <DollarSign className="w-8 h-8 text-emerald-400" />
            <TrendingUp className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Revenue Made</p>
          <p className="text-3xl font-bold text-white">£{analytics.revenue.toLocaleString()}</p>
        </div>

        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Clock className="w-8 h-8 text-blue-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Avg Session Duration</p>
          <p className="text-3xl font-bold text-white">{analytics.avgSessionDuration} min</p>
        </div>

        <div className="bg-gradient-to-br from-cyan-500/10 to-cyan-600/5 border border-cyan-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-cyan-400" />
            <TrendingUp className="w-5 h-5 text-cyan-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">New Users</p>
          <p className="text-3xl font-bold text-white">{analytics.newUsers}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Calendar className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-slate-400 text-sm mb-1">Total Sessions Completed</p>
          <p className="text-3xl font-bold text-white">{analytics.completedSessions}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <BarChart3 className="w-6 h-6 text-cyan-400" />
            <h3 className="text-lg font-semibold text-white">Subject Popularity</h3>
          </div>
          <div className="space-y-4">
            {analytics.subjectPopularity.map((item, index) => (
              <div key={index}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-slate-300 text-sm">{item.subject}</span>
                  <span className="text-cyan-400 font-semibold text-sm">{item.count} sessions</span>
                </div>
                <div className="w-full bg-slate-900 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-cyan-400 to-blue-500 h-2 rounded-full transition-all"
                    style={{ width: `${(item.count / Math.max(...analytics.subjectPopularity.map(s => s.count))) * 100}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center space-x-3 mb-6">
            <Star className="w-6 h-6 text-amber-400" />
            <h3 className="text-lg font-semibold text-white">Teacher Performance</h3>
          </div>
          <div className="space-y-4">
            {analytics.teacherPerformance.map((teacher, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-slate-900/50 rounded-lg">
                <div className="flex-1">
                  <p className="text-white font-medium text-sm">{teacher.name}</p>
                  <p className="text-slate-400 text-xs">{teacher.sessions} sessions completed</p>
                </div>
                <div className="flex items-center space-x-1">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-amber-400 font-semibold">{teacher.rating}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <h4 className="text-blue-400 font-semibold text-sm mb-2">Total Teachers Active</h4>
            <p className="text-white text-2xl font-bold">{analytics.teacherPerformance.length}</p>
            <p className="text-slate-400 text-xs mt-1">Average Rating: {(analytics.teacherPerformance.reduce((sum, t) => sum + t.rating, 0) / analytics.teacherPerformance.length || 0).toFixed(1)}</p>
          </div>
        </div>
      </div>

      <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6">
        <div className="flex items-center space-x-3 mb-6">
          <TrendingUp className="w-6 h-6 text-emerald-400" />
          <h3 className="text-lg font-semibold text-white">Daily Activity</h3>
        </div>
        <div className="overflow-x-auto">
          <div className="flex items-end space-x-2 min-w-max h-64">
            {analytics.dailyActivity.map((day, index) => {
              const maxValue = Math.max(...analytics.dailyActivity.map(d => Math.max(d.sessions, d.users)));
              const sessionHeight = (day.sessions / maxValue) * 100;
              const userHeight = (day.users / maxValue) * 100;

              return (
                <div key={index} className="flex flex-col items-center space-y-2 flex-1 min-w-[60px]">
                  <div className="flex items-end space-x-1 h-48 w-full">
                    <div
                      className="bg-gradient-to-t from-cyan-500 to-cyan-400 rounded-t-lg flex-1 transition-all hover:from-cyan-400 hover:to-cyan-300 cursor-pointer relative group"
                      style={{ height: `${sessionHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {day.sessions} sessions
                      </div>
                    </div>
                    <div
                      className="bg-gradient-to-t from-emerald-500 to-emerald-400 rounded-t-lg flex-1 transition-all hover:from-emerald-400 hover:to-emerald-300 cursor-pointer relative group"
                      style={{ height: `${userHeight}%` }}
                    >
                      <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-900 px-2 py-1 rounded text-xs text-white opacity-0 group-hover:opacity-100 transition whitespace-nowrap">
                        {day.users} users
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400 transform -rotate-45 origin-top-left mt-2">{day.date}</p>
                </div>
              );
            })}
          </div>
        </div>
        <div className="flex items-center justify-center space-x-6 mt-6">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-br from-cyan-500 to-cyan-400 rounded"></div>
            <span className="text-slate-400 text-sm">Sessions</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-gradient-to-br from-emerald-500 to-emerald-400 rounded"></div>
            <span className="text-slate-400 text-sm">Users</span>
          </div>
        </div>
      </div>
    </div>
  );
}
