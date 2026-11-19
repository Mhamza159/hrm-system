/**
 * @file ModulePermissionDonut.jsx
 * @description Native zero-dependency SVG Donut chart displaying permission density grouped by module categories.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState, useMemo } from 'react';
import { Layers } from 'lucide-react';
import { cn } from '../../../lib/utils.js';

const CATEGORY_CONFIGS = [
  {
    key: 'core_hr',
    label: 'Core HR & Org',
    modules: ['auth', 'user', 'role', 'employee', 'department', 'designation', 'org'],
    color: '#00C471',
    lightColor: 'text-[#00C471]'
  },
  {
    key: 'time_attendance',
    label: 'Time & Leaves',
    modules: ['attendance', 'shift', 'wfh', 'leave', 'holiday'],
    color: '#10B981',
    lightColor: 'text-[#10B981]'
  },
  {
    key: 'payroll_finance',
    label: 'Payroll & Loans',
    modules: ['payroll', 'loan', 'salary_structure', 'expense'],
    color: '#14B8A6',
    lightColor: 'text-[#14B8A6]'
  },
  {
    key: 'talent_operations',
    label: 'Talent & Assets',
    modules: ['recruitment', 'job', 'candidate', 'interview', 'performance', 'asset'],
    color: '#06B6D4',
    lightColor: 'text-[#06B6D4]'
  },
  {
    key: 'governance',
    label: 'Governance & Comms',
    modules: ['policy', 'announcement', 'notification', 'audit', 'settings', 'reports'],
    color: '#6366F1',
    lightColor: 'text-[#6366F1]'
  }
];

export function ModulePermissionDonut({ moduleCoverage = [] }) {
  const [activeCategoryKey, setActiveCategoryKey] = useState(null);

  // Group module coverage by category
  const categoryStats = useMemo(() => {
    return CATEGORY_CONFIGS.map((cat) => {
      let totalActions = 0;
      let assignedCount = 0;

      for (const item of moduleCoverage) {
        if (cat.modules.includes(item.module)) {
          totalActions += item.totalActions || 0;
          assignedCount += item.assignedInRoles || 0;
        }
      }

      // Default baseline if coverage has not loaded yet
      if (totalActions === 0) {
        totalActions = cat.modules.length * 4; // fallback average
      }

      return {
        ...cat,
        totalActions,
        assignedCount
      };
    });
  }, [moduleCoverage]);

  const grandTotal = categoryStats.reduce((sum, c) => sum + c.totalActions, 0) || 127;

  // Compute SVG Donut arc segments
  // Circumference = 2 * PI * r = 2 * 3.14159 * 42 ~= 263.89
  const radius = 42;
  const circumference = 2 * Math.PI * radius;

  let cumulativeOffset = 0;
  const segments = categoryStats.map((cat) => {
    const fraction = cat.totalActions / grandTotal;
    const strokeLength = fraction * circumference;
    const strokeDasharray = `${strokeLength} ${circumference - strokeLength}`;
    const strokeDashoffset = -cumulativeOffset;
    cumulativeOffset += strokeLength;

    return {
      ...cat,
      strokeDasharray,
      strokeDashoffset,
      fraction
    };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
      {/* SVG Donut Graphic */}
      <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full -rotate-90 transform"
          aria-label="Permission Categories Donut Chart"
        >
          {/* Background circle track */}
          <circle
            cx="50"
            cy="50"
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth="12"
            className="text-slate-100 dark:text-slate-800/60"
          />

          {/* Slices */}
          {segments.map((seg) => {
            const isHovered = activeCategoryKey === seg.key;
            return (
              <circle
                key={seg.key}
                cx="50"
                cy="50"
                r={radius}
                fill="transparent"
                stroke={seg.color}
                strokeWidth={isHovered ? '15' : '12'}
                strokeDasharray={seg.strokeDasharray}
                strokeDashoffset={seg.strokeDashoffset}
                strokeLinecap="round"
                className="transition-all duration-300 cursor-pointer"
                onMouseEnter={() => setActiveCategoryKey(seg.key)}
                onMouseLeave={() => setActiveCategoryKey(null)}
              />
            );
          })}
        </svg>

        {/* Center Text Summary */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none text-center">
          <Layers className="w-4 h-4 text-[#00C471] mb-0.5" />
          <span className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
            {activeCategoryKey
              ? categoryStats.find((c) => c.key === activeCategoryKey)?.totalActions
              : grandTotal}
          </span>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-slate-400 dark:text-slate-500">
            {activeCategoryKey
              ? categoryStats.find((c) => c.key === activeCategoryKey)?.label
              : 'Actions'}
          </span>
        </div>
      </div>

      {/* Interactive Legend */}
      <div className="flex-1 w-full space-y-1.5">
        <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
          Permission Categories Density
        </div>
        {categoryStats.map((cat) => {
          const isHovered = activeCategoryKey === cat.key;
          const percent = Math.round((cat.totalActions / grandTotal) * 100);

          return (
            <div
              key={cat.key}
              onMouseEnter={() => setActiveCategoryKey(cat.key)}
              onMouseLeave={() => setActiveCategoryKey(null)}
              className={cn(
                'flex items-center justify-between text-xs p-1.5 rounded-lg transition-all cursor-pointer',
                isHovered
                  ? 'bg-slate-100 dark:bg-[#1A3125]/60 ring-1 ring-[#00C471]/30 font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-[#111D17]'
              )}
            >
              <div className="flex items-center gap-2 truncate pr-2">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: cat.color }}
                />
                <span className="text-slate-700 dark:text-slate-300 truncate">
                  {cat.label}
                </span>
              </div>

              <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400 dark:text-slate-500 shrink-0">
                <span>{cat.totalActions} acts</span>
                <span className="w-8 text-right font-semibold text-slate-700 dark:text-slate-300">
                  {percent}%
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ModulePermissionDonut;
