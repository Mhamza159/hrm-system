/**
 * @file AdminDashboard.jsx
 * @description Super Admin Executive Dashboard view (company-wide), laid out per UI-REFERENCE §5.
 *
 * Row 1: 4 stat cards. Row 2: attendance donut, 7-day trend, recent activity.
 * Row 3: department cost, upcoming deadlines, upcoming birthdays.
 */

import React from 'react';
import { Users, CalendarCheck2, ClipboardCheck, Wallet, AlertCircle } from 'lucide-react';
import { useGetAdminDashboardQuery } from '../dashboardApi.js';
import { useDashboardLiveRefresh, SUPERVISOR_EVENTS } from '../hooks/useDashboardLiveRefresh.js';
import { StatCard } from './widgets/StatCard.jsx';
import { DashboardCard } from './widgets/DashboardCard.jsx';
import { AttendanceDonut } from './widgets/AttendanceDonut.jsx';
import { AttendanceChart } from './widgets/AttendanceChart.jsx';
import { RecentActivityCard } from './widgets/RecentActivityCard.jsx';
import { DepartmentCostChart } from './widgets/DepartmentCostChart.jsx';
import { UpcomingDeadlinesCard } from './widgets/UpcomingDeadlinesCard.jsx';
import { BirthdaysCard } from './widgets/BirthdaysCard.jsx';
import { DashboardSkeleton } from './DashboardSkeleton.jsx';

export function AdminDashboard() {
  const { data: response, isLoading, error, refetch } = useGetAdminDashboardQuery(undefined, { pollingInterval: 60000 });
  useDashboardLiveRefresh({ events: SUPERVISOR_EVENTS });
  const data = response?.data;

  if (isLoading) {
    return <DashboardSkeleton variant="admin" message="Aggregating executive workforce analytics & company costs..." />;
  }

  // DESIGN.md §6F: subtle destructive hairline card with a readable message and Retry.
  if (error) {
    return (
      <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Failed to load admin dashboard</h4>
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
  // Real per-day series only; StatCard hides the sparkline below 2 points.
  const attendanceSeries = trend.map((d) => (Number(d.present) || 0) + (Number(d.late) || 0));

  return (
    <div className="space-y-6">
      {/* Row 1: KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Total Employees"
          value={kpis.totalEmployees || 0}
          sub={`${kpis.activeEmployees || 0} active`}
          icon={Users}
        />
        <StatCard
          label="Attendance Today"
          value={`${kpis.attendanceRate || 0}%`}
          sub={`${kpis.todayPresent || 0} present · ${kpis.todayLate || 0} late`}
          icon={CalendarCheck2}
          series={attendanceSeries}
        />
        <StatCard
          label="Pending Approvals"
          value={kpis.pendingApprovals || 0}
          sub="Leave requests awaiting review"
          subTone={kpis.pendingApprovals ? 'amber' : 'muted'}
          icon={ClipboardCheck}
        />
        <StatCard
          label="Payroll Cost"
          value={`PKR ${(kpis.monthlyPayrollCostPkr || 0).toLocaleString()}`}
          sub={kpis.latestPayrollMonth ? `Run: ${kpis.latestPayrollMonth}` : 'No finalized runs'}
          icon={Wallet}
        />
      </div>

      {/* Row 2: attendance + activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <AttendanceDonut breakdown={data?.todayBreakdown} />
        <DashboardCard title="7-Day Attendance Trend" live>
          <AttendanceChart data={trend} />
        </DashboardCard>
        <RecentActivityCard items={data?.recentActivity || []} showViewAll />
      </div>

      {/* Row 3: cost, deadlines, birthdays */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard title="Department Cost">
          <DepartmentCostChart data={data?.departmentCosts || []} />
        </DashboardCard>
        <UpcomingDeadlinesCard items={data?.upcomingDeadlines || []} />
        <DashboardCard title="Upcoming Birthdays">
          <BirthdaysCard birthdays={data?.upcomingBirthdays || []} />
        </DashboardCard>
      </div>
    </div>
  );
}
