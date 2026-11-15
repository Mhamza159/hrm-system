/**
 * @file MyExpensesPage.jsx
 * @description Self-service expense claims: totals, status filter, claim history and a full
 * detail drawer per claim.
 *
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.2)
 * - Permission: Can I="expense.create" a="Expense"
 * - Design: DESIGN.md & docs/UI-REFERENCE.md
 */

import React, { useState } from 'react';
import { Plus, Receipt, ChevronRight, Paperclip } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { useGetMyExpensesQuery } from '../expensesApi.js';
import ExpenseFormModal from '../components/ExpenseFormModal.jsx';
import ExpenseDetailDrawer from '../components/ExpenseDetailDrawer.jsx';
import { ExpenseStatusBadge, pkr, formatDay } from '../components/expenseUi.jsx';

const FILTERS = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'review', label: 'In review', match: (e) => ['pending_manager', 'pending_admin'].includes(e.status) },
  { key: 'approved', label: 'Approved', match: (e) => e.status === 'approved' },
  { key: 'reimbursed', label: 'Reimbursed', match: (e) => e.status === 'reimbursed' },
  { key: 'rejected', label: 'Rejected', match: (e) => e.status === 'rejected' },
];

// Shared column template so the header and every row line up exactly.
const COLS = 'md:grid-cols-[minmax(0,1.1fr)_minmax(0,1.3fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,0.9fr)_minmax(0,1fr)_1.25rem]';

const sum = (list, pick) => list.reduce((total, e) => total + (pick(e) || 0), 0);

function CellLabel({ children }) {
  return <span className="mb-0.5 block text-[11px] text-slate-500 md:hidden dark:text-slate-400">{children}</span>;
}

