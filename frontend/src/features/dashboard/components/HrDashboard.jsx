/**
 * @file HrDashboard.jsx
 * @description HR Manager Operational Workforce Dashboard.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.2)
 * - Layer: Component (React 18 / Tailwind / Recharts)
 * - Scope: Operational queues, today's on-leave roster, and employee lifecycle alerts
 */

import React from 'react';
import {
  Users,
  CalendarCheck2,
  Clock,
  Calendar,
  AlertTriangle,
  UserCheck,
  AlertCircle
} from 'lucide-react';
import { useGetHrDashboardQuery } from '../dashboardApi.js';
import { StatCard } from './widgets/StatCard.jsx';
import { PendingList } from './widgets/PendingList.jsx';
import { BirthdaysCard } from './widgets/BirthdaysCard.jsx';
import { AttendanceChart } from './widgets/AttendanceChart.jsx';
import { formatDate, formatDateShort } from '../../../lib/formatters.js';

export function HrDashboard() {
  const { data: response, isLoading, error } = useGetHrDashboardQuery();
  const data = response?.data;

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading workforce operations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Failed to load HR dashboard</h4>
        <p className="text-xs text-slate-500">{error?.data?.message || 'Server error occurred during aggregation.'}</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      {/* 1. Operational Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Employees"
          value={kpis.activeEmployees || 0}
          subtitle={`${kpis.todayPresent || 0} present today`}
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Pending Leaves"
          value={kpis.pendingLeavesCount || 0}
          subtitle="Requests awaiting action"
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Punch Corrections"
          value={kpis.pendingCorrectionsCount || 0}
          subtitle="Missed check-in requests"
          icon={Clock}
          color="blue"
        />
        <StatCard
          title="Probation Reviews"
          value={kpis.probationReviewsCount || 0}
          subtitle="Ending in next 30 days"
          icon={UserCheck}
          color="purple"
        />
      </div>

      {/* 2. Operational Queues & Approvals */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <PendingList
          leaves={data?.pendingLeaves || []}
          corrections={data?.pendingCorrections || []}
          title="Action Items & Approvals Queue"
        />

        {/* Today's On-Leave Roster */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Staff on Leave Today</h3>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/40">
              {data?.todayOnLeaveRoster?.length || 0} Out Office
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
            {!data?.todayOnLeaveRoster || data.todayOnLeaveRoster.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                All staff present. No approved leaves for today.
              </p>
            ) : (
              data.todayOnLeaveRoster.map((roster) => (
                <div key={roster._id} className="py-2.5 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                      {roster.employeeName?.slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-900 dark:text-white">{roster.employeeName}</p>
                      <p className="text-[11px] text-slate-500">{roster.leaveType}</p>
                    </div>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Until {formatDateShort(roster.endDate)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 3. Bottom Row: Celebrations & Probation Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <BirthdaysCard birthdays={data?.upcomingBirthdays || []} />

        <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Upcoming Probation End Dates</h3>
            <span className="text-xs text-slate-500">Next 30 Days</span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/60 max-h-72 overflow-y-auto">
            {!data?.probationReviews || data.probationReviews.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No employees completing probation in the next 30 days.
              </p>
            ) : (
              data.probationReviews.map((rev) => (
                <div key={rev._id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-900 dark:text-white">{rev.name}</p>
                    <p className="text-[11px] text-slate-500">{rev.department} · {rev.employeeCode}</p>
                  </div>
                  <span className="text-xs font-medium text-purple-600 dark:text-purple-400">
                    {formatDate(rev.probationEndDate)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
