/**
 * @file ReportFilterToolbar.jsx
 * @description Dynamic Multi-Parameter Filter Toolbar for Reports.
 * 
 * SPECIFICATION:
 * - Module: M7 Dashboard & Reports (BUILD-GUIDE Section 13 · Row 7.7)
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
    <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wider">
            Report Filters
          </span>
        </div>

        {/* Quick Presets */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => handlePreset('this_month')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            This Month
          </button>
          <button
            type="button"
            onClick={() => handlePreset('last_month')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Last Month
          </button>
          <button
            type="button"
            onClick={() => handlePreset('quarter')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Last 3 Months
          </button>
          <button
            type="button"
            onClick={() => handlePreset('ytd')}
            className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
          >
            Year to Date
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 dark:border-slate-800">
        {/* Date From */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">From Date</label>
          <input
            type="date"
            value={from || ''}
            onChange={(e) => onFilterChange({ from: e.target.value })}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Date To */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">To Date</label>
          <input
            type="date"
            value={to || ''}
            onChange={(e) => onFilterChange({ to: e.target.value })}
            className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Department Filter */}
        <div>
          <label className="block text-[11px] font-medium text-slate-500 mb-1">Department</label>
          <div className="flex items-center gap-2">
            <select
              value={departmentId || ''}
              onChange={(e) => onFilterChange({ departmentId: e.target.value })}
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">All Departments</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={onReset}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
              title="Reset all filters"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
