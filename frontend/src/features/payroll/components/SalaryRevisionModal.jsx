/**
 * @file SalaryRevisionModal.jsx
 * @description Modal dialog for incrementing or revising existing employee salary structures.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.2)
 * - Audit Trail: Requires mandatory revision reason and effective date for mid-cycle increments.
 */

import React, { useState, useEffect } from 'react';
import { X, TrendingUp, AlertCircle, Calendar, FileText } from 'lucide-react';
import { useReviseSalaryStructureMutation } from '../payrollApi.js';

export function SalaryRevisionModal({ isOpen, onClose, currentStructure, onSuccess }) {
  const [formData, setFormData] = useState({
    effectiveFrom: new Date().toISOString().split('T')[0],
    basicSalary: '',
    houseRentAllowance: '',
    medicalAllowance: '',
    conveyanceAllowance: '',
    otherAllowances: '',
    eobiEnabled: true,
    pessiEnabled: false,
    providentFundEnabled: false,
    providentFundRate: 0,
    revisionReason: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [reviseSalaryStructure, { isLoading }] = useReviseSalaryStructureMutation();

  useEffect(() => {
    if (currentStructure && isOpen) {
      // Current values in integer paisa, convert to PKR for form inputs
      const basic = (currentStructure.basicSalary || 0) / 100;
      const houseRent = (currentStructure.houseRentAllowance || 0) / 100;
      const medical = (currentStructure.medicalAllowance || 0) / 100;
      const conveyance = (currentStructure.conveyanceAllowance || 0) / 100;
      const other = (currentStructure.otherAllowances || 0) / 100;

      setFormData({
        effectiveFrom: new Date().toISOString().split('T')[0],
        basicSalary: basic.toString(),
        houseRentAllowance: houseRent.toString(),
        medicalAllowance: medical.toString(),
        conveyanceAllowance: conveyance.toString(),
        otherAllowances: other.toString(),
        eobiEnabled: currentStructure.eobiEnabled ?? true,
        pessiEnabled: currentStructure.pessiEnabled ?? false,
        providentFundEnabled: currentStructure.providentFundEnabled ?? false,
        providentFundRate: currentStructure.providentFundRate || 0,
        revisionReason: ''
      });
      setErrorMessage('');
    }
  }, [currentStructure, isOpen]);

  if (!isOpen || !currentStructure) return null;

  const previousGrossPkr = (currentStructure.grossSalary || 0) / 100;

  // New live PKR Gross
  const newBasic = parseFloat(formData.basicSalary) || 0;
  const newHouseRent = parseFloat(formData.houseRentAllowance) || 0;
  const newMedical = parseFloat(formData.medicalAllowance) || 0;
  const newConveyance = parseFloat(formData.conveyanceAllowance) || 0;
  const newOther = parseFloat(formData.otherAllowances) || 0;
  const newGrossTotal = newBasic + newHouseRent + newMedical + newConveyance + newOther;

  const deltaPkr = newGrossTotal - previousGrossPkr;
  const percentageDelta = previousGrossPkr > 0 ? ((deltaPkr / previousGrossPkr) * 100).toFixed(1) : 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (newBasic <= 0) {
      setErrorMessage('Basic salary must be greater than zero.');
      return;
    }

    if (!formData.revisionReason.trim()) {
      setErrorMessage('Audit justification reason is required for salary revision.');
      return;
    }

    try {
      const payload = {
        employeeId: currentStructure.employeeId?._id || currentStructure.employeeId,
        effectiveFrom: formData.effectiveFrom,
        basicSalary: Math.round(newBasic * 100),
        houseRentAllowance: Math.round(newHouseRent * 100),
        medicalAllowance: Math.round(newMedical * 100),
        conveyanceAllowance: Math.round(newConveyance * 100),
        otherAllowances: Math.round(newOther * 100),
        eobiEnabled: Boolean(formData.eobiEnabled),
        pessiEnabled: Boolean(formData.pessiEnabled),
        providentFundEnabled: Boolean(formData.providentFundEnabled),
        providentFundRate: parseFloat(formData.providentFundRate) || 0,
        revisionReason: formData.revisionReason.trim()
      };

      await reviseSalaryStructure(payload).unwrap();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to revise salary structure.');
    }
  };

  const empName = currentStructure.employeeId?.name || 'Employee';
  const empCode = currentStructure.employeeId?.employeeCode || '';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white dark:bg-[#111D17] rounded-3xl shadow-2xl border border-slate-200/80 dark:border-[#1A3125] overflow-hidden flex flex-col max-h-[90vh] my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200/80 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1A14] shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] rounded-2xl border border-emerald-200/60 dark:border-emerald-800/40 shadow-xs">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                Revise Salary: {empName} ({empCode})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Record annual increment, promotion, or compensation adjustment
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 sm:p-7 space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-800 rounded-xl flex items-center gap-2.5 text-xs text-rose-600 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current vs New Comparison Banner */}
          <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50/70 dark:bg-[#0E1A14] rounded-2xl border border-slate-200/80 dark:border-[#1A3125] text-center">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Current Gross
              </span>
              <p className="text-base font-bold font-mono text-slate-800 dark:text-slate-200 tabular-nums mt-0.5">
                PKR {previousGrossPkr.toLocaleString('en-PK')}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                New Gross
              </span>
              <p className="text-base font-bold font-mono text-[#00C471] dark:text-[#05D87D] tabular-nums mt-0.5">
                PKR {newGrossTotal.toLocaleString('en-PK')}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Delta
              </span>
              <p
                className={`text-base font-bold font-mono tabular-nums mt-0.5 ${
                  deltaPkr >= 0
                    ? 'text-emerald-700 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}
              >
                {deltaPkr >= 0 ? '+' : ''}
                {percentageDelta}% (PKR {deltaPkr.toLocaleString('en-PK')})
              </p>
            </div>
          </div>

          {/* Effective Date & Revision Reason */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Effective From Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                className="w-full h-10 px-3.5 text-xs bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] text-slate-900 dark:text-white shadow-2xs transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Revision Justification <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Merit Increment, Promotion"
                value={formData.revisionReason}
                onChange={(e) => setFormData({ ...formData, revisionReason: e.target.value })}
                className="w-full h-10 px-3.5 text-xs bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] text-slate-900 dark:text-white placeholder:text-slate-400 shadow-2xs transition-all"
              />
            </div>
          </div>

          {/* Salary Components Breakdown */}
          <div className="border-t border-slate-200/80 dark:border-[#1A3125] pt-5">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3.5">
              Revised Monthly Components (PKR)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Basic Salary (PKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  className="w-full h-10 px-3.5 text-xs font-mono font-medium bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] text-slate-900 dark:text-white shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  House Rent Allowance (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.houseRentAllowance}
                  onChange={(e) => setFormData({ ...formData, houseRentAllowance: e.target.value })}
                  className="w-full h-10 px-3.5 text-xs font-mono font-medium bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] text-slate-900 dark:text-white shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Medical Allowance (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.medicalAllowance}
                  onChange={(e) => setFormData({ ...formData, medicalAllowance: e.target.value })}
                  className="w-full h-10 px-3.5 text-xs font-mono font-medium bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] text-slate-900 dark:text-white shadow-2xs transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Conveyance Allowance (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.conveyanceAllowance}
                  onChange={(e) => setFormData({ ...formData, conveyanceAllowance: e.target.value })}
                  className="w-full h-10 px-3.5 text-xs font-mono font-medium bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] text-slate-900 dark:text-white shadow-2xs transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                  Other Special Allowances (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.otherAllowances}
                  onChange={(e) => setFormData({ ...formData, otherAllowances: e.target.value })}
                  className="w-full h-10 px-3.5 text-xs font-mono font-medium bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] text-slate-900 dark:text-white shadow-2xs transition-all"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-5 border-t border-slate-200/80 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="h-9 px-4 text-xs font-semibold text-slate-700 dark:text-slate-300 bg-white dark:bg-[#15231C] border border-slate-200/80 dark:border-[#1A3125] rounded-xl hover:bg-slate-50 dark:hover:bg-[#1A3125] shadow-xs cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="h-9 px-5 inline-flex items-center gap-2 bg-[#00C471] hover:bg-[#049856] text-white rounded-xl text-xs font-semibold shadow-xs shadow-emerald-600/20 active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
            >
              {isLoading ? 'Saving Revision...' : 'Confirm Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
