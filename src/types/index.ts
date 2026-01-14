// ==================== Enums ====================

export enum BillStatus {
  Unpaid = 'unpaid',
  Paid = 'paid',
  Overdue = 'overdue',
  Partial = 'partial',
}

export enum Frequency {
  OneTime = 'one-time',
  Weekly = 'weekly',
  BiWeekly = 'biweekly',
  Monthly = 'monthly',
  Yearly = 'yearly',
}

export enum LoanStatus {
  Active = 'active',
  PaidOff = 'paid_off',
  Forgiven = 'forgiven',
}

// ==================== Core Entities ====================

export interface Bill {
  id: string;
  name: string;
  category: string;
  amountDue: number;
  dueDate: string; // YYYY-MM-DD
  status: BillStatus;
  datePaid?: string;
  amountPaid?: number;
  notes?: string;
  repeat: 'none' | 'monthly' | 'yearly';
  paymentUrl?: string;
  tags?: string[];
}

export interface Subscription {
  id: string;
  name: string;
  amount: number;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate: string;
  category: string;
  notes?: string;
  paymentUrl?: string;
  lastPaidDate?: string;
  tags?: string[];
}

export interface Income {
  id: string;
  sourceName: string;
  amount: number;
  frequency: Frequency;
  nextExpectedDate: string;
  lastReceivedDate?: string;
  notes?: string;
  tags?: string[];
}

export interface Expense {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  description: string;
  amount: number;
  tags?: string[];
}

export interface SavingsGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string;
  icon?: string;
  notes?: string;
}

export interface Payment {
  id: string;
  date: string;
  amount: number;
  notes?: string;
}

export interface BorrowedMoney {
  id: string;
  lenderName: string;
  originalAmount: number;
  currentBalance: number;
  startDate: string;
  dueDate?: string;
  notes?: string;
  status: LoanStatus;
  nextPaymentAmount?: number;
  nextPaymentDueDate?: string;
  payments: Payment[];
  tags?: string[];
}

export interface LentMoney {
  id: string;
  borrowerName: string;
  originalAmount: number;
  currentBalance: number;
  startDate: string;
  dueDate?: string;
  notes?: string;
  status: LoanStatus;
  nextPaymentAmount?: number;
  nextPaymentDueDate?: string;
  repayments: Payment[];
  tags?: string[];
}

// ==================== App Data ====================

export interface AppSettings {
  userName: string;
  monthlyBudget: number;
  darkMode: boolean;
  pinEnabled: boolean;
  pinHash?: string;
  autoBackupEnabled: boolean;
  lastBackupDate?: string;
  encryptionEnabled: boolean;
}

export interface AppData {
  bills: Bill[];
  subscriptions: Subscription[];
  income: Income[];
  expenses: Expense[];
  savings: SavingsGoal[];
  borrowed: BorrowedMoney[];
  lent: LentMoney[];
  settings: AppSettings;
  tags: string[];
}

// ==================== Constants ====================

export const CATEGORIES = [
  'Groceries',
  'Dining',
  'Transportation',
  'Utilities',
  'Entertainment',
  'Shopping',
  'Health',
  'Education',
  'Housing',
  'Insurance',
  'Personal Care',
  'Gifts',
  'Travel',
  'Subscriptions',
  'Other',
] as const;

export const BILL_CATEGORIES = [
  'Utilities',
  'Housing',
  'Insurance',
  'Phone',
  'Internet',
  'Subscriptions',
  'Other',
] as const;

export const DEFAULT_SETTINGS: AppSettings = {
  userName: '',
  monthlyBudget: 0,
  darkMode: false,
  pinEnabled: false,
  autoBackupEnabled: false,
  encryptionEnabled: false,
};

export const SEED_DATA: AppData = {
  bills: [],
  subscriptions: [],
  income: [],
  expenses: [],
  savings: [],
  borrowed: [],
  lent: [],
  settings: DEFAULT_SETTINGS,
  tags: [],
};
