/**
 * @file AdminDashboard.jsx
 * @description Super Admin Executive Dashboard view.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.1)
 * - Layer: Component (React 18 / Tailwind / Recharts)
 * - Scope: Full company-wide analytics and financial liabilities
 */

import React from 'react';
import {
  Users,
  Building2,
  CalendarCheck2,
  AlertCircle,
  DollarSign,
  TrendingUp,
  Activity,
  Layers
} from 'lucide-react';
import { useGetAdminDashboardQuery } from '../dashboardApi.js';
import { StatCard } from './widgets/StatCard.jsx';
import { AttendanceChart } from './widgets/AttendanceChart.jsx';
import { DepartmentCostChart } from './widgets/DepartmentCostChart.jsx';
import { PinnedNoticeBoard } from '../../announcements/components/PinnedNoticeBoard.jsx';
import { DashboardSkeleton } from './DashboardSkeleton.jsx';

export function AdminDashboard() {
  const { data: response, isLoading, error } = useGetAdminDashboardQuery();
  const data = response?.data;

  if (isLoading) {
    return <DashboardSkeleton variant="admin" message="Aggregating executive workforce analytics & company costs..." />;
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Failed to load admin dashboard</h4>
        <p className="text-xs text-slate-500">{error?.data?.message || 'Server error occurred during aggregation.'}</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      {/* 1. Executive Top KPI Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Workforce"
          value={kpis.totalEmployees || 0}
          subtitle={`${kpis.activeEmployees || 0} active staff members`}
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Today's Attendance"
          value={`${kpis.attendanceRate || 0}%`}
          subtitle={`${kpis.todayPresent || 0} in-office · ${kpis.todayLate || 0} late`}
          icon={CalendarCheck2}
          color="blue"
        />
        <StatCard
          title="Monthly Payroll Cost"
          value={`PKR ${(kpis.monthlyPayrollCostPkr || 0).toLocaleString()}`}
          subtitle={kpis.latestPayrollMonth ? `Run: ${kpis.latestPayrollMonth}` : 'No finalized runs'}
          icon={DollarSign}
          color="amber"
        />
        <StatCard
          title="Departments & Units"
          value={kpis.totalDepartments || 0}
          subtitle={`${kpis.pendingApprovals || 0} system pending requests`}
          icon={Building2}
          color="purple"
        />
      </div>

      {/* 2. Visual Charts Row (7-Day Attendance Trend + Department Payroll Distribution) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart
          data={data?.attendanceTrend || []}
          title="Company Attendance Trajectory"
        />
        <DepartmentCostChart
          data={data?.departmentCosts || []}
          title="Department Payroll Allocation"
        />
      </div>

      {/* 3. Pinned Broadcasts & Notices */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Company Notice Board</h3>
        </div>
        <PinnedNoticeBoard />
      </div>
    </div>
  );
}
