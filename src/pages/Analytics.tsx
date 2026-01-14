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
  BarChart,
  Bar,
  CartesianGrid,
} from 'recharts';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Select } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
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

  // Year-over-Year comparison data
  const yoyData = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const lastYear = currentYear - 1;

    // Get spending by month for current and last year
    const currentYearMonths: Record<number, number> = {};
    const lastYearMonths: Record<number, number> = {};

    // Initialize all months
    for (let i = 0; i < 12; i++) {
      currentYearMonths[i] = 0;
      lastYearMonths[i] = 0;
    }

    expenses.forEach((e) => {
      const expDate = new Date(e.date);
      const expYear = expDate.getFullYear();
      const expMonth = expDate.getMonth();

      if (expYear === currentYear) {
        currentYearMonths[expMonth] += e.amount;
      } else if (expYear === lastYear) {
        lastYearMonths[expMonth] += e.amount;
      }
    });

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return monthNames.map((name, i) => ({
      month: name,
      [currentYear]: currentYearMonths[i],
      [lastYear]: lastYearMonths[i],
      difference: currentYearMonths[i] - lastYearMonths[i],
      percentChange:
        lastYearMonths[i] > 0
          ? ((currentYearMonths[i] - lastYearMonths[i]) / lastYearMonths[i]) * 100
          : currentYearMonths[i] > 0
          ? 100
          : 0,
    }));
  }, [expenses]);

  // YoY Summary stats
  const yoySummary = useMemo(() => {
    const today = new Date();
    const currentYear = today.getFullYear();
    const lastYear = currentYear - 1;

    // Only compare up to current month
    const currentMonth = today.getMonth();

    let currentYearTotal = 0;
    let lastYearTotal = 0;

    yoyData.slice(0, currentMonth + 1).forEach((month) => {
      currentYearTotal += month[currentYear] as number;
      lastYearTotal += month[lastYear] as number;
    });

    const difference = currentYearTotal - lastYearTotal;
    const percentChange =
      lastYearTotal > 0
        ? ((currentYearTotal - lastYearTotal) / lastYearTotal) * 100
        : currentYearTotal > 0
        ? 100
        : 0;

    return {
      currentYear,
      lastYear,
      currentYearTotal,
      lastYearTotal,
      difference,
      percentChange,
    };
  }, [yoyData]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Analytics
          </h1>
          <p className="text-slate-500">Visualize your spending habits</p>
        </div>
        <div className="w-full sm:w-48">
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

      {/* Year-over-Year Comparison */}
      <Card>
        <CardHeader>
          <CardTitle>Year-over-Year Comparison</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* YoY Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-500 mb-1">{yoySummary.currentYear} (YTD)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(yoySummary.currentYearTotal)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-500 mb-1">{yoySummary.lastYear} (Same Period)</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">
                {formatCurrency(yoySummary.lastYearTotal)}
              </p>
            </div>
            <div className="bg-slate-50 dark:bg-slate-800 rounded-lg p-4">
              <p className="text-sm text-slate-500 mb-1">Change</p>
              <div className="flex items-center gap-2">
                <p
                  className={`text-2xl font-bold ${
                    yoySummary.difference < 0
                      ? 'text-green-600'
                      : yoySummary.difference > 0
                      ? 'text-red-600'
                      : 'text-slate-600'
                  }`}
                >
                  {yoySummary.difference >= 0 ? '+' : ''}
                  {formatCurrency(yoySummary.difference)}
                </p>
                <Badge
                  variant={
                    yoySummary.percentChange < 0
                      ? 'success'
                      : yoySummary.percentChange > 0
                      ? 'destructive'
                      : 'secondary'
                  }
                  className="flex items-center gap-1"
                >
                  {yoySummary.percentChange < 0 ? (
                    <TrendingDown className="h-3 w-3" />
                  ) : yoySummary.percentChange > 0 ? (
                    <TrendingUp className="h-3 w-3" />
                  ) : (
                    <Minus className="h-3 w-3" />
                  )}
                  {Math.abs(Math.round(yoySummary.percentChange))}%
                </Badge>
              </div>
            </div>
          </div>

          {/* YoY Bar Chart */}
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={yoyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => `$${value}`} />
                <Tooltip
                  formatter={(value) => formatCurrency(value as number)}
                />
                <Legend />
                <Bar
                  dataKey={yoySummary.currentYear}
                  fill="#3b82f6"
                  name={`${yoySummary.currentYear}`}
                />
                <Bar
                  dataKey={yoySummary.lastYear}
                  fill="#94a3b8"
                  name={`${yoySummary.lastYear}`}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Monthly Breakdown Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-slate-700">
                  <th className="text-left py-2 px-3 font-medium text-slate-500">Month</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-500">{yoySummary.currentYear}</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-500">{yoySummary.lastYear}</th>
                  <th className="text-right py-2 px-3 font-medium text-slate-500">Change</th>
                </tr>
              </thead>
              <tbody>
                {yoyData.map((month) => {
                  const current = month[yoySummary.currentYear] as number;
                  const last = month[yoySummary.lastYear] as number;
                  const diff = month.difference;
                  const pctChange = month.percentChange;

                  return (
                    <tr key={month.month} className="border-b dark:border-slate-800">
                      <td className="py-2 px-3 font-medium">{month.month}</td>
                      <td className="py-2 px-3 text-right">{formatCurrency(current)}</td>
                      <td className="py-2 px-3 text-right text-slate-500">{formatCurrency(last)}</td>
                      <td className="py-2 px-3 text-right">
                        {current > 0 || last > 0 ? (
                          <span
                            className={`inline-flex items-center gap-1 ${
                              diff < 0
                                ? 'text-green-600'
                                : diff > 0
                                ? 'text-red-600'
                                : 'text-slate-500'
                            }`}
                          >
                            {diff < 0 ? (
                              <TrendingDown className="h-3 w-3" />
                            ) : diff > 0 ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : null}
                            {diff >= 0 ? '+' : ''}
                            {Math.round(pctChange)}%
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
