/**
 * @file StatCard.jsx
 * @description KPI StatCard component matching Row 1 of docs/ui-reference.png.
 */

import React from 'react';
import { cn } from '../../lib/utils.js';

export function StatCard({
  label,
  title,
  value,
  caption,
  description,
  icon: Icon,
  variant = 'emerald', // 'emerald' | 'blue' | 'purple' | 'rose'
  className = ''
}) {
  const displayLabel = label || title;
  const displayCaption = caption || description;
  const variantStyles = {
    emerald: {
      tile: 'bg-emerald-50 dark:bg-emerald-950/50 text-[#00C471] border-emerald-100 dark:border-emerald-800/40',
      caption: 'text-[#00C471]',
      sparkline: '#00C471'
    },
    blue: {
      tile: 'bg-blue-50 dark:bg-blue-950/50 text-blue-500 border-blue-100 dark:border-blue-800/40',
      caption: 'text-blue-500',
      sparkline: '#3B82F6'
    },
    purple: {
      tile: 'bg-purple-50 dark:bg-purple-950/50 text-purple-500 border-purple-100 dark:border-purple-800/40',
      caption: 'text-purple-500',
      sparkline: '#8B5CF6'
    },
    rose: {
      tile: 'bg-rose-50 dark:bg-rose-950/50 text-rose-500 border-rose-100 dark:border-rose-800/40',
      caption: 'text-rose-500',
      sparkline: '#EF4444'
    }
  };

  const v = variantStyles[variant] || variantStyles.emerald;

  return (
    <div
      className={cn(
        'rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-5 shadow-sm transition-all flex flex-col justify-between relative overflow-hidden',
        className
      )}
    >
      <div className="flex items-start justify-between">
        {/* Tinted Square Icon */}
        <div
          className={cn(
            'w-9 h-9 rounded-xl border flex items-center justify-center shrink-0',
            v.tile
          )}
        >
          {Icon && <Icon className="w-5 h-5" />}
        </div>

        {/* Smooth SVG Sparkline */}
        <div className="w-24 h-9">
          <svg viewBox="0 0 100 40" className="w-full h-full overflow-visible">
            <path
              d="M0 30 Q 25 10, 50 25 T 100 5"
              fill="none"
              stroke={v.sparkline}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
          {displayLabel}
        </p>
        <div className="flex items-baseline gap-2 mt-1">
          <span className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white tabular-nums">
            {value}
          </span>
          {displayCaption && (
            <span className={cn('text-xs font-semibold', v.caption)}>
              {displayCaption}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
