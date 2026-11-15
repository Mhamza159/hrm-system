/**
 * @file ExpenseDetailDrawer.jsx
 * @description Full claim record in a side drawer: amounts, claim details, receipt, applicant,
 * approval trail and reimbursement. Used by My Expenses and Expense Approvals.
 * `actions(expense)` renders the footer (e.g. Review / Reimburse buttons for approvers).
 */

import React, { useEffect } from 'react';
import { X, FileText, ExternalLink } from 'lucide-react';
import { useGetExpenseByIdQuery } from '../expensesApi.js';
import { PersonRow } from '../../../components/common/Person.jsx';
import { ExpenseStatusBadge, pkr, formatDay, formatDateTime } from './expenseUi.jsx';

const STAGE_LABELS = {
  manager_recommendation: 'Recommended by manager',
  manager_approval: 'Approved by manager',
  manager_rejection: 'Rejected by manager',
  manager_escalation: 'Escalated to executive',
  admin_approval: 'Approved by executive',
  admin_rejection: 'Rejected by executive',
};

const DECISION_TONE = {
  approved: 'bg-[#00C471]',
  recommended: 'bg-[#00C471]',
  escalated: 'bg-amber-500',
  rejected: 'bg-red-500',
};

const isImage = (url = '', mime = '') => mime.startsWith('image/') || /\.(png|jpe?g|webp|gif)(\?|$)/i.test(url);

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h4>
      {children}
    </section>
  );
}

