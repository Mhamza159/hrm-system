/**
 * @file ExpenseReportsPage.jsx
 * @description Monthly Corporate Expense Analytics & Category Breakdown Report.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.5)
 * - Permission: Can I="report.view" a="Report"
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Download,
  Receipt,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { useGetExpenseMonthlyReportQuery } from '../expensesApi.js';

export default function ExpenseReportsPage() {
  const currentMonthStr = new Date().toISOString().slice(0, 7);
  const [selectedMonth, setSelectedMonth] = useState(currentMonthStr);

  const { data, isLoading, error } = useGetExpenseMonthlyReportQuery({
    month: selectedMonth
  });

  const report = data?.data || { grandTotals: {}, breakdown: [] };
  const grandTotals = report.grandTotals || {};
  const breakdown = report.breakdown || [];

  const handleExportCsv = () => {
    if (breakdown.length === 0) return;

    const headers = ['Category', 'Code', 'Total Claims', 'Total Incurred (PKR)', 'Approved (PKR)', 'Reimbursed (PKR)', 'Pending (PKR)'];
    const rows = breakdown.map((b) => [
      `"${b._id}"`,
      `"${b.categoryCode}"`,
      b.totalClaims,
      (b.totalAmountPaisa / 100).toFixed(2),
      (b.approvedAmountPaisa / 100).toFixed(2),
      (b.reimbursedAmountPaisa / 100).toFixed(2),
      (b.pendingAmountPaisa / 100).toFixed(2)
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Expense_Report_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Monthly Expense Reports & Analytics"
        description="Comprehensive audit breakdown of corporate expenditure across categories and departments."
        actions={
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-700 dark:text-slate-300">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent border-none text-xs focus:outline-none"
              />
            </div>

            <button
              onClick={handleExportCsv}
              disabled={breakdown.length === 0}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm transition disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </button>
          </div>
        }
      />

      {/* KPI Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total Claims Volume</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            {grandTotals.totalClaims || 0}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Incurred during {selectedMonth}</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 block mb-1">Total Incurred Outlay</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white">
            PKR {((grandTotals.totalAmountPaisa || 0) / 100).toLocaleString('en-PK')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Gross submitted expenses</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 block mb-1">Disbursed Reimbursements</span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
            PKR {((grandTotals.reimbursedAmountPaisa || 0) / 100).toLocaleString('en-PK')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Settled via wire or payroll</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
          <span className="text-xs font-medium text-slate-500 block mb-1">Pending Approval Pipeline</span>
          <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
            PKR {((grandTotals.pendingAmountPaisa || 0) / 100).toLocaleString('en-PK')}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Awaiting manager/admin review</span>
        </div>
      </div>

      {/* Category Breakdown Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            Category Breakdown & Budget Utilization
          </h3>
          <span className="text-xs text-slate-500">{breakdown.length} spending categories active</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Compiling report analytics...</div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-500">Failed to aggregate monthly report.</div>
        ) : breakdown.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">No Expense Claims Recorded</h4>
            <p className="text-xs text-slate-500 mt-1">
              There were no out-of-pocket corporate claims submitted for {selectedMonth}.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 font-medium">
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Code</th>
                  <th className="py-3 px-6">Volume</th>
                  <th className="py-3 px-6">Total Incurred</th>
                  <th className="py-3 px-6">Authorized Approved</th>
                  <th className="py-3 px-6">Reimbursed Payout</th>
                  <th className="py-3 px-6">Pending</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {breakdown.map((row) => (
                  <tr key={row._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">{row._id}</td>
                    <td className="py-3.5 px-6">
                      <span className="font-mono text-[11px] px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {row.categoryCode}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300">
                      {row.totalClaims} {row.totalClaims === 1 ? 'claim' : 'claims'}
                    </td>
                    <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">
                      PKR {(row.totalAmountPaisa / 100).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3.5 px-6 text-slate-700 dark:text-slate-300">
                      PKR {(row.approvedAmountPaisa / 100).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-emerald-600 dark:text-emerald-400">
                      PKR {(row.reimbursedAmountPaisa / 100).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3.5 px-6 text-amber-600 dark:text-amber-400 font-medium">
                      PKR {(row.pendingAmountPaisa / 100).toLocaleString('en-PK')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

