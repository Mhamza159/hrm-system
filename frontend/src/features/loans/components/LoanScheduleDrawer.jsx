/**
 * @file LoanScheduleDrawer.jsx
 * @description Slide-out loan detail drawer: borrower profile, loan terms, approval trail,
 * installment schedule and recorded repayments.
 *
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Rows 10.3, 10.4)
 * - Layer: Component
 * - Theme: Forest & Emerald Design System (DESIGN.md / docs/UI-REFERENCE.md)
 * - Invariant: Integer paisa amounts converted cleanly to PKR (/ 100).
 */

import React, { useEffect } from 'react';
import { X, ArrowRight } from 'lucide-react';
import { useGetLoanScheduleQuery, useGetLoanByIdQuery } from '../loansApi.js';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { formatDate } from '../../../lib/formatters.js';

const pkr = (paisa) => `PKR ${((Number(paisa) || 0) / 100).toLocaleString('en-PK')}`;

const formatMonth = (ym) => {
  if (!/^\d{4}-\d{2}$/.test(ym || '')) return '—';
  const [y, m] = ym.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' });
};

const LOAN_TYPE = { loan: 'Loan', advance: 'Salary advance' };
const DISBURSEMENT = { bank_transfer: 'Bank transfer', cash: 'Cash', payroll_addition: 'Added to payroll' };
const REPAYMENT_METHOD = { payroll: 'Payroll deduction', bank_transfer: 'Bank transfer', cash: 'Cash' };

const initials = (name = '') =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?';

function Section({ title, children }) {
  return (
    <section className="space-y-3">
      <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{title}</h4>
      {children}
    </section>
  );
}

function DetailGrid({ items }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-4 rounded-xl border border-[#EAECF0] p-4 sm:grid-cols-2 dark:border-[#1A3125]">
      {items.map(({ label, value, mono }) => (
        <div key={label} className="min-w-0">
          <dt className="text-[11px] text-slate-500 dark:text-slate-400">{label}</dt>
          <dd
            className={`mt-0.5 truncate text-[13px] font-medium text-slate-900 dark:text-slate-100 ${mono ? 'font-mono tabular-nums' : ''}`}
            title={typeof value === 'string' ? value : undefined}
          >
            {value || '—'}
          </dd>
        </div>
      ))}
    </dl>
  );
}

const STEP_TONE = {
  done: 'bg-[#00C471] ring-emerald-100 dark:ring-[#00C471]/20',
  rejected: 'bg-rose-500 ring-rose-100 dark:ring-rose-500/20',
  pending: 'bg-slate-300 ring-slate-100 dark:bg-slate-600 dark:ring-slate-700/40'
};

