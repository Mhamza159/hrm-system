/**
 * @file PayslipAdjustmentDrawer.jsx
 * @description Slide-over drawer for manual line-item adjustments on draft payslips.
 * 
 * SPECIFICATION:
 * - Module: M9 Payroll (BUILD-GUIDE Section 12 · Row 9.9)
 * - Layer: Component (React 18 / Tailwind)
 * - Atomic recalculation: Gross pay, progressive tax withholding, and parent run totals update atomically.
 */

import React, { useState } from 'react';
import { X, Plus, AlertCircle, DollarSign, Tag, FileText } from 'lucide-react';
import { useAdjustPayslipMutation } from '../payrollApi.js';

export function PayslipAdjustmentDrawer({ isOpen, onClose, payslip, runId, onSuccess }) {
  const [formData, setFormData] = useState({
    type: 'earning', // 'earning' | 'deduction'
    name: '',
    category: 'bonus',
    amount: '',
    description: ''
  });

  const [errorMessage, setErrorMessage] = useState('');
  const [adjustPayslip, { isLoading }] = useAdjustPayslipMutation();

  if (!isOpen || !payslip) return null;

  const earningCategories = [
    { value: 'bonus', label: 'Festival / Performance Bonus' },
    { value: 'arrears', label: 'Salary Arrears' },
    { value: 'allowance', label: 'Special Project Allowance' },
    { value: 'overtime', label: 'Manual Overtime Adjustment' }
  ];

  const deductionCategories = [
    { value: 'advance', label: 'Salary Advance Recovery' },
    { value: 'loan_installment', label: 'Manual Loan Deduction' },
    { value: 'late_penalty', label: 'Late Punch Penalty Adjustment' },
    { value: 'manual', label: 'Other Operational Deduction' }
  ];

  const categories = formData.type === 'earning' ? earningCategories : deductionCategories;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const pkrAmount = parseFloat(formData.amount);
    if (!pkrAmount || pkrAmount <= 0) {
      setErrorMessage('Amount must be greater than zero.');
      return;
    }

    if (!formData.name.trim()) {
      setErrorMessage('Line item title is required.');
      return;
    }

    try {
      await adjustPayslip({
        runId,
        slipId: payslip._id,
        type: formData.type,
        name: formData.name.trim(),
        category: formData.category,
        amount: Math.round(pkrAmount * 100), // Convert PKR to integer paisa
        description: formData.description.trim()
      }).unwrap();

      if (onSuccess) onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to adjust payslip.');
    }
  };

  const empName = payslip.employeeId?.name || 'Employee';
  const empCode = payslip.employeeId?.employeeCode || '';
  const currentGross = (payslip.grossPay || 0) / 100;
  const currentNet = (payslip.netPay || 0) / 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg h-full bg-white dark:bg-slate-900 shadow-2xl p-6 overflow-y-auto border-l border-slate-200 dark:border-slate-800 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                Adjust Payslip: {empName}
              </h2>
              <p className="text-xs text-slate-500 font-mono">
                {empCode} • Current Net Pay: PKR {currentNet.toLocaleString('en-PK')}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {errorMessage && (
            <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-2.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Current Breakdown Card */}
          <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
            <div>
              <span className="text-xs text-slate-500">Gross Monthly Pay</span>
              <p className="text-sm font-bold font-mono text-slate-900 dark:text-white">
                PKR {currentGross.toLocaleString('en-PK')}
              </p>
            </div>
            <div>
              <span className="text-xs text-slate-500">Net Take-Home Pay</span>
              <p className="text-sm font-bold font-mono text-emerald-600 dark:text-emerald-400">
                PKR {currentNet.toLocaleString('en-PK')}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Type Toggle */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Adjustment Type <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'earning', category: 'bonus' })}
                  className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                    formData.type === 'earning'
                      ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-500 text-emerald-700 dark:text-emerald-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  + Add Earning
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, type: 'deduction', category: 'advance' })}
                  className={`py-2 text-sm font-semibold rounded-lg border transition-all ${
                    formData.type === 'deduction'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-500 text-rose-700 dark:text-rose-300'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-600'
                  }`}
                >
                  − Add Deduction
                </button>
              </div>
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Line Item Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Line Item Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Eid Festival Bonus, Device Recovery"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Amount */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Amount (PKR) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min="0"
                step="any"
                required
                placeholder="e.g. 25000"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Justification / Note
              </label>
              <textarea
                rows="2"
                placeholder="Mandatory context for payroll audit trail..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isLoading}
                className="px-4 py-2 text-sm text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-5 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg disabled:opacity-50"
              >
                {isLoading ? 'Saving...' : 'Apply Adjustment'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
