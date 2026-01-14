import { useMemo, useState } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency, getMonthKey } from '../lib/utils';

const COLORS = [
  '#3b82f6',
  '#ef4444',
  '#22c55e',
  '#eab308',
  '#8b5cf6',
  '#ec4899',
  '#f97316',
  '#06b6d4',
  '#6366f1',
  '#14b8a6',
];

type TimeRange = 'thisMonth' | 'lastMonth' | 'last90' | 'last6Months' | 'all';

export const Analytics: React.FC = () => {
  const { expenses } = useAppStore();
  const [timeRange, setTimeRange] = useState<TimeRange>('last90');

  // Filter expenses by time range
  const filteredExpenses = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();

    if (timeRange === 'thisMonth') {
      const key = getMonthKey();
      return expenses.filter((e) => e.date.startsWith(key));
    } else if (timeRange === 'lastMonth') {
      const d = new Date(currentYear, currentMonth - 1, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      return expenses.filter((e) => e.date.startsWith(key));
    } else {
      const cutoffDate = new Date();
      if (timeRange === 'last90') cutoffDate.setDate(cutoffDate.getDate() - 90);
      if (timeRange === 'last6Months') cutoffDate.setMonth(cutoffDate.getMonth() - 6);
      if (timeRange === 'all') cutoffDate.setFullYear(2000);

      return expenses.filter((e) => new Date(e.date) >= cutoffDate);
    }
  }, [expenses, timeRange]);

  // Category breakdown
  const categoryData = useMemo(() => {
    const total = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
    const byCategory = filteredExpenses.reduce((acc, curr) => {
      acc[curr.category] = (acc[curr.category] || 0) + curr.amount;
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(byCategory)
      .map(([name, amount], index) => ({
        name,
        amount,
        percentage: total > 0 ? (amount / total) * 100 : 0,
        color: COLORS[index % COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredExpenses]);

  // Monthly trends (last 6 months)
  const trendData = useMemo(() => {
    const months: Record<string, number> = {};
    const today = new Date();

    // Initialize last 6 months
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      months[key] = 0;
    }

    // Sum expenses by month
    expenses.forEach((e) => {
      const key = e.date.substring(0, 7);
      if (key in months) {
        months[key] += e.amount;
      }
    });

    return Object.entries(months).map(([month, amount]) => {
      const [year, m] = month.split('-');
      const date = new Date(parseInt(year), parseInt(m) - 1);
      return {
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        amount,
      };
    });
  }, [expenses]);

  const total = categoryData.reduce((sum, item) => sum + item.amount, 0);

  const timeRangeOptions = [
    { value: 'thisMonth', label: 'This Month' },
    { value: 'lastMonth', label: 'Last Month' },
    { value: 'last90', label: 'Last 90 Days' },
    { value: 'last6Months', label: 'Last 6 Months' },
    { value: 'all', label: 'All Time' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-slate-500">Visualize your spending habits</p>
        </div>
        <div className="w-48">
          <Select
            options={timeRangeOptions}
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value as TimeRange)}
          />
        </div>
      </div>

      {/* Summary */}
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-sm text-slate-500">Total Spent</p>
          <p className="text-4xl font-bold text-slate-900 dark:text-white">
            {formatCurrency(total)}
          </p>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No expenses for this period
              </p>
            ) : (
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="amount"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(value as number)}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Category List */}
        <Card>
          <CardHeader>
            <CardTitle>Category Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {categoryData.length === 0 ? (
              <p className="text-center text-slate-500 py-8">
                No expenses for this period
              </p>
            ) : (
              <ul className="space-y-4">
                {categoryData.map((cat) => (
                  <li key={cat.name}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-2">
                        <span
                          className="h-3 w-3 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        {cat.name}
                      </span>
                      <span className="font-medium">
                        {formatCurrency(cat.amount)}{' '}
                        <span className="text-slate-400">
                          ({Math.round(cat.percentage)}%)
                        </span>
                      </span>
                    </div>
                    <div className="h-2 bg-slate-100 rounded-full overflow-hidden dark:bg-slate-800">
                      <div
                        className="h-full rounded-full"
                        style={{
                          width: `${cat.percentage}%`,
                          backgroundColor: cat.color,
                        }}
                      />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Spending Trends */}
      <Card>
        <CardHeader>
          <CardTitle>Spending Trends (Last 6 Months)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData}>
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip formatter={(value) => formatCurrency(value as number)} />
                <Line
                  type="monotone"
                  dataKey="amount"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
