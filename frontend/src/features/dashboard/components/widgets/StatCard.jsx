/**
 * @file StatCard.jsx
 * @description High-density KPI metric card adhering to enterprise HRM styling.
 */

import React from 'react';
import { ArrowUpRight, ArrowDownRight } from 'lucide-react';

export function StatCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendType = 'up', // 'up' | 'down' | 'neutral'
  color = 'emerald' // 'emerald' | 'blue' | 'amber' | 'rose' | 'purple'
}) {
  const colorMap = {
    emerald: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/30',
      border: 'border-emerald-200 dark:border-emerald-800/50',
      iconText: 'text-emerald-600 dark:text-emerald-400',
      pill: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300'
    },
    blue: {
      bg: 'bg-blue-50 dark:bg-blue-950/30',
      border: 'border-blue-200 dark:border-blue-800/50',
      iconText: 'text-blue-600 dark:text-blue-400',
      pill: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300'
    },
    amber: {
      bg: 'bg-amber-50 dark:bg-amber-950/30',
      border: 'border-amber-200 dark:border-amber-800/50',
      iconText: 'text-amber-600 dark:text-amber-400',
      pill: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300'
    },
    rose: {
      bg: 'bg-rose-50 dark:bg-rose-950/30',
      border: 'border-rose-200 dark:border-rose-800/50',
      iconText: 'text-rose-600 dark:text-rose-400',
      pill: 'bg-rose-100 dark:bg-rose-900/40 text-rose-700 dark:text-rose-300'
    },
    purple: {
      bg: 'bg-purple-50 dark:bg-purple-950/30',
      border: 'border-purple-200 dark:border-purple-800/50',
      iconText: 'text-purple-600 dark:text-purple-400',
      pill: 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
    }
  };

  const scheme = colorMap[color] || colorMap.emerald;

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden transition-all hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{value}</p>
        </div>
        {Icon && (
          <div className={`p-2.5 rounded-xl ${scheme.bg} ${scheme.border} border`}>
            <Icon className={`w-5 h-5 ${scheme.iconText}`} />
          </div>
        )}
      </div>

      {(subtitle || trend) && (
        <div className="mt-3.5 flex items-center gap-2 text-xs">
          {trend && (
            <span
              className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-semibold text-[11px] ${
                trendType === 'up'
                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                  : trendType === 'down'
                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {trendType === 'up' && <ArrowUpRight className="w-3 h-3" />}
              {trendType === 'down' && <ArrowDownRight className="w-3 h-3" />}
              {trend}
            </span>
          )}
          {subtitle && <span className="text-slate-500 dark:text-slate-400 truncate">{subtitle}</span>}
        </div>
      )}
    </div>
  );
}
