/**
 * @file RoleStatsCards.jsx
 * @description 8 KPI summary cards for Roles & Permissions Access Governance.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 * Features live database-backed metrics and interactive directory filtering.
 */

import React from 'react';
import {
  Shield,
  CheckCircle2,
  Lock,
  Sparkles,
  Users,
  Layers,
  Sliders,
  Clock
} from 'lucide-react';
import { cn } from '../../../lib/utils.js';

export function RoleStatsCards({
  stats = {},
  isLoading = false,
  onFilterClick = null,
  activeFilter = 'ALL'
}) {
  const {
    totalRoles = 0,
    activeRoles = 0,
    systemRoles = 0,
    customRoles = 0,
    totalUsersWithRoles = 0,
    totalRegisteredPermissions = 127,
    averagePermissionsPerRole = 0,
    activeDelegations = 0
  } = stats;

  const cards = [
    {
      id: 'ALL',
      title: 'Total Roles',
      value: totalRoles,
      icon: Shield,
      description: 'Defined in catalogue',
      colorClass: 'text-slate-700 dark:text-slate-300',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
    },
    {
      id: 'ACTIVE',
      title: 'Active Roles',
      value: activeRoles,
      icon: CheckCircle2,
      description: 'In operation',
      colorClass: 'text-[#00C471] dark:text-[#00C471]',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40'
    },
    {
      id: 'SYSTEM',
      title: 'System Core',
      value: systemRoles,
      icon: Lock,
      description: 'Immutable identity',
      colorClass: 'text-amber-500 dark:text-amber-400',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40'
    },
    {
      id: 'CUSTOM',
      title: 'Custom Roles',
      value: customRoles,
      icon: Sparkles,
      description: 'Tenant created',
      colorClass: 'text-emerald-500 dark:text-emerald-400',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-brand border border-emerald-200/50 dark:border-emerald-800/40'
    },
    {
      id: 'ASSIGNED_STAFF',
      title: 'Assigned Staff',
      value: totalUsersWithRoles,
      icon: Users,
      description: 'Active users with roles',
      colorClass: 'text-indigo-500 dark:text-indigo-400',
      badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40'
    },
    {
      id: 'TOTAL_PERMS',
      title: 'Total Permissions',
      value: totalRegisteredPermissions,
      icon: Layers,
      description: 'Across 26 modules',
      colorClass: 'text-teal-500 dark:text-teal-400',
      badgeClass: 'bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-200/50 dark:border-teal-800/40'
    },
    {
      id: 'AVG_PERMS',
      title: 'Avg Perms/Role',
      value: averagePermissionsPerRole,
      icon: Sliders,
      description: 'Permission density',
      colorClass: 'text-cyan-500 dark:text-cyan-400',
      badgeClass: 'bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 border border-cyan-200/50 dark:border-cyan-800/40'
    },
    {
      id: 'DELEGATIONS',
      title: 'Delegations',
      value: activeDelegations,
      icon: Clock,
      description: 'Active coverage',
      colorClass: 'text-blue-500 dark:text-blue-400',
      badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="p-3.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] animate-pulse"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="h-3 w-14 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-6 w-6 bg-slate-200 dark:bg-slate-800 rounded-lg" />
            </div>
            <div className="h-6 w-10 bg-slate-200 dark:bg-slate-800 rounded mb-1" />
            <div className="h-2.5 w-16 bg-slate-100 dark:bg-slate-800/60 rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 mb-6">
      {cards.map((card) => {
        const Icon = card.icon;
        const isSelected = activeFilter === card.id;

        return (
          <div
            key={card.id}
            onClick={() => onFilterClick && onFilterClick(card.id)}
            role={onFilterClick ? 'button' : undefined}
            tabIndex={onFilterClick ? 0 : undefined}
            className={cn(
              'group p-3.5 rounded-xl border transition-all text-left select-none',
              onFilterClick ? 'cursor-pointer hover:-translate-y-0.5' : '',
              isSelected
                ? 'border-[#00C471] bg-emerald-50/40 dark:bg-[#061A14] shadow-sm ring-1 ring-[#00C471]/30'
                : 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:border-slate-300 dark:hover:border-[#00C471]/40'
            )}
          >
            <div className="flex items-center justify-between gap-1.5 mb-2">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-slate-500 dark:text-slate-400 truncate">
                {card.title}
              </span>
              <div
                className={cn(
                  'p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-105',
                  card.badgeClass
                )}
              >
                <Icon className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="text-xl font-bold font-mono tracking-tight text-slate-900 dark:text-white tabular-nums">
              {card.value}
            </div>

            <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
              {card.description}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default RoleStatsCards;
