/**
 * @file LeaveBalanceCards.jsx
 * @description Category-wise Leave Quota & Live Balance cards with progress bars (BUILD-GUIDE Row 6.9).
 * 
 * SPECIFICATION:
 * - Module: M6 Leave & Holidays
 * - Component: LeaveBalanceCards
 * - Theme: Linear Dark Craft (#090A0F, #0F111A, #1E2235, #5E6AD2)
 */

import React from 'react';
import { Calendar, AlertCircle, Clock, CheckCircle2, Info } from 'lucide-react';
import { useGetLeaveBalanceQuery } from '../leavesApi.js';
import { cn } from '../../../lib/utils.js';

const CATEGORY_COLORS = {
  ANNUAL: {
    badge: 'bg-indigo-50 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-300 border-indigo-200 dark:border-indigo-800/60',
    bar: 'bg-indigo-600 dark:bg-indigo-500',
    text: 'text-indigo-600 dark:text-indigo-400'
  },
  CASUAL: {
    badge: 'bg-cyan-50 dark:bg-cyan-950/50 text-cyan-700 dark:text-cyan-300 border-cyan-200 dark:border-cyan-800/60',
    bar: 'bg-cyan-600 dark:bg-cyan-500',
    text: 'text-cyan-600 dark:text-cyan-400'
  },
  SICK: {
    badge: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60',
    bar: 'bg-amber-500',
    text: 'text-amber-600 dark:text-amber-400'
  },
  MATERNITY: {
    badge: 'bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800/60',
    bar: 'bg-rose-500',
    text: 'text-rose-600 dark:text-rose-400'
  },
  PATERNITY: {
    badge: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-800/60',
    bar: 'bg-blue-500',
    text: 'text-blue-600 dark:text-blue-400'
  },
  HAJJ: {
    badge: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
    bar: 'bg-[#00C471]',
    text: 'text-emerald-600 dark:text-emerald-400'
  },
  UNPAID: {
    badge: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    bar: 'bg-slate-500',
    text: 'text-slate-600 dark:text-slate-400'
  }
};

export function LeaveBalanceCards({ employeeId, year, onApplyClick }) {
  const queryParams = {};
  if (employeeId) queryParams.employeeId = employeeId;
  if (year) queryParams.year = year;

  const { data: response, isLoading, isError, error } = useGetLeaveBalanceQuery(queryParams);
  const balanceData = response?.data;
  const balances = balanceData?.balances || [];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125] p-5 shadow-xs relative overflow-hidden flex flex-col justify-between h-44"
          >
            <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 dark:via-emerald-400/5 to-transparent animate-shimmer pointer-events-none" />
            <div className="flex items-center justify-between">
              <div className="h-4 w-28 bg-slate-200 dark:bg-[#1A3125] rounded-md animate-pulse" />
              <div className="h-5 w-16 bg-slate-100 dark:bg-[#162820] rounded-full animate-pulse" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-20 bg-slate-200 dark:bg-[#1A3125] rounded-lg animate-pulse" />
              <div className="h-2 w-full bg-slate-100 dark:bg-[#162820] rounded-full animate-pulse" />
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-[#1A3125]/60">
              <div className="h-3 w-16 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
              <div className="h-3 w-16 bg-slate-100 dark:bg-[#162820] rounded-md animate-pulse" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/20 p-4 flex items-center gap-3 text-rose-700 dark:text-rose-300 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 dark:text-rose-400" />
        <span>Failed to load leave balances: {error?.data?.message || 'Server error'}</span>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-8 text-center text-slate-500 dark:text-slate-400 shadow-xs">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-400 dark:text-slate-600" />
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">No Leave Quotas Allocated</p>
        <p className="text-xs text-slate-400 mt-1">No leave allowances allocated for year {balanceData?.year || new Date().getFullYear()}.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {balances.map((item) => {
        const type = item.leaveType || {};
        const code = (type.code || 'UNPAID').toUpperCase();
        const colors = CATEGORY_COLORS[code] || {
          badge: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60',
          bar: 'bg-[#00C471]',
          text: 'text-[#00C471]'
        };

        const totalEntitlement = item.totalEntitlement || 0;
        const used = item.usedDays || 0;
        const pending = item.pendingDays || 0;
        const available = item.availableDays ?? Math.max(0, totalEntitlement - used - pending);
        const usedPct = totalEntitlement > 0 ? Math.min(100, Math.round((used / totalEntitlement) * 100)) : 0;
        const pendingPct = totalEntitlement > 0 ? Math.min(100 - usedPct, Math.round((pending / totalEntitlement) * 100)) : 0;

        return (
          <div
            key={type._id || code}
            className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-5 shadow-xs hover:shadow-md hover:border-emerald-500/40 dark:hover:border-emerald-500/40 transition-all flex flex-col justify-between relative overflow-hidden group"
          >
            {/* Header: Title & Code Badge */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-bold text-slate-900 dark:text-slate-100 tracking-tight truncate">
                  {type.name || code}
                </span>
                <span
                  className={cn(
                    'text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border shrink-0',
                    colors.badge
                  )}
                >
                  {code}
                </span>
              </div>

              {/* Available Days Metric */}
              <div className="flex items-baseline gap-2 mt-3">
                <span className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-slate-100 tabular-nums">
                  {available}
                </span>
                <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                  / {totalEntitlement} days available
                </span>
              </div>
            </div>

            {/* Stacked Progress Bar: Used (Solid) + Pending (Striped/Muted) */}
            <div className="mt-4">
              <div className="w-full bg-slate-100 dark:bg-[#0A110D] h-2 rounded-full overflow-hidden flex border border-slate-200/50 dark:border-transparent">
                <div
                  className={cn('h-full transition-all duration-500', colors.bar)}
                  style={{ width: `${usedPct}%` }}
                  title={`Used: ${used} days`}
                />
                <div
                  className="h-full bg-amber-500/70 transition-all duration-500"
                  style={{ width: `${pendingPct}%` }}
                  title={`In Review: ${pending} days`}
                />
              </div>

              {/* Breakdown Row */}
              <div className="grid grid-cols-4 gap-1 mt-3 pt-3 border-t border-slate-100 dark:border-[#1A3125] text-[11px] text-slate-500 dark:text-slate-400">
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">Quota</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">{item.allocatedDays || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">Carried</span>
                  <span className="font-semibold text-slate-800 dark:text-slate-200">+{item.carriedForwardDays || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">Used</span>
                  <span className="font-semibold text-rose-600 dark:text-rose-400">{used}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-400 dark:text-slate-500 uppercase font-medium">Pending</span>
                  <span className="font-semibold text-amber-600 dark:text-amber-400">{pending}</span>
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default LeaveBalanceCards;
