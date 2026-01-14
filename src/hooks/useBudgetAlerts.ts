import { useEffect, useRef } from 'react';
import { useAppStore } from '../stores/useAppStore';
import {
  showBudgetWarning,
  showOverallBudgetWarning,
} from '../services/notifications';
import { getMonthKey } from '../lib/utils';

export const useBudgetAlerts = () => {
  const { expenses, settings } = useAppStore();
  const previousExpenseCount = useRef(expenses.length);

  useEffect(() => {
    // Only check when a new expense is added
    if (expenses.length <= previousExpenseCount.current) {
      previousExpenseCount.current = expenses.length;
      return;
    }

    previousExpenseCount.current = expenses.length;

    // Don't check if notifications are disabled
    if (!settings.notificationsEnabled) return;

    const currentMonth = getMonthKey();
    const threshold = settings.budgetAlertThreshold || 80;

    // Calculate current month spending
    const monthExpenses = expenses.filter((e) => e.date.startsWith(currentMonth));
    const totalSpent = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Check overall budget
    if (settings.monthlyBudget > 0) {
      const percent = (totalSpent / settings.monthlyBudget) * 100;
      if (percent >= threshold) {
        showOverallBudgetWarning(totalSpent, settings.monthlyBudget);
      }
    }

    // Check category budgets
    if (settings.categoryBudgets && settings.categoryBudgets.length > 0) {
      const categorySpending: Record<string, number> = {};
      monthExpenses.forEach((e) => {
        categorySpending[e.category] = (categorySpending[e.category] || 0) + e.amount;
      });

      settings.categoryBudgets.forEach((budget) => {
        const spent = categorySpending[budget.category] || 0;
        const percent = (spent / budget.limit) * 100;
        if (percent >= threshold) {
          showBudgetWarning(budget.category, spent, budget.limit);
        }
      });
    }
  }, [expenses, settings]);
};
