/**
 * @file AuditLogFilterToolbar.jsx
 * @description Advanced Multi-Criteria Filter Bar for Audit Log Forensic Exploration.
 * Features active filter chips, clearable search, and Elvara theme inputs.
 */

import React from 'react';
import { Search, RotateCcw, Filter, X } from 'lucide-react';
import { AUDIT_BUTTON_STYLES } from '../utils/auditTheme.js';

const MODULE_OPTIONS = [
  { value: '', label: 'All Modules' },
  { value: 'auth', label: 'Auth & Security' },
  { value: 'employee', label: 'Employee Management' },
  { value: 'department', label: 'Departments & Org' },
  { value: 'designation', label: 'Designations' },
  { value: 'attendance', label: 'Attendance & Shifts' },
  { value: 'leave', label: 'Leave & Holidays' },
  { value: 'payroll', label: 'Payroll & Compliance' },
  { value: 'role', label: 'Roles & RBAC' },
  { value: 'assets', label: 'Assets Custody' },
  { value: 'recruitment', label: 'Recruitment & ATS' },
  { value: 'settings', label: 'Company Settings' },
  { value: 'reports', label: 'Reports & Exports' },
  { value: 'audit', label: 'Audit Trail' }
];

const CATEGORY_OPTIONS = [
  { value: '', label: 'All Categories' },
  { value: 'AUTHENTICATION', label: 'Authentication' },
  { value: 'DATA_CHANGE', label: 'Data Changes' },
  { value: 'SECURITY', label: 'Security & Access' },
  { value: 'ADMINISTRATIVE', label: 'Administrative' },
  { value: 'SYSTEM', label: 'System Kernel' }
];

const SEVERITY_OPTIONS = [
  { value: '', label: 'All Severities' },
  { value: 'LOW', label: 'Low' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'HIGH', label: 'High' },
  { value: 'CRITICAL', label: 'Critical' }
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Outcomes' },
  { value: 'SUCCESS', label: 'Success Only' },
  { value: 'FAILURE', label: 'Failures Only' }
];

export const AuditLogFilterToolbar = ({ filters = {}, onFilterChange, onReset }) => {
  const activeFilters = [];
  if (filters.search) activeFilters.push({ key: 'search', label: `Search: "${filters.search}"` });
  if (filters.module) {
    const modLabel = MODULE_OPTIONS.find((m) => m.value === filters.module)?.label || filters.module;
    activeFilters.push({ key: 'module', label: `Module: ${modLabel}` });
  }
  if (filters.category) activeFilters.push({ key: 'category', label: `Category: ${filters.category}` });
  if (filters.severity) activeFilters.push({ key: 'severity', label: `Severity: ${filters.severity}` });
  if (filters.status) activeFilters.push({ key: 'status', label: `Status: ${filters.status}` });
  if (filters.startDate) activeFilters.push({ key: 'startDate', label: `From: ${filters.startDate}` });
  if (filters.endDate) activeFilters.push({ key: 'endDate', label: `To: ${filters.endDate}` });

  const removeFilter = (key) => {
    onFilterChange({ [key]: '', page: 1 });
  };

  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3.5">
      {/* Top Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-foreground">
          <Filter className="w-4 h-4 text-[#00C471]" />
          <span>Forensic Search & Multi-Axis Filtering</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className={AUDIT_BUTTON_STYLES.secondary}
          title="Reset All Filters"
        >
          <RotateCcw className="w-3.5 h-3.5 text-muted-foreground" />
          <span>Reset Filters</span>
        </button>
      </div>

      {/* Grid Inputs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search email, action, model, IP..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-8 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] transition"
          />
          {filters.search && (
            <button
              type="button"
              onClick={() => onFilterChange({ search: '', page: 1 })}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Module Filter */}
        <div>
          <select
            value={filters.module || ''}
            onChange={(e) => onFilterChange({ module: e.target.value, page: 1 })}
            className="w-full px-2.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] transition text-foreground"
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Category Filter */}
        <div>
          <select
            value={filters.category || ''}
            onChange={(e) => onFilterChange({ category: e.target.value, page: 1 })}
            className="w-full px-2.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] transition text-foreground"
          >
            {CATEGORY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div>
          <select
            value={filters.status || ''}
            onChange={(e) => onFilterChange({ status: e.target.value, page: 1 })}
            className="w-full px-2.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] transition text-foreground"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity Filter */}
        <div>
          <select
            value={filters.severity || ''}
            onChange={(e) => onFilterChange({ severity: e.target.value, page: 1 })}
            className="w-full px-2.5 py-2 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471] transition text-foreground"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Window Row */}
      <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/50 text-xs">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-muted-foreground font-semibold">Date Window:</span>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange({ startDate: e.target.value, page: 1 })}
            className="px-2.5 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471]"
            title="Start Date"
          />
          <span className="text-muted-foreground font-medium">to</span>
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange({ endDate: e.target.value, page: 1 })}
            className="px-2.5 py-1.5 bg-background border border-border rounded-xl text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-[#00C471]/20 focus:border-[#00C471]"
            title="End Date"
          />
        </div>

        {/* Active Filter Chips */}
        {activeFilters.length > 0 && (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] text-muted-foreground font-semibold">Active Filters:</span>
            {activeFilters.map((flt) => (
              <span
                key={flt.key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 text-[11px] font-medium"
              >
                <span>{flt.label}</span>
                <button
                  type="button"
                  onClick={() => removeFilter(flt.key)}
                  className="hover:text-rose-600 transition"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
