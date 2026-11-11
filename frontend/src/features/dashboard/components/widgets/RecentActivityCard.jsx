/**
 * @file RecentActivityCard.jsx
 * @description Recent audit-activity feed. items: [{ _id, actorName, actionLabel, createdAt }].
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { DashboardCard } from './DashboardCard.jsx';

const UNITS = [
  ['d', 86400],
  ['h', 3600],
  ['m', 60],
];

function relativeTime(iso) {
  const secs = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (Number.isNaN(secs)) return '';
  const [suffix, size] = UNITS.find(([, s]) => secs >= s) || [];
  return size ? `${Math.floor(secs / size)}${suffix} ago` : 'just now';
}

export function RecentActivityCard({ items = [], showViewAll = false, title = 'Recent Activity' }) {
  return (
    <DashboardCard title={title} live action={showViewAll ? { label: 'View All', to: '/audit-logs' } : undefined}>
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-[#162820]">
            <Activity className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No recent activity</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Actions will appear here as they happen.</p>
        </div>
      ) : (
        <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-[#1A3125]">
          {items.map((it) => (
            <li key={it._id} className="flex items-start gap-3 py-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400" aria-hidden="true">
                {(it.actorName || '?').slice(0, 2).toUpperCase()}
              </span>
              <p className="min-w-0 flex-1 text-xs text-slate-600 dark:text-slate-300">
                <span className="font-semibold text-slate-900 dark:text-white">{it.actorName || 'System'}</span>{' '}
                {it.actionLabel}
              </p>
              <time dateTime={it.createdAt} className="shrink-0 text-[11px] text-slate-400">
                {relativeTime(it.createdAt)}
              </time>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
