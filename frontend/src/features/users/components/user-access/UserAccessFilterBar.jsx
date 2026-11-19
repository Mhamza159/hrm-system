/**
 * @file UserAccessFilterBar.jsx
 * @description Enterprise Multi-Criteria Filter Suite for User Access Explorer.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  X,
  Shield,
  Building2,
  CheckCircle2,
  XCircle,
  Lock
} from 'lucide-react';

export function UserAccessFilterBar({
  search,
  onSearchChange,
  roles = [],
  selectedRoleId,
  onRoleChange,
  departments = [],
  selectedDepartmentId,
  onDepartmentChange,
  selectedStatus,
  onStatusChange,
  selectedAccessStatus,
  onAccessStatusChange,
  onResetFilters
}) {
  const [localSearch, setLocalSearch] = useState(search);

  // Debounce search update
  useEffect(() => {
    const timer = setTimeout(() => {
      onSearchChange(localSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [localSearch, onSearchChange]);

  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // Count active filters
  const activeFiltersCount =
    (search ? 1 : 0) +
    (selectedRoleId !== 'all' ? 1 : 0) +
    (selectedDepartmentId !== 'all' ? 1 : 0) +
    (selectedStatus !== 'all' ? 1 : 0) +
    (selectedAccessStatus !== 'all' ? 1 : 0);

  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] p-4 shadow-xs space-y-3.5">
      {/* Top Filter Controls Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search by name, email, employee code..."
            className="w-full pl-9 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                onSearchChange('');
              }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role Filter Dropdown */}
        <div className="relative">
          <Shield className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={selectedRoleId}
            onChange={(e) => onRoleChange(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] cursor-pointer appearance-none"
          >
            <option value="all">All Roles</option>
            {Array.isArray(roles) && roles.filter(Boolean).map((r) => (
              <option key={r._id || r.name} value={r._id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        {/* Department Filter Dropdown */}
        <div className="relative">
          <Building2 className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          <select
            value={selectedDepartmentId}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="w-full pl-8 pr-8 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] cursor-pointer appearance-none"
          >
            <option value="all">All Departments</option>
            {Array.isArray(departments) && departments.filter(Boolean).map((dept) => (
              <option key={dept._id || dept.name} value={dept._id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Access Status Filter */}
        <div>
          <select
            value={selectedAccessStatus}
            onChange={(e) => onAccessStatusChange(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471] cursor-pointer"
          >
            <option value="all">All Access Types</option>
            <option value="assigned">Assigned Roles Only</option>
            <option value="unassigned">Unassigned (No Roles)</option>
          </select>
        </div>
      </div>

      {/* Bottom Segmented Chips Row */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1 border-t border-slate-100 dark:border-[#1A3125]">
        {/* Account Status Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Status:
          </span>

          {[
            { id: 'all', label: 'All Accounts' },
            { id: 'active', label: 'Active', icon: CheckCircle2, color: 'text-emerald-500' },
            { id: 'inactive', label: 'Deactivated', icon: XCircle, color: 'text-slate-400' },
            { id: 'locked', label: 'Locked Out', icon: Lock, color: 'text-amber-500' }
          ].map((chip) => {
            const isSelected = selectedStatus === chip.id;
            const Icon = chip.icon;
            return (
              <button
                type="button"
                key={chip.id}
                onClick={() => onStatusChange(chip.id)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                  isSelected
                    ? 'bg-slate-900 text-white border-slate-900 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-500'
                    : 'bg-slate-50 dark:bg-[#0A110D] border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5'
                }`}
              >
                {Icon && <Icon className={`w-3 h-3 ${chip.color || ''}`} />}
                <span>{chip.label}</span>
              </button>
            );
          })}
        </div>

        {/* Clear Filters Button */}
        {activeFiltersCount > 0 && (
          <button
            type="button"
            onClick={onResetFilters}
            className="text-xs font-semibold text-rose-600 dark:text-rose-400 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer ml-auto"
          >
            <X className="w-3.5 h-3.5" />
            <span>Reset Filters ({activeFiltersCount})</span>
          </button>
        )}
      </div>
    </div>
  );
}
