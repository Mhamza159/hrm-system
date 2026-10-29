/**
 * @file LoanLedgerPage.jsx
 * @description Executive Company-Wide Borrowing Ledger, Outstanding Balance Tracking, & Early Settlement.
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.6)
 * - Layer: Frontend Feature Page
 * - Theme: Forest & Emerald Design System
 */

import React, { useState } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Building2,
  Search,
  Filter,
  Eye,
  CreditCard,
  User,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { useGetLoansQuery, useGetLoanLedgerSummaryQuery } from '../loansApi.js';
import { LoanStatsCard } from '../components/LoanStatsCard.jsx';
import { LoanScheduleDrawer } from '../components/LoanScheduleDrawer.jsx';
import { EarlyPrepaymentModal } from '../components/EarlyPrepaymentModal.jsx';

export function LoanLedgerPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [scheduleLoanId, setScheduleLoanId] = useState(null);
  const [prepayTargetLoan, setPrepayTargetLoan] = useState(null);

  const { data: summaryRes, isLoading: isLoadingSummary } = useGetLoanLedgerSummaryQuery();
  const summary = summaryRes?.data;

  const { data: loansRes, isLoading: isLoadingLoans, refetch } = useGetLoansQuery({
    page: 1,
    limit: 100,
    status: statusFilter || undefined,
    type: typeFilter || undefined
  });
  const loans = loansRes?.data || [];

  // Filter in memory for search
  const filteredLoans = loans.filter((loan) => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const loanIdMatch = loan.loanId?.toLowerCase().includes(term);
    const emp = loan.employeeId;
    const empName = emp?.user?.name || `${emp?.firstName || ''} ${emp?.lastName || ''}`;
    const empMatch = empName.toLowerCase().includes(term);
    return loanIdMatch || empMatch;
  });

  const totalDisbursedPkr = summary ? (summary.totalDisbursedPaisa || 0) / 100 : 0;
  const totalRepaidPkr = summary ? (summary.totalRepaidPaisa || 0) / 100 : 0;
  const totalOutstandingPkr = summary ? (summary.totalOutstandingPaisa || 0) / 100 : 0;
  const recoveryRate = totalDisbursedPkr > 0 ? Math.round((totalRepaidPkr / totalDisbursedPkr) * 100) : 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Borrowing Ledger"
        description="Comprehensive audit of all active loans, salary advances, amortization, and collections."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <LoanStatsCard
          title="Total Capital Disbursed"
          value={`PKR ${totalDisbursedPkr.toLocaleString()}`}
          subtitle={`${summary?.totalLoansCount || 0} lifetime loan/advance accounts`}
          icon={TrendingUp}
          color="blue"
        />
        <LoanStatsCard
          title="Recovered Capital"
          value={`PKR ${totalRepaidPkr.toLocaleString()}`}
          subtitle={`${recoveryRate}% historical recovery rate`}
          icon={ShieldCheck}
          color="emerald"
        />
        <LoanStatsCard
          title="Current Outstanding Exposure"
          value={`PKR ${totalOutstandingPkr.toLocaleString()}`}
          subtitle={`${summary?.activeAccountsCount || 0} accounts actively deducting`}
          icon={TrendingDown}
          color="rose"
        />
        <LoanStatsCard
          title="Active Accounts"
          value={summary?.activeAccountsCount || 0}
          subtitle="Currently serviced via payroll"
          icon={CreditCard}
          color="amber"
        />
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Employee or Loan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Types</option>
            <option value="loan">Loans</option>
            <option value="advance">Salary Advances</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-300 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="pending_recommendation">Pending Rec</option>
            <option value="pending_hr">Pending HR</option>
            <option value="pending_admin">Pending Admin</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
            <thead className="bg-slate-50 dark:bg-slate-800/50 text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="px-5 py-3.5 font-bold">Loan ID & Type</th>
                <th className="px-5 py-3.5 font-bold">Borrower Employee</th>
                <th className="px-5 py-3.5 font-bold">Principal</th>
                <th className="px-5 py-3.5 font-bold">Tenure / Mo</th>
                <th className="px-5 py-3.5 font-bold">Repaid</th>
                <th className="px-5 py-3.5 font-bold">Balance</th>
                <th className="px-5 py-3.5 font-bold">Status</th>
                <th className="px-5 py-3.5 font-bold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {isLoadingLoans ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400 animate-pulse">
                    Loading borrowing ledger records...
                  </td>
                </tr>
              ) : filteredLoans.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-5 py-10 text-center text-slate-400">
                    No borrowing records found matching criteria.
                  </td>
                </tr>
              ) : (
                filteredLoans.map((loan) => {
                  const amountPkr = (loan.amount || 0) / 100;
                  const repaidPkr = (loan.totalRepaid || 0) / 100;
                  const remainingPkr = (loan.remainingBalance || 0) / 100;
                  const installmentPkr = (loan.monthlyInstallment || 0) / 100;
                  const emp = loan.employeeId;
                  const empName = emp?.user?.name || `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim() || 'Employee';

                  return (
                    <tr
                      key={loan._id}
                      className="hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900 dark:text-white">
                        <div>{loan.loanId}</div>
                        <span className="uppercase text-[10px] font-semibold text-slate-400">
                          {loan.type}
                        </span>
                      </td>

                      <td className="px-5 py-3.5">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {empName}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {emp?.employeeId || ''} • {emp?.departmentId?.name || ''}
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-slate-900 dark:text-white">
                        PKR {amountPkr.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5">
                        <div>{loan.repaymentTenureMonths} mo</div>
                        <div className="text-[11px] text-slate-400">
                          PKR {installmentPkr.toLocaleString()}/mo
                        </div>
                      </td>

                      <td className="px-5 py-3.5 font-semibold text-emerald-600 dark:text-emerald-400">
                        PKR {repaidPkr.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5 font-bold text-rose-600 dark:text-rose-400">
                        PKR {remainingPkr.toLocaleString()}
                      </td>

                      <td className="px-5 py-3.5">
                        <StatusBadge status={loan.status} />
                      </td>

                      <td className="px-5 py-3.5 text-right space-x-2">
                        <button
                          onClick={() => setScheduleLoanId(loan._id)}
                          className="px-2.5 py-1 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs font-medium"
                          title="View Schedule"
                        >
                          Schedule
                        </button>

                        {loan.status === 'active' && (
                          <Can I="loan.prepay" a="Loan">
                            <button
                              onClick={() => setPrepayTargetLoan(loan)}
                              className="px-2.5 py-1 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg text-xs font-semibold"
                            >
                              Settle Early
                            </button>
                          </Can>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Drawer */}
      <LoanScheduleDrawer
        loanId={scheduleLoanId}
        onClose={() => setScheduleLoanId(null)}
        onPrepayClick={(l) => setPrepayTargetLoan(l)}
      />

      {/* Early Prepayment Modal */}
      <EarlyPrepaymentModal
        isOpen={Boolean(prepayTargetLoan)}
        loan={prepayTargetLoan}
        onClose={() => {
          setPrepayTargetLoan(null);
          refetch();
        }}
      />
    </div>
  );
}

export default LoanLedgerPage;
