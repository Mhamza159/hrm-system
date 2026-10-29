/**
 * @file LoanDecisionModal.jsx
 * @description Dialog for processing Multi-Tier Hierarchical Approval Decisions.
 * 
 * SPECIFICATION & THEME:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.3)
 * - State Flow: Manager Recommend -> HR Forward -> Super Admin Final Approve & Disburse.
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, CheckCircle2, XCircle, AlertTriangle, Send, DollarSign } from 'lucide-react';
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
  const employeeName = loan.employeeId?.user?.name || loan.employeeId?.firstName || 'Employee';

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

      toast.success(`Loan application successfully processed as ${decision}`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record decision');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Review Borrowing Application
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {loan.loanId} • {employeeName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Overview summary */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200/80 dark:border-slate-700/60 space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Applicant:</span>
              <span className="font-semibold text-slate-900 dark:text-slate-100">{employeeName}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Requested Amount:</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">
                PKR {amountPkr.toLocaleString()}
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Tenure & Installment:</span>
              <span className="text-slate-700 dark:text-slate-300">
                {loan.repaymentTenureMonths} mo • PKR {installmentPkr.toLocaleString()}/mo
              </span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-slate-500">Effective Start Month:</span>
              <span className="text-slate-700 dark:text-slate-300">{loan.effectiveStartMonth}</span>
            </div>
            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-400 italic">
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
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5',
                      decision === 'recommend'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Recommend to HR
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('decline')}
                    className={cn(
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5',
                      decision === 'decline'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
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
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5',
                      decision === 'forward'
                        ? 'bg-blue-50 border-blue-500 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <Send className="w-4 h-4 text-blue-500" />
                    Forward to Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('reject')}
                    className={cn(
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5',
                      decision === 'reject'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
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
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5',
                      decision === 'approve'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
                    )}
                  >
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                    Approve & Disburse
                  </button>
                  <button
                    type="button"
                    onClick={() => setDecision('reject')}
                    className={cn(
                      'py-2 px-3 text-xs font-semibold rounded-xl border transition-all flex items-center justify-center gap-1.5',
                      decision === 'reject'
                        ? 'bg-rose-50 border-rose-500 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400'
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
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100"
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
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100 resize-none"
            />
          </div>

          {/* Action buttons */}
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
              disabled={isSubmitting || !comments.trim()}
              className={cn(
                'px-5 py-2 text-xs font-semibold text-white rounded-xl shadow-sm transition-all',
                decision === 'decline' || decision === 'reject'
                  ? 'bg-rose-600 hover:bg-rose-700'
                  : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/20'
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
