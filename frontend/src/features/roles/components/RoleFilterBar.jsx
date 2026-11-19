/**
 * @file RoleFilterBar.jsx
 * @description Multi-dimensional Filter Toolbar for Enterprise Role Directory.
 * Supports Search, Role Type, Headcount status, Active status, and View Mode Toggle (Table vs Cards).
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  Search,
  X,
  List,
  LayoutGrid,
  RotateCcw,
  Shield,
  Lock
} from 'lucide-react';
import { cn } from '../../../lib/utils.js';

export function RoleFilterBar({
  search = '',
  onSearchChange,
  roleType = 'all', // 'all' | 'system' | 'custom'
  onRoleTypeChange,
  status = 'all', // 'all' | 'active' | 'inactive'
  onStatusChange,
  headcount = 'all', // 'all' | 'staffed' | 'empty'
  onHeadcountChange,
  viewMode = 'table', // 'table' | 'cards'
  onViewModeChange,
  onResetFilters,
  _totalCount = 0
}) {
  const hasActiveFilters =
    Boolean(search.trim()) ||
    roleType !== 'all' ||
    status !== 'all' ||
    headcount !== 'all';

  return (
    <div className="space-y-2.5 mb-4">
      {/* Top Controls Row */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search input */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search roles by name, slug, or capability..."
            className="w-full pl-9 pr-8 py-2 rounded-xl text-xs bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] transition-all"
          />
          {search && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filters Group + View Toggle */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Role Type Selector */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0E1A14] border border-slate-200 dark:border-[#1A3125] text-xs font-semibold">
            <button
              type="button"
              onClick={() => onRoleTypeChange('all')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg transition-all cursor-pointer',
                roleType === 'all'
                  ? 'bg-white dark:bg-[#111D17] text-slate-900 dark:text-white shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              All Types
            </button>
            <button
              type="button"
              onClick={() => onRoleTypeChange('system')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1',
                roleType === 'system'
                  ? 'bg-white dark:bg-[#111D17] text-amber-600 dark:text-amber-400 shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Lock className="w-3 h-3" />
              <span>System</span>
            </button>
            <button
              type="button"
              onClick={() => onRoleTypeChange('custom')}
              className={cn(
                'px-2.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1',
                roleType === 'custom'
                  ? 'bg-white dark:bg-[#111D17] text-[#00C471] shadow-2xs font-bold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              )}
            >
              <Shield className="w-3 h-3" />
              <span>Custom</span>
            </button>
          </div>

          {/* Headcount Filter Dropdown */}
          <select
            value={headcount}
            onChange={(e) => onHeadcountChange(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 cursor-pointer"
          >
            <option value="all">Headcount: All</option>
            <option value="staffed">Staffed (≥1)</option>
            <option value="empty">Empty (0)</option>
          </select>

          {/* Status Filter Dropdown */}
          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="px-3 py-2 rounded-xl text-xs font-semibold bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 cursor-pointer"
          >
            <option value="all">Status: All</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* View Mode Toggle (Table vs Cards) */}
          <div className="flex items-center p-1 rounded-xl bg-slate-100 dark:bg-[#0E1A14] border border-slate-200 dark:border-[#1A3125] text-xs font-semibold">
            <button
              type="button"
              onClick={() => onViewModeChange('table')}
              title="High-Density Table View"
              className={cn(
                'p-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'table'
                  ? 'bg-white dark:bg-[#111D17] text-[#00C471] shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              )}
            >
              <List className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => onViewModeChange('cards')}
              title="Visual Role Cards Grid View"
              className={cn(
                'p-1.5 rounded-lg transition-all cursor-pointer',
                viewMode === 'cards'
                  ? 'bg-white dark:bg-[#111D17] text-[#00C471] shadow-2xs'
                  : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
              )}
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Active Filter Chips Bar */}
      {hasActiveFilters && (
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Filters:
          </span>

          {search.trim() && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-slate-100 dark:bg-[#1A3125] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#1A3125]">
              Search: "{search}"
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {roleType !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200/50 dark:border-amber-800/40">
              Type: {roleType === 'system' ? 'System Roles' : 'Custom Roles'}
              <button
                type="button"
                onClick={() => onRoleTypeChange('all')}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {headcount !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200/50 dark:border-blue-800/40">
              Headcount: {headcount === 'staffed' ? 'Staffed (≥1)' : 'Empty (0)'}
              <button
                type="button"
                onClick={() => onHeadcountChange('all')}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          {status !== 'all' && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200/50 dark:border-emerald-800/40">
              Status: {status === 'active' ? 'Active' : 'Inactive'}
              <button
                type="button"
                onClick={() => onStatusChange('all')}
                className="hover:text-red-500 cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          )}

          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset All</span>
          </button>
        </div>
      )}
    </div>
  );
}

export default RoleFilterBar;
