/**
 * @file MyExpensesPage.jsx
 * @description Self-service expense claims: totals, status filter, claim history, and a full
 * detail drawer per claim.
 *
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.2)
 * - Permission: Can I="expense.create" a="Expense"
 * - Design: DESIGN.md & docs/UI-REFERENCE.md (Forest & Emerald Craft)
 */

import React, { useState } from 'react';
import { Plus, Receipt, ChevronRight, Paperclip, FileText } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { useGetMyExpensesQuery } from '../expensesApi.js';
import ExpenseFormModal from '../components/ExpenseFormModal.jsx';
import ExpenseDetailDrawer from '../components/ExpenseDetailDrawer.jsx';
import { ExpenseStatusBadge, pkr, formatDay } from '../components/expenseUi.jsx';

const FILTERS = [
  { key: 'all', label: 'All Claims', match: () => true },
  { key: 'review', label: 'In Review', match: (e) => ['pending_manager', 'pending_admin'].includes(e.status) },
  { key: 'approved', label: 'Approved', match: (e) => e.status === 'approved' },
  { key: 'reimbursed', label: 'Reimbursed', match: (e) => e.status === 'reimbursed' },
  { key: 'rejected', label: 'Rejected', match: (e) => e.status === 'rejected' },
];

const sum = (list, pick) => list.reduce((total, e) => total + (pick(e) || 0), 0);

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
    { label: 'Total Claimed', value: pkr(sum(expenses, (e) => e.amount)), note: `${expenses.length} claim(s) filed` },
    { label: 'In Review', value: pkr(sum(inReview, (e) => e.amount)), note: `${inReview.length} awaiting decision` },
    { label: 'Approved, Unpaid', value: pkr(sum(approved, (e) => e.approvedAmount || e.amount)), note: `${approved.length} awaiting payout` },
    { label: 'Reimbursed', value: pkr(sum(reimbursed, (e) => e.approvedAmount || e.amount)), note: `${reimbursed.length} disbursed` },
  ];

  const active = FILTERS.find((f) => f.key === filter) || FILTERS[0];
  const rows = expenses.filter(active.match);

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Expense Claims"
        description="Submit out-of-pocket business expenses and track each claim through approval and reimbursement."
        actions={
          <div className="flex items-center gap-2.5">
            <RefreshButton onRefresh={refetch} isFetching={isFetching} />
            <Can I="expense.create" a="Expense">
              <button
                type="button"
                onClick={() => setIsApplyOpen(true)}
                className="h-9 px-4 inline-flex items-center gap-2 rounded-xl bg-[#00C471] hover:bg-[#049856] text-white text-xs font-semibold shadow-xs shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer"
              >
                <Plus className="h-4 w-4" aria-hidden="true" />
                <span>New Claim</span>
              </button>
            </Can>
          </div>
        }
      />

      {/* Top 4 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-200/80 dark:divide-[#1A3125] overflow-hidden rounded-2xl border border-slate-200/80 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
        {stats.map((s) => (
          <div key={s.label} className="px-5 py-4">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
            <p className="mt-1 font-mono text-xl lg:text-2xl font-bold tabular-nums text-slate-900 dark:text-white">{s.value}</p>
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5">{s.note}</p>
          </div>
        ))}
      </div>

      {/* Claims Data Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200/80 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xs">
        {/* Toolbar & Filter Tabs */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200/80 dark:border-[#1A3125] px-5 py-3.5 bg-slate-50/50 dark:bg-[#0E1A14]/50">
          <div role="tablist" aria-label="Filter claims" className="flex items-center gap-1.5 flex-wrap">
            {FILTERS.map((f) => {
              const selected = f.key === filter;
              const count = expenses.filter(f.match).length;
              return (
                <button
                  key={f.key}
                  type="button"
                  role="tab"
                  aria-selected={selected}
                  onClick={() => setFilter(f.key)}
                  className={`h-8 px-3 rounded-lg inline-flex items-center gap-1.5 text-xs font-semibold transition-all cursor-pointer ${
                    selected
                      ? 'bg-[#00C471] text-white shadow-2xs'
                      : 'bg-white dark:bg-[#15231C] text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white border border-slate-200/80 dark:border-[#1A3125]'
                  }`}
                >
                  <span>{f.label}</span>
                  <span
                    className={`font-mono text-[10px] tabular-nums px-1.5 py-px rounded-full font-bold ${
                      selected ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-[#1E3328] text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="text-xs text-slate-500 dark:text-slate-400">
            Showing <span className="font-mono font-semibold tabular-nums text-slate-700 dark:text-slate-200">{rows.length}</span> of {expenses.length} claims
          </p>
        </div>

        {error ? (
          <div className="px-6 py-14 text-center">
            <p className="text-sm font-semibold text-slate-900 dark:text-white">Claims could not be loaded</p>
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
              <Receipt className="h-6 w-6" aria-hidden="true" />
            </span>
            <p className="text-sm font-bold text-slate-900 dark:text-white mt-2">
              {expenses.length === 0 ? 'No expense claims submitted yet' : 'No claims in this view'}
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
              {expenses.length === 0
                ? 'Click "New Claim" above to record business expenses and upload receipts.'
                : 'Select another filter pill to inspect claims with different statuses.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50/75 dark:bg-[#0E1A14] text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-200/80 dark:border-[#1A3125] font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Claim ID</th>
                  <th className="px-5 py-3.5">Category & Description</th>
                  <th className="px-5 py-3.5">Expense Date</th>
                  <th className="px-5 py-3.5 text-right">Claimed</th>
                  <th className="px-5 py-3.5 text-right">Authorised</th>
                  <th className="px-5 py-3.5 text-center">Status</th>
                  <th className="px-5 py-3.5 text-right"><span className="sr-only">Details</span></th>
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
                      <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-[#15231C] text-slate-900 dark:text-white border border-slate-200/80 dark:border-[#1A3125]">
                        {claim.claimNumber}
                      </span>
                    </td>

                    <td className="px-5 py-4">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-800 dark:text-slate-200 group-hover:text-[#00C471] transition-colors">
                        <span>{claim.categoryId?.name || 'Uncategorised'}</span>
                        {claim.receiptUrl && (
                          <span title="Receipt attached">
                            <Paperclip className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                          </span>
                        )}
                      </div>
                      {claim.description && (
                        <p className="text-xs text-slate-400 dark:text-slate-500 truncate max-w-sm mt-0.5" title={claim.description}>
                          {claim.description}
                        </p>
                      )}
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
                      <ExpenseStatusBadge status={claim.status} reimbursement={claim.reimbursement} />
                    </td>

                    <td className="px-5 py-4 text-right">
                      <ChevronRight className="h-4 w-4 text-slate-300 dark:text-slate-600 group-hover:text-[#00C471] transition-colors ml-auto" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ExpenseFormModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
      <ExpenseDetailDrawer expenseId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
