import { useRef, useState } from 'react';
import { Download, Upload, Trash2, User, Moon, Shield, Save } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
  DialogClose,
} from '../components/ui/dialog';
import { useAppStore } from '../stores/useAppStore';

export const Settings: React.FC = () => {
  const { settings, updateSettings, importData, resetData, bills, subscriptions, income, expenses, savings, borrowed, lent, tags } = useAppStore();
  const [userName, setUserName] = useState(settings.userName);
  const [monthlyBudget, setMonthlyBudget] = useState(settings.monthlyBudget.toString());
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSaveProfile = () => {
    updateSettings({
      userName,
      monthlyBudget: parseFloat(monthlyBudget) || 0,
    });
    alert('Settings saved!');
  };

  const handleExport = () => {
    const data = {
      bills,
      subscriptions,
      income,
      expenses,
      savings,
      borrowed,
      lent,
      settings,
      tags,
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const href = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = href;
    link.download = `moneytrunk-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(href);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);

        // Validate and provide defaults
        const validatedData = {
          bills: Array.isArray(json.bills) ? json.bills : [],
          subscriptions: Array.isArray(json.subscriptions) ? json.subscriptions : [],
          income: Array.isArray(json.income) ? json.income : [],
          expenses: Array.isArray(json.expenses) ? json.expenses : [],
          savings: Array.isArray(json.savings) ? json.savings : [],
          borrowed: Array.isArray(json.borrowed) ? json.borrowed : [],
          lent: Array.isArray(json.lent) ? json.lent : [],
          settings: json.settings || settings,
          tags: Array.isArray(json.tags) ? json.tags : [],
        };

        importData(validatedData);
        setUserName(validatedData.settings.userName || '');
        setMonthlyBudget(validatedData.settings.monthlyBudget?.toString() || '0');
        alert('Data imported successfully!');
      } catch (error) {
        alert('Failed to import data. Please check the file format.');
        console.error(error);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleReset = () => {
    resetData();
    setUserName('');
    setMonthlyBudget('0');
    setResetConfirmOpen(false);
    alert('All data has been cleared.');
  };

  const toggleDarkMode = () => {
    const newMode = !settings.darkMode;
    updateSettings({ darkMode: newMode });
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Settings
        </h1>
        <p className="text-slate-500">Manage your preferences and data</p>
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" /> Profile
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="Your Name"
            placeholder="Enter your name"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
          />
          <Input
            label="Monthly Budget"
            type="number"
            min="0"
            step="0.01"
            placeholder="0.00"
            value={monthlyBudget}
            onChange={(e) => setMonthlyBudget(e.target.value)}
          />
          <Button onClick={handleSaveProfile}>
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
        </CardContent>
      </Card>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Moon className="h-5 w-5" /> Appearance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-slate-900 dark:text-white">
                Dark Mode
              </p>
              <p className="text-sm text-slate-500">
                Toggle dark mode on or off
              </p>
            </div>
            <Button
              variant={settings.darkMode ? 'default' : 'outline'}
              onClick={toggleDarkMode}
            >
              {settings.darkMode ? 'On' : 'Off'}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" /> Data Management
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Export */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Download className="h-5 w-5 text-blue-600" />
              <h4 className="font-medium">Export Data</h4>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Download all your data as a JSON backup file
            </p>
            <Button variant="outline" onClick={handleExport}>
              Download Backup
            </Button>
          </div>

          {/* Import */}
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Upload className="h-5 w-5 text-green-600" />
              <h4 className="font-medium">Import Data</h4>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Restore from a previously saved backup file
            </p>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <Button variant="outline" onClick={handleImportClick}>
              Upload Backup File
            </Button>
          </div>

          {/* Danger Zone */}
          <div className="border-t pt-6">
            <div className="flex items-center gap-2 mb-2">
              <Trash2 className="h-5 w-5 text-red-600" />
              <h4 className="font-medium text-red-600">Danger Zone</h4>
            </div>
            <p className="text-sm text-slate-500 mb-3">
              Permanently delete all data and reset the app
            </p>
            <Button
              variant="destructive"
              onClick={() => setResetConfirmOpen(true)}
            >
              Reset All Data
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* App Info */}
      <div className="text-center text-sm text-slate-400 pt-4">
        <p>MoneyTrunk v2.0 • Local Storage Edition</p>
      </div>

      {/* Reset Confirmation */}
      <Dialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
        <DialogClose onClose={() => setResetConfirmOpen(false)} />
        <DialogHeader>
          <DialogTitle className="text-red-600">Reset All Data</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-slate-600 dark:text-slate-400">
            ARE YOU SURE? This will delete ALL your data permanently. This action
            cannot be undone.
          </p>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setResetConfirmOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReset}>
              Delete Everything
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
