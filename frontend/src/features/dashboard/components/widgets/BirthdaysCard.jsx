/**
 * @file BirthdaysCard.jsx
 * @description Upcoming team celebrations & birthdays card.
 */

import React from 'react';
import { Sparkles, User } from 'lucide-react';

export function BirthdaysCard({ birthdays = [] }) {
  return (
    <div className="space-y-4">

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
              className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#13221B] border border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-white dark:bg-[#162820] border border-slate-200 dark:border-[#1A3125] flex items-center justify-center shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-200 overflow-hidden">
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
