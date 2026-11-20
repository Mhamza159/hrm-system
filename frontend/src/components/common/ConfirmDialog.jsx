/**
 * @file ConfirmDialog.jsx
 * @description Confirmation modal adhering to docs/ui-reference.png style.
 *
 * Optional extras (all backward compatible):
 * - icon: lucide icon component shown in the header badge (default AlertTriangle)
 * - details: node rendered as a summary card of the record being acted on
 * - requireText: the user must type this exact text before the confirm button enables
 *   (used for irreversible actions such as permanent deletion)
 */

import React, { useEffect, useId, useRef, useState } from 'react';
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
  icon: Icon = AlertTriangle,
  details = null,
  requireText = '',
  onConfirm,
  onCancel,
  onClose
}) {
  const [typed, setTyped] = useState('');
  const cancelRef = useRef(null);
  const titleId = useId();
  const descId = useId();

  const handleClose = onCancel || onClose;
  const isDanger = isDestructive || confirmVariant === 'danger';
  const textOk = !requireText || typed.trim() === requireText;

  useEffect(() => {
    if (!isOpen) return undefined;
    setTyped('');
    // Destructive dialogs start on Cancel so Enter never confirms by accident
    cancelRef.current?.focus();
    const onKey = (e) => {
      if (e.key === 'Escape' && !isLoading) handleClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/15 p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={() => !isLoading && handleClose?.()}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={descId}
        className="w-full max-w-md overflow-hidden rounded-2xl border border-[#EAECF0] bg-white shadow-2xl animate-in zoom-in-95 duration-150 dark:border-[#1A3125] dark:bg-[#111D17]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="space-y-4 p-6">
          <div className="flex items-start gap-4">
            <span
              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                isDanger
                  ? 'bg-red-50 text-red-600 ring-8 ring-red-50/60 dark:bg-red-950/40 dark:text-red-400 dark:ring-red-950/20'
                  : 'bg-emerald-50 text-[#00C471] ring-8 ring-emerald-50/60 dark:bg-emerald-950/40 dark:text-emerald-400 dark:ring-emerald-950/20'
              }`}
              aria-hidden="true"
            >
              <Icon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1 pt-0.5">
              <h3 id={titleId} className="text-base font-semibold text-slate-900 dark:text-white">
                {title}
              </h3>
              <div id={descId} className="mt-1.5 text-[13px] leading-relaxed text-slate-600 dark:text-slate-400">
                {message}
              </div>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              aria-label="Close"
              className="-me-1 -mt-1 rounded-lg p-1 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:opacity-50 dark:hover:bg-[#1A3125] dark:hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {details && <div className="rounded-xl border border-[#EAECF0] bg-slate-50/60 px-4 py-3 dark:border-[#1A3125] dark:bg-[#0A110D]">{details}</div>}

          {requireText && (
            <label className="block">
              <span className="text-xs text-slate-600 dark:text-slate-400">
                Type <span className="font-mono font-semibold text-slate-900 dark:text-white">{requireText}</span> to confirm
              </span>
              <input
                type="text"
                value={typed}
                onChange={(e) => setTyped(e.target.value)}
                autoComplete="off"
                spellCheck={false}
                className="mt-1.5 w-full rounded-xl border border-[#E2E8F0] bg-white px-3.5 py-2 font-mono text-[13px] text-slate-900 focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:border-[#1A3125] dark:bg-[#0A110D] dark:text-white"
              />
            </label>
          )}
        </div>

        <div className="flex items-center justify-end gap-2.5 border-t border-[#EAECF0] bg-slate-50/60 px-6 py-4 dark:border-[#1A3125] dark:bg-[#0E1A14]">
          <button
            ref={cancelRef}
            type="button"
            onClick={handleClose}
            disabled={isLoading}
            className="rounded-xl border border-[#E2E8F0] bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 dark:border-[#1A3125] dark:bg-[#13221B] dark:text-slate-200 dark:hover:bg-white/5"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading || !textOk}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
              isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-[#00C471] hover:bg-[#049856]'
            }`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
            <span>{isLoading ? 'Working…' : confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
