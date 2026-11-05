/**
 * @file RefreshButton.jsx
 * @description Standardized toolbar refresh button adhering to Forest & Emerald DESIGN.md.
 * Features smooth spinning indicator, mobile icon-only collapsing, and dark-mode styling.
 */

import React from 'react';
import { RefreshCw } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function RefreshButton({
  onRefresh,
  isFetching = false,
  className = '',
  label = 'Refresh'
}) {
  return (
    <button
      type="button"
      onClick={onRefresh}
      disabled={isFetching}
      className={cn(
        "inline-flex items-center gap-2 p-2 sm:px-3 sm:py-2 text-xs font-semibold rounded-xl transition-all cursor-pointer select-none shadow-xs disabled:opacity-50",
        "bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300",
        "border border-slate-200 dark:border-[#1A3125] hover:bg-slate-50 dark:hover:bg-[#162820]",
        className
      )}
      title="Refresh page records"
      aria-label="Refresh page records"
    >
      <RefreshCw
        className={cn(
          "w-3.5 h-3.5 text-[#00C471] transition-transform",
          isFetching && "animate-spin"
        )}
      />
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

export default RefreshButton;