function Fields({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl border border-[#EAECF0] p-4 sm:grid-cols-2 dark:border-[#1A3125]">
      {items.map(({ label, value, mono }) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">{label}</dt>
          <dd className={`mt-0.5 truncate text-[13px] font-medium text-slate-900 dark:text-slate-100 ${mono ? 'font-mono tabular-nums' : ''}`}>
            {value || '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Trail({ expense }) {
  const applicantName = expense.applicant?.employeeName || 'Applicant';
  const steps = [
    { key: 'submitted', title: 'Claim submitted', who: applicantName, at: expense.createdAt, tone: 'bg-[#00C471]' },
    ...(expense.approvalHistory || []).map((h, i) => ({
      key: h._id || i,
      title: STAGE_LABELS[h.stage] || h.stage,
      who: h.actor?.name,
      role: h.actor?.role,
      at: h.timestamp,
      comments: h.comments,
      tone: DECISION_TONE[h.decision] || 'bg-slate-400',
    })),
  ];
  if (expense.reimbursement?.disbursedAt) {
    steps.push({
      key: 'reimbursed',
      title: 'Reimbursed',
      who: expense.reimbursement.disbursedByPerson?.name,
      role: expense.reimbursement.disbursedByPerson?.role,
      at: expense.reimbursement.disbursedAt,
      comments: expense.reimbursement.remarks,
      tone: 'bg-cyan-500',
    });
  }
  const waiting = ['pending_manager', 'pending_admin'].includes(expense.status);

  return (
    <ol className="rounded-xl border border-[#EAECF0] p-4 dark:border-[#1A3125]">
      {[...steps, ...(waiting ? [{ key: 'waiting', pending: true }] : [])].map((s, i, all) => (
        <li key={s.key} className="relative flex gap-3 pb-5 last:pb-0">
          {i < all.length - 1 && (
            <span className="absolute start-[5px] top-4 h-[calc(100%-0.5rem)] w-px bg-[#EAECF0] dark:bg-[#1A3125]" aria-hidden="true" />
          )}
          <span
            className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full ${s.pending ? 'border-2 border-violet-400 bg-white dark:bg-[#111D17]' : s.tone}`}
            aria-hidden="true"
          />
          {s.pending ? (
            <p className="text-[13px] font-medium text-violet-700 dark:text-violet-400">
              {expense.status === 'pending_admin' ? 'Awaiting executive decision' : 'Awaiting manager decision'}
            </p>
          ) : (
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{s.title}</p>
                <time className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">{formatDateTime(s.at)}</time>
              </div>
              {s.who && (
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                  {s.who}
                  {s.role && <span className="text-slate-400 dark:text-slate-500"> · {s.role}</span>}
                </p>
              )}
              {s.comments && (
                <p className="mt-2 whitespace-pre-line rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-[#0A110D] dark:text-slate-300">
                  {s.comments}
                </p>
              )}
            </div>
          )}
        </li>
      ))}
    </ol>
  );
}

export default function ExpenseDetailDrawer({ expenseId, onClose, actions }) {
  const { data, isLoading, isError } = useGetExpenseByIdQuery(expenseId, { skip: !expenseId });
  const expense = data?.data;

  useEffect(() => {
    if (!expenseId) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expenseId, onClose]);

  if (!expenseId) return null;

  const emp = expense?.employeeId || {};
  const category = expense?.categoryId || {};
  const footer = expense && actions ? actions(expense) : null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="expense-drawer-title"
        onClick={(e) => e.stopPropagation()}
        className="flex h-full w-full max-w-2xl flex-col border-s border-[#EAECF0] bg-white shadow-2xl animate-in slide-in-from-right duration-300 dark:border-[#1A3125] dark:bg-[#111D17]"
      >
        <header className="flex items-start justify-between gap-4 border-b border-[#EAECF0] px-6 py-5 dark:border-[#1A3125]">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">Expense claim</p>
            <h3 id="expense-drawer-title" className="mt-0.5 font-mono text-base font-semibold text-slate-900 dark:text-white">
              {expense?.claimNumber || '…'}
            </h3>
            {expense && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <ExpenseStatusBadge status={expense.status} reimbursement={expense.reimbursement} />
                <span className="text-xs text-slate-500 dark:text-slate-400">{category.name || 'Uncategorised'}</span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="-me-1.5 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-[#1A3125] dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </header>

        <div className="flex-1 space-y-7 overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="space-y-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-[#13221B]" />
              ))}
            </div>
          ) : isError || !expense ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-xs text-red-700 dark:border-red-900/50 dark:bg-red-950/20 dark:text-red-400">
              This claim could not be loaded. It may be outside your access scope.
            </p>
          ) : (
            <>
              <Section title="Amounts">
                <div className="grid grid-cols-3 divide-x divide-[#EAECF0] rounded-xl border border-[#EAECF0] rtl:divide-x-reverse dark:divide-[#1A3125] dark:border-[#1A3125]">
                  {[
                    { label: 'Claimed', value: pkr(expense.amount), tone: 'text-slate-900 dark:text-white' },
                    {
                      label: 'Authorised',
                      value: expense.approvedAmount ? pkr(expense.approvedAmount) : '—',
                      tone: expense.approvedAmount ? 'text-teal-700 dark:text-teal-400' : 'text-slate-400',
                    },
                    {
                      label: 'Paid out',
                      value: expense.status === 'reimbursed' ? pkr(expense.approvedAmount || expense.amount) : '—',
                      tone: expense.status === 'reimbursed' ? 'text-cyan-700 dark:text-cyan-400' : 'text-slate-400',
                    },
                  ].map((s) => (
                    <div key={s.label} className="px-4 py-3.5">
                      <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
                      <p className={`mt-1 font-mono text-[15px] font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
                    </div>
                  ))}
                </div>
              </Section>

              <Section title="Claim details">
                <Fields
                  items={[
                    { label: 'Expense date', value: formatDay(expense.expenseDate) },
                    { label: 'Submitted on', value: formatDateTime(expense.createdAt) },
                    { label: 'Category', value: category.code ? `${category.name} (${category.code})` : category.name },
                    { label: 'Category limit', value: category.maxLimitPaisa ? pkr(category.maxLimitPaisa) : 'No limit', mono: Boolean(category.maxLimitPaisa) },
                  ]}
                />
                {expense.description && (
                  <div className="rounded-xl border border-[#EAECF0] px-4 py-3 dark:border-[#1A3125]">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Description</p>
                    <p className="mt-0.5 whitespace-pre-line text-[13px] text-slate-800 dark:text-slate-200">{expense.description}</p>
                  </div>
                )}
              </Section>

              <Section title="Receipt">
                {expense.receiptUrl ? (
                  <div className="overflow-hidden rounded-xl border border-[#EAECF0] dark:border-[#1A3125]">
                    {isImage(expense.receiptUrl, expense.receiptMimeType) && (
                      <img src={expense.receiptUrl} alt={`Receipt for ${expense.claimNumber}`} className="max-h-72 w-full bg-slate-50 object-contain dark:bg-[#0A110D]" />
                    )}
                    <div className="flex items-center justify-between gap-3 border-t border-[#EAECF0] px-4 py-3 first:border-t-0 dark:border-[#1A3125]">
                      <span className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                        <FileText className="h-4 w-4 text-slate-400" aria-hidden="true" />
                        {expense.receiptMimeType === 'application/pdf' || /\.pdf(\?|$)/i.test(expense.receiptUrl) ? 'PDF receipt' : 'Receipt image'}
                      </span>
                      <a
                        href={expense.receiptUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                      >
                        Open
                        <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
                      </a>
                    </div>
                  </div>
                ) : (
                  <p className="rounded-xl border border-dashed border-[#EAECF0] px-4 py-5 text-center text-xs text-slate-500 dark:border-[#1A3125] dark:text-slate-400">
                    No receipt attached.
                  </p>
                )}
              </Section>

              <Section title="Applicant">
                <div className="space-y-4 rounded-xl border border-[#EAECF0] p-4 dark:border-[#1A3125]">
                  <PersonRow person={expense.applicant} size="lg" />
                  <dl className="grid grid-cols-1 gap-x-6 gap-y-3 border-t border-[#EAECF0] pt-4 sm:grid-cols-2 dark:border-[#1A3125]">
                    <div>
                      <dt className="text-[11px] text-slate-500 dark:text-slate-400">Employee ID</dt>
                      <dd className="mt-0.5 font-mono text-[13px] font-medium text-slate-900 dark:text-slate-100">{emp.employeeCode || '—'}</dd>
                    </div>
                    <div className="min-w-0">
                      <dt className="text-[11px] text-slate-500 dark:text-slate-400">Work email</dt>
                      <dd className="mt-0.5 truncate text-[13px] font-medium text-slate-900 dark:text-slate-100">{emp.email || '—'}</dd>
                    </div>
                  </dl>
                </div>
              </Section>

              <Section title="Approval trail">
                <Trail expense={expense} />
              </Section>

              {expense.reimbursement?.method && (
                <Section title="Reimbursement">
                  <Fields
                    items={[
                      { label: 'Method', value: expense.reimbursement.method === 'payroll' ? 'Added to next payroll' : 'Direct transfer' },
                      { label: 'Payment reference', value: expense.reimbursement.paymentReference, mono: true },
                      { label: 'Paid on', value: expense.reimbursement.disbursedAt ? formatDay(expense.reimbursement.disbursedAt) : 'Not yet paid' },
                      { label: 'Processed by', value: expense.reimbursement.disbursedByPerson?.name },
                    ]}
                  />
                </Section>
              )}
            </>
          )}
        </div>

        {footer && (
          <footer className="flex items-center justify-end gap-3 border-t border-[#EAECF0] px-6 py-4 dark:border-[#1A3125]">{footer}</footer>
        )}
      </div>
    </div>
  );
}
