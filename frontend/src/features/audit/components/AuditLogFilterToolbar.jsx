/**
 * @file AuditLogFilterToolbar.jsx
 * @description Advanced Multi-Criteria Filter Bar for Audit Log Forensic Exploration.
 */

import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

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

export const AuditLogFilterToolbar = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
          <Filter className="w-4 h-4 text-primary" />
          <span>Forensic Search & Multi-Axis Filtering</span>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground hover:bg-muted border border-border rounded-lg transition"
          title="Reset All Filters"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2.5">
        {/* Search Input */}
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search email, action, model, IP..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        {/* Module Filter */}
        <div>
          <select
            value={filters.module || ''}
            onChange={(e) => onFilterChange({ module: e.target.value, page: 1 })}
            className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
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
            className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
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
            className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
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
            className="w-full px-2.5 py-1.5 text-xs bg-background border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          >
            {SEVERITY_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Date Range Row */}
      <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-border/50 text-xs">
        <span className="text-muted-foreground font-medium">Date Window:</span>
        <input
          type="date"
          value={filters.startDate || ''}
          onChange={(e) => onFilterChange({ startDate: e.target.value, page: 1 })}
          className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs"
          title="From Date"
        />
        <span className="text-muted-foreground">to</span>
        <input
          type="date"
          value={filters.endDate || ''}
          onChange={(e) => onFilterChange({ endDate: e.target.value, page: 1 })}
          className="px-2.5 py-1 bg-background border border-border rounded-lg text-xs"
          title="To Date"
        />
      </div>
    </div>
  );
};
