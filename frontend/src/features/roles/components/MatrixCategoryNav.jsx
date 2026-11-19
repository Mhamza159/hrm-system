/**
 * @file MatrixCategoryNav.jsx
 * @description Category Quick-Jump Ribbon for Permission Matrix Studio.
 * Allows filtering or jumping directly across 5 functional domains.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  Users,
  Clock,
  BadgeDollarSign,
  Briefcase,
  ShieldCheck,
  Layers
} from 'lucide-react';
import { cn } from '../../../lib/utils.js';

export const MATRIX_CATEGORIES = [
  {
    key: 'ALL',
    label: 'All Modules',
    icon: Layers,
    modules: []
  },
  {
    key: 'core_hr',
    label: 'Core HR & Org',
    icon: Users,
    modules: ['auth', 'user', 'role', 'employee', 'department', 'designation', 'org']
  },
  {
    key: 'time_attendance',
    label: 'Time & Leaves',
    icon: Clock,
    modules: ['attendance', 'shift', 'wfh', 'leave', 'holiday']
  },
  {
    key: 'payroll_finance',
    label: 'Payroll & Loans',
    icon: BadgeDollarSign,
    modules: ['payroll', 'loan', 'salary_structure', 'expense']
  },
  {
    key: 'talent_operations',
    label: 'Talent & Assets',
    icon: Briefcase,
    modules: ['recruitment', 'job', 'candidate', 'interview', 'performance', 'asset']
  },
  {
    key: 'governance',
    label: 'Governance & Comms',
    icon: ShieldCheck,
    modules: ['policy', 'announcement', 'notification', 'audit', 'settings', 'reports']
  }
];

export function MatrixCategoryNav({
  activeCategory = 'ALL',
  onSelectCategory,
  categoryStats = {},
  totalActive = 0,
  totalPossible = 127
}) {
  return (
    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs select-none">
      {MATRIX_CATEGORIES.map((cat) => {
        const Icon = cat.icon;
        const isSelected = activeCategory === cat.key;
        const stats = categoryStats[cat.key] || { active: 0, total: 0 };
        const activeCount = cat.key === 'ALL' ? totalActive : stats.active;
        const totalCount = cat.key === 'ALL' ? totalPossible : stats.total;

        return (
          <button
            key={cat.key}
            type="button"
            onClick={() => onSelectCategory(cat.key)}
            className={cn(
              'group px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-2 cursor-pointer shadow-2xs border',
              isSelected
                ? 'bg-slate-900 text-white dark:bg-[#1A3125] dark:text-white border-slate-900 dark:border-[#00C471] ring-1 ring-[#00C471]/30 font-bold'
                : 'bg-white dark:bg-[#111D17] border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:border-slate-300 dark:hover:border-[#00C471]/30'
            )}
          >
            <Icon
              className={cn(
                'w-3.5 h-3.5 transition-colors',
                isSelected
                  ? 'text-[#00C471]'
                  : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-700 dark:group-hover:text-slate-300'
              )}
            />
            <span>{cat.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-mono font-semibold transition-all',
                isSelected
                  ? 'bg-white/20 dark:bg-[#00C471]/20 text-white dark:text-[#00C471]'
                  : activeCount > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-brand dark:text-[#00C471]'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              )}
            >
              {activeCount}/{totalCount}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export default MatrixCategoryNav;
