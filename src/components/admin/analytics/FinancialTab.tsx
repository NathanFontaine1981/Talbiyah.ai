import { useState, useEffect } from 'react';
import { DollarSign, CreditCard, RefreshCw, Wallet, TrendingUp, Package } from 'lucide-react';
import { supabase } from '../../../lib/supabaseClient';
import { format } from 'date-fns';
import MetricCard from './charts/MetricCard';
import AreaChartCard from './charts/AreaChartCard';
import BarChartCard from './charts/BarChartCard';
import PieChartCard from './charts/PieChartCard';

interface FinancialTabProps {
  startDate: Date;
  endDate: Date;
}

interface FinancialData {
  revenue_by_day: Array<{ date: string; revenue: number; transactions: number }>;
  total_revenue: number;
  total_transactions: number;
  total_refunds: number;
  credit_purchases_by_pack: Array<{ name: string; value: number; revenue: number }>;
  credit_usage_by_type: Array<{ name: string; value: number; count: number }>;
  average_credits_per_user: number;
  total_credits_in_circulation: number;
  lesson_stats: Array<{ name: string; value: number }>;
}

export default function FinancialTab({ startDate, endDate }: FinancialTabProps) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<FinancialData | null>(null);

  useEffect(() => {
    fetchData();
  }, [startDate, endDate]);

  async function fetchData() {
    try {
      setLoading(true);
      const { data: result, error } = await supabase.rpc('get_financial_analytics', {
        p_start_date: startDate.toISOString(),
        p_end_date: endDate.toISOString(),
      });

      if (error) throw error;
      setData(result);
    } catch (error) {
      console.error('Error fetching financial data:', error);
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
        Failed to load financial data
      </div>
    );
  }

  const revenueChartData = (data.revenue_by_day || []).map((item) => ({
    date: format(new Date(item.date), 'MMM d'),
    revenue: Number(item.revenue) || 0,
  }));

  return (
    <div className="space-y-6">
      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <MetricCard
          icon={DollarSign}
          label="Total Revenue"
          value={`£${(Number(data.total_revenue) || 0).toLocaleString()}`}
          color="emerald"
        />
        <MetricCard
          icon={CreditCard}
          label="Transactions"
          value={data.total_transactions || 0}
          color="blue"
        />
        <MetricCard
          icon={RefreshCw}
          label="Refunds"
          value={`£${(Number(data.total_refunds) || 0).toLocaleString()}`}
          color="pink"
        />
        <MetricCard
          icon={Wallet}
          label="Credits in Circulation"
          value={data.total_credits_in_circulation || 0}
          subtitle={`Avg ${(Number(data.average_credits_per_user) || 0).toFixed(1)} per user`}
          color="purple"
        />
      </div>

      {/* Revenue Chart */}
      <AreaChartCard
        title="Revenue Over Time"
        data={revenueChartData}
        dataKey="revenue"
        color="#10b981"
        height={350}
        valuePrefix="£"
      />

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PieChartCard
          title="Credit Pack Distribution"
          data={(data.credit_purchases_by_pack || []).map(p => ({
            name: `${p.name} Credits`,
            value: p.value,
          }))}
          colors={['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899']}
        />
        <BarChartCard
          title="Credit Usage by Type"
          data={data.credit_usage_by_type || []}
          dataKey="value"
          xAxisKey="name"
          layout="vertical"
          height={300}
        />
      </div>

      {/* Lesson Stats */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Lesson Status Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(data.lesson_stats || []).map((stat, index) => {
            const colors = ['emerald', 'blue', 'amber', 'red', 'purple'];
            const bgColors: Record<string, string> = {
              emerald: 'bg-emerald-500/10 border-emerald-500/20',
              blue: 'bg-blue-500/10 border-blue-500/20',
              amber: 'bg-amber-500/10 border-amber-500/20',
              red: 'bg-red-500/10 border-red-500/20',
              purple: 'bg-purple-500/10 border-purple-500/20',
            };
            const textColors: Record<string, string> = {
              emerald: 'text-emerald-600 dark:text-emerald-400',
              blue: 'text-blue-600 dark:text-blue-400',
              amber: 'text-amber-600 dark:text-amber-400',
              red: 'text-red-600 dark:text-red-400',
              purple: 'text-purple-600 dark:text-purple-400',
            };
            const color = colors[index % colors.length];

            return (
              <div key={stat.name} className={`${bgColors[color]} border rounded-xl p-4`}>
                <p className="text-sm text-gray-600 dark:text-gray-400 capitalize">{stat.name}</p>
                <p className={`text-2xl font-bold ${textColors[color]}`}>{stat.value}</p>
              </div>
            );
          })}
          {(data.lesson_stats || []).length === 0 && (
            <div className="col-span-4 text-center py-4 text-gray-500 dark:text-gray-400">
              No lesson data available
            </div>
          )}
        </div>
      </div>

      {/* Credit Purchases Table */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Credit Pack Sales</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200 dark:border-gray-700">
                <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Pack Size</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Sales Count</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-gray-500 dark:text-gray-400">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {(data.credit_purchases_by_pack || []).map((pack, index) => (
                <tr key={index} className="border-b border-gray-100 dark:border-gray-700/50 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="py-3 px-4 text-sm text-gray-900 dark:text-white">
                    <div className="flex items-center space-x-2">
                      <Package className="w-4 h-4 text-emerald-500" />
                      <span>{pack.name} Credits</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-sm text-right text-gray-600 dark:text-gray-300">{pack.value}</td>
                  <td className="py-3 px-4 text-sm text-right text-emerald-600 dark:text-emerald-400 font-medium">
                    £{(Number(pack.revenue) || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
              {(data.credit_purchases_by_pack || []).length === 0 && (
                <tr>
                  <td colSpan={3} className="py-8 text-center text-gray-500 dark:text-gray-400">No purchase data available</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
