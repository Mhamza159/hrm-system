/**
 * @file DesignationFilterBar.jsx
 * @description Multi-dimensional filter toolbar for corporate job titles and designations.
 * Supports keyword search, department filtering, grade tier hierarchy, headcount thresholds,
 * active status filters, and active filter chips with one-click dismiss.
 * Styled in the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  Search,
  X,
  Filter,
  Building2,
  Award,
  Users,
  RotateCcw
} from 'lucide-react';

const GRADE_TIERS = ['Junior', 'Mid', 'Senior', 'Lead', 'Executive'];

export function DesignationFilterBar({
  search = '',
  onSearchChange = () => {},
  departmentFilter = 'ALL',
  onDepartmentChange = () => {},
  gradeFilter = 'ALL',
  onGradeChange = () => {},
  statusFilter = 'ALL',
  onStatusChange = () => {},
  headcountFilter = 'ALL',
  onHeadcountFilterChange = () => {},
  departmentOptions = [],
  onReset = () => {},
  showStatusFilter = true
}) {
  const hasActiveFilters =
    Boolean(search) ||
    departmentFilter !== 'ALL' ||
    gradeFilter !== 'ALL' ||
    (showStatusFilter && statusFilter !== 'ALL') ||
    headcountFilter !== 'ALL';

  return (
    <div className="space-y-3">
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
              placeholder="Search designations by title or code..."
              className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471] transition-colors"
            />
            {search && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Right: Dropdowns & Status Pills */}
          <div className="flex flex-wrap items-center gap-2">
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

            {/* Grade Tier Dropdown */}
            <div className="relative">
              <select
                value={gradeFilter}
                onChange={(e) => onGradeChange(e.target.value)}
                className="text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#00C471] transition-colors cursor-pointer appearance-none"
              >
                <option value="ALL">All Grades</option>
                {GRADE_TIERS.map((tier) => (
                  <option key={tier} value={tier}>
                    {tier} Tier
                  </option>
                ))}
              </select>
              <Award className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Headcount Threshold Dropdown */}
            <div className="relative">
              <select
                value={headcountFilter}
                onChange={(e) => onHeadcountFilterChange(e.target.value)}
                className="text-xs py-2 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] text-slate-700 dark:text-slate-300 focus:outline-none focus:border-[#00C471] transition-colors cursor-pointer appearance-none"
              >
                <option value="ALL">All Headcount</option>
                <option value="STAFFED">Staffed (≥1 member)</option>
                <option value="EMPTY">Empty (0 members)</option>
              </select>
              <Users className="w-3 h-3 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Status Pills */}
            {showStatusFilter && (
              <div className="flex items-center rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1712] p-0.5">
                {[
                  { id: 'ALL', label: 'All' },
                  { id: 'ACTIVE', label: 'Active' },
                  { id: 'INACTIVE', label: 'Inactive' }
                ].map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onStatusChange(s.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                      statusFilter === s.id
                        ? 'bg-white dark:bg-[#1A3125] text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            )}

            {/* Reset Filters Shortcut */}
            {hasActiveFilters && (
              <button
                type="button"
                onClick={onReset}
                title="Reset all filters"
                className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Active Filter Chips */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 px-1">
          <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" />
            Active Filters:
          </span>

          {search && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/50 dark:border-emerald-800/40">
              <span>Keyword: &quot;{search}&quot;</span>
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-emerald-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {departmentFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/50 dark:border-blue-800/40">
              <span>
                Dept: {departmentOptions.find((d) => d._id === departmentFilter)?.name || departmentFilter}
              </span>
              <button
                type="button"
                onClick={() => onDepartmentChange('ALL')}
                className="hover:text-blue-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {gradeFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-400 border border-purple-200/50 dark:border-purple-800/40">
              <span>Grade: {gradeFilter}</span>
              <button
                type="button"
                onClick={() => onGradeChange('ALL')}
                className="hover:text-purple-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {headcountFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200/50 dark:border-amber-800/40">
              <span>Headcount: {headcountFilter}</span>
              <button
                type="button"
                onClick={() => onHeadcountFilterChange('ALL')}
                className="hover:text-amber-700"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {showStatusFilter && statusFilter !== 'ALL' && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              <span>Status: {statusFilter}</span>
              <button
                type="button"
                onClick={() => onStatusChange('ALL')}
                className="hover:text-slate-900"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onReset}
            className="text-[11px] font-medium text-slate-400 hover:text-rose-500 underline ml-1 cursor-pointer"
          >
            Clear all
          </button>
        </div>
      )}
    </div>
  );
}
