/**
 * @file SecurityAlertBanner.jsx
 * @description Real-time security alert banner warning administrators about active lockouts or threat patterns.
 */

import React, { useState } from 'react';
import { ShieldAlert, X, ArrowRight } from 'lucide-react';

export function SecurityAlertBanner({ lockedCount = 0, onFilterLocked }) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (lockedCount <= 0 || isDismissed) {
    return null;
  }

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-300 dark:border-amber-700/60 bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-transparent p-4 text-amber-900 dark:text-amber-100 shadow-xs">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-600 dark:text-amber-400 mt-0.5">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Security Alert
              </span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300">
                {lockedCount} {lockedCount === 1 ? 'Lockout' : 'Lockouts'}
              </span>
            </div>
            <p className="mt-1 text-xs text-amber-950 dark:text-amber-200/90 leading-relaxed">
              One or more accounts have exceeded maximum failed login attempts and entered a temporary security lockout window.
            </p>
            {onFilterLocked && (
              <button
                type="button"
                onClick={onFilterLocked}
                className="mt-2.5 inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 transition-colors cursor-pointer"
              >
                <span>Isolate and inspect locked accounts</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDismissed(true)}
          className="text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
          title="Dismiss alert"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
