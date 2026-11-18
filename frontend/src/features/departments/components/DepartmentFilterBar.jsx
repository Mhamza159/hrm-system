/**
 * @file DepartmentFilterBar.jsx
 * @description Search and filter toolbar for active and archived department views.
 * Supports multi-dimensional filtering by search, parent division, status,
 * staff headcount (staffed/empty), and leadership assignment status.
 */

import React from 'react';
import { Search, X, RotateCcw, Filter, Users, UserCheck, FolderMinus, UserX } from 'lucide-react';

export function DepartmentFilterBar({
  search = '',
  onSearchChange,
  parentId = 'ALL',
  onParentChange,
  status = 'ALL',
  onStatusChange,
  headcountFilter = 'ALL',
  onHeadcountFilterChange,
  leadershipFilter = 'ALL',
  onLeadershipFilterChange,
  parentOptions = [],
  onReset,
  showStatusFilter = true
}) {
  const hasActiveFilters =
    Boolean(search) ||
    parentId !== 'ALL' ||
    (showStatusFilter && status !== 'ALL') ||
    headcountFilter !== 'ALL' ||
    leadershipFilter !== 'ALL';

  const selectedParent = parentOptions.find((p) => (p._id || p.id) === parentId);

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

          {/* Headcount Filter Selector */}
          {onHeadcountFilterChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Staff:</span>
              <select
                value={headcountFilter}
                onChange={(e) => onHeadcountFilterChange(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#00C471]/30 cursor-pointer"
              >
                <option value="ALL">All Headcount</option>
                <option value="STAFFED">Staffed (≥1 member)</option>
                <option value="EMPTY">Empty (0 members)</option>
              </select>
            </div>
          )}

          {/* Leadership Filter Selector */}
          {onLeadershipFilterChange && (
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium text-slate-400 hidden sm:inline">Leader:</span>
              <select
                value={leadershipFilter}
                onChange={(e) => onLeadershipFilterChange(e.target.value)}
                className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-700 dark:text-slate-300 focus:outline-hidden focus:ring-2 focus:ring-[#00C471]/30 cursor-pointer"
              >
                <option value="ALL">All Leadership</option>
                <option value="HEAD_ASSIGNED">Head Appointed</option>
                <option value="NO_HEAD">Head Unassigned</option>
              </select>
            </div>
          )}

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
            disabled={!hasActiveFilters}
            className={`inline-flex items-center gap-1 px-3 py-2 text-xs font-semibold rounded-xl border transition-colors cursor-pointer ${
              hasActiveFilters
                ? 'border-emerald-200 dark:border-[#1A3125] text-[#00C471] bg-emerald-50/50 dark:bg-[#15241C] hover:bg-emerald-100/50'
                : 'border-slate-200 dark:border-[#1A3125] text-slate-400 dark:text-slate-500 opacity-60 cursor-not-allowed'
            }`}
            title="Reset all filters"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Reset</span>
          </button>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-[#1A3125]">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
            <Filter className="w-3 h-3" />
            Active Filters:
          </span>

          {search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-[#1A3125] dark:text-slate-300 border border-slate-200/80 dark:border-[#234232]">
              <span>Keyword: "{search}"</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {parentId !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-emerald-50 text-[#00C471] dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60">
              <span>Division: {parentId === 'TOP' ? 'Top-Level' : selectedParent?.name || parentId}</span>
              <button
                type="button"
                onClick={() => onParentChange('ALL')}
                className="text-[#00C471] hover:text-emerald-700 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {showStatusFilter && status !== 'ALL' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-slate-100 text-slate-700 dark:bg-[#1A3125] dark:text-slate-300 border border-slate-200/80 dark:border-[#234232]">
              <span>Status: {status}</span>
              <button
                type="button"
                onClick={() => onStatusChange('ALL')}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {headcountFilter !== 'ALL' && onHeadcountFilterChange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/60">
              <span>Staff: {headcountFilter === 'STAFFED' ? 'Staffed (≥1)' : 'Empty (0)'}</span>
              <button
                type="button"
                onClick={() => onHeadcountFilterChange('ALL')}
                className="text-blue-500 hover:text-blue-700 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {leadershipFilter !== 'ALL' && onLeadershipFilterChange && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-medium bg-purple-50 text-purple-700 dark:bg-purple-950/40 dark:text-purple-400 border border-purple-200/60 dark:border-purple-800/60">
              <span>Leadership: {leadershipFilter === 'HEAD_ASSIGNED' ? 'Head Appointed' : 'Unassigned'}</span>
              <button
                type="button"
                onClick={() => onLeadershipFilterChange('ALL')}
                className="text-purple-500 hover:text-purple-700 dark:hover:text-white"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onReset}
            className="text-[11px] text-slate-500 hover:text-rose-500 dark:text-slate-400 dark:hover:text-rose-400 underline decoration-dotted ml-auto cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
