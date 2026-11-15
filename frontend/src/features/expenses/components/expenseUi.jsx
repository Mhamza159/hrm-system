/**
 * @file expenseUi.jsx
 * @description Shared formatting and the status badge for the Expenses module.
 * Status colours follow the locked DESIGN.md §4 table (Pending violet, Approved teal,
 * Rejected red, Paid cyan).
 */

import React from 'react';

export const pkr = (paisa) => `PKR ${((Number(paisa) || 0) / 100).toLocaleString('en-PK')}`;

export const formatDay = (value) => {
  const d = new Date(value);
  return value && !Number.isNaN(d.getTime())
    ? d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '—';
};

export const formatDateTime = (value) => {
  const d = new Date(value);
  return value && !Number.isNaN(d.getTime())
    ? d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '—';
};

/** "3d", "5h", "just now" — how long a claim has been waiting. */
export const waitingFor = (value) => {
  const ms = Date.now() - new Date(value).getTime();
  if (!value || Number.isNaN(ms)) return '—';
  const hours = Math.floor(ms / 3600000);
  if (hours < 1) return 'just now';
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
};

const PENDING = 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/60';

export const STATUS_META = {
  pending_manager: { label: 'Awaiting manager', cls: PENDING },
  pending_admin: { label: 'Awaiting executive', cls: PENDING },
  approved: { label: 'Approved', cls: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/60' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60' },
  reimbursed: { label: 'Reimbursed', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/60' },
};

export function ExpenseStatusBadge({ status, reimbursement }) {
  const meta = STATUS_META[status] || { label: status, cls: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-[#13221B]/50 dark:text-slate-300 dark:border-slate-700' };
  const label = status === 'approved' && reimbursement?.method === 'payroll' ? 'Queued for payroll' : meta.label;
  return (
    <span className={`inline-flex items-center whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold ${meta.cls}`}>
      {label}
    </span>
  );
}
