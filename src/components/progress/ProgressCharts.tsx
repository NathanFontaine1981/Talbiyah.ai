import { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format, subDays, startOfWeek, eachWeekOfInterval, parseISO } from 'date-fns';
import { supabase } from '../../lib/supabaseClient';
import { TrendingUp, Calendar, BookOpen } from 'lucide-react';

interface LessonData {
  id: string;
  scheduled_time: string;
  duration_minutes: number;
  status: string;
}

interface ChartData {
  date: string;
  label: string;
  hours: number;
  lessons: number;
  milestones: number;
}

interface ProgressChartsProps {
  studentId?: string;
  period?: 'week' | 'month' | 'year';
  chartType?: 'hours' | 'lessons' | 'milestones' | 'combined';
}

export default function ProgressCharts({
  studentId,
  period = 'month',
  chartType = 'combined',
}: ProgressChartsProps) {
  const [data, setData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    async function fetchChartData() {
      // Get current user if studentId not provided
      let targetId = studentId;
      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetId = user?.id;
      }
      if (!targetId) {
        setLoading(false);
        return;
      }

      try {
        const now = new Date();
        let startDate: Date;

        switch (selectedPeriod) {
          case 'week':
            startDate = subDays(now, 7);
            break;
          case 'month':
            startDate = subDays(now, 30);
            break;
          case 'year':
            startDate = subDays(now, 365);
            break;
          default:
            startDate = subDays(now, 30);
        }

        // Fetch lessons
        const { data: lessons } = await supabase
          .from('lessons')
          .select('id, scheduled_time, duration_minutes, status')
          .eq('learner_id', targetId)
          .eq('status', 'completed')
          .gte('scheduled_time', startDate.toISOString())
          .order('scheduled_time');

        // Fetch milestone verifications
        const { data: milestones } = await supabase
          .from('student_milestone_progress')
          .select('verified_at')
          .eq('student_id', targetId)
          .eq('status', 'verified')
          .gte('verified_at', startDate.toISOString());

        // Group data by week
        const weeks = eachWeekOfInterval({ start: startDate, end: now });
        const chartData: ChartData[] = weeks.map((weekStart) => {
          const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

          const weekLessons = (lessons || []).filter((l) => {
            const lessonDate = new Date(l.scheduled_time);
            return lessonDate >= weekStart && lessonDate < weekEnd;
          });

          const weekMilestones = (milestones || []).filter((m) => {
            if (!m.verified_at) return false;
            const verifiedDate = new Date(m.verified_at);
            return verifiedDate >= weekStart && verifiedDate < weekEnd;
          });

          const totalMinutes = weekLessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);

          return {
            date: weekStart.toISOString(),
            label: format(weekStart, 'MMM d'),
            hours: Math.round((totalMinutes / 60) * 10) / 10,
            lessons: weekLessons.length,
            milestones: weekMilestones.length,
          };
        });

        setData(chartData);
      } catch (error) {
        console.error('Error fetching chart data:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchChartData();
  }, [studentId, selectedPeriod]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-48" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </div>
    );
  }

  const totalHours = data.reduce((acc, d) => acc + d.hours, 0);
  const totalLessons = data.reduce((acc, d) => acc + d.lessons, 0);
  const totalMilestones = data.reduce((acc, d) => acc + d.milestones, 0);

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
      {/* Header with period selector */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Learning Progress</h2>
          <p className="text-sm text-gray-500">Track your study hours and achievements</p>
        </div>
        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['week', 'month', 'year'] as const).map((p) => (
            <button
              key={p}
              onClick={() => setSelectedPeriod(p)}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                selectedPeriod === p
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {p === 'week' ? '7 Days' : p === 'month' ? '30 Days' : '1 Year'}
            </button>
          ))}
        </div>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-emerald-50 rounded-lg">
          <p className="text-2xl font-bold text-emerald-600">{totalHours.toFixed(1)}</p>
          <p className="text-xs text-emerald-700">Hours Studied</p>
        </div>
        <div className="text-center p-3 bg-blue-50 rounded-lg">
          <p className="text-2xl font-bold text-blue-600">{totalLessons}</p>
          <p className="text-xs text-blue-700">Lessons Completed</p>
        </div>
        <div className="text-center p-3 bg-purple-50 rounded-lg">
          <p className="text-2xl font-bold text-purple-600">{totalMilestones}</p>
          <p className="text-xs text-purple-700">Milestones Achieved</p>
        </div>
      </div>

      {/* Chart */}
      <div className="h-64">
        {data.length === 0 ? (
          <div className="h-full flex items-center justify-center text-gray-500">
            <div className="text-center">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No data for this period</p>
              <p className="text-sm">Complete lessons to see your progress</p>
            </div>
          </div>
        ) : chartType === 'hours' ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="hoursGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                label={{ value: 'Hours', angle: -90, position: 'insideLeft', fontSize: 12, fill: '#6B7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
                formatter={(value: number) => [`${value} hrs`, 'Study Time']}
              />
              <Area
                type="monotone"
                dataKey="hours"
                stroke="#10B981"
                strokeWidth={2}
                fill="url(#hoursGradient)"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : chartType === 'lessons' ? (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Bar dataKey="lessons" fill="#3B82F6" radius={[4, 4, 0, 0]} name="Lessons" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                yAxisId="left"
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#6B7280' }}
                tickLine={false}
                axisLine={false}
                yAxisId="right"
                orientation="right"
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'white',
                  border: '1px solid #E5E7EB',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="hours"
                stroke="#10B981"
                strokeWidth={2}
                dot={{ fill: '#10B981', strokeWidth: 0, r: 4 }}
                name="Hours"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="lessons"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ fill: '#3B82F6', strokeWidth: 0, r: 4 }}
                name="Lessons"
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="milestones"
                stroke="#8B5CF6"
                strokeWidth={2}
                dot={{ fill: '#8B5CF6', strokeWidth: 0, r: 4 }}
                name="Milestones"
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}

