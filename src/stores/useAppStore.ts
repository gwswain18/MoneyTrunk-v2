import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppData,
  Bill,
  Subscription,
  Income,
  Expense,
  RecurringExpense,
  SavingsGoal,
  BorrowedMoney,
  LentMoney,
  Payment,
  AppSettings,
  LoanStatus,
  Frequency,
  Asset,
  Liability,
  NetWorthSnapshot,
  SEED_DATA,
} from '../types';
import { generateId } from '../lib/utils';

interface AppStore extends AppData {
  // Bills
  addBill: (bill: Omit<Bill, 'id'>) => void;
  updateBill: (id: string, bill: Partial<Bill>) => void;
  deleteBill: (id: string) => void;

  // Subscriptions
  addSubscription: (sub: Omit<Subscription, 'id'>) => void;
  updateSubscription: (id: string, sub: Partial<Subscription>) => void;
  deleteSubscription: (id: string) => void;

  // Income
  addIncome: (income: Omit<Income, 'id'>) => void;
  updateIncome: (id: string, income: Partial<Income>) => void;
  deleteIncome: (id: string) => void;

  // Expenses
  addExpense: (expense: Omit<Expense, 'id'>) => void;
  updateExpense: (id: string, expense: Partial<Expense>) => void;
  deleteExpense: (id: string) => void;

  // Recurring Expenses
  addRecurringExpense: (expense: Omit<RecurringExpense, 'id'>) => void;
  updateRecurringExpense: (id: string, expense: Partial<RecurringExpense>) => void;
  deleteRecurringExpense: (id: string) => void;
  processRecurringExpenses: () => void;

  // Savings
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id'>) => void;
  updateSavingsGoal: (id: string, goal: Partial<SavingsGoal>) => void;
  deleteSavingsGoal: (id: string) => void;
  addToSavings: (id: string, amount: number) => void;

  // Borrowed Money
  addBorrowed: (borrowed: Omit<BorrowedMoney, 'id' | 'payments'>) => void;
  updateBorrowed: (id: string, borrowed: Partial<BorrowedMoney>) => void;
  deleteBorrowed: (id: string) => void;
  addPaymentToBorrowed: (id: string, payment: Omit<Payment, 'id'>) => void;

  // Lent Money
  addLent: (lent: Omit<LentMoney, 'id' | 'repayments'>) => void;
  updateLent: (id: string, lent: Partial<LentMoney>) => void;
  deleteLent: (id: string) => void;
  addRepaymentToLent: (id: string, payment: Omit<Payment, 'id'>) => void;

  // Assets
  addAsset: (asset: Omit<Asset, 'id'>) => void;
  updateAsset: (id: string, asset: Partial<Asset>) => void;
  deleteAsset: (id: string) => void;

  // Liabilities
  addLiability: (liability: Omit<Liability, 'id'>) => void;
  updateLiability: (id: string, liability: Partial<Liability>) => void;
  deleteLiability: (id: string) => void;

  // Net Worth
  recordNetWorthSnapshot: () => void;

  // Settings
  updateSettings: (settings: Partial<AppSettings>) => void;

  // Tags
  addTag: (tag: string) => void;
  removeTag: (tag: string) => void;

  // Data Management
  importData: (data: AppData) => void;
  resetData: () => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      ...SEED_DATA,

      // Bills
      addBill: (bill) =>
        set((state) => ({
          bills: [...state.bills, { ...bill, id: generateId() }],
        })),
      updateBill: (id, bill) =>
        set((state) => ({
          bills: state.bills.map((b) => (b.id === id ? { ...b, ...bill } : b)),
        })),
      deleteBill: (id) =>
        set((state) => ({
          bills: state.bills.filter((b) => b.id !== id),
        })),

      // Subscriptions
      addSubscription: (sub) =>
        set((state) => ({
          subscriptions: [...state.subscriptions, { ...sub, id: generateId() }],
        })),
      updateSubscription: (id, sub) =>
        set((state) => ({
          subscriptions: state.subscriptions.map((s) =>
            s.id === id ? { ...s, ...sub } : s
          ),
        })),
      deleteSubscription: (id) =>
        set((state) => ({
          subscriptions: state.subscriptions.filter((s) => s.id !== id),
        })),

