/**
 * @file ExpenseApprovalsPage.jsx
 * @description Managerial review, executive escalations and reimbursement payout command center.
 * 
 * SPECIFICATION:
 * - Module: M11 Expense Claims (BUILD-GUIDE Section 16 · Rows 11.3 & 11.4)
 * - Multi-tier Queues: Department Manager review, Super Admin escalations, HR Reimbursement queue.
 * - Design: Forest & Emerald Craft (DESIGN.md & docs/UI-REFERENCE.md)
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
  Filter,
  Check,
  Briefcase
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { Can } from '../../../components/common/Can.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { useGetPendingExpenseApprovalsQuery } from '../expensesApi.js';
import ExpenseDecisionModal from '../components/ExpenseDecisionModal.jsx';
import ExpenseReimburseModal from '../components/ExpenseReimburseModal.jsx';

export default function ExpenseApprovalsPage() {
  const [activeTab, setActiveTab] = useState('pending_manager'); // 'pending_manager' | 'pending_admin' | 'approved'
  const [selectedExpense, setSelectedExpense] = useState(null);
  const [isDecisionModalOpen, setIsDecisionModalOpen] = useState(false);
  const [isReimburseModalOpen, setIsReimburseModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  const { data, isLoading, isFetching, error, refetch } = useGetPendingExpenseApprovalsQuery({
    status: activeTab
  });

  const claims = data?.data || [];

  const filteredClaims = claims.filter((claim) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    const claimNum = (claim.claimNumber || '').toLowerCase();
    const applicantName = (
      claim.employeeId?.name ||
      `${claim.employeeId?.firstName || ''} ${claim.employeeId?.lastName || ''}`
    ).toLowerCase();
    const employeeCode = (claim.employeeId?.employeeCode || '').toLowerCase();
    const category = (claim.categoryId?.name || '').toLowerCase();
    const dept = (claim.employeeId?.departmentId?.name || '').toLowerCase();
    const desig = (claim.employeeId?.designationId?.title || claim.employeeId?.designation || '').toLowerCase();

    return (
      claimNum.includes(term) ||
      applicantName.includes(term) ||
      employeeCode.includes(term) ||
      category.includes(term) ||
      dept.includes(term) ||
      desig.includes(term)
    );
  });

  if (isLoading && !data) {
    return (
      <div className="space-y-6 animate-in fade-in duration-150">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

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
        actions={<RefreshButton onRefresh={refetch} isFetching={isFetching} />}
      />

      {/* Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#1A3125] gap-6">
        <button
          onClick={() => setActiveTab('pending_manager')}
          className={`pb-3 text-xs font-semibold transition relative cursor-pointer ${
            activeTab === 'pending_manager'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Team Claims Review
        </button>

        <button
          onClick={() => setActiveTab('pending_admin')}
          className={`pb-3 text-xs font-semibold transition relative flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'pending_admin'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Executive Escalations (&gt; PKR 15k)
        </button>

        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-3 text-xs font-semibold transition relative flex items-center gap-1.5 cursor-pointer ${
            activeTab === 'approved'
              ? 'text-emerald-600 dark:text-emerald-400 border-b-2 border-emerald-600'
              : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
        >
          Approved for Reimbursement
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search claim #, employee, ID (EMP-0012), role, category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition"
          />
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
          {filteredClaims.length} items in queue
        </span>
      </div>

      {/* Claims Queue Table */}
      <div className="rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-500">Loading queue...</div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-rose-500">Failed to load claims queue.</div>
        ) : filteredClaims.length === 0 ? (
          <div className="p-12 text-center">
            <CheckCircle className="w-10 h-10 mx-auto text-emerald-400 mb-3" />
            <h4 className="text-sm font-semibold text-slate-900 dark:text-white">All Caught Up!</h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              There are no pending claims in this review queue.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#162720]/40 text-slate-500 dark:text-slate-400 font-medium">
                  <th className="py-3.5 px-6">Claim #</th>
                  <th className="py-3.5 px-6">Applicant</th>
                  <th className="py-3.5 px-6">Category</th>
                  <th className="py-3.5 px-6">Expense Date</th>
                  <th className="py-3.5 px-6">Claimed</th>
                  <th className="py-3.5 px-6">Authorized</th>
                  <th className="py-3.5 px-6 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                {filteredClaims.map((claim) => {
                  const emp = claim.employeeId || {};
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

                  return (
                    <tr
                      key={claim._id}
                      className="hover:bg-slate-50/50 dark:hover:bg-[#162720]/30 transition"
                    >
                      {/* Claim Number */}
                      <td className="py-3.5 px-6 font-mono font-semibold uppercase tracking-wider text-slate-900 dark:text-white">
                        {claim.claimNumber}
                      </td>

                      {/* Rich Applicant Identity */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-3">
                          {emp.avatar ? (
                            <img
                              src={emp.avatar}
                              alt={applicantName}
                              className="w-9 h-9 rounded-full object-cover border border-emerald-500/20 shrink-0"
                            />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs flex items-center justify-center border border-emerald-500/20 shrink-0">
                              {initials}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="font-semibold text-slate-900 dark:text-white truncate">
                                {applicantName}
                              </span>
                              {empCode && (
                                <span className="font-mono text-[10px] font-semibold px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#162720] text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-[#1A3125]">
                                  {empCode}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-[#7E9E8F] flex items-center gap-1.5 truncate mt-0.5">
                              {designationTitle && <span>{designationTitle}</span>}
                              {designationTitle && departmentName && (
                                <span className="text-slate-300 dark:text-slate-600">•</span>
                              )}
                              {departmentName && (
                                <span className="text-[10px] font-medium px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                                  {departmentName}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category & Receipt Rule */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-slate-800 dark:text-slate-200">
                            {claim.categoryId?.name || 'General Expense'}
                          </span>
                          {claim.categoryId?.requiresReceipt && (
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                              <Check className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              Receipt
                            </span>
                          )}
                        </div>
                        {claim.categoryId?.code && (
                          <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
                            {claim.categoryId.code}
                          </span>
                        )}
                      </td>

                      {/* Expense Date */}
                      <td className="py-3.5 px-6 font-mono tabular-nums text-slate-600 dark:text-slate-400">
                        {new Date(claim.expenseDate).toLocaleDateString('en-PK', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </td>

                      {/* Claimed Amount */}
                      <td className="py-3.5 px-6 font-mono tabular-nums font-bold text-slate-900 dark:text-white">
                        PKR {(claim.amount / 100).toLocaleString('en-PK')}
                      </td>

                      {/* Authorized Amount */}
                      <td className="py-3.5 px-6 font-mono tabular-nums font-semibold text-emerald-600 dark:text-emerald-400">
                        {claim.approvedAmount
                          ? `PKR ${(claim.approvedAmount / 100).toLocaleString('en-PK')}`
                          : '—'}
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-6 text-right">
                        {activeTab === 'approved' ? (
                          claim.reimbursement?.method === 'payroll' ? (
                            <div className="inline-flex items-center gap-2">
                              <span className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 inline-flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                Queued for Payroll
                              </span>
                              <Can I="expense.reimburse" a="Expense">
                                <button
                                  onClick={() => handleOpenReimburse(claim)}
                                  className="px-2.5 py-1 rounded-lg text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#162720] border border-slate-200 dark:border-[#1A3125] transition cursor-pointer"
                                  title="Switch to direct bank transfer"
                                >
                                  Switch to Direct
                                </button>
                              </Can>
                            </div>
                          ) : (
                            <Can I="expense.reimburse" a="Expense">
                              <button
                                onClick={() => handleOpenReimburse(claim)}
                                className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
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
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 text-white shadow-sm transition inline-flex items-center gap-1.5 cursor-pointer"
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
