/**
 * @file ShiftFilterBar.jsx
 * @description Multi-dimensional filter toolbar for work shifts and rosters.
 * Supports keyword search, shift type filter (fixed/flexible/night), status, department selector,
 * overnight schedule filter, view mode switcher (table vs cards), and active filter chips with one-click dismiss.
 * Styled in the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  Search,
  X,
  Filter,
  Building2,
  Clock,
  Moon,
  LayoutGrid,
  Table as TableIcon,
  RotateCcw
} from 'lucide-react';

const SHIFT_TYPES = [
  { value: 'fixed', label: 'Fixed Schedule' },
  { value: 'flexible', label: 'Flexible Hours' },
  { value: 'night', label: 'Night Shift' }
];

export function ShiftFilterBar({
  search = '',
  onSearchChange = () => {},
  typeFilter = 'ALL',
  onTypeChange = () => {},
  departmentFilter = 'ALL',
  onDepartmentChange = () => {},
  statusFilter = 'ALL',
  onStatusChange = () => {},
  overnightFilter = 'ALL',
  onOvernightChange = () => {},
  viewMode = 'table',
  onViewModeChange = () => {},
  departmentOptions = [],
  onReset = () => {},
  showStatusFilter = true
}) {
  const hasActiveFilters =
    Boolean(search) ||
    typeFilter !== 'ALL' ||
    departmentFilter !== 'ALL' ||
    overnightFilter !== 'ALL' ||
    (showStatusFilter && statusFilter !== 'ALL');

  return (
    <div className="space-y-3 mb-6">
      {/* Primary Toolbar */}
      <div className="rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] p-3 shadow-xs">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Left: Search input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search shifts by name or uppercase code..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471] transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Dropdowns, Status Pills & View Mode */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Shift Type Dropdown */}
            <div className="relative">
              <select
                value={typeFilter}
                onChange={(e) => onTypeChange(e.target.value)}
                className="text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#00C471] transition-colors cursor-pointer appearance-none"
              >
                <option value="ALL">All Types</option>
                {SHIFT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <Clock className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Department Dropdown */}
            <div className="relative">
              <select
                value={departmentFilter}
                onChange={(e) => onDepartmentChange(e.target.value)}
                className="text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#00C471] transition-colors cursor-pointer appearance-none"
              >
                <option value="ALL">All Departments</option>
                {departmentOptions.map((dept) => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name} ({dept.code})
                  </option>
                ))}
              </select>
              <Building2 className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Day / Overnight Filter */}
            <div className="relative">
              <select
                value={overnightFilter}
                onChange={(e) => onOvernightChange(e.target.value)}
                className="text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#00C471] transition-colors cursor-pointer appearance-none"
              >
                <option value="ALL">All Schedules</option>
                <option value="day">Day Shifts</option>
                <option value="overnight">Overnight (Cross-Midnight)</option>
              </select>
              <Moon className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Pills (Only shown in Active tab) */}
            {showStatusFilter && (
              <div className="inline-flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]">
                {['ALL', 'ACTIVE', 'INACTIVE'].map((status) => (
                  <button
                    key={status}
                    type="button"
                    onClick={() => onStatusChange(status)}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-lg transition-colors ${
                      statusFilter === status
                        ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs font-semibold'
                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                    }`}
                  >
                    {status === 'ALL' ? 'All' : status === 'ACTIVE' ? 'Active' : 'Inactive'}
                  </button>
                ))}
              </div>
            )}

            {/* Reset Button */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-rose-200 dark:border-rose-900/50 text-rose-600 dark:text-rose-400 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors"
                title="Reset all filters"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            )}

            {/* View Mode Toggle Switcher */}
            <div className="inline-flex items-center p-0.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712]">
              <button
                type="button"
                onClick={() => onViewModeChange('table')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'table'
                    ? 'bg-white dark:bg-[#1A3125] text-[#00C471] shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Table View"
                aria-label="Table View"
              >
                <TableIcon className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onViewModeChange('cards')}
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === 'cards'
                    ? 'bg-white dark:bg-[#1A3125] text-[#00C471] shadow-xs'
                    : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
                }`}
                title="Card Grid View"
                aria-label="Card Grid View"
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Filters:
          </span>

          {search && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40">
              Query: &ldquo;{search}&rdquo;
              <button type="button" onClick={() => onSearchChange('')} className="hover:text-emerald-800 dark:hover:text-emerald-200">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {typeFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
              Type: {typeFilter}
              <button type="button" onClick={() => onTypeChange('ALL')} className="hover:text-blue-800 dark:hover:text-blue-200">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {departmentFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40">
              Dept: {departmentOptions.find((d) => d._id === departmentFilter)?.name || departmentFilter}
              <button type="button" onClick={() => onDepartmentChange('ALL')} className="hover:text-purple-800 dark:hover:text-purple-200">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {overnightFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200/50 dark:border-indigo-800/40">
              Schedule: {overnightFilter === 'overnight' ? 'Overnight' : 'Day Shifts'}
              <button type="button" onClick={() => onOvernightChange('ALL')} className="hover:text-indigo-800 dark:hover:text-indigo-200">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {showStatusFilter && statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              Status: {statusFilter}
              <button type="button" onClick={() => onStatusChange('ALL')} className="hover:text-slate-900 dark:hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default ShiftFilterBar;
