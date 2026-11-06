/**
 * @file EarlyPrepaymentModal.jsx
 * @description Dialog for recording early partial or full settlement repayments on active loans.
 * 
 * SPECIFICATION & THEME:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.6)
 * - Invariant: Validates amount in PKR and converts to integer paisa (* 100).
 * - Enforces State 9 (Inline instructions) and State 10 (Confirm and reassure).
 */

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { X, DollarSign, CreditCard, CheckCircle2, AlertCircle, ArrowRight } from 'lucide-react';
import { usePrepayLoanMutation } from '../loansApi.js';
import { FormField } from '../../../components/common/FormField.jsx';

export function EarlyPrepaymentModal({ isOpen, onClose, loan }) {
  const [amountPkr, setAmountPkr] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bank_transfer');
  const [reference, setReference] = useState('');
  const [hasInteracted, setHasInteracted] = useState(false);

  const [prepayLoan, { isLoading: isSubmitting }] = usePrepayLoanMutation();

  const remainingPkr = loan ? (loan.remainingBalance || 0) / 100 : 0;

  useEffect(() => {
    if (loan && remainingPkr > 0) {
      setAmountPkr(String(remainingPkr));
      setReference('');
      setPaymentMethod('bank_transfer');
      setHasInteracted(false);
    }
  }, [loan, remainingPkr]);

  if (!isOpen || !loan) return null;

  const numericAmount = parseFloat(amountPkr) || 0;
  const newBalancePkr = Math.max(0, remainingPkr - numericAmount);
  const isFullSettlement = numericAmount >= remainingPkr;
  const isInvalidAmount = numericAmount <= 0 || numericAmount > remainingPkr;
  const isInvalidReference = !reference.trim() || reference.trim().length < 2;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setHasInteracted(true);

    if (isInvalidAmount) {
      toast.error(`Please enter an amount between 1 and ${remainingPkr.toLocaleString()} PKR.`);
      return;
    }

    if (isInvalidReference) {
      toast.error('Please enter a valid receipt or bank reference (at least 2 characters).');
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
          ? 'Full loan prepayment recorded; account closed successfully.'
          : 'Early partial repayment recorded successfully.'
      );
    } catch (err) {
      toast.error(err?.data?.message || err?.message || 'Failed to record prepayment');
      return;
    }

    // Safely invoke onClose outside the API catch block
    try {
      if (typeof onClose === 'function') {
        onClose();
      }
    } catch (closeErr) {
      console.error('Error during modal close callback:', closeErr);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-md bg-white dark:bg-[#111D17] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden transform transition-all"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0E1A14]">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Record Early Prepayment
            </h3>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {loan.loanId} • {loan.type?.toUpperCase()}
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

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Outstanding Summary Card */}
          <div className="p-3.5 bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Current Outstanding Balance:</span>
            <span className="font-bold text-slate-900 dark:text-white tabular-nums">
              PKR {remainingPkr.toLocaleString()}
            </span>
          </div>

          {/* Amount Input with FormField (State 9) */}
          <FormField
            id="prepayment-amount"
            label="Prepayment Amount (PKR)"
            required
            error={hasInteracted && isInvalidAmount ? `Amount must be between PKR 1 and PKR ${remainingPkr.toLocaleString()}` : null}
            instruction={`Enter amount up to PKR ${remainingPkr.toLocaleString()} to deduct from principal.`}
          >
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <span />
                <button
                  type="button"
                  onClick={() => setAmountPkr(String(remainingPkr))}
                  className="text-[11px] font-semibold text-[#00C471] hover:underline cursor-pointer"
                >
                  Full Settle (PKR {remainingPkr.toLocaleString()})
                </button>
              </div>
              <div className="relative rounded-xl shadow-xs">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-400 text-xs font-semibold">
                  PKR
                </span>
                <input
                  id="prepayment-amount"
                  type="number"
                  min="1"
                  max={remainingPkr}
                  step="1"
                  value={amountPkr}
                  onChange={(e) => {
                    setAmountPkr(e.target.value);
                    setHasInteracted(true);
                  }}
                  required
                  className="w-full pl-12 pr-4 py-2 text-xs bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] text-slate-900 dark:text-slate-100 tabular-nums"
                />
              </div>
            </div>
          </FormField>

          {/* Balance After Preview */}
          <div className="p-3 rounded-xl bg-emerald-50/60 dark:bg-[#00C471]/10 border border-emerald-200/60 dark:border-[#00C471]/20 text-xs flex justify-between items-center">
            <span className="text-emerald-900 dark:text-emerald-300 font-medium">
              Remaining After Prepayment:
            </span>
            <span className="font-bold text-[#00C471] dark:text-[#00C471] tabular-nums">
              PKR {newBalancePkr.toLocaleString()} {isFullSettlement && '(Closed)'}
            </span>
          </div>

          {/* Payment Method with FormField */}
          <FormField
            id="prepayment-method"
            label="Payment Method"
            required
            instruction="Select the verified liquidation or receipt channel."
          >
            <select
              id="prepayment-method"
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] text-slate-900 dark:text-slate-100 cursor-pointer"
            >
              <option value="bank_transfer">Direct Bank Transfer / Wire</option>
              <option value="cash">Company Cash Receipt</option>
            </select>
          </FormField>

          {/* Reference with FormField (State 9) */}
          <FormField
            id="prepayment-reference"
            label="Receipt / Transaction Reference"
            required
            error={hasInteracted && isInvalidReference ? 'Reference must be at least 2 characters (e.g. FT-20261027-8910)' : null}
            instruction="Enter the bank deposit slip, transaction ID, or cash voucher number."
          >
            <input
              id="prepayment-reference"
              type="text"
              value={reference}
              onChange={(e) => {
                setReference(e.target.value);
                setHasInteracted(true);
              }}
              placeholder="e.g. FT-20261027-8910 or Cash Receipt #45"
              required
              maxLength={100}
              className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] text-slate-900 dark:text-slate-100"
            />
          </FormField>

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
              disabled={isSubmitting || isInvalidAmount || isInvalidReference}
              className="px-5 py-2 text-xs font-semibold text-white bg-[#00C471] hover:bg-[#00ad64] disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
            >
              {isSubmitting ? 'Recording...' : 'Confirm Prepayment'}
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EarlyPrepaymentModal;
