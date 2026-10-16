/**
 * @file DepartmentModal.jsx
 * @description Modal dialog for creating and editing company departments.
 * 
 * SPECIFICATION & FEATURES:
 * - Slice 4.1: Department master creation & updates
 * - Self-referencing parent selector (excluding self on edit)
 * - Error handling with feedback
 */

import React, { useState, useEffect } from 'react';
import { X, Building2, AlertCircle, Loader2 } from 'lucide-react';
import {
  useCreateDepartmentMutation,
  useUpdateDepartmentMutation,
  useGetHeadCandidatesQuery
} from '../departmentsApi.js';

export function DepartmentModal({
  isOpen,
  onClose,
  department = null,
  allDepartments = []
}) {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    parentId: '',
    headId: '',
    isActive: true
  });
  const [errorMessage, setErrorMessage] = useState('');

  const { data: candidatesResponse } = useGetHeadCandidatesQuery(undefined, { skip: !isOpen });
  const candidates = candidatesResponse?.data || [];

  const [createDepartment, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [updateDepartment, { isLoading: isUpdating }] = useUpdateDepartmentMutation();
  const isSubmitting = isCreating || isUpdating;

  useEffect(() => {
    if (department) {
      setFormData({
        name: department.name || '',
        code: department.code || '',
        description: department.description || '',
        parentId: department.parentId?._id || department.parentId || '',
        headId: department.headId?._id || department.headId || '',
        isActive: department.isActive !== undefined ? department.isActive : true
      });
    } else {
      setFormData({
        name: '',
        code: '',
        description: '',
        parentId: '',
        headId: '',
        isActive: true
      });
    }
    setErrorMessage('');
  }, [department, isOpen]);

  if (!isOpen) return null;

  // Filter out the current department from available parent options to avoid immediate self-reference
  const currentDeptId = (department?._id || department?.id)?.toString();
  const availableParents = allDepartments.filter((d) => {
    if (!currentDeptId) return true;
    const parentId = (d._id || d.id)?.toString();
    return parentId !== currentDeptId;
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!formData.name.trim() || !formData.code.trim()) {
      setErrorMessage('Department Name and Code are required.');
      return;
    }

    try {
      const payload = {
        name: formData.name.trim(),
        code: formData.code.trim().toUpperCase(),
        description: formData.description.trim(),
        parentId: formData.parentId || null,
        headId: formData.headId || null,
        isActive: formData.isActive
      };

      if (department) {
        await updateDepartment({
          id: department._id || department.id,
          ...payload
        }).unwrap();
      } else {
        await createDepartment(payload).unwrap();
      }

      onClose();
    } catch (err) {
      setErrorMessage(
        err?.data?.message || err?.message || 'Failed to save department.'
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
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                {department ? 'Edit Department' : 'Create Department'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {department
                  ? 'Update department hierarchy, code, and status'
                  : 'Add a new department to the corporate structure'}
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
                Department Name *
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g. Engineering"
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Department Code *
              </label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                placeholder="e.g. ENG"
                className="w-full px-3.5 py-2.5 text-xs uppercase rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Parent Department
            </label>
            <select
              value={formData.parentId}
              onChange={(e) => setFormData({ ...formData, parentId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
            >
              <option value="">None (Top-Level Division)</option>
              {availableParents.map((dept) => (
                <option key={dept._id || dept.id} value={dept._id || dept.id}>
                  {dept.name} ({dept.code})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Leave blank if this is an executive or top-level corporate division.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Department Head / Director
            </label>
            <select
              value={formData.headId}
              onChange={(e) => setFormData({ ...formData, headId: e.target.value })}
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
            >
              <option value="">Unassigned</option>
              {candidates.map((cand) => (
                <option key={cand._id} value={cand._id}>
                  {cand.name} ({cand.email})
                </option>
              ))}
            </select>
            <p className="mt-1 text-[11px] text-slate-400">
              Assigned leadership user responsible for approvals and managerial oversight.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Description
            </label>
            <textarea
              rows={3}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Primary responsibilities and operational mandate..."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-slate-50 dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="deptActive"
              checked={formData.isActive}
              onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-[#00C471] focus:ring-[#00C471] border-slate-300 dark:border-[#1A3125]"
            />
            <label htmlFor="deptActive" className="text-xs font-medium text-slate-700 dark:text-slate-300">
              Active status (accessible for employee assignment)
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
              <span>{department ? 'Update Department' : 'Create Department'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
