/**
 * @file EmployeeDashboard.jsx
 * @description Employee Personal Self-Service Dashboard, laid out per UI-REFERENCE §5.
 *
 * Row 1: 4 stat cards. Row 2: today's punch card + latest payslip.
 * Row 3: leave balances + pinned notice board. Own data only.
 */

import React from 'react';
import { Link } from 'react-router-dom';
import { CalendarCheck2, Clock, Calendar, Wallet, FileText, AlertCircle, ArrowRight } from 'lucide-react';
import { useGetEmployeeDashboardQuery } from '../dashboardApi.js';
import { useDashboardLiveRefresh, EMPLOYEE_EVENTS, makeEmployeeAccept } from '../hooks/useDashboardLiveRefresh.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { PinnedNoticeBoard } from '../../announcements/components/PinnedNoticeBoard.jsx';
import { StatCard } from './widgets/StatCard.jsx';
import { DashboardCard } from './widgets/DashboardCard.jsx';
import { DashboardSkeleton } from './DashboardSkeleton.jsx';

// DESIGN.md §4 badge colours (light + dark) for today's attendance status.
const STATUS_BADGE = {
  present: { label: 'Present', cls: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400' },
  late: { label: 'Late', cls: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/40 dark:text-amber-400' },
  absent: { label: 'Absent', cls: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-800/60 dark:bg-rose-950/40 dark:text-rose-400' },
  on_leave: { label: 'On Leave', cls: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800/60 dark:bg-blue-950/40 dark:text-blue-400' },
  half_day: { label: 'Half Day', cls: 'border-cyan-200 bg-cyan-50 text-cyan-700 dark:border-cyan-800/60 dark:bg-cyan-950/40 dark:text-cyan-400' },
  not_marked: { label: 'Not marked', cls: 'border-slate-200 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300' },
};

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';
  const d = new Date(timeStr);
  return isNaN(d.getTime())
    ? '--:--'
    : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

const formatDuration = (minutes) => {
  const m = Math.max(0, Math.floor(Number(minutes) || 0));
  return `${String(Math.floor(m / 60)).padStart(2, '0')}h ${String(m % 60).padStart(2, '0')}m`;
};

const TILE = 'rounded-xl border border-slate-100 bg-slate-50 p-3 dark:border-[#1A3125] dark:bg-[#162820]';

export function EmployeeDashboard() {
  const { user } = useAuth();
  const { data: response, isLoading, error, refetch } = useGetEmployeeDashboardQuery(undefined, { pollingInterval: 60000 });
  useDashboardLiveRefresh({ events: EMPLOYEE_EVENTS, accept: makeEmployeeAccept(user) });
  const data = response?.data;

  if (isLoading) {
    return <DashboardSkeleton variant="employee" message="Loading your attendance records, leaves & personal payroll..." />;
  }

  // DESIGN.md §6F: subtle destructive hairline card with a readable message and Retry.
  if (error) {
    return (
      <div className="space-y-2 rounded-2xl border border-rose-200 bg-rose-50 p-6 text-center dark:border-rose-900/50 dark:bg-rose-950/20">
        <AlertCircle className="mx-auto h-8 w-8 text-rose-500" aria-hidden="true" />
        <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Failed to load personal dashboard</h4>
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

  // The user has no linked Employee record: nothing personal to show.
  if (data && !data.employee) {
    return (
      <DashboardCard>
        <p className="py-8 text-center text-xs text-slate-500 dark:text-slate-400">
          No employee profile is linked to your account yet. Please contact HR.
        </p>
      </DashboardCard>
    );
  }

  const attendance = data?.todayAttendance || {};
  const leaveBalances = data?.leaveBalances || [];
  const latestPayslip = data?.latestPayslip;
  const badge = STATUS_BADGE[attendance.status] || STATUS_BADGE.not_marked;
  const leaveAvailable = leaveBalances.reduce((sum, b) => sum + (Number(b.available) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Row 1: KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Today Status"
          value={badge.label}
          sub={attendance.checkInTime ? `Punched in ${formatTime(attendance.checkInTime)}` : 'Not punched in'}
          icon={CalendarCheck2}
        />
        <StatCard
          label="Work Hours Today"
          value={formatDuration(attendance.workDurationMinutes)}
          sub={attendance.onBreak ? 'On break' : 'Hours worked'}
          icon={Clock}
        />
        <StatCard label="Leave Available" value={leaveAvailable} sub="days, all types" icon={Calendar} />
        <StatCard
          label="Last Net Pay"
          value={latestPayslip ? `PKR ${(latestPayslip.netPayablePkr || 0).toLocaleString()}` : '—'}
          sub={latestPayslip ? `${latestPayslip.month} · ${latestPayslip.status}` : undefined}
          icon={Wallet}
        />
      </div>

      {/* Row 2: today's punch card, latest payslip */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard title="Today's Punch" live className="lg:col-span-2">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-base font-semibold text-slate-900 dark:text-white">
              {attendance.status === 'present'
                ? 'Checked In — Working'
                : attendance.status === 'late'
                ? 'Checked In (Late)'
                : attendance.status === 'half_day'
                ? 'Half-Day Session'
                : attendance.status === 'on_leave'
                ? 'Approved Leave Today'
                : 'Not Marked Yet'}
            </h4>
            <span className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${badge.cls}`}>
              {badge.label}
            </span>
          </div>

          <div className="my-5 grid grid-cols-2 gap-4 sm:grid-cols-3">
            <div className={TILE}>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">Punch In</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{formatTime(attendance.checkInTime)}</span>
            </div>
            <div className={TILE}>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">Punch Out</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{formatTime(attendance.checkOutTime)}</span>
            </div>
            <div className={TILE}>
              <span className="block text-[11px] text-slate-500 dark:text-slate-400">Duration</span>
              <span className="font-mono text-sm font-semibold tabular-nums text-slate-900 dark:text-white">{formatDuration(attendance.workDurationMinutes)}</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-[#1A3125]">
            <p className="text-xs text-slate-500 dark:text-slate-400">Record your daily punch or apply for missed correction</p>
            <Link
              to="/attendance"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#00C471] px-3.5 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-[#049856]"
            >
              Attendance Console <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </DashboardCard>

        <DashboardCard title="Latest Payslip" className="flex flex-col justify-between">
          <div>
            {latestPayslip ? (
              <div className="space-y-1">
                <span className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                  <FileText className="h-4 w-4 text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
                  Net Disbursement ({latestPayslip.month})
                </span>
                <p className="break-words font-mono text-2xl font-semibold tabular-nums text-slate-900 dark:text-white">
                  PKR {(latestPayslip.netPayablePkr || 0).toLocaleString()}
                </p>
                <span className="mt-1 inline-block rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold uppercase text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-400">
                  Status: {latestPayslip.status}
                </span>
              </div>
            ) : (
              <p className="py-6 text-center text-xs text-slate-500 dark:text-slate-400">
                No finalized payslips generated for your account yet.
              </p>
            )}
          </div>
          <div className="mt-4 border-t border-slate-100 pt-4 dark:border-[#1A3125]">
            <Link
              to="/payroll/my-payslips"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-800 transition-colors hover:bg-slate-200 dark:bg-[#162820] dark:text-slate-200 dark:hover:bg-[#1A3125]"
            >
              My Payslips & Tax Certificate <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" aria-hidden="true" />
            </Link>
          </div>
        </DashboardCard>
      </div>

      {/* Row 3: leave balances, notice board */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <DashboardCard title="Leave Balances" action={{ label: 'Apply Leave & History', to: '/leaves' }} className="lg:col-span-2">
          {leaveBalances.length === 0 ? (
            <p className="py-4 text-center text-xs text-slate-500 dark:text-slate-400">
              No leave quotas allocated for the active calendar year.
            </p>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {leaveBalances.map((bal) => (
                <div key={bal._id} className={`${TILE} space-y-2 p-4`}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-slate-900 dark:text-white">{bal.leaveType}</span>
                    <span className="text-[10px] font-bold text-slate-400">{bal.code}</span>
                  </div>
                  <div className="flex items-baseline justify-between">
                    <span className="font-mono text-2xl font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">{bal.available}</span>
                    <span className="text-xs text-slate-400">/ {bal.allocated} days</span>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-[#1A3125]">
                    <div
                      className="h-full rounded-full bg-[#00C471] transition-all"
                      style={{
                        width: `${Math.min(100, Math.round(((bal.allocated - bal.available) / (bal.allocated || 1)) * 100))}%`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </DashboardCard>

        {/* PinnedNoticeBoard renders its own card chrome and title; wrapping it would double-card. */}
        <PinnedNoticeBoard />
      </div>
    </div>
  );
}
