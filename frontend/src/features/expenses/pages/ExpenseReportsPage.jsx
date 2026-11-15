/**
 * @file ExpenseReportsPage.jsx
 * @description Monthly expense report: totals, category and department breakdowns, and every
 * claim of the month with a full detail drawer.
 *
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.5)
 * - Permission: report.view — the API scopes data (all / own department / own claims)
 * - Design: DESIGN.md & docs/UI-REFERENCE.md
 */

import React, { useMemo, useState } from 'react';
import { Download, Search, Receipt, ChevronRight } from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { PersonRow } from '../../../components/common/Person.jsx';
import { useGetExpenseMonthlyReportQuery } from '../expensesApi.js';
import ExpenseDetailDrawer from '../components/ExpenseDetailDrawer.jsx';
import { ExpenseStatusBadge, STATUS_META, pkr, formatDay } from '../components/expenseUi.jsx';

const CLAIM_COLS = 'lg:grid-cols-[minmax(0,1.7fr)_minmax(0,1.2fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1fr)_1.25rem]';

const monthLabel = (ym) => {
  const [y, m] = (ym || '').split('-').map(Number);
  return y && m ? new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'long', year: 'numeric' }) : '';
};

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

function Breakdown({ title, rows, columns }) {
  const max = Math.max(1, ...rows.map((r) => r.totalAmountPaisa || 0));
  return (
    <div className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white dark:border-[#1A3125] dark:bg-[#111D17]">
      <h3 className="border-b border-[#EAECF0] px-5 py-3.5 text-sm font-semibold text-slate-900 dark:border-[#1A3125] dark:text-white">{title}</h3>
      {rows.length === 0 ? (
        <p className="px-5 py-8 text-center text-xs text-slate-500 dark:text-slate-400">No claims this month.</p>
      ) : (
        <ul className="divide-y divide-[#EAECF0] dark:divide-[#1A3125]">
          {rows.map((r) => (
            <li key={r._id} className="px-5 py-3">
              <div className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <p className="truncate text-[13px] font-semibold text-slate-900 dark:text-white">{r._id}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{columns(r)}</p>
                </div>
                <p className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">{pkr(r.totalAmountPaisa)}</p>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-[#1A3125]" aria-hidden="true">
                <div className="h-full rounded-full bg-[#00C471]" style={{ width: `${Math.round(((r.totalAmountPaisa || 0) / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CellLabel({ children }) {
  return <span className="mb-0.5 block text-[11px] text-slate-500 lg:hidden dark:text-slate-400">{children}</span>;
}

export default function ExpenseReportsPage() {
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [openId, setOpenId] = useState(null);

  const { data, isLoading, isFetching, error, refetch } = useGetExpenseMonthlyReportQuery({ month });
  const report = data?.data || {};
  const totals = report.grandTotals || {};
  const claims = report.claims || [];

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase();
    return claims.filter((c) => {
      if (status !== 'all' && c.status !== status) return false;
      if (!term) return true;
      return [c.claimNumber, c.applicant?.employeeName, c.applicant?.employeeCode, c.applicant?.department, c.applicant?.designation, c.categoryId?.name]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(term));
    });
  }, [claims, search, status]);

  if (isLoading && !data) {
    return (
      <div className="space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const exportCsv = () => {
    const header = ['Claim', 'Employee', 'Employee ID', 'Designation', 'Department', 'Category', 'Expense date', 'Status', 'Claimed (PKR)', 'Authorised (PKR)'];
    const lines = rows.map((c) =>
      [
        c.claimNumber,
        c.applicant?.employeeName,
        c.applicant?.employeeCode,
        c.applicant?.designation,
        c.applicant?.department,
        c.categoryId?.name,
        formatDay(c.expenseDate),
        STATUS_META[c.status]?.label || c.status,
        ((c.amount || 0) / 100).toFixed(2),
        c.approvedAmount ? (c.approvedAmount / 100).toFixed(2) : ''
      ]
        .map(csvCell)
        .join(',')
    );
    const blob = new Blob([[header.map(csvCell).join(','), ...lines].join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `expense-report-${month}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = [
    { label: 'Claims', value: (totals.totalClaims || 0).toLocaleString('en-PK'), tone: 'text-slate-900 dark:text-white' },
    { label: 'Total claimed', value: pkr(totals.totalAmountPaisa), tone: 'text-slate-900 dark:text-white' },
    { label: 'Approved', value: pkr(totals.approvedAmountPaisa), tone: 'text-teal-700 dark:text-teal-400' },
    { label: 'Reimbursed', value: pkr(totals.reimbursedAmountPaisa), tone: 'text-cyan-700 dark:text-cyan-400' },
    { label: 'Pending', value: pkr(totals.pendingAmountPaisa), tone: 'text-violet-700 dark:text-violet-400' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expense Reports"
        description={`Spending for ${monthLabel(month)} by category, department and claim.`}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <RefreshButton onRefresh={refetch} isFetching={isFetching} />
            <input
              type="month"
              value={month}
              onChange={(e) => e.target.value && setMonth(e.target.value)}
              aria-label="Report month"
              className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-1.5 font-mono text-xs text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-[#1A3125] dark:bg-[#111D17] dark:text-slate-200"
            />
            <button
              type="button"
              onClick={exportCsv}
              disabled={rows.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00C471] px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#049856] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              Export CSV
            </button>
          </div>
        }
      />

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-6 py-10 text-center dark:border-red-900/50 dark:bg-red-950/20">
          <p className="text-sm font-semibold text-red-700 dark:text-red-400">The report could not be generated</p>
          <button type="button" onClick={refetch} className="mt-3 text-xs font-semibold text-red-700 underline dark:text-red-400">
            Try again
          </button>
        </div>
      ) : (
        <>
          {/* Totals */}
          {/* gap-px over a border-coloured background draws exact 1px grid lines at every breakpoint */}
          <div className="grid grid-cols-2 gap-px overflow-hidden rounded-2xl border border-[#EAECF0] bg-[#EAECF0] lg:grid-cols-5 dark:border-[#1A3125] dark:bg-[#1A3125]">
            {stats.map((s, i) => (
              <div key={s.label} className={`bg-white px-5 py-4 dark:bg-[#111D17] ${i === 0 ? 'col-span-2 lg:col-span-1' : ''}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
                <p className={`mt-1.5 font-mono text-lg font-semibold tabular-nums xl:text-xl ${s.tone}`}>{s.value}</p>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Breakdown
              title="By category"
              rows={report.breakdown || []}
              columns={(r) => `${r.categoryCode} · ${r.totalClaims} claim${r.totalClaims === 1 ? '' : 's'} · ${pkr(r.reimbursedAmountPaisa)} reimbursed`}
            />
            <Breakdown
              title="By department"
              rows={report.departments || []}
              columns={(r) => `${r.claimantCount} employee${r.claimantCount === 1 ? '' : 's'} · ${r.totalClaims} claim${r.totalClaims === 1 ? '' : 's'}`}
            />
          </div>

          {/* Claims */}
          <div className="overflow-hidden rounded-2xl border border-[#EAECF0] bg-white dark:border-[#1A3125] dark:bg-[#111D17]">
            <div className="flex flex-col gap-3 border-b border-[#EAECF0] px-5 py-3.5 md:flex-row md:items-center md:justify-between dark:border-[#1A3125]">
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                Claims <span className="font-mono font-normal tabular-nums text-slate-500 dark:text-slate-400">({rows.length})</span>
              </h3>
              <div className="flex flex-col gap-2 sm:flex-row">
                <div className="relative sm:w-72">
                  <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search claim, employee, department"
                    aria-label="Search claims"
                    className="w-full rounded-xl border border-[#E2E8F0] bg-white py-2 pe-3 ps-9 text-xs text-slate-800 placeholder:text-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-[#1A3125] dark:bg-[#0A110D] dark:text-slate-100"
                  />
                </div>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  aria-label="Filter by status"
                  className="rounded-xl border border-[#E2E8F0] bg-white px-3 py-2 text-xs text-slate-700 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-[#1A3125] dark:bg-[#0A110D] dark:text-slate-200"
                >
                  <option value="all">All statuses</option>
                  {Object.entries(STATUS_META).map(([key, meta]) => (
                    <option key={key} value={key}>
                      {meta.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {rows.length === 0 ? (
              <div className="space-y-2 px-6 py-14 text-center">
                <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 dark:bg-[#13221B]">
                  <Receipt className="h-5 w-5 text-slate-400" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{claims.length ? 'No matching claims' : `No claims in ${monthLabel(month)}`}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{claims.length ? 'Change the search or status filter.' : 'Pick another month above.'}</p>
              </div>
            ) : (
              <>
                <div className={`hidden gap-4 border-b border-[#EAECF0] bg-slate-50/70 px-5 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-500 lg:grid dark:border-[#1A3125] dark:bg-[#0E1A14] dark:text-slate-400 ${CLAIM_COLS}`}>
                  <span>Employee</span>
                  <span>Claim</span>
                  <span>Expense date</span>
                  <span className="text-end">Claimed</span>
                  <span className="text-end">Authorised</span>
                  <span>Status</span>
                  <span className="sr-only">Open</span>
                </div>
                <ul className="divide-y divide-[#EAECF0] dark:divide-[#1A3125]">
                  {rows.map((c) => (
                    <li
                      key={c._id}
                      tabIndex={0}
                      onClick={() => setOpenId(c._id)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setOpenId(c._id);
                        }
                      }}
                      aria-label={`Open claim ${c.claimNumber} from ${c.applicant?.employeeName || 'employee'}`}
                      className={`grid cursor-pointer grid-cols-2 items-center gap-x-4 gap-y-3 px-5 py-3.5 transition-colors hover:bg-slate-50/70 focus-visible:bg-slate-50 focus-visible:outline-none dark:hover:bg-[#13221B]/60 dark:focus-visible:bg-[#13221B] ${CLAIM_COLS}`}
                    >
                      <PersonRow person={c.applicant} size="sm" className="col-span-2 lg:col-span-1" />
                      <div className="min-w-0">
                        <CellLabel>Claim</CellLabel>
                        <p className="font-mono text-[13px] font-semibold text-slate-900 dark:text-white">{c.claimNumber}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-slate-400">{c.categoryId?.name || 'Uncategorised'}</p>
                      </div>
                      <div>
                        <CellLabel>Expense date</CellLabel>
                        <p className="font-mono text-[13px] tabular-nums text-slate-700 dark:text-slate-300">{formatDay(c.expenseDate)}</p>
                      </div>
                      <div className="lg:text-end">
                        <CellLabel>Claimed</CellLabel>
                        <p className="font-mono text-[13px] font-semibold tabular-nums text-slate-900 dark:text-white">{pkr(c.amount)}</p>
                      </div>
                      <div className="lg:text-end">
                        <CellLabel>Authorised</CellLabel>
                        <p className={`font-mono text-[13px] tabular-nums ${c.approvedAmount ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400'}`}>
                          {c.approvedAmount ? pkr(c.approvedAmount) : '—'}
                        </p>
                      </div>
                      <div>
                        <CellLabel>Status</CellLabel>
                        <ExpenseStatusBadge status={c.status} reimbursement={c.reimbursement} />
                      </div>
                      <ChevronRight className="hidden h-4 w-4 text-slate-300 lg:block rtl:rotate-180 dark:text-slate-600" aria-hidden="true" />
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </>
      )}

      <ExpenseDetailDrawer expenseId={openId} onClose={() => setOpenId(null)} />
    </div>
  );
}
