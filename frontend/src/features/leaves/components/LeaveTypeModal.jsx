/**
 * @file LeaveTypeModal.jsx
 * @description Modal dialog for adding or editing company leave types.
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays (BUILD-GUIDE Section 11 · Row 6.1)
 */

import React, { useState, useEffect } from 'react';
import { X, Calendar, AlertCircle, Shield, FileText } from 'lucide-react';
import {
  useCreateLeaveTypeMutation,
  useUpdateLeaveTypeMutation
} from '../leavesApi.js';

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0F111A] border border-[#1E2235] rounded-xl shadow-2xl overflow-hidden text-slate-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1E2235] bg-[#141724]">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#5E6AD2]" />
            <h2 className="text-lg font-semibold text-white">
              {isEditMode ? 'Edit Leave Type' : 'Create New Leave Type'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {errorMessage && (
            <div className="flex items-center gap-2 p-3 text-sm text-red-400 bg-red-950/40 border border-red-800/50 rounded-lg">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Name & Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Annual Leave"
                className="w-full px-3 py-2 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#5E6AD2]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Code <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. ANNUAL"
                className="w-full px-3 py-2 text-sm uppercase bg-[#161926] border border-[#262B40] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#5E6AD2]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Description
            </label>
            <textarea
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Short description of this leave category..."
              className="w-full px-3 py-2 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-[#5E6AD2]"
            />
          </div>

          {/* Days Per Year & Carry Forward Max */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Days Per Year <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                min={0}
                max={365}
                required
                value={formData.daysPerYear}
                onChange={(e) => setFormData({ ...formData, daysPerYear: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white focus:outline-none focus:border-[#5E6AD2]"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Carry Forward Max Days
              </label>
              <input
                type="number"
                min={0}
                max={100}
                value={formData.carryForwardMax}
                onChange={(e) => setFormData({ ...formData, carryForwardMax: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white focus:outline-none focus:border-[#5E6AD2]"
              />
            </div>
          </div>

          {/* Gender Constraint & Paid Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">
                Gender Restriction
              </label>
              <select
                value={formData.genderConstraint}
                onChange={(e) => setFormData({ ...formData, genderConstraint: e.target.value })}
                className="w-full px-3 py-2 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white focus:outline-none focus:border-[#5E6AD2]"
              >
                <option value="any">Applicable to All</option>
                <option value="female">Female Only (e.g. Maternity)</option>
                <option value="male">Male Only (e.g. Paternity)</option>
              </select>
            </div>

            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer pt-2">
                <input
                  type="checkbox"
                  checked={formData.isPaid}
                  onChange={(e) => setFormData({ ...formData, isPaid: e.target.checked })}
                  className="w-4 h-4 rounded border-[#262B40] bg-[#161926] text-[#5E6AD2] focus:ring-[#5E6AD2]"
                />
                <span className="text-sm font-medium text-slate-300">Paid Leave (No salary deduction)</span>
              </label>
            </div>
          </div>

          {/* Medical Attachment Rules */}
          <div className="p-3 bg-[#141724] border border-[#262B40] rounded-lg space-y-3">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.requiresAttachment}
                onChange={(e) => setFormData({ ...formData, requiresAttachment: e.target.checked })}
                className="w-4 h-4 rounded border-[#262B40] bg-[#161926] text-[#5E6AD2] focus:ring-[#5E6AD2]"
              />
              <span className="text-sm font-medium text-slate-200">
                Requires Medical Certificate / Proof Attachment
              </span>
            </label>

            {formData.requiresAttachment && (
              <div className="pl-6">
                <label className="block text-xs font-medium text-slate-400 mb-1">
                  Enforce attachment if leave duration is at least (days):
                </label>
                <input
                  type="number"
                  min={1}
                  max={30}
                  value={formData.minDaysForAttachment}
                  onChange={(e) => setFormData({ ...formData, minDaysForAttachment: e.target.value })}
                  className="w-24 px-3 py-1 text-sm bg-[#161926] border border-[#262B40] rounded-lg text-white focus:outline-none focus:border-[#5E6AD2]"
                />
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded border-[#262B40] bg-[#161926] text-[#5E6AD2] focus:ring-[#5E6AD2]"
            />
            <span className="text-sm text-slate-300">Active (Visible in leave application dropdowns)</span>
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#1E2235]">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-400 hover:text-white bg-slate-800/40 hover:bg-slate-800 rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-sm font-medium text-white bg-[#5E6AD2] hover:bg-[#4E59BD] rounded-lg transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : isEditMode ? 'Update Leave Type' : 'Create Leave Type'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
