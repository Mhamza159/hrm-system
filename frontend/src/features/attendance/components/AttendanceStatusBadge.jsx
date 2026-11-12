/**
 * @file AttendanceStatusBadge.jsx
 * @description Accessible status badge for attendance presence states with live presence awareness (on_break, clocked_out, online/late with blinking icon).
 */

import React from 'react';
import { Coffee, Clock3, LogOut } from 'lucide-react';

const STATUS_CONFIG = {
  present: {
    label: 'Present',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
  },
  wfh: {
    label: 'WFH',
    className: 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-800/60'
  },
  late: {
    label: 'Late',
    className: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60'
  },
  half_day: {
    label: 'Half Day',
    className: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-800/60'
  },
  absent: {
    label: 'Absent',
    className: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800/60'
  },
  on_leave: {
    label: 'On Leave',
    className: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/40 dark:text-sky-400 dark:border-sky-800/60'
  },
  holiday: {
    label: 'Holiday',
    className: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60'
  }
};

export const AttendanceStatusBadge = ({
  status = 'present',
  flags = [],
  presence,
  checkOut,
  className = ''
}) => {
  const isWFH = flags?.includes('wfh') || status === 'wfh';

  // 1. Live State: On Break takes highest active precedence
  if (presence === 'on_break') {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/80 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800/70 shadow-2xs ${className}`}
        title="Employee is currently on an active break"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <Coffee className="w-3 h-3 text-amber-600 dark:text-amber-400" />
        <span>On Break</span>
      </span>
    );
  }

  // 2. Live State: Clocked Out
  if (presence === 'clocked_out' || Boolean(checkOut)) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 shadow-2xs ${className}`}
        title={status === 'late' ? 'Clocked out for the day (Arrived late)' : 'Clocked out for the day'}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-slate-400 dark:bg-slate-500" />
        <LogOut className="w-3 h-3 text-slate-500 dark:text-slate-400" />
        <span>Clocked Out</span>
      </span>
    );
  }

  // 3. Live State: Punched In Late (Actively working) -> Blinking Late Icon & Ping Dot
  if (status === 'late' || flags?.includes('late')) {
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60 shadow-2xs ${className}`}
        title="Active duty session — Arrived after shift grace period"
      >
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
        </span>
        <Clock3 className="w-3 h-3 text-amber-600 dark:text-amber-400 animate-pulse" />
        <span>Late</span>
      </span>
    );
  }

  // 4. Default / WFH / Present on time / Other Statuses
  const effectiveStatus = isWFH ? 'wfh' : status;
  const config = STATUS_CONFIG[effectiveStatus] || {
    label: (effectiveStatus || 'PRESENT').replace('_', ' ').toUpperCase(),
    className: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${config.className} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {isWFH ? '🏠 WFH' : config.label}
    </span>
  );
};
