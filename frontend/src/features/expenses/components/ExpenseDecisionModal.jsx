/**
 * @file ExpenseDecisionModal.jsx
 * @description Modal dialog for reviewing and approving/rejecting employee expense claims.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.3)
 * - Separation of duties: Self-approval prohibited.
 * - Multi-tier routing: Dept Manager approval/recommendation & Super Admin executive sign-off.
 * - Design: Forest & Emerald Craft (DESIGN.md & docs/UI-REFERENCE.md)
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle,
  XCircle,
  AlertCircle,
  Receipt,
  FileText,
  DollarSign,
  User,
  ShieldCheck,
  Eye,
  Check,
  Building,
  Briefcase,
  Mail
} from 'lucide-react';
import { useDecideExpenseMutation } from '../expensesApi.js';

export default function ExpenseDecisionModal({ isOpen, onClose, expense = null }) {
  const [comments, setComments] = useState('');
  const [approvedAmountPkr, setApprovedAmountPkr] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showFullReceipt, setShowFullReceipt] = useState(false);

  const [decideExpense, { isLoading }] = useDecideExpenseMutation();

  useEffect(() => {
    if (expense) {
      setComments('');
      setApprovedAmountPkr(expense.amount ? (expense.amount / 100).toString() : '');
      setErrorMsg('');
      setShowFullReceipt(false);
    }
  }, [expense, isOpen]);

  if (!isOpen || !expense) return null;

  const handleDecision = async (decision) => {
    setErrorMsg('');

    if (!comments.trim() || comments.trim().length < 3) {
      setErrorMsg('Mandatory review comments/remarks required (at least 3 characters).');
      return;
    }

    const payload = {
      id: expense._id,
      decision,
      comments: comments.trim()
    };

    if (decision === 'approve' || decision === 'recommend') {
      const pkrNum = parseFloat(approvedAmountPkr);
      if (!pkrNum || pkrNum <= 0) {
        setErrorMsg('Please specify a valid approved amount in PKR.');
        return;
      }
      payload.approvedAmount = Math.round(pkrNum * 100);
    }

    try {
      await decideExpense(payload).unwrap();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || 'Failed to submit approval decision.');
    }
  };

  const emp = expense.employeeId || {};
  const applicantName =
    emp.name ||
    `${emp.firstName || ''} ${emp.lastName || ''}`.trim() ||
    'Employee';
  const initials = (applicantName || 'E')
    .split(' ')
    .filter(Boolean)
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'EM';
  const empCode = emp.employeeCode || null;
  const designationTitle = emp.designationId?.title || emp.designation || null;
  const departmentName = emp.departmentId?.name || null;
  const empEmail = emp.email || null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="relative w-full max-w-xl bg-white dark:bg-[#111D17] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#162720]/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900 dark:text-white">
                Review Claim <span className="font-mono">{expense.claimNumber}</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
                Audit receipt proof and determine reimbursement authorization
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162720] transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-y-auto">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 flex items-center gap-2.5 text-xs text-rose-700 dark:text-rose-300">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-500" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Rich Applicant Profile Card */}
          <div className="p-3.5 rounded-xl bg-slate-50/70 dark:bg-[#162720]/30 border border-slate-200 dark:border-[#1A3125] flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {emp.avatar ? (
                <img
                  src={emp.avatar}
                  alt={applicantName}
                  className="w-10 h-10 rounded-full object-cover border border-emerald-500/20 shrink-0"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20 shrink-0">
                  {initials}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h4 className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                    {applicantName}
                  </h4>
                  {empCode && (
                    <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#162720] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]">
                      {empCode}
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-500 dark:text-[#7E9E8F] flex items-center gap-1.5 truncate mt-0.5">
                  {designationTitle && <span>{designationTitle}</span>}
                  {designationTitle && departmentName && <span className="text-slate-300 dark:text-slate-600">•</span>}
                  {departmentName && (
                    <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                      {departmentName}
                    </span>
                  )}
                </div>
              </div>
            </div>
            {empEmail && (
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 hidden sm:inline truncate max-w-[170px]">
                {empEmail}
              </span>
            )}
          </div>

          {/* Claim Metadata Grid */}
          <div className="p-4 rounded-xl bg-slate-50/70 dark:bg-[#162720]/30 border border-slate-200 dark:border-[#1A3125] grid grid-cols-2 gap-3 text-xs">
            <div>
              <span className="text-slate-400 block mb-0.5">Category</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                {expense.categoryId?.name} ({expense.categoryId?.code})
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Claimed Amount</span>
              <span className="text-sm font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                PKR {(expense.amount / 100).toLocaleString('en-PK')}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Expense Incurred</span>
              <span className="font-mono tabular-nums font-medium text-slate-700 dark:text-slate-300">
                {new Date(expense.expenseDate).toLocaleDateString('en-PK', {
                  year: 'numeric',
                  month: 'short',
                  day: 'numeric'
                })}
              </span>
            </div>

            <div>
              <span className="text-slate-400 block mb-0.5">Receipt Mandate</span>
              {expense.categoryId?.requiresReceipt ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  Receipt
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 dark:bg-[#162720] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-[#1A3125]">
                  Optional
                </span>
              )}
            </div>

            <div className="col-span-2 pt-2 border-t border-slate-200 dark:border-[#1A3125]">
              <span className="text-slate-400 block mb-0.5">Description & Business Purpose</span>
              <p className="text-slate-700 dark:text-slate-300 italic">{expense.description}</p>
            </div>
          </div>

          {/* Receipt Proof Audit */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5 text-emerald-600" />
                Receipt Proof
                {expense.categoryId?.requiresReceipt && (
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                    <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                    Receipt
                  </span>
                )}
              </label>
              {expense.receiptUrl && (
                <button
                  type="button"
                  onClick={() => setShowFullReceipt(!showFullReceipt)}
                  className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  {showFullReceipt ? 'Collapse Receipt' : 'Zoom Receipt'}
                </button>
              )}
            </div>

            {expense.receiptUrl ? (
              <div className="rounded-xl border border-slate-200 dark:border-[#1A3125] overflow-hidden bg-slate-950/5 dark:bg-black/20 p-2 flex items-center justify-center">
                {expense.receiptUrl.endsWith('.pdf') ? (
                  <iframe src={expense.receiptUrl} title="Receipt PDF" className="w-full h-48 rounded" />
                ) : (
                  <img
                    src={expense.receiptUrl}
                    alt="Receipt Proof"
                    className={`rounded object-contain transition-all ${
                      showFullReceipt ? 'max-h-96' : 'max-h-40'
                    }`}
                  />
                )}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 text-xs border border-amber-200 dark:border-amber-900/40">
                No receipt proof attached to this claim.
              </div>
            )}
          </div>

          {/* Approved Amount Input */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Authorized Approved Amount (PKR)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-xs font-semibold text-slate-400">PKR</span>
              <input
                type="number"
                min="1"
                step="0.01"
                value={approvedAmountPkr}
                onChange={(e) => setApprovedAmountPkr(e.target.value)}
                className="w-full pl-12 pr-3 py-2 text-sm font-mono tabular-nums font-semibold rounded-xl border border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>
            <p className="text-[11px] text-slate-400 dark:text-[#7E9E8F] mt-1">
              You may adjust the approved amount downwards if certain itemized items are non-reimbursable.
            </p>
          </div>

          {/* Remarks / Comments */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
              Audit Remarks & Decision Notes *
            </label>
            <textarea
              rows="2"
              placeholder="e.g. Receipt verified, taxi fare matches standard rate..."
              value={comments}
              onChange={(e) => setComments(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-slate-300 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#162720]/40">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#162720] transition cursor-pointer"
          >
            Cancel
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleDecision('reject')}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40 hover:bg-rose-100 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <XCircle className="w-4 h-4" />
              Reject Claim
            </button>

            <button
              type="button"
              onClick={() => handleDecision('approve')}
              disabled={isLoading}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle className="w-4 h-4" />
              {expense.amount > 1500000 ? 'Approve & Forward' : 'Approve Claim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
