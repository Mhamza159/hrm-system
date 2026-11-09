/**
 * @file CelebrationCard.jsx
 * @description Milestone card for birthdays and work anniversaries (BUILD-GUIDE Row 20.3).
 */

import React from 'react';
import { Cake, Sparkles, Calendar, Award } from 'lucide-react';

export const CelebrationCard = ({ celebration, isToday = false }) => {
  const { type, employee, yearsCompleted, daysRemaining, date } = celebration;
  const isBirthday = type === 'birthday';

  return (
    <div
      className={`p-4 rounded-2xl border transition-all ${
        isToday
          ? 'bg-gradient-to-r from-amber-500/10 via-pink-500/10 to-purple-500/10 border-amber-300 dark:border-amber-800 shadow-sm'
          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isBirthday
                ? 'bg-pink-500/10 text-pink-600 dark:text-pink-400'
                : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
            }`}
          >
            {isBirthday ? <Cake className="h-5 w-5" /> : <Award className="h-5 w-5" />}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100">
                {employee?.name || 'Valued Team Member'}
              </h4>
              {isToday ? (
                <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-amber-500 text-white animate-pulse">
                  Today! 🎉
                </span>
              ) : (
                daysRemaining !== undefined && (
                  <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                    in {daysRemaining} days
                  </span>
                )
              )}
            </div>

            <p className="text-[11px] text-slate-500 mt-0.5">
              {employee?.departmentId?.name || employee?.designation || 'Team Member'}
            </p>
          </div>
        </div>

        {date && (
          <span className="text-[11px] text-slate-400 flex items-center gap-1 shrink-0">
            <Calendar className="h-3 w-3" />
            {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>

      <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-amber-500" />
          {isBirthday
            ? 'Happy Birthday wishes!'
            : `Celebrating ${yearsCompleted} Year${yearsCompleted > 1 ? 's' : ''} Work Anniversary!`}
        </span>
      </div>
    </div>
  );
};

