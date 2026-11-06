/**
 * @file SuccessState.jsx
 * @description State 10: Success confirmation and next-step progression tracker.
 * Strictly satisfies Rule 10: Confirm, reassure, and show what happens next.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, ArrowRight, ShieldCheck, Clock } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * @param {Object} props
 * @param {string} props.title - 1. Confirmation headline (e.g. "Application Submitted Successfully")
 * @param {string} [props.referenceId] - Tracking or record reference (e.g. "#EXP-2026-0042")
 * @param {string} props.reassurance - 2. Reassurance message confirming data security & logging
 * @param {Array<{ title: string, description?: string, duration?: string }>} [props.nextSteps] - 3. What happens next
 * @param {Object} [props.primaryAction] - Primary CTA { label, href, onClick }
 * @param {Object} [props.secondaryAction] - Secondary CTA { label, href, onClick }
 * @param {string} [props.className]
 */
export function SuccessState({
  title = 'Action Completed Successfully',
  referenceId = null,
  reassurance = 'Your data has been securely saved to the organizational database.',
  nextSteps = [],
  primaryAction = null,
  secondaryAction = null,
  className = ''
}) {
  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        'flex flex-col items-center justify-center text-center rounded-2xl border transition-colors',
        'border-emerald-200/80 dark:border-emerald-950/60 bg-emerald-50/20 dark:bg-[#0C1711]',
        'py-12 px-6 max-w-lg mx-auto my-4',
        className
      )}
    >
      {/* 1. Pulsing Emerald Confirmation Checkmark */}
      <div className="relative mb-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
          <CheckCircle2 className="w-7 h-7" />
        </div>
      </div>

      {referenceId && (
        <span className="font-mono text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-800/40 mb-2">
          {referenceId}
        </span>
      )}

      {/* 1. Confirm */}
      <h3 className="text-base font-bold text-slate-900 dark:text-white tracking-tight">
        {title}
      </h3>

      {/* 2. Reassure */}
      <div className="flex items-center gap-1.5 mt-2 text-xs text-slate-600 dark:text-slate-300 max-w-md">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
        <p className="leading-relaxed">{reassurance}</p>
      </div>

      {/* 3. Show what happens next */}
      {nextSteps && nextSteps.length > 0 && (
        <div className="mt-6 w-full text-left bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] rounded-xl p-4 shadow-2xs space-y-3">
          <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-500" />
            <span>What happens next:</span>
          </div>

          <ol className="space-y-2.5">
            {nextSteps.map((step, idx) => (
              <li key={idx} className="flex items-start gap-2.5 text-xs">
                <span className="w-5 h-5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {typeof step === 'string' ? step : step.title}
                    </span>
                    {step.duration && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        {step.duration}
                      </span>
                    )}
                  </div>
                  {step.description && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      {step.description}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {/* Next Actions */}
      {(primaryAction || secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-3 mt-6">
          {primaryAction && (
            primaryAction.href ? (
              <Link
                to={primaryAction.href}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                {primaryAction.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                type="button"
                onClick={primaryAction.onClick}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:shadow-sm transition-all cursor-pointer"
              >
                {primaryAction.label}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )
          )}

          {secondaryAction && (
            secondaryAction.href ? (
              <Link
                to={secondaryAction.href}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                {secondaryAction.label}
              </Link>
            ) : (
              <button
                type="button"
                onClick={secondaryAction.onClick}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-colors cursor-pointer shadow-2xs"
              >
                {secondaryAction.label}
              </button>
            )
          )}
        </div>
      )}
    </div>
  );
}

