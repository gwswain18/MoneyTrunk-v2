import { useState, useMemo } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Select } from '../components/ui/select';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency, formatDateShort, getMonthKey } from '../lib/utils';
import { CATEGORIES } from '../types';

export const Expenses: React.FC = () => {
  const { expenses, settings, addExpense, deleteExpense } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
  });

  // Get available months
  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    months.add(getMonthKey());
    expenses.forEach((e) => {
      const key = e.date.substring(0, 7);
      months.add(key);
    });
    return Array.from(months).sort().reverse();
  }, [expenses]);

  // Filter expenses by selected month
  const filteredExpenses = useMemo(() => {
    return expenses
      .filter((e) => e.date.startsWith(selectedMonth))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [expenses, selectedMonth]);

  // Calculate monthly total
  const monthlyTotal = useMemo(() => {
    return filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  }, [filteredExpenses]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addExpense({
      description: formData.description,
      amount: parseFloat(formData.amount),
      category: formData.category,
      date: formData.date,
    });
    setIsModalOpen(false);
    setFormData({
      description: '',
      amount: '',
      category: 'Other',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const categoryOptions = CATEGORIES.map((cat) => ({ value: cat, label: cat }));
  const monthOptions = availableMonths.map((m) => {
    const [year, month] = m.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1);
    return {
      value: m,
      label: date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
    };
  });

  const budgetProgress = settings.monthlyBudget > 0
    ? (monthlyTotal / settings.monthlyBudget) * 100
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Expenses
          </h1>
          <p className="text-slate-500">Track your daily spending</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Expense
        </Button>
      </div>

      {/* Month Selector & Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <Select
              label="Select Month"
              options={monthOptions}
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
            />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Monthly Total</p>
            <p className="text-3xl font-bold text-slate-900 dark:text-white">
              {formatCurrency(monthlyTotal)}
            </p>
            {settings.monthlyBudget > 0 && (
              <div className="mt-4">
                <Progress
                  value={monthlyTotal}
                  max={settings.monthlyBudget}
                  showLabel
                  indicatorClassName={
                    budgetProgress > 100 ? 'bg-red-500' : budgetProgress > 80 ? 'bg-yellow-500' : 'bg-green-500'
                  }
                />
                <p className="mt-1 text-sm text-slate-500">
                  of {formatCurrency(settings.monthlyBudget)} budget
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <p className="text-slate-500">No expenses for this month</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((expense) => (
                <li
                  key={expense.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {expense.description}
                    </p>
                    <p className="text-sm text-slate-500">
                      {expense.category} • {formatDateShort(expense.date)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-slate-900 dark:text-white">
                      {formatCurrency(expense.amount)}
                    </p>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => deleteExpense(expense.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Add Expense Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogClose onClose={() => setIsModalOpen(false)} />
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Description"
              placeholder="What did you spend on?"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                required
              />
              <Input
                label="Date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                required
              />
            </div>
            <Select
              label="Category"
              options={categoryOptions}
              value={formData.category}
              onChange={(e) =>
                setFormData({ ...formData, category: e.target.value })
              }
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add Expense</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
