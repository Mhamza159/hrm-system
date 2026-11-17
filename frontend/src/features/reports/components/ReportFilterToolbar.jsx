/**
 * @file ReportFilterToolbar.jsx
 * @description Dynamic Multi-Parameter Filter Toolbar for Reports.
 * Styled in Forest & Emerald Enterprise theme with comprehensive 8+ date presets,
 * synchronized date pickers, department filtering, and active preset tracking.
 */

import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { useGetDepartmentsQuery } from '../../departments/departmentsApi.js';
import { toDateInputString } from '../../../lib/formatters.js';

function computeActivePreset(from, to) {
  if (!from || !to) return '';
  const now = new Date();
  const todayStr = toDateInputString(now);

  if (from === todayStr && to === todayStr) return 'today';

  const yest = new Date(now);
  yest.setDate(yest.getDate() - 1);
  const yestStr = toDateInputString(yest);
  if (from === yestStr && to === yestStr) return 'yesterday';

  const thisMonthStart = toDateInputString(new Date(now.getFullYear(), now.getMonth(), 1));
  if (from === thisMonthStart && to === todayStr) return 'this_month';

  const lastMonthStart = toDateInputString(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const lastMonthEnd = toDateInputString(new Date(now.getFullYear(), now.getMonth(), 0));
  if (from === lastMonthStart && to === lastMonthEnd) return 'last_month';

  const yearStart = toDateInputString(new Date(now.getFullYear(), 0, 1));
  if (from === yearStart && to === todayStr) return 'ytd';

  return '';
}

export function ReportFilterToolbar({
  from,
  to,
  departmentId,
  onFilterChange,
  onReset
}) {
  const { data: deptResponse } = useGetDepartmentsQuery({ limit: 100 });
  const departments = deptResponse?.data?.departments || deptResponse?.data || [];

  const activePreset = computeActivePreset(from, to);

  const handlePreset = (preset) => {
    const now = new Date();
    const todayStr = toDateInputString(now);
    let newFrom = '';
    let newTo = todayStr;

    switch (preset) {
      case 'today': {
        newFrom = todayStr;
        newTo = todayStr;
        break;
      }
      case 'yesterday': {
        const yest = new Date(now);
        yest.setDate(yest.getDate() - 1);
        const yestStr = toDateInputString(yest);
        newFrom = yestStr;
        newTo = yestStr;
        break;
      }
      case 'this_week': {
        const d = new Date(now);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        const monday = new Date(d.setDate(diff));
        newFrom = toDateInputString(monday);
        newTo = todayStr;
        break;
      }
      case 'last_week': {
        const d = new Date(now);
        const day = d.getDay();
        const lastMonDiff = d.getDate() - day - 6 + (day === 0 ? -6 : 1);
        const lastMon = new Date(now.getFullYear(), now.getMonth(), lastMonDiff);
        const lastSun = new Date(now.getFullYear(), now.getMonth(), lastMonDiff + 6);
        newFrom = toDateInputString(lastMon);
        newTo = toDateInputString(lastSun);
        break;
      }
      case 'this_month': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1);
        newFrom = toDateInputString(start);
        newTo = todayStr;
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
        const currentQuarter = Math.floor(now.getMonth() / 3);
        const start = new Date(now.getFullYear(), currentQuarter * 3, 1);
        newFrom = toDateInputString(start);
        newTo = todayStr;
        break;
      }
      case 'ytd': {
        const start = new Date(now.getFullYear(), 0, 1);
        newFrom = toDateInputString(start);
        newTo = todayStr;
        break;
      }
      default:
        break;
    }

    onFilterChange({ from: newFrom, to: newTo });
  };

  const presets = [
    { id: 'today', label: 'Today' },
    { id: 'yesterday', label: 'Yesterday' },
    { id: 'this_week', label: 'This Week' },
    { id: 'last_week', label: 'Last Week' },
    { id: 'this_month', label: 'This Month' },
    { id: 'last_month', label: 'Last Month' },
    { id: 'quarter', label: 'This Quarter' },
    { id: 'ytd', label: 'This Year' }
  ];

  const hasActiveFilters = Boolean(departmentId || activePreset !== 'this_month');

  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl p-4 sm:p-5 border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-4 transition-colors">
      {/* Header Row: Filter Title & Quick Presets */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-[#00C471] border border-emerald-500/20 flex items-center justify-center">
            <Filter className="w-3.5 h-3.5" />
          </div>
          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
            Report Parameters & Scope
          </span>
        </div>

        {/* 8+ Quick Presets Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {presets.map((p) => {
            const isActive = activePreset === p.id;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => handlePreset(p.id)}
                className={`h-7 px-2.5 rounded-lg text-[11px] font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-[#00C471] text-white shadow-xs'
                    : 'bg-slate-100 hover:bg-slate-200/80 dark:bg-[#13221B] dark:hover:bg-[#1A3125] text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-[#1A3125]'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Date Pickers & Department Filter Row */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-3 border-t border-slate-100 dark:border-[#1A3125]">
        {/* Date From */}
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-[#7E9E8F] uppercase tracking-wider mb-1">
            From Date
          </label>
          <input
            type="date"
            value={from || ''}
            onChange={(e) => onFilterChange({ from: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14] text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#00C471] transition-all"
          />
        </div>

        {/* Date To */}
        <div className="sm:col-span-3">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-[#7E9E8F] uppercase tracking-wider mb-1">
            To Date
          </label>
          <input
            type="date"
            value={to || ''}
            onChange={(e) => onFilterChange({ to: e.target.value })}
            className="w-full h-9 px-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14] text-xs font-mono text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#00C471] transition-all"
          />
        </div>

        {/* Department Scope Selector */}
        <div className="sm:col-span-6">
          <label className="block text-[10px] font-bold text-slate-400 dark:text-[#7E9E8F] uppercase tracking-wider mb-1">
            Department Scope
          </label>
          <div className="flex items-center gap-2">
            <select
              value={departmentId || ''}
              onChange={(e) => onFilterChange({ departmentId: e.target.value })}
              className="flex-1 h-9 px-3 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14] text-xs text-slate-900 dark:text-slate-100 focus:outline-none focus:border-[#00C471] transition-all cursor-pointer"
            >
              <option value="">All Departments (Organization-Wide)</option>
              {departments.map((dept) => (
                <option key={dept._id} value={dept._id}>
                  {dept.name}
                </option>
              ))}
            </select>

            {/* Reset Filters Action */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="h-9 px-3 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-slate-100 dark:bg-[#13221B] border border-slate-200 dark:border-[#1A3125] transition flex items-center gap-1.5 shrink-0 cursor-pointer shadow-xs"
                title="Reset filters to defaults"
              >
                <RotateCcw className="w-3.5 h-3.5 text-amber-500" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportFilterToolbar;
