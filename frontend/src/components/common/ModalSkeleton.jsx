/**
 * @file ModalSkeleton.jsx
 * @description State 2: Geometry-aligned dialog and drawer skeleton loader.
 * Strictly satisfies Rule 2: Show the shape of what is coming, not just a spinner.
 */

import React from 'react';
import { cn } from '../../lib/utils.js';

/**
 * @param {Object} props
 * @param {number} [props.fields=4] - Number of field rows to display
 * @param {string} [props.className]
 */
export function ModalSkeleton({
  fields = 4,
  className = ''
}) {
  return (
    <div
      role="status"
      aria-label="Loading modal content"
      className={cn(
        'w-full bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-xl space-y-5 relative overflow-hidden',
        className
      )}
    >
      {/* Subtle Shimmer Sweep */}
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/30 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />

      {/* Header Shimmer (Icon + Title + Subtitle) */}
      <div className="flex items-center gap-3 border-b border-slate-100 dark:border-[#1A3125] pb-4">
        <div className="w-10 h-10 rounded-xl bg-slate-200 dark:bg-[#1A3125] shrink-0 animate-pulse" />
        <div className="space-y-2 flex-1">
          <div className="h-4 w-40 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
          <div className="h-3 w-56 bg-slate-100 dark:bg-[#14231C] rounded-md animate-pulse" />
        </div>
      </div>

      {/* Form Fields Shimmer Stack */}
      <div className="space-y-4">
        {Array.from({ length: fields }).map((_, idx) => (
          <div key={idx} className="space-y-1.5">
            <div
              className="h-3 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse"
              style={{ width: `${25 + (idx * 17) % 30}%` }}
            />
            <div className="h-9 w-full bg-slate-100 dark:bg-[#0E1A14] border border-slate-200/60 dark:border-[#1A3125] rounded-xl animate-pulse" />
          </div>
        ))}
      </div>

      {/* Footer Controls Shimmer */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100 dark:border-[#1A3125]">
        <div className="h-8 w-20 bg-slate-100 dark:bg-[#14231C] rounded-xl animate-pulse" />
        <div className="h-8 w-28 bg-emerald-500/30 dark:bg-emerald-500/20 rounded-xl animate-pulse" />
      </div>
    </div>
  );
}

