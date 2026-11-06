/**
 * @file NoSearchResults.jsx
 * @description State 6 component for zero-match search results with typo suggestions.
 * Strictly satisfies Rule 6: Fix typos and suggest the next best thing.
 */

import React from 'react';
import { SearchX, Sparkles, X } from 'lucide-react';
import { cn } from '../../lib/utils.js';

/**
 * @param {Object} props
 * @param {string} props.query - Active search query
 * @param {string|null} [props.suggestion] - Closest typo suggestion
 * @param {Function} [props.onApplySuggestion] - Callback when clicking suggestion
 * @param {Function} [props.onClear] - Callback to reset search
 * @param {string} [props.className]
 */
export function NoSearchResults({
  query = '',
  suggestion = null,
  onApplySuggestion = null,
  onClear = null,
  className = ''
}) {
  return (
    <div
      role="status"
      aria-label="No search results"
      className={cn(
        'flex flex-col items-center justify-center text-center py-12 px-6 max-w-md mx-auto my-2',
        className
      )}
    >
      {/* SearchX icon with amber/slate ring */}
      <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3 shadow-xs">
        <SearchX className="w-6 h-6" />
      </div>

      {/* Query Title */}
      <h3 className="text-sm font-bold text-slate-900 dark:text-white">
        No results for &ldquo;{query}&rdquo;
      </h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
        We couldn&rsquo;t find any records matching your keyword. Check your spelling or try clearing filters.
      </p>

      {/* Typo Tolerance Suggestion */}
      {suggestion && (
        <div className="mt-3.5 px-3 py-2 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 flex items-center gap-2 text-xs">
          <Sparkles className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
          <span className="text-slate-600 dark:text-slate-300">Did you mean</span>
          <button
            type="button"
            onClick={() => onApplySuggestion && onApplySuggestion(suggestion)}
            className="font-semibold text-emerald-600 dark:text-emerald-400 underline underline-offset-2 hover:text-emerald-700 dark:hover:text-emerald-300 transition-colors cursor-pointer"
          >
            &ldquo;{suggestion}&rdquo;
          </button>
          <span className="text-slate-400">?</span>
        </div>
      )}

      {/* Clear Search & Reset Filters */}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="mt-5 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:bg-slate-50 dark:hover:bg-white/5 text-xs font-semibold text-slate-700 dark:text-slate-200 transition-all cursor-pointer shadow-2xs"
        >
          <X className="w-3.5 h-3.5 text-slate-400" />
          Clear Search
        </button>
      )}
    </div>
  );
}