      // Income
      addIncome: (income) =>
        set((state) => ({
          income: [...state.income, { ...income, id: generateId() }],
        })),
      updateIncome: (id, income) =>
        set((state) => ({
          income: state.income.map((i) => (i.id === id ? { ...i, ...income } : i)),
        })),
      deleteIncome: (id) =>
        set((state) => ({
          income: state.income.filter((i) => i.id !== id),
        })),

      // Expenses
      addExpense: (expense) =>
        set((state) => ({
          expenses: [...state.expenses, { ...expense, id: generateId() }],
        })),
      updateExpense: (id, expense) =>
        set((state) => ({
          expenses: state.expenses.map((e) =>
            e.id === id ? { ...e, ...expense } : e
          ),
        })),
      deleteExpense: (id) =>
        set((state) => ({
          expenses: state.expenses.filter((e) => e.id !== id),
        })),

      // Recurring Expenses
      addRecurringExpense: (expense) =>
        set((state) => ({
          recurringExpenses: [
            ...state.recurringExpenses,
            { ...expense, id: generateId() },
          ],
        })),
      updateRecurringExpense: (id, expense) =>
        set((state) => ({
          recurringExpenses: state.recurringExpenses.map((e) =>
            e.id === id ? { ...e, ...expense } : e
          ),
        })),
      deleteRecurringExpense: (id) =>
        set((state) => ({
          recurringExpenses: state.recurringExpenses.filter((e) => e.id !== id),
        })),
      processRecurringExpenses: () =>
        set((state) => {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const todayStr = today.toISOString().split('T')[0];

          const newExpenses: Expense[] = [];
          const updatedRecurring = state.recurringExpenses.map((rec) => {
            if (!rec.isActive) return rec;

            const nextDue = new Date(rec.nextDueDate);
            nextDue.setHours(0, 0, 0, 0);

            // Check if expense is due
            if (nextDue <= today) {
              // Create the expense
              newExpenses.push({
                id: generateId(),
                date: rec.nextDueDate,
                category: rec.category,
                description: rec.description,
                amount: rec.amount,
                tags: rec.tags,
                recurringExpenseId: rec.id,
              });

              // Calculate next due date
              let newNextDue = new Date(nextDue);
              switch (rec.frequency) {
                case Frequency.Weekly:
                  newNextDue.setDate(newNextDue.getDate() + 7);
                  break;
                case Frequency.BiWeekly:
                  newNextDue.setDate(newNextDue.getDate() + 14);
                  break;
                case Frequency.Monthly:
                  newNextDue.setMonth(newNextDue.getMonth() + 1);
                  break;
                case Frequency.Yearly:
                  newNextDue.setFullYear(newNextDue.getFullYear() + 1);
                  break;
                default:
                  break;
              }

              return {
                ...rec,
                lastGeneratedDate: todayStr,
                nextDueDate: newNextDue.toISOString().split('T')[0],
              };
            }

            return rec;
          });

          return {
            recurringExpenses: updatedRecurring,
            expenses: [...state.expenses, ...newExpenses],
          };
        }),

      // Savings
      addSavingsGoal: (goal) =>
        set((state) => ({
          savings: [...state.savings, { ...goal, id: generateId() }],
        })),
      updateSavingsGoal: (id, goal) =>
        set((state) => ({
          savings: state.savings.map((s) => (s.id === id ? { ...s, ...goal } : s)),
        })),
      deleteSavingsGoal: (id) =>
        set((state) => ({
          savings: state.savings.filter((s) => s.id !== id),
        })),
      addToSavings: (id, amount) =>
        set((state) => ({
          savings: state.savings.map((s) =>
            s.id === id ? { ...s, currentAmount: s.currentAmount + amount } : s
          ),
        })),

