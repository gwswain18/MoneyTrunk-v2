import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2 } from 'lucide-react';
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
import { Frequency, Income as IncomeType } from '../types';

export const Income: React.FC = () => {
  const { income, addIncome, updateIncome, deleteIncome } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<IncomeType | null>(null);
  const [formData, setFormData] = useState({
    sourceName: '',
    amount: '',
    frequency: Frequency.Monthly,
    nextExpectedDate: new Date().toISOString().split('T')[0],
    notes: '',
  });

  // Calculate monthly income
  const monthlyTotal = useMemo(() => {
    return income.reduce((sum, item) => {
      switch (item.frequency) {
        case Frequency.Monthly:
          return sum + item.amount;
        case Frequency.BiWeekly:
          return sum + item.amount * 2;
        case Frequency.Weekly:
          return sum + item.amount * 4;
        default:
          return sum;
      }
    }, 0);
  }, [income]);

  // One-time income total
  const oneTimeTotal = useMemo(() => {
    return income
      .filter((i) => i.frequency === Frequency.OneTime)
      .reduce((sum, i) => sum + i.amount, 0);
  }, [income]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      sourceName: formData.sourceName,
      amount: parseFloat(formData.amount),
      frequency: formData.frequency,
      nextExpectedDate: formData.nextExpectedDate,
      notes: formData.notes,
    };

    if (editingItem) {
      updateIncome(editingItem.id, data);
    } else {
      addIncome(data);
    }

    closeModal();
  };

  const openEditModal = (item: IncomeType) => {
    setEditingItem(item);
    setFormData({
      sourceName: item.sourceName,
      amount: item.amount.toString(),
      frequency: item.frequency,
      nextExpectedDate: item.nextExpectedDate,
      notes: item.notes || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      sourceName: '',
      amount: '',
      frequency: Frequency.Monthly,
      nextExpectedDate: new Date().toISOString().split('T')[0],
      notes: '',
    });
  };

  const frequencyOptions = [
    { value: Frequency.OneTime, label: 'One-time' },
    { value: Frequency.Weekly, label: 'Weekly' },
    { value: Frequency.BiWeekly, label: 'Bi-weekly' },
    { value: Frequency.Monthly, label: 'Monthly' },
  ];

  const getFrequencyBadge = (freq: Frequency) => {
    switch (freq) {
      case Frequency.OneTime:
        return <Badge variant="secondary">One-time</Badge>;
      case Frequency.Weekly:
        return <Badge variant="default">Weekly</Badge>;
      case Frequency.BiWeekly:
        return <Badge variant="default">Bi-weekly</Badge>;
      case Frequency.Monthly:
        return <Badge variant="success">Monthly</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Income
          </h1>
          <p className="text-slate-500">Track your income sources</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Income
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className="bg-green-50 dark:bg-green-900/20">
          <CardContent className="p-6">
            <p className="text-sm text-green-600 dark:text-green-400">
              Estimated Monthly Income
            </p>
            <p className="text-3xl font-bold text-green-700 dark:text-green-300">
              {formatCurrency(monthlyTotal)}
            </p>
            <p className="mt-1 text-sm text-green-600/70">
              Based on recurring items
            </p>
          </CardContent>
        </Card>

        {oneTimeTotal > 0 && (
          <Card className="bg-blue-50 dark:bg-blue-900/20">
            <CardContent className="p-6">
              <p className="text-sm text-blue-600 dark:text-blue-400">
                One-time Income
              </p>
              <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {formatCurrency(oneTimeTotal)}
              </p>
              <p className="mt-1 text-sm text-blue-600/70">
                Non-recurring sources
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Income List */}
      <Card>
        <CardHeader>
          <CardTitle>Income Sources</CardTitle>
        </CardHeader>
        <CardContent>
          {income.length === 0 ? (
            <p className="text-slate-500">No income sources added yet</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {income.map((item) => (
                <li
                  key={item.id}
                  className="flex items-center justify-between py-4"
                >
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">
                      {item.sourceName}
                    </p>
                    <p className="text-sm text-slate-500">
                      Next: {formatDateShort(item.nextExpectedDate)}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-green-600">
                      {formatCurrency(item.amount)}
                    </p>
                    {getFrequencyBadge(item.frequency)}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditModal(item)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => deleteIncome(item.id)}
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

      {/* Add/Edit Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogClose onClose={closeModal} />
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Income Source' : 'Add Income Source'}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Source Name"
              placeholder="e.g., Salary, Freelance"
              value={formData.sourceName}
              onChange={(e) =>
                setFormData({ ...formData, sourceName: e.target.value })
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
              <Select
                label="Frequency"
                options={frequencyOptions}
                value={formData.frequency}
                onChange={(e) =>
                  setFormData({ ...formData, frequency: e.target.value as Frequency })
                }
              />
            </div>
            <Input
              label="Next Expected Date"
              type="date"
              value={formData.nextExpectedDate}
              onChange={(e) =>
                setFormData({ ...formData, nextExpectedDate: e.target.value })
              }
              required
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? 'Save Changes' : 'Add Income'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
