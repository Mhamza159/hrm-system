/**
 * @file LoanScheduleDrawer.jsx
 * @description Slide-out drawer displaying itemized installment repayment schedule for a loan.
 * 
 * SPECIFICATION:
 * - Module: M10 Loans & Advances (BUILD-GUIDE Section 15 · Row 10.4)
 * - Layer: Component
 * - Invariant: Integer paisa amounts converted cleanly to PKR (/ 100).
 */

import React from 'react';
import { X, Calendar, CheckCircle2, Clock, AlertCircle, DollarSign, ArrowRight } from 'lucide-react';
import { useGetLoanScheduleQuery, useGetLoanByIdQuery } from '../loansApi.js';
import { StatusBadge } from '../../../components/common/StatusBadge.jsx';

export function LoanScheduleDrawer({ loanId, onClose, onPrepayClick }) {
  const { data: scheduleRes, isLoading: isLoadingSchedule } = useGetLoanScheduleQuery(loanId, {
    skip: !loanId
  });
  const { data: loanRes, isLoading: isLoadingLoan } = useGetLoanByIdQuery(loanId, {
    skip: !loanId
  });

  if (!loanId) return null;

  const loan = loanRes?.data;
  const schedule = scheduleRes?.data || [];

  const amountPkr = loan ? loan.amount / 100 : 0;
  const repaidPkr = loan ? (loan.totalRepaid || 0) / 100 : 0;
  const remainingPkr = loan ? (loan.remainingBalance || 0) / 100 : 0;
  const progressPct = loan && loan.amount > 0 ? Math.min(100, Math.round((loan.totalRepaid / loan.amount) * 100)) : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Repayment Schedule
              </h3>
              {loan && <StatusBadge status={loan.status} />}
            </div>
            <p className="text-xs text-slate-500 font-mono mt-0.5">
              {loan?.loanId} • {loan?.type?.toUpperCase()}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Financial KPI Summary */}
        <div className="p-5 bg-emerald-50/40 dark:bg-emerald-950/20 border-b border-emerald-100 dark:border-emerald-900/30">
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Principal</span>
              <div className="text-xs font-bold text-slate-900 dark:text-white mt-0.5">
                PKR {amountPkr.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Total Repaid</span>
              <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                PKR {repaidPkr.toLocaleString()}
              </div>
            </div>
            <div className="p-2.5 bg-white dark:bg-slate-900 rounded-xl border border-emerald-100 dark:border-emerald-900/40 shadow-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400">Remaining</span>
              <div className="text-xs font-bold text-rose-600 dark:text-rose-400 mt-0.5">
                PKR {remainingPkr.toLocaleString()}
              </div>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4 space-y-1">
            <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
              <span>Amortization Progress</span>
              <span>{progressPct}% Settled</span>
            </div>
            <div className="w-full bg-slate-200 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressPct}%` }}
              />
            </div>
          </div>
        </div>

        {/* Installment Table Body */}
        <div className="flex-1 overflow-y-auto p-5">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Installment Timeline ({schedule.length} Months)
          </h4>

          {isLoadingSchedule ? (
            <div className="py-8 text-center text-xs text-slate-400 animate-pulse">
              Loading amortization schedule...
            </div>
          ) : schedule.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400">
              No installment schedule generated yet.
            </div>
          ) : (
            <div className="space-y-2.5">
              {schedule.map((inst) => {
                const instAmountPkr = inst.amount / 100;
                const isDeducted = inst.status === 'deducted';
                const isPrepaid = inst.status === 'prepaid';
                const isSettled = isDeducted || isPrepaid;

                return (
                  <div
                    key={inst._id || inst.installmentNumber}
                    className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-slate-200 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center space-x-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold ${
                          isSettled
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                            : 'bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {inst.installmentNumber}
                      </div>
                      <div>
                        <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{inst.dueMonth}</span>
                        </div>
                        <div className="text-[11px] text-slate-400">
                          {inst.paidAt ? `Paid on ${new Date(inst.paidAt).toLocaleDateString()}` : 'Scheduled payroll deduction'}
                        </div>
                      </div>
                    </div>

                    <div className="text-right space-y-1">
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        PKR {instAmountPkr.toLocaleString()}
                      </div>
                      <StatusBadge status={inst.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {loan?.status === 'active' && onPrepayClick && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Settle remaining balance early
            </span>
            <button
              onClick={() => {
                onClose();
                onPrepayClick(loan);
              }}
              className="px-4 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/60 hover:bg-emerald-200 rounded-xl transition-colors flex items-center gap-1.5"
            >
              <span>Record Prepayment</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default LoanScheduleDrawer;
