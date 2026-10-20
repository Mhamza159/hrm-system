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
    badge: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
    bar: 'bg-indigo-500',
    text: 'text-indigo-400'
  },
  CASUAL: {
    badge: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
    bar: 'bg-cyan-500',
    text: 'text-cyan-400'
  },
  SICK: {
    badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    bar: 'bg-amber-500',
    text: 'text-amber-400'
  },
  MATERNITY: {
    badge: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    bar: 'bg-rose-500',
    text: 'text-rose-400'
  },
  PATERNITY: {
    badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    bar: 'bg-blue-500',
    text: 'text-blue-400'
  },
  HAJJ: {
    badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    bar: 'bg-emerald-500',
    text: 'text-emerald-400'
  },
  UNPAID: {
    badge: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
    bar: 'bg-slate-500',
    text: 'text-slate-400'
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-[#0F111A] border border-[#1E2235]/60 p-5" />
        ))}
      </div>
    );
  }

  if (isError) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-4 flex items-center gap-3 text-red-400 text-sm">
        <AlertCircle className="w-5 h-5 shrink-0" />
        <span>Failed to load leave balances: {error?.data?.message || 'Server error'}</span>
      </div>
    );
  }

  if (balances.length === 0) {
    return (
      <div className="rounded-2xl border border-[#1E2235] bg-[#0F111A] p-6 text-center text-slate-400">
        <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-600" />
        <p className="text-sm">No leave quotas allocated for year {balanceData?.year || new Date().getFullYear()}.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {balances.map((item) => {
        const type = item.leaveType || {};
        const code = (type.code || 'UNPAID').toUpperCase();
        const colors = CATEGORY_COLORS[code] || {
          badge: 'bg-[#5E6AD2]/10 text-[#5E6AD2] border-[#5E6AD2]/20',
          bar: 'bg-[#5E6AD2]',
          text: 'text-[#5E6AD2]'
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
            className="rounded-2xl border border-[#1E2235] bg-[#0F111A] p-5 shadow-sm hover:border-[#2A304D] transition-all flex flex-col justify-between relative overflow-hidden group"
          >
            {/* Header: Title & Code Badge */}
            <div>
              <div className="flex items-center justify-between gap-2 mb-2">
                <span className="text-sm font-semibold text-white tracking-tight truncate">
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
                <span className="text-3xl font-extrabold tracking-tight text-white tabular-nums">
                  {available}
                </span>
                <span className="text-xs font-medium text-slate-400">
                  / {totalEntitlement} days available
                </span>
              </div>
            </div>

            {/* Stacked Progress Bar: Used (Solid) + Pending (Striped/Muted) */}
            <div className="mt-4">
              <div className="w-full bg-[#161926] h-2 rounded-full overflow-hidden flex">
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
              <div className="grid grid-cols-4 gap-1 mt-3 pt-3 border-t border-[#1E2235]/60 text-[11px] text-slate-400">
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Quota</span>
                  <span className="font-semibold text-slate-200">{item.allocatedDays || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Carried</span>
                  <span className="font-semibold text-slate-200">+{item.carriedForwardDays || 0}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Used</span>
                  <span className="font-semibold text-rose-400">{used}</span>
                </div>
                <div>
                  <span className="block text-[10px] text-slate-500 uppercase">Pending</span>
                  <span className="font-semibold text-amber-400">{pending}</span>
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
