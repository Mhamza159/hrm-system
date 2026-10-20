/**
 * @file SalaryFormModal.jsx
 * @description Modal dialog for assigning initial salary structures to employees.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.1)
 * - Integer Paisa Invariant: Frontend displays amounts in PKR (with decimals) and converts to integer paisa (PKR × 100) on submit.
 */

import React, { useState, useEffect } from 'react';
import { X, DollarSign, AlertCircle, Building2, Shield, Percent } from 'lucide-react';
import { useCreateSalaryStructureMutation } from '../payrollApi.js';
import { useGetEmployeesQuery } from '../../employees/employeesApi.js';

export function SalaryFormModal({ isOpen, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    employeeId: '',
    effectiveFrom: new Date().toISOString().split('T')[0],
    basicSalary: '',
    houseRentAllowance: '',
    medicalAllowance: '',
    conveyanceAllowance: '',
    otherAllowances: '',
    eobiEnabled: true,
    pessiEnabled: false,
    providentFundEnabled: false,
    providentFundRate: 0
  });

  const [errorMessage, setErrorMessage] = useState('');

  const { data: employeesData } = useGetEmployeesQuery(
    { status: 'Active', limit: 100 },
    { skip: !isOpen }
  );

  const employees = employeesData?.data?.items || employeesData?.data || [];

  const [createSalaryStructure, { isLoading }] = useCreateSalaryStructureMutation();

  useEffect(() => {
    if (isOpen) {
      setFormData({
        employeeId: '',
        effectiveFrom: new Date().toISOString().split('T')[0],
        basicSalary: '',
        houseRentAllowance: '',
        medicalAllowance: '',
        conveyanceAllowance: '',
        otherAllowances: '',
        eobiEnabled: true,
        pessiEnabled: false,
        providentFundEnabled: false,
        providentFundRate: 0
      });
      setErrorMessage('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // Live PKR Gross calculation
  const basic = parseFloat(formData.basicSalary) || 0;
  const houseRent = parseFloat(formData.houseRentAllowance) || 0;
  const medical = parseFloat(formData.medicalAllowance) || 0;
  const conveyance = parseFloat(formData.conveyanceAllowance) || 0;
  const other = parseFloat(formData.otherAllowances) || 0;
  const grossTotal = basic + houseRent + medical + conveyance + other;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.employeeId) {
      setErrorMessage('Please select an employee.');
      return;
    }

    if (basic <= 0) {
      setErrorMessage('Basic salary must be greater than zero.');
      return;
    }

    try {
      // Convert PKR to integer paisa (PKR × 100)
      const payload = {
        employeeId: formData.employeeId,
        effectiveFrom: formData.effectiveFrom,
        basicSalary: Math.round(basic * 100),
        houseRentAllowance: Math.round(houseRent * 100),
        medicalAllowance: Math.round(medical * 100),
        conveyanceAllowance: Math.round(conveyance * 100),
        otherAllowances: Math.round(other * 100),
        eobiEnabled: Boolean(formData.eobiEnabled),
        pessiEnabled: Boolean(formData.pessiEnabled),
        providentFundEnabled: Boolean(formData.providentFundEnabled),
        providentFundRate: parseFloat(formData.providentFundRate) || 0
      };

      await createSalaryStructure(payload).unwrap();
      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to assign salary structure.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Assign Salary Structure
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Setup base pay, monthly allowances, and statutory parameters in PKR
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

          {/* Employee & Effective Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Select Employee <span className="text-red-500">*</span>
              </label>
              <select
                required
                value={formData.employeeId}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              >
                <option value="">-- Choose Employee --</option>
                {employees.map((emp) => (
                  <option key={emp._id} value={emp._id}>
                    {emp.name} ({emp.employeeCode})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Effective Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                required
                value={formData.effectiveFrom}
                onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Salary Components Breakdown */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
              Monthly Salary Components (PKR)
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
                  placeholder="e.g. 100000"
                  value={formData.basicSalary}
                  onChange={(e) => setFormData({ ...formData, basicSalary: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
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
                  placeholder="e.g. 40000"
                  value={formData.houseRentAllowance}
                  onChange={(e) => setFormData({ ...formData, houseRentAllowance: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
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
                  placeholder="e.g. 10000"
                  value={formData.medicalAllowance}
                  onChange={(e) => setFormData({ ...formData, medicalAllowance: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
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
                  placeholder="e.g. 10000"
                  value={formData.conveyanceAllowance}
                  onChange={(e) => setFormData({ ...formData, conveyanceAllowance: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
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
                  placeholder="e.g. 0"
                  value={formData.otherAllowances}
                  onChange={(e) => setFormData({ ...formData, otherAllowances: e.target.value })}
                  className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-900 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Statutory Compliance Toggles */}
          <div className="border-t border-slate-200 dark:border-slate-800 pt-4 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Statutory Contributions
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.eobiEnabled}
                  onChange={(e) => setFormData({ ...formData, eobiEnabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  EOBI (1% Emp / 5% Empr)
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.pessiEnabled}
                  onChange={(e) => setFormData({ ...formData, pessiEnabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  PESSI (Social Security)
                </span>
              </label>

              <label className="flex items-center gap-2 p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-200 dark:border-slate-700 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.providentFundEnabled}
                  onChange={(e) => setFormData({ ...formData, providentFundEnabled: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                />
                <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
                  Provident Fund
                </span>
              </label>
            </div>

            {formData.providentFundEnabled && (
              <div className="mt-2 p-3 bg-emerald-50 dark:bg-emerald-950/20 rounded-lg border border-emerald-200 dark:border-emerald-800/50">
                <label className="block text-xs font-semibold text-emerald-900 dark:text-emerald-300 mb-1">
                  Provident Fund Contribution Rate (%)
                </label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={formData.providentFundRate}
                  onChange={(e) => setFormData({ ...formData, providentFundRate: e.target.value })}
                  className="w-32 px-3 py-1.5 text-sm bg-white dark:bg-slate-800 border border-emerald-300 dark:border-emerald-700 rounded-lg text-slate-900 dark:text-white"
                />
              </div>
            )}
          </div>

          {/* Live Gross Pay Summary Card */}
          <div className="p-4 bg-emerald-50/80 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-medium text-emerald-800 dark:text-emerald-300">
                Calculated Gross Monthly Salary
              </span>
              <p className="text-2xl font-black text-emerald-700 dark:text-emerald-400">
                PKR {grossTotal.toLocaleString('en-PK', { minimumFractionDigits: 2 })}
              </p>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400 bg-white/70 dark:bg-slate-800/70 px-2.5 py-1 rounded-md border border-slate-200 dark:border-slate-700 font-mono">
              {(Math.round(grossTotal * 100)).toLocaleString()} paisa
            </span>
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
              className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm disabled:opacity-50"
            >
              {isLoading ? 'Saving...' : 'Assign Structure'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
