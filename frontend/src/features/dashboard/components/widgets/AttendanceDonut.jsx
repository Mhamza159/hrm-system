/**
 * @file AttendanceDonut.jsx
 * @description Today's attendance ring. breakdown: { present, late, half_day, on_leave, absent }.
 */

import React from 'react';
import { Users } from 'lucide-react';
import { DashboardCard } from './DashboardCard.jsx';

// DESIGN.md §4 badge colours: present emerald, late amber, on leave blue, absent rose, half day cyan.
const SEGMENTS = [
  { key: 'present', label: 'Present', color: '#10B981' },
  { key: 'late', label: 'Late', color: '#F59E0B' },
  { key: 'on_leave', label: 'On Leave', color: '#3B82F6' },
  { key: 'absent', label: 'Absent', color: '#F43F5E' },
  { key: 'half_day', label: 'Half Day', color: '#06B6D4' },
];
const R = 40;
const C = 2 * Math.PI * R;

export function AttendanceDonut({ breakdown = {}, title = "Today's Attendance" }) {
  const total = SEGMENTS.reduce((sum, s) => sum + (breakdown[s.key] || 0), 0);
  let offset = 0;

  return (
    <DashboardCard title={title}>
      {total === 0 ? (
        <div className="py-8 text-center">
          <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-[#162820]">
            <Users className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No attendance recorded yet</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{"Today's breakdown will show here."}</p>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-6">
          <svg
            viewBox="0 0 100 100"
            className="h-32 w-32 shrink-0"
            role="img"
            aria-label={`Attendance today: ${SEGMENTS.map((s) => `${breakdown[s.key] || 0} ${s.label}`).join(', ')}`}
          >
            <g transform="rotate(-90 50 50)">
              {SEGMENTS.map((s) => {
                const len = ((breakdown[s.key] || 0) / total) * C;
                if (!len) return null;
                const circle = (
                  <circle
                    key={s.key}
                    cx="50"
                    cy="50"
                    r={R}
                    fill="none"
                    stroke={s.color}
                    strokeWidth="12"
                    strokeDasharray={`${len} ${C - len}`}
                    strokeDashoffset={-offset}
                  />
                );
                offset += len;
                return circle;
              })}
            </g>
            <text x="50" y="50" textAnchor="middle" dominantBaseline="central" className="fill-slate-900 font-mono text-[18px] font-semibold dark:fill-white">
              {total}
            </text>
          </svg>
          <ul className="min-w-[8rem] flex-1 space-y-2">
            {SEGMENTS.map((s) => (
              <li key={s.key} className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ backgroundColor: s.color }} aria-hidden="true" />
                <span className="flex-1">{s.label}</span>
                <span className="font-mono font-semibold tabular-nums text-slate-900 dark:text-white">{breakdown[s.key] || 0}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </DashboardCard>
  );
}
