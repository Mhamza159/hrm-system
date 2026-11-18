/**
 * @file DepartmentStatsCards.jsx
 * @description Dynamic KPI metric cards for department organizational structures.
 * Supports interactive filtering triggers and 7 comprehensive database-backed metrics.
 */

import React from 'react';
import {
  Building2,
  Network,
  Archive,
  Users,
  UserCheck,
  FolderMinus,
  UserX
} from 'lucide-react';

export function DepartmentStatsCards({ stats = {}, isLoading = false, onFilterClick = null }) {
  const {
    total = 0,
    active = 0,
    archived = 0,
    totalAssignedEmployees = 0,
    withEmployees = 0,
    withoutEmployees = 0,
    unassignedHeads = 0
  } = stats;

  const cards = [
    {
      id: 'TOTAL',
      title: 'Total Units',
      value: total,
      icon: Building2,
      description: 'Corporate divisions',
      colorClass: 'text-slate-700 dark:text-slate-300',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
    },
    {
      id: 'ACTIVE',
      title: 'Active Units',
      value: active,
      icon: Network,
      description: 'Operating divisions',
      colorClass: 'text-[#00C471] dark:text-[#00C471]',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40'
    },
    {
      id: 'ARCHIVED',
      title: 'Archived Units',
      value: archived,
      icon: Archive,
      description: 'In cold storage',
      colorClass: 'text-amber-500 dark:text-amber-400',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40'
    },
    {
      id: 'ASSIGNED_STAFF',
      title: 'Total Staff',
      value: totalAssignedEmployees,
      icon: Users,
      description: 'Allocated employees',
      colorClass: 'text-[#00C471]',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40'
    },
    {
      id: 'STAFFED',
      title: 'With Staff',
      value: withEmployees,
      icon: UserCheck,
      description: 'Units with ≥1 member',
      colorClass: 'text-blue-500 dark:text-blue-400',
      badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40'
    },
    {
      id: 'EMPTY',
      title: 'Empty Units',
      value: withoutEmployees,
      icon: FolderMinus,
      description: '0 staff assigned',
      colorClass: 'text-slate-500 dark:text-slate-400',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
    },
    {
      id: 'UNASSIGNED_HEADS',
      title: 'Unassigned Heads',
      value: unassignedHeads,
      icon: UserX,
      description: 'Missing leadership',
      colorClass: unassignedHeads > 0 ? 'text-rose-500' : 'text-slate-400',
      badgeClass: unassignedHeads > 0
        ? 'bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-800/40'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] p-3.5 animate-pulse flex flex-col justify-between"
          >
            <div className="w-6 h-6 rounded-lg bg-slate-100 dark:bg-[#1A3125]" />
            <div className="space-y-1">
              <div className="h-4 w-12 bg-slate-100 dark:bg-[#1A3125] rounded" />
              <div className="h-2 w-16 bg-slate-100 dark:bg-[#1A3125] rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {cards.map((card) => {
        const Icon = card.icon;
        const isInteractive = typeof onFilterClick === 'function';

        return (
          <div
            key={card.id}
            onClick={() => isInteractive && onFilterClick(card.id)}
            className={`group rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] p-3.5 shadow-xs transition-all duration-200 flex flex-col justify-between ${
              isInteractive
                ? 'cursor-pointer hover:border-[#00C471]/50 dark:hover:border-[#00C471]/50 hover:shadow-md'
                : ''
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wide text-slate-500 dark:text-slate-400 uppercase truncate">
                {card.title}
              </span>
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${card.badgeClass}`}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-2">
              <span className={`text-xl font-bold font-mono tabular-nums block ${card.colorClass}`}>
                {card.value}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 truncate block mt-0.5">
                {card.description}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
