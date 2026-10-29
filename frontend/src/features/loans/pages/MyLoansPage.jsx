/**
 * @file MyLoansPage.jsx
 * @description Self-service portal for personal employee loans and salary advances.
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.1 & 10.4)
 * - Layer: Frontend Feature Page
 * - Theme: Forest & Emerald Design System
 */

import React, { useState } from 'react';
import {
  DollarSign,
  Plus,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  ChevronRight,
  TrendingDown,
  ShieldAlert
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { useGetLoansQuery } from '../loansApi.js';
import { LoanApplyModal } from '../components/LoanApplyModal.jsx';
import { LoanScheduleDrawer } from '../components/LoanScheduleDrawer.jsx';

export function MyLoansPage() {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [selectedLoanId, setSelectedLoanId] = useState(null);

  const { data: loansRes, isLoading, refetch } = useGetLoansQuery({ page: 1, limit: 50 });
  const loans = loansRes?.data || [];

  // Metrics calculation
  const activeLoans = loans.filter((l) => ['active', 'approved'].includes(l.status));
  const pendingLoans = loans.filter((l) =>
    ['pending_recommendation', 'pending_hr', 'pending_admin'].includes(l.status)
  );

  const totalOutstandingPaisa = activeLoans.reduce((acc, curr) => acc + (curr.remainingBalance || 0), 0);
  const totalOutstandingPkr = totalOutstandingPaisa / 100;

  const totalBorrowedPaisa = loans
    .filter((l) => ['active', 'closed'].includes(l.status))
    .reduce((acc, curr) => acc + (curr.amount || 0), 0);
  const totalBorrowedPkr = totalBorrowedPaisa / 100;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="My Loans & Advances"
        description="Manage your emergency salary advances, company loans, and monthly deduction schedules."
        actions={
          <Can I="loan.create" a="Loan">
            <button
              onClick={() => setIsApplyOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-sm shadow-emerald-500/20 hover:shadow-md transition-all"
            >
              <Plus className="w-4 h-4" />
              Apply for Borrowing
            </button>
          </Can>
        }
      />

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Outstanding Balance */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Outstanding Balance
            </span>
            <div className="p-2 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 rounded-xl">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            PKR {totalOutstandingPkr.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {activeLoans.length} active deduction {activeLoans.length === 1 ? 'account' : 'accounts'}
          </div>
        </div>

        {/* Active Accounts */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Active Borrowings
            </span>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            {activeLoans.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            {pendingLoans.length > 0 ? `${pendingLoans.length} approval in review` : 'All requests processed'}
          </div>
        </div>

        {/* Total Lifetime Borrowed */}
        <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total Lifetime Disbursed
            </span>
            <div className="p-2 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-xl">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
            PKR {totalBorrowedPkr.toLocaleString()}
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Historical company advance & loan volume
          </div>
        </div>
      </div>

      {/* Loans Table / Cards */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-emerald-600" />
            My Borrowing History & Status
          </h2>
          <span className="text-xs text-slate-500">
            Showing {loans.length} {loans.length === 1 ? 'record' : 'records'}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500 animate-pulse">
            Loading your loans and installment records...
          </div>
        ) : loans.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="mx-auto w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
              <DollarSign className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium text-slate-900 dark:text-white">
              No loan or advance applications found
            </p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              You haven't requested any salary advances or loans yet. When you submit a request, you can monitor its approval and deduction schedule here.
            </p>
            <Can I="loan.create" a="Loan">
              <button
                onClick={() => setIsApplyOpen(true)}
                className="mt-2 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 rounded-xl hover:bg-emerald-100 transition-colors"
              >
                <Plus className="w-4 h-4" /> Apply Now
              </button>
            </Can>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {loans.map((loan) => {
              const amountPkr = loan.amount / 100;
              const remainingPkr = loan.remainingBalance / 100;
              const repaidPkr = (loan.totalRepaid || 0) / 100;
              const installmentPkr = (loan.monthlyInstallment || 0) / 100;
              const progressPct = loan.amount > 0 ? Math.min(100, Math.round((loan.totalRepaid / loan.amount) * 100)) : 0;

              return (
                <div
                  key={loan._id}
                  className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-[220px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {loan.loanId}
                      </span>
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {loan.type}
                      </span>
                      <StatusBadge status={loan.status} />
                    </div>
                    <div className="text-xs text-slate-500 dark:text-slate-400 line-clamp-1">
                      {loan.reason}
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-slate-400">
                      <span>Tenure: {loan.repaymentTenureMonths} mo</span>
                      <span>•</span>
                      <span>Starts: {loan.effectiveStartMonth}</span>
                    </div>
                  </div>

                  {/* Financial Breakdown */}
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div>
                      <span className="block text-slate-400 text-[10px]">Principal</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        PKR {amountPkr.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">Monthly Deduct</span>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        PKR {installmentPkr.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">Remaining</span>
                      <span className="font-bold text-rose-600 dark:text-rose-400">
                        PKR {remainingPkr.toLocaleString()}
                      </span>
                    </div>
                  </div>

                  {/* Progress & Action */}
                  <div className="flex items-center gap-4 min-w-[200px] justify-between md:justify-end">
                    <div className="w-28 space-y-1">
                      <div className="flex justify-between text-[10px] text-slate-400">
                        <span>Repaid</span>
                        <span className="font-semibold text-slate-700 dark:text-slate-300">{progressPct}%</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => setSelectedLoanId(loan._id)}
                      className="p-2 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-xl transition-colors flex items-center gap-1 text-xs font-medium"
                      title="View Installment Schedule"
                    >
                      <span>Schedule</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Loan Apply Modal */}
      <LoanApplyModal
        isOpen={isApplyOpen}
        onClose={() => {
          setIsApplyOpen(false);
          refetch();
        }}
      />

      {/* Installment Repayment Schedule Drawer */}
      <LoanScheduleDrawer
        loanId={selectedLoanId}
        onClose={() => setSelectedLoanId(null)}
      />
    </div>
  );
}

export default MyLoansPage;
