/**
 * @file ChangeRequestFilterBar.jsx
 * @description Enterprise Filter & Search Toolbar for Change Requests.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React from 'react';
import {
  Search,
  Filter,
  X,
  RotateCcw
} from 'lucide-react';
import { CATEGORY_CONFIG, STATUS_CONFIG } from './changeRequestTheme.js';

export function ChangeRequestFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
  category,
  onCategoryChange,
  priority,
  onPriorityChange,
  departments = [],
  departmentId,
  onDepartmentChange,
  onResetFilters
}) {
  const hasActiveFilters =
    Boolean(search) ||
    status !== 'all' ||
    category !== 'all' ||
    priority !== 'all' ||
    departmentId !== 'all';

  const statusOptions = [
    { id: 'all', label: 'All Statuses' },
    { id: 'pending', label: 'Pending Review' },
    { id: 'under_review', label: 'Under Review' },
    { id: 'approved', label: 'Approved' },
    { id: 'rejected', label: 'Rejected' },
    { id: 'returned', label: 'Returned' }
  ];

  return (
    <div className="space-y-3 bg-white dark:bg-[#111D17] p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs">
      {/* Top Row: Search & Filters */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3">
        {/* Search Input (5 Cols) */}
        <div className="lg:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search by employee name, code, reason, or field..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 transition-all"
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

        {/* Category Select (3 Cols) */}
        <div className="lg:col-span-3">
          <select
            value={category}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
          >
            <option value="all">All Categories</option>
            {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
              <option key={key} value={key}>
                {cfg.label}
              </option>
            ))}
          </select>
        </div>

        {/* Department Select (2 Cols) */}
        <div className="lg:col-span-2">
          <select
            value={departmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Priority Select (2 Cols) */}
        <div className="lg:col-span-2">
          <select
            value={priority}
            onChange={(e) => onPriorityChange(e.target.value)}
            className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A110D] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30"
          >
            <option value="all">All Priorities</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      {/* Bottom Row: Status Quick Tabs & Active Filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#1A3125]">
        {/* Status Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          {statusOptions.map((opt) => {
            const isSelected = status === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => onStatusChange(opt.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-[#00C471] text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {/* Clear Filters Trigger */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-[11px] font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors cursor-pointer shrink-0"
          >
            <RotateCcw className="w-3 h-3" /> Reset Filters
          </button>
        )}
      </div>

      {/* Active Filter Tags */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px]">
          <span className="text-slate-400 dark:text-slate-500 font-medium flex items-center gap-1 mr-1">
            <Filter className="w-3 h-3" /> Active:
          </span>

          {search && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              Query: "{search}"
              <button type="button" onClick={() => onSearchChange('')} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {category !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              Category: {CATEGORY_CONFIG[category]?.label || category}
              <button type="button" onClick={() => onCategoryChange('all')} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              Status: {STATUS_CONFIG[status]?.label || status}
              <button type="button" onClick={() => onStatusChange('all')} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {priority !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              Priority: {priority}
              <button type="button" onClick={() => onPriorityChange('all')} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {departmentId !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40">
              Dept: {departments.find((d) => d._id === departmentId)?.name || 'Filtered'}
              <button type="button" onClick={() => onDepartmentChange('all')} className="hover:opacity-75">
                <X className="w-3 h-3" />
              </button>
            </span>
          )}
        </div>
      )}
    </div>
  );
}
