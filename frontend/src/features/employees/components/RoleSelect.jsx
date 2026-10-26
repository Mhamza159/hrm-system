/**
 * @file RoleSelect.jsx
 * @description Custom interactive Role Selection Dropdown displaying RoleBadge pills.
 */

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, ShieldCheck } from 'lucide-react';
import { RoleBadge } from '../../../components/common/RoleBadge.jsx';

export function RoleSelect({
  roles = [],
  value = '',
  onChange,
  className = '',
  disabled = false
}) {
  const [isOpen, setIsOpen] = useState(false);
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

  const selectedRole = roles.find((r) => r._id === value) || roles[0];

  const handleSelect = (roleId) => {
    if (onChange) {
      onChange(roleId);
    }
    setIsOpen(false);
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {/* Trigger Button */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between gap-3 px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:border-emerald-500/50 dark:hover:border-emerald-500/50 transition-all text-left shadow-2xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          {selectedRole ? (
            <>
              <RoleBadge role={selectedRole.name} size="md" />
              <span className="text-xs text-slate-500 dark:text-slate-400 truncate">
                {selectedRole.description || (selectedRole.isSystem ? 'System Core Role' : 'Custom Role')}
              </span>
            </>
          ) : (
            <span className="text-xs text-slate-400">Select a Role</span>
          )}
        </div>

        <ChevronDown
          className={`w-4 h-4 text-slate-400 transition-transform duration-200 shrink-0 ${
            isOpen ? 'rotate-180 text-emerald-500' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1.5 p-1.5 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-xl overflow-hidden max-h-64 overflow-y-auto animate-in fade-in slide-in-from-top-2 duration-150">
          <div className="space-y-1">
            {roles.map((role) => {
              const isSelected = role._id === (selectedRole?._id || value);
              return (
                <button
                  key={role._id}
                  type="button"
                  onClick={() => handleSelect(role._id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/70 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/50'
                      : 'hover:bg-slate-50 dark:hover:bg-[#14261D] border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <RoleBadge role={role.name} size="md" />
                    <div className="min-w-0">
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                        {role.description || (role.isSystem ? 'Built-in System Role' : 'Custom Tenant Role')}
                      </p>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 ml-2 shadow-xs">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
