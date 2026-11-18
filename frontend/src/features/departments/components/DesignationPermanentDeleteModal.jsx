/**
 * @file DesignationPermanentDeleteModal.jsx
 * @description Destructive confirmation modal with authoritative Employee Assignment Restriction Guard.
 * Strictly blocks deletion if ≥1 employee is assigned to the designation.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState } from 'react';
import { Trash2, AlertOctagon, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePermanentDeleteDesignationMutation } from '../departmentsApi.js';
import { toast } from 'sonner';

export function DesignationPermanentDeleteModal({
  isOpen = false,
  onClose = () => {},
  designation = null
}) {
  const [confirmCode, setConfirmCode] = useState('');
  const [permanentDeleteDesignation, { isLoading }] = usePermanentDeleteDesignationMutation();

  if (!isOpen || !designation) return null;

  const assignedCount = designation.headcount || 0;
  const isDeletionBlocked = assignedCount > 0;
  const codeMatches = confirmCode.trim().toUpperCase() === designation.code?.toUpperCase();

  const handleDelete = async () => {
    if (isDeletionBlocked) return;
    if (!codeMatches) return;

    try {
      await permanentDeleteDesignation(designation._id || designation.id).unwrap();
      toast.success(`Designation '${designation.title}' permanently deleted.`);
      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to permanently delete designation.'
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
              Permanently Delete Designation?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Title: <strong className="text-slate-800 dark:text-slate-200">{designation.title}</strong> ({designation.code})
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
                  This designation cannot be permanently deleted because <strong>{assignedCount} employee(s)</strong> are still assigned to it. Please reassign all employees to another designation before proceeding.
                </p>
              </div>
            </div>

            <div className="pt-2 border-t border-rose-200/60 dark:border-rose-900/60 flex items-center justify-between">
              <span className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                Active Staff Assignment Guard Enforced
              </span>
              <Link
                to="/employees"
                onClick={onClose}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 underline"
              >
                <span>Reassign in Directory</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-500/5 text-rose-800 dark:text-rose-300 text-xs space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <AlertOctagon className="w-3.5 h-3.5 shrink-0 text-rose-500" />
                <span>Irreversible Purge Warning:</span>
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
                This designation has 0 assigned staff members. Permanently deleting it will completely purge the record from the database. This action <strong>cannot be undone</strong>.
              </p>
            </div>

            {/* Confirmation typing requirement */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                Type <strong className="font-mono text-rose-500">{designation.code}</strong> to confirm:
              </label>
              <input
                type="text"
                value={confirmCode}
                onChange={(e) => setConfirmCode(e.target.value)}
                placeholder={designation.code}
                className="w-full px-3 py-1.5 text-xs font-mono uppercase rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>
        )}

        {/* Action Controls */}
        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl text-xs font-semibold border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#15241C] transition-all cursor-pointer"
          >
            Cancel
          </button>
          {!isDeletionBlocked && (
            <button
              type="button"
              onClick={handleDelete}
              disabled={isLoading || !codeMatches}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 shadow-sm transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
              <span>Permanently Delete</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
