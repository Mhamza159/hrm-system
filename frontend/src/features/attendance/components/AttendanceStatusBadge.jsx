/**
 * @file AttendanceStatusBadge.jsx
 * @description Accessible status badge for attendance presence states.
 */

import React from 'react';

const STATUS_CONFIG = {
  present: {
    label: 'Present',
    className: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60'
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

export const AttendanceStatusBadge = ({ status = 'present', className = '' }) => {
  const config = STATUS_CONFIG[status] || {
    label: status.replace('_', ' ').toUpperCase(),
    className: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-900 dark:text-slate-300 dark:border-slate-800'
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors ${config.className} ${className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5 opacity-80" />
      {config.label}
    </span>
  );
};
