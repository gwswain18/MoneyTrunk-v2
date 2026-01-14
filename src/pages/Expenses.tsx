import { useState, useMemo, useEffect } from 'react';
import { Plus, Trash2, Repeat, Edit2, Pause, Play, CheckSquare, Square, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
import { CATEGORIES, Frequency, RecurringExpense } from '../types';

export const Expenses: React.FC = () => {
  const {
    expenses,
    recurringExpenses,
    settings,
    addExpense,
    deleteExpense,
    addRecurringExpense,
    updateRecurringExpense,
    deleteRecurringExpense,
    processRecurringExpenses,
  } = useAppStore();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringModalOpen, setIsRecurringModalOpen] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState<RecurringExpense | null>(null);
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Other',
    date: new Date().toISOString().split('T')[0],
  });
  const [recurringFormData, setRecurringFormData] = useState({
    description: '',
    amount: '',
    category: 'Other',
    frequency: Frequency.Monthly,
    startDate: new Date().toISOString().split('T')[0],
  });

  // Bulk selection state
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteConfirmOpen, setBulkDeleteConfirmOpen] = useState(false);

  // Toggle individual selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select/deselect all
  const toggleSelectAll = () => {
    if (selectedIds.size === filteredExpenses.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredExpenses.map((e) => e.id)));
    }
  };

  // Delete selected expenses
  const handleBulkDelete = () => {
    selectedIds.forEach((id) => deleteExpense(id));
    setSelectedIds(new Set());
    setBulkDeleteConfirmOpen(false);
    setBulkMode(false);
  };

  // Cancel bulk mode
  const cancelBulkMode = () => {
    setBulkMode(false);
    setSelectedIds(new Set());
  };

  // Process recurring expenses on mount
  useEffect(() => {
    processRecurringExpenses();
  }, [processRecurringExpenses]);

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

  const handleRecurringSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      description: recurringFormData.description,
      amount: parseFloat(recurringFormData.amount),
      category: recurringFormData.category,
      frequency: recurringFormData.frequency,
      startDate: recurringFormData.startDate,
      nextDueDate: recurringFormData.startDate,
      isActive: true,
    };

    if (editingRecurring) {
      updateRecurringExpense(editingRecurring.id, data);
    } else {
      addRecurringExpense(data);
    }

    closeRecurringModal();
  };

  const openEditRecurring = (rec: RecurringExpense) => {
    setEditingRecurring(rec);
    setRecurringFormData({
      description: rec.description,
      amount: rec.amount.toString(),
      category: rec.category,
      frequency: rec.frequency,
      startDate: rec.startDate,
    });
    setIsRecurringModalOpen(true);
  };

  const closeRecurringModal = () => {
    setIsRecurringModalOpen(false);
    setEditingRecurring(null);
    setRecurringFormData({
      description: '',
      amount: '',
      category: 'Other',
      frequency: Frequency.Monthly,
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  const toggleRecurringActive = (rec: RecurringExpense) => {
    updateRecurringExpense(rec.id, { isActive: !rec.isActive });
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

  const frequencyOptions = [
    { value: Frequency.Weekly, label: 'Weekly' },
    { value: Frequency.BiWeekly, label: 'Bi-weekly' },
    { value: Frequency.Monthly, label: 'Monthly' },
    { value: Frequency.Yearly, label: 'Yearly' },
  ];

  const budgetProgress = settings.monthlyBudget > 0
    ? (monthlyTotal / settings.monthlyBudget) * 100
    : 0;

  const getFrequencyLabel = (freq: Frequency) => {
    switch (freq) {
      case Frequency.Weekly:
        return 'Weekly';
      case Frequency.BiWeekly:
        return 'Bi-weekly';
      case Frequency.Monthly:
        return 'Monthly';
      case Frequency.Yearly:
        return 'Yearly';
      default:
        return freq;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Expenses
          </h1>
          <p className="text-slate-500">Track your daily spending</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {bulkMode ? (
            <>
              <Button
                variant="outline"
                onClick={cancelBulkMode}
                className="flex-1 sm:flex-none"
              >
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={() => setBulkDeleteConfirmOpen(true)}
                disabled={selectedIds.size === 0}
                className="flex-1 sm:flex-none"
              >
                <Trash2 className="mr-2 h-4 w-4" /> Delete ({selectedIds.size})
              </Button>
            </>
          ) : (
            <>
              {filteredExpenses.length > 0 && (
                <Button
                  variant="outline"
                  onClick={() => setBulkMode(true)}
                  className="flex-1 sm:flex-none"
                >
                  <CheckSquare className="mr-2 h-4 w-4" /> Select
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setIsRecurringModalOpen(true)}
                className="flex-1 sm:flex-none"
              >
                <Repeat className="mr-2 h-4 w-4" /> Recurring
              </Button>
              <Button onClick={() => setIsModalOpen(true)} className="flex-1 sm:flex-none">
                <Plus className="mr-2 h-4 w-4" /> Add Expense
              </Button>
            </>
          )}
        </div>
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

      {/* Recurring Expenses */}
      {recurringExpenses.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Repeat className="h-5 w-5" /> Recurring Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {recurringExpenses.map((rec) => (
                <li key={rec.id} className="py-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className={`font-medium ${rec.isActive ? 'text-slate-900 dark:text-white' : 'text-slate-400'}`}>
                          {rec.description}
                        </p>
                        {!rec.isActive && (
                          <Badge variant="secondary">Paused</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {rec.category} • {getFrequencyLabel(rec.frequency)} • Next: {formatDateShort(rec.nextDueDate)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-2">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(rec.amount)}
                      </p>
                      <div className="flex items-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => toggleRecurringActive(rec)}
                          title={rec.isActive ? 'Pause' : 'Resume'}
                        >
                          {rec.isActive ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditRecurring(rec)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-500"
                          onClick={() => deleteRecurringExpense(rec.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Expenses List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Transactions</CardTitle>
            {bulkMode && filteredExpenses.length > 0 && (
              <Button variant="ghost" size="sm" onClick={toggleSelectAll}>
                {selectedIds.size === filteredExpenses.length ? (
                  <>
                    <CheckSquare className="mr-2 h-4 w-4" /> Deselect All
                  </>
                ) : (
                  <>
                    <Square className="mr-2 h-4 w-4" /> Select All
                  </>
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filteredExpenses.length === 0 ? (
            <p className="text-slate-500">No expenses for this month</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredExpenses.map((expense) => (
                <li
                  key={expense.id}
                  className={`py-4 ${bulkMode ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-900 -mx-4 px-4 rounded' : ''}`}
                  onClick={bulkMode ? () => toggleSelection(expense.id) : undefined}
                >
                  <div className="flex items-center justify-between gap-3">
                    {bulkMode && (
                      <div className="shrink-0">
                        {selectedIds.has(expense.id) ? (
                          <CheckSquare className="h-5 w-5 text-emerald-600" />
                        ) : (
                          <Square className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {expense.description}
                        </p>
                        {expense.recurringExpenseId && (
                          <span title="From recurring expense">
                            <Repeat className="h-3 w-3 text-slate-400" />
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-slate-500">
                        {expense.category} • {formatDateShort(expense.date)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <p className="font-semibold text-slate-900 dark:text-white">
                        {formatCurrency(expense.amount)}
                      </p>
                      {!bulkMode && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-500"
                          onClick={() => deleteExpense(expense.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
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

      {/* Recurring Expense Modal */}
      <Dialog open={isRecurringModalOpen} onOpenChange={closeRecurringModal}>
        <DialogClose onClose={closeRecurringModal} />
        <DialogHeader>
          <DialogTitle>
            {editingRecurring ? 'Edit Recurring Expense' : 'Add Recurring Expense'}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleRecurringSubmit} className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Recurring expenses are automatically added on their due date.
            </p>
            <Input
              label="Description"
              placeholder="e.g., Gym membership"
              value={recurringFormData.description}
              onChange={(e) =>
                setRecurringFormData({ ...recurringFormData, description: e.target.value })
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
                value={recurringFormData.amount}
                onChange={(e) =>
                  setRecurringFormData({ ...recurringFormData, amount: e.target.value })
                }
                required
              />
              <Select
                label="Frequency"
                options={frequencyOptions}
                value={recurringFormData.frequency}
                onChange={(e) =>
                  setRecurringFormData({ ...recurringFormData, frequency: e.target.value as Frequency })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                options={categoryOptions}
                value={recurringFormData.category}
                onChange={(e) =>
                  setRecurringFormData({ ...recurringFormData, category: e.target.value })
                }
              />
              <Input
                label="Start Date"
                type="date"
                value={recurringFormData.startDate}
                onChange={(e) =>
                  setRecurringFormData({ ...recurringFormData, startDate: e.target.value })
                }
                required
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeRecurringModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingRecurring ? 'Save Changes' : 'Add Recurring'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Delete Confirmation */}
      <Dialog open={bulkDeleteConfirmOpen} onOpenChange={setBulkDeleteConfirmOpen}>
        <DialogClose onClose={() => setBulkDeleteConfirmOpen(false)} />
        <DialogHeader>
          <DialogTitle className="text-red-600">Delete {selectedIds.size} Expenses</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-slate-600 dark:text-slate-400">
            Are you sure you want to delete {selectedIds.size} selected expense{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
          </p>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setBulkDeleteConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBulkDelete}>
              Delete {selectedIds.size} Expense{selectedIds.size > 1 ? 's' : ''}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
