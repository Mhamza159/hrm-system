/**
 * @file CustodianSelect.jsx
 * @description Modern, searchable employee custodian dropdown component with avatar, name, EMP-ID, department, and title.
 * 
 * SPECIFICATION & DESIGN:
 * - Module: M23 Asset Management (BUILD-GUIDE Section 20 · Row 23.2)
 * - Design System: Forest & Emerald (#00C471 brand primary, #111D17 dark surface, #1A3125 dark border).
 * - Accessibility: Keyboard navigation, search filter, click-outside handling, and ARIA attributes.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, User, X, Briefcase, Building2 } from 'lucide-react';

export const CustodianSelect = ({
  value,
  onChange,
  employees = [],
  placeholder = 'Select an employee custodian...',
  disabled = false,
  error = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input on open
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    } else {
      setSearchTerm('');
    }
  }, [isOpen]);

  // Selected employee object
  const selectedEmployee = useMemo(() => {
    if (!value) return null;
    return employees.find((e) => (e._id || e.id) === (value._id || value.id || value));
  }, [value, employees]);

  // Filtered employees
  const filteredEmployees = useMemo(() => {
    if (!searchTerm.trim()) return employees;
    const q = searchTerm.toLowerCase();
    return employees.filter((emp) => {
      const name = (emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`).toLowerCase();
      const code = (emp.employeeCode || '').toLowerCase();
      const dept = (emp.departmentId?.name || emp.departmentId?.code || emp.department || '').toLowerCase();
      const desig = (emp.designationId?.title || emp.designationId?.code || emp.designation || '').toLowerCase();
      return name.includes(q) || code.includes(q) || dept.includes(q) || desig.includes(q);
    });
  }, [employees, searchTerm]);

  const handleSelect = (emp) => {
    const id = emp._id || emp.id;
    onChange(id);
    setIsOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
  };

  const getInitials = (emp) => {
    const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'EMP';
    return name
      .split(' ')
      .map((n) => n[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  return (
    <div ref={dropdownRef} className="relative w-full">
      {/* Trigger Button */}
      <div
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
            e.preventDefault();
            setIsOpen((prev) => !prev);
          }
        }}
        className={`w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border text-sm transition-all duration-150 cursor-pointer select-none bg-white dark:bg-[#111D17] ${
          error
            ? 'border-rose-300 dark:border-rose-800 focus:ring-rose-500/20'
            : isOpen
            ? 'border-[#00C471] ring-2 ring-[#00C471]/20 dark:border-[#00C471]'
            : 'border-slate-200 dark:border-[#1A3125] hover:border-slate-300 dark:hover:border-[#244333]'
        } ${disabled ? 'opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-900/50' : ''}`}
      >
        {selectedEmployee ? (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs font-bold flex items-center justify-center shrink-0">
              {getInitials(selectedEmployee)}
            </div>
            <div className="truncate text-left">
              <div className="flex items-center gap-1.5 font-medium text-slate-900 dark:text-white">
                <span className="truncate">
                  {selectedEmployee.name || `${selectedEmployee.firstName || ''} ${selectedEmployee.lastName || ''}`.trim()}
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#162820] text-slate-500 dark:text-emerald-400 border border-slate-200 dark:border-[#1A3125]">
                  {selectedEmployee.employeeCode}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 truncate">
                {selectedEmployee.designationId?.title || selectedEmployee.designation || 'Staff'} · {selectedEmployee.departmentId?.name || selectedEmployee.department || 'Department'}
              </div>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-sm">{placeholder}</span>
        )}

        <div className="flex items-center gap-1.5 shrink-0 text-slate-400">
          {selectedEmployee && !disabled && (
            <span
              onClick={handleClear}
              className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-[#162820] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180 text-[#00C471]' : ''}`} />
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 mt-1.5 w-full bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-xl shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Search Bar */}
          <div className="p-2 border-b border-slate-100 dark:border-[#1A3125]">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name, code, dept..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#0B1511] border border-slate-200 dark:border-[#1A3125] rounded-lg text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:border-[#00C471] focus:ring-1 focus:ring-[#00C471]"
              />
            </div>
          </div>

          {/* Employee List */}
          <div className="max-h-56 overflow-y-auto divide-y divide-slate-100/60 dark:divide-[#1A3125]/60 custom-scrollbar p-1">
            {filteredEmployees.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400">
                No matching active employees found.
              </div>
            ) : (
              filteredEmployees.map((emp) => {
                const id = emp._id || emp.id;
                const isSelected = (value?._id || value?.id || value) === id;
                const name = emp.name || `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || emp.employeeCode;
                const dept = emp.departmentId?.name || emp.departmentId?.code || emp.department || null;
                const desig = emp.designationId?.title || emp.designationId?.code || emp.designation || null;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => handleSelect(emp)}
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center justify-between gap-2.5 transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-[#162820] text-[#00C471]'
                        : 'hover:bg-slate-50 dark:hover:bg-[#162820]/60 text-slate-700 dark:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-[#1A3125] text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center justify-center shrink-0">
                        {getInitials(emp)}
                      </div>
                      <div className="truncate">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900 dark:text-white">
                          <span className="truncate">{name}</span>
                          <span className="text-[10px] font-mono px-1 rounded bg-slate-100 dark:bg-[#1A3125] text-slate-500 dark:text-slate-400">
                            {emp.employeeCode}
                          </span>
                        </div>
                        {(desig || dept) && (
                          <div className="text-[11px] text-slate-400 truncate">
                            {desig}{desig && dept ? ' · ' : ''}{dept}
                          </div>
                        )}
                      </div>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#00C471] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default CustodianSelect;
