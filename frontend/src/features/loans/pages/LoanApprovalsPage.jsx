/**
 * @file LoanApprovalsPage.jsx
 * @description Multi-Tier Borrowing Approval Queue for Department Managers, HR, and Super Admin.
 *
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.3)
 * - Layer: Frontend Feature Page
 * - Theme: Forest & Emerald Design System (DESIGN.md / docs/UI-REFERENCE.md)
 */

import React, { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Filter, ShieldCheck, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { useGetLoansQuery } from '../loansApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { formatDate } from '../../../lib/formatters.js';
import { LoanDecisionModal } from '../components/LoanDecisionModal.jsx';
import { LoanScheduleDrawer } from '../components/LoanScheduleDrawer.jsx';

const PENDING_STATUSES = ['pending_recommendation', 'pending_hr', 'pending_admin'];

const TABS = [
  { key: 'pending_me', label: 'Pending my action', icon: Clock },
  { key: 'all_pending', label: 'All in-flight', icon: Filter },
  { key: 'approved', label: 'Active / Disbursed', icon: CheckCircle2 },
  { key: 'rejected', label: 'Declined', icon: XCircle }
];

// Shared column template so the header and every row line up exactly.
const COLS = 'lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1.25fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1.1fr)_7.5rem]';

const pkr = (paisa) => `PKR ${((Number(paisa) || 0) / 100).toLocaleString('en-PK')}`;

// Helper to detect if loan applicant holds HR Manager role
const isLoanFromHR = (loan) => {
  const roles = loan?.employeeId?.userId?.roles || [];
  return roles.some((r) => (r?.name || r) === 'HR Manager');
};

const borrowerName = (emp) =>
  emp?.name || emp?.user?.name || emp?.userId?.name || `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim() || 'Employee';

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

function CellLabel({ children }) {
  return <span className="mb-0.5 block text-[11px] text-slate-500 lg:hidden dark:text-slate-400">{children}</span>;
}

export function LoanApprovalsPage() {
  const { isSuperAdmin, isHR } = useAuth();
  const [activeTab, setActiveTab] = useState('pending_me');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [detailLoanId, setDetailLoanId] = useState(null);

  const { data: loansRes, isLoading, isFetching, refetch } = useGetLoansQuery({ page: 1, limit: 100 });
  const loans = loansRes?.data || [];

  if (isLoading && !loansRes) {
    return (
      <div className="space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const matchesTab = (loan, tab) => {
    if (tab === 'pending_me') {
      const fromHR = isLoanFromHR(loan);
      if (isSuperAdmin) return loan.status === 'pending_admin' || (fromHR && PENDING_STATUSES.includes(loan.status));
      if (isHR) return loan.status === 'pending_hr' && !fromHR;
      // Department Manager default
      return loan.status === 'pending_recommendation' && !fromHR;
    }
    if (tab === 'all_pending') return PENDING_STATUSES.includes(loan.status);
    if (tab === 'approved') return ['approved', 'active'].includes(loan.status);
    if (tab === 'rejected') return loan.status === 'rejected';
    return true;
  };

  const counts = Object.fromEntries(TABS.map((t) => [t.key, loans.filter((l) => matchesTab(l, t.key)).length]));
  const filteredLoans = loans.filter((loan) => matchesTab(loan, activeTab));
  const isActiveTab = activeTab === 'approved';

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrowing Approval Queue"
        description="Multi-tier review, recommendations, and executive disbursement authorizations."
        actions={<RefreshButton onRefresh={refetch} isFetching={isFetching} />}
      />

      {/* Tabs */}
      <div role="tablist" aria-label="Loan queue" className="flex gap-6 overflow-x-auto border-b border-[#EAECF0] dark:border-[#1A3125]">
        {TABS.map(({ key, label, icon: Icon }) => {
          const selected = activeTab === key;
          return (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={selected}
              onClick={() => setActiveTab(key)}
              className={`-mb-px flex shrink-0 items-center gap-2 border-b-2 pb-3 text-[13px] font-medium transition-colors ${
                selected
                  ? 'border-[#00C471] text-slate-900 dark:text-white'
                  : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              <Icon className={`h-4 w-4 ${selected ? 'text-[#00C471]' : ''}`} aria-hidden="true" />
              {label}
              <span
                className={`min-w-[1.25rem] rounded-full px-1.5 py-px text-center font-mono text-[11px] font-semibold tabular-nums ${
                  selected
                    ? 'bg-emerald-50 text-emerald-700 dark:bg-[#00C471]/15 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-500 dark:bg-[#13221B] dark:text-slate-400'
                }`}
              >
                {counts[key]}
              </span>
            </button>
          );
        })}
      </div>

      {/* Queue */}
      <div className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white dark:border-[#1A3125] dark:bg-[#111D17]">
        {filteredLoans.length === 0 ? (
          <div className="space-y-2 px-6 py-14 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" aria-hidden="true" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Nothing here</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">No borrowing requests match this view.</p>
          </div>
        ) : (
          <>
            {/* Column header */}
            <div
              className={`hidden gap-4 border-b border-[#EAECF0] bg-slate-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:grid dark:border-[#1A3125] dark:bg-[#0E1A14] dark:text-slate-400 ${COLS}`}
            >
              <span>Borrower</span>
              <span>Request</span>
              <span className="text-end">Principal</span>
              <span className="text-end">Installment</span>
              <span>{isActiveTab ? 'Repayment' : 'Applied'}</span>
              <span className="sr-only">Actions</span>
            </div>

            <ul className="divide-y divide-[#EAECF0] dark:divide-[#1A3125]">
              {filteredLoans.map((loan) => {
                const emp = loan.employeeId;
                const name = borrowerName(emp);
                const isPending = PENDING_STATUSES.includes(loan.status);
                const repaidPct = loan.amount > 0 ? Math.min(100, Math.round(((loan.totalRepaid || 0) / loan.amount) * 100)) : 0;
                const openDetails = () => setDetailLoanId(loan._id);

                return (
                  <li
                    key={loan._id}
                    tabIndex={0}
                    onClick={openDetails}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        openDetails();
                      }
                    }}
                    aria-label={`View loan ${loan.loanId} for ${name}`}
                    className={`grid cursor-pointer grid-cols-1 items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/70 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-[#13221B]/60 dark:focus-visible:bg-[#13221B] ${COLS}`}
                  >
                    {/* Borrower */}
                    <div className="flex min-w-0 items-center gap-3">
                      {emp?.avatar ? (
                        <img src={emp.avatar} alt="" className="h-9 w-9 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-[#00C471]/15 dark:text-emerald-400">
                          {initials(name)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">{name}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">
                          {[emp?.employeeCode, emp?.departmentId?.name].filter(Boolean).join(' · ') || '—'}
                        </p>
                      </div>
                    </div>

                    {/* Request */}
                    <div className="min-w-0">
                      <CellLabel>Request</CellLabel>
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-slate-800 dark:text-slate-200">{loan.loanId}</span>
                        <span className="rounded-md bg-slate-100 px-1.5 py-px text-[10px] font-semibold uppercase tracking-wide text-slate-600 dark:bg-[#13221B] dark:text-slate-300">
                          {loan.type}
                        </span>
                      </div>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                        <StatusBadge status={loan.status} />
                        {isLoanFromHR(loan) && (
                          <span className="rounded-full border border-amber-200 bg-amber-50 px-2 py-px text-[10px] font-semibold text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400">
                            HR staff
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Principal */}
                    <div className="lg:text-end">
                      <CellLabel>Principal</CellLabel>
                      <p className="font-mono text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">{pkr(loan.amount)}</p>
                    </div>

                    {/* Installment */}
                    <div className="lg:text-end">
                      <CellLabel>Installment</CellLabel>
                      <p className="font-mono text-[13px] tabular-nums text-slate-800 dark:text-slate-200">{pkr(loan.monthlyInstallment)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        × {loan.repaymentTenureMonths} month{loan.repaymentTenureMonths === 1 ? '' : 's'}
                      </p>
                    </div>

                    {/* Repayment progress (active) or applied date */}
                    <div className="min-w-0">
                      <CellLabel>{isActiveTab ? 'Repayment' : 'Applied'}</CellLabel>
                      {isActiveTab ? (
                        <>
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-slate-500 dark:text-slate-400">{pkr(loan.remainingBalance)} left</span>
                            <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{repaidPct}%</span>
                          </div>
                          <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1A3125]" aria-hidden="true">
                            <div className="h-full rounded-full bg-[#00C471]" style={{ width: `${repaidPct}%` }} />
                          </div>
                          <p className="mt-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                            Disbursed {formatDate(loan.adminApproval?.approvedAt)}
                          </p>
                        </>
                      ) : (
                        <>
                          <p className="font-mono text-[13px] tabular-nums text-slate-800 dark:text-slate-200">{formatDate(loan.createdAt)}</p>
                          {loan.reason && (
                            <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={loan.reason}>
                              {loan.reason}
                            </p>
                          )}
                        </>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-start gap-2 lg:justify-end">
                      {isPending ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLoan(loan);
                          }}
                          className="flex items-center gap-1 rounded-xl bg-[#00C471] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#049856]"
                        >
                          Review
                          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                        </button>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                          View details
                          <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                        </span>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </div>

      {/* Review & Decision Modal */}
      <LoanDecisionModal
        isOpen={Boolean(selectedLoan)}
        loan={selectedLoan}
        onClose={() => {
          setSelectedLoan(null);
          refetch();
        }}
      />

      {/* Loan detail drawer */}
      <LoanScheduleDrawer loanId={detailLoanId} onClose={() => setDetailLoanId(null)} />
    </div>
  );
}

export default LoanApprovalsPage;
