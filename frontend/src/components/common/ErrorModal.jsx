/**
 * @file ErrorModal.jsx
 * @description State 3: Modal dialog for critical mutation failures and fatal errors.
 * Strictly satisfies Rule 3: Explain what went wrong, whose fault it is, and how to fix it.
 */

import React, { useEffect } from 'react';
import { AlertCircle, RefreshCw, X, ServerCrash, WifiOff, ShieldAlert, Cpu } from 'lucide-react';
import { classifyError } from '../../lib/errorClassifier.js';
import { cn } from '../../lib/utils.js';

/**
 * @param {Object} props
 * @param {boolean} props.isOpen - Whether modal is open
 * @param {Function} props.onClose - Close callback
 * @param {any} props.error - Error object
 * @param {Function} [props.onRetry] - Optional retry handler
 * @param {boolean} [props.isRetrying=false] - In-flight retry state
 * @param {string} [props.title] - Override title
 */
export function ErrorModal({
  isOpen,
  onClose,
  error = null,
  onRetry = null,
  isRetrying = false,
  title = null
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const classified = classifyError(error);
  const displayTitle = title || classified.title;

  const FaultIcon =
    classified.fault === 'server' ? ServerCrash :
    classified.fault === 'network' ? WifiOff :
    classified.fault === 'permission' ? ShieldAlert :
    classified.fault === 'gateway' ? Cpu :
    AlertCircle;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="error-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-md bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xl space-y-4">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          aria-label="Close dialog"
          className="absolute top-4 right-4 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Fault Attribution Badge */}
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200/60 dark:border-rose-900/40">
          <FaultIcon className="w-3 h-3" />
          <span>{classified.faultLabel}</span>
        </div>

        {/* 1. What went wrong */}
        <div>
          <h2 id="error-modal-title" className="text-base font-bold text-slate-900 dark:text-white">
            {displayTitle}
          </h2>
          {/* 2. Whose fault it is */}
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
            {classified.explanation}
          </p>
        </div>

        {/* 3. How to fix it */}
        <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1">
          <div className="flex items-center justify-between text-[11px] font-semibold text-slate-700 dark:text-slate-200">
            <span>Action Required:</span>
            <span className="font-mono text-[10px] text-slate-400">Ref: {classified.code}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {classified.resolution}
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
          >
            Dismiss
          </button>

          {onRetry && (
            <button
              type="button"
              disabled={isRetrying}
              onClick={onRetry}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', isRetrying && 'animate-spin')} />
              {isRetrying ? 'Retrying...' : 'Retry'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

