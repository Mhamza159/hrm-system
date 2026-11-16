/**
 * @file expenseUi.jsx
 * @description Shared formatting, category pills, and status badges for the Expenses module.
 * Status colours strictly follow the locked DESIGN.md §4 table (Pending violet, Approved teal,
 * Rejected red, Paid cyan, Active emerald, Disabled rose).
 */

import React from 'react';
import { cn } from '../../../lib/utils.js';

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

const PENDING = 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/60';

export const STATUS_META = {
  pending_manager: { label: 'Awaiting manager', cls: PENDING },
  pending_admin: { label: 'Awaiting executive', cls: PENDING },
  approved: { label: 'Approved', cls: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/60' },
  rejected: { label: 'Rejected', cls: 'bg-red-50 text-red-700 border-red-200/80 dark:bg-red-950/40 dark:text-red-400 dark:border-red-800/60' },
  reimbursed: { label: 'Reimbursed', cls: 'bg-cyan-50 text-cyan-700 border-cyan-200/80 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/60' },
};

export function ExpenseStatusBadge({ status, reimbursement, className = '' }) {
  const meta = STATUS_META[status] || {
    label: status,
    cls: 'bg-slate-100 text-slate-700 border-slate-200/80 dark:bg-[#15231C] dark:text-slate-300 dark:border-[#1A3125]'
  };
  const label = status === 'approved' && reimbursement?.method === 'payroll' ? 'Queued for payroll' : meta.label;
  return (
    <span className={cn('inline-flex items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-2xs leading-none select-none', meta.cls, className)}>
      {label}
    </span>
  );
}

export const PILL_TONES = {
  emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60',
  slate: 'bg-slate-100 text-slate-600 border-slate-200/80 dark:bg-[#15231C] dark:text-slate-400 dark:border-[#1A3125]',
  rose: 'bg-rose-50 text-rose-700 border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60',
  teal: 'bg-teal-50 text-teal-700 border-teal-200/80 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/60',
  violet: 'bg-violet-50 text-violet-700 border-violet-200/80 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/60',
  cyan: 'bg-cyan-50 text-cyan-700 border-cyan-200/80 dark:bg-cyan-950/40 dark:text-cyan-400 dark:border-cyan-800/60',
  amber: 'bg-amber-50 text-amber-700 border-amber-200/80 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
};

export function CategoryPill({ tone = 'slate', children, className = '' }) {
  const toneClass = PILL_TONES[tone] || PILL_TONES.slate;
  return (
    <span className={cn('inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold shadow-2xs leading-none select-none tracking-tight', toneClass, className)}>
      {children}
    </span>
  );
}

export const Pill = CategoryPill;
