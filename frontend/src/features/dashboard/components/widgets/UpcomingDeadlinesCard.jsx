/**
 * @file UpcomingDeadlinesCard.jsx
 * @description Upcoming deadlines list. items: [{ _id, type, title, date, link }].
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarClock } from 'lucide-react';
import { DashboardCard } from './DashboardCard.jsx';

const TYPE_PILL = {
  probation: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-800/60',
  job: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-800/60',
  project: 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/40 dark:text-violet-400 dark:border-violet-800/60',
  review: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/40 dark:text-teal-400 dark:border-teal-800/60',
  checklist: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800/50 dark:text-slate-300 dark:border-slate-700',
};

const part = (d, opts) => new Intl.DateTimeFormat('en-US', { timeZone: 'Asia/Karachi', ...opts }).format(d);

export function UpcomingDeadlinesCard({ items = [], title = 'Upcoming Deadlines' }) {
  return (
    <DashboardCard title={title}>
      {items.length === 0 ? (
        <div className="py-8 text-center">
          <span className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 dark:bg-[#162820]">
            <CalendarClock className="h-5 w-5 text-slate-400" aria-hidden="true" />
          </span>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200">No upcoming deadlines</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">Nothing is due soon.</p>
        </div>
      ) : (
        <ul className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-[#1A3125]">
          {items.map((it) => {
            const d = new Date(it.date);
            const validDate = it.date && !Number.isNaN(d.getTime());
            return (
              <li key={it._id}>
                <Link to={it.link} className="flex items-center gap-3 py-3 hover:opacity-80">
                  <span className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl bg-slate-50 dark:bg-[#162820]">
                    <span className="text-[10px] font-semibold uppercase text-slate-500 dark:text-slate-400">{validDate ? part(d, { month: 'short' }) : '--'}</span>
                    <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{validDate ? part(d, { day: '2-digit' }) : '--'}</span>
                  </span>
                  <span className="min-w-0 flex-1 truncate text-xs font-semibold text-slate-900 dark:text-white">{it.title}</span>
                  <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold capitalize ${TYPE_PILL[it.type] || TYPE_PILL.checklist}`}>
                    {it.type}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </DashboardCard>
  );
}
