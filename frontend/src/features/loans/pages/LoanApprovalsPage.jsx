/**
 * @file LoanApprovalsPage.jsx
 * @description Multi-Tier Borrowing Approval Queue for Department Managers, HR, and Super Admin.
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.3)
 * - Layer: Frontend Feature Page
 * - Theme: Forest & Emerald Design System
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Clock,
  Filter,
  User,
  DollarSign,
  ChevronRight,
  ShieldCheck,
  Send,
  Eye
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';
import { useGetLoansQuery } from '../loansApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { LoanDecisionModal } from '../components/LoanDecisionModal.jsx';
import { LoanScheduleDrawer } from '../components/LoanScheduleDrawer.jsx';

export function LoanApprovalsPage() {
  const { isSuperAdmin, isHR } = useAuth();
  const [activeTab, setActiveTab] = useState('pending_me');
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [scheduleLoanId, setScheduleLoanId] = useState(null);

  const { data: loansRes, isLoading, refetch } = useGetLoansQuery({ page: 1, limit: 100 });
  const loans = loansRes?.data || [];

  // Filter queue based on active tab
  const filteredLoans = loans.filter((loan) => {
    if (activeTab === 'pending_me') {
      if (isSuperAdmin) return loan.status === 'pending_admin';
      if (isHR) return loan.status === 'pending_hr';
      // Department Manager default
      return loan.status === 'pending_recommendation';
    }
    if (activeTab === 'all_pending') {
      return ['pending_recommendation', 'pending_hr', 'pending_admin'].includes(loan.status);
    }
    if (activeTab === 'approved') {
      return ['approved', 'active'].includes(loan.status);
    }
    if (activeTab === 'rejected') {
      return loan.status === 'rejected';
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Borrowing Approval Queue"
        description="Multi-tier review, recommendations, and executive disbursement authorizations."
      />

      {/* Tabs */}
      <div className="flex border-b border-slate-200 dark:border-slate-800 space-x-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab('pending_me')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'pending_me'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          Pending My Action
        </button>
        <button
          onClick={() => setActiveTab('all_pending')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'all_pending'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <Filter className="w-3.5 h-3.5" />
          All In-Flight Requests
        </button>
        <button
          onClick={() => setActiveTab('approved')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'approved'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Active / Disbursed
        </button>
        <button
          onClick={() => setActiveTab('rejected')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'rejected'
              ? 'border-emerald-600 text-emerald-600 dark:border-emerald-400 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-slate-200'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          Declined
        </button>
      </div>

      {/* Main Approval List */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs text-slate-400 animate-pulse">
            Loading approval queue...
          </div>
        ) : filteredLoans.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <ShieldCheck className="mx-auto w-10 h-10 text-slate-300 dark:text-slate-700" />
            <p className="text-sm font-semibold text-slate-900 dark:text-white">
              Queue is clear
            </p>
            <p className="text-xs text-slate-500">
              No borrowing applications are awaiting decision under this view.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredLoans.map((loan) => {
              const amountPkr = (loan.amount || 0) / 100;
              const installmentPkr = (loan.monthlyInstallment || 0) / 100;
              const emp = loan.employeeId;
              const empName = emp?.user?.name || `${emp?.firstName || ''} ${emp?.lastName || ''}`.trim() || 'Employee';

              const canTakeAction =
                (loan.status === 'pending_recommendation' && !isSuperAdmin && !isHR) ||
                (loan.status === 'pending_hr' && (isHR || isSuperAdmin)) ||
                (loan.status === 'pending_admin' && isSuperAdmin);

              return (
                <div
                  key={loan._id}
                  className="p-5 hover:bg-slate-50/60 dark:hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5 min-w-[240px]">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
                        {loan.loanId}
                      </span>
                      <span className="uppercase text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {loan.type}
                      </span>
                      <StatusBadge status={loan.status} />
                    </div>
                    <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      <span>{empName}</span>
                      {emp?.departmentId?.name && (
                        <span className="text-[11px] text-slate-400 font-normal">
                          ({emp.departmentId.name})
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 italic line-clamp-1">
                      "{loan.reason}"
                    </div>
                  </div>

                  {/* Financial Details */}
                  <div className="grid grid-cols-2 gap-6 text-xs">
                    <div>
                      <span className="block text-slate-400 text-[10px]">Requested Principal</span>
                      <span className="font-bold text-slate-900 dark:text-slate-100">
                        PKR {amountPkr.toLocaleString()}
                      </span>
                    </div>
                    <div>
                      <span className="block text-slate-400 text-[10px]">Tenure & Deductions</span>
                      <span className="font-medium text-slate-700 dark:text-slate-300">
                        {loan.repaymentTenureMonths} mo @ PKR {installmentPkr.toLocaleString()}/mo
                      </span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2.5 justify-end">
                    <button
                      onClick={() => setScheduleLoanId(loan._id)}
                      className="px-3 py-1.5 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center gap-1 font-medium"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Schedule</span>
                    </button>

                    {['pending_recommendation', 'pending_hr', 'pending_admin'].includes(loan.status) && (
                      <button
                        onClick={() => setSelectedLoan(loan)}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs shadow-emerald-500/20 transition-all flex items-center gap-1.5"
                      >
                        <span>Review</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Review & Decision Modal */}
      <LoanDecisionModal
        isOpen={Boolean(selectedLoan)}
        loan={selectedLoan}
        onClose={() => {
          setSelectedLoan(null);
          refetch();
        }}
      />

      {/* Schedule Drawer */}
      <LoanScheduleDrawer
        loanId={scheduleLoanId}
        onClose={() => setScheduleLoanId(null)}
      />
    </div>
  );
}

export default LoanApprovalsPage;
