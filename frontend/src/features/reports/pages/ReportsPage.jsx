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
  UserCheck,
  UserPlus,
  CreditCard,
  Building2
} from 'lucide-react';
import { PageHeader } from '../../../components/common/PageHeader.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { RefreshButton } from '../../../components/common/RefreshButton.jsx';
import { useAuth } from '../../../hooks/useAuth.js';
import { useGetReportDataQuery } from '../reportsApi.js';
import { ReportFilterToolbar } from '../components/ReportFilterToolbar.jsx';
import { ReportDataTable } from '../components/ReportDataTable.jsx';
import { ExportButtons } from '../components/ExportButtons.jsx';
import { toDateInputString } from '../../../lib/formatters.js';

// Charts Suite
import { AttendanceStatusChart } from '../components/charts/AttendanceStatusChart.jsx';
import { LeaveDistributionChart } from '../components/charts/LeaveDistributionChart.jsx';
import { HeadcountAnalyticsChart } from '../components/charts/HeadcountAnalyticsChart.jsx';
import { PayrollTrendChart } from '../components/charts/PayrollTrendChart.jsx';
import { TurnoverAnalysisChart } from '../components/charts/TurnoverAnalysisChart.jsx';
import { DepartmentCostComparisonChart } from '../components/charts/DepartmentCostComparisonChart.jsx';

