import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { FileText, Download } from 'lucide-react';

export const Reports: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Reports
        </h1>
        <p className="text-slate-500">Generate and export financial reports</p>
      </div>

      {/* Coming Soon */}
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-16">
          <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800">
            <FileText className="h-12 w-12 text-slate-400" />
          </div>
          <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">
            PDF Reports Coming Soon
          </h3>
          <p className="mt-2 text-center text-slate-500 max-w-md">
            Generate comprehensive financial reports including monthly summaries,
            expense breakdowns, and budget analysis. Export as PDF for easy sharing.
          </p>
          <Button className="mt-6" disabled>
            <Download className="mr-2 h-4 w-4" /> Generate Report
          </Button>
        </CardContent>
      </Card>

      {/* Report Types Preview */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">Monthly Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Overview of income, expenses, savings, and net worth changes
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">Expense Report</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-slate-500">
              Detailed breakdown of spending by category and date
            </p>
          </CardContent>
        </Card>

        <Card className="opacity-60">
          <CardHeader>
            <CardTitle className="text-base">Budget Analysis</CardTitle>
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
