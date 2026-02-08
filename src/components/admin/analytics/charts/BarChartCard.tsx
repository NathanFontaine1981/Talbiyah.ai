import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface BarChartCardProps {
  title: string;
  data: Array<{ [key: string]: any }>;
  dataKey: string;
  xAxisKey: string;
  color?: string;
  colors?: string[];
  height?: number;
  layout?: 'horizontal' | 'vertical';
  valuePrefix?: string;
  valueSuffix?: string;
}

const DEFAULT_COLORS = ['#10b981', '#06b6d4', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1'];

export default function BarChartCard({
  title,
  data,
  dataKey,
  xAxisKey,
  color,
  colors,
  height = 300,
  layout = 'horizontal',
  valuePrefix = '',
  valueSuffix = '',
}: BarChartCardProps) {
  const colorArray = colors || (color ? [color] : DEFAULT_COLORS);

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">{title}</h3>
      {data.length === 0 ? (
        <div className="flex items-center justify-center h-48 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={height}>
          <BarChart
            data={data}
            layout={layout}
            margin={{ top: 10, right: 10, left: layout === 'vertical' ? 80 : 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-gray-200 dark:stroke-gray-700" />
            {layout === 'horizontal' ? (
              <>
                <XAxis
                  dataKey={xAxisKey}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${valuePrefix}${value}${valueSuffix}`}
                />
              </>
            ) : (
              <>
                <XAxis
                  type="number"
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  tickFormatter={(value) => `${valuePrefix}${value}${valueSuffix}`}
                />
                <YAxis
                  type="category"
                  dataKey={xAxisKey}
                  tick={{ fill: '#9ca3af', fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  width={70}
                />
              </>
            )}
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(31, 41, 55, 0.95)',
                border: 'none',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: number) => [`${valuePrefix}${value.toLocaleString()}${valueSuffix}`, '']}
              labelStyle={{ color: '#9ca3af' }}
            />
            <Bar dataKey={dataKey} radius={[4, 4, 0, 0]}>
              {data.map((_, index) => (
                <Cell key={`cell-${index}`} fill={colorArray[index % colorArray.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
