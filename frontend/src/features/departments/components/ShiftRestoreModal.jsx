/**
 * @file ShiftRestoreModal.jsx
 * @description Confirmation modal for restoring an archived shift back to the active directory.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import { RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { useRestoreShiftMutation } from '../departmentsApi.js';
import { toast } from 'sonner';

export function ShiftRestoreModal({ isOpen = false, onClose = () => {}, shift = null }) {
  const [restoreShift, { isLoading }] = useRestoreShiftMutation();

  if (!isOpen || !shift) return null;

  const handleRestore = async () => {
    try {
      await restoreShift(shift._id || shift.id).unwrap();
      toast.success(`Shift '${shift.name}' successfully restored.`);
      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to restore shift. Please check code conflicts.'
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
              Restore Work Shift?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You are restoring <strong className="text-slate-800 dark:text-slate-200">{shift.name}</strong> ({shift.code}).
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-emerald-300 dark:border-emerald-900/60 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200 text-xs space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>Restore Policy:</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-emerald-700 dark:text-emerald-300">
            <li>Re-activates the shift for active employee scheduling and roster assignments.</li>
            <li>Enforces code uniqueness against currently active shifts.</li>
            <li>Returns the shift to the active directory and KPI dashboards immediately.</li>
          </ul>
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
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-[#00C471] hover:bg-[#00B065] shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
            <span>Restore Shift</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShiftRestoreModal;
