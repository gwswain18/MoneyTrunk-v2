import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, PiggyBank } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
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
import { formatCurrency } from '../lib/utils';
import { SavingsGoal } from '../types';

export const Savings: React.FC = () => {
  const { savings, addSavingsGoal, updateSavingsGoal, deleteSavingsGoal, addToSavings } = useAppStore();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<SavingsGoal | null>(null);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [depositAmount, setDepositAmount] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    targetAmount: '',
    currentAmount: '',
    deadline: '',
    icon: '🎯',
  });

  const totalSavings = useMemo(() => {
    return savings.reduce((sum, s) => sum + s.currentAmount, 0);
  }, [savings]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      name: formData.name,
      targetAmount: parseFloat(formData.targetAmount),
      currentAmount: parseFloat(formData.currentAmount || '0'),
      deadline: formData.deadline || undefined,
      icon: formData.icon,
    };

    if (editingItem) {
      updateSavingsGoal(editingItem.id, data);
    } else {
      addSavingsGoal(data);
    }
    closeModal();
  };

  const handleDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedGoalId && depositAmount) {
      addToSavings(selectedGoalId, parseFloat(depositAmount));
      setIsDepositModalOpen(false);
      setDepositAmount('');
      setSelectedGoalId(null);
    }
  };

  const openEditModal = (goal: SavingsGoal) => {
    setEditingItem(goal);
    setFormData({
      name: goal.name,
      targetAmount: goal.targetAmount.toString(),
      currentAmount: goal.currentAmount.toString(),
      deadline: goal.deadline || '',
      icon: goal.icon || '🎯',
    });
    setIsModalOpen(true);
  };

  const openDepositModal = (goalId: string) => {
    setSelectedGoalId(goalId);
    setIsDepositModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    setFormData({
      name: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      icon: '🎯',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Savings Goals
          </h1>
          <p className="text-slate-500">Track your savings progress</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Goal
        </Button>
      </div>

      {/* Total Savings */}
      <Card className="bg-purple-50 dark:bg-purple-900/20">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <p className="text-sm text-purple-600 dark:text-purple-400">
              Total Savings
            </p>
            <p className="text-3xl font-bold text-purple-700 dark:text-purple-300">
              {formatCurrency(totalSavings)}
            </p>
          </div>
          <div className="rounded-full bg-purple-100 p-4 dark:bg-purple-900/50">
            <PiggyBank className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
        </CardContent>
      </Card>

      {/* Savings Goals */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {savings.length === 0 ? (
          <Card className="col-span-full">
            <CardContent className="p-6 text-center text-slate-500">
              No savings goals yet. Create one to start tracking!
            </CardContent>
          </Card>
        ) : (
          savings.map((goal) => {
            const progress = goal.targetAmount > 0
              ? (goal.currentAmount / goal.targetAmount) * 100
              : 0;
            const isComplete = goal.currentAmount >= goal.targetAmount;

            return (
              <Card key={goal.id}>
                <CardHeader className="flex flex-row items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{goal.icon || '🎯'}</span>
                    <CardTitle className="text-lg">{goal.name}</CardTitle>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => openEditModal(goal)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-slate-400 hover:text-red-500"
                      onClick={() => deleteSavingsGoal(goal.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">
                        {formatCurrency(goal.currentAmount)} of{' '}
                        {formatCurrency(goal.targetAmount)}
                      </span>
                      <span
                        className={
                          isComplete ? 'text-green-600' : 'text-slate-500'
                        }
                      >
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <Progress
                      value={goal.currentAmount}
                      max={goal.targetAmount}
                      indicatorClassName={isComplete ? 'bg-green-500' : ''}
                    />
                    {goal.deadline && (
                      <p className="text-sm text-slate-500">
                        Target: {new Date(goal.deadline).toLocaleDateString()}
                      </p>
                    )}
                    <Button
                      className="w-full"
                      variant={isComplete ? 'secondary' : 'default'}
                      disabled={isComplete}
                      onClick={() => openDepositModal(goal.id)}
                    >
                      {isComplete ? '🎉 Goal Reached!' : 'Add Funds'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Add/Edit Goal Modal */}
      <Dialog open={isModalOpen} onOpenChange={closeModal}>
        <DialogClose onClose={closeModal} />
        <DialogHeader>
          <DialogTitle>
            {editingItem ? 'Edit Savings Goal' : 'Create Savings Goal'}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Goal Name"
              placeholder="e.g., Emergency Fund"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.targetAmount}
                onChange={(e) =>
                  setFormData({ ...formData, targetAmount: e.target.value })
                }
                required
              />
              <Input
                label="Current Amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.currentAmount}
                onChange={(e) =>
                  setFormData({ ...formData, currentAmount: e.target.value })
                }
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Target Date (optional)"
                type="date"
                value={formData.deadline}
                onChange={(e) =>
                  setFormData({ ...formData, deadline: e.target.value })
                }
              />
              <Input
                label="Icon (emoji)"
                placeholder="🎯"
                value={formData.icon}
                onChange={(e) =>
                  setFormData({ ...formData, icon: e.target.value })
                }
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingItem ? 'Save Changes' : 'Create Goal'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Deposit Modal */}
      <Dialog open={isDepositModalOpen} onOpenChange={setIsDepositModalOpen}>
        <DialogClose onClose={() => setIsDepositModalOpen(false)} />
        <DialogHeader>
          <DialogTitle>Add Funds</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleDeposit} className="space-y-4">
            <Input
              label="Amount to Add"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={depositAmount}
              onChange={(e) => setDepositAmount(e.target.value)}
              required
              autoFocus
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDepositModalOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Add to Savings</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
