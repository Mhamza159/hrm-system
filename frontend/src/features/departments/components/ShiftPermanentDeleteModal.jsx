/**
 * @file ShiftPermanentDeleteModal.jsx
 * @description Destructive confirmation modal with authoritative Employee Assignment Restriction Guard.
 * Strictly blocks deletion if ≥1 employee is assigned to the shift.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState } from 'react';
import { Trash2, AlertOctagon, Loader2, ArrowRight } from 'lucide-react';
import { usePermanentDeleteShiftMutation } from '../departmentsApi.js';
import { toast } from 'sonner';

export function ShiftPermanentDeleteModal({
  isOpen = false,
  onClose = () => {},
  shift = null,
  onOpenAssign = null
}) {
  const [confirmCode, setConfirmCode] = useState('');
  const [permanentDeleteShift, { isLoading }] = usePermanentDeleteShiftMutation();

  if (!isOpen || !shift) return null;

  const assignedCount = shift.headcount || 0;
  const isDeletionBlocked = assignedCount > 0;
  const codeMatches = confirmCode.trim().toUpperCase() === shift.code?.toUpperCase();

  const handleDelete = async () => {
    if (isDeletionBlocked) return;
    if (!codeMatches) return;

    try {
      await permanentDeleteShift(shift._id || shift.id).unwrap();
      toast.success(`Shift '${shift.name}' permanently deleted.`);
      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to permanently delete shift.'
      );
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="fixed inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-md rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header Icon & Title */}
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
            <Trash2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Permanently Delete Work Shift?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Shift: <strong className="text-slate-800 dark:text-slate-200">{shift.name}</strong> ({shift.code})
            </p>
          </div>
        </div>

        {/* CRITICAL EMPLOYEE ASSIGNMENT RESTRICTION GUARD */}
        {isDeletionBlocked ? (
          <div className="p-4 rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-500/10 text-rose-800 dark:text-rose-200 text-xs space-y-2.5">
            <div className="flex items-start gap-2.5">
              <AlertOctagon className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-rose-600 dark:text-rose-400">
                  Permanent Deletion Blocked
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-rose-700 dark:text-rose-300">
                  This work shift cannot be permanently deleted because <strong>{assignedCount} employee(s)</strong> are still rostered to it. Please reassign all personnel to another shift before proceeding.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                Active Staff Assignment Guard Enforced
              </span>
              {onOpenAssign && (
                <button
                  type="button"
                  onClick={() => { onClose(); onOpenAssign(shift); }}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 underline cursor-pointer"
                >
                  <span>Reassign Staff</span>
                  <ArrowRight className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-500/5 text-rose-800 dark:text-rose-300 text-xs space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>Irreversible Permanent Action</span>
              </p>
              <p className="text-[11px] text-rose-700 dark:text-rose-300">
                This will permanently delete the shift record from the database. It cannot be recovered.
              </p>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                Type shift code <strong className="font-mono text-rose-600 dark:text-rose-400">{shift.code}</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder={shift.code}
                className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] font-mono uppercase text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-rose-500 transition-colors"
              />
            </div>
          </div>
        )}

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
            onClick={handleDelete}
            disabled={isDeletionBlocked || !codeMatches || isLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Permanently Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default ShiftPermanentDeleteModal;
