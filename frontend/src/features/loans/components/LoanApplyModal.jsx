/**
 * @file LoanApplyModal.jsx
 * @description Dialog for submitting Loan or Salary Advance applications with live calculation and eligibility validation.
 * 
 * SPECIFICATION & THEME:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Rows 10.1 & 10.2)
 * - Invariant: User enters amount in PKR; converted to integer paisa (* 100) before sending.
 * - Forest & Emerald Theme: Emerald accents, accessible contrast, 100% dark mode compatible.
 * - Systemic UI State 9 (FormField inline instructions) & State 8 (Draft Recovery).
 */

import React, { useState, useEffect, useMemo } from 'react';
import { toast } from 'sonner';
import { X, DollarSign, Calendar, AlertCircle, ShieldCheck, CheckCircle2, Info } from 'lucide-react';
import { useApplyLoanMutation, useGetLoanEligibilityQuery } from '../loansApi.js';
import { cn } from '../../../lib/utils.js';
import { FormField } from '../../../components/common/FormField.jsx';
import { loadFormDraft, clearFormDraft, saveFormDraft } from '../../../lib/draftStorage.js';
import { useAuth } from '../../../hooks/useAuth.js';

export function LoanApplyModal({ isOpen, onClose }) {
  const { user } = useAuth();
  const [type, setType] = useState('advance');
  const [amountPkr, setAmountPkr] = useState('');
  const [tenure, setTenure] = useState(1);
  const [reason, setReason] = useState('');
  const [errors, setErrors] = useState({});

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

  // Load draft if available when opened
  useEffect(() => {
    if (!isOpen) return;
    const draft = loadFormDraft('loan_apply_modal', user?.id || user?._id);
    if (draft?.data) {
      if (draft.data.type) setType(draft.data.type);
      if (draft.data.amountPkr) setAmountPkr(draft.data.amountPkr);
      if (draft.data.tenure) setTenure(Number(draft.data.tenure));
      if (draft.data.reason) setReason(draft.data.reason);
      if (draft.data.effectiveStartMonth) setEffectiveStartMonth(draft.data.effectiveStartMonth);
      toast.info('Restored unsaved loan application draft.', { duration: 3000 });
    }
  }, [isOpen, user]);

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
  const isOverLimit = currentLimitPkr <= 0 ? numericAmount > 0 : numericAmount > currentLimitPkr;
  const hasActiveOfSameType = eligibility
    ? type === 'advance'
      ? eligibility.hasActiveAdvance
      : eligibility.hasActiveLoan
    : false;

  const isProbation = eligibility?.isProbation || false;
  const cannotApply = isProbation || hasActiveOfSameType || currentLimitPkr <= 0;

  // Live monthly installment calculation (in PKR)
  const monthlyInstallmentPkr = tenure > 0 && numericAmount > 0
    ? Math.round((numericAmount / tenure) * 100) / 100
    : 0;

  const validateForm = () => {
    const newErrors = {};

    if (numericAmount <= 0) {
      newErrors.amount = 'Amount must be greater than 0 PKR.';
    } else if (currentLimitPkr <= 0) {
      newErrors.amount = 'Your allowable borrowing limit is PKR 0. Ensure your salary structure is configured.';
    } else if (isOverLimit) {
      newErrors.amount = `Exceeds your maximum allowable limit of PKR ${currentLimitPkr.toLocaleString()}.`;
    }

    if (!reason.trim() || reason.trim().length < 5) {
      newErrors.reason = 'Justification is too brief (at least 5 characters required).';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (cannotApply) {
      toast.error('You are currently ineligible for this borrowing type.');
      return;
    }

    if (!validateForm()) {
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

      clearFormDraft('loan_apply_modal', user?.id || user?._id);

      toast.success(
        type === 'advance'
          ? 'Salary advance application submitted successfully'
          : 'Loan application submitted successfully'
      );
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to submit borrowing request');
      return;
    }

    // Safely invoke onClose outside the API catch block
    try {
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (closeErr) {
      console.error('Error during apply modal close callback:', closeErr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111D17] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0E1A14]">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-emerald-100 dark:bg-[#00C471]/15 text-[#00C471] rounded-xl">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Apply for Borrowing
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Submit a request for an emergency salary advance or term loan.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Eligibility Banner / Guard Warning */}
          {cannotApply && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 rounded-xl text-xs text-rose-800 dark:text-rose-300 flex items-start space-x-2.5">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Borrowing Restricted</p>
                <p className="mt-0.5">
                  {isProbation
                    ? 'Staff members on probation are ineligible for company loans or salary advances.'
                    : currentLimitPkr <= 0
                    ? 'Your allowable borrowing ceiling is PKR 0. Please verify your salary structure with HR.'
                    : `You already have an active or pending ${type}. Multiple concurrent borrowings of the same type are not permitted.`}
                </p>
              </div>
            </div>
          )}

          {/* Borrowing Type Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Borrowing Category
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-[#0A110D] rounded-xl border border-slate-200/80 dark:border-[#1A3125]">
              <button
                type="button"
                onClick={() => setType('advance')}
                className={cn(
                  'py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer',
                  type === 'advance'
                    ? 'bg-white dark:bg-[#111D17] text-[#00C471] shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                Salary Advance (1–3 mo)
              </button>
              <button
                type="button"
                onClick={() => setType('loan')}
                className={cn(
                  'py-2 px-3 text-xs font-medium rounded-lg transition-all cursor-pointer',
                  type === 'loan'
                    ? 'bg-white dark:bg-[#111D17] text-[#00C471] shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                )}
              >
                Employee Loan (1–24 mo)
              </button>
            </div>
          </div>

          {/* Amount Input with FormField (State 9) */}
          <FormField
            id="loan-amount"
            label="Principal Amount (PKR)"
            required
            error={errors.amount}
            instruction={`Enter a positive amount up to your ceiling of PKR ${currentLimitPkr.toLocaleString()}.`}
            helperText={currentLimitPkr > 0 ? `Max limit: PKR ${currentLimitPkr.toLocaleString()}` : undefined}
          >
            <div className="relative rounded-xl shadow-xs">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-semibold">
                PKR
              </span>
              <input
                id="loan-amount"
                type="number"
                name="amountPkr"
                min="100"
                step="100"
                value={amountPkr}
                onChange={(e) => {
                  setAmountPkr(e.target.value);
                  if (errors.amount) setErrors((prev) => ({ ...prev, amount: null }));
                }}
                placeholder="e.g. 50000"
                required
                className={cn(
                  'w-full pl-12 pr-4 py-2 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] transition-all text-slate-900 dark:text-slate-100 tabular-nums',
                  errors.amount && 'border-rose-500'
                )}
              />
            </div>
          </FormField>

          {/* Tenure and Start Month Grid */}
          <div className="grid grid-cols-2 gap-3">
            <FormField
              id="loan-tenure"
              label="Tenure (Months)"
              required
            >
              <select
                id="loan-tenure"
                name="tenure"
                value={tenure}
                onChange={(e) => setTenure(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] text-slate-900 dark:text-slate-100 cursor-pointer"
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
            </FormField>

            <FormField
              id="loan-start-month"
              label="First Deduction Month"
              required
            >
              <input
                id="loan-start-month"
                type="month"
                name="effectiveStartMonth"
                value={effectiveStartMonth}
                onChange={(e) => setEffectiveStartMonth(e.target.value)}
                required
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] text-slate-900 dark:text-slate-100"
              />
            </FormField>
          </div>

          {/* Monthly Deduction Calculation Pill */}
          {numericAmount > 0 && (
            <div className="p-3 bg-slate-50 dark:bg-[#0A110D] border border-slate-200/80 dark:border-[#1A3125] rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Estimated Monthly Deduction:
              </span>
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                PKR {monthlyInstallmentPkr.toLocaleString()} / mo
              </span>
            </div>
          )}

          {/* Reason / Justification with FormField */}
          <FormField
            id="loan-reason"
            label="Reason / Justification"
            required
            error={errors.reason}
            instruction="Please write a clear justification of at least 5 characters."
          >
            <textarea
              id="loan-reason"
              name="reason"
              rows={3}
              value={reason}
              onChange={(e) => {
                setReason(e.target.value);
                if (errors.reason) setErrors((prev) => ({ ...prev, reason: null }));
              }}
              placeholder="Provide a clear explanation for this advance or loan request..."
              maxLength={500}
              required
              className="w-full px-3.5 py-2 text-xs bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] text-slate-900 dark:text-slate-100 placeholder:text-slate-400 resize-none"
            />
          </FormField>
          <div className="flex justify-end text-[10px] text-slate-400 -mt-2">
            {reason.length}/500
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || cannotApply || isOverLimit || numericAmount <= 0}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#00ad64] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
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
