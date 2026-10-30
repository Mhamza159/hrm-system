/**
 * @file ExpenseReimburseModal.jsx
 * @description Modal dialog for executing expense reimbursements (Direct Wire vs Payroll Addition).
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.4)
 * - Layer: Component (Frontend)
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building,
  CheckCircle,
  AlertCircle,
  FileSpreadsheet,
  Banknote
} from 'lucide-react';
import { useReimburseExpenseMutation } from '../expensesApi.js';

export default function ExpenseReimburseModal({ isOpen, onClose, expense = null }) {
  const [method, setMethod] = useState('direct');
  const [paymentReference, setPaymentReference] = useState('');
  const [remarks, setRemarks] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [reimburseExpense, { isLoading }] = useReimburseExpenseMutation();

  useEffect(() => {
    if (expense) {
      setMethod('direct');
      setPaymentReference('');
      setRemarks('');
      setErrorMsg('');
    }
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (method === 'direct' && !paymentReference.trim()) {
      setErrorMsg('Payment reference (e.g. Bank wire reference / transaction ID) is required for direct payouts.');
      return;
    }

    try {
      await reimburseExpense({
        id: expense._id,
        method,
        paymentReference: paymentReference.trim(),
        remarks: remarks.trim()
      }).unwrap();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to execute reimbursement.');
    }
  };

  const approvedAmount = expense.approvedAmount || expense.amount;
  const applicantName =
    expense.employeeId?.name ||
    `${expense.employeeId?.firstName || ''} ${expense.employeeId?.lastName || ''}`.trim() ||
    'Employee';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Banknote className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Disburse Reimbursement
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Claim {expense.claimNumber} • {applicantName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Amount Card */}
          <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 flex items-center justify-between">
            <div>
              <span className="text-xs text-slate-500 dark:text-slate-400 block">Total Approved Payable</span>
              <span className="text-lg font-bold text-slate-900 dark:text-white">
                PKR {(approvedAmount / 100).toLocaleString('en-PK')}
              </span>
            </div>
            <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
              Approved
            </span>
          </div>

          {/* Method Selection (BUILD-GUIDE Row 11.4) */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
              Reimbursement Channel *
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                onClick={() => setMethod('direct')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col items-start gap-1.5 ${
                  method === 'direct'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                  <CreditCard className="w-4 h-4 text-emerald-600" />
                  Direct Transfer / Cash
                </div>
                <p className="text-[11px] text-slate-500">
                  Immediate bank transfer or cash voucher reimbursement.
                </p>
              </div>

              <div
                onClick={() => setMethod('payroll')}
                className={`p-3.5 rounded-xl border cursor-pointer transition flex flex-col items-start gap-1.5 ${
                  method === 'payroll'
                    ? 'border-emerald-600 bg-emerald-50/50 dark:bg-emerald-950/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-900 dark:text-white">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Attach to Next Payroll
                </div>
                <p className="text-[11px] text-slate-500">
                  Adds as non-taxable earning addition in next monthly payslip.
                </p>
              </div>
            </div>
          </div>

          {/* Reference Input */}
          {method === 'direct' ? (
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Bank / Wire Payment Reference *
              </label>
              <input
                type="text"
                placeholder="e.g. FT-HBL-982312 or Cash Voucher #812"
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
              This amount will automatically be attached to {applicantName}'s next draft payroll batch as non-taxable reimbursement.
            </div>
          )}

          {/* Additional Notes */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Disbursement Remarks
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Approved and transferred via company treasury..."
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-1.5"
            >
              {isLoading ? 'Processing...' : 'Confirm Reimbursement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

