/**
 * @file PermissionMatrix.jsx
 * @description Interactive visual permission matrix screen component for Module M26.
 * 
 * SPECIFICATION & UX:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.8 & 26.9)
 * - UX Design: Follows DESIGN.md enterprise standards with accordion modules,
 *   action checkboxes, scope selectors ('own', 'team', 'department', 'all'),
 *   and approval threshold limit inputs.
 */

import React, { useState } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Check,
  Minus,
  Sliders,
  Info,
  Loader2
} from 'lucide-react';
import { useGetPermissionsQuery } from '../rolesApi.js';
import { cn } from '../../../lib/utils.js';

export function PermissionMatrix({
  value = [],
  onChange,
  readOnly = false,
  className = ''
}) {
  const { data: catalogueResponse, isLoading, isError } = useGetPermissionsQuery();
  const catalogue = catalogueResponse?.data || [];

  // Track expanded accordion modules (all expanded by default for easy viewing)
  const [expandedModules, setExpandedModules] = useState({});

  const toggleModuleAccordion = (moduleKey) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleKey]: !prev[moduleKey]
    }));
  };

  // Helper: Find existing rule in value for a given action
  const findRule = (actionName) => {
    return value.find((r) => r.action === actionName);
  };

  // Toggle single action permission
  const handleToggleAction = (moduleItem, actionItem) => {
    if (readOnly) return;
    const existing = findRule(actionItem.action);

    if (existing) {
      // Remove rule
      const updated = value.filter((r) => r.action !== actionItem.action);
      onChange?.(updated);
    } else {
      // Add rule with default scope
      const newRule = {
        action: actionItem.action,
        subject: moduleItem.subject,
        scope: actionItem.defaultScope || actionItem.allowedScopes[0] || 'all',
        fields: [],
        limit: undefined
      };
      onChange?.([...value, newRule]);
    }
  };

  // Update scope for an action
  const handleScopeChange = (actionName, newScope) => {
    if (readOnly) return;
    const updated = value.map((r) => {
      if (r.action === actionName) {
        return { ...r, scope: newScope };
      }
      return r;
    });
    onChange?.(updated);
  };

  // Update approval limit for an action (Slice 26.9)
  const handleLimitChange = (actionName, newLimit) => {
    if (readOnly) return;
    const numLimit = newLimit === '' ? undefined : Number(newLimit);
    const updated = value.map((r) => {
      if (r.action === actionName) {
        return { ...r, limit: numLimit };
      }
      return r;
    });
    onChange?.(updated);
  };

  // Select all or deselect all for a module
  const handleSelectAllModule = (moduleItem, isSelected) => {
    if (readOnly) return;
    const moduleActionNames = new Set(moduleItem.actions.map((a) => a.action));

    if (isSelected) {
      // Deselect all in module
      const updated = value.filter((r) => !moduleActionNames.has(r.action));
      onChange?.(updated);
    } else {
      // Select all in module
      const otherRules = value.filter((r) => !moduleActionNames.has(r.action));
      const newModuleRules = moduleItem.actions.map((a) => {
        const existing = findRule(a.action);
        return (
          existing || {
            action: a.action,
            subject: moduleItem.subject,
            scope: a.defaultScope || a.allowedScopes[0] || 'all',
            fields: [],
            limit: undefined
          }
        );
      });
      onChange?.([...otherRules, ...newModuleRules]);
    }
  };

  if (isLoading) {
    return (
      <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500">
        <Loader2 className="w-6 h-6 animate-spin text-[#00C471]" />
        <span className="text-xs font-medium">Loading permission catalogue taxonomy...</span>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 text-xs">
        Failed to load permission catalogue. Please refresh the page.
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-[#1A3125]">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-[#00C471]" />
            Permission Matrix & Data Scoping
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure granular operations, data bounds, and approval thresholds.
          </p>
        </div>
        <div className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#00C471] border border-emerald-200/60 dark:border-emerald-800/60">
          {value.length} Active Permissions
        </div>
      </div>

      <div className="space-y-3">
        {catalogue.map((moduleItem) => {
          const isExpanded = expandedModules[moduleItem.module] !== false; // expanded by default
          const moduleActionCount = moduleItem.actions.length;
          const selectedActionCount = moduleItem.actions.filter((a) =>
            findRule(a.action)
          ).length;
          const isAllSelected = selectedActionCount === moduleActionCount && moduleActionCount > 0;
          const isIndeterminate =
            selectedActionCount > 0 && selectedActionCount < moduleActionCount;

          return (
            <div
              key={moduleItem.module}
              className="border border-slate-200 dark:border-[#1A3125] rounded-xl overflow-hidden bg-white dark:bg-[#111D17] transition-all shadow-2xs"
            >
              {/* Accordion Module Header */}
              <div
                className="px-4 py-3 bg-slate-50/80 dark:bg-[#0E1A14] flex items-center justify-between cursor-pointer select-none border-b border-slate-200/80 dark:border-[#1A3125]/80 hover:bg-slate-100/60 dark:hover:bg-[#14261D] transition-colors"
                onClick={() => toggleModuleAccordion(moduleItem.module)}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4 text-slate-500" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-500" />
                    )}
                  </button>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900 dark:text-white">
                        {moduleItem.label}
                      </span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {moduleItem.subject}
                      </span>
                    </div>
                    {moduleItem.description && (
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                        {moduleItem.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-3" onClick={(e) => e.stopPropagation()}>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    {selectedActionCount} of {moduleActionCount}
                  </span>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={() => handleSelectAllModule(moduleItem, isAllSelected)}
                      className={cn(
                        'w-5 h-5 rounded flex items-center justify-center border transition-all text-white',
                        isAllSelected
                          ? 'bg-[#00C471] border-[#00C471]'
                          : isIndeterminate
                          ? 'bg-[#00C471]/80 border-[#00C471]'
                          : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-[#111D17]'
                      )}
                      title={isAllSelected ? 'Deselect module' : 'Select all in module'}
                    >
                      {isAllSelected && <Check className="w-3.5 h-3.5" />}
                      {isIndeterminate && <Minus className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>

              {/* Module Action Rows */}
              {isExpanded && (
                <div className="divide-y divide-slate-100 dark:divide-[#1A3125]/60">
                  {moduleItem.actions.map((act) => {
                    const rule = findRule(act.action);
                    const isChecked = Boolean(rule);
                    const currentScope = rule?.scope || act.defaultScope || 'all';
                    const currentLimit = rule?.limit;

                    return (
                      <div
                        key={act.action}
                        className={cn(
                          'p-3.5 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors',
                          isChecked
                            ? 'bg-emerald-50/20 dark:bg-emerald-950/10'
                            : 'hover:bg-slate-50/50 dark:hover:bg-[#14261D]/30'
                        )}
                      >
                        {/* Action Details & Checkbox */}
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            id={`perm-${act.action}`}
                            checked={isChecked}
                            disabled={readOnly}
                            onChange={() => handleToggleAction(moduleItem, act)}
                            className="mt-0.5 h-4 w-4 rounded border-slate-300 dark:border-slate-700 text-[#00C471] focus:ring-[#00C471] transition-all cursor-pointer disabled:cursor-not-allowed"
                          />
                          <div>
                            <label
                              htmlFor={`perm-${act.action}`}
                              className={cn(
                                'font-semibold cursor-pointer block',
                                isChecked
                                  ? 'text-slate-900 dark:text-white'
                                  : 'text-slate-700 dark:text-slate-300'
                              )}
                            >
                              {act.label}
                            </label>
                            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500 mr-2">
                              {act.action}
                            </span>
                            {act.description && (
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                {act.description}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Scopes & Limits Controls */}
                        <div className="flex items-center gap-3 pl-7 md:pl-0">
                          {/* Scope Selector */}
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                              Scope:
                            </span>
                            <select
                              value={currentScope}
                              disabled={!isChecked || readOnly}
                              onChange={(e) => handleScopeChange(act.action, e.target.value)}
                              className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00C471] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                            >
                              {act.allowedScopes.map((sc) => (
                                <option key={sc} value={sc}>
                                  {sc.charAt(0).toUpperCase() + sc.slice(1)}
                                </option>
                              ))}
                            </select>
                          </div>

                          {/* Approval Threshold / Limit Input (26.9) */}
                          {(act.action.includes('approve') ||
                            act.action.includes('expense') ||
                            act.hasLimit) && (
                            <div className="flex items-center gap-1.5">
                              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                                Limit:
                              </span>
                              <input
                                type="number"
                                min="0"
                                placeholder="No cap"
                                value={currentLimit !== undefined ? currentLimit : ''}
                                disabled={!isChecked || readOnly}
                                onChange={(e) => handleLimitChange(act.action, e.target.value)}
                                className="w-20 px-2 py-1 text-xs rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00C471] disabled:opacity-50 disabled:cursor-not-allowed shadow-2xs"
                              />
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
export default PermissionMatrix;
