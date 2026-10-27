/**
 * @file LeaveTypeModal.jsx
 * @description Modal dialog for adding or editing company leave types.
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.1)
 * - Theme: ELVARA Emerald Design System (100% Light & Dark Mode Compatible)
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Shield, FileText, CheckCircle2 } from 'lucide-react';
import {
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation
} from '../leavesApi.js';
import { cn } from '../../../lib/utils.js';

export function LeaveTypeModal({ isOpen, onClose, leaveType }) {
  const isEditMode = Boolean(leaveType);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    daysPerYear: 14,
    isPaid: true,
    carryForwardMax: 0,
    requiresAttachment: false,
    minDaysForAttachment: 3,
    genderConstraint: 'any',
    isActive: true
  });

  const [errorMessage, setErrorMessage] = useState('');

  const [createLeaveType, { isLoading: isCreating }] = useCreateLeaveTypeMutation();
  const [updateLeaveType, { isLoading: isUpdating }] = useUpdateLeaveTypeMutation();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (leaveType) {
      setFormData({
        name: leaveType.name || '',
        code: leaveType.code || '',
        description: leaveType.description || '',
        daysPerYear: leaveType.daysPerYear ?? 14,
        isPaid: leaveType.isPaid ?? true,
        carryForwardMax: leaveType.carryForwardMax ?? 0,
        requiresAttachment: leaveType.requiresAttachment ?? false,
        minDaysForAttachment: leaveType.minDaysForAttachment ?? 3,
        genderConstraint: leaveType.genderConstraint || 'any',
        isActive: leaveType.isActive ?? true
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        daysPerYear: 14,
        isPaid: true,
        carryForwardMax: 0,
        requiresAttachment: false,
        minDaysForAttachment: 3,
        genderConstraint: 'any',
        isActive: true
      });
    }
    setErrorMessage('');
  }, [leaveType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    try {
      if (isEditMode) {
        await updateLeaveType({
          id: leaveType._id,
          ...formData,
          daysPerYear: Number(formData.daysPerYear),
          carryForwardMax: Number(formData.carryForwardMax),
          minDaysForAttachment: Number(formData.minDaysForAttachment)
        }).unwrap();
      } else {
        await createLeaveType({
          ...formData,
          daysPerYear: Number(formData.daysPerYear),
          carryForwardMax: Number(formData.carryForwardMax),
          minDaysForAttachment: Number(formData.minDaysForAttachment)
        }).unwrap();
      }
      onClose();
    } catch (err) {
      setErrorMessage(err?.data?.message || err?.message || 'Failed to save leave type');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden text-slate-900 dark:text-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/60 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
                {isEditMode ? 'Edit Leave Category Policy' : 'Create New Leave Category'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Configure annual quotas, carry-forward caps, and medical rules
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/60 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name & Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Leave Category Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Annual Leave"
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Unique Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. ANNUAL"
                className="w-full px-3.5 py-2.5 text-xs uppercase font-mono font-bold bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Policy Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Summary of terms, eligibility, and statutory purpose..."
              className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 resize-none transition-all"
            />
          </div>

          {/* Days Per Year & Carry Forward Max */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Annual Quota (Days) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={365}
                required
                value={formData.daysPerYear}
                onChange={(e) => setFormData({ ...formData, daysPerYear: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Max Carry-Forward (Days)
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.carryForwardMax}
                onChange={(e) => setFormData({ ...formData, carryForwardMax: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs font-semibold bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
              />
            </div>
          </div>

          {/* Gender Constraint & Paid Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Staff Eligibility
              </label>
              <select
                value={formData.genderConstraint}
                onChange={(e) => setFormData({ ...formData, genderConstraint: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all cursor-pointer"
              >
                <option value="any">Applicable to All Staff</option>
                <option value="female">Female Only (e.g. Maternity)</option>
                <option value="male">Male Only (e.g. Paternity)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2.5 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 cursor-pointer hover:border-emerald-500 transition-colors">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Paid Leave (No payroll deduction)
                </span>
              </label>
            </div>
          </div>

          {/* Medical Attachment Rules */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 rounded-2xl space-y-3">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresAttachment}
                onChange={(e) => setFormData({ ...formData, requiresAttachment: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                Enforce Medical Certificate / Proof Attachment
              </span>
            </label>

            {formData.requiresAttachment && (
              <div className="pl-6 pt-1 flex items-center gap-2">
                <label className="text-xs text-slate-500 dark:text-slate-400">
                  Enforce attachment if duration is &ge;
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.minDaysForAttachment}
                  onChange={(e) => setFormData({ ...formData, minDaysForAttachment: e.target.value })}
                  className="w-20 px-2.5 py-1 text-xs font-bold text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-xs text-slate-500 dark:text-slate-400">consecutive days</span>
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="pt-1">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                Active Category (Available in self-service leave application forms)
              </span>
            </label>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Policy' : 'Create Category'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LeaveTypeModal;
