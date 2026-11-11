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
  const W = 120;
  const H = 28;
  const PAD = 3; // keeps the 2px stroke and round caps inside the viewBox
  const min = Math.min(...series);
  const range = Math.max(...series) - min;
  const points = series
    .map((v, i) => {
      const x = PAD + (i / (series.length - 1)) * (W - 2 * PAD);
      const y = range ? H - PAD - ((v - min) / range) * (H - 2 * PAD) : H / 2; // flat series sits mid-height
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" className="mt-2 h-7 w-full text-[#00C471]" role="img" aria-label={label}>
      <title>{label}</title>
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

export function StatCard({ label, value, sub, subTone = 'muted', icon: Icon, series }) {
  const clean = Array.isArray(series) ? series.filter(Number.isFinite) : [];
  const hasSeries = clean.length >= 2;
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
      <p
        title={typeof value === 'string' || typeof value === 'number' ? String(value) : undefined}
        className="mt-2 break-words font-mono text-2xl font-semibold tabular-nums text-slate-900 lg:text-[28px] dark:text-white"
      >
        {value}
      </p>
      {hasSeries && <Sparkline series={clean} label={`${label} trend`} />}
      {sub && <p className={cn('mt-1 truncate text-xs', SUB_TONE[subTone] || SUB_TONE.muted)}>{sub}</p>}
    </DashboardCard>
  );
}
