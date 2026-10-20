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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-lg">
              <TrendingUp className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Revise Salary: {empName} ({empCode})
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Record annual increment, promotion, or compensation adjustment
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto p-6 space-y-5">
          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current vs New Comparison Banner */}
          <div className="grid grid-cols-3 gap-3 p-3.5 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Current Gross
              </span>
              <p className="text-base font-bold text-slate-800 dark:text-slate-200">
                PKR {previousGrossPkr.toLocaleString('en-PK')}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                New Gross
              </span>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                PKR {newGrossTotal.toLocaleString('en-PK')}
              </p>
            </div>
            <div>
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Delta
              </span>
              <p
                className={`text-base font-bold ${
                  deltaPkr >= 0
                    ? 'text-emerald-600 dark:text-emerald-400'
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
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Effective From Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Revision Justification <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Annual Merit Increment, Promotion"
                value={formData.revisionReason}
                onChange={(e) => setFormData({ ...formData, revisionReason: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Salary Components Breakdown */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Revised Monthly Components (PKR)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Basic Salary (PKR) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  required
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  House Rent Allowance (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.houseRentAllowance}
                  onChange={(e) => setFormData({ ...formData, houseRentAllowance: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Medical Allowance (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.medicalAllowance}
                  onChange={(e) => setFormData({ ...formData, medicalAllowance: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Conveyance Allowance (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.conveyanceAllowance}
                  onChange={(e) => setFormData({ ...formData, conveyanceAllowance: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Other Special Allowances (PKR)
                </label>
                <input
                  type="number"
                  min="0"
                  step="any"
                  value={formData.otherAllowances}
                  onChange={(e) => setFormData({ ...formData, otherAllowances: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Saving Revision...' : 'Confirm Revision'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
