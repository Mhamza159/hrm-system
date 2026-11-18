/**
 * @file ShiftStatsCards.jsx
 * @description Dynamic KPI metric cards for corporate work shifts and roster scheduling.
 * Supports interactive filtering triggers and 7 comprehensive database-backed metrics.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  Clock,
  CheckCircle2,
  Archive,
  Users,
  UserCheck,
  UserMinus,
  Moon
} from 'lucide-react';

export function ShiftStatsCards({ stats = {}, isLoading = false, onFilterClick = null, activeTab = 'active' }) {
  const {
    total = 0,
    active = 0,
    archived = 0,
    totalAssignedEmployees = 0,
    withEmployees = 0,
    withoutEmployees = 0,
    nightShifts = 0
  } = stats;

  const cards = [
    {
      id: 'TOTAL',
      title: 'Total Shifts',
      value: total,
      icon: Clock,
      description: 'Defined schedules',
      colorClass: 'text-slate-700 dark:text-slate-300',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
    },
    {
      id: 'ACTIVE',
      title: 'Active Shifts',
      value: active,
      icon: CheckCircle2,
      description: 'In operation',
      colorClass: 'text-[#00C471] dark:text-[#00C471]',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40'
    },
    {
      id: 'ARCHIVED',
      title: 'Archived Shifts',
      value: archived,
      icon: Archive,
      description: 'Cold storage',
      colorClass: 'text-amber-500 dark:text-amber-400',
      badgeClass: 'bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40'
    },
    {
      id: 'ASSIGNED_STAFF',
      title: 'Assigned Staff',
      value: totalAssignedEmployees,
      icon: Users,
      description: 'Employees on roster',
      colorClass: 'text-[#00C471]',
      badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40'
    },
    {
      id: 'STAFFED',
      title: 'Staffed Shifts',
      value: withEmployees,
      icon: UserCheck,
      description: '≥1 member assigned',
      colorClass: 'text-blue-500 dark:text-blue-400',
      badgeClass: 'bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40'
    },
    {
      id: 'EMPTY',
      title: 'Empty Shifts',
      value: withoutEmployees,
      icon: UserMinus,
      description: '0 staff assigned',
      colorClass: 'text-slate-500 dark:text-slate-400',
      badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
    },
    {
      id: 'NIGHT',
      title: 'Night / Overnight',
      value: nightShifts,
      icon: Moon,
      description: 'Cross-midnight shifts',
      colorClass: 'text-indigo-500 dark:text-indigo-400',
      badgeClass: 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40'
    }
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className="animate-pulse bg-white/60 dark:bg-[#111D17]/80 rounded-2xl p-4 border border-slate-200/60 dark:border-[#1A3125] h-28"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 mb-6">
      {cards.map((card) => {
        const IconComponent = card.icon;
        const isClickable = Boolean(onFilterClick);
        const isArchivedCard = card.id === 'ARCHIVED';
        const isSelected = isArchivedCard && activeTab === 'archived';

        return (
          <div
            key={card.id}
            onClick={() => onFilterClick && onFilterClick(card.id)}
            role={isClickable ? 'button' : undefined}
            tabIndex={isClickable ? 0 : undefined}
            onKeyDown={(e) => {
              if (isClickable && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                onFilterClick(card.id);
              }
            }}
            className={`
              relative overflow-hidden group rounded-2xl p-4 transition-all duration-300
              bg-white/80 dark:bg-[#111D17]/90 backdrop-blur-md
              border ${isSelected ? 'border-amber-500 ring-2 ring-amber-500/20' : 'border-slate-200/70 dark:border-[#1A3125]'}
              hover:border-emerald-400/50 dark:hover:border-[#00C471]/50
              hover:shadow-lg hover:shadow-emerald-950/5 dark:hover:shadow-[#00C471]/5
              hover:-translate-y-0.5
              flex flex-col justify-between
              ${isClickable ? 'cursor-pointer select-none' : ''}
            `}
          >
            {/* Top Accent Gradient Line */}
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#00C471]/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-1 tracking-tight">
                {card.title}
              </span>
              <div
                className={`p-1.5 rounded-lg shrink-0 transition-transform group-hover:scale-110 ${card.badgeClass}`}
              >
                <IconComponent className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="mt-1">
              <div className="flex items-baseline gap-1.5">
                <span className={`text-2xl font-bold tracking-tight ${card.colorClass}`}>
                  {card.value.toLocaleString()}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                {card.description}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default ShiftStatsCards;
