/**
 * @file ExpenseApprovalsPage.jsx
 * @description Claim review, escalation, and reimbursement queue.
 *
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Rows 11.3 & 11.4)
 * - Department Manager: one queue — own-department claims awaiting their decision
 *   (the API enforces this scope; the UI mirrors it).
 * - Super Admin / HR: manager queue, executive escalations, approved-to-pay, reimbursed.
 * - Design: DESIGN.md & docs/UI-REFERENCE.md (Forest & Emerald Craft)
 */

import React, { useState } from 'react';
import { Search, ShieldCheck, ChevronRight, CreditCard, Inbox, Paperclip } from 'lucide-react';
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
  { key: 'pending_manager', label: 'Awaiting Manager' },
  { key: 'pending_admin', label: 'Escalated to Exec' },
  { key: 'approved', label: 'Approved, To Pay' },
  { key: 'reimbursed', label: 'Reimbursed / Paid' },
];

const isPendingStatus = (status) => status === 'pending_manager' || status === 'pending_admin';

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
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold shadow-xs shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
          >
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Review</span>
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
            className="h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border border-slate-200/80 dark:border-[#1A3125] bg-white dark:bg-[#15231C] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-[#1E3328] shadow-2xs transition-colors cursor-pointer"
          >
            <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
            <span>{claim.reimbursement?.method === 'payroll' ? 'Pay directly' : 'Reimburse'}</span>
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
            ? 'Review expense claims across the enterprise, decide escalations, and disburse reimbursements.'
            : 'Departmental claims pending your review and managerial authorization.'
        }
        actions={<RefreshButton onRefresh={refetch} isFetching={isFetching} />}
      />

      {/* Main Table Card */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
        {/* Navigation Tabs + Search Toolbar */}
        <div className="flex flex-col gap-3 border-b border-slate-200/80 dark:border-[#1A3125] px-5 pt-3.5 pb-3 sm:flex-row sm:items-center sm:justify-between bg-slate-50/50 dark:bg-[#0E1A14]/50">
          {isExecutive ? (
            <div role="tablist" aria-label="Approval queues" className="flex items-center gap-1.5 flex-wrap">
              {EXECUTIVE_TABS.map((t) => {
                const selected = t.key === activeTab;
                return (
                  <button
                    key={t.key}
                    type="button"
                    role="tab"
                    aria-selected={selected}
                    onClick={() => setActiveTab(t.key)}
                    className={`h-8 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                      selected
                        ? 'bg-[#00C471] text-white shadow-2xs'
                        : 'bg-white dark:bg-[#15231C] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-[#1A3125]'
                    }`}
                  >
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <span className="h-8 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold bg-[#00C471] text-white shadow-2xs">
                <span>Department Queue</span>
              </span>
            </div>
          )}

          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search claim, employee, code..."
                aria-label="Search claims"
                className="w-full h-9 pl-9 pr-4 text-xs font-medium rounded-xl border border-slate-200/80 dark:border-[#1A3125] bg-white dark:bg-[#15231C] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all shadow-2xs"
              />
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 shrink-0">
              <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">{rows.length}</span> claim{rows.length === 1 ? '' : 's'}
            </p>
          </div>
        </div>

        {error ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">The queue could not be loaded</p>
            <button
              type="button"
              onClick={refetch}
              className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
            >
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="space-y-2 px-6 py-16 text-center">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 dark:bg-[#15231C] text-slate-400">
              <Inbox className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">
              {term ? 'No matching claims' : 'Nothing waiting here'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {term ? 'Try a different search keyword.' : 'New claims will appear in this review queue as employees submit them.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/75 dark:bg-[#0E1A14] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-[#1A3125] font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Applicant</th>
                  <th className="px-5 py-3.5">Claim ID & Category</th>
                  <th className="px-5 py-3.5">Expense Date</th>
                  <th className="px-5 py-3.5 text-right">Claimed</th>
                  <th className="px-5 py-3.5 text-right">Authorised</th>
                  <th className="px-5 py-3.5 text-center">{isPendingStatus(status) ? 'Waiting' : 'Status'}</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200/80 dark:divide-[#1A3125]">
                {rows.map((claim) => (
                  <tr
                    key={claim._id}
                    onClick={() => setOpenId(claim._id)}
                    className="hover:bg-slate-50/70 dark:hover:bg-[#15231C]/60 transition-colors cursor-pointer group"
                  >
                    <td className="px-5 py-4">
                      <PersonRow person={claim.applicant} />
                    </td>

                    <td className="px-5 py-4">
                      <div className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#15231C] text-slate-900 dark:text-white border border-slate-200/80 dark:border-[#1A3125] inline-block mb-1">
                        {claim.claimNumber}
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300">
                        <span className="truncate">{claim.categoryId?.name || 'Uncategorised'}</span>
                        {claim.receiptUrl && <Paperclip className="h-3 w-3 text-slate-400 shrink-0" />}
                      </div>
                    </td>

                    <td className="px-5 py-4 font-mono text-xs text-slate-700 dark:text-slate-300 tabular-nums">
                      {formatDay(claim.expenseDate)}
                    </td>

                    <td className="px-5 py-4 text-right font-mono text-xs font-bold tabular-nums text-slate-900 dark:text-white">
                      {pkr(claim.amount)}
                    </td>

                    <td className="px-5 py-4 text-right font-mono text-xs tabular-nums">
                      {claim.approvedAmount ? (
                        <span className="font-bold text-teal-700 dark:text-teal-400">{pkr(claim.approvedAmount)}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-center">
                      {isPendingStatus(claim.status) ? (
                        <span className="font-mono text-xs font-semibold tabular-nums text-violet-700 dark:text-violet-400 px-2 py-0.5 rounded-full bg-violet-50 dark:bg-violet-950/40 border border-violet-200/80 dark:border-violet-800/60" title={`Submitted ${formatDay(claim.createdAt)}`}>
                          {waitingFor(claim.createdAt)}
                        </span>
                      ) : (
                        <ExpenseStatusBadge status={claim.status} reimbursement={claim.reimbursement} />
                      )}
                    </td>

                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2" onClick={(e) => e.stopPropagation()}>
                        {primaryAction(claim, { stop: true }) || (
                          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            <span>Details</span>
                            <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseDetailDrawer
        expenseId={openId}
        onClose={() => setOpenId(null)}
        actions={(expense) => primaryAction(expense)}
      />

      <ExpenseDecisionModal
        isOpen={Boolean(decisionClaim)}
        onClose={() => setDecisionClaim(null)}
        expense={decisionClaim}
      />

      <ExpenseReimburseModal
        isOpen={Boolean(reimburseClaim)}
        onClose={() => setReimburseClaim(null)}
        expense={reimburseClaim}
      />
    </div>
  );
}