export default function MyExpensesPage() {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [filter, setFilter] = useState('all');
  const [openId, setOpenId] = useState(null);

  const { data, isLoading, isFetching, error, refetch } = useGetMyExpensesQuery({ limit: 100 });
  const expenses = data?.data || [];

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const inReview = expenses.filter(FILTERS[1].match);
  const approved = expenses.filter(FILTERS[2].match);
  const reimbursed = expenses.filter(FILTERS[3].match);
  const stats = [
    { label: 'Total claimed', value: pkr(sum(expenses, (e) => e.amount)), note: `${expenses.length} claim${expenses.length === 1 ? '' : 's'}` },
    { label: 'In review', value: pkr(sum(inReview, (e) => e.amount)), note: `${inReview.length} awaiting a decision` },
    { label: 'Approved, unpaid', value: pkr(sum(approved, (e) => e.approvedAmount || e.amount)), note: `${approved.length} awaiting payout` },
    { label: 'Reimbursed', value: pkr(sum(reimbursed, (e) => e.approvedAmount || e.amount)), note: `${reimbursed.length} paid` },
  ];

  const active = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const rows = expenses.filter(active.match);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Expense Claims"
        description="Submit out-of-pocket business expenses and follow each claim through approval and payout."
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton onRefresh={refetch} isFetching={isFetching} />
            <Can I="expense.create" a="Expense">
              <button
                type="button"
                onClick={() => setIsApplyOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[#00C471] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#049856]"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                New claim
              </button>
            </Can>
          </div>
        }
      />

      {/* Totals */}
      <div className="grid grid-cols-2 overflow-hidden rounded-2xl border border-[#EAECF0] bg-white lg:grid-cols-4 dark:border-[#1A3125] dark:bg-[#111D17]">
        {stats.map((s, i) => (
          <div
            key={s.label}
            className={`px-5 py-4 ${i % 2 === 1 ? 'border-s border-[#EAECF0] dark:border-[#1A3125]' : ''} ${i >= 2 ? 'border-t border-[#EAECF0] lg:border-t-0 dark:border-[#1A3125]' : ''} ${i === 2 ? 'lg:border-s' : ''}`}
          >
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="mt-1.5 font-mono text-xl font-semibold tabular-nums text-slate-900 lg:text-[22px] dark:text-white">{s.value}</p>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Claims */}
      <div className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white dark:border-[#1A3125] dark:bg-[#111D17]">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAECF0] px-5 py-3.5 dark:border-[#1A3125]">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Claim history</h3>
          <div role="tablist" aria-label="Filter claims" className="flex flex-wrap gap-1 rounded-xl bg-slate-100 p-0.5 dark:bg-[#13221B]">
            {FILTERS.map((f) => {
              const selected = f.key === filter;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setFilter(f.key)}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-medium transition-colors ${
                    selected
                      ? 'bg-white text-slate-900 shadow-sm dark:bg-[#1A3125] dark:text-white'
                      : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
                  }`}
                >
                  {f.label}
                  <span className="font-mono text-[11px] tabular-nums text-slate-400">{expenses.filter(f.match).length}</span>
                </button>
              );
            })}
          </div>
        </div>

        {error ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Claims could not be loaded</p>
            <button type="button" onClick={refetch} className="mt-3 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400">
              Try again
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="space-y-2 px-6 py-14 text-center">
            <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-[#13221B]">
              <Receipt className="h-5 w-5 text-slate-400" aria-hidden="true" />
            </span>
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              {expenses.length === 0 ? 'No claims yet' : 'No claims in this view'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {expenses.length === 0 ? 'Use “New claim” to request a reimbursement.' : 'Try another filter.'}
            </p>
          </div>
        ) : (
          <>
            <div
              className={`hidden gap-4 border-b border-[#EAECF0] bg-slate-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 md:grid dark:border-[#1A3125] dark:bg-[#0E1A14] dark:text-slate-400 ${COLS}`}
            >
              <span>Claim</span>
              <span>Category</span>
              <span>Expense date</span>
              <span className="text-end">Claimed</span>
              <span className="text-end">Authorised</span>
              <span>Status</span>
              <span className="sr-only">Open</span>
            </div>
            <ul className="divide-y divide-[#EAECF0] dark:divide-[#1A3125]">
              {rows.map((claim) => (
                <li
                  key={claim._id}
                  tabIndex={0}
                  onClick={() => setOpenId(claim._id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setOpenId(claim._id);
                    }
                  }}
                  aria-label={`Open claim ${claim.claimNumber}`}
                  className={`grid cursor-pointer grid-cols-2 items-center gap-x-4 gap-y-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-[#13221B]/60 dark:focus-visible:bg-[#13221B] ${COLS}`}
                >
                  <div className="min-w-0">
                    <CellLabel>Claim</CellLabel>
                    <p className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{claim.claimNumber}</p>
                  </div>
                  <div className="min-w-0">
                    <CellLabel>Category</CellLabel>
                    <p className="flex items-center gap-1.5 truncate text-[13px] text-slate-800 dark:text-slate-200">
                      <span className="truncate">{claim.categoryId?.name || 'Uncategorised'}</span>
                      {claim.receiptUrl && <Paperclip className="h-3.5 w-3.5 shrink-0 text-slate-400" aria-label="Receipt attached" />}
                    </p>
                    {claim.description && (
                      <p className="truncate text-xs text-slate-500 dark:text-slate-400" title={claim.description}>
                        {claim.description}
                      </p>
                    )}
                  </div>
                  <div>
                    <CellLabel>Expense date</CellLabel>
                    <p className="font-mono text-[13px] tabular-nums text-slate-700 dark:text-slate-300">{formatDay(claim.expenseDate)}</p>
                  </div>
                  <div className="md:text-end">
                    <CellLabel>Claimed</CellLabel>
                    <p className="font-mono text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">{pkr(claim.amount)}</p>
                  </div>
                  <div className="md:text-end">
                    <CellLabel>Authorised</CellLabel>
                    <p className={`font-mono text-[13px] tabular-nums ${claim.approvedAmount ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`}>
                      {claim.approvedAmount ? pkr(claim.approvedAmount) : '—'}
                    </p>
                  </div>
                  <div>
                    <CellLabel>Status</CellLabel>
                    <ExpenseStatusBadge status={claim.status} reimbursement={claim.reimbursement} />
                  </div>
                  <ChevronRight className="hidden h-4 w-4 text-slate-300 md:block rtl:rotate-180 dark:text-slate-600" aria-hidden="true" />
                </li>
              ))}
            </ul>
          </>
        )}
      </div>

      <ExpenseFormModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
      <ExpenseDetailDrawer expenseId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
