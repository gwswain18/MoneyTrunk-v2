import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
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
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency, formatDateShort } from '../lib/utils';
import { LoanStatus } from '../types';

export const Loans: React.FC = () => {
  const {
    borrowed,
    lent,
    addBorrowed,
    addLent,
    deleteBorrowed,
    deleteLent,
    addPaymentToBorrowed,
    addRepaymentToLent,
  } = useAppStore();

  const [activeTab, setActiveTab] = useState<'borrowed' | 'lent'>('borrowed');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState<string | null>(null);
  const [paymentAmount, setPaymentAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    originalAmount: '',
    currentBalance: '',
    startDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      [activeTab === 'borrowed' ? 'lenderName' : 'borrowerName']: formData.name,
      originalAmount: parseFloat(formData.originalAmount),
      currentBalance: parseFloat(formData.currentBalance || formData.originalAmount),
      startDate: formData.startDate,
      dueDate: formData.dueDate || undefined,
      notes: formData.notes,
      status: LoanStatus.Active,
    };

    if (activeTab === 'borrowed') {
      addBorrowed(data as any);
    } else {
      addLent(data as any);
    }
    closeModal();
  };

  const handlePayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLoanId || !paymentAmount) return;

    const payment = {
      date: new Date().toISOString().split('T')[0],
      amount: parseFloat(paymentAmount),
    };

    if (activeTab === 'borrowed') {
      addPaymentToBorrowed(selectedLoanId, payment);
    } else {
      addRepaymentToLent(selectedLoanId, payment);
    }

    setIsPaymentModalOpen(false);
    setPaymentAmount('');
    setSelectedLoanId(null);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({
      name: '',
      originalAmount: '',
      currentBalance: '',
      startDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      notes: '',
    });
  };

  const loans = activeTab === 'borrowed' ? borrowed : lent;
  const totalOwed = borrowed.reduce((sum, b) => sum + b.currentBalance, 0);
  const totalOwedToYou = lent.reduce((sum, l) => sum + l.currentBalance, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Personal Loans
          </h1>
          <p className="text-slate-500">Track money borrowed and lent</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Loan
        </Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="bg-red-50 dark:bg-red-900/20">
          <CardContent className="p-6">
            <p className="text-sm text-red-600 dark:text-red-400">You Owe</p>
            <p className="text-3xl font-bold text-red-700 dark:text-red-300">
              {formatCurrency(totalOwed)}
            </p>
          </CardContent>
        </Card>
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-6">
            <p className="text-sm text-green-600 dark:text-green-400">
              They Owe You
            </p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(totalOwedToYou)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-800">
        <button
          onClick={() => setActiveTab('borrowed')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'borrowed'
              ? 'border-b-2 border-red-500 text-red-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Money You Owe ({borrowed.length})
        </button>
        <button
          onClick={() => setActiveTab('lent')}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === 'lent'
              ? 'border-b-2 border-green-500 text-green-600'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Money Owed to You ({lent.length})
        </button>
      </div>

      {/* Loans List */}
      <div className="space-y-4">
        {loans.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-center text-slate-500">
              No {activeTab === 'borrowed' ? 'borrowed money' : 'lent money'} recorded
            </CardContent>
          </Card>
        ) : (
          loans.map((loan) => {
            const name = 'lenderName' in loan ? loan.lenderName : loan.borrowerName;
            const progress = loan.originalAmount > 0
              ? ((loan.originalAmount - loan.currentBalance) / loan.originalAmount) * 100
              : 0;

            return (
              <Card key={loan.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        {name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        Started {formatDateShort(loan.startDate)}
                      </p>
                    </div>
                    <Badge
                      variant={
                        loan.status === LoanStatus.Active
                          ? activeTab === 'borrowed'
                            ? 'destructive'
                            : 'success'
                          : 'secondary'
                      }
                    >
                      {loan.status === LoanStatus.Active ? 'Active' : 'Paid Off'}
                    </Badge>
                  </div>

                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        {formatCurrency(loan.originalAmount - loan.currentBalance)}{' '}
                        paid of {formatCurrency(loan.originalAmount)}
                      </span>
                      <span>{Math.round(progress)}%</span>
                    </div>
                    <Progress value={progress} max={100} />
                    <p className="text-lg font-bold">
                      Balance: {formatCurrency(loan.currentBalance)}
                    </p>
                  </div>

                  <div className="mt-4 flex gap-2">
                    {loan.status === LoanStatus.Active && (
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedLoanId(loan.id);
                          setIsPaymentModalOpen(true);
                        }}
                      >
                        Record Payment
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-red-500"
                      onClick={() =>
                        activeTab === 'borrowed'
                          ? deleteBorrowed(loan.id)
                          : deleteLent(loan.id)
                      }
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add Loan Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogClose onClose={closeModal} />
        <DialogHeader>
          <DialogTitle>
            {activeTab === 'borrowed' ? 'Add Borrowed Money' : 'Add Lent Money'}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label={activeTab === 'borrowed' ? 'Lender Name' : 'Borrower Name'}
              placeholder="e.g., John Doe"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Original Amount"
                type="number"
                step="0.01"
                min="0"
                value={formData.originalAmount}
                onChange={(e) =>
                  setFormData({ ...formData, originalAmount: e.target.value })
                }
                required
              />
              <Input
                label="Current Balance"
                type="number"
                step="0.01"
                min="0"
                placeholder="Same as original"
                value={formData.currentBalance}
                onChange={(e) =>
                  setFormData({ ...formData, currentBalance: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Start Date"
                type="date"
                value={formData.startDate}
                onChange={(e) =>
                  setFormData({ ...formData, startDate: e.target.value })
                }
                required
              />
              <Input
                label="Due Date (optional)"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">Add Loan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Payment Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogClose onClose={() => setIsPaymentModalOpen(false)} />
        <DialogHeader>
          <DialogTitle>Record Payment</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handlePayment} className="space-y-4">
            <Input
              label="Payment Amount"
              type="number"
              step="0.01"
              min="0"
              value={paymentAmount}
              onChange={(e) => setPaymentAmount(e.target.value)}
              required
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsPaymentModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Record Payment</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
