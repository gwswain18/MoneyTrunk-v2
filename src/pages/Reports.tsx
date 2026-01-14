import { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Select } from '../components/ui/select';
import { FileText, Download, Calendar, TrendingUp, PieChart } from 'lucide-react';
import { useAppStore } from '../stores/useAppStore';
import { formatCurrency, getMonthKey } from '../lib/utils';
import { Frequency, BillStatus } from '../types';

type ReportType = 'monthly' | 'expenses' | 'budget';

export const Reports: React.FC = () => {
  const { bills, subscriptions, income, expenses, savings, borrowed, lent, settings } = useAppStore();
  const [reportType, setReportType] = useState<ReportType>('monthly');
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());

  // Generate month options for last 12 months
  const monthOptions = useMemo(() => {
    const options = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = getMonthKey(d);
      const label = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      options.push({ value: key, label });
    }
    return options;
  }, []);

  // Calculate monthly data
  const monthlyData = useMemo(() => {
    const monthExpenses = expenses
      .filter((e) => e.date.startsWith(selectedMonth))
      .reduce((sum, e) => sum + e.amount, 0);

    const monthBills = bills
      .filter((b) => b.dueDate.startsWith(selectedMonth))
      .reduce((sum, b) => sum + b.amountDue, 0);

    const monthIncome = income.reduce((sum, inc) => {
      switch (inc.frequency) {
        case Frequency.Monthly:
          return sum + inc.amount;
        case Frequency.BiWeekly:
          return sum + inc.amount * 2;
        case Frequency.Weekly:
          return sum + inc.amount * 4;
        default:
          return sum;
      }
    }, 0);

    const monthSubscriptions = subscriptions.reduce((sum, s) => {
      return sum + (s.billingCycle === 'monthly' ? s.amount : s.amount / 12);
    }, 0);

    const totalSavings = savings.reduce((sum, s) => sum + s.currentAmount, 0);
    const totalBorrowed = borrowed.reduce((sum, b) => sum + b.currentBalance, 0);
    const totalLent = lent.reduce((sum, l) => sum + l.currentBalance, 0);

    return {
      income: monthIncome,
      expenses: monthExpenses,
      bills: monthBills,
      subscriptions: monthSubscriptions,
      totalSpent: monthExpenses + monthBills + monthSubscriptions,
      savings: totalSavings,
      borrowed: totalBorrowed,
      lent: totalLent,
      netCashFlow: monthIncome - (monthExpenses + monthBills + monthSubscriptions),
    };
  }, [selectedMonth, expenses, bills, income, subscriptions, savings, borrowed, lent]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const byCategory: Record<string, number> = {};
    expenses
      .filter((e) => e.date.startsWith(selectedMonth))
      .forEach((e) => {
        byCategory[e.category] = (byCategory[e.category] || 0) + e.amount;
      });
    return Object.entries(byCategory)
      .map(([category, amount]) => ({ category, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, selectedMonth]);

  const generatePDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const [year, month] = selectedMonth.split('-');
    const monthName = new Date(parseInt(year), parseInt(month) - 1).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });

    // Header
    doc.setFontSize(24);
    doc.setTextColor(16, 185, 129); // emerald-500
    doc.text('MoneyTrunk', 20, 25);

    doc.setFontSize(16);
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(
      reportType === 'monthly'
        ? `Monthly Summary - ${monthName}`
        : reportType === 'expenses'
        ? `Expense Report - ${monthName}`
        : `Budget Analysis - ${monthName}`,
      20,
      35
    );

    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text(`Generated on ${new Date().toLocaleDateString()}`, 20, 42);

    let yPos = 55;

    if (reportType === 'monthly') {
      // Summary section
      doc.setFontSize(14);
      doc.setTextColor(51, 65, 85);
      doc.text('Financial Summary', 20, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['Category', 'Amount']],
        body: [
          ['Monthly Income', formatCurrency(monthlyData.income)],
          ['Expenses', formatCurrency(monthlyData.expenses)],
          ['Bills', formatCurrency(monthlyData.bills)],
          ['Subscriptions', formatCurrency(monthlyData.subscriptions)],
          ['Total Spent', formatCurrency(monthlyData.totalSpent)],
          ['Net Cash Flow', formatCurrency(monthlyData.netCashFlow)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;

      // Assets & Liabilities
      doc.setFontSize(14);
      doc.text('Assets & Liabilities', 20, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['Item', 'Amount']],
        body: [
          ['Total Savings', formatCurrency(monthlyData.savings)],
          ['Money Lent Out', formatCurrency(monthlyData.lent)],
          ['Money Borrowed', formatCurrency(monthlyData.borrowed)],
        ],
        theme: 'striped',
        headStyles: { fillColor: [59, 130, 246] },
      });
    } else if (reportType === 'expenses') {
      // Expense breakdown by category
      doc.setFontSize(14);
      doc.text('Expenses by Category', 20, yPos);
      yPos += 10;

      if (categoryBreakdown.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Category', 'Amount', '% of Total']],
          body: categoryBreakdown.map((cat) => [
            cat.category,
            formatCurrency(cat.amount),
            `${((cat.amount / monthlyData.expenses) * 100).toFixed(1)}%`,
          ]),
          theme: 'striped',
          headStyles: { fillColor: [16, 185, 129] },
        });

        yPos = (doc as any).lastAutoTable.finalY + 20;
      }

      // Individual expenses
      doc.setFontSize(14);
      doc.text('All Expenses', 20, yPos);
      yPos += 10;

      const monthExpenses = expenses
        .filter((e) => e.date.startsWith(selectedMonth))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      if (monthExpenses.length > 0) {
        autoTable(doc, {
          startY: yPos,
          head: [['Date', 'Description', 'Category', 'Amount']],
          body: monthExpenses.map((e) => [
            e.date,
            e.description,
            e.category,
            formatCurrency(e.amount),
          ]),
          theme: 'striped',
          headStyles: { fillColor: [59, 130, 246] },
        });
      }
    } else if (reportType === 'budget') {
      // Budget analysis
      const budget = settings.monthlyBudget;
      const spent = monthlyData.totalSpent;
      const remaining = budget - spent;
      const percentUsed = budget > 0 ? (spent / budget) * 100 : 0;

      doc.setFontSize(14);
      doc.text('Budget Overview', 20, yPos);
      yPos += 10;

      autoTable(doc, {
        startY: yPos,
        head: [['Metric', 'Value']],
        body: [
          ['Monthly Budget', formatCurrency(budget)],
          ['Total Spent', formatCurrency(spent)],
          ['Remaining', formatCurrency(remaining)],
          ['Budget Used', `${percentUsed.toFixed(1)}%`],
        ],
        theme: 'striped',
        headStyles: { fillColor: [16, 185, 129] },
      });

      yPos = (doc as any).lastAutoTable.finalY + 20;

      // Recommendations
      doc.setFontSize(14);
      doc.text('Analysis', 20, yPos);
      yPos += 10;

      doc.setFontSize(11);
      doc.setTextColor(51, 65, 85);

      if (percentUsed > 100) {
        doc.text(`• You've exceeded your budget by ${formatCurrency(Math.abs(remaining))}`, 25, yPos);
        yPos += 7;
        doc.text('• Consider reviewing your spending in the highest categories', 25, yPos);
      } else if (percentUsed > 80) {
        doc.text(`• You're at ${percentUsed.toFixed(0)}% of your budget`, 25, yPos);
        yPos += 7;
        doc.text('• Be mindful of remaining expenses this month', 25, yPos);
      } else {
        doc.text(`• Great job! You've used only ${percentUsed.toFixed(0)}% of your budget`, 25, yPos);
        yPos += 7;
        doc.text(`• You have ${formatCurrency(remaining)} remaining`, 25, yPos);
      }

      if (categoryBreakdown.length > 0) {
        yPos += 15;
        doc.text(`• Your highest expense category is ${categoryBreakdown[0].category}`, 25, yPos);
        yPos += 7;
        doc.text(`  (${formatCurrency(categoryBreakdown[0].amount)} - ${((categoryBreakdown[0].amount / spent) * 100).toFixed(0)}% of spending)`, 25, yPos);
      }
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(9);
    doc.setTextColor(148, 163, 184);
    doc.text('Generated by MoneyTrunk v2.0', pageWidth / 2, pageHeight - 10, { align: 'center' });

    // Save
    doc.save(`moneytrunk-${reportType}-${selectedMonth}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Reports</h1>
          <p className="text-slate-500">Generate and export financial reports</p>
        </div>
      </div>

      {/* Report Options */}
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Select
              label="Report Type"
              value={reportType}
              onChange={(e) => setReportType(e.target.value as ReportType)}
              options={[
                { value: 'monthly', label: 'Monthly Summary' },
                { value: 'expenses', label: 'Expense Report' },
                { value: 'budget', label: 'Budget Analysis' },
              ]}
            />
            <Select
              label="Month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              options={monthOptions}
            />
            <div className="flex items-end">
              <Button onClick={generatePDF} className="w-full">
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
        </CardHeader>
        <CardContent>
          {reportType === 'monthly' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <div className="rounded-lg bg-green-50 p-4 dark:bg-green-900/20">
                  <p className="text-sm text-green-600 dark:text-green-400">Income</p>
                  <p className="text-xl font-bold text-green-700 dark:text-green-300">
                    {formatCurrency(monthlyData.income)}
                  </p>
                </div>
                <div className="rounded-lg bg-red-50 p-4 dark:bg-red-900/20">
                  <p className="text-sm text-red-600 dark:text-red-400">Total Spent</p>
                  <p className="text-xl font-bold text-red-700 dark:text-red-300">
                    {formatCurrency(monthlyData.totalSpent)}
                  </p>
                </div>
                <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
                  <p className="text-sm text-blue-600 dark:text-blue-400">Savings</p>
                  <p className="text-xl font-bold text-blue-700 dark:text-blue-300">
                    {formatCurrency(monthlyData.savings)}
                  </p>
                </div>
                <div
                  className={`rounded-lg p-4 ${
                    monthlyData.netCashFlow >= 0
                      ? 'bg-emerald-50 dark:bg-emerald-900/20'
                      : 'bg-orange-50 dark:bg-orange-900/20'
                  }`}
                >
                  <p
                    className={`text-sm ${
                      monthlyData.netCashFlow >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-orange-600 dark:text-orange-400'
                    }`}
                  >
                    Net Cash Flow
                  </p>
                  <p
                    className={`text-xl font-bold ${
                      monthlyData.netCashFlow >= 0
                        ? 'text-emerald-700 dark:text-emerald-300'
                        : 'text-orange-700 dark:text-orange-300'
                    }`}
                  >
                    {formatCurrency(monthlyData.netCashFlow)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {reportType === 'expenses' && (
            <div className="space-y-4">
              <p className="text-slate-600 dark:text-slate-400">
                Expense breakdown for{' '}
                {new Date(selectedMonth + '-01').toLocaleDateString('en-US', {
                  month: 'long',
                  year: 'numeric',
                })}
              </p>
              {categoryBreakdown.length === 0 ? (
                <p className="text-slate-500">No expenses recorded for this month</p>
              ) : (
                <div className="space-y-2">
                  {categoryBreakdown.slice(0, 5).map((cat) => (
                    <div key={cat.category} className="flex items-center justify-between">
                      <span className="text-slate-700 dark:text-slate-300">{cat.category}</span>
                      <span className="font-medium">{formatCurrency(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {reportType === 'budget' && (
            <div className="space-y-4">
              {settings.monthlyBudget > 0 ? (
                <>
                  <div className="flex items-center justify-between">
                    <span>Budget</span>
                    <span className="font-medium">{formatCurrency(settings.monthlyBudget)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Spent</span>
                    <span className="font-medium">{formatCurrency(monthlyData.totalSpent)}</span>
                  </div>
                  <div className="h-4 w-full rounded-full bg-slate-200 dark:bg-slate-700">
                    <div
                      className={`h-4 rounded-full ${
                        monthlyData.totalSpent > settings.monthlyBudget
                          ? 'bg-red-500'
                          : monthlyData.totalSpent > settings.monthlyBudget * 0.8
                          ? 'bg-yellow-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min((monthlyData.totalSpent / settings.monthlyBudget) * 100, 100)}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-slate-500">
                    {((monthlyData.totalSpent / settings.monthlyBudget) * 100).toFixed(1)}% of budget used
                  </p>
                </>
              ) : (
                <p className="text-slate-500">
                  Set a monthly budget in Settings to enable budget analysis
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Report Types Info */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card
          className={`cursor-pointer transition-all ${
            reportType === 'monthly' ? 'ring-2 ring-emerald-500' : ''
          }`}
          onClick={() => setReportType('monthly')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-emerald-500" />
              Monthly Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Overview of income, expenses, savings, and net worth changes
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            reportType === 'expenses' ? 'ring-2 ring-emerald-500' : ''
          }`}
          onClick={() => setReportType('expenses')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <PieChart className="h-5 w-5 text-blue-500" />
              Expense Report
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Detailed breakdown of spending by category and date
            </p>
          </CardContent>
        </Card>

        <Card
          className={`cursor-pointer transition-all ${
            reportType === 'budget' ? 'ring-2 ring-emerald-500' : ''
          }`}
          onClick={() => setReportType('budget')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <TrendingUp className="h-5 w-5 text-purple-500" />
              Budget Analysis
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Compare actual spending against budget with recommendations
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
