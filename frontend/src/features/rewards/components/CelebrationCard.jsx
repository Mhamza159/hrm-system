/**
 * @file CelebrationCard.jsx
 * @description Milestone card for birthdays and work anniversaries (BUILD-GUIDE Row 20.3).
 */

import React from 'react';
import { Cake, Sparkles, Calendar, Award, Send } from 'lucide-react';
import { usePermission } from '../../../hooks/usePermission.js';

export const CelebrationCard = ({ celebration, isToday = false, onSendKudos }) => {
  const { can, isSuperAdmin } = usePermission();
  const canKudos = isSuperAdmin || can('rewards.kudos', 'Rewards');

  const { type, employee, yearsCompleted, daysRemaining, date } = celebration;
  const isBirthday = type === 'birthday';

  const employeeName = employee?.name || 'Team Member';
  const employeeRole = employee?.designation || employee?.departmentId?.name || 'Staff';
  const employeeId = employee?._id;

  const handleKudosClick = () => {
    if (onSendKudos && employeeId) {
      onSendKudos(employeeId, isBirthday ? 'Rockstar' : 'Above & Beyond');
    }
  };

  return (
    <div
      className={`p-4 rounded-2xl border transition-all flex flex-col justify-between ${
        isToday
          ? 'bg-[#111D17] border-[#00C471]/40 shadow-lg shadow-[#00C471]/5 ring-1 ring-[#00C471]/30'
          : 'bg-white dark:bg-[#111D17] border-slate-200 dark:border-[#1A3125] hover:border-slate-300 dark:hover:border-[#2D4A3A]'
      }`}
    >
      <div>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Celebration Icon */}
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                isBirthday
                  ? 'bg-rose-500/10 text-rose-500 border-rose-500/20'
                  : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
              }`}
            >
              {isBirthday ? <Cake className="h-5 w-5" /> : <Award className="h-5 w-5" />}
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="text-xs font-bold text-slate-900 dark:text-[#F8FAFC] truncate">
                  {employeeName}
                </h4>
                {isToday ? (
                  <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-full bg-[#00C471] text-white shadow-sm">
                    Today! 🎉
                  </span>
                ) : (
                  daysRemaining !== undefined && (
                    <span
                      className={`px-2 py-0.5 text-[10px] font-mono rounded-full font-medium ${
                        daysRemaining === 0
                          ? 'bg-[#00C471] text-white'
                          : daysRemaining === 1
                          ? 'bg-amber-500/15 text-amber-500 border border-amber-500/30'
                          : 'bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-[#CBD5E1]'
                      }`}
                    >
                      {daysRemaining === 0 ? 'Today' : daysRemaining === 1 ? 'Tomorrow' : `in ${daysRemaining} days`}
                    </span>
                  )
                )}
              </div>

              <p className="text-[11px] text-slate-500 dark:text-[#7E9E8F] truncate mt-0.5">
                {employeeRole}
              </p>
            </div>
          </div>

          {date && (
            <span className="text-[11px] text-slate-400 dark:text-[#7E9E8F] font-mono flex items-center gap-1 shrink-0">
              <Calendar className="h-3 w-3 text-slate-400" />
              {new Date(date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </span>
          )}
        </div>

        {/* Milestone Description */}
        <div className="mt-3.5 pt-2.5 border-t border-slate-100 dark:border-[#1A3125] flex items-center gap-1.5 text-xs">
          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
            {isBirthday
              ? 'Happy Birthday wishes!'
              : `Celebrating ${yearsCompleted || 1} Year${(yearsCompleted || 1) > 1 ? 's' : ''} Work Anniversary!`}
          </span>
        </div>
      </div>

      {/* Action Footer: Send Kudos */}
      {canKudos && onSendKudos && (
        <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1A3125] flex items-center justify-end">
          <button
            type="button"
            onClick={handleKudosClick}
            className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold bg-[#00C471]/10 hover:bg-[#00C471]/20 text-[#00C471] transition-colors"
          >
            <Send className="h-3 w-3" />
            <span>Wish Colleague</span>
          </button>
        </div>
      )}
    </div>
  );
};
