/**
 * @file DepartmentRestoreModal.jsx
 * @description Confirmation dialog for restoring an archived department to active status.
 */

import React from 'react';
import { RotateCcw, CheckCircle2, Loader2 } from 'lucide-react';
import { useRestoreDepartmentMutation } from '../departmentsApi.js';
import { toast } from 'sonner';

export function DepartmentRestoreModal({ isOpen, onClose, department }) {
  const [restoreDepartment, { isLoading }] = useRestoreDepartmentMutation();

  if (!isOpen || !department) return null;

  const handleRestore = async () => {
    try {
      await restoreDepartment(department._id || department.id).unwrap();
      toast.success(`Department '${department.name}' successfully restored to active directory.`);
      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to restore department.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Restore Department?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Reinstate <strong className="text-slate-800 dark:text-slate-200">{department.name}</strong> ({department.code}) to the active company hierarchy.
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#00C471]" />
            <span>Restoration Notice:</span>
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
            This department will be marked active and eligible to receive new employee assignments and sub-departments.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#15241C] transition-all cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleRestore}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#00C471] hover:bg-[#00B064] shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>Confirm Restore</span>
          </button>
        </div>
      </div>
    </div>
  );
}
