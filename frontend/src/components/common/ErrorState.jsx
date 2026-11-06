/**
 * @file ErrorState.jsx
 * @description State 3: Error Attribution & Recovery View.
 * Strictly satisfies Rule 3: Explain what went wrong, whose fault it is, and how to fix it.
 */

import React from 'react';
import { AlertTriangle, RefreshCw, ArrowLeft, ShieldAlert, WifiOff, ServerCrash, Cpu } from 'lucide-react';
import { classifyError } from '../../lib/errorClassifier.js';
import { cn } from '../../lib/utils.js';

/**
 * @param {Object} props
 * @param {any} [props.error] - Raw error object or RTK query error
 * @param {Function} [props.onRetry] - Retry callback
 * @param {boolean} [props.isRetrying=false] - Retry in-flight indicator
 * @param {Function} [props.onBack] - Navigation recovery
 * @param {string} [props.title] - Override title
 * @param {string} [props.description] - Override description
 * @param {string} [props.className]
 */
export function ErrorState({
  error = null,
  onRetry = null,
  isRetrying = false,
  onBack = null,
  title = null,
  description = null,
  className = ''
}) {
  const classified = classifyError(error);

  const displayTitle = title || classified.title;
  const displayExplanation = description || classified.explanation;
  const displayResolution = classified.resolution;

  // Icon selection based on fault
  const FaultIcon =
    classified.fault === 'server' ? ServerCrash :
    classified.fault === 'network' ? WifiOff :
    classified.fault === 'permission' ? ShieldAlert :
    classified.fault === 'gateway' ? Cpu :
    AlertTriangle;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border transition-colors',
        'border-rose-200/80 dark:border-rose-950/60 bg-rose-50/20 dark:bg-[#151113]',
        'py-12 px-6 max-w-lg mx-auto my-4',
        className
      )}
    >
      {/* Fault Attribution Badge */}
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase mb-4 border bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border-rose-200/60 dark:border-rose-900/40">
        <FaultIcon className="w-3.5 h-3.5" />
        <span>{classified.faultLabel}</span>
      </div>

      {/* 1. What went wrong */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
        {displayTitle}
      </h3>

      {/* 2. Whose fault it is */}
      <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 max-w-md leading-relaxed">
        {displayExplanation}
      </p>

      {/* 3. How to fix it */}
      <div className="mt-4 px-3.5 py-2.5 rounded-xl bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] text-left w-full text-xs space-y-1">
        <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
          <span>Resolution Steps:</span>
          <span className="font-mono text-[10px] text-slate-400">Ref: {classified.code}</span>
        </div>
        <p className="text-slate-500 dark:text-slate-400 leading-normal">
          {displayResolution}
        </p>
      </div>

      {/* Recovery Controls */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
        {onRetry && (
          <button
            type="button"
            disabled={isRetrying}
            onClick={onRetry}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
          >
            <RefreshCw className={cn('w-3.5 h-3.5', isRetrying && 'animate-spin')} />
            {isRetrying ? 'Retrying...' : 'Retry Action'}
          </button>
        )}

        {onBack ? (
          <button
            type="button"
            onClick={onBack}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Go Back
          </button>
        ) : (
          <a
            href="/"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
          >
            Return to Dashboard
          </a>
        )}
      </div>
    </div>
  );
}

