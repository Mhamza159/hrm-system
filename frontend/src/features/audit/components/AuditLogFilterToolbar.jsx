/**
 * @file AuditLogFilterToolbar.jsx
 * @description Forensic filter controls for system audit log exploration.
 */

import React from 'react';
import { Search, RotateCcw, Filter } from 'lucide-react';

const MODULE_OPTIONS = [
  { value: '', label: 'All Modules' },
  { value: 'auth', label: 'Auth & Security' },
  { value: 'employee', label: 'Employee Management' },
  { value: 'attendance', label: 'Attendance & Shifts' },
  { value: 'leave', label: 'Leave & Holidays' },
  { value: 'payroll', label: 'Payroll & Compliance' },
  { value: 'role', label: 'Roles & RBAC' },
  { value: 'setting', label: 'Company Settings' },
  { value: 'report', label: 'Reports & Exports' },
  { value: 'system', label: 'System Kernel' }
];

export const AuditLogFilterToolbar = ({ filters, onFilterChange, onReset }) => {
  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-foreground">
        <Filter className="w-4 h-4 text-primary" />
        <span>Audit Filter & Forensic Search</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search email, action, model..."
            value={filters.search || ''}
            onChange={(e) => onFilterChange({ search: e.target.value, page: 1 })}
            className="w-full pl-9 pr-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          />
        </div>

        {/* Module Selector */}
        <div>
          <select
            value={filters.module || ''}
            onChange={(e) => onFilterChange({ module: e.target.value, page: 1 })}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
          >
            {MODULE_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>

        {/* Date From */}
        <div>
          <input
            type="date"
            value={filters.startDate || ''}
            onChange={(e) => onFilterChange({ startDate: e.target.value, page: 1 })}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            title="Start Date"
          />
        </div>

        {/* Date To & Reset */}
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={filters.endDate || ''}
            onChange={(e) => onFilterChange({ endDate: e.target.value, page: 1 })}
            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition"
            title="End Date"
          />
          <button
            type="button"
            onClick={onReset}
            className="p-2 border border-border hover:bg-muted text-muted-foreground rounded-lg transition"
            title="Reset Filters"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