      // Borrowed Money
      addBorrowed: (borrowed) =>
        set((state) => ({
          borrowed: [
            ...state.borrowed,
            { ...borrowed, id: generateId(), payments: [] },
          ],
        })),
      updateBorrowed: (id, borrowed) =>
        set((state) => ({
          borrowed: state.borrowed.map((b) =>
            b.id === id ? { ...b, ...borrowed } : b
          ),
        })),
      deleteBorrowed: (id) =>
        set((state) => ({
          borrowed: state.borrowed.filter((b) => b.id !== id),
        })),
      addPaymentToBorrowed: (id, payment) =>
        set((state) => ({
          borrowed: state.borrowed.map((b) => {
            if (b.id !== id) return b;
            const newPayment = { ...payment, id: generateId() };
            const newBalance = b.currentBalance - payment.amount;
            return {
              ...b,
              currentBalance: Math.max(0, newBalance),
              payments: [...b.payments, newPayment],
              status: newBalance <= 0 ? LoanStatus.PaidOff : b.status,
            };
          }),
        })),

      // Lent Money
      addLent: (lent) =>
        set((state) => ({
          lent: [...state.lent, { ...lent, id: generateId(), repayments: [] }],
        })),
      updateLent: (id, lent) =>
        set((state) => ({
          lent: state.lent.map((l) => (l.id === id ? { ...l, ...lent } : l)),
        })),
      deleteLent: (id) =>
        set((state) => ({
          lent: state.lent.filter((l) => l.id !== id),
        })),
      addRepaymentToLent: (id, payment) =>
        set((state) => ({
          lent: state.lent.map((l) => {
            if (l.id !== id) return l;
            const newPayment = { ...payment, id: generateId() };
            const newBalance = l.currentBalance - payment.amount;
            return {
              ...l,
              currentBalance: Math.max(0, newBalance),
              repayments: [...l.repayments, newPayment],
              status: newBalance <= 0 ? LoanStatus.PaidOff : l.status,
            };
          }),
        })),

      // Assets
      addAsset: (asset) =>
        set((state) => ({
          assets: [...state.assets, { ...asset, id: generateId() }],
        })),
      updateAsset: (id, asset) =>
        set((state) => ({
          assets: state.assets.map((a) => (a.id === id ? { ...a, ...asset } : a)),
        })),
      deleteAsset: (id) =>
        set((state) => ({
          assets: state.assets.filter((a) => a.id !== id),
        })),

      // Liabilities
      addLiability: (liability) =>
        set((state) => ({
          liabilities: [...state.liabilities, { ...liability, id: generateId() }],
        })),
      updateLiability: (id, liability) =>
        set((state) => ({
          liabilities: state.liabilities.map((l) =>
            l.id === id ? { ...l, ...liability } : l
          ),
        })),
      deleteLiability: (id) =>
        set((state) => ({
          liabilities: state.liabilities.filter((l) => l.id !== id),
        })),

      // Net Worth
      recordNetWorthSnapshot: () =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          const totalAssets = state.assets.reduce((sum, a) => sum + a.value, 0);
          const totalLiabilities = state.liabilities.reduce((sum, l) => sum + l.balance, 0);
          const netWorth = totalAssets - totalLiabilities;

          // Check if we already have a snapshot for today
          const existingIndex = state.netWorthHistory.findIndex(
            (s) => s.date === today
          );

          if (existingIndex >= 0) {
            // Update existing snapshot
            const updatedHistory = [...state.netWorthHistory];
            updatedHistory[existingIndex] = {
              date: today,
              totalAssets,
              totalLiabilities,
              netWorth,
            };
            return { netWorthHistory: updatedHistory };
          }

          // Add new snapshot
          return {
            netWorthHistory: [
              ...state.netWorthHistory,
              { date: today, totalAssets, totalLiabilities, netWorth },
            ],
          };
        }),

      // Settings
      updateSettings: (settings) =>
        set((state) => ({
          settings: { ...state.settings, ...settings },
        })),

      // Tags
      addTag: (tag) =>
        set((state) => ({
          tags: state.tags.includes(tag) ? state.tags : [...state.tags, tag],
        })),
      removeTag: (tag) =>
        set((state) => ({
          tags: state.tags.filter((t) => t !== tag),
        })),

      // Data Management
      importData: (data) => set(() => data),
      resetData: () => set(() => SEED_DATA),
    }),
    {
      name: 'moneytrunk-storage',
      version: 1,
    }
  )
);
