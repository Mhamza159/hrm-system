/**
 * @file StatCard.jsx
 * @description KPI card: uppercase label, mono value, optional sub-line and sparkline.
 * The sparkline renders only when a real series (>= 2 points) is supplied.
 */

import React from 'react';
import { cn } from '../../../../lib/utils.js';
import { DashboardCard } from './DashboardCard.jsx';

const SUB_TONE = {
  emerald: 'text-emerald-600 dark:text-emerald-400',
  amber: 'text-amber-600 dark:text-amber-400',
  rose: 'text-rose-600 dark:text-rose-400',
  muted: 'text-slate-500 dark:text-slate-400',
};

function Sparkline({ series, label }) {
  const W = 80;
  const H = 28;
  const min = Math.min(...series);
  const range = Math.max(...series) - min || 1;
  const points = series
    .map((v, i) => `${(i / (series.length - 1)) * W},${H - 2 - ((v - min) / range) * (H - 4)}`)
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-7 w-20 shrink-0 text-[#00C471]" role="img" aria-label={label}>
      <title>{label}</title>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function StatCard({ label, value, sub, subTone = 'muted', icon: Icon, series }) {
  const hasSeries = Array.isArray(series) && series.length >= 2;
  return (
    <DashboardCard>
      <div className="flex items-start justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">{label}</p>
        {Icon && (
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
            <Icon className="h-4 w-4" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="truncate font-mono text-[28px] font-semibold tabular-nums text-slate-900 dark:text-white">{value}</p>
        {hasSeries && <Sparkline series={series} label={`${label} trend`} />}
      </div>
      {sub && <p className={cn('mt-1 truncate text-xs', SUB_TONE[subTone] || SUB_TONE.muted)}>{sub}</p>}
    </DashboardCard>
  );
}
