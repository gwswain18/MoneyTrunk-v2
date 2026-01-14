import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Wallet,
  Receipt,
  TrendingUp,
  PiggyBank,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency, formatDateShort, getMonthKey } from '../lib/utils';
import { BillStatus, Frequency } from '../types';

export const Dashboard: React.FC = () => {
  const { bills, subscriptions, income, expenses, savings, borrowed, lent, settings } =
    useAppStore();

  const currentMonthKey = getMonthKey();

  // Calculate monthly income estimate
  const monthlyIncome = useMemo(() => {
    return income.reduce((sum, item) => {
      switch (item.frequency) {
        case Frequency.Monthly:
          return sum + item.amount;
        case Frequency.BiWeekly:
          return sum + item.amount * 2;
        case Frequency.Weekly:
          return sum + item.amount * 4;
        default:
          return sum;
      }
    }, 0);
  }, [income]);

  // Calculate this month's expenses
  const monthlyExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(currentMonthKey))
      .reduce((sum, e) => sum + e.amount, 0);
  }, [expenses, currentMonthKey]);

  // Bills summary
  const billsSummary = useMemo(() => {
    const monthBills = bills.filter((b) => b.dueDate.startsWith(currentMonthKey));
    const paid = monthBills.filter((b) => b.status === BillStatus.Paid);
    const total = monthBills.reduce((sum, b) => sum + b.amountDue, 0);
    const paidAmount = paid.reduce((sum, b) => sum + (b.amountPaid || b.amountDue), 0);
    return {
      total,
      paid: paidAmount,
      count: monthBills.length,
      paidCount: paid.length,
    };
  }, [bills, currentMonthKey]);

  // Subscriptions total
  const subscriptionsTotal = useMemo(() => {
    return subscriptions.reduce((sum, s) => {
      return sum + (s.billingCycle === 'monthly' ? s.amount : s.amount / 12);
    }, 0);
  }, [subscriptions]);

  // Total savings
  const totalSavings = useMemo(() => {
    return savings.reduce((sum, s) => sum + s.currentAmount, 0);
  }, [savings]);

  // Loans summary
  const loansSummary = useMemo(() => {
    const youOwe = borrowed.reduce((sum, b) => sum + b.currentBalance, 0);
    const theyOwe = lent.reduce((sum, l) => sum + l.currentBalance, 0);
    return { youOwe, theyOwe };
  }, [borrowed, lent]);

  // Upcoming bills (next 7 days)
  const upcomingBills = useMemo(() => {
    const today = new Date();
    const nextWeek = new Date(today);
    nextWeek.setDate(nextWeek.getDate() + 7);

    return bills
      .filter((b) => {
        const dueDate = new Date(b.dueDate);
        return (
          b.status !== BillStatus.Paid &&
          dueDate >= today &&
          dueDate <= nextWeek
        );
      })
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
      .slice(0, 5);
  }, [bills]);

  // Recent expenses
  const recentExpenses = useMemo(() => {
    return [...expenses]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 5);
  }, [expenses]);

  // Budget progress
  const budgetProgress = settings.monthlyBudget > 0
    ? (monthlyExpenses / settings.monthlyBudget) * 100
    : 0;

  const greeting = settings.userName
    ? `Welcome back, ${settings.userName}!`
    : 'Welcome back!';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          {greeting}
        </h1>
        <p className="text-slate-500 dark:text-slate-400">
          Here's your financial overview
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Monthly Income */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Monthly Income
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(monthlyIncome)}
                </p>
              </div>
              <div className="rounded-full bg-green-100 p-3 dark:bg-green-900/30">
                <Wallet className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bills & Subs */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Bills + Subs
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(billsSummary.total + subscriptionsTotal)}
                </p>
              </div>
              <div className="rounded-full bg-blue-100 p-3 dark:bg-blue-900/30">
                <Receipt className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Monthly Spending */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Spent This Month
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(monthlyExpenses)}
                </p>
              </div>
              <div className="rounded-full bg-orange-100 p-3 dark:bg-orange-900/30">
                <TrendingUp className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Total Savings */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total Savings
                </p>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {formatCurrency(totalSavings)}
                </p>
              </div>
              <div className="rounded-full bg-purple-100 p-3 dark:bg-purple-900/30">
                <PiggyBank className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Budget Progress */}
      {settings.monthlyBudget > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Monthly Budget</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">
                  {formatCurrency(monthlyExpenses)} of {formatCurrency(settings.monthlyBudget)}
                </span>
                <span
                  className={
                    budgetProgress > 100
                      ? 'text-red-600'
                      : budgetProgress > 80
                      ? 'text-yellow-600'
                      : 'text-green-600'
                  }
                >
                  {Math.round(budgetProgress)}%
                </span>
              </div>
              <Progress
                value={monthlyExpenses}
                max={settings.monthlyBudget}
                indicatorClassName={
                  budgetProgress > 100
                    ? 'bg-red-500'
                    : budgetProgress > 80
                    ? 'bg-yellow-500'
                    : 'bg-green-500'
                }
              />
              <p className="text-sm text-slate-500">
                {settings.monthlyBudget - monthlyExpenses > 0
                  ? `${formatCurrency(settings.monthlyBudget - monthlyExpenses)} remaining`
                  : `${formatCurrency(Math.abs(settings.monthlyBudget - monthlyExpenses))} over budget`}
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Upcoming Bills */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming Bills</CardTitle>
            <Link to="/bills">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {upcomingBills.length === 0 ? (
              <div className="flex items-center gap-2 text-slate-500">
                <CheckCircle2 className="h-5 w-5 text-green-500" />
                <span>No upcoming bills in the next 7 days</span>
              </div>
            ) : (
              <ul className="space-y-3">
                {upcomingBills.map((bill) => (
                  <li
                    key={bill.id}
                    className="flex items-center justify-between rounded-lg border border-slate-100 p-3 dark:border-slate-800"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {bill.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        Due {formatDateShort(bill.dueDate)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(bill.amountDue)}
                      </p>
                      <Badge variant="warning">Pending</Badge>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        {/* Recent Expenses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Expenses</CardTitle>
            <Link to="/expenses">
              <Button variant="ghost" size="sm">
                View All <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentExpenses.length === 0 ? (
              <p className="text-slate-500">No expenses recorded yet</p>
            ) : (
              <ul className="space-y-3">
                {recentExpenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center justify-between"
                  >
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">
                        {expense.description}
                      </p>
                      <p className="text-sm text-slate-500">
                        {expense.category} • {formatDateShort(expense.date)}
                      </p>
                    </div>
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(expense.amount)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Loans Summary */}
      {(loansSummary.youOwe > 0 || loansSummary.theyOwe > 0) && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Loans Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                <p className="text-sm text-red-600 dark:text-red-400">You Owe</p>
                <p className="text-xl font-bold text-red-700 dark:text-red-300">
                  {formatCurrency(loansSummary.youOwe)}
                </p>
              </div>
              <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                <p className="text-sm text-green-600 dark:text-green-400">
                  They Owe You
                </p>
                <p className="text-xl font-bold text-green-700 dark:text-green-300">
                  {formatCurrency(loansSummary.theyOwe)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