function ApprovalTrail({ loan }) {
  const rec = loan.recommendation || {};
  const hr = loan.hrReview || {};
  const admin = loan.adminApproval || {};

  const steps = [
    {
      title: 'Application submitted',
      tone: 'done',
      who: loan.employeeId?.name,
      at: loan.createdAt
    },
    {
      title: 'Manager recommendation',
      tone: rec.decision === 'declined' ? 'rejected' : rec.decision ? 'done' : 'pending',
      decision: rec.decision,
      who: rec.recommendedBy?.name,
      at: rec.recommendedAt,
      comments: rec.comments
    },
    {
      title: 'HR review',
      tone: hr.decision === 'rejected' ? 'rejected' : hr.decision ? 'done' : 'pending',
      decision: hr.decision,
      who: hr.reviewedBy?.name,
      at: hr.reviewedAt,
      comments: hr.comments
    },
    {
      title: 'Final approval',
      tone: admin.decision === 'rejected' ? 'rejected' : admin.decision ? 'done' : 'pending',
      decision: admin.decision,
      who: admin.approvedBy?.name,
      at: admin.approvedAt,
      comments: admin.comments
    }
  ];

  return (
    <ol className="rounded-xl border border-[#EAECF0] p-4 dark:border-[#1A3125]">
      {steps.map((s, i) => (
        <li key={s.title} className="relative flex gap-3 pb-5 last:pb-0">
          {i < steps.length - 1 && (
            <span className="absolute start-[5px] top-4 h-[calc(100%-0.5rem)] w-px bg-[#EAECF0] dark:bg-[#1A3125]" aria-hidden="true" />
          )}
          <span className={`relative mt-1 h-[11px] w-[11px] shrink-0 rounded-full ring-4 ${STEP_TONE[s.tone]}`} aria-hidden="true" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <p className="text-[13px] font-semibold text-slate-900 dark:text-slate-100">{s.title}</p>
              <span className="font-mono text-[11px] tabular-nums text-slate-500 dark:text-slate-400">
                {s.at ? formatDate(s.at) : 'Awaiting'}
              </span>
            </div>
            {(s.who || s.decision) && (
              <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                {s.decision && <span className="capitalize">{s.decision}</span>}
                {s.decision && s.who && ' by '}
                {s.who && <span className="font-medium text-slate-700 dark:text-slate-300">{s.who}</span>}
              </p>
            )}
            {s.comments && (
              <p className="mt-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-600 dark:bg-[#0A110D] dark:text-slate-300">
                {s.comments}
              </p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}

export function LoanScheduleDrawer({ loanId, onClose, onPrepayClick }) {
  const { data: scheduleRes, isLoading: isLoadingSchedule } = useGetLoanScheduleQuery(loanId, {
    skip: !loanId
  });
  const { data: loanRes, isLoading: isLoadingLoan } = useGetLoanByIdQuery(loanId, {
    skip: !loanId
  });

  useEffect(() => {
    if (!loanId) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [loanId, onClose]);

  if (!loanId) return null;

  const loan = loanRes?.data;
  const schedule = scheduleRes?.data || [];
  const repayments = loan?.repayments || [];

  const principal = loan?.amount || 0;
  const repaid = loan?.totalRepaid || 0;
  const remaining = loan?.remainingBalance || 0;
  const progressPct = principal > 0 ? Math.min(100, Math.round((repaid / principal) * 100)) : 0;
  const settledCount = schedule.filter((i) => i.status === 'deducted' || i.status === 'prepaid').length;

  const emp = loan?.employeeId || {};
  const borrowerName = emp.name || emp.userId?.name || 'Employee';
  const designation = emp.designationId?.title;
  const department = emp.departmentId?.name;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="loan-drawer-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[90vh] w-full max-w-3xl flex-col rounded-2xl border border-[#EAECF0] bg-white shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 dark:border-[#1A3125] dark:bg-[#111D17]"
      >
        {/* Header: borrower identity */}
        <header className="shrink-0 flex items-start gap-4 border-b border-[#EAECF0] px-6 py-5 dark:border-[#1A3125]">
          {emp.avatar ? (
            <img src={emp.avatar} alt="" className="h-12 w-12 shrink-0 rounded-full object-cover" />
          ) : (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-sm font-semibold text-emerald-700 dark:bg-[#00C471]/15 dark:text-emerald-400">
              {initials(borrowerName)}
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h3 id="loan-drawer-title" className="truncate text-base font-semibold text-slate-900 dark:text-white">
              {isLoadingLoan ? 'Loading…' : borrowerName}
            </h3>
            <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
              {[designation, department].filter(Boolean).join(' · ') || '—'}
            </p>
            {loan && (
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-[11px] font-semibold text-slate-700 dark:text-slate-300">{loan.loanId}</span>
                <span className="text-slate-300 dark:text-slate-600" aria-hidden="true">·</span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400">{LOAN_TYPE[loan.type] || loan.type}</span>
                <StatusBadge status={loan.status} />
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
          {isLoadingLoan || !loan ? (
            <div className="space-y-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-[#13221B]" />
              ))}
            </div>
          ) : (
            <>
              {/* Repayment position */}
              <Section title="Repayment position">
                <div className="rounded-xl border border-[#EAECF0] dark:border-[#1A3125]">
                  <div className="grid grid-cols-3 divide-x divide-[#EAECF0] rtl:divide-x-reverse dark:divide-[#1A3125]">
                    {[
                      { label: 'Principal', value: pkr(principal), tone: 'text-slate-900 dark:text-white' },
                      { label: 'Repaid', value: pkr(repaid), tone: 'text-emerald-600 dark:text-emerald-400' },
                      {
                        label: 'Outstanding',
                        value: pkr(remaining),
                        tone: remaining > 0 ? 'text-slate-900 dark:text-white' : 'text-slate-400 dark:text-slate-500'
                      }
                    ].map((s) => (
                      <div key={s.label} className="px-4 py-3.5">
                        <p className="text-[11px] uppercase tracking-wider text-slate-500 dark:text-slate-400">{s.label}</p>
                        <p className={`mt-1 font-mono text-[15px] font-semibold tabular-nums ${s.tone}`}>{s.value}</p>
                      </div>
                    ))}
                  </div>
                  <div className="border-t border-[#EAECF0] px-4 py-3 dark:border-[#1A3125]">
                    <div className="mb-1.5 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                      <span>
                        {settledCount} of {schedule.length || loan.repaymentTenureMonths} installments settled
                      </span>
                      <span className="font-mono font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{progressPct}%</span>
                    </div>
                    <div
                      className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-[#1A3125]"
                      role="progressbar"
                      aria-valuenow={progressPct}
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-label="Repaid"
                    >
                      <div className="h-full rounded-full bg-[#00C471] transition-all duration-500" style={{ width: `${progressPct}%` }} />
                    </div>
                  </div>
                </div>
              </Section>

              {/* Loan terms */}
              <Section title="Loan details">
                <DetailGrid
                  items={[
                    { label: 'Applied on', value: formatDate(loan.createdAt) },
                    { label: 'Approved & disbursed on', value: loan.adminApproval?.approvedAt ? formatDate(loan.adminApproval.approvedAt) : null },
                    { label: 'Disbursement method', value: loan.adminApproval?.decision === 'approved' ? DISBURSEMENT[loan.adminApproval?.disbursementMethod] : null },
                    { label: 'Deductions start', value: formatMonth(loan.effectiveStartMonth) },
                    { label: 'Tenure', value: `${loan.repaymentTenureMonths} month${loan.repaymentTenureMonths === 1 ? '' : 's'}` },
                    { label: 'Monthly installment', value: pkr(loan.monthlyInstallment), mono: true }
                  ]}
                />
                {loan.reason && (
                  <div className="rounded-xl border border-[#EAECF0] px-4 py-3 dark:border-[#1A3125]">
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">Reason given</p>
                    <p className="mt-0.5 whitespace-pre-line text-[13px] text-slate-800 dark:text-slate-200">{loan.reason}</p>
                  </div>
                )}
              </Section>

              {/* Borrower profile */}
              <Section title="Borrower">
                <DetailGrid
                  items={[
                    { label: 'Employee ID', value: emp.employeeCode, mono: true },
                    { label: 'Department', value: department },
                    { label: 'Designation', value: designation },
                    { label: 'Reporting manager', value: emp.managerId?.name },
                    { label: 'Work email', value: emp.email || emp.userId?.email },
                    { label: 'Phone', value: emp.phone, mono: true },
                    { label: 'Employment type', value: emp.employmentType },
                    { label: 'Employment status', value: emp.status },
                    { label: 'Joined on', value: emp.joiningDate ? formatDate(emp.joiningDate) : null },
                    { label: 'Salary bank', value: emp.bankDetails?.bankName }
                  ]}
                />
              </Section>

              {/* Approval trail */}
              <Section title="Approval trail">
                <ApprovalTrail loan={loan} />
              </Section>

              {/* Installment schedule */}
              <Section title={`Installments (${schedule.length})`}>
                {isLoadingSchedule ? (
                  <div className="h-24 animate-pulse rounded-xl bg-slate-100 dark:bg-[#13221B]" aria-hidden="true" />
                ) : schedule.length === 0 ? (
                  <p className="rounded-xl border border-dashed border-[#EAECF0] px-4 py-6 text-center text-xs text-slate-500 dark:border-[#1A3125] dark:text-slate-400">
                    The schedule is generated once the loan is approved.
                  </p>
                ) : (
                  <div className="overflow-hidden rounded-xl border border-[#EAECF0] dark:border-[#1A3125]">
                    <div className="grid grid-cols-[2.5rem_1fr_1fr_1fr_6.5rem] gap-3 border-b border-[#EAECF0] bg-slate-50/70 px-4 py-2.5 text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:border-[#1A3125] dark:bg-[#0E1A14] dark:text-slate-400">
                      <span>#</span>
                      <span>Month</span>
                      <span className="text-end">Amount</span>
                      <span>Paid on</span>
                      <span className="text-end">Status</span>
                    </div>
                    <ul className="divide-y divide-[#EAECF0] dark:divide-[#1A3125]">
                      {schedule.map((inst) => (
                        <li
                          key={inst._id || inst.installmentNumber}
                          className="grid grid-cols-[2.5rem_1fr_1fr_1fr_6.5rem] items-center gap-3 px-4 py-2.5 text-[13px]"
                        >
                          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">{inst.installmentNumber}</span>
                          <span className="text-slate-800 dark:text-slate-200">{formatMonth(inst.dueMonth)}</span>
                          <span className="text-end font-mono font-medium tabular-nums text-slate-900 dark:text-slate-100">{pkr(inst.amount)}</span>
                          <span className="font-mono text-xs tabular-nums text-slate-500 dark:text-slate-400">
                            {inst.paidAt ? formatDate(inst.paidAt) : '—'}
                          </span>
                          <span className="flex justify-end">
                            <StatusBadge status={inst.status} />
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </Section>

              {/* Recorded repayments */}
              {repayments.length > 0 && (
                <Section title={`Recorded repayments (${repayments.length})`}>
                  <ul className="divide-y divide-[#EAECF0] rounded-xl border border-[#EAECF0] dark:divide-[#1A3125] dark:border-[#1A3125]">
                    {repayments.map((r, i) => (
                      <li key={r._id || i} className="flex items-center justify-between gap-4 px-4 py-3">
                        <div className="min-w-0">
                          <p className="text-[13px] font-medium text-slate-900 dark:text-slate-100">
                            {REPAYMENT_METHOD[r.paymentMethod] || r.paymentMethod}
                          </p>
                          <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                            {formatDate(r.paidAt)}
                            {r.reference ? ` · Ref ${r.reference}` : ''}
                            {r.recordedBy?.name ? ` · by ${r.recordedBy.name}` : ''}
                          </p>
                        </div>
                        <span className="shrink-0 font-mono text-[13px] font-semibold tabular-nums text-slate-900 dark:text-slate-100">
                          {pkr(r.amount)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
            </>
          )}
        </div>

        {/* Footer: early settlement */}
        {loan?.status === 'active' && remaining > 0 && onPrepayClick && (
          <Can I="loan.prepay" a="Loan">
            <footer className="shrink-0 flex items-center justify-between gap-4 border-t border-[#EAECF0] px-6 py-4 dark:border-[#1A3125]">
              <span className="text-xs text-slate-500 dark:text-slate-400">Settle the outstanding balance early</span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onPrepayClick(loan);
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#00C471] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#049856]"
              >
                Record prepayment
                <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
              </button>
            </footer>
          </Can>
        )}
      </div>
    </div>
  );
}

export default LoanScheduleDrawer;
