/**
 * @file DesignationRestoreModal.jsx
 * @description Confirmation dialog for restoring an archived corporate designation to active status.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import { RotateCcw, CheckCircle2, Loader2, Building2 } from 'lucide-react';
import { useRestoreDesignationMutation } from '../departmentsApi.js';
import { toast } from 'sonner';

export function DesignationRestoreModal({ isOpen = false, onClose = () => {}, designation = null }) {
  const [restoreDesignation, { isLoading }] = useRestoreDesignationMutation();

  if (!isOpen || !designation) return null;

  const deptName = designation.departmentId?.name || 'Department';
  const deptCode = designation.departmentId?.code || '—';

  const handleRestore = async () => {
    try {
      await restoreDesignation(designation._id || designation.id).unwrap();
      toast.success(`Designation '${designation.title}' successfully restored to active catalog.`);
      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to restore designation.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xl overflow-hidden p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-[#00C471] flex items-center justify-center shrink-0">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Restore Designation?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Reinstate <strong className="text-slate-800 dark:text-slate-200">{designation.title}</strong> ({designation.code}) to the active job catalog.
            </p>
          </div>
        </div>

        <div className="rounded-xl border border-slate-100 dark:border-[#15241C] bg-slate-50/50 dark:bg-[#0E1712] p-3 space-y-1 text-xs">
          <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            Target Department
          </div>
          <div className="font-semibold text-slate-800 dark:text-slate-200">
            {deptName} ({deptCode})
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs space-y-1">
          <p className="font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 shrink-0 text-[#00C471]" />
            <span>Restoration Notice:</span>
          </p>
          <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
            This title will be marked active and eligible to be assigned to new hires, promotions, and department transfers.
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
