/**
 * @file ReportsPage.jsx
 * @description Centralized Multi-Axis Organizational Reports Console.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Rows 7.6, 7.7, 7.8)
 * - Layer: Feature Page (React 18 / Tailwind)
 * - Role Gating: Restricts financial & turnover tabs to HR Manager & Super Admin
 */

import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Clock,
  Calendar,
  DollarSign,
  Users,
  UserMinus,
  PieChart
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

  // Active Report Tab
  const [activeType, setActiveType] = useState('attendance');

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
    setPage(1);
  };

  const handleFilterChange = (newFilters) => {
    if (newFilters.from !== undefined) setFrom(newFilters.from);
    if (newFilters.to !== undefined) setTo(newFilters.to);
    if (newFilters.departmentId !== undefined) setDepartmentId(newFilters.departmentId);
    setPage(1);
  };

  const handleResetFilters = () => {
    setFrom(dayjs().startOf('month').format('YYYY-MM-DD'));
    setTo(dayjs().format('YYYY-MM-DD'));
    setDepartmentId('');
    setPage(1);
  };

  const { data: response, isLoading } = useGetReportDataQuery({
    type: activeType,
    from,
    to,
    departmentId,
    page,
    limit: 25
  });

  const reportData = response?.data || {};

  return (
    <div className="space-y-6">
      {/* 1. Page Header */}
      <PageHeader
        title="Reports & Organizational Intelligence"
        description="Comprehensive analytical reports across attendance, leaves, payroll liabilities, and demographics."
      />

      {/* 2. Report Type Tabs Bar */}
      <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-x-auto">
        {reportTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeType === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
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

      {/* 4. Action Bar (Title & Export Buttons) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {reportData.title || 'Generated Report'}
          </h3>
          <p className="text-xs text-slate-500">
            {reportData.total || 0} total records recorded
          </p>
        </div>

        <ExportButtons
          type={activeType}
          from={from}
          to={to}
          departmentId={departmentId}
        />
      </div>

      {/* 5. Data Table Grid */}
      <ReportDataTable
        columns={reportData.columns || []}
        items={reportData.items || []}
        total={reportData.total || 0}
        page={page}
        limit={25}
        isLoading={isLoading}
        onPageChange={setPage}
      />
    </div>
  );
}
