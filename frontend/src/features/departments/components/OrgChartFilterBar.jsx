/**
 * @file OrgChartFilterBar.jsx
 * @description Comprehensive Filtering, Search & View Switcher Bar for Org Chart.
 * 
 * FEATURES:
 * - Real-time search with instant match results.
 * - View Mode Selector: Company Wide, Department Tree, My Team, Employee Centric.
 * - Department Filter dropdown with live employee count pills.
 * - Employment Status Filter.
 * - Active filter badges with one-click clear.
 */

import React from 'react';
import {
  Search,
  X,
  Building,
  Briefcase,
  Users,
  RotateCcw,
  Sparkles,
  GitBranch,
  ShieldAlert
} from 'lucide-react';

export const OrgChartFilterBar = ({
  searchTerm = '',
  onSearchChange,
  onClearSearch,
  viewMode = 'company',
  onChangeViewMode,
  selectedDept = 'ALL',
  onChangeDept,
  departments = [],
  statusFilter = 'active',
  onChangeStatus,
  onResetFilters,
  hasActiveFilters = false,
  totalNodes = 0
}) => {
  return (
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-xs">
      {/* Top Row: View Mode Switcher + Live Headcount Badge */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        {/* View Mode Pills */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125]">
          {[
            { id: 'company', label: 'Company Wide', icon: GitBranch, desc: 'Full corporate hierarchy' },
            { id: 'department', label: 'Department View', icon: Building, desc: 'Units & department heads' },
            { id: 'team', label: 'My Team', icon: Users, desc: 'Direct reporting lines' },
            { id: 'employee', label: 'Focal 360°', icon: Sparkles, desc: 'Manager, peers & reports' }
          ].map((mode) => {
            const Icon = mode.icon;
            const isActive = viewMode === mode.id;
            return (
              <button
                key={mode.id}
                type="button"
                onClick={() => onChangeViewMode && onChangeViewMode(mode.id)}
                title={mode.desc}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#00C471] text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-white dark:hover:bg-[#111D17]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{mode.label}</span>
              </button>
            );
          })}
        </div>

        {/* Headcount Telemetry */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-500 dark:text-slate-400">
            Visible Headcount:
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 dark:bg-emerald-950/70 border border-emerald-200 dark:border-emerald-800/50 text-emerald-700 dark:text-emerald-400 font-mono">
            {totalNodes} Members
          </span>
        </div>
      </div>

      {/* Bottom Row: Search & Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-[260px] max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name, code, designation, or department..."
            value={searchTerm}
            onChange={(e) => onSearchChange && onSearchChange(e.target.value)}
            className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] rounded-xl text-slate-800 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] transition-all"
          />
          {searchTerm && (
            <button
              type="button"
              onClick={onClearSearch}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Dropdowns & Reset */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Department Dropdown */}
          <div className="relative">
            <select
              value={selectedDept}
              onChange={(e) => onChangeDept && onChangeDept(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] cursor-pointer"
            >
              <option value="ALL">All Departments</option>
              {departments.map((dept) => (
                <option key={dept} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
            <Building className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Status Dropdown */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={(e) => onChangeStatus && onChangeStatus(e.target.value)}
              className="appearance-none pl-3 pr-8 py-2 text-xs font-medium rounded-xl bg-slate-50 dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/25 focus:border-[#00C471] cursor-pointer"
            >
              <option value="active">Active Staff Only</option>
              <option value="probation">Probationary Staff</option>
              <option value="all">Include Inactive / All</option>
            </select>
            <Users className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Reset Action */}
          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              title="Reset all active search and filters"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
