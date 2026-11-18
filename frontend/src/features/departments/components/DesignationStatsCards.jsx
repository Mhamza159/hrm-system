/**
 * @file DesignationStatsCards.jsx
 * @description Dynamic KPI metric cards for corporate job designations and organizational hierarchy.
 * Supports interactive filtering triggers and 7 comprehensive database-backed metrics.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  Award,
  Briefcase,
  Archive,
  Users,
  UserCheck,
  FolderMinus,
  Building2
} from 'lucide-react';

export function DesignationStatsCards({ stats = {}, isLoading = false, onFilterClick = null }) {
  const {
    total = 0,
    active = 0,
    archived = 0,
    totalAssignedEmployees = 0,
    withEmployees = 0,
    withoutEmployees = 0,
    departmentsCount = 0
  } = stats;

  const cards = [
    {
      id: 'TOTAL',
      title: 'Total Titles',
      value: total,
      icon: Award,
      description: 'Corporate roles',
      colorClass: 'text-slate-700 dark:text-slate-300',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
    },
    {
      id: 'ACTIVE',
      title: 'Active Titles',
      value: active,
      icon: Briefcase,
      description: 'Operational roles',
      colorClass: 'text-[#00C471] dark:text-[#00C471]',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40'
    },
    {
      id: 'ARCHIVED',
      title: 'Archived Titles',
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
      description: 'Staff assigned',
      colorClass: 'text-[#00C471]',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40'
    },
    {
      id: 'STAFFED',
      title: 'With Staff',
      value: withEmployees,
      icon: UserCheck,
      description: 'Roles with ≥1 member',
      colorClass: 'text-blue-500 dark:text-blue-400',
      badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40'
    },
    {
      id: 'EMPTY',
      title: 'Empty Roles',
      value: withoutEmployees,
      icon: FolderMinus,
      description: '0 staff assigned',
      colorClass: 'text-slate-500 dark:text-slate-400',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
    },
    {
      id: 'DEPARTMENTS',
      title: 'Divisions Used',
      value: departmentsCount,
      icon: Building2,
      description: 'Linked departments',
      colorClass: 'text-purple-500 dark:text-purple-400',
      badgeClass: 'bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-3.5 animate-pulse"
          >
            <div className="h-3 w-16 bg-slate-100 dark:bg-[#1A3125] rounded mb-2" />
            <div className="h-6 w-10 bg-slate-200 dark:bg-[#1A3125] rounded mb-1" />
            <div className="h-2 w-20 bg-slate-100 dark:bg-[#1A3125] rounded" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isClickable = Boolean(onFilterClick);

        return (
          <div
            key={card.id}
            onClick={() => isClickable && onFilterClick(card.id)}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onFilterClick(card.id);
              }
            }}
            className={`group relative rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-3.5 transition-all duration-200 hover:shadow-xs hover:border-emerald-500/40 dark:hover:border-emerald-500/30 ${
              isClickable ? 'cursor-pointer hover:-translate-y-0.5' : ''
            }`}
          >
            {/* Header: Title and Icon */}
            <div className="flex items-center justify-between gap-1.5 mb-1.5">
              <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                {card.title}
              </span>
              <div
                className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 transition-colors ${card.badgeClass}`}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </div>

            {/* Value Counter */}
            <div className="flex items-baseline gap-1">
              <span
                className={`text-xl font-bold font-mono tracking-tight ${card.colorClass}`}
              >
                {card.value.toLocaleString()}
              </span>
            </div>

            {/* Description Subtext */}
            <p className="text-[10px] text-slate-600 dark:text-slate-400 truncate mt-0.5">
              {card.description}
            </p>

            {/* Subtle Hover Indicator */}
            {isClickable && (
              <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-transparent via-[#00C471]/0 group-hover:via-[#00C471] to-transparent transition-all duration-300 rounded-b-xl" />
            )}
          </div>
        );
      })}
    </div>
  );
}
