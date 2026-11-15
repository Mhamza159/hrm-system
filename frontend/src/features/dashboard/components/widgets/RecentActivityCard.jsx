/**
 * @file RecentActivityCard.jsx
 * @description Recent audit-activity feed: who (avatar, name, role, designation · department)
 * did what, and when.
 * items: [{ _id, actorName, actorAvatar, actorRole, actorDesignation, actorDepartment, actionLabel, createdAt }].
 */

import React from 'react';
import { Activity } from 'lucide-react';
import { DashboardCard } from './DashboardCard.jsx';
import { PersonRow } from '../../../../components/common/Person.jsx';

const UNITS = [
  ['d', 86400],
  ['h', 3600],
  ['m', 60],
];

function relativeTime(iso) {
  const ms = new Date(iso).getTime();
  if (Number.isNaN(ms)) return '';
  const secs = Math.max(0, Math.floor((Date.now() - ms) / 1000));
  const [suffix, size] = UNITS.find(([, s]) => secs >= s) || [];
  return size ? `${Math.floor(secs / size)}${suffix} ago` : 'just now';
}

const absoluteTime = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

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
        <ul className="-me-1 max-h-[22rem] divide-y divide-[#EAECF0] overflow-y-auto pe-1 dark:divide-[#1A3125]">
          {items.map((it) => (
            <li key={it._id} className="py-3 first:pt-0 last:pb-0">
              <PersonRow
                size="sm"
                person={{
                  employeeName: it.actorName || 'System',
                  avatar: it.actorAvatar,
                  role: it.actorRole,
                  designation: it.actorDesignation,
                  department: it.actorDepartment,
                }}
                trailing={
                  <time dateTime={it.createdAt} title={absoluteTime(it.createdAt)} className="font-mono text-[11px] tabular-nums text-slate-400">
                    {relativeTime(it.createdAt)}
                  </time>
                }
              >
                <p className="mt-1 text-xs text-slate-700 first-letter:uppercase dark:text-slate-300">{it.actionLabel}</p>
              </PersonRow>
            </li>
          ))}
        </ul>
      )}
    </DashboardCard>
  );
}
