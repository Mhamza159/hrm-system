/**
 * @file DashboardCard.jsx
 * @description Card primitive for dashboards (UI-REFERENCE §5): optional title row with
 * right-aligned "View All" link and a pulsing live dot.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';
import { cn } from '../../../../lib/utils.js';

export function DashboardCard({ title, action, live = false, className, children }) {
  return (
    <div className={cn('rounded-2xl border border-[#EAECF0] bg-white p-5 dark:border-[#1A3125] dark:bg-[#111D17]', className)}>
      {(title || action) && (
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
            {title}
            {live && (
              <span className="relative flex h-2 w-2" role="img" aria-label="Live">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#00C471] opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#00C471]" />
              </span>
            )}
          </h3>
          {action && (
            <Link
              to={action.to}
              className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300"
            >
              {action.label}
              <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            </Link>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
