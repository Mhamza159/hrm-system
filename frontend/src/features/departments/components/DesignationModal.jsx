/**
 * @file DesignationModal.jsx
 * @description Modern, accessible modal dialog for creating and editing corporate job designations.
 * Features auto-capitalized code formatting, department association with archival safeguards,
 * visual grade tier selection across the 5 canonical tiers, and comprehensive validation.
 * Styled in the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Award,
  Building2,
  AlertCircle,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import {
  useCreateDesignationMutation,
  useUpdateDesignationMutation
} from '../departmentsApi.js';

const GRADE_TIER_CONFIG = [
  {
    grade: 'Junior',
    label: 'Junior',
    subtitle: 'Entry-level specialist',
    badge: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-300 dark:border-slate-700',
    activeRing: 'ring-slate-400 border-slate-400 dark:border-slate-500'
  },
  {
    grade: 'Mid',
    label: 'Mid-Level',
    subtitle: 'Independent specialist',
    badge: 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border-blue-200 dark:border-blue-800/40',
    activeRing: 'ring-blue-500 border-blue-500'
  },
  {
    grade: 'Senior',
    label: 'Senior',
    subtitle: 'Advanced specialist',
    badge: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-[#00C471] border-emerald-200 dark:border-emerald-800/40',
    activeRing: 'ring-[#00C471] border-[#00C471]'
  },
  {
    grade: 'Lead',
    label: 'Lead',
    subtitle: 'Functional lead',
    badge: 'bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border-purple-200 dark:border-purple-800/40',
    activeRing: 'ring-purple-500 border-purple-500'
  },
  {
    grade: 'Executive',
    label: 'Executive',
    subtitle: 'Strategic director/head',
    badge: 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 dark:border-amber-800/40',
    activeRing: 'ring-amber-500 border-amber-500'
  }
];

export function DesignationModal({
  isOpen = false,
  onClose = () => {},
  designation = null,
  departments = []
}) {
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    grade: 'Junior',
    departmentId: '',
    description: '',
    isActive: true
  });
  const [errorMessage, setErrorMessage] = useState('');

  const [createDesignation, { isLoading: isCreating }] = useCreateDesignationMutation();
  const [updateDesignation, { isLoading: isUpdating }] = useUpdateDesignationMutation();
  const isSubmitting = isCreating || isUpdating;

  const eligibleDepartments = useMemo(() => {
    return departments.filter((d) => {
      if (d.isArchived) {
        return designation && (designation.departmentId?._id === d._id || designation.departmentId === d._id);
      }
      return true;
    });
  }, [departments, designation]);

  useEffect(() => {
    if (designation) {
      setFormData({
        title: designation.title || '',
        code: designation.code || '',
        grade: designation.grade || 'Junior',
        departmentId: designation.departmentId?._id || designation.departmentId || '',
        description: designation.description || '',
        isActive: designation.isActive !== undefined ? designation.isActive : true
      });
    } else {
      setFormData({
        title: '',
        code: '',
        grade: 'Junior',
        departmentId: eligibleDepartments[0]?._id || '',
        description: '',
        isActive: true
      });
    }
    setErrorMessage('');
  }, [designation, eligibleDepartments, isOpen]);

  // Handle ESC key listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim()) {
      setErrorMessage('Designation Title is required.');
      return;
    }

    if (!formData.code.trim()) {
      setErrorMessage('Designation Code is required.');
      return;
    }

    if (!formData.departmentId) {
      setErrorMessage('Department selection is required.');
      return;
    }

    try {
      const payload = {
        title: formData.title.trim(),
        code: formData.code.trim().toUpperCase(),
        grade: formData.grade,
        departmentId: formData.departmentId,
        description: formData.description.trim(),
        isActive: formData.isActive
      };

      if (designation) {
        await updateDesignation({
          id: designation._id || designation.id,
          ...payload
        }).unwrap();
      } else {
        await createDesignation(payload).unwrap();
      }

      onClose();
    } catch (err) {
      const message =
        err?.data?.message ||
        err?.message ||
        'An error occurred while saving the designation. Please try again.';
      setErrorMessage(message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="w-full max-w-xl rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xl overflow-hidden transition-all max-h-[90vh] flex flex-col"
        role="dialog"
        aria-modal="true"
        aria-labelledby="designation-modal-title"
      >
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-[#1A3125] flex items-center justify-between bg-slate-50/50 dark:bg-[#0E1712]/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center shrink-0">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="designation-modal-title"
                className="text-sm font-bold text-slate-900 dark:text-white"
              >
                {designation ? `Edit Designation: ${designation.title}` : 'Create New Designation'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define corporate title, grade tier seniority, and department association
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={isSubmitting}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Error Alert Banner */}
          {errorMessage && (
            <div className="rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 p-3 flex items-start gap-2.5 text-xs text-rose-700 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="flex-1">{errorMessage}</div>
            </div>
          )}

          {/* Row 1: Title and Code */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2 space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Designation Title <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                maxLength={100}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471] transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Job Code <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SSE-01"
                maxLength={20}
                required
                className="w-full px-3 py-2 text-xs font-mono font-semibold uppercase rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471] transition-colors"
              />
            </div>
          </div>

          {/* Row 2: Associated Department */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>
                Associated Department <span className="text-rose-500">*</span>
              </span>
              <span className="text-[11px] font-normal text-slate-400">
                Code must be unique within this department
              </span>
            </label>
            <div className="relative">
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                required
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white focus:outline-none focus:border-[#00C471] transition-colors cursor-pointer appearance-none"
              >
                <option value="" disabled>Select Department</option>
                {eligibleDepartments.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code}) {dept.isArchived ? '— [ARCHIVED]' : ''}
                  </option>
                ))}
              </select>
              <Building2 className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Row 3: Grade Tier Hierarchy Selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Grade Tier Hierarchy <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {GRADE_TIER_CONFIG.map((tier) => {
                const isSelected = formData.grade === tier.grade;
                return (
                  <div
                    key={tier.grade}
                    onClick={() => setFormData({ ...formData, grade: tier.grade })}
                    className={`rounded-xl border p-2.5 cursor-pointer transition-all text-center ${
                      isSelected
                        ? `bg-slate-50 dark:bg-[#15241C] ${tier.activeRing} ring-2 shadow-xs`
                        : 'border-slate-200 dark:border-[#1A3125] bg-slate-50/40 dark:bg-[#0E1712] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-bold uppercase tracking-wider rounded-md py-0.5 px-1 border mb-1 ${tier.badge}`}
                    >
                      {tier.label}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                      {tier.subtitle}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Row 4: Job Description & Operational Scope */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Role Description & Key Responsibilities
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Outline high-level responsibilities, expectations, and reporting lines..."
              maxLength={500}
              className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471] transition-colors resize-none"
            />
            <div className="text-[10px] text-slate-400 text-right">
              {formData.description.length} / 500 characters
            </div>
          </div>

          {/* Row 5: Status Toggle */}
          <div className="rounded-xl border border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] p-3 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-slate-900 dark:text-white">
                Active Operational Status
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400">
                Active designations can be assigned to new hires and promotions
              </div>
            </div>

            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00C471]" />
            </label>
          </div>

          {/* Form Actions Footer */}
          <div className="pt-2 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-medium rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2 text-xs font-semibold rounded-xl bg-[#00C471] hover:bg-emerald-400 text-[#061A14] flex items-center gap-1.5 shadow-sm transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{designation ? 'Update Designation' : 'Create Designation'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
