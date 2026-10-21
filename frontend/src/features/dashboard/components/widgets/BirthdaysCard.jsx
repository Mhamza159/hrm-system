/**
 * @file BirthdaysCard.jsx
 * @description Upcoming team celebrations & birthdays card.
 */

import React from 'react';
import { Cake, Sparkles, User } from 'lucide-react';

export function BirthdaysCard({ birthdays = [], title = 'Upcoming Birthdays' }) {
  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-pink-50 dark:bg-pink-950/40 border border-pink-200 dark:border-pink-800/40 text-pink-600 dark:text-pink-400">
            <Cake className="w-4 h-4" />
          </div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">{title}</h3>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">Next 14 Days</span>
      </div>

      <div className="space-y-3 max-h-72 overflow-y-auto">
        {birthdays.length === 0 ? (
          <div className="py-8 text-center space-y-1.5">
            <Sparkles className="w-6 h-6 text-slate-300 dark:text-slate-600 mx-auto" />
            <p className="text-xs text-slate-500 dark:text-slate-400">No birthdays in the next two weeks.</p>
          </div>
        ) : (
          birthdays.map((b) => (
            <div
              key={b._id}
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-200 overflow-hidden">
                  {b.avatar ? (
                    <img src={b.avatar} alt={b.name} className="w-full h-full object-cover" />
                  ) : (
                    b.name?.slice(0, 2).toUpperCase() || <User className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{b.name}</p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{b.department}</p>
                </div>
              </div>

              <div className="text-right shrink-0">
                <span className="text-xs font-semibold text-pink-600 dark:text-pink-400 block">{b.birthDate}</span>
                <span className="text-[10px] text-slate-400">
                  {b.daysRemaining === 0 ? 'Today! 🎉' : `in ${b.daysRemaining}d`}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
