import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  AppData,
  Bill,
  Subscription,
  Income,
  Expense,
  SavingsGoal,
  BorrowedMoney,
  LentMoney,
  Payment,
  AppSettings,
  LoanStatus,
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
