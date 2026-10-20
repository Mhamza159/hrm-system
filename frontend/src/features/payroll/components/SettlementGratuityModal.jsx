/**
 * @file SettlementGratuityModal.jsx
 * @description Modal for calculating and finalizing employee exit settlements and statutory gratuity.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.13)
 * - Layer: Component (React 18 / Tailwind)
 * - Formula: Pro-rated salary + Leave encashment + Service gratuity - Loan/Advance obligations.
 */

import React, { useState } from 'react';
import {
  X,
  UserX,
  Calendar,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  TrendingUp,
  FileCheck2,
  ShieldAlert
} from 'lucide-react';
import { useProcessFinalSettlementMutation } from '../payrollApi.js';

export function SettlementGratuityModal({ isOpen, onClose, employee, activeSalary, onSuccess }) {
  const [formData, setFormData] = useState({
    exitDate: new Date().toISOString().split('T')[0],
    payableDays: 30,
    encashableLeaveDays: 0,
    loanDeduction: 0,
    advanceDeduction: 0,
    separationType: 'Resigned',
    reason: 'Voluntary Resignation'
  });

  const [errorMsg, setErrorMsg] = useState('');
  const [processFinalSettlement, { isLoading }] = useProcessFinalSettlementMutation();

  if (!isOpen || !employee) return null;

  const baseSalaryPaisa = activeSalary?.baseSalary || 0;
  const baseSalaryPkr = baseSalaryPaisa / 100;

  // Calculate completed years of service
  const joiningDate = employee.joiningDate || employee.dateOfJoining ? new Date(employee.joiningDate || employee.dateOfJoining) : new Date('2023-01-01');
  const exitDate = new Date(formData.exitDate);
  const diffMs = exitDate - joiningDate;
  const completedYears = Math.max(0, Math.floor(diffMs / (365.25 * 24 * 60 * 60 * 1000)));

  // Real-time calculations in PKR
  const proRatedSalaryPkr = Math.round((baseSalaryPkr / 30) * (Number(formData.payableDays) || 0));
  const leaveEncashmentPkr = Math.round((baseSalaryPkr / 30) * (Number(formData.encashableLeaveDays) || 0));
  const gratuityPkr = completedYears >= 1 ? baseSalaryPkr * completedYears : 0;

  const totalGrossSettlementPkr = proRatedSalaryPkr + leaveEncashmentPkr + gratuityPkr;
  const totalDeductionsPkr = (Number(formData.loanDeduction) || 0) + (Number(formData.advanceDeduction) || 0);
  const netSettlementPkr = Math.max(0, totalGrossSettlementPkr - totalDeductionsPkr);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      await processFinalSettlement({
        employeeId: employee._id,
        exitDate: formData.exitDate,
        payableDays: Number(formData.payableDays),
        encashableLeaveDays: Number(formData.encashableLeaveDays),
        loanDeduction: Number(formData.loanDeduction),
        advanceDeduction: Number(formData.advanceDeduction),
        separationType: formData.separationType,
        reason: formData.reason
      }).unwrap();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMsg(err?.data?.message || err?.message || 'Failed to process final exit settlement');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl relative my-8 space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-2xl">
              <UserX className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Final Exit Settlement & Gratuity
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {employee.name || `${employee.firstName} ${employee.lastName}`} ({employee.employeeCode || employee.employeeId})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl flex items-start gap-2.5 text-xs text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Real-time Calculation Breakdown Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/40 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 text-xs">
          <div>
            <p className="text-slate-400">Completed Service:</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm">
              {completedYears} {completedYears === 1 ? 'Year' : 'Years'}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Monthly Basic:</p>
            <p className="font-bold text-slate-900 dark:text-white text-sm font-mono">
              PKR {baseSalaryPkr.toLocaleString('en-PK')}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Statutory Gratuity:</p>
            <p className="font-bold text-emerald-600 dark:text-emerald-400 text-sm font-mono">
              PKR {gratuityPkr.toLocaleString('en-PK')}
            </p>
          </div>
          <div>
            <p className="text-slate-400">Net Final Payout:</p>
            <p className="font-black text-emerald-600 dark:text-emerald-400 text-base font-mono">
              PKR {netSettlementPkr.toLocaleString('en-PK')}
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Separation Date
              </label>
              <input
                type="date"
                required
                value={formData.exitDate}
                onChange={(e) => setFormData({ ...formData, exitDate: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Separation Type
              </label>
              <select
                value={formData.separationType}
                onChange={(e) => setFormData({ ...formData, separationType: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Resigned">Voluntary Resignation</option>
                <option value="Terminated">Involuntary Termination / Exit</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Payable Days in Exit Month (0-30)
              </label>
              <input
                type="number"
                min="0"
                max="30"
                value={formData.payableDays}
                onChange={(e) => setFormData({ ...formData, payableDays: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Unutilized Leaves Encashable (Days)
              </label>
              <input
                type="number"
                min="0"
                value={formData.encashableLeaveDays}
                onChange={(e) => setFormData({ ...formData, encashableLeaveDays: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Outstanding Loan Recovery (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={formData.loanDeduction}
                onChange={(e) => setFormData({ ...formData, loanDeduction: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Salary Advance Deduction (PKR)
              </label>
              <input
                type="number"
                min="0"
                value={formData.advanceDeduction}
                onChange={(e) => setFormData({ ...formData, advanceDeduction: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Clearance Remarks / Justification
            </label>
            <textarea
              rows="2"
              value={formData.reason}
              onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-2 px-5 py-2 text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 disabled:opacity-50 rounded-xl shadow-sm transition-colors"
            >
              <FileCheck2 className="w-4 h-4" />
              {isLoading ? 'Processing Settlement...' : 'Finalize Exit Settlement'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