// Inspection Modals
import { EmployeeAttendanceInspectionModal } from '../components/modals/EmployeeAttendanceInspectionModal.jsx';
import { EmployeeLeaveInspectionModal } from '../components/modals/EmployeeLeaveInspectionModal.jsx';
import { PayrollInspectionModal } from '../components/modals/PayrollInspectionModal.jsx';
import { DepartmentCostInspectionModal } from '../components/modals/DepartmentCostInspectionModal.jsx';

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

  // Inspection Modal State
  const [inspectionModal, setInspectionModal] = useState({
    isOpen: false,
    type: '',
    targetId: ''
  });

  const handleOpenInspect = ({ type, targetId }) => {
    setInspectionModal({
      isOpen: true,
      type: type || activeType,
      targetId
    });
  };

  const handleCloseInspect = () => {
    setInspectionModal({
      isOpen: false,
      type: '',
      targetId: ''
    });
  };

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

  const { data: response, isLoading, isFetching, refetch } = useGetReportDataQuery({
    type: activeType,
    from,
    to,
    departmentId,
    view: subView,
    page,
    limit: 25
  });

  if (isLoading && !response) {
    return (
      <div className="space-y-6">
        <ScreenSkeleton variant="table" />
      </div>
    );
  }

  const reportData = response?.data || {};
  const summary = reportData.summary;

  const supportsEmployeeView = activeType === 'attendance' || activeType === 'leave';

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Reports & Organizational Intelligence"
        description="Comprehensive analytical reports across attendance, leaves, payroll liabilities, and demographics."
        actions={<RefreshButton onRefresh={refetch} isFetching={isFetching} />}
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

      {/* 5. Executive Metric KPI Cards Across All 6 Domains */}
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* A. ATTENDANCE KPI SUMMARY */}
          {activeType === 'attendance' && (
            <>
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Attendance Rate</span>
                  <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
                    {summary.attendanceRate}%
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Based on {summary.totalRecords} logged records
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Productive Hours</span>
                  <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
                    {summary.totalWorkHours} <span className="text-sm font-normal text-slate-500">hrs</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Total productive floor hours
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Overtime Recorded</span>
                  <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-[#00C471] leading-none">
                    +{summary.totalOvertimeHours} <span className="text-sm font-normal text-slate-500">hrs</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Total overtime eligible hours
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Incidents</span>
                  <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                    <AlertTriangle className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
                    <span className="text-amber-600 dark:text-amber-400">{summary.totalLates}</span>
                    <span className="text-slate-400 text-lg mx-1 font-normal">/</span>
                    <span className="text-rose-600 dark:text-rose-400">{summary.totalAbsents}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Late arrivals / Unexcused absents
                  </p>
                </div>
              </div>
            </>
          )}

          {/* B. LEAVE KPI SUMMARY */}
          {activeType === 'leave' && (
            <>
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Applications</span>
                  <div className="p-1 rounded-lg bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/50">
                    <FileText className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
                    {summary.totalApplications}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Requests submitted in period
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Approved Leave</span>
                  <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
                    {summary.totalLeaveDays} <span className="text-sm font-normal text-slate-500">days</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    {summary.paidLeaveDays} paid / {summary.unpaidLeaveDays} unpaid (LWP)
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Paid Leaves</span>
                  <div className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400 leading-none">
                    {summary.paidLeaveDays} <span className="text-sm font-normal text-slate-500">days</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Deducted against annual / casual quota
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Pending Action</span>
                  <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 leading-none">
                    {summary.pendingApplications}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Awaiting managerial approval
                  </p>
                </div>
              </div>
            </>
          )}

          {/* C. HEADCOUNT KPI SUMMARY */}
          {activeType === 'headcount' && (
            <>
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Active Headcount</span>
                  <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
                    {summary.totalHeadcount || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Active roster on payroll
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">New Additions</span>
                  <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <UserPlus className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 leading-none">
                    +{summary.newHires || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Joined in selected period
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Separations</span>
                  <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                    <UserMinus className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 leading-none">
                    {summary.periodExits || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Resigned or terminated
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">On Leave Today</span>
                  <div className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
                    {summary.onLeave || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Approved leaves active today
                  </p>
                </div>
              </div>
            </>
          )}

          {/* D. PAYROLL KPI SUMMARY */}
          {activeType === 'payroll' && (
            <>
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Gross Disbursement</span>
                  <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none truncate">
                    Rs {summary.totalGrossPkr || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Total gross payroll liabilities
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Net Take-Home</span>
                  <div className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50">
                    <CreditCard className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400 leading-none truncate">
                    Rs {summary.totalNetPkr || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Total direct net bank transfers
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">FBR Tax Withheld</span>
                  <div className="p-1 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 leading-none truncate">
                    Rs {summary.totalTaxPkr || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Statutory income tax withheld
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Deductions</span>
                  <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none truncate">
                    Rs {summary.totalDeductionsPkr || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    EOBI + tax + loan recoveries
                  </p>
                </div>
              </div>
            </>
          )}

          {/* E. TURNOVER KPI SUMMARY */}
          {activeType === 'turnover' && (
            <>
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Turnover Rate</span>
                  <div className="p-1 rounded-lg bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-900/50">
                    <TrendingUp className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 leading-none">
                    {summary.turnoverRate || '0%'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Separations / Avg Headcount
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Separations</span>
                  <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                    <UserMinus className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
                    {summary.totalExits || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Departures in specified range
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Voluntary Resigned</span>
                  <div className="p-1 rounded-lg bg-orange-50 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 border border-orange-100 dark:border-orange-900/50">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none">
                    {summary.voluntaryResignations || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Voluntary employee exits
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Average Tenure</span>
                  <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 leading-none">
                    {summary.averageTenureMonths || 0} <span className="text-sm font-normal text-slate-500">mos</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Average tenure before exit
                  </p>
                </div>
              </div>
            </>
          )}

          {/* F. DEPARTMENT COST KPI SUMMARY */}
          {activeType === 'department-cost' && (
            <>
              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total Payroll Cost</span>
                  <div className="p-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50">
                    <DollarSign className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white leading-none truncate">
                    Rs {summary.totalCostPkr || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Across all business departments
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Avg Cost / Employee</span>
                  <div className="p-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                    <Users className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 leading-none truncate">
                    Rs {summary.avgCostPerEmployeePkr || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Blended workforce allocation
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Top Spender Dept</span>
                  <div className="p-1 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-900/50">
                    <Building2 className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-lg font-bold text-slate-900 dark:text-white leading-tight truncate">
                    {summary.topDepartmentName || 'N/A'}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Rs {summary.topDepartmentCostPkr || 0}
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-1.5 h-32 flex flex-col justify-between">
                <div className="flex items-center justify-between text-slate-500 dark:text-slate-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider">Total FBR Tax</span>
                  <div className="p-1 rounded-lg bg-teal-50 dark:bg-teal-950/40 text-teal-600 dark:text-teal-400 border border-teal-100 dark:border-teal-900/50">
                    <ShieldCheck className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-bold font-mono tabular-nums text-teal-600 dark:text-teal-400 leading-none truncate">
                    Rs {summary.totalTaxComponentPkr || 0}
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
                    Corporate tax compliance
                  </p>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* 6. Interactive Visual Analytics Suite (Native SVG Charts) */}
      <div className="w-full">
        {activeType === 'attendance' && (
          <AttendanceStatusChart
            chartData={reportData.chartData}
            summary={summary}
            isLoading={isLoading}
          />
        )}
        {activeType === 'leave' && (
          <LeaveDistributionChart
            chartData={reportData.chartData}
            summary={summary}
            isLoading={isLoading}
          />
        )}
        {activeType === 'headcount' && (
          <HeadcountAnalyticsChart
            chartData={reportData.chartData}
            summary={summary}
            isLoading={isLoading}
          />
        )}
        {activeType === 'payroll' && (
          <PayrollTrendChart
            chartData={reportData.chartData}
            summary={summary}
            isLoading={isLoading}
          />
        )}
        {activeType === 'turnover' && (
          <TurnoverAnalysisChart
            chartData={reportData.chartData}
            summary={summary}
            isLoading={isLoading}
          />
        )}
        {activeType === 'department-cost' && (
          <DepartmentCostComparisonChart
            chartData={reportData.chartData}
            summary={summary}
            isLoading={isLoading}
          />
        )}
      </div>

      {/* 7. Action Bar (Title & Export Buttons) */}
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

      {/* 8. Data Table Grid */}
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
        onInspect={handleOpenInspect}
      />

      {/* 9. Drilldown Inspection Modals */}
      <EmployeeAttendanceInspectionModal
        isOpen={inspectionModal.isOpen && inspectionModal.type === 'attendance'}
        onClose={handleCloseInspect}
        employeeId={inspectionModal.targetId}
        from={from}
        to={to}
      />
      <EmployeeLeaveInspectionModal
        isOpen={inspectionModal.isOpen && inspectionModal.type === 'leave'}
        onClose={handleCloseInspect}
        employeeId={inspectionModal.targetId}
      />
      <PayrollInspectionModal
        isOpen={inspectionModal.isOpen && inspectionModal.type === 'payroll'}
        onClose={handleCloseInspect}
        runId={inspectionModal.targetId}
      />
      <DepartmentCostInspectionModal
        isOpen={inspectionModal.isOpen && inspectionModal.type === 'department-cost'}
        onClose={handleCloseInspect}
        departmentId={inspectionModal.targetId}
      />
    </div>
  );
}
