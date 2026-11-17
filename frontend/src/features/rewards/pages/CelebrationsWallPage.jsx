/**
 * @file CelebrationsWallPage.jsx
 * @description Company Celebration Wall for Birthdays & Work Anniversaries (BUILD-GUIDE Row 20.3).
 */

import React, { useState, useMemo } from "react";
import { Cake, Award, Calendar, PartyPopper, Search, X } from "lucide-react";
import {
  useGetTodayCelebrationsQuery,
  useGetUpcomingCelebrationsQuery,
} from "../rewardsApi.js";
import { CelebrationCard } from "../components/CelebrationCard.jsx";
import { GiveKudosModal } from "../components/GiveKudosModal.jsx";

export const CelebrationsWallPage = () => {
  const [daysLookahead, setDaysLookahead] = useState(30);
  const [searchQuery, setSearchQuery] = useState("");

  // Kudos modal bridge state
  const [isKudosOpen, setIsKudosOpen] = useState(false);
  const [kudosReceiverId, setKudosReceiverId] = useState("");
  const [kudosBadge, setKudosBadge] = useState("Rockstar");

  const { data: todayRes, isLoading: isLoadingToday } =
    useGetTodayCelebrationsQuery();
  const { data: upcomingRes, isLoading: isLoadingUpcoming } =
    useGetUpcomingCelebrationsQuery(daysLookahead);

  const todayBirthdays = todayRes?.data?.birthdays || [];
  const todayAnniversaries = todayRes?.data?.anniversaries || [];
  const totalToday = todayBirthdays.length + todayAnniversaries.length;

  const rawUpcoming = upcomingRes?.data || [];
  const upcomingList = Array.isArray(rawUpcoming) ? rawUpcoming : [];

  // Filter upcoming by search query
  const filteredUpcoming = useMemo(() => {
    if (!searchQuery.trim()) return upcomingList;
    const q = searchQuery.toLowerCase();
    return upcomingList.filter((item) => {
      const name = (item.employee?.name || "").toLowerCase();
      const dept = (item.employee?.departmentId?.name || "").toLowerCase();
      const desig = (item.employee?.designation || "").toLowerCase();
      return name.includes(q) || dept.includes(q) || desig.includes(q);
    });
  }, [upcomingList, searchQuery]);

  // Tenure anniversaries count
  const anniversariesCount = useMemo(() => {
    return upcomingList.filter((item) => item.type === "anniversary").length;
  }, [upcomingList]);

  const handleOpenKudos = (employeeId, badge = "Rockstar") => {
    setKudosReceiverId(employeeId);
    setKudosBadge(badge);
    setIsKudosOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#00C471]/10 text-[#00C471] rounded-2xl border border-[#00C471]/20">
            <Cake className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-[#F8FAFC] tracking-tight">
              Celebration Wall & Milestones
            </h1>
            <p className="text-xs text-slate-500 dark:text-[#7E9E8F]">
              Celebrate team birthdays, work anniversaries, and company
              milestone moments
            </p>
          </div>
        </div>

        {/* Lookahead Selector Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto bg-slate-100 dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] p-1 rounded-xl">
          <span className="text-[11px] text-slate-500 dark:text-[#7E9E8F] px-2 font-medium">
            Window:
          </span>
          {[15, 30, 60, 90].map((days) => (
            <button
              key={days}
              onClick={() => setDaysLookahead(days)}
              className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
                daysLookahead === days
                  ? "bg-[#00C471] text-white shadow-sm"
                  : "text-slate-600 dark:text-[#7E9E8F] hover:bg-white dark:hover:bg-[#1A3125]"
              }`}
            >
              {days}d
            </button>
          ))}
        </div>
      </div>

      {/* Overview KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Celebrating Today
            </span>
            <PartyPopper className="h-4 w-4 text-[#00C471]" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {totalToday}
            </span>
            <span className="text-[11px] text-[#00C471] font-medium">
              Active today
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Upcoming Milestones
            </span>
            <Calendar className="h-4 w-4 text-amber-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {upcomingList.length}
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              Next {daysLookahead} days
            </span>
          </div>
        </div>

        <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-[#7E9E8F]">
              Work Anniversaries
            </span>
            <Award className="h-4 w-4 text-violet-500" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-[#F8FAFC]">
              {anniversariesCount}
            </span>
            <span className="text-[11px] text-violet-500 font-medium">
              Tenure celebrations
            </span>
          </div>
        </div>
      </div>

      {/* Today's Celebrations Spotlight */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🎉</span>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-[#F8FAFC]">
                Today's Celebrations
              </h2>
              <p className="text-xs text-slate-400 dark:text-[#7E9E8F]">
                {new Date().toLocaleDateString(undefined, {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          <span className="px-3 py-1 text-xs font-bold rounded-full bg-[#00C471]/10 text-[#00C471] border border-[#00C471]/20 font-mono">
            {totalToday} celebrating
          </span>
        </div>

        {isLoadingToday ? (
          <div className="py-10 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#00C471] border-t-transparent" />
            <span>Checking today's milestones...</span>
          </div>
        ) : totalToday === 0 ? (
          <div className="py-10 text-center text-xs text-slate-400 dark:text-[#7E9E8F] border border-dashed border-slate-200 dark:border-[#1A3125] rounded-2xl p-6">
            <Calendar className="h-8 w-8 mx-auto text-slate-300 dark:text-[#1A3125] mb-2" />
            <p className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
              No birthdays or work anniversaries occurring today
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Check out the upcoming celebrations below to plan ahead!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {todayBirthdays.map((item, idx) => (
              <CelebrationCard
                key={`bday-${idx}`}
                celebration={item}
                isToday={true}
                onSendKudos={handleOpenKudos}
              />
            ))}
            {todayAnniversaries.map((item, idx) => (
              <CelebrationCard
                key={`anni-${idx}`}
                celebration={item}
                isToday={true}
                onSendKudos={handleOpenKudos}
              />
            ))}
          </div>
        )}
      </div>

      {/* Upcoming Milestones */}
      <div className="bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl p-6 sm:p-8 shadow-sm space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-[#00C471]" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#F8FAFC]">
              Upcoming in the next {daysLookahead} Days ({upcomingList.length})
            </h3>
          </div>

          {/* Search Filter */}
          <div className="relative max-w-xs w-full">
            <Search className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#7E9E8F]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search upcoming celebrants..."
              className="w-full text-xs pl-9 pr-8 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#0A110D] text-slate-900 dark:text-[#F8FAFC] focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {isLoadingUpcoming ? (
          <div className="py-14 flex flex-col items-center justify-center text-xs text-slate-400 gap-2">
            <div className="animate-spin rounded-full h-7 w-7 border-2 border-[#00C471] border-t-transparent" />
            <span>Loading upcoming milestones...</span>
          </div>
        ) : filteredUpcoming.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400 dark:text-[#7E9E8F] border border-dashed border-slate-200 dark:border-[#1A3125] rounded-2xl p-6">
            <Cake className="h-8 w-8 mx-auto text-slate-300 dark:text-[#1A3125] mb-2" />
            <p className="font-semibold text-slate-700 dark:text-[#CBD5E1]">
              No upcoming celebrations found
            </p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Try extending your window to 60 or 90 days.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredUpcoming.map((item, idx) => (
              <CelebrationCard
                key={`upcoming-${idx}`}
                celebration={item}
                isToday={false}
                onSendKudos={handleOpenKudos}
              />
            ))}
          </div>
        )}
      </div>

      {/* Give Kudos Modal Bridge */}
      <GiveKudosModal
        isOpen={isKudosOpen}
        onClose={() => setIsKudosOpen(false)}
        initialReceiverId={kudosReceiverId}
        initialBadge={kudosBadge}
      />
    </div>
  );
};
