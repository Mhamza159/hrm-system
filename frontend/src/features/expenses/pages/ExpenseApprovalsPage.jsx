/**
 * @file ExpenseApprovalsPage.jsx
 * @description Managerial review, executive escalations and reimbursement payout command center.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Rows 11.3 & 11.4)
 * - Multi-tier Queues: Department Manager review, Super Admin escalations, HR Reimbursement queue.
 */

import React, { useState } from 'react';
import {
  ShieldCheck,
  Clock,
  CheckCircle,
  FileText,
  DollarSign,
  AlertCircle,
  Eye,
  CreditCard,
  User,
  Search,
  Filter
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { useGetPendingExpenseApprovalsQuery } from '../expensesApi.js';
import ExpenseDecisionModal from '../components/ExpenseDecisionModal.jsx';
import ExpenseReimburseModal from '../components/ExpenseReimburseModal.jsx';

export default function ExpenseApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending_manager'); // 'pending_manager' | 'pending_admin' | 'approved'
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading, error } = useGetPendingExpenseApprovalsQuery({
    status: activeTab
  });

  const claims = data?.data || [];

  const filteredClaims = claims.filter((claim) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const claimNum = claim.claimNumber?.toLowerCase() || '';
    const applicant = (
      claim.employeeId?.name ||
      `${claim.employeeId?.firstName || ''} ${claim.employeeId?.lastName || ''}`
    ).toLowerCase();
    const category = claim.categoryId?.name?.toLowerCase() || '';
    return claimNum.includes(term) || applicant.includes(term) || category.includes(term);
  });

  const handleOpenDecision = (claim) => {
    setSelectedExpense(claim);
    setIsDecisionModalOpen(true);
  };

  const handleOpenReimburse = (claim) => {
    setSelectedExpense(claim);
    setIsReimburseModalOpen(true);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-150">
      <PageHeader
        title="Expense Approvals & Reimbursements"
        description="Verify submitted receipt proofs, authorize managerial claims, and execute company reimbursements."
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 gap-6">
        <button
          onClick={() => setActiveTab('pending_manager')}
          className={`pb-3 text-xs font-semibold transition relative ${
            activeTab === 'pending_manager'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Team Claims Review
        </button>

        <button
          onClick={() => setActiveTab('pending_admin')}
          className={`pb-3 text-xs font-semibold transition relative flex items-center gap-1.5 ${
            activeTab === 'pending_admin'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Executive Escalations (&gt; PKR 15k)
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-3 text-xs font-semibold transition relative flex items-center gap-1.5 ${
            activeTab === 'approved'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Approved for Reimbursement
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search claim #, employee, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>
        <span className="text-xs text-slate-500">{filteredClaims.length} items in queue</span>
      </div>

      {/* Claims Queue Table */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading queue...</div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-500">Failed to load claims queue.</div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
            <h4 className="text-sm font-medium text-slate-900 dark:text-white">All Caught Up!</h4>
            <p className="text-xs text-slate-500 mt-1">
              There are no pending claims in this review queue.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 text-slate-500 font-medium">
                  <th className="py-3 px-6">Claim #</th>
                  <th className="py-3 px-6">Applicant</th>
                  <th className="py-3 px-6">Category</th>
                  <th className="py-3 px-6">Expense Date</th>
                  <th className="py-3 px-6">Claimed</th>
                  <th className="py-3 px-6">Authorized</th>
                  <th className="py-3 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredClaims.map((claim) => {
                  const applicantName =
                    claim.employeeId?.name ||
                    `${claim.employeeId?.firstName || ''} ${claim.employeeId?.lastName || ''}`.trim() ||
                    'Employee';

                  return (
                    <tr key={claim._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition">
                      <td className="py-3.5 px-6 font-mono font-semibold text-slate-900 dark:text-white">
                        {claim.claimNumber}
                      </td>
                      <td className="py-3.5 px-6">
                        <div className="font-medium text-slate-900 dark:text-white">{applicantName}</div>
                        <div className="text-[11px] text-slate-400">{claim.employeeId?.designation || 'Staff'}</div>
                      </td>
                      <td className="py-3.5 px-6 font-medium text-slate-700 dark:text-slate-300">
                        {claim.categoryId?.name}
                      </td>
                      <td className="py-3.5 px-6 text-slate-600 dark:text-slate-400">
                        {new Date(claim.expenseDate).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>
                      <td className="py-3.5 px-6 font-bold text-slate-900 dark:text-white">
                        PKR {(claim.amount / 100).toLocaleString('en-PK')}
                      </td>
                      <td className="py-3.5 px-6 font-medium text-emerald-600 dark:text-emerald-400">
                        {claim.approvedAmount ? `PKR ${(claim.approvedAmount / 100).toLocaleString('en-PK')}` : '—'}
                      </td>
                      <td className="py-3.5 px-6 text-right">
                        {activeTab === 'approved' ? (
                          claim.reimbursement?.method === 'payroll' ? (
                            <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
                              <Clock className="w-3.5 h-3.5" />
                              Queued for Payroll
                            </span>
                          ) : (
                            <Can I="expense.reimburse" a="Expense">
                              <button
                                onClick={() => handleOpenReimburse(claim)}
                                className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition inline-flex items-center gap-1.5"
                              >
                                <CreditCard className="w-3.5 h-3.5" />
                                Reimburse
                              </button>
                            </Can>
                          )
                        ) : (
                          <Can I="expense.approve" a="Expense">
                            <button
                              onClick={() => handleOpenDecision(claim)}
                              className="px-3 py-1.5 rounded-xl text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 shadow-sm transition inline-flex items-center gap-1.5"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              Review Claim
                            </button>
                          </Can>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      <ExpenseDecisionModal
        isOpen={isDecisionModalOpen}
        onClose={() => setIsDecisionModalOpen(false)}
        expense={selectedExpense}
      />

      {/* Reimbursement Modal */}
      <ExpenseReimburseModal
        isOpen={isReimburseModalOpen}
        onClose={() => setIsReimburseModalOpen(false)}
        expense={selectedExpense}
      />
    </div>
  );
}