// Compact version for embedding
export function ProgressChartMini({ studentId }: { studentId?: string }) {
  const [data, setData] = useState<{ label: string; hours: number }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      // Get current user if studentId not provided
      let targetId = studentId;
      if (!targetId) {
        const { data: { user } } = await supabase.auth.getUser();
        targetId = user?.id;
      }
      if (!targetId) {
        setLoading(false);
        return;
      }

      const startDate = subDays(new Date(), 14);
      const { data: lessons } = await supabase
        .from('lessons')
        .select('scheduled_time, duration_minutes')
        .eq('learner_id', targetId)
        .eq('status', 'completed')
        .gte('scheduled_time', startDate.toISOString());

      const weeks = eachWeekOfInterval({ start: startDate, end: new Date() });
      const chartData = weeks.map((weekStart) => {
        const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);
        const weekLessons = (lessons || []).filter((l) => {
          const d = new Date(l.scheduled_time);
          return d >= weekStart && d < weekEnd;
        });
        const minutes = weekLessons.reduce((acc, l) => acc + (l.duration_minutes || 0), 0);
        return {
          label: format(weekStart, 'MMM d'),
          hours: Math.round((minutes / 60) * 10) / 10,
        };
      });

      setData(chartData);
      setLoading(false);
    }

    fetchData();
  }, [studentId]);

  if (loading) {
    return <div className="h-24 animate-pulse bg-gray-100 rounded-lg" />;
  }

  return (
    <div className="h-24">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="hours"
            stroke="#10B981"
            strokeWidth={2}
            fill="url(#miniGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Weekly study goal component
export function WeeklyGoalProgress({
  currentHours,
  goalHours = 3,
}: {
  currentHours: number;
  goalHours?: number;
}) {
  const percentage = Math.min((currentHours / goalHours) * 100, 100);
  const isComplete = currentHours >= goalHours;

  return (
    <div className="p-4 bg-white rounded-xl border border-gray-200">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-700">Weekly Goal</span>
        <span className={`text-sm font-medium ${isComplete ? 'text-emerald-600' : 'text-gray-600'}`}>
          {currentHours.toFixed(1)} / {goalHours} hrs
        </span>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete ? 'bg-emerald-500' : 'bg-blue-500'
          }`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      <p className="text-xs text-gray-500 mt-2">
        {isComplete
          ? 'Goal achieved! Great work this week.'
          : `${(goalHours - currentHours).toFixed(1)} hours to go`}
      </p>
    </div>
  );
}
