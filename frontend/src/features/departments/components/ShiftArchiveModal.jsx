/**
 * @file ShiftArchiveModal.jsx
 * @description Confirmation dialog for archiving a corporate work shift to cold storage.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import { Archive, AlertTriangle, Loader2 } from 'lucide-react';
import { useArchiveShiftMutation } from '../departmentsApi.js';
import { toast } from 'sonner';

export function ShiftArchiveModal({ isOpen = false, onClose = () => {}, shift = null }) {
  const [archiveShift, { isLoading }] = useArchiveShiftMutation();

  if (!isOpen || !shift) return null;

  const handleArchive = async () => {
    try {
      await archiveShift(shift._id || shift.id).unwrap();
      toast.success(`Shift '${shift.name}' moved to archive.`);
      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to archive shift. Please try again.'
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
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center shrink-0">
            <Archive className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Archive Work Shift?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You are about to archive <strong className="text-slate-800 dark:text-slate-200">{shift.name}</strong> ({shift.code}).
            </p>
          </div>
        </div>

        <div className="p-3.5 rounded-xl border border-amber-300 dark:border-amber-900/60 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs space-y-1.5">
          <p className="font-semibold flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
            <span>Archival Policy & Operational Notice:</span>
          </p>
          <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-700 dark:text-amber-300">
            <li>Existing staff ({shift.headcount || 0} members) maintain their schedule for historical attendance consistency.</li>
            <li>No new employees can be assigned to this shift while archived.</li>
            <li>Historical attendance check-in/out records remain completely immutable and unaffected.</li>
            <li>This shift will be moved to the Archive Console and hidden from active scheduling.</li>
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
            onClick={handleArchive}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Archive className="w-3.5 h-3.5" />}
            <span>Archive Shift</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShiftArchiveModal;
