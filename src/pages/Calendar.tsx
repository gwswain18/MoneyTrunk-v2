import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Receipt, Wallet } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency } from '../lib/utils';
import { BillStatus } from '../types';

interface DayData {
  date: string;
  expenses: { description: string; amount: number; category: string }[];
  income: { sourceName: string; amount: number }[];
  bills: { name: string; amount: number; status: BillStatus }[];
  subscriptions: { name: string; amount: number }[];
}

export const Calendar: React.FC = () => {
  const { expenses, income, bills, subscriptions } = useAppStore();
  const [currentDate, setCurrentDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  // Get calendar data
  const calendarData = useMemo(() => {
    const data: Record<string, DayData> = {};

    // Add expenses
    expenses.forEach((exp) => {
      if (!data[exp.date]) {
        data[exp.date] = { date: exp.date, expenses: [], income: [], bills: [], subscriptions: [] };
      }
      data[exp.date].expenses.push({
        description: exp.description,
        amount: exp.amount,
        category: exp.category,
      });
    });

    // Add income (by next expected date)
    income.forEach((inc) => {
      if (!data[inc.nextExpectedDate]) {
        data[inc.nextExpectedDate] = { date: inc.nextExpectedDate, expenses: [], income: [], bills: [], subscriptions: [] };
      }
      data[inc.nextExpectedDate].income.push({
        sourceName: inc.sourceName,
        amount: inc.amount,
      });
    });

    // Add bills
    bills.forEach((bill) => {
      if (!data[bill.dueDate]) {
        data[bill.dueDate] = { date: bill.dueDate, expenses: [], income: [], bills: [], subscriptions: [] };
      }
      data[bill.dueDate].bills.push({
        name: bill.name,
        amount: bill.amountDue,
        status: bill.status,
      });
    });

    // Add subscriptions
    subscriptions.forEach((sub) => {
      if (!data[sub.nextBillingDate]) {
        data[sub.nextBillingDate] = { date: sub.nextBillingDate, expenses: [], income: [], bills: [], subscriptions: [] };
      }
      data[sub.nextBillingDate].subscriptions.push({
        name: sub.name,
        amount: sub.amount,
      });
    });

    return data;
  }, [expenses, income, bills, subscriptions]);

  // Build calendar grid
  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startDayOfWeek = firstDay.getDay();

    const days: (number | null)[] = [];

    // Add empty cells for days before the first of the month
    for (let i = 0; i < startDayOfWeek; i++) {
      days.push(null);
    }

    // Add days of the month
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }

    return days;
  }, [year, month]);

  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const navigateMonth = (direction: number) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCurrentDate(newDate);
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const getDayKey = (day: number) => {
    const d = new Date(year, month, day);
    return d.toISOString().split('T')[0];
  };

  const isToday = (day: number) => {
    const today = new Date();
    return (
      day === today.getDate() &&
      month === today.getMonth() &&
      year === today.getFullYear()
    );
  };

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedData = selectedDate ? calendarData[selectedDate] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Calendar
          </h1>
          <p className="text-slate-500">Visual overview of your money flow</p>
        </div>
      </div>

      {/* Calendar Navigation */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="icon" onClick={() => navigateMonth(-1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-semibold">{monthName}</h2>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
            </div>
            <Button variant="outline" size="icon" onClick={() => navigateMonth(1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Days of week header */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-slate-500 py-2">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={`empty-${index}`} className="aspect-square" />;
              }

              const dateKey = getDayKey(day);
              const dayData = calendarData[dateKey];
              const hasData = dayData && (
                dayData.expenses.length > 0 ||
                dayData.income.length > 0 ||
                dayData.bills.length > 0 ||
                dayData.subscriptions.length > 0
              );

              const totalExpenses = dayData?.expenses.reduce((sum, e) => sum + e.amount, 0) || 0;
              const totalIncome = dayData?.income.reduce((sum, i) => sum + i.amount, 0) || 0;
              const totalBills = dayData?.bills.reduce((sum, b) => sum + b.amount, 0) || 0;
              const totalSubs = dayData?.subscriptions.reduce((sum, s) => sum + s.amount, 0) || 0;

              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(dateKey)}
                  className={`
                    aspect-square p-1 rounded-lg text-left transition-colors
                    ${isToday(day) ? 'bg-emerald-100 dark:bg-emerald-900/30' : ''}
                    ${selectedDate === dateKey ? 'ring-2 ring-emerald-500' : ''}
                    ${hasData ? 'hover:bg-slate-100 dark:hover:bg-slate-800' : ''}
                  `}
                >
                  <div className="h-full flex flex-col">
                    <span
                      className={`text-sm font-medium ${
                        isToday(day)
                          ? 'text-emerald-700 dark:text-emerald-300'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {day}
                    </span>
                    {hasData && (
                      <div className="flex flex-wrap gap-0.5 mt-auto">
                        {totalIncome > 0 && (
                          <div className="w-2 h-2 rounded-full bg-green-500" title={`Income: ${formatCurrency(totalIncome)}`} />
                        )}
                        {totalExpenses > 0 && (
                          <div className="w-2 h-2 rounded-full bg-red-500" title={`Expenses: ${formatCurrency(totalExpenses)}`} />
                        )}
                        {(totalBills > 0 || totalSubs > 0) && (
                          <div className="w-2 h-2 rounded-full bg-blue-500" title={`Bills: ${formatCurrency(totalBills + totalSubs)}`} />
                        )}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center gap-4 mt-4 pt-4 border-t dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-slate-600 dark:text-slate-400">Income</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-slate-600 dark:text-slate-400">Expenses</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-slate-600 dark:text-slate-400">Bills</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Selected Day Details */}
      {selectedData && (
        <Card>
          <CardHeader>
            <CardTitle>
              {new Date(selectedDate!).toLocaleDateString('en-US', {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
                year: 'numeric',
              })}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Income */}
            {selectedData.income.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-green-600 mb-2">
                  <TrendingUp className="h-4 w-4" /> Income
                </h4>
                <div className="space-y-1">
                  {selectedData.income.map((inc, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{inc.sourceName}</span>
                      <span className="text-green-600 font-medium">{formatCurrency(inc.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Expenses */}
            {selectedData.expenses.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-red-600 mb-2">
                  <TrendingDown className="h-4 w-4" /> Expenses
                </h4>
                <div className="space-y-1">
                  {selectedData.expenses.map((exp, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">
                        {exp.description}
                        <span className="text-slate-400 ml-1">({exp.category})</span>
                      </span>
                      <span className="text-red-600 font-medium">{formatCurrency(exp.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Bills */}
            {selectedData.bills.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-blue-600 mb-2">
                  <Receipt className="h-4 w-4" /> Bills Due
                </h4>
                <div className="space-y-1">
                  {selectedData.bills.map((bill, i) => (
                    <div key={i} className="flex justify-between items-center text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{bill.name}</span>
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={bill.status === BillStatus.Paid ? 'success' : bill.status === BillStatus.Overdue ? 'destructive' : 'secondary'}
                        >
                          {bill.status}
                        </Badge>
                        <span className="text-blue-600 font-medium">{formatCurrency(bill.amount)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subscriptions */}
            {selectedData.subscriptions.length > 0 && (
              <div>
                <h4 className="flex items-center gap-2 text-sm font-medium text-purple-600 mb-2">
                  <Wallet className="h-4 w-4" /> Subscriptions
                </h4>
                <div className="space-y-1">
                  {selectedData.subscriptions.map((sub, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-slate-700 dark:text-slate-300">{sub.name}</span>
                      <span className="text-purple-600 font-medium">{formatCurrency(sub.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Day Summary */}
            <div className="border-t pt-4 dark:border-slate-800">
              <div className="flex justify-between text-sm font-medium">
                <span>Net for day:</span>
                {(() => {
                  const totalIn = selectedData.income.reduce((sum, i) => sum + i.amount, 0);
                  const totalOut =
                    selectedData.expenses.reduce((sum, e) => sum + e.amount, 0) +
                    selectedData.bills.reduce((sum, b) => sum + b.amount, 0) +
                    selectedData.subscriptions.reduce((sum, s) => sum + s.amount, 0);
                  const net = totalIn - totalOut;
                  return (
                    <span className={net >= 0 ? 'text-green-600' : 'text-red-600'}>
                      {net >= 0 ? '+' : ''}{formatCurrency(net)}
                    </span>
                  );
                })()}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
