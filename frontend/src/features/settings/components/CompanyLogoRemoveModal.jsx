/**
 * @file CompanyLogoRemoveModal.jsx
 * @description Enterprise Confirmation Modal for Company Logo & Brandmark Removal (Phase 36 / Plan 36-02).
 * Strictly conforms to docs/UI-REFERENCE.md (Elvara Forest #061A14 & Emerald #00C471).
 */

import React from 'react';
import {
  X,
  AlertTriangle,
  Trash2,
  Loader2,
  Building2,
  ShieldAlert
} from 'lucide-react';

export function CompanyLogoRemoveModal({
  isOpen,
  onClose,
  onConfirm,
  isLoading,
  currentLogoUrl,
  companyName
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-[#1A3125] bg-rose-50/40 dark:bg-rose-950/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold border border-rose-200 dark:border-rose-900/60">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Remove Company Logo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Reset system branding to standard monogram
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-xs">
          {/* Current Logo Display Sandbox */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] flex items-center justify-center">
            {currentLogoUrl ? (
              <div className="flex flex-col items-center gap-2">
                <img
                  src={currentLogoUrl}
                  alt={companyName || 'Company Logo'}
                  className="max-h-16 max-w-full object-contain rounded-xl p-1 bg-white dark:bg-[#14231C] border border-slate-200 dark:border-[#1A3125]"
                />
                <span className="text-[11px] font-mono text-slate-400">Current Active Brandmark</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-slate-400">
                <Building2 className="w-8 h-8 text-slate-300 dark:text-slate-600" />
                <span className="text-[11px]">No custom logo currently applied</span>
              </div>
            )}
          </div>

          {/* System-Wide Impact Warning */}
          <div className="p-3.5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div className="space-y-1 text-slate-700 dark:text-slate-300 leading-relaxed">
              <p className="font-bold text-amber-900 dark:text-amber-300">
                System-Wide Branding Impact
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400">
                Removing this logo will revert all generated artifacts to the default Elvara corporate mark across:
              </p>
              <ul className="list-disc list-inside text-[11px] text-slate-500 dark:text-slate-400 pt-0.5 space-y-0.5 font-medium">
                <li>Portal Topbar & Navigation Sidebar</li>
                <li>Official Employee ID Cards</li>
                <li>Monthly FBR Salary Advice PDF Payslips</li>
                <li>Automated Email Dispatch Headers</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer disabled:opacity-50"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Removing Logo...</span>
              </>
            ) : (
              <>
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirm Removal</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
