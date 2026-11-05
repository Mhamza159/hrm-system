/**
 * @file UtilizationReportPage.jsx
 * @description Billable vs non-billable utilization telemetry and visual stacked bar analytics.
 * 
 * SPECIFICATION:
 * - Module: M22 Projects & Timesheets (BUILD-GUIDE Section 23 · Row 22.5)
 */

import React, { useState } from 'react';
import {
  BarChart3,
  Calendar,
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  Filter,
  Users
} from 'lucide-react';
import { useGetUtilizationReportQuery } from '../projectsApi.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';

export const UtilizationReportPage = () => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedDeptId, setSelectedDeptId] = useState('');

  const { data: deptRes } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptRes?.data || [];

  const { data: reportRes, isLoading, isFetching, refetch } = useGetUtilizationReportQuery({
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    departmentId: selectedDeptId || undefined
  });

  if (isLoading && !reportRes) {
    return (
      <div className="space-y-6 animate-in fade-in duration-200">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const summary = reportRes?.data?.summary || {
    totalBillableHours: 0,
    totalNonBillableHours: 0,
    totalLoggedHours: 0,
    overallUtilizationRate: 0
  };

  const breakdown = reportRes?.data?.breakdown || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BarChart3 className="h-7 w-7 text-primary" />
            Billable Utilization Telemetry
          </h1>
          <p className="text-sm text-muted-foreground">
            Analyze engineering and delivery team billable ratios versus internal non-billable time.
          </p>
        </div>
        <RefreshButton onRefresh={refetch} isFetching={isFetching} />
      </div>

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Utilization Rate</p>
            <p className="text-2xl font-bold text-foreground">
              {summary.overallUtilizationRate}%
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Billable Hours</p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {summary.totalBillableHours}h
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Clock className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Non-Billable Hours</p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {summary.totalNonBillableHours}h
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex items-center gap-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-purple-500/10 text-purple-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-muted-foreground font-medium">Total Tracked Hours</p>
            <p className="text-2xl font-bold text-foreground font-mono">
              {summary.totalLoggedHours}h
            </p>
          </div>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="p-4 rounded-xl border border-border bg-card shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium">
            <Filter className="h-4 w-4" /> Filters:
          </div>

          <div className="relative">
            <Building2 className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
            <select
              value={selectedDeptId}
              onChange={(e) => setSelectedDeptId(e.target.value)}
              className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            >
              <option value="">All Departments</option>
              {departments.map((d) => (
                <option key={d._id} value={d._id}>
                  {d.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
            <span className="text-xs text-muted-foreground">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-2.5 py-1.5 text-xs rounded-lg border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            />
          </div>
        </div>
      </div>

      {/* Visual Stacked Bar Telemetry */}
      <div className="p-6 rounded-xl border border-border bg-card shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Team Member Utilization Distribution
          </h3>
          <div className="flex items-center gap-4 text-xs font-medium">
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-primary" />
              <span>Billable Client Work</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded-sm bg-muted-foreground/30" />
              <span>Internal Non-Billable</span>
            </div>
          </div>
        </div>

        {breakdown.length === 0 ? (
          <div className="p-8 text-center text-xs text-muted-foreground italic">
            No approved timesheet records found for the selected range.
          </div>
        ) : (
          <div className="space-y-3 pt-2">
            {breakdown.map((emp) => {
              const billablePct = emp.totalHours > 0 ? (emp.billableHours / emp.totalHours) * 100 : 0;
              const nonBillablePct = 100 - billablePct;

              return (
                <div key={emp.employeeId || emp.name} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-foreground">{emp.name}</span>
                    <span className="font-mono text-muted-foreground">
                      {emp.billableHours}h billable / {emp.totalHours}h total ({emp.utilizationRate}%)
                    </span>
                  </div>
                  {/* Stacked Progress Bar */}
                  <div className="h-3 w-full rounded-full bg-muted overflow-hidden flex">
                    <div
                      style={{ width: `${billablePct}%` }}
                      className="h-full bg-primary transition-all duration-300"
                      title={`Billable: ${emp.billableHours}h (${billablePct.toFixed(1)}%)`}
                    />
                    <div
                      style={{ width: `${nonBillablePct}%` }}
                      className="h-full bg-muted-foreground/30 transition-all duration-300"
                      title={`Non-Billable: ${emp.nonBillableHours}h (${nonBillablePct.toFixed(1)}%)`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Tabular Breakdown */}
      <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">Detailed Utilization Breakdown</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-muted/50 text-xs font-semibold uppercase tracking-wider text-muted-foreground border-b border-border">
              <tr>
                <th className="px-6 py-3">Employee</th>
                <th className="px-6 py-3">Billable Hours</th>
                <th className="px-6 py-3">Non-Billable Hours</th>
                <th className="px-6 py-3">Total Logged</th>
                <th className="px-6 py-3">Utilization Rate</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {breakdown.map((emp) => (
                <tr key={emp.employeeId || emp.name} className="hover:bg-muted/30">
                  <td className="px-6 py-4 font-medium text-foreground">{emp.name}</td>
                  <td className="px-6 py-4 font-mono text-emerald-600 font-semibold">{emp.billableHours}h</td>
                  <td className="px-6 py-4 font-mono text-muted-foreground">{emp.nonBillableHours}h</td>
                  <td className="px-6 py-4 font-mono font-bold text-foreground">{emp.totalHours}h</td>
                  <td className="px-6 py-4">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        emp.utilizationRate >= 80
                          ? 'bg-emerald-500/10 text-emerald-600'
                          : emp.utilizationRate >= 50
                          ? 'bg-blue-500/10 text-blue-600'
                          : 'bg-amber-500/10 text-amber-600'
                      }`}
                    >
                      {emp.utilizationRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

