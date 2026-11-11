/**
 * @file HrDashboard.jsx
 * @description HR Manager Operational Workforce Dashboard (company-wide), laid out per UI-REFERENCE §5.
 *
 * Row 1: 4 stat cards. Row 2: attendance donut, approvals queue, recent activity.
 * Row 3: on-leave roster, upcoming deadlines, upcoming birthdays.
 */

import React from 'react';
import { Users, CalendarCheck2, CalendarDays, ClipboardCheck, AlertCircle } from 'lucide-react';
import { useGetHrDashboardQuery } from '../dashboardApi.js';
import { useDashboardLiveRefresh, SUPERVISOR_EVENTS } from '../hooks/useDashboardLiveRefresh.js';
import { StatCard } from './widgets/StatCard.jsx';
import { DashboardCard } from './widgets/DashboardCard.jsx';
import { AttendanceDonut } from './widgets/AttendanceDonut.jsx';
import { PendingList } from './widgets/PendingList.jsx';
import { RecentActivityCard } from './widgets/RecentActivityCard.jsx';
import { UpcomingDeadlinesCard } from './widgets/UpcomingDeadlinesCard.jsx';
import { BirthdaysCard } from './widgets/BirthdaysCard.jsx';
import { formatDateShort } from '../../../lib/formatters.js';
import { DashboardSkeleton } from './DashboardSkeleton.jsx';

export function HrDashboard() {
  const { data: response, isLoading, error, refetch } = useGetHrDashboardQuery(undefined, { pollingInterval: 60000 });
  useDashboardLiveRefresh({ events: SUPERVISOR_EVENTS });
  const data = response?.data;

  if (isLoading) {
    return <DashboardSkeleton variant="hr" message="Loading workforce operations, leaves & approval queues..." />;
  }

  // DESIGN.md §6F: subtle destructive hairline card with a readable message and Retry.
  if (error) {
    return (
      <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Failed to load HR dashboard</h4>
        <p className="text-xs text-slate-500 dark:text-slate-400">{error?.data?.message || 'Server error occurred during aggregation.'}</p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-2 rounded-lg bg-[#00C471] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#049856]"
        >
          Retry
        </button>
      </div>
    );
  }

  const kpis = data?.kpis || {};
  const leaves = kpis.pendingLeavesCount || 0;
  const corrections = kpis.pendingCorrectionsCount || 0;
  const wfh = kpis.pendingWFHCount || 0;
  const pendingTotal = leaves + corrections + wfh;
  const roster = data?.todayOnLeaveRoster || [];

  return (
    <div className="space-y-6">
      {/* Row 1: KPIs (no sparklines: the HR payload has no trend series) */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Active Employees"
          value={kpis.activeEmployees || 0}
          sub="Across the company"
          icon={Users}
        />
        <StatCard
          label="Present Today"
          value={kpis.todayPresent || 0}
          sub={`${kpis.todayLate || 0} late`}
          subTone={kpis.todayLate ? 'amber' : 'muted'}
          icon={CalendarCheck2}
        />
        <StatCard
          label="On Leave Today"
          value={kpis.todayOnLeave || 0}
          sub="Approved leave"
          icon={CalendarDays}
        />
        <StatCard
          label="Pending Approvals"
          value={pendingTotal}
          sub={`${leaves} leave · ${corrections} corr · ${wfh} WFH`}
          subTone={pendingTotal ? 'amber' : 'muted'}
          icon={ClipboardCheck}
        />
      </div>

      {/* Row 2: attendance, approvals queue, activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AttendanceDonut breakdown={data?.todayBreakdown} />
        <DashboardCard title="Pending Approvals Queue" live>
          <PendingList
            leaves={data?.pendingLeaves || []}
            corrections={data?.pendingCorrections || []}
            wfh={data?.pendingWFH || []}
            onRefresh={refetch}
          />
        </DashboardCard>
        <RecentActivityCard items={data?.recentActivity || []} showViewAll />
      </div>

      {/* Row 3: on-leave roster, deadlines, birthdays */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard title="On Leave Today">
          <div className="max-h-72 divide-y divide-slate-100 overflow-y-auto dark:divide-[#1A3125]">
            {roster.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                All staff present. No approved leaves for today.
              </p>
            ) : (
              roster.map((r) => (
                <div key={r._id} className="flex items-center justify-between gap-3 py-2.5">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-[#162820] dark:text-slate-300">
                      {r.avatar ? (
                        <img src={r.avatar} alt={r.employeeName} className="h-full w-full object-cover" />
                      ) : (
                        r.employeeName?.slice(0, 2).toUpperCase()
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{r.employeeName}</p>
                      <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{r.leaveType}</p>
                    </div>
                  </div>
                  <span className="shrink-0 text-[11px] text-slate-400 dark:text-slate-500">
                    Until {formatDateShort(r.endDate)}
                  </span>
                </div>
              ))
            )}
          </div>
        </DashboardCard>
        <UpcomingDeadlinesCard items={data?.upcomingDeadlines || []} />
        <DashboardCard title="Upcoming Birthdays">
          <BirthdaysCard birthdays={data?.upcomingBirthdays || []} />
        </DashboardCard>
      </div>
    </div>
  );
}
