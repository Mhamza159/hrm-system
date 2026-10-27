/**
 * @file ReportFilterToolbar.jsx
 * @description Dynamic Multi-Parameter Filter Toolbar for Reports.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.7)
 * - Design: Forest & Emerald Craft (DESIGN.md)
 * - Layer: Component (React 18 / Tailwind)
 */

import React from 'react';
import { Filter, Calendar, Building2, RotateCcw } from 'lucide-react';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { toDateInputString } from '../../../lib/formatters.js';

export function ReportFilterToolbar({
  from,
  to,
  departmentId,
  onFilterChange,
  onReset
}) {
  const { data: deptResponse } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptResponse?.data?.departments || deptResponse?.data || [];

  const handlePreset = (preset) => {
    const now = new Date();
    let newFrom = '';
    let newTo = toDateInputString(now);

    switch (preset) {
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        newFrom = toDateInputString(start);
        break;
      }
      case 'last_month': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const end = new Date(now.getFullYear(), now.getMonth(), 0);
        newFrom = toDateInputString(start);
        newTo = toDateInputString(end);
        break;
      }
      case 'quarter': {
        const start = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        newFrom = toDateInputString(start);
        break;
      }
      case 'ytd': {
        const start = new Date(now.getFullYear(), 0, 1);
        newFrom = toDateInputString(start);
        break;
      }
      default:
        break;
    }

    onFilterChange({ from: newFrom, to: newTo });
  };

  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl p-4 border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-3.5 transition-colors">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-100 dark:border-emerald-900/50">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Report Parameters & Scope
          </span>
        </div>

        {/* Quick Date Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1 hidden sm:inline">Presets:</span>
          <button
            type="button"
            onClick={() => handlePreset('this_month')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200/80 dark:bg-[#13221B] dark:hover:bg-[#1A3125] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-[#1A3125] transition-all hover:border-slate-300 active:scale-95"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => handlePreset('last_month')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200/80 dark:bg-[#13221B] dark:hover:bg-[#1A3125] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-[#1A3125] transition-all hover:border-slate-300 active:scale-95"
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => handlePreset('quarter')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200/80 dark:bg-[#13221B] dark:hover:bg-[#1A3125] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-[#1A3125] transition-all hover:border-slate-300 active:scale-95"
          >
            Last 3 Months
          </button>
          <button
            type="button"
            onClick={() => handlePreset('ytd')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200/80 dark:bg-[#13221B] dark:hover:bg-[#1A3125] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-[#1A3125] transition-all hover:border-slate-300 active:scale-95"
          >
            Year to Date
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-[#1A3125]/80">
        {/* Date From */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            From Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={from || ''}
              onChange={(e) => onFilterChange({ from: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#13221B] text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all"
            />
          </div>
        </div>

        {/* Date To */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            To Date
          </label>
          <div className="relative">
            <input
              type="date"
              value={to || ''}
              onChange={(e) => onFilterChange({ to: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#13221B] text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all"
            />
          </div>
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5">
            Department Scope
          </label>
          <div className="flex items-center gap-2">
            <select
              value={departmentId || ''}
              onChange={(e) => onFilterChange({ departmentId: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#13221B] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all cursor-pointer"
            >
              <option value="">All Departments (Organization-Wide)</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onReset}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] transition-colors shrink-0 active:rotate-180 duration-200"
              title="Reset all filters to current month defaults"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
