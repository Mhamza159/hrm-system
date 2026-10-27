/**
 * @file ReportsPage.jsx
 * @description Centralized Multi-Axis Organizational Intelligence & Reports Console.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Rows 7.6, 7.7, 7.8)
 * - Design: Forest & Emerald Craft (DESIGN.md), Linear & Stripe Aesthetic
 * - Layer: Feature Page (React 18 / Tailwind)
 * - Views: Daily Timeline Logs vs Employee-wise Summary & Inline Drilldown
 */

import React, { useState } from 'react';
import {
  Clock,
  Calendar,
  DollarSign,
  Users,
  UserMinus,
  PieChart,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  FileText,
  ShieldCheck,
  LayoutList,
  UserCheck
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { useAuth } from '../../../hooks/useAuth.js';
import { useGetReportDataQuery } from '../reportsApi.js';
import { ReportFilterToolbar } from '../components/ReportFilterToolbar.jsx';
import { ReportDataTable } from '../components/ReportDataTable.jsx';
import { ExportButtons } from '../components/ExportButtons.jsx';
import { toDateInputString } from '../../../lib/formatters.js';

export default function ReportsPage() {
  const { user, isSuperAdmin } = useAuth();

  const userRoles = Array.isArray(user?.roles)
    ? user.roles.map((r) => (typeof r === 'object' ? r.name : r))
    : [];
  const isHrOrAdmin = isSuperAdmin || userRoles.includes('Super Admin') || userRoles.includes('HR Manager');

  // Active Report Tab ('attendance' | 'leave' | 'headcount' | 'payroll' | 'turnover' | 'department-cost')
  const [activeType, setActiveType] = useState('attendance');

  // Sub-View state for attendance and leaves ('daily' | 'employee')
  const [subView, setSubView] = useState('daily');

  // Filter States
  const [from, setFrom] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return toDateInputString(d);
  });
  const [to, setTo] = useState(() => toDateInputString(new Date()));
  const [departmentId, setDepartmentId] = useState('');
  const [page, setPage] = useState(1);

  // Tab definitions
  const reportTabs = [
    { id: 'attendance', label: 'Attendance', icon: Clock },
    { id: 'leave', label: 'Leaves', icon: Calendar },
    { id: 'headcount', label: 'Headcount', icon: Users },
    ...(isHrOrAdmin
      ? [
          { id: 'payroll', label: 'Payroll', icon: DollarSign },
          { id: 'turnover', label: 'Turnover', icon: UserMinus },
          { id: 'department-cost', label: 'Dept Costs', icon: PieChart }
        ]
      : [])
  ];

  const handleTabChange = (tabId) => {
    setActiveType(tabId);
    setSubView('daily');
    setPage(1);
  };

  const handleSubViewChange = (view) => {
    setSubView(view);
    setPage(1);
  };

  const handleFilterChange = (newFilters) => {
    if (newFilters.from !== undefined) setFrom(newFilters.from);
    if (newFilters.to !== undefined) setTo(newFilters.to);
    if (newFilters.departmentId !== undefined) setDepartmentId(newFilters.departmentId);
    setPage(1);
  };

  const handleResetFilters = () => {
    const d = new Date();
    d.setDate(1);
    setFrom(toDateInputString(d));
    setTo(toDateInputString(new Date()));
    setDepartmentId('');
    setPage(1);
  };

  const { data: response, isLoading } = useGetReportDataQuery({
    type: activeType,
    from,
    to,
    departmentId,
    view: subView,
    page,
    limit: 25
  });

  const reportData = response?.data || {};
  const summary = reportData.summary;

  const supportsEmployeeView = activeType === 'attendance' || activeType === 'leave';

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Reports & Organizational Intelligence"
        description="Comprehensive analytical reports across attendance, leaves, payroll liabilities, and demographics."
      />

      {/* 2. Report Type Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] overflow-x-auto">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white dark:bg-[#1A3125] text-[#00C471] dark:text-[#00C471] shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* 3. Filter Toolbar */}
      <ReportFilterToolbar
        from={from}
        to={to}
        departmentId={departmentId}
        onFilterChange={handleFilterChange}
        onReset={handleResetFilters}
      />

      {/* 4. Sub-View Segmented Toggle (For Attendance & Leaves) */}
      {supportsEmployeeView && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#111D17] p-2.5 px-3 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              Aggregation View:
            </span>
          </div>

          <div className="flex items-center gap-1 bg-slate-100 dark:bg-[#13221B] p-1 rounded-xl border border-slate-200/80 dark:border-[#1A3125]">
            <button
              type="button"
              onClick={() => handleSubViewChange('daily')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subView === 'daily'
                  ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5 text-[#00C471]" />
              <span>Daily Log Timeline</span>
            </button>
            <button
              type="button"
              onClick={() => handleSubViewChange('employee')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                subView === 'employee'
                  ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5 text-[#00C471]" />
              <span>Employee-Wise Summary</span>
            </button>
          </div>
        </div>
      )}

      {/* 5. Executive Metric KPI Cards (DESIGN.md Section 6.C) */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {activeType === 'attendance' && (
            <>
              {/* Metric 1: Attendance Rate */}
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Attendance Rate</span>
                  <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {summary.attendanceRate}%
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Based on {summary.totalRecords} logged records
                </p>
              </div>

              {/* Metric 2: Total Worked Hours */}
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Productive Hours</span>
                  <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {summary.totalWorkHours} <span className="text-sm font-normal text-slate-500">hrs</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total productive floor hours
                </p>
              </div>

              {/* Metric 3: Overtime Hours */}
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Overtime Recorded</span>
                  <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-[#00C471]">
                  +{summary.totalOvertimeHours} <span className="text-sm font-normal text-slate-500">hrs</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Total overtime eligible hours
                </p>
              </div>

              {/* Metric 4: Late & Absent Counts */}
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Incidents</span>
                  <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  <span className="text-amber-600 dark:text-amber-400">{summary.totalLates}</span>
                  <span className="text-slate-400 text-lg mx-1">/</span>
                  <span className="text-rose-600 dark:text-rose-400">{summary.totalAbsents}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Late arrivals / Unexcused absents
                </p>
              </div>
            </>
          )}

          {activeType === 'leave' && (
            <>
              {/* Metric 1: Total Applications */}
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Applications</span>
                  <div className="p-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {summary.totalApplications}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Requests submitted in period
                </p>
              </div>

              {/* Metric 2: Total Leave Days */}
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Approved Leave</span>
                  <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                  {summary.totalLeaveDays} <span className="text-sm font-normal text-slate-500">days</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {summary.paidLeaveDays} paid / {summary.unpaidLeaveDays} unpaid (LWP)
                </p>
              </div>

              {/* Metric 3: Paid Leave Quota Taken */}
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Paid Leaves</span>
                  <div className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400">
                  {summary.paidLeaveDays} <span className="text-sm font-normal text-slate-500">days</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Deducted against annual / casual quota
                </p>
              </div>

              {/* Metric 4: Pending Approval */}
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending Action</span>
                  <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                  {summary.pendingApplications}
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Awaiting managerial approval
                </p>
              </div>
            </>
          )}
        </div>
      )}

      {/* 6. Action Bar (Title & Export Buttons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {reportData.title || 'Generated Report'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {reportData.total || 0} {subView === 'employee' ? 'employees recorded' : 'records recorded'}
          </p>
        </div>

        <ExportButtons
          type={activeType}
          from={from}
          to={to}
          departmentId={departmentId}
          view={subView}
        />
      </div>

      {/* 7. Data Table Grid */}
      <ReportDataTable
        columns={reportData.columns || []}
        items={reportData.items || []}
        total={reportData.total || 0}
        page={page}
        limit={25}
        isLoading={isLoading}
        onPageChange={setPage}
        view={subView}
        reportType={activeType}
      />
    </div>
  );
}
