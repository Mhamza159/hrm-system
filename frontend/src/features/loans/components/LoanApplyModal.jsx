/**
 * @file LoanApplyModal.jsx
 * @description Dialog for submitting Loan or Salary Advance applications with live calculation and eligibility validation.
 * 
 * SPECIFICATION & THEME:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Rows 10.1 & 10.2)
 * - Invariant: User enters amount in PKR; converted to integer paisa (* 100) before sending.
 * - Forest & Emerald Theme: Emerald accents, accessible contrast, 100% dark mode compatible.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { X, DollarSign, Calendar, AlertCircle, ShieldCheck, CheckCircle2, Info } from 'lucide-react';
import { useApplyLoanMutation, useGetLoanEligibilityQuery } from '../loansApi.js';
import { cn } from '../../../lib/utils.js';

export function LoanApplyModal({ isOpen, onClose }) {
  const [type, setType] = useState('advance');
  const [amountPkr, setAmountPkr] = useState('');
  const [tenure, setTenure] = useState(1);
  const [reason, setReason] = useState('');

  // Default start month to next month 'YYYY-MM'
  const nextMonthStr = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    return `${yr}-${mo}`;
  }, []);

  const [effectiveStartMonth, setEffectiveStartMonth] = useState(nextMonthStr);

  const { data: eligibilityRes, isLoading: isLoadingEligibility } = useGetLoanEligibilityQuery(undefined, {
    skip: !isOpen
  });
  const eligibility = eligibilityRes?.data;

  const [applyLoan, { isLoading: isSubmitting }] = useApplyLoanMutation();

  // Reset or adjust tenure constraints when type changes
  useEffect(() => {
    if (type === 'advance') {
      if (tenure > 3) setTenure(3);
    }
  }, [type, tenure]);

  if (!isOpen) return null;

  // Active limit calculation
  const advanceLimitPkr = eligibility ? eligibility.advanceMaxPaisa / 100 : 0;
  const loanLimitPkr = eligibility ? eligibility.loanMaxPaisa / 100 : 0;
  const currentLimitPkr = type === 'advance' ? advanceLimitPkr : loanLimitPkr;

  const numericAmount = parseFloat(amountPkr) || 0;
  const isOverLimit = currentLimitPkr > 0 && numericAmount > currentLimitPkr;
  const hasActiveOfSameType = eligibility
    ? type === 'advance'
      ? eligibility.hasActiveAdvance
      : eligibility.hasActiveLoan
    : false;

  const isProbation = eligibility?.isProbation || false;
  const cannotApply = isProbation || hasActiveOfSameType;

  // Live monthly installment calculation (in PKR)
  const monthlyInstallmentPkr = tenure > 0 && numericAmount > 0
    ? Math.round((numericAmount / tenure) * 100) / 100
    : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cannotApply) {
      toast.error('You are currently ineligible for this borrowing type.');
      return;
    }

    if (numericAmount <= 0) {
      toast.error('Please enter a valid borrowing amount.');
      return;
    }

    if (isOverLimit) {
      toast.error(`Requested amount exceeds your maximum limit of PKR ${currentLimitPkr.toLocaleString()}`);
      return;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      toast.error('Please enter a comprehensive justification (min 5 characters).');
      return;
    }

    try {
      const amountInPaisa = Math.round(numericAmount * 100);
      await applyLoan({
        type,
        amount: amountInPaisa,
        repaymentTenureMonths: Number(tenure),
        effectiveStartMonth,
        reason: reason.trim()
      }).unwrap();

      toast.success(
        type === 'advance'
          ? 'Salary advance application submitted successfully'
          : 'Loan application submitted successfully'
      );
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to submit borrowing request');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-slate-100">
                Apply for Borrowing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Emergency salary advance or long-term employee loan
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Eligibility Banner */}
          {isLoadingEligibility ? (
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-xs text-slate-500 animate-pulse">
              Verifying borrowing policy and eligibility...
            </div>
          ) : isProbation ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start space-x-2.5 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-semibold">Probation Restriction:</span> Employees on probation are not eligible for company loans or advances until confirmed.
              </div>
            </div>
          ) : hasActiveOfSameType ? (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/60 rounded-xl flex items-start space-x-2.5 text-amber-800 dark:text-amber-300 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <span className="font-semibold">Active Request Exists:</span> You already have an active or pending {type} request. You must complete repayment before applying for another.
              </div>
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-800/40 rounded-xl flex items-center justify-between text-xs text-emerald-900 dark:text-emerald-300">
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Max {type === 'advance' ? 'Advance Limit (1x Gross)' : 'Loan Limit (2x Basic)'}:
                </span>
              </div>
              <span className="font-bold text-sm text-emerald-700 dark:text-emerald-300">
                PKR {currentLimitPkr.toLocaleString()}
              </span>
            </div>
          )}

          {/* Type Selector (Segmented control) */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Borrowing Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800/70 rounded-xl">
              <button
                type="button"
                onClick={() => setType('advance')}
                className={cn(
                  'py-2 px-3 text-xs font-medium rounded-lg transition-all',
                  type === 'advance'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                Salary Advance (1–3 mo)
              </button>
              <button
                type="button"
                onClick={() => setType('loan')}
                className={cn(
                  'py-2 px-3 text-xs font-medium rounded-lg transition-all',
                  type === 'loan'
                    ? 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 shadow-sm font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                Employee Loan (1–24 mo)
              </button>
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Principal Amount (PKR)
              </label>
              {isOverLimit && (
                <span className="text-[11px] font-medium text-rose-500 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Exceeds max cap
                </span>
              )}
            </div>
            <div className="relative rounded-xl shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-semibold">
                PKR
              </span>
              <input
                type="number"
                min="100"
                step="100"
                value={amountPkr}
                onChange={(e) => setAmountPkr(e.target.value)}
                placeholder="e.g. 50000"
                required
                className={cn(
                  'w-full pl-12 pr-4 py-2.5 text-sm bg-slate-50 dark:bg-slate-800/50 border rounded-xl focus:outline-none focus:ring-2 transition-colors',
                  isOverLimit
                    ? 'border-rose-300 dark:border-rose-700 focus:ring-rose-500/20 text-rose-600'
                    : 'border-slate-200 dark:border-slate-700 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100'
                )}
              />
            </div>
          </div>

          {/* Tenure and Start Month Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tenure (Months)
              </label>
              <select
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100"
              >
                {type === 'advance' ? (
                  <>
                    <option value={1}>1 Month (Lump sum next salary)</option>
                    <option value={2}>2 Months</option>
                    <option value={3}>3 Months</option>
                  </>
                ) : (
                  Array.from({ length: 24 }, (_, i) => i + 1).map((m) => (
                    <option key={m} value={m}>
                      {m} {m === 1 ? 'Month' : 'Months'}
                    </option>
                  ))
                )}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                First Deduction Month
              </label>
              <input
                type="month"
                value={effectiveStartMonth}
                onChange={(e) => setEffectiveStartMonth(e.target.value)}
                required
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Monthly Deduction Calculation Pill */}
          {numericAmount > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/60 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Estimated Monthly Deduction:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100">
                PKR {monthlyInstallmentPkr.toLocaleString()} / mo
              </span>
            </div>
          )}

          {/* Reason / Justification */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Reason / Justification
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Provide a clear explanation for this advance or loan request..."
              maxLength={500}
              required
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none"
            />
            <div className="flex justify-end text-[10px] text-slate-400 mt-1">
              {reason.length}/500
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || cannotApply || isOverLimit || numericAmount <= 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-sm shadow-emerald-500/20 hover:shadow-md transition-all flex items-center gap-1.5"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoanApplyModal;
