/**
 * @file Card.jsx
 * @description Standard Card Container Component adhering to docs/ui-reference.png.
 */

import React from 'react';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../lib/utils.js';

export function Card({
  title,
  subtitle,
  badge,
  action,
  actionText,
  actionHref,
  children,
  className = ''
}) {
  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-5 lg:p-6 shadow-sm transition-all flex flex-col',
        className
      )}
    >
      {(title || action || actionText) && (
        <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {title}
            </h3>
            {badge && (
              <span className="text-[11px] text-slate-400 font-medium">
                {badge}
              </span>
            )}
            {subtitle && (
              <span className="text-xs text-slate-400 ml-1">
                {subtitle}
              </span>
            )}
          </div>

          {action ? (
            action
          ) : actionText ? (
            <button
              type="button"
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:text-emerald-700 flex items-center gap-0.5 cursor-pointer"
            >
              <span>{actionText}</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          ) : null}
        </div>
      )}

      <div className="flex-1 min-w-0">
        {children}
      </div>
    </div>
  );
}
