import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Target, AlertTriangle } from 'lucide-react';
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
import { formatCurrency, getMonthKey } from '../lib/utils';
import { CATEGORIES, CategoryBudget } from '../types';

export const Budget: React.FC = () => {
  const { expenses, settings, updateSettings } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<CategoryBudget | null>(null);
  const [formData, setFormData] = useState({
    category: '',
    limit: '',
  });

  const currentMonth = getMonthKey();

  // Calculate spending per category for current month
  const categorySpending = useMemo(() => {
    const spending: Record<string, number> = {};
    expenses
      .filter((e) => e.date.startsWith(currentMonth))
      .forEach((e) => {
        spending[e.category] = (spending[e.category] || 0) + e.amount;
      });
    return spending;
  }, [expenses, currentMonth]);

  // Total monthly spending
  const totalSpending = useMemo(() => {
    return Object.values(categorySpending).reduce((sum, val) => sum + val, 0);
  }, [categorySpending]);

  // Categories without budgets
  const availableCategories = useMemo(() => {
    const usedCategories = new Set(settings.categoryBudgets?.map((b) => b.category) || []);
    return CATEGORIES.filter((cat) => !usedCategories.has(cat));
  }, [settings.categoryBudgets]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newBudget: CategoryBudget = {
      category: formData.category,
      limit: parseFloat(formData.limit),
    };

    const currentBudgets = settings.categoryBudgets || [];

    if (editingBudget) {
      // Update existing
      updateSettings({
        categoryBudgets: currentBudgets.map((b) =>
          b.category === editingBudget.category ? newBudget : b
        ),
      });
    } else {
      // Add new
      updateSettings({
        categoryBudgets: [...currentBudgets, newBudget],
      });
    }

    closeModal();
  };

  const deleteBudget = (category: string) => {
    updateSettings({
      categoryBudgets: (settings.categoryBudgets || []).filter((b) => b.category !== category),
    });
  };

  const openEditModal = (budget: CategoryBudget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      limit: budget.limit.toString(),
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingBudget(null);
    setFormData({ category: '', limit: '' });
  };

  const getStatusColor = (spent: number, limit: number) => {
    const percent = (spent / limit) * 100;
    if (percent >= 100) return 'bg-red-500';
    if (percent >= 80) return 'bg-yellow-500';
    return 'bg-emerald-500';
  };

  const categoryOptions = (editingBudget ? [editingBudget.category, ...availableCategories] : availableCategories)
    .map((cat) => ({ value: cat, label: cat }));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Budget
          </h1>
          <p className="text-slate-500">Set and track spending limits by category</p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          disabled={availableCategories.length === 0}
          className="w-full sm:w-auto"
        >
          <Plus className="mr-2 h-4 w-4" /> Add Category Budget
        </Button>
      </div>

      {/* Overall Budget Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" /> Monthly Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
              <p className="text-sm text-blue-600 dark:text-blue-400">Overall Budget</p>
              <p className="text-2xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(settings.monthlyBudget)}
              </p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
              <p className="text-sm text-red-600 dark:text-red-400">Total Spent</p>
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {formatCurrency(totalSpending)}
              </p>
            </div>
            <div
              className={`rounded-lg p-4 ${
                settings.monthlyBudget - totalSpending >= 0
                  ? 'bg-emerald-50 dark:bg-emerald-900/20'
                  : 'bg-orange-50 dark:bg-orange-900/20'
              }`}
            >
              <p
                className={`text-sm ${
                  settings.monthlyBudget - totalSpending >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-orange-600 dark:text-orange-400'
                }`}
              >
                Remaining
              </p>
              <p
                className={`text-2xl font-bold ${
                  settings.monthlyBudget - totalSpending >= 0
                    ? 'text-emerald-700 dark:text-emerald-300'
                    : 'text-orange-700 dark:text-orange-300'
                }`}
              >
                {formatCurrency(Math.abs(settings.monthlyBudget - totalSpending))}
                {settings.monthlyBudget - totalSpending < 0 && ' over'}
              </p>
            </div>
          </div>
          {settings.monthlyBudget > 0 && (
            <div className="mt-4">
              <Progress
                value={totalSpending}
                max={settings.monthlyBudget}
                showLabel
                indicatorClassName={getStatusColor(totalSpending, settings.monthlyBudget)}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Category Budgets */}
      <Card>
        <CardHeader>
          <CardTitle>Category Budgets</CardTitle>
        </CardHeader>
        <CardContent>
          {!settings.categoryBudgets || settings.categoryBudgets.length === 0 ? (
            <p className="text-slate-500 text-center py-8">
              No category budgets set. Add one to start tracking spending by category.
            </p>
          ) : (
            <div className="space-y-4">
              {settings.categoryBudgets.map((budget) => {
                const spent = categorySpending[budget.category] || 0;
                const percent = budget.limit > 0 ? (spent / budget.limit) * 100 : 0;
                const isOver = spent > budget.limit;
                const isWarning = percent >= 80 && !isOver;

                return (
                  <div key={budget.category} className="border rounded-lg p-4 dark:border-slate-800">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2">
                        <h4 className="font-medium text-slate-900 dark:text-white">
                          {budget.category}
                        </h4>
                        {isOver && (
                          <Badge variant="destructive" className="flex items-center gap-1">
                            <AlertTriangle className="h-3 w-3" /> Over budget
                          </Badge>
                        )}
                        {isWarning && (
                          <Badge variant="warning" className="flex items-center gap-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                            <AlertTriangle className="h-3 w-3" /> Near limit
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-slate-500">
                          {formatCurrency(spent)} / {formatCurrency(budget.limit)}
                        </span>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => openEditModal(budget)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="text-slate-400 hover:text-red-500"
                          onClick={() => deleteBudget(budget.category)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <Progress
                      value={spent}
                      max={budget.limit}
                      indicatorClassName={getStatusColor(spent, budget.limit)}
                    />
                    <p className="text-xs text-slate-500 mt-2">
                      {percent.toFixed(0)}% used • {formatCurrency(Math.max(0, budget.limit - spent))} remaining
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Unbudgeted Categories */}
      {Object.keys(categorySpending).filter(
        (cat) => !settings.categoryBudgets?.some((b) => b.category === cat)
      ).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Unbudgeted Spending</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(categorySpending)
                .filter(([cat]) => !settings.categoryBudgets?.some((b) => b.category === cat))
                .sort((a, b) => b[1] - a[1])
                .map(([category, amount]) => (
                  <div
                    key={category}
                    className="flex items-center justify-between py-2 border-b last:border-0 dark:border-slate-800"
                  >
                    <span className="text-slate-700 dark:text-slate-300">{category}</span>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{formatCurrency(amount)}</span>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setFormData({ category, limit: '' });
                          setIsModalOpen(true);
                        }}
                      >
                        Set Budget
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add/Edit Budget Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogClose onClose={closeModal} />
        <DialogHeader>
          <DialogTitle>
            {editingBudget ? 'Edit Category Budget' : 'Add Category Budget'}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              label="Category"
              options={categoryOptions}
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              disabled={!!editingBudget}
            />
            <Input
              label="Monthly Limit"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={formData.limit}
              onChange={(e) => setFormData({ ...formData, limit: e.target.value })}
              required
            />
            {formData.category && categorySpending[formData.category] && (
              <p className="text-sm text-slate-500">
                Current month spending: {formatCurrency(categorySpending[formData.category])}
              </p>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" disabled={!formData.category || !formData.limit}>
                {editingBudget ? 'Save Changes' : 'Add Budget'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
