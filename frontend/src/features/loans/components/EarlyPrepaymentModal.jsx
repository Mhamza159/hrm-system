/**
 * @file EarlyPrepaymentModal.jsx
 * @description Dialog for recording early partial or full settlement repayments on active loans.
 * 
 * SPECIFICATION & THEME:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.6)
 * - Invariant: Validates amount in PKR and converts to integer paisa (* 100).
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, DollarSign, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';
import { usePrepayLoanMutation } from '../loansApi.js';

export function EarlyPrepaymentModal({ isOpen, onClose, loan }) {
  const [amountPkr, setAmountPkr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');

  const [prepayLoan, { isLoading: isSubmitting }] = usePrepayLoanMutation();

  const remainingPkr = loan ? (loan.remainingBalance || 0) / 100 : 0;

  useEffect(() => {
    if (loan && remainingPkr > 0) {
      setAmountPkr(String(remainingPkr));
    }
  }, [loan, remainingPkr]);

  if (!isOpen || !loan) return null;

  const numericAmount = parseFloat(amountPkr) || 0;
  const newBalancePkr = Math.max(0, remainingPkr - numericAmount);
  const isFullSettlement = numericAmount >= remainingPkr;
  const isInvalid = numericAmount <= 0 || numericAmount > remainingPkr;

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isInvalid) {
      toast.error(`Please enter an amount between 1 and ${remainingPkr.toLocaleString()} PKR.`);
      return;
    }

    if (!reference.trim() || reference.trim().length < 2) {
      toast.error('Please enter a payment receipt or bank reference.');
      return;
    }

    try {
      const amountInPaisa = Math.round(numericAmount * 100);
      await prepayLoan({
        id: loan._id,
        amount: amountInPaisa,
        paymentMethod,
        reference: reference.trim()
      }).unwrap();

      toast.success(
        isFullSettlement
          ? 'Full loan prepayment recorded; account closed successfully'
          : 'Early partial repayment recorded successfully'
      );
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to record prepayment');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Record Early Prepayment
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {loan.loanId}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Outstanding Summary Pill */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500">Current Outstanding:</span>
            <span className="font-bold text-slate-900 dark:text-white">
              PKR {remainingPkr.toLocaleString()}
            </span>
          </div>

          {/* Amount Input */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Prepayment Amount (PKR)
              </label>
              <button
                type="button"
                onClick={() => setAmountPkr(String(remainingPkr))}
                className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                Full Settle
              </button>
            </div>
            <div className="relative rounded-xl shadow-sm">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-semibold">
                PKR
              </span>
              <input
                type="number"
                min="1"
                max={remainingPkr}
                step="1"
                value={amountPkr}
                onChange={(e) => setAmountPkr(e.target.value)}
                required
                className="w-full pl-12 pr-4 py-2 text-sm bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          {/* Balance After Preview */}
          <div className="p-3 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/40 text-xs flex justify-between items-center">
            <span className="text-emerald-800 dark:text-emerald-300">
              Remaining After Prepayment:
            </span>
            <span className="font-bold text-emerald-700 dark:text-emerald-300">
              PKR {newBalancePkr.toLocaleString()} {isFullSettlement && '(Closed)'}
            </span>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Payment Method
            </label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100"
            >
              <option value="bank_transfer">Direct Bank Transfer / Wire</option>
              <option value="cash">Company Cash Receipt</option>
            </select>
          </div>

          {/* Reference */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Receipt / Transaction Reference
            </label>
            <input
              type="text"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              placeholder="e.g. FT-20261027-8910 or Cash Receipt #45"
              required
              maxLength={100}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 dark:text-slate-100"
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
              disabled={isSubmitting || isInvalid || !reference.trim()}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-xl shadow-sm transition-all"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Prepayment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EarlyPrepaymentModal;
