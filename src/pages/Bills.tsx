import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
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
import { formatCurrency, formatDateShort } from '../lib/utils';
import { BillStatus, BILL_CATEGORIES } from '../types';

export const Bills: React.FC = () => {
  const { bills, subscriptions, addBill, updateBill, deleteBill } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Utilities',
    amountDue: '',
    dueDate: new Date().toISOString().split('T')[0],
    repeat: 'none' as const,
    paymentUrl: '',
    notes: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addBill({
      name: formData.name,
      category: formData.category,
      amountDue: parseFloat(formData.amountDue),
      dueDate: formData.dueDate,
      status: BillStatus.Unpaid,
      repeat: formData.repeat,
      paymentUrl: formData.paymentUrl,
      notes: formData.notes,
    });
    setIsModalOpen(false);
    setFormData({
      name: '',
      category: 'Utilities',
      amountDue: '',
      dueDate: new Date().toISOString().split('T')[0],
      repeat: 'none',
      paymentUrl: '',
      notes: '',
    });
  };

  const markAsPaid = (id: string) => {
    updateBill(id, {
      status: BillStatus.Paid,
      datePaid: new Date().toISOString().split('T')[0],
    });
  };

  const categoryOptions = BILL_CATEGORIES.map((cat) => ({ value: cat, label: cat }));
  const repeatOptions = [
    { value: 'none', label: 'One-time' },
    { value: 'monthly', label: 'Monthly' },
    { value: 'yearly', label: 'Yearly' },
  ];

  const getStatusBadge = (status: BillStatus) => {
    switch (status) {
      case BillStatus.Paid:
        return <Badge variant="success">Paid</Badge>;
      case BillStatus.Overdue:
        return <Badge variant="destructive">Overdue</Badge>;
      case BillStatus.Partial:
        return <Badge variant="warning">Partial</Badge>;
      default:
        return <Badge variant="secondary">Unpaid</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Bills & Subscriptions
          </h1>
          <p className="text-slate-500">Manage your recurring payments</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" /> Add Bill
        </Button>
      </div>

      {/* Bills List */}
      <Card>
        <CardHeader>
          <CardTitle>Bills</CardTitle>
        </CardHeader>
        <CardContent>
          {bills.length === 0 ? (
            <p className="text-slate-500">No bills added yet</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {bills.map((bill) => (
                <li
                  key={bill.id}
                  className="py-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900 dark:text-white truncate">
                        {bill.name}
                      </p>
                      <p className="text-sm text-slate-500">
                        {bill.category} • Due {formatDateShort(bill.dueDate)}
                      </p>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">
                          {formatCurrency(bill.amountDue)}
                        </p>
                        {getStatusBadge(bill.status)}
                      </div>
                      {bill.status !== BillStatus.Paid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsPaid(bill.id)}
                        >
                          Mark Paid
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

      {/* Subscriptions List */}
      <Card>
        <CardHeader>
          <CardTitle>Subscriptions</CardTitle>
        </CardHeader>
        <CardContent>
          {subscriptions.length === 0 ? (
            <p className="text-slate-500">No subscriptions added yet</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {subscriptions.map((sub) => (
                <li
                  key={sub.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {sub.name}
                    </p>
                    <p className="text-sm text-slate-500">
                      {sub.category} • {sub.billingCycle}
                    </p>
                  </div>
                  <p className="font-semibold">{formatCurrency(sub.amount)}</p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Add Bill Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogClose onClose={() => setIsModalOpen(false)} />
        <DialogHeader>
          <DialogTitle>Add New Bill</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Bill Name"
              placeholder="e.g., Electric Bill"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
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
                value={formData.amountDue}
                onChange={(e) =>
                  setFormData({ ...formData, amountDue: e.target.value })
                }
                required
              />
              <Input
                label="Due Date"
                type="date"
                value={formData.dueDate}
                onChange={(e) =>
                  setFormData({ ...formData, dueDate: e.target.value })
                }
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Category"
                options={categoryOptions}
                value={formData.category}
                onChange={(e) =>
                  setFormData({ ...formData, category: e.target.value })
                }
              />
              <Select
                label="Repeat"
                options={repeatOptions}
                value={formData.repeat}
                onChange={(e) =>
                  setFormData({ ...formData, repeat: e.target.value as any })
                }
              />
            </div>
            <Input
              label="Payment URL (optional)"
              type="url"
              placeholder="https://..."
              value={formData.paymentUrl}
              onChange={(e) =>
                setFormData({ ...formData, paymentUrl: e.target.value })
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
              <Button type="submit">Add Bill</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
