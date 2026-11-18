/**
 * @file EmployeeSelectDropdown.jsx
 * @description Searchable, rich employee selection dropdown for Department Head and Leadership allocation.
 * Renders complete authentic personnel records (avatar, name, employee code, designation, current unit, status).
 * STRICT INTEGRITY: Zero generic placeholder options ("Employee 1"); 100% database-backed personnel.
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, X, Building2, Briefcase, Check, Loader2 } from 'lucide-react';
import { useGetHeadCandidatesQuery } from '../departmentsApi.js';

export function EmployeeSelectDropdown({
  value,
  onChange,
  disabled = false,
  placeholder = 'Select Department Head...'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  const { data: candidatesResponse, isLoading, isFetching } = useGetHeadCandidatesQuery(
    searchTerm.trim() ? { search: searchTerm.trim() } : undefined
  );

  const candidates = candidatesResponse?.data || [];

  const [cachedCandidate, setCachedCandidate] = useState(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Cache selected candidate to prevent trigger button flicker during remote search
  useEffect(() => {
    if (value && candidates.length > 0) {
      const match = candidates.find((c) => String(c._id) === String(value));
      if (match) {
        setCachedCandidate(match);
      }
    } else if (!value) {
      setCachedCandidate(null);
    }
  }, [candidates, value]);

  // Find currently selected candidate with fallback to cached candidate
  const selectedCandidate = useMemo(() => {
    if (!value) return null;
    return candidates.find((c) => String(c._id) === String(value)) || cachedCandidate;
  }, [candidates, value, cachedCandidate]);

  const handleSelect = (candId) => {
    onChange(candId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange('');
    setCachedCandidate(null);
    setSearchTerm('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Selected Value Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full text-left px-3.5 py-2.5 rounded-xl border text-xs transition-all duration-200 flex items-center justify-between cursor-pointer ${
          isOpen
            ? 'border-[#00C471] ring-2 ring-[#00C471]/20 bg-white dark:bg-[#111D17]'
            : 'border-slate-200 dark:border-[#1A3125] bg-slate-50 dark:bg-[#0A120E] hover:border-slate-300 dark:hover:border-[#244533]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {selectedCandidate ? (
          <div className="flex items-center gap-2.5 truncate">
            {/* Avatar or Initial */}
            {selectedCandidate.avatar ? (
              <img
                src={selectedCandidate.avatar}
                alt={selectedCandidate.name}
                className="w-6 h-6 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
              />
            ) : (
              <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#00C471] dark:text-emerald-400 flex items-center justify-center font-bold text-[10px] shrink-0">
                {selectedCandidate.name.charAt(0).toUpperCase()}
              </div>
            )}

            <div className="truncate text-left">
              <div className="flex items-center gap-1.5 truncate">
                <span className="font-semibold text-slate-900 dark:text-white truncate">
                  {selectedCandidate.name}
                </span>
                <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#234232]">
                  {selectedCandidate.employeeCode}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                {selectedCandidate.designation} • {selectedCandidate.email}
              </span>
            </div>
          </div>
        ) : (
          <span className="text-slate-400 dark:text-slate-500 text-xs">{placeholder}</span>
        )}

        <div className="flex items-center gap-1 shrink-0 ml-2">
          {selectedCandidate && !disabled && (
            <span
              role="button"
              tabIndex={0}
              onClick={handleClear}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') handleClear(e);
              }}
              className="p-1 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
              title="Clear selection"
            >
              <X className="w-3.5 h-3.5" />
            </span>
          )}
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-[#00C471]' : ''
            }`}
          />
        </div>
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-xl overflow-hidden animate-in fade-in-50 zoom-in-95 duration-150 flex flex-col max-h-72">
          {/* Search Header */}
          <div className="p-2.5 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/60 dark:bg-[#0E1712]/60">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search staff by name, code, designation..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-white dark:bg-[#0A120E] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#00C471] focus:border-[#00C471]"
              />
              {isFetching && (
                <Loader2 className="w-3 h-3 text-[#00C471] animate-spin absolute right-3 pointer-events-none" />
              )}
            </div>
          </div>

          {/* Options List */}
          <div className="overflow-y-auto p-1.5 space-y-1 divide-y divide-slate-50 dark:divide-[#15241C]">
            {/* Unassigned / Clear Option */}
            <div
              onClick={() => handleSelect('')}
              className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors ${
                !value
                  ? 'bg-slate-100 dark:bg-[#1A3125] text-[#00C471] font-semibold'
                  : 'hover:bg-slate-50 dark:hover:bg-[#15241C] text-slate-500 dark:text-slate-400'
              }`}
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full border border-dashed border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-400 text-[10px]">
                  —
                </div>
                <span>Unassigned (No Department Head)</span>
              </div>
              {!value && <Check className="w-3.5 h-3.5 text-[#00C471]" />}
            </div>

            {/* Candidate Items */}
            {isLoading && candidates.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00C471]" />
                <span>Loading eligible personnel...</span>
              </div>
            ) : candidates.length > 0 ? (
              candidates.map((cand) => {
                const isSelected = String(cand._id) === String(value);

                return (
                  <div
                    key={cand._id}
                    onClick={() => handleSelect(cand._id)}
                    className={`flex items-center justify-between p-2 rounded-xl text-xs cursor-pointer transition-colors group ${
                      isSelected
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 text-slate-900 dark:text-white'
                        : 'hover:bg-slate-50 dark:hover:bg-[#15241C] text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      {/* Avatar */}
                      {cand.avatar ? (
                        <img
                          src={cand.avatar}
                          alt={cand.name}
                          className="w-7 h-7 rounded-full object-cover shrink-0 border border-slate-200 dark:border-slate-700"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-[#00C471] dark:text-emerald-400 flex items-center justify-center font-bold text-xs shrink-0">
                          {cand.name.charAt(0).toUpperCase()}
                        </div>
                      )}

                      <div className="truncate text-left">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="font-semibold text-slate-900 dark:text-white truncate">
                            {cand.name}
                          </span>
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-medium tracking-wide bg-slate-100 dark:bg-[#1A3125] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-[#234232]">
                            {cand.employeeCode}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 truncate">
                          <span className="flex items-center gap-1 truncate">
                            <Briefcase className="w-2.5 h-2.5 shrink-0" />
                            <span>{cand.designation}</span>
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1 truncate">
                            <Building2 className="w-2.5 h-2.5 shrink-0" />
                            <span>{cand.currentDepartment}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-slate-100 dark:bg-[#1A3125] text-slate-500">
                        {cand.status}
                      </span>
                      {isSelected && <Check className="w-4 h-4 text-[#00C471] shrink-0" />}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4 text-center text-xs text-slate-400">
                No personnel found matching &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
