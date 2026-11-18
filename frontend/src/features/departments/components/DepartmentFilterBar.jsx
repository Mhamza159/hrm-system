/**
 * @file DepartmentFilterBar.jsx
 * @description Search and filter toolbar for active and archived department views.
 */

import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

export function DepartmentFilterBar({
  search = '',
  onSearchChange,
  parentId = 'ALL',
  onParentChange,
  status = 'ALL',
  onStatusChange,
  parentOptions = [],
  onReset,
  showStatusFilter = true
}) {
  return (
    <div className="p-4 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl shadow-xs space-y-3">
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Bar */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by department name or code..."
            className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Parent Division Selector */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Division:</span>
            <select
              value={parentId}
              onChange={(e) => onParentChange(e.target.value)}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#00C471]/30 cursor-pointer"
            >
              <option value="ALL">All Divisions</option>
              <option value="TOP">Top-Level Directorates</option>
              {parentOptions.map((p) => (
                <option key={p._id || p.id} value={p._id || p.id}>
                  {p.name} ({p.code})
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter Pills (if active tab) */}
          {showStatusFilter && (
            <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0E1712] border border-slate-200/80 dark:border-[#1A3125]">
              {['ALL', 'ACTIVE', 'INACTIVE'].map((opt) => (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onStatusChange(opt)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg transition-all cursor-pointer ${
                    status === opt
                      ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                  }`}
                >
                  {opt === 'ALL' ? 'All' : opt === 'ACTIVE' ? 'Active' : 'Inactive'}
                </button>
              ))}
            </div>
          )}

          {/* Reset Filters */}
          <button
            type="button"
            onClick={onReset}
            className="inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-[#15241C] transition-colors cursor-pointer"
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );
}
