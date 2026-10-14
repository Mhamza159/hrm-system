/**
 * @file DesignationModal.jsx
 * @description Modal dialog for creating and updating corporate designations and grade tiers.
 * 
 * SPECIFICATION & FEATURES:
 * - Slice 4.3: Designation master management
 * - Grade tier selection (Junior, Mid, Senior, Lead, Executive)
 * - Department assignment and code uniqueness
 */

import React, { useState, useEffect } from 'react';
import { X, Award, AlertCircle, Loader2 } from 'lucide-react';
import {
  useCreateDesignationMutation,
  useUpdateDesignationMutation
} from '../departmentsApi.js';

const GRADE_TIERS = ['Junior', 'Mid', 'Senior', 'Lead', 'Executive'];

export function DesignationModal({
  isOpen,
  onClose,
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
        departmentId: departments[0]?._id || '',
        description: '',
        isActive: true
      });
    }
    setErrorMessage('');
  }, [designation, departments, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.title.trim() || !formData.code.trim()) {
      setErrorMessage('Designation Title and Code are required.');
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
      setErrorMessage(
        err?.data?.message || err?.message || 'Failed to save designation.'
      );
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/60">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {designation ? 'Edit Designation' : 'Create Designation'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {designation
                  ? 'Update job title, grade tier, and department assignment'
                  : 'Establish a new title within the organizational compensation structure'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="flex items-center gap-2.5 p-3 rounded-xl bg-rose-50 text-rose-600 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60 text-xs">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Job Title *
              </label>
              <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g. Senior Software Engineer"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Designation Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. SSE"
                className="w-full px-3.5 py-2.5 text-xs uppercase rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Grade Tier *
              </label>
              <select
                value={formData.grade}
                onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              >
                {GRADE_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier} Grade
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department *
              </label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              >
                <option value="">Select Department</option>
                {departments.map((dept) => (
                  <option key={dept._id || dept.id} value={dept._id || dept.id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description & Key Scope
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Primary responsibilities, seniority expectations, and scope..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="desigActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-[#00C471] focus:ring-[#00C471] border-slate-300 dark:border-[#1A3125]"
            />
            <label htmlFor="desigActive" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Active title (available for hiring and staff assignment)
            </label>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#1A3125] transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold rounded-xl text-white bg-[#00C471] hover:bg-[#00B064] shadow-sm transition-all cursor-pointer disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{designation ? 'Update Designation' : 'Create Designation'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
