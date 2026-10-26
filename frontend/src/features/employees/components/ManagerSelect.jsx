/**
 * @file ManagerSelect.jsx
 * @description Custom interactive Dropdown for selecting Direct Reporting Managers with Role Badges.
 * 
 * SPECIFICATION & HIGHER AUTHORITY INTEGRITY:
 * - Displays manager avatar, name, employeeCode, designation, and department.
 * - Shows dedicated colored RoleBadge (Super Admin, HR Manager, Department Manager) for every manager.
 * - Includes quick search and option to clear / set no direct manager.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Check, UserCheck, Search, X } from 'lucide-react';
import { RoleBadge } from '../../../components/common/RoleBadge.jsx';

/**
 * Helper to extract an employee's authority role name
 */
export function getManagerAuthorityRole(mgr) {
  if (!mgr) return 'Employee';
  if (
    mgr.employeeCode === 'EMP-000' ||
    mgr.email === 'mhamzaofficial159@gmail.com' ||
    mgr.email === 'admin@hrm.company.pk'
  ) {
    return 'Super Admin';
  }
  const roles = mgr.userId?.roles || [];
  for (const r of roles) {
    const name = typeof r === 'string' ? r : r?.name;
    if (['Super Admin', 'HR Manager', 'Department Manager'].includes(name)) {
      return name;
    }
  }
  return roles[0]?.name || 'Employee';
}

export function ManagerSelect({
  managers = [],
  value = '',
  onChange,
  disabled = false,
  className = ''
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedManager = useMemo(() => {
    if (!value) return null;
    return managers.find((m) => String(m._id) === String(value)) || null;
  }, [managers, value]);

  const filteredList = useMemo(() => {
    if (!search.trim()) return managers;
    const query = search.toLowerCase().trim();
    return managers.filter(
      (m) =>
        m.name?.toLowerCase().includes(query) ||
        m.employeeCode?.toLowerCase().includes(query) ||
        m.designationId?.title?.toLowerCase().includes(query) ||
        m.departmentId?.name?.toLowerCase().includes(query)
    );
  }, [managers, search]);

  const handleSelect = (managerId) => {
    if (onChange) {
      onChange(managerId);
    }
    setIsOpen(false);
    setSearch('');
  };

  const getInitials = (name) => {
    if (!name) return 'M';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111D17] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all text-left shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-3 min-w-0">
          {selectedManager ? (
            <>
              {/* Avatar / Initials */}
              <div className="w-8 h-8 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                {getInitials(selectedManager.name)}
              </div>
              <div className="min-w-0 flex flex-col">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {selectedManager.name}
                  </span>
                  <span className="text-[10px] font-mono font-medium text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                    {selectedManager.employeeCode}
                  </span>
                  <RoleBadge role={getManagerAuthorityRole(selectedManager)} size="sm" />
                </div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                  {selectedManager.designationId?.title || 'Executive Staff'}
                  {selectedManager.departmentId?.name ? ` • ${selectedManager.departmentId.name}` : ''}
                </span>
              </div>
            </>
          ) : (
            <div className="flex items-center gap-2 text-slate-400 dark:text-slate-500 text-xs py-0.5">
              <UserCheck className="w-4 h-4 text-slate-400" />
              <span>-- Select Direct Reporting Manager --</span>
            </div>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 dark:text-slate-500 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white dark:bg-[#111D17] border border-slate-200 dark:border-slate-800 rounded-xl shadow-xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Search Header */}
          <div className="p-2 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/40">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search managers by name, code, designation..."
                className="w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#0D1512] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                autoFocus
              />
            </div>
          </div>

          <div className="max-h-64 overflow-y-auto p-1.5 space-y-1">
            {/* None / Top-level option */}
            <button
              type="button"
              onClick={() => handleSelect('')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                !value
                  ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-medium'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-slate-300 dark:bg-slate-600" />
                <span>-- No Direct Manager (Top Level / Direct to Board) --</span>
              </div>
              {!value && <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />}
            </button>

            {/* Manager list */}
            {filteredList.map((mgr) => {
              const isSelected = String(mgr._id) === String(value);
              const authorityRole = getManagerAuthorityRole(mgr);

              return (
                <button
                  key={mgr._id}
                  type="button"
                  onClick={() => handleSelect(mgr._id)}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-lg text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/90 dark:bg-emerald-950/50 border border-emerald-300 dark:border-emerald-800/70'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-linear-to-tr from-emerald-600 to-teal-500 text-white font-bold text-[11px] flex items-center justify-center shrink-0">
                      {getInitials(mgr.name)}
                    </div>

                    <div className="min-w-0 flex flex-col">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-100 truncate">
                          {mgr.name}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1 py-0.2 rounded">
                          {mgr.employeeCode}
                        </span>
                        <RoleBadge role={authorityRole} size="sm" />
                      </div>
                      <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {mgr.designationId?.title || 'Executive'}
                        {mgr.departmentId?.name ? ` • ${mgr.departmentId.name}` : ''}
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  )}
                </button>
              );
            })}

            {filteredList.length === 0 && (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                No matching authority managers found.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ManagerSelect;
