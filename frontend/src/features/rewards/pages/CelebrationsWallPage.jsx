/**
 * @file CelebrationsWallPage.jsx
 * @description Company Celebration Wall for Birthdays & Work Anniversaries (BUILD-GUIDE Row 20.3).
 */

import React, { useState } from 'react';
import { Cake, Award, Calendar, Sparkles, PartyPopper } from 'lucide-react';
import {
  useGetTodayCelebrationsQuery,
  useGetUpcomingCelebrationsQuery
} from '../rewardsApi.js';
import { CelebrationCard } from '../components/CelebrationCard.jsx';

export const CelebrationsWallPage = () => {
  const [daysLookahead, setDaysLookahead] = useState(30);

  const { data: todayRes, isLoading: isLoadingToday } = useGetTodayCelebrationsQuery();
  const { data: upcomingRes, isLoading: isLoadingUpcoming } = useGetUpcomingCelebrationsQuery(daysLookahead);

  const todayBirthdays = todayRes?.data?.birthdays || [];
  const todayAnniversaries = todayRes?.data?.anniversaries || [];
  const totalToday = todayBirthdays.length + todayAnniversaries.length;

  const upcomingList = upcomingRes?.data || [];

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-pink-500/10 text-pink-600 dark:text-pink-400 rounded-xl">
              <Cake className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Celebration Wall & Milestones
              </h1>
              <p className="text-xs text-slate-500">
                Celebrate team birthdays, work anniversaries, and company milestones
              </p>
            </div>
          </div>
        </div>

        {/* Lookahead Selector */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="text-xs text-slate-500 font-medium">Lookahead:</span>
          <select
            value={daysLookahead}
            onChange={(e) => setDaysLookahead(Number(e.target.value))}
            className="text-xs rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-3 py-1.5 text-slate-700 dark:text-slate-300"
          >
            <option value={15}>Next 15 Days</option>
            <option value={30}>Next 30 Days</option>
            <option value={60}>Next 60 Days</option>
            <option value={90}>Next 90 Days</option>
          </select>
        </div>
      </div>

      {/* Today's Celebrations Spotlight */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-xl">🎉</span>
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Today's Celebrations
            </h2>
            <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400">
              {totalToday} today
            </span>
          </div>

          <span className="text-xs text-slate-400">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
        </div>

        {isLoadingToday ? (
          <div className="py-8 flex items-center justify-center text-xs text-slate-400">
            Checking today's milestones...
          </div>
        ) : totalToday === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No birthdays or work anniversaries occurring today.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayBirthdays.map((item, idx) => (
              <CelebrationCard key={`bday-${idx}`} celebration={item} isToday={true} />
            ))}
            {todayAnniversaries.map((item, idx) => (
              <CelebrationCard key={`anni-${idx}`} celebration={item} isToday={true} />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Milestones */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
              Upcoming in the next {daysLookahead} Days ({upcomingList.length})
            </h3>
          </div>
        </div>

        {isLoadingUpcoming ? (
          <div className="py-12 flex items-center justify-center text-xs text-slate-400">
            Loading upcoming milestones...
          </div>
        ) : upcomingList.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-slate-800 rounded-2xl">
            No upcoming milestones found in the next {daysLookahead} days.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {upcomingList.map((item, idx) => (
              <CelebrationCard key={`up-${idx}`} celebration={item} isToday={false} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

