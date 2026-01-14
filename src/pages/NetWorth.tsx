import { useState, useMemo, useEffect } from 'react';
import {
  Plus,
  Trash2,
  Edit2,
  TrendingUp,
  TrendingDown,
  Landmark,
  CreditCard,
  Camera,
} from 'lucide-react';
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
import { Asset, Liability, AssetType, LiabilityType } from '../types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

export const NetWorth: React.FC = () => {
  const {
    assets,
    liabilities,
    netWorthHistory,
    addAsset,
    updateAsset,
    deleteAsset,
    addLiability,
    updateLiability,
    deleteLiability,
    recordNetWorthSnapshot,
  } = useAppStore();

  // Modals
  const [assetModalOpen, setAssetModalOpen] = useState(false);
  const [liabilityModalOpen, setLiabilityModalOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [editingLiability, setEditingLiability] = useState<Liability | null>(null);

  // Form data
  const [assetFormData, setAssetFormData] = useState({
    name: '',
    type: AssetType.Cash,
    value: '',
    notes: '',
  });

  const [liabilityFormData, setLiabilityFormData] = useState({
    name: '',
    type: LiabilityType.CreditCard,
    balance: '',
    interestRate: '',
    notes: '',
  });

  // Calculations
  const totalAssets = useMemo(
    () => assets.reduce((sum, a) => sum + a.value, 0),
    [assets]
  );

  const totalLiabilities = useMemo(
    () => liabilities.reduce((sum, l) => sum + l.balance, 0),
    [liabilities]
  );

  const netWorth = totalAssets - totalLiabilities;

  // Record snapshot when assets or liabilities change
  useEffect(() => {
    if (assets.length > 0 || liabilities.length > 0) {
      recordNetWorthSnapshot();
    }
  }, [assets, liabilities, recordNetWorthSnapshot]);

  // Chart data (last 12 months)
  const chartData = useMemo(() => {
    const sorted = [...netWorthHistory].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    return sorted.slice(-12).map((snapshot) => ({
      date: formatDateShort(snapshot.date),
      Assets: snapshot.totalAssets,
      Liabilities: snapshot.totalLiabilities,
      'Net Worth': snapshot.netWorth,
    }));
  }, [netWorthHistory]);

  // Handlers
  const openAssetModal = (asset?: Asset) => {
    if (asset) {
      setEditingAsset(asset);
      setAssetFormData({
        name: asset.name,
        type: asset.type,
        value: asset.value.toString(),
        notes: asset.notes || '',
      });
    } else {
      setEditingAsset(null);
      setAssetFormData({
        name: '',
        type: AssetType.Cash,
        value: '',
        notes: '',
      });
    }
    setAssetModalOpen(true);
  };

  const closeAssetModal = () => {
    setAssetModalOpen(false);
    setEditingAsset(null);
  };

  const handleAssetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const assetData = {
      name: assetFormData.name,
      type: assetFormData.type,
      value: parseFloat(assetFormData.value),
      notes: assetFormData.notes || undefined,
      lastUpdated: today,
    };

    if (editingAsset) {
      updateAsset(editingAsset.id, assetData);
    } else {
      addAsset(assetData);
    }
    closeAssetModal();
  };

  const openLiabilityModal = (liability?: Liability) => {
    if (liability) {
      setEditingLiability(liability);
      setLiabilityFormData({
        name: liability.name,
        type: liability.type,
        balance: liability.balance.toString(),
        interestRate: liability.interestRate?.toString() || '',
        notes: liability.notes || '',
      });
    } else {
      setEditingLiability(null);
      setLiabilityFormData({
        name: '',
        type: LiabilityType.CreditCard,
        balance: '',
        interestRate: '',
        notes: '',
      });
    }
    setLiabilityModalOpen(true);
  };

  const closeLiabilityModal = () => {
    setLiabilityModalOpen(false);
    setEditingLiability(null);
  };

  const handleLiabilitySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    const liabilityData = {
      name: liabilityFormData.name,
      type: liabilityFormData.type,
      balance: parseFloat(liabilityFormData.balance),
      interestRate: liabilityFormData.interestRate
        ? parseFloat(liabilityFormData.interestRate)
        : undefined,
      notes: liabilityFormData.notes || undefined,
      lastUpdated: today,
    };

    if (editingLiability) {
      updateLiability(editingLiability.id, liabilityData);
    } else {
      addLiability(liabilityData);
    }
    closeLiabilityModal();
  };

  // Options
  const assetTypeOptions = [
    { value: AssetType.Cash, label: 'Cash & Bank' },
    { value: AssetType.Investment, label: 'Investments' },
    { value: AssetType.Property, label: 'Real Estate' },
    { value: AssetType.Vehicle, label: 'Vehicles' },
    { value: AssetType.Other, label: 'Other' },
  ];

  const liabilityTypeOptions = [
    { value: LiabilityType.CreditCard, label: 'Credit Card' },
    { value: LiabilityType.Mortgage, label: 'Mortgage' },
    { value: LiabilityType.CarLoan, label: 'Car Loan' },
    { value: LiabilityType.StudentLoan, label: 'Student Loan' },
    { value: LiabilityType.PersonalLoan, label: 'Personal Loan' },
    { value: LiabilityType.Other, label: 'Other' },
  ];

  const getAssetTypeLabel = (type: AssetType) => {
    return assetTypeOptions.find((o) => o.value === type)?.label || type;
  };

  const getLiabilityTypeLabel = (type: LiabilityType) => {
    return liabilityTypeOptions.find((o) => o.value === type)?.label || type;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
            Net Worth
          </h1>
          <p className="text-slate-500">Track your assets and liabilities</p>
        </div>
        <Button
          variant="outline"
          onClick={() => recordNetWorthSnapshot()}
          className="flex-shrink-0"
        >
          <Camera className="mr-2 h-4 w-4" /> Save Snapshot
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-green-100 dark:bg-green-900/30">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
              <p className="text-sm text-slate-500">Total Assets</p>
            </div>
            <p className="text-2xl font-bold text-green-600">
              {formatCurrency(totalAssets)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 rounded-full bg-red-100 dark:bg-red-900/30">
                <TrendingDown className="h-5 w-5 text-red-600" />
              </div>
              <p className="text-sm text-slate-500">Total Liabilities</p>
            </div>
            <p className="text-2xl font-bold text-red-600">
              {formatCurrency(totalLiabilities)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div
                className={`p-2 rounded-full ${
                  netWorth >= 0
                    ? 'bg-emerald-100 dark:bg-emerald-900/30'
                    : 'bg-orange-100 dark:bg-orange-900/30'
                }`}
              >
                <Landmark
                  className={`h-5 w-5 ${
                    netWorth >= 0 ? 'text-emerald-600' : 'text-orange-600'
                  }`}
                />
              </div>
              <p className="text-sm text-slate-500">Net Worth</p>
            </div>
            <p
              className={`text-2xl font-bold ${
                netWorth >= 0 ? 'text-emerald-600' : 'text-orange-600'
              }`}
            >
              {formatCurrency(netWorth)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Net Worth Chart */}
      {chartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Net Worth Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip
                    formatter={(value) => formatCurrency(value as number)}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Assets"
                    stroke="#22c55e"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Liabilities"
                    stroke="#ef4444"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Net Worth"
                    stroke="#0ea5e9"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Assets Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-green-600" /> Assets
            </CardTitle>
            <Button size="sm" onClick={() => openAssetModal()}>
              <Plus className="mr-2 h-4 w-4" /> Add Asset
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {assets.length === 0 ? (
            <p className="text-slate-500">No assets added yet</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {assets.map((asset) => (
                <li key={asset.id} className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {asset.name}
                        </p>
                        <Badge variant="secondary">
                          {getAssetTypeLabel(asset.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        Updated {formatDateShort(asset.lastUpdated)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <p className="font-semibold text-green-600">
                        {formatCurrency(asset.value)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openAssetModal(asset)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-slate-400 hover:text-red-500"
                        onClick={() => deleteAsset(asset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Liabilities Section */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-red-600" /> Liabilities
            </CardTitle>
            <Button size="sm" onClick={() => openLiabilityModal()}>
              <Plus className="mr-2 h-4 w-4" /> Add Liability
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {liabilities.length === 0 ? (
            <p className="text-slate-500">No liabilities added yet</p>
          ) : (
            <ul className="divide-y divide-slate-100 dark:divide-slate-800">
              {liabilities.map((liability) => (
                <li key={liability.id} className="py-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900 dark:text-white truncate">
                          {liability.name}
                        </p>
                        <Badge variant="secondary">
                          {getLiabilityTypeLabel(liability.type)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-500">
                        {liability.interestRate
                          ? `${liability.interestRate}% APR • `
                          : ''}
                        Updated {formatDateShort(liability.lastUpdated)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 sm:gap-3 shrink-0">
                      <p className="font-semibold text-red-600">
                        {formatCurrency(liability.balance)}
                      </p>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => openLiabilityModal(liability)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-slate-400 hover:text-red-500"
                        onClick={() => deleteLiability(liability.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Asset Modal */}
      <Dialog open={assetModalOpen} onOpenChange={setAssetModalOpen}>
        <DialogClose onClose={closeAssetModal} />
        <DialogHeader>
          <DialogTitle>{editingAsset ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleAssetSubmit} className="space-y-4">
            <Input
              label="Asset Name"
              placeholder="e.g., Checking Account, 401k"
              value={assetFormData.name}
              onChange={(e) =>
                setAssetFormData({ ...assetFormData, name: e.target.value })
              }
              required
            />
            <Select
              label="Asset Type"
              options={assetTypeOptions}
              value={assetFormData.type}
              onChange={(e) =>
                setAssetFormData({
                  ...assetFormData,
                  type: e.target.value as AssetType,
                })
              }
            />
            <Input
              label="Current Value"
              type="number"
              step="0.01"
              min="0"
              placeholder="0.00"
              value={assetFormData.value}
              onChange={(e) =>
                setAssetFormData({ ...assetFormData, value: e.target.value })
              }
              required
            />
            <Input
              label="Notes (optional)"
              placeholder="Any additional details"
              value={assetFormData.notes}
              onChange={(e) =>
                setAssetFormData({ ...assetFormData, notes: e.target.value })
              }
            />
            <DialogFooter>
              <Button type="button" variant="outline" onClick={closeAssetModal}>
                Cancel
              </Button>
              <Button type="submit">
                {editingAsset ? 'Save Changes' : 'Add Asset'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Liability Modal */}
      <Dialog open={liabilityModalOpen} onOpenChange={setLiabilityModalOpen}>
        <DialogClose onClose={closeLiabilityModal} />
        <DialogHeader>
          <DialogTitle>
            {editingLiability ? 'Edit Liability' : 'Add Liability'}
          </DialogTitle>
        </DialogHeader>
        <DialogContent>
          <form onSubmit={handleLiabilitySubmit} className="space-y-4">
            <Input
              label="Liability Name"
              placeholder="e.g., Credit Card, Car Loan"
              value={liabilityFormData.name}
              onChange={(e) =>
                setLiabilityFormData({
                  ...liabilityFormData,
                  name: e.target.value,
                })
              }
              required
            />
            <Select
              label="Liability Type"
              options={liabilityTypeOptions}
              value={liabilityFormData.type}
              onChange={(e) =>
                setLiabilityFormData({
                  ...liabilityFormData,
                  type: e.target.value as LiabilityType,
                })
              }
            />
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Current Balance"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={liabilityFormData.balance}
                onChange={(e) =>
                  setLiabilityFormData({
                    ...liabilityFormData,
                    balance: e.target.value,
                  })
                }
                required
              />
              <Input
                label="Interest Rate (%)"
                type="number"
                step="0.01"
                min="0"
                max="100"
                placeholder="0.00"
                value={liabilityFormData.interestRate}
                onChange={(e) =>
                  setLiabilityFormData({
                    ...liabilityFormData,
                    interestRate: e.target.value,
                  })
                }
              />
            </div>
            <Input
              label="Notes (optional)"
              placeholder="Any additional details"
              value={liabilityFormData.notes}
              onChange={(e) =>
                setLiabilityFormData({
                  ...liabilityFormData,
                  notes: e.target.value,
                })
              }
            />
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeLiabilityModal}
              >
                Cancel
              </Button>
              <Button type="submit">
                {editingLiability ? 'Save Changes' : 'Add Liability'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};
