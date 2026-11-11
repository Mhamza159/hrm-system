/**
 * @file ConfirmDialog.jsx
 * @description Confirmation modal dialog adhering to docs/ui-reference.png style.
 */

import React from 'react';
import { AlertTriangle, X, Loader2 } from 'lucide-react';

export function ConfirmDialog({
  isOpen,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  isDestructive = false,
  confirmVariant = 'primary',
  isLoading = false,
  onConfirm,
  onCancel,
  onClose
}) {
  if (!isOpen) return null;

  const handleClose = onCancel || onClose;
  const isDanger = isDestructive || confirmVariant === 'danger';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xl space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`p-2 rounded-xl ${
                isDanger
                  ? 'bg-rose-50 text-rose-600 border border-rose-200/80 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60'
                  : 'bg-emerald-50 text-[#00C471] border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">{title}</h3>
          </div>
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            aria-label="Close modal"
            className="text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed pl-1">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="px-4 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#13221B] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all shadow-sm cursor-pointer disabled:opacity-50 inline-flex items-center gap-1.5 ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-900/20'
                : 'bg-[#00C471] hover:bg-[#049856] shadow-[0_2px_10px_rgba(0,196,113,0.25)]'
            }`}
          >
            {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>{isLoading ? 'Processing...' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
