/**
 * @file MyExpensesPage.jsx
 * @description Self-service personal Expense Claims dashboard and submission hub.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Row 11.2)
 * - Layer: Feature Page (Frontend)
 * - Permission: Can I="expense.create" a="Expense"
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
  X
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { useGetMyExpensesQuery } from '../expensesApi.js';
import ExpenseFormModal from '../components/ExpenseFormModal.jsx';

export default function MyExpensesPage() {
  const [isApplyOpen, setIsApplyOpen] = useState(false);
  const [previewReceipt, setPreviewReceipt] = useState(null);

  const { data, isLoading, error } = useGetMyExpensesQuery();
  const expenses = data?.data || [];

  // Summary KPIs
  const totalClaimedPaisa = expenses.reduce((sum, item) => sum + (item.amount || 0), 0);
  const totalReimbursedPaisa = expenses
    .filter((e) => e.status === 'reimbursed')
    .reduce((sum, item) => sum + (item.approvedAmount || item.amount || 0), 0);
  const pendingCount = expenses.filter(
    (e) => e.status === 'pending_manager' || e.status === 'pending_admin'
  ).length;

  const renderStatusBadge = (status) => {
    switch (status) {
      case 'pending_manager':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800/40">
            Pending Manager
          </span>
        );
      case 'pending_admin':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-50 dark:bg-purple-950/40 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800/40">
            Pending Admin
          </span>
        );
      case 'approved':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
            Approved
          </span>
        );
      case 'reimbursed':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-800/40">
            Reimbursed
          </span>
        );
      case 'rejected':
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40">
            Rejected
          </span>
        );
      default:
        return (
          <span className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
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
          <Can I="expense.create" a="Expense">
            <button
              onClick={() => setIsApplyOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm shadow-emerald-600/20 transition"
            >
              <Plus className="w-4 h-4" />
              Submit Expense
            </button>
          </Can>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <DollarSign className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Claimed</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              PKR {(totalClaimedPaisa / 100).toLocaleString('en-PK')}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/50 border border-blue-200 dark:border-blue-800/40 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <CheckCircle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Total Reimbursed</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
              PKR {(totalReimbursedPaisa / 100).toLocaleString('en-PK')}
            </h3>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800/40 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">Pending Review</p>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">{pendingCount}</h3>
          </div>
        </div>
      </div>

      {/* Claims List Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Claim History</h3>
          <span className="text-xs text-slate-500">{expenses.length} claims submitted</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading claims...</div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-500">Failed to load claims.</div>
        ) : expenses.length === 0 ? (
          <div className="p-12 text-center">
            <Receipt className="w-10 h-10 mx-auto text-slate-300 dark:text-slate-700 mb-3" />
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">No Expense Claims Yet</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              You haven't submitted any expense claims. Click "Submit Expense" to request a reimbursement.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 font-medium">
                  <th className="py-3 px-6">Claim #</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Date Incurred</th>
                  <th className="py-3 px-6">Claimed Amount</th>
                  <th className="py-3 px-6">Approved Amount</th>
                  <th className="py-3 px-6">Receipt</th>
                  <th className="py-3 px-6">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {expenses.map((claim) => (
                  <tr key={claim._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                    <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 dark:text-white">
                      {claim.claimNumber}
                    </td>
                    <td className="py-3.5 px-6">
                      <span className="font-medium text-slate-800 dark:text-slate-200">
                        {claim.categoryId?.name || 'General Expense'}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400">
                      {new Date(claim.expenseDate).toLocaleDateString('en-PK', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-slate-900 dark:text-white">
                      PKR {(claim.amount / 100).toLocaleString('en-PK')}
                    </td>
                    <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300">
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
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          View Proof
                        </button>
                      ) : (
                        <span className="text-slate-400 text-[11px]">No Receipt</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">{renderStatusBadge(claim.status)}</td>
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
          <div className="relative max-w-2xl max-h-[85vh] bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-3 border-b border-slate-100 dark:border-slate-800">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Receipt Verification Proof
              </span>
              <button
                onClick={() => setPreviewReceipt(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 overflow-auto flex items-center justify-center bg-slate-950/10">
              {previewReceipt.endsWith('.pdf') ? (
                <iframe src={previewReceipt} title="Receipt PDF" className="w-full h-96 rounded-lg" />
              ) : (
                <img
                  src={previewReceipt}
                  alt="Receipt Preview"
                  className="max-h-[70vh] object-contain rounded-lg shadow-sm"
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* Submit Claim Modal */}
      <ExpenseFormModal
        isOpen={isApplyOpen}
        onClose={() => setIsApplyOpen(false)}
      />
    </div>
  );
}

