import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Receipt,
  Wallet,
  TrendingUp,
  PiggyBank,
  HandCoins,
  Target,
  CalendarDays,
  Landmark,
  BarChart3,
  FileText,
  Settings,
  LayoutDashboard,
} from 'lucide-react';
import { Dialog } from '../ui/dialog';
import { useAppStore } from '../../stores/useAppStore';
import { formatCurrency, formatDateShort } from '../../lib/utils';

interface SearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

type SearchResult = {
  type: 'page' | 'bill' | 'subscription' | 'income' | 'expense' | 'savings' | 'borrowed' | 'lent';
  id?: string;
  title: string;
  subtitle?: string;
  icon: React.ElementType;
  path: string;
  tags?: string[];
};

const pages: SearchResult[] = [
  { type: 'page', title: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { type: 'page', title: 'Bills & Subscriptions', icon: Receipt, path: '/bills' },
  { type: 'page', title: 'Income', icon: Wallet, path: '/income' },
  { type: 'page', title: 'Expenses', icon: TrendingUp, path: '/expenses' },
  { type: 'page', title: 'Savings', icon: PiggyBank, path: '/savings' },
  { type: 'page', title: 'Loans', icon: HandCoins, path: '/loans' },
  { type: 'page', title: 'Budget', icon: Target, path: '/budget' },
  { type: 'page', title: 'Calendar', icon: CalendarDays, path: '/calendar' },
  { type: 'page', title: 'Net Worth', icon: Landmark, path: '/net-worth' },
  { type: 'page', title: 'Analytics', icon: BarChart3, path: '/analytics' },
  { type: 'page', title: 'Reports', icon: FileText, path: '/reports' },
  { type: 'page', title: 'Settings', icon: Settings, path: '/settings' },
];

export const SearchDialog: React.FC<SearchDialogProps> = ({ open, onOpenChange }) => {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const { bills, subscriptions, income, expenses, savings, borrowed, lent } = useAppStore();

  // Build search results
  const results = useMemo(() => {
    if (!query.trim()) {
      return pages;
    }

    const q = query.toLowerCase();
    const matches: SearchResult[] = [];

    // Search pages
    pages.forEach((page) => {
      if (page.title.toLowerCase().includes(q)) {
        matches.push(page);
      }
    });

    // Search bills
    bills.forEach((bill) => {
      if (
        bill.name.toLowerCase().includes(q) ||
        bill.category.toLowerCase().includes(q) ||
        bill.tags?.some((t) => t.toLowerCase().includes(q))
      ) {
        matches.push({
          type: 'bill',
          id: bill.id,
          title: bill.name,
          subtitle: `Bill • ${formatCurrency(bill.amountDue)} • Due ${formatDateShort(bill.dueDate)}`,
          icon: Receipt,
          path: '/bills',
          tags: bill.tags,
        });
      }
    });

    // Search subscriptions
    subscriptions.forEach((sub) => {
      if (
        sub.name.toLowerCase().includes(q) ||
        sub.category.toLowerCase().includes(q) ||
        sub.tags?.some((t) => t.toLowerCase().includes(q))
      ) {
        matches.push({
          type: 'subscription',
          id: sub.id,
          title: sub.name,
          subtitle: `Subscription • ${formatCurrency(sub.amount)}/${sub.billingCycle}`,
          icon: Receipt,
          path: '/bills',
          tags: sub.tags,
        });
      }
    });

    // Search income
    income.forEach((inc) => {
      if (
        inc.sourceName.toLowerCase().includes(q) ||
        inc.tags?.some((t) => t.toLowerCase().includes(q))
      ) {
        matches.push({
          type: 'income',
          id: inc.id,
          title: inc.sourceName,
          subtitle: `Income • ${formatCurrency(inc.amount)}`,
          icon: Wallet,
          path: '/income',
          tags: inc.tags,
        });
      }
    });

    // Search expenses
    expenses.forEach((exp) => {
      if (
        exp.description.toLowerCase().includes(q) ||
        exp.category.toLowerCase().includes(q) ||
        exp.tags?.some((t) => t.toLowerCase().includes(q))
      ) {
        matches.push({
          type: 'expense',
          id: exp.id,
          title: exp.description,
          subtitle: `Expense • ${exp.category} • ${formatCurrency(exp.amount)}`,
          icon: TrendingUp,
          path: '/expenses',
          tags: exp.tags,
        });
      }
    });

    // Search savings
    savings.forEach((goal) => {
      if (goal.name.toLowerCase().includes(q)) {
        matches.push({
          type: 'savings',
          id: goal.id,
          title: goal.name,
          subtitle: `Savings Goal • ${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}`,
          icon: PiggyBank,
          path: '/savings',
        });
      }
    });

    // Search borrowed
    borrowed.forEach((loan) => {
      if (
        loan.lenderName.toLowerCase().includes(q) ||
        loan.tags?.some((t) => t.toLowerCase().includes(q))
      ) {
        matches.push({
          type: 'borrowed',
          id: loan.id,
          title: `Borrowed from ${loan.lenderName}`,
          subtitle: `Loan • ${formatCurrency(loan.currentBalance)} remaining`,
          icon: HandCoins,
          path: '/loans',
          tags: loan.tags,
        });
      }
    });

    // Search lent
    lent.forEach((loan) => {
      if (
        loan.borrowerName.toLowerCase().includes(q) ||
        loan.tags?.some((t) => t.toLowerCase().includes(q))
      ) {
        matches.push({
          type: 'lent',
          id: loan.id,
          title: `Lent to ${loan.borrowerName}`,
          subtitle: `Loan • ${formatCurrency(loan.currentBalance)} remaining`,
          icon: HandCoins,
          path: '/loans',
          tags: loan.tags,
        });
      }
    });

    return matches.slice(0, 10);
  }, [query, bills, subscriptions, income, expenses, savings, borrowed, lent]);

  // Reset selection when results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [results]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results[selectedIndex]) {
        e.preventDefault();
        navigate(results[selectedIndex].path);
        onOpenChange(false);
        setQuery('');
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [open, results, selectedIndex, navigate, onOpenChange]);

  // Clear query when closing
  useEffect(() => {
    if (!open) {
      setQuery('');
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <div className="flex flex-col">
        {/* Search input */}
        <div className="flex items-center gap-3 border-b border-slate-200 px-4 dark:border-slate-700">
          <Search className="h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search pages, bills, expenses, income..."
            className="flex-1 border-none bg-transparent py-4 text-base outline-none placeholder:text-slate-400"
            autoFocus
          />
          <kbd className="hidden rounded bg-slate-100 px-2 py-1 text-xs text-slate-500 sm:inline-block dark:bg-slate-800">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2">
          {results.length === 0 ? (
            <p className="py-8 text-center text-slate-500">No results found</p>
          ) : (
            <ul>
              {results.map((result, index) => (
                <li key={result.id || result.title}>
                  <button
                    onClick={() => {
                      navigate(result.path);
                      onOpenChange(false);
                      setQuery('');
                    }}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors ${
                      index === selectedIndex
                        ? 'bg-emerald-50 text-emerald-900 dark:bg-emerald-900/30 dark:text-emerald-100'
                        : 'hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    <result.icon className="h-5 w-5 text-slate-400" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-sm text-slate-500 truncate">{result.subtitle}</p>
                      )}
                    </div>
                    {result.tags && result.tags.length > 0 && (
                      <div className="flex gap-1">
                        {result.tags.slice(0, 2).map((tag) => (
                          <span
                            key={tag}
                            className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-2 text-xs text-slate-500 dark:border-slate-700">
          <div className="flex gap-2">
            <span>↑↓ Navigate</span>
            <span>↵ Select</span>
          </div>
          <span>ESC Close</span>
        </div>
      </div>
    </Dialog>
  );
};
