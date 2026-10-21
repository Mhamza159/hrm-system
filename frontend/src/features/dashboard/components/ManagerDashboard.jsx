/**
 * @file ManagerDashboard.jsx
 * @description Department Manager Team Overview Dashboard.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.3)
 * - Layer: Component (React 18 / Tailwind / Recharts)
 * - Scope: Team-scoped workforce presence, approvals, and overtime hours (salary redacted)
 */

import React from 'react';
import {
  Users,
  CalendarCheck2,
  Clock,
  Calendar,
  AlertCircle,
  UserCheck,
  Building2
} from 'lucide-react';
import { useGetManagerDashboardQuery } from '../dashboardApi.js';
import { StatCard } from './widgets/StatCard.jsx';
import { AttendanceChart } from './widgets/AttendanceChart.jsx';
import { PendingList } from './widgets/PendingList.jsx';

export function ManagerDashboard() {
  const { data: response, isLoading, error } = useGetManagerDashboardQuery();
  const data = response?.data;

  if (isLoading) {
    return (
      <div className="py-24 flex flex-col items-center justify-center space-y-3">
        <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Loading team overview...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800/40 text-center space-y-2">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto" />
        <h4 className="text-sm font-semibold text-rose-700 dark:text-rose-400">Failed to load team dashboard</h4>
        <p className="text-xs text-slate-500">{error?.data?.message || 'Server error occurred during aggregation.'}</p>
      </div>
    );
  }

  const kpis = data?.kpis || {};

  return (
    <div className="space-y-6">
      {/* 1. Team KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Team Members"
          value={kpis.teamCount || 0}
          subtitle={`${kpis.todayPresent || 0} present today`}
          icon={Users}
          color="emerald"
        />
        <StatCard
          title="Team Present Today"
          value={kpis.todayPresent || 0}
          subtitle={`${kpis.todayLate || 0} late · ${kpis.todayOnLeave || 0} on leave`}
          icon={CalendarCheck2}
          color="blue"
        />
        <StatCard
          title="Pending Team Approvals"
          value={kpis.pendingApprovals || 0}
          subtitle="Leave & attendance requests"
          icon={Calendar}
          color="amber"
        />
        <StatCard
          title="Approved Overtime"
          value={`${kpis.teamOvertimeHours || 0} hrs`}
          subtitle="Team total this month"
          icon={Clock}
          color="purple"
        />
      </div>

      {/* 2. Visual Trend & Approvals List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <AttendanceChart
          data={data?.attendanceTrend || []}
          title="Team Attendance Trajectory"
        />
        <PendingList
          leaves={data?.pendingApprovals || []}
          corrections={[]}
          title="Team Pending Approvals"
        />
      </div>

      {/* 3. Team Roster Directory */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl p-5 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Assigned Team Roster</h3>
          </div>
          <span className="text-xs text-slate-500">{data?.teamMembers?.length || 0} Staff</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {!data?.teamMembers || data.teamMembers.length === 0 ? (
            <p className="col-span-full py-8 text-center text-xs text-slate-500">
              No team members assigned under your reporting line or department yet.
            </p>
          ) : (
            data.teamMembers.map((member) => (
              <div
                key={member._id}
                className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-slate-800 flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-full bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 flex items-center justify-center shrink-0 text-xs font-semibold text-slate-700 dark:text-slate-200 overflow-hidden">
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.name} className="w-full h-full object-cover" />
                  ) : (
                    member.name?.slice(0, 2).toUpperCase()
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">{member.name}</p>
                  <p className="text-[11px] text-slate-500 truncate">{member.designation} · {member.employeeCode}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
