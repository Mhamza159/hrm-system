/**
 * @file LoanStatsCard.jsx
 * @description Executive KPI Stat Card for Loans & Advances Ledger.
 */

import React from 'react';
import { cn } from '../../../lib/utils.js';

export function LoanStatsCard({ title, value, subtitle, icon: Icon, color = 'emerald' }) {
  const colorMap = {
    emerald: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    rose: 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400',
    blue: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400',
    amber: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400'
  };

  return (
    <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs transition-all hover:shadow-sm">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {title}
        </span>
        {Icon && (
          <div className={cn('p-2 rounded-xl', colorMap[color] || colorMap.emerald)}>
            <Icon className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-[11px] text-slate-500">
          {subtitle}
        </div>
      )}
    </div>
  );
}

export default LoanStatsCard;
