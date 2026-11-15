/**
 * @file ExpenseApprovalsPage.jsx
 * @description Claim review and reimbursement queue.
 *
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Rows 11.3 & 11.4)
 * - Department Manager: one queue — own-department claims awaiting their decision
 *   (the API enforces this scope; the UI only mirrors it).
 * - Super Admin / HR: manager queue, executive escalations, approved-to-pay, reimbursed.
 * - Design: DESIGN.md & docs/UI-REFERENCE.md
 */

import React, { useState } from 'react';
import { Search, ShieldCheck, ChevronRight, CreditCard, Inbox } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { PersonRow } from '../../../components/common/Person.jsx';
import { useAuth } from '../../../hooks/useAuth.js';
import { useGetPendingExpenseApprovalsQuery } from '../expensesApi.js';
import ExpenseDecisionModal from '../components/ExpenseDecisionModal.jsx';
import ExpenseReimburseModal from '../components/ExpenseReimburseModal.jsx';
import ExpenseDetailDrawer from '../components/ExpenseDetailDrawer.jsx';
import { ExpenseStatusBadge, pkr, formatDay, waitingFor } from '../components/expenseUi.jsx';

const EXECUTIVE_TABS = [
  { key: 'pending_manager', label: 'Awaiting manager' },
  { key: 'pending_admin', label: 'Escalated' },
  { key: 'approved', label: 'Approved, to pay' },
  { key: 'reimbursed', label: 'Reimbursed' },
];

// Shared column template so the header and every row line up exactly.
const COLS = 'lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.9fr)_8.5rem]';

const isPendingStatus = (status) => status === 'pending_manager' || status === 'pending_admin';

function CellLabel({ children }) {
  return <span className="mb-0.5 block text-[11px] text-slate-500 lg:hidden dark:text-slate-400">{children}</span>;
}

