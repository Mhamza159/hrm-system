/**
 * @file LoanDecisionModal.jsx
 * @description Dialog for processing Multi-Tier Hierarchical Approval Decisions.
 * 
 * SPECIFICATION & THEME:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.3)
 * - State Flow: Manager Recommend -> HR Forward -> Super Admin Final Approve & Disburse.
 * - Forest & Emerald Theme: Emerald accents, accessible contrast, 100% dark mode compatible.
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, CheckCircle2, XCircle, Send, DollarSign, ShieldCheck } from 'lucide-react';
import { useDecideLoanMutation } from '../loansApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { cn } from '../../../lib/utils.js';

export function LoanDecisionModal({ isOpen, onClose, loan }) {
  const { isSuperAdmin, isHR } = useAuth();
  const [decision, setDecision] = useState('recommend');
  const [comments, setComments] = useState('');
  const [disbursementMethod, setDisbursementMethod] = useState('bank_transfer');

  const [decideLoan, { isLoading: isSubmitting }] = useDecideLoanMutation();

  // Determine available decisions based on loan current status and user role
  const isDeptStep = loan?.status === 'pending_recommendation';
  const isHrStep = loan?.status === 'pending_hr';
  const isAdminStep = loan?.status === 'pending_admin';

  useEffect(() => {
    if (isDeptStep) {
      setDecision('recommend');
    } else if (isHrStep) {
      setDecision('forward');
    } else if (isAdminStep) {
      setDecision('approve');
    }
  }, [loan?.status, isDeptStep, isHrStep, isAdminStep]);

  if (!isOpen || !loan) return null;

  const amountPkr = (loan.amount || 0) / 100;
  const installmentPkr = (loan.monthlyInstallment || 0) / 100;
  const employeeName =
    loan.employeeId?.name ||
    loan.employeeId?.user?.name ||
    loan.employeeId?.userId?.name ||
    'Employee';

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!comments.trim() || comments.trim().length < 3) {
      toast.error('Audit trail remarks are required (min 3 characters).');
      return;
    }

    try {
      await decideLoan({
        id: loan._id,
        decision,
        comments: comments.trim(),
        disbursementMethod: decision === 'approve' ? disbursementMethod : undefined
      }).unwrap();

      toast.success(`Loan application successfully processed as ${decision}.`);
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to record decision');
      return;
    }

    // Safely invoke onClose outside the API catch block
    try {
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (closeErr) {
      console.error('Error during decision modal close callback:', closeErr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-[#111D17] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0E1A14]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Review Borrowing Application
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
              {loan.loanId} • {employeeName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Overview summary */}
          <div className="p-4 bg-slate-50 dark:bg-[#0A110D] rounded-xl border border-slate-200/80 dark:border-[#1A3125] space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Applicant:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{employeeName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Requested Amount:</span>
              <span className="font-bold text-[#00C471] dark:text-[#00C471] tabular-nums">
                PKR {amountPkr.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Tenure & Installment:</span>
              <span className="text-slate-700 dark:text-slate-300 tabular-nums">
                {loan.repaymentTenureMonths} mo • PKR {installmentPkr.toLocaleString()}/mo
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500 font-medium">Effective Start Month:</span>
              <span className="text-slate-700 dark:text-slate-300 font-mono">{loan.effectiveStartMonth}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-[#1A3125] text-xs text-slate-600 dark:text-slate-400 italic">
              "{loan.reason}"
            </div>
          </div>

          {/* Decision selection */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Authorization Action
            </label>
            <div className="grid grid-cols-2 gap-2">
              {isDeptStep && (
                <>
                  <button
                    type="button"
                    onClick={() => setDecision('recommend')}
                    className={cn(
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                      decision === 'recommend'
                        ? 'bg-emerald-50 dark:bg-[#00C471]/15 border-[#00C471] text-[#00C471]'
                        : 'border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#00C471]" />
                    Recommend to HR
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('decline')}
                    className={cn(
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                      decision === 'decline'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                        : 'border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    Decline
                  </button>
                </>
              )}

              {isHrStep && (
                <>
                  <button
                    type="button"
                    onClick={() => setDecision('forward')}
                    className={cn(
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                      decision === 'forward'
                        ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 text-blue-700 dark:text-blue-300'
                        : 'border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <Send className="w-4 h-4 text-blue-500" />
                    Forward to Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('reject')}
                    className={cn(
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                      decision === 'reject'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                        : 'border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    Reject
                  </button>
                </>
              )}

              {isAdminStep && (
                <>
                  <button
                    type="button"
                    onClick={() => setDecision('approve')}
                    className={cn(
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                      decision === 'approve'
                        ? 'bg-emerald-50 dark:bg-[#00C471]/15 border-[#00C471] text-[#00C471]'
                        : 'border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#00C471]" />
                    Approve & Disburse
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('reject')}
                    className={cn(
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5 cursor-pointer',
                      decision === 'reject'
                        ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                        : 'border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <XCircle className="w-4 h-4 text-rose-500" />
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Disbursement Method (Only if Super Admin approving) */}
          {decision === 'approve' && (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Disbursement Channel
              </label>
              <select
                value={disbursementMethod}
                onChange={(e) => setDisbursementMethod(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] text-slate-900 dark:text-slate-100 cursor-pointer"
              >
                <option value="bank_transfer">Direct Corporate Bank Transfer</option>
                <option value="cash">Cash via Petty Cash Voucher</option>
                <option value="payroll_addition">Credit as Salary Addition on Next Payslip</option>
              </select>
            </div>
          )}

          {/* Audit Remarks */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Reviewer Audit Notes / Justification
            </label>
            <textarea
              rows={3}
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              placeholder="State recommendation justification, policy compliance checks, or decline reason..."
              required
              maxLength={500}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Action buttons */}
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
              disabled={isSubmitting || !comments.trim()}
              className={cn(
                'px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-xs transition-all cursor-pointer',
                decision === 'decline' || decision === 'reject'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-[#00C471] hover:bg-[#00ad64]'
              )}
            >
              {isSubmitting ? 'Recording...' : `Confirm ${decision.toUpperCase()}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoanDecisionModal;
