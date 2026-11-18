/**
 * @file DepartmentPermanentDeleteModal.jsx
 * @description Destructive confirmation modal with authoritative Employee Assignment Restriction Guard.
 */

import React from 'react';
import { Trash2, AlertOctagon, Loader2, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePermanentDeleteDepartmentMutation } from '../departmentsApi.js';
import { toast } from 'sonner';

export function DepartmentPermanentDeleteModal({ isOpen, onClose, department }) {
  const [permanentDeleteDepartment, { isLoading }] = usePermanentDeleteDepartmentMutation();

  if (!isOpen || !department) return null;

  const assignedCount = department.headcount || 0;
  const isDeletionBlocked = assignedCount > 0;

  const handleDelete = async () => {
    if (isDeletionBlocked) return;

    try {
      await permanentDeleteDepartment(department._id || department.id).unwrap();
      toast.success(`Department '${department.name}' permanently deleted.`);
      onClose();
    } catch (err) {
      toast.error(
        err?.data?.message || err?.message || 'Failed to permanently delete department.'
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
              Permanently Delete Department?
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Unit: <strong className="text-slate-800 dark:text-slate-200">{department.name}</strong> ({department.code})
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
                  This department cannot be permanently deleted because <strong>{assignedCount} employee(s)</strong> are still assigned to it. Please reassign all employees to another department before proceeding.
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
          <div className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-500/5 text-rose-800 dark:text-rose-300 text-xs space-y-1">
            <p className="font-semibold flex items-center gap-1.5">
              <AlertOctagon className="w-3.5 h-3.5 shrink-0 text-rose-500" />
              <span>Irreversible Purge Warning:</span>
            </p>
            <p className="text-[11px] text-slate-600 dark:text-slate-400 leading-relaxed">
              This department has 0 assigned employees. Permanently deleting it will completely remove all references, code tags, and database records. This action <strong>cannot be undone</strong>.
            </p>
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
          <button
            type="button"
            onClick={handleDelete}
            disabled={isLoading || isDeletionBlocked}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold text-white shadow-sm transition-all ${
              isDeletionBlocked
                ? 'bg-rose-400/50 cursor-not-allowed opacity-60'
                : 'bg-rose-600 hover:bg-rose-700 cursor-pointer'
            }`}
            title={isDeletionBlocked ? 'Cannot delete while employees are assigned' : 'Permanently purge department'}
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
            <span>Permanently Delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
