/**
 * @file MyExpensesPage.jsx
 * @description Self-service personal Expense Claims dashboard and submission hub.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.2)
 * - Layer: Feature Page (Frontend)
 * - Permission: Can I="expense.create" a="Expense"
 * - Design: Forest & Emerald Craft (DESIGN.md & docs/UI-REFERENCE.md)
 */

import React, { useState } from 'react';
import {
  Receipt,
  Plus,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  AlertCircle,
  ExternalLink,
  Eye,
  Check,
  X
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { useGetMyExpensesQuery } from '../expensesApi.js';
import ExpenseFormModal from '../components/ExpenseFormModal.jsx';

export default function MyExpensesPage() {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const { data, isLoading, isFetching, error, refetch } = useGetMyExpensesQuery();
  const expenses = data?.data || [];

  // Summary KPIs
  const totalClaimedPaisa = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalReimbursedPaisa = expenses
    .filter((e) => e.status === 'reimbursed')
    .reduce((sum, item) => sum + (item.approvedAmount || item.amount || 0), 0);

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const pendingCount = expenses.filter(
    (e) => e.status === 'pending_manager' || e.status === 'pending_admin'
  ).length;

  const renderStatusBadge = (status, reimbursement) => {
    if (status === 'approved' && reimbursement?.method === 'payroll') {
      return (
        <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1">
          <Clock className="w-3.5 h-3.5" />
          Queued for Payroll
        </span>
      );
    }
    switch (status) {
      case 'pending_manager':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20">
            Pending Manager
          </span>
        );
      case 'pending_admin':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20">
            Pending Admin
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20">
            Approved
          </span>
        );
      case 'reimbursed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20">
            Reimbursed
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/20">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-[#162720] dark:text-slate-300">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="My Expense Claims"
        description="Submit out-of-pocket operational expenses and track managerial reimbursement approval."
        actions={
          <div className="flex items-center gap-2">
            <RefreshButton onRefresh={refetch} isFetching={isFetching} />
            <Can I="expense.create" a="Expense">
              <button
                onClick={() => setIsApplyOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Submit Expense
              </button>
            </Can>
          </div>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Claimed</p>
            <h3 className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
              PKR {(totalClaimedPaisa / 100).toLocaleString('en-PK')}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Reimbursed</p>
            <h3 className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
              PKR {(totalReimbursedPaisa / 100).toLocaleString('en-PK')}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] flex items-center gap-4 shadow-2xs">
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Review</p>
            <h3 className="text-xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
              {pendingCount}
            </h3>
          </div>
        </div>
      </div>

      {/* Claims List Table */}
      <div className="rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] overflow-hidden shadow-2xs">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Claim History</h3>
          <span className="text-xs text-slate-500 dark:text-slate-400">{expenses.length} claims submitted</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading claims...</div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-500">Failed to load claims.</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">No Expense Claims Yet</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
              You haven't submitted any expense claims. Click "Submit Expense" to request a reimbursement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#162720]/40 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-3.5 px-6">Claim #</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Date Incurred</th>
                  <th className="py-3.5 px-6">Claimed Amount</th>
                  <th className="py-3.5 px-6">Approved Amount</th>
                  <th className="py-3.5 px-6">Receipt</th>
                  <th className="py-3.5 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {expenses.map((claim) => (
                  <tr key={claim._id} className="hover:bg-slate-50/50 dark:hover:bg-[#162720]/30 transition">
                    <td className="py-3.5 px-6 font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                      {claim.claimNumber}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {claim.categoryId?.name || 'General Expense'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                      {new Date(claim.expenseDate).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                      PKR {(claim.amount / 100).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3.5 px-6 font-mono tabular-nums font-medium text-emerald-600 dark:text-emerald-400">
                      {claim.approvedAmount ? (
                        <span>PKR {(claim.approvedAmount / 100).toLocaleString('en-PK')}</span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      {claim.receiptUrl ? (
                        <button
                          onClick={() => setPreviewReceipt(claim.receiptUrl)}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition cursor-pointer"
                        >
                          <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          Receipt
                        </button>
                      ) : (
                        <span className="text-slate-400 dark:text-slate-500 text-[11px] italic">No Receipt</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">{renderStatusBadge(claim.status, claim.reimbursement)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Receipt Preview Lightbox Modal */}
      {previewReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative max-w-2xl max-h-[85vh] bg-white dark:bg-[#111D17] rounded-2xl shadow-2xl border border-slate-200 dark:border-[#1A3125] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#162720]/40">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Receipt Proof Audit
              </span>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162720] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center">
              {previewReceipt.endsWith('.pdf') ? (
                <iframe src={previewReceipt} title="Receipt Preview" className="w-full h-96 rounded-xl" />
              ) : (
                <img
                  src={previewReceipt}
                  alt="Receipt Preview"
                  className="max-h-[70vh] object-contain rounded-xl"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Expense Form Modal */}
      <ExpenseFormModal isOpen={isApplyOpen} onClose={() => setIsApplyOpen(false)} />
    </div>
  );
}