export default function ExpenseApprovalsPage() {
  const { isSuperAdmin, isHR } = useAuth();
  const isExecutive = isSuperAdmin || isHR;

  const [activeTab, setActiveTab] = useState('pending_manager');
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState(null);
  const [decisionClaim, setDecisionClaim] = useState(null);
  const [reimburseClaim, setReimburseClaim] = useState(null);

  // Department Managers always get their own-department pending queue; the API ignores other statuses for them.
  const status = isExecutive ? activeTab : 'pending_manager';
  const { data, isLoading, isFetching, error, refetch } = useGetPendingExpenseApprovalsQuery({ status, limit: 100 });
  const claims = data?.data || [];

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const term = search.trim().toLowerCase();
  const rows = !term
    ? claims
    : claims.filter((c) =>
        [c.claimNumber, c.applicant?.employeeName, c.applicant?.employeeCode, c.applicant?.designation, c.applicant?.department, c.categoryId?.name]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(term))
      );

  const openReview = (claim) => {
    setOpenId(null);
    setDecisionClaim(claim);
  };
  const openReimburse = (claim) => {
    setOpenId(null);
    setReimburseClaim(claim);
  };

  const primaryAction = (claim, { stop = false } = {}) => {
    const guard = (fn) => (e) => {
      if (stop) e.stopPropagation();
      fn(claim);
    };
    if (isPendingStatus(claim.status)) {
      return (
        <Can I="expense.approve" a="Expense">
          <button
            type="button"
            onClick={guard(openReview)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00C471] px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#049856]"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            Review
          </button>
        </Can>
      );
    }
    if (claim.status === 'approved') {
      return (
        <Can I="expense.reimburse" a="Expense">
          <button
            type="button"
            onClick={guard(openReimburse)}
            className="inline-flex items-center gap-1.5 rounded-xl border border-[#EAECF0] bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 dark:border-[#1A3125] dark:bg-transparent dark:text-slate-200 dark:hover:bg-[#13221B]"
          >
            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
            {claim.reimbursement?.method === 'payroll' ? 'Pay directly' : 'Reimburse'}
          </button>
        </Can>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Approvals"
        description={
          isExecutive
            ? 'Review claims across the company, decide escalations and release reimbursements.'
            : 'Claims from your department that are waiting for your decision.'
        }
        actions={<RefreshButton onRefresh={refetch} isFetching={isFetching} />}
      />

      {isExecutive && (
        <div role="tablist" aria-label="Approval queues" className="flex gap-6 overflow-x-auto border-b border-[#EAECF0] dark:border-[#1A3125]">
          {EXECUTIVE_TABS.map((t) => {
            const selected = t.key === activeTab;
            return (
              <button
                key={t.key}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => setActiveTab(t.key)}
                className={`-mb-px shrink-0 border-b-2 pb-3 text-[13px] font-medium transition-colors ${
                  selected
                    ? 'border-[#00C471] text-slate-900 dark:text-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white dark:border-[#1A3125] dark:bg-[#111D17]">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-[#EAECF0] px-5 py-3.5 sm:flex-row sm:items-center sm:justify-between dark:border-[#1A3125]">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claim, employee, ID, department, category"
              aria-label="Search claims"
              className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2 pe-3 ps-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-[#1A3125] dark:bg-[#0A110D] dark:text-slate-100"
            />
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">{rows.length}</span>{' '}
            claim{rows.length === 1 ? '' : 's'}
            {!isExecutive && ' · your department only'}
          </p>
        </div>

        {error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">The queue could not be loaded</p>
            <button type="button" onClick={refetch} className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="space-y-2 px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-[#13221B]">
              <Inbox className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">{term ? 'No matching claims' : 'Nothing waiting here'}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {term ? 'Try a different search.' : 'New claims will appear in this queue as they are submitted.'}
            </p>
          </div>
        ) : (
          <>
            <div
              className={`hidden gap-4 border-b border-[#EAECF0] bg-slate-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:grid dark:border-[#1A3125] dark:bg-[#0E1A14] dark:text-slate-400 ${COLS}`}
            >
              <span>Applicant</span>
              <span>Claim</span>
              <span>Expense date</span>
              <span className="text-end">Claimed</span>
              <span className="text-end">Authorised</span>
              <span>{isPendingStatus(status) ? 'Waiting' : 'Status'}</span>
              <span className="sr-only">Actions</span>
            </div>
            <ul className="divide-y divide-[#EAECF0] dark:divide-[#1A3125]">
              {rows.map((claim) => (
                <li
                  key={claim._id}
                  tabIndex={0}
                  onClick={() => setOpenId(claim._id)}
                  onKeyDown={(e) => {
                    if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
                      e.preventDefault();
                      setOpenId(claim._id);
                    }
                  }}
                  aria-label={`Open claim ${claim.claimNumber} from ${claim.applicant?.employeeName || 'employee'}`}
                  className={`grid cursor-pointer grid-cols-2 items-center gap-x-4 gap-y-3 px-5 py-4 transition-colors hover:bg-slate-50/70 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-[#13221B]/60 dark:focus-visible:bg-[#13221B] ${COLS}`}
                >
                  <PersonRow person={claim.applicant} className="col-span-2 lg:col-span-1" />

                  <div className="min-w-0">
                    <CellLabel>Claim</CellLabel>
                    <p className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{claim.claimNumber}</p>
                    <p className="truncate text-xs text-slate-500 dark:text-slate-400">{claim.categoryId?.name || 'Uncategorised'}</p>
                  </div>

                  <div>
                    <CellLabel>Expense date</CellLabel>
                    <p className="font-mono text-[13px] tabular-nums text-slate-700 dark:text-slate-300">{formatDay(claim.expenseDate)}</p>
                  </div>

                  <div className="lg:text-end">
                    <CellLabel>Claimed</CellLabel>
                    <p className="font-mono text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">{pkr(claim.amount)}</p>
                  </div>

                  <div className="lg:text-end">
                    <CellLabel>Authorised</CellLabel>
                    <p className={`font-mono text-[13px] tabular-nums ${claim.approvedAmount ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`}>
                      {claim.approvedAmount ? pkr(claim.approvedAmount) : '—'}
                    </p>
                  </div>

                  <div>
                    <CellLabel>{isPendingStatus(status) ? 'Waiting' : 'Status'}</CellLabel>
                    {isPendingStatus(claim.status) ? (
                      <p className="font-mono text-[13px] tabular-nums text-slate-700 dark:text-slate-300" title={`Submitted ${formatDay(claim.createdAt)}`}>
                        {waitingFor(claim.createdAt)}
                      </p>
                    ) : (
                      <ExpenseStatusBadge status={claim.status} reimbursement={claim.reimbursement} />
                    )}
                  </div>

                  <div className="col-span-2 flex items-center justify-end gap-2 lg:col-span-1">
                    {primaryAction(claim, { stop: true }) || (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        Details
                        <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                      </span>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ExpenseDetailDrawer expenseId={openId} onClose={() => setOpenId(null)} actions={(expense) => primaryAction(expense)} />

      <ExpenseDecisionModal isOpen={Boolean(decisionClaim)} onClose={() => setDecisionClaim(null)} expense={decisionClaim} />
      <ExpenseReimburseModal isOpen={Boolean(reimburseClaim)} onClose={() => setReimburseClaim(null)} expense={reimburseClaim} />
    </div>
  );
}
