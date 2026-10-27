/**
 * @file EmployeeDashboard.jsx
 * @description Employee Personal Self-Service Dashboard.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.4)
 * - Layer: Component (React 18 / Tailwind)
 * - Scope: Personal attendance punch, leave balances, latest payslip, and company notices
 */

import React from 'react';
import { Link } from 'react-router-dom';
import {
  CalendarCheck2,
  Clock,
  Calendar,
  FileText,
  AlertCircle,
  Download,
  ArrowRight,
  Sparkles,
  Layers
} from 'lucide-react';
import { useGetEmployeeDashboardQuery } from '../dashboardApi.js';
import { PinnedNoticeBoard } from '../../announcements/components/PinnedNoticeBoard.jsx';
import { DashboardSkeleton } from './DashboardSkeleton.jsx';

const formatTime = (timeStr) => {
  if (!timeStr) return '--:--';
  const d = new Date(timeStr);
  return isNaN(d.getTime())
    ? '--:--'
    : d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
};

export function EmployeeDashboard() {
  const { data: response, isLoading, error } = useGetEmployeeDashboardQuery();
  const data = response?.data;

  if (isLoading) {
    return <DashboardSkeleton variant="employee" message="Loading your attendance records, leaves & personal payroll..." />;
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Failed to load personal dashboard</h4>
        <p className="text-xs text-slate-500">{error?.data?.message || 'Server error occurred during aggregation.'}</p>
      </div>
    );
  }

  const attendance = data?.todayAttendance || {};
  const leaveBalances = data?.leaveBalances || [];
  const latestPayslip = data?.latestPayslip;

  return (
    <div className="space-y-6">
      {/* 1. Top Row: Today's Punch Card & Latest Payslip Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance Punch Card */}
        <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[11px] font-semibold tracking-wider text-emerald-600 dark:text-emerald-400 uppercase">
                Today's Presence
              </span>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-0.5">
                {attendance.status === 'present'
                  ? 'Checked In — Working'
                  : attendance.status === 'late'
                  ? 'Checked In (Late)'
                  : attendance.status === 'half_day'
                  ? 'Half-Day Session'
                  : attendance.status === 'on_leave'
                  ? 'Approved Leave Today'
                  : 'Not Marked Yet'}
              </h3>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold capitalize ${
                attendance.status === 'present' || attendance.status === 'late'
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
              }`}
            >
              {attendance.status?.replace('_', ' ')}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 my-6">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Punch In</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {formatTime(attendance.checkInTime)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Punch Out</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {formatTime(attendance.checkOutTime)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 block">Duration</span>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">
                {Math.floor((attendance.workDurationMinutes || 0) / 60)}h {(attendance.workDurationMinutes || 0) % 60}m
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
            <p className="text-xs text-slate-500">Record your daily punch or apply for missed correction</p>
            <Link
              to="/attendance"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors"
            >
              Attendance Console <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>

        {/* Latest Payslip Summary Card */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold tracking-wider text-slate-500 uppercase">Latest Payslip</span>
              <FileText className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            </div>

            {latestPayslip ? (
              <div className="mt-4 space-y-1">
                <span className="text-xs text-slate-500">Net Disbursement ({latestPayslip.month})</span>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  PKR {(latestPayslip.netPayablePkr || 0).toLocaleString()}
                </p>
                <span className="inline-block px-2 py-0.5 rounded-md text-[10px] font-semibold uppercase bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 mt-1">
                  Status: {latestPayslip.status}
                </span>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No finalized payslips generated for your account yet.
              </div>
            )}
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
            <Link
              to="/payroll/my-payslips"
              className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              My Payslips & Tax Certificate <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Leave Quota Balances Grid */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Leave Quota Balances</h3>
          </div>
          <Link to="/leaves" className="text-xs font-medium text-emerald-600 dark:text-emerald-400 hover:underline">
            Apply Leave & History
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          {leaveBalances.length === 0 ? (
            <p className="col-span-full py-4 text-center text-xs text-slate-500">
              No leave quotas allocated for the active calendar year.
            </p>
          ) : (
            leaveBalances.map((bal) => (
              <div
                key={bal._id}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-900 dark:text-white">{bal.leaveType}</span>
                  <span className="text-[10px] font-bold text-slate-400">{bal.code}</span>
                </div>
                <div className="flex items-baseline justify-between">
                  <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{bal.available}</span>
                  <span className="text-xs text-slate-400">/ {bal.allocated} days</span>
                </div>
                <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-emerald-500 h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, Math.round(((bal.allocated - bal.available) / (bal.allocated || 1)) * 100))}%`
                    }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* 3. Company Broadcasts & Announcements */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Notice Board Announcements</h3>
        </div>
        <PinnedNoticeBoard />
      </div>
    </div>
  );
}
