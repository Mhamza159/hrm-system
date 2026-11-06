/**
 * @file LoanLedgerPage.jsx
 * @description Executive Company-Wide Borrowing Ledger, Outstanding Balance Tracking, & Early Settlement.
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.6)
 * - Layer: Frontend Feature Page
 * - Theme: Forest & Emerald Design System
 * - Design Contract: Standard DataTable, dynamic real-time database fields, PBAC permission guards.
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  CreditCard,
  Search,
  RotateCcw,
  Calendar,
  DollarSign
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { DataTable } from '../../../components/common/DataTable.jsx';
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

  // Queries
  const {
    data: summaryRes,
    isLoading: isLoadingSummary,
    isFetching: isFetchingSummary,
    refetch: refetchSummary
  } = useGetLoanLedgerSummaryQuery();
  const summary = summaryRes?.data;

  const {
    data: loansRes,
    isLoading: isLoadingLoans,
    isFetching: isFetchingLoans,
    refetch: refetchLoans
  } = useGetLoansQuery({
    page: 1,
    limit: 100,
    status: statusFilter || undefined,
    type: typeFilter || undefined
  });
  const loans = loansRes?.data || [];

  // Filter in memory for search query
  const filteredLoans = useMemo(() => {
    return loans.filter((loan) => {
      if (typeFilter && loan.type !== typeFilter) return false;
      if (statusFilter && loan.status !== statusFilter) return false;
      if (!searchTerm) return true;

      const term = searchTerm.toLowerCase();
      const loanIdMatch = loan.loanId?.toLowerCase().includes(term);
      const emp = loan.employeeId;
      const empName = (emp?.name || emp?.user?.name || emp?.userId?.name || '').toLowerCase();
      const empCode = (emp?.employeeCode || '').toLowerCase();
      const deptName = (emp?.departmentId?.name || (typeof emp?.departmentId === 'string' ? emp.departmentId : '') || '').toLowerCase();

      return loanIdMatch || empName.includes(term) || empCode.includes(term) || deptName.includes(term);
    });
  }, [loans, searchTerm, typeFilter, statusFilter]);

  const totalDisbursedPkr = summary ? (summary.totalDisbursedPaisa || 0) / 100 : 0;
  const totalRepaidPkr = summary ? (summary.totalRepaidPaisa || 0) / 100 : 0;
  const totalOutstandingPkr = summary ? (summary.totalOutstandingPaisa || 0) / 100 : 0;
  const recoveryRate = totalDisbursedPkr > 0 ? Math.round((totalRepaidPkr / totalDisbursedPkr) * 100) : 0;

  // Columns for DataTable
  const columns = useMemo(
    () => [
      {
        header: 'Loan ID & Type',
        accessor: 'loanId',
        sortable: true,
        cell: (loan) => (
          <div className="font-mono">
            <div className="font-bold text-slate-900 dark:text-white">
              {loan.loanId}
            </div>
            <span
              className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                loan.type === 'advance'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300/60 dark:border-amber-500/30'
                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300/60 dark:border-emerald-500/30'
              }`}
            >
              {loan.type}
            </span>
          </div>
        )
      },
      {
        header: 'Borrower Employee',
        accessor: (loan) => loan.employeeId?.name || loan.employeeId?.user?.name || '',
        sortable: true,
        cell: (loan) => {
          const emp = loan.employeeId;
          const name = emp?.name || emp?.user?.name || emp?.userId?.name || 'Employee';
          const code = emp?.employeeCode || '-';
          const dept = emp?.departmentId?.name || (typeof emp?.departmentId === 'string' ? emp.departmentId : '') || 'General';
          const initial = name.charAt(0).toUpperCase() || 'E';

          return (
            <div className="flex items-center gap-3">
              {emp?.avatar ? (
                <img
                  src={emp.avatar}
                  alt={name}
                  className="w-8 h-8 rounded-full object-cover border border-emerald-200/60 dark:border-[#1A3125] shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00C471] dark:text-[#00C471] font-bold border border-emerald-200/60 dark:border-[#1A3125] flex items-center justify-center text-xs shrink-0 select-none">
                  {initial}
                </div>
              )}
              <div>
                <div className="font-semibold text-slate-900 dark:text-white">
                  {name}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {code} • {dept}
                </div>
              </div>
            </div>
          );
        }
      },
      {
        header: 'Principal',
        accessor: 'amount',
        sortable: true,
        cell: (loan) => (
          <span className="font-semibold text-slate-900 dark:text-white tabular-nums">
            PKR {((loan.amount || 0) / 100).toLocaleString()}
          </span>
        )
      },
      {
        header: 'Tenure / Mo',
        accessor: 'repaymentTenureMonths',
        sortable: true,
        cell: (loan) => (
          <div>
            <div className="font-medium text-slate-900 dark:text-white tabular-nums">
              {loan.repaymentTenureMonths || 1} mo
            </div>
            <div className="text-[11px] text-slate-400 tabular-nums">
              PKR {(((loan.monthlyInstallment || 0) / 100)).toLocaleString()}/mo
            </div>
          </div>
        )
      },
      {
        header: 'Repaid',
        accessor: 'totalRepaid',
        sortable: true,
        cell: (loan) => (
          <span className="font-semibold text-emerald-600 dark:text-[#00C471] tabular-nums">
            PKR {((loan.totalRepaid || 0) / 100).toLocaleString()}
          </span>
        )
      },
      {
        header: 'Balance',
        accessor: 'remainingBalance',
        sortable: true,
        cell: (loan) => {
          const bal = (loan.remainingBalance || 0) / 100;
          return (
            <span
              className={`font-bold tabular-nums ${
                bal > 0 ? 'text-rose-600 dark:text-rose-400' : 'text-slate-400 dark:text-slate-500'
              }`}
            >
              PKR {bal.toLocaleString()}
            </span>
          );
        }
      },
      {
        header: 'Status',
        accessor: 'status',
        sortable: true,
        cell: (loan) => <StatusBadge status={loan.status} />
      },
      {
        header: 'Actions',
        className: 'text-right',
        cell: (loan) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setScheduleLoanId(loan._id)}
              className="px-2.5 py-1 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] rounded-lg text-xs font-medium transition-colors cursor-pointer"
              title="View Amortization Schedule"
            >
              Schedule
            </button>

            {loan.status === 'active' && (loan.remainingBalance || 0) > 0 && (
              <Can I="loan.prepay" a="Loan">
                <button
                  type="button"
                  onClick={() => setPrepayTargetLoan(loan)}
                  className="px-2.5 py-1 text-[#00C471] hover:bg-emerald-50 dark:hover:bg-[#00C471]/15 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Settle Early
                </button>
              </Can>
            )}
          </div>
        )
      }
    ],
    []
  );

  if ((isLoadingSummary || isLoadingLoans) && !loansRes && !summaryRes) {
    return (
      <div className="space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Company Borrowing Ledger"
        description="Comprehensive audit of all active loans, salary advances, amortization, and collections."
        actions={
          <RefreshButton
            onRefresh={() => {
              refetchSummary();
              refetchLoans();
            }}
            isFetching={isFetchingSummary || isFetchingLoans}
          />
        }
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

      {/* Filters and Search Bar Toolbar */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-3.5 flex flex-col md:flex-row gap-3 items-center justify-between shadow-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Employee or Loan ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-8 py-2 rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] transition-all"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] cursor-pointer transition-all"
          >
            <option value="">All Types</option>
            <option value="loan">Loans</option>
            <option value="advance">Salary Advances</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] cursor-pointer transition-all"
          >
            <option value="">All Statuses</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
            <option value="pending_recommendation">Pending Rec</option>
            <option value="pending_hr">Pending HR</option>
            <option value="pending_admin">Pending Admin</option>
            <option value="rejected">Rejected</option>
          </select>

          {(searchTerm || typeFilter || statusFilter) && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setTypeFilter('');
                setStatusFilter('');
              }}
              className="flex items-center gap-1 text-xs px-2.5 py-2 rounded-xl text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
              title="Reset all filters"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Main High-Density DataTable */}
      <DataTable
        columns={columns}
        data={filteredLoans}
        isLoading={isLoadingLoans}
        showSearch={false}
        emptyTitle="No borrowing accounts found"
        emptyDescription="No company loans or salary advances match the selected filter criteria."
      />

      {/* Schedule Drawer */}
      <LoanScheduleDrawer
        loanId={scheduleLoanId}
        onClose={() => setScheduleLoanId(null)}
        onPrepayClick={(l) => setPrepayTargetLoan(l)}
      />

      {/* Early Prepayment Settlement Modal */}
      <EarlyPrepaymentModal
        isOpen={Boolean(prepayTargetLoan)}
        loan={prepayTargetLoan}
        onClose={() => {
          setPrepayTargetLoan(null);
          refetchLoans();
          refetchSummary();
        }}
      />
    </div>
  );
}

export default LoanLedgerPage;
