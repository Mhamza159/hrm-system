/**
 * @file ManagerDashboard.jsx
 * @description Department Manager Team Overview Dashboard (own team only), laid out per UI-REFERENCE §5.
 *
 * Row 1: 4 stat cards. Row 2: team attendance donut, 7-day trend, team activity.
 * Row 3: pending approvals, team deadlines, team members with today's status.
 */

import React from 'react';
import { Users, CalendarCheck2, ClipboardCheck, Clock, AlertCircle } from 'lucide-react';
import { useGetManagerDashboardQuery } from '../dashboardApi.js';
import { useDashboardLiveRefresh, SUPERVISOR_EVENTS } from '../hooks/useDashboardLiveRefresh.js';
import { StatCard } from './widgets/StatCard.jsx';
import { DashboardCard } from './widgets/DashboardCard.jsx';
import { AttendanceDonut } from './widgets/AttendanceDonut.jsx';
import { AttendanceChart } from './widgets/AttendanceChart.jsx';
import { PendingList } from './widgets/PendingList.jsx';
import { RecentActivityCard } from './widgets/RecentActivityCard.jsx';
import { UpcomingDeadlinesCard } from './widgets/UpcomingDeadlinesCard.jsx';
import { DashboardSkeleton } from './DashboardSkeleton.jsx';

// DESIGN.md §4 badge colours (light + dark) for the member's status today.
const STATUS_BADGE = {
  present: { label: 'Present', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400' },
  late: { label: 'Late', cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400' },
  absent: { label: 'Absent', cls: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400' },
  on_leave: { label: 'On Leave', cls: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-400' },
  half_day: { label: 'Half Day', cls: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-400' },
  not_marked: { label: 'Not marked', cls: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300' },
};

export function ManagerDashboard() {
  const { data: response, isLoading, error, refetch } = useGetManagerDashboardQuery(undefined, { pollingInterval: 60000 });
  useDashboardLiveRefresh({ events: SUPERVISOR_EVENTS });
  const data = response?.data;

  if (isLoading) {
    return <DashboardSkeleton variant="manager" message="Loading team roster, attendance trends & approvals..." />;
  }

  // DESIGN.md §6F: subtle destructive hairline card with a readable message and Retry.
  if (error) {
    return (
      <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Failed to load team dashboard</h4>
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
  const trend = data?.attendanceTrend || [];
  const members = data?.teamMembers || [];
  const leaves = data?.pendingApprovals || [];
  const corrections = data?.pendingCorrections || [];
  const wfh = data?.pendingWFH || [];
  // Real per-day series only; StatCard hides the sparkline below 2 points.
  const presentSeries = trend.map((d) => (Number(d.present) || 0) + (Number(d.late) || 0));

  return (
    <div className="space-y-6">
      {/* Row 1: KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Team Size"
          value={kpis.teamCount || 0}
          sub="Reports & department"
          icon={Users}
        />
        <StatCard
          label="Team Present"
          value={kpis.todayPresent || 0}
          sub={`${kpis.todayLate || 0} late · ${kpis.todayOnLeave || 0} on leave`}
          subTone={kpis.todayLate ? 'amber' : 'muted'}
          icon={CalendarCheck2}
          series={presentSeries}
        />
        <StatCard
          label="Team Approvals"
          value={kpis.pendingApprovals || 0}
          sub={`${leaves.length} leave · ${corrections.length} corr · ${wfh.length} WFH · expense`}
          subTone={kpis.pendingApprovals ? 'amber' : 'muted'}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Team Overtime"
          value={`${kpis.teamOvertimeHours || 0}h`}
          sub="Approved, this month"
          icon={Clock}
        />
      </div>

      {/* Row 2: attendance, trend, activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AttendanceDonut breakdown={data?.todayBreakdown} title="Team Attendance" />
        <DashboardCard title="Team 7-Day Trend" live>
          <AttendanceChart data={trend} />
        </DashboardCard>
        <RecentActivityCard title="Team Activity" items={data?.recentActivity || []} showViewAll={false} />
      </div>

      {/* Row 3: approvals, deadlines, members */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard title="Pending Approvals" live>
          <PendingList leaves={leaves} corrections={corrections} wfh={wfh} onRefresh={refetch} />
        </DashboardCard>
        <UpcomingDeadlinesCard title="Team Deadlines" items={data?.upcomingDeadlines || []} />
        <DashboardCard title="Team Members" live>
          <div className="max-h-80 divide-y divide-slate-100 overflow-y-auto dark:divide-[#1A3125]">
            {members.length === 0 ? (
              <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
                No team members assigned under your reporting line or department yet.
              </p>
            ) : (
              members.map((m) => {
                const badge = STATUS_BADGE[m.todayStatus] || STATUS_BADGE.not_marked;
                return (
                  <div key={m._id} className="flex items-center justify-between gap-3 py-2.5">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-100 text-xs font-semibold text-slate-600 dark:bg-[#162820] dark:text-slate-300">
                        {m.avatar ? (
                          <img src={m.avatar} alt={m.name} className="h-full w-full object-cover" />
                        ) : (
                          m.name?.slice(0, 2).toUpperCase()
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-slate-900 dark:text-white">{m.name}</p>
                        <p className="truncate text-[11px] text-slate-500 dark:text-slate-400">{m.designation} · {m.employeeCode}</p>
                      </div>
                    </div>
                    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
                      {badge.label}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </DashboardCard>
      </div>
    </div>
  );
}
