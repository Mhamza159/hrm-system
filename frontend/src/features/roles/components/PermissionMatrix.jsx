/**
 * @file PermissionMatrix.jsx
 * @description High-Performance Enterprise Visual Permission Matrix with Sticky Toolbar,
 * Module Navigator, Tri-State Brand Checkboxes, Scope Explanation Popovers, and Live Stats.
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Rows 26.8 & 26.9)
 * - Design System: Elvara Forest & Emerald Enterprise Craft (DESIGN.md)
 * - Hard Constraints: Strictly primary green checkboxes (#00C471), light & dark mode support,
 *   accessible keyboard navigation, memoized rendering for 100+ permissions without lag.
 */

import React, { useState, useMemo, useCallback, memo, useRef } from 'react';
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Search,
  Check,
  Minus,
  Info,
  Filter,
  Maximize2,
  Minimize2,
  CheckSquare,
  Square,
  HelpCircle,
  Sliders,
  AlertCircle
} from 'lucide-react';
import { useGetPermissionsQuery } from '../rolesApi.js';
import { cn } from '../../../lib/utils.js';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { Checkbox } from '../../../components/common/Checkbox.jsx';

// Scope Descriptions for the Info Popover
const SCOPE_DEFINITIONS = {
  all: {
    label: 'All Records',
    desc: 'Unrestricted enterprise-wide scope across all company departments and branches.'
  },
  department: {
    label: 'Department Scope',
    desc: 'Scoped strictly to records within the user’s assigned department.'
  },
  team: {
    label: 'Direct Team',
    desc: 'Scoped to employees directly reporting to the user in the organizational hierarchy.'
  },
  own: {
    label: 'Self Only',
    desc: 'Restricted strictly to the authenticated user’s own personal records.'
  }
};

/**
 * Memoized Permission Row Component for high-performance updates
 */
const PermissionRow = memo(function PermissionRow({
  moduleItem,
  actionItem,
  rule,
  readOnly,
  onToggle,
  onScopeChange,
  onLimitChange
}) {
  const isChecked = Boolean(rule);
  const currentScope = rule?.scope || actionItem.defaultScope || actionItem.allowedScopes[0] || 'all';
  const currentLimit = rule?.limit;

  return (
    <div
      className={cn(
        'p-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors duration-150',
        isChecked
          ? 'bg-emerald-50/25 dark:bg-emerald-950/15'
          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
      )}
    >
      {/* Checkbox and Action Identity */}
      <div className="flex items-start gap-3 flex-1">
        <Checkbox
          id={`perm-${actionItem.action}`}
          checked={isChecked}
          disabled={readOnly}
          onChange={() => onToggle(moduleItem, actionItem)}
          aria-label={`Toggle permission for ${actionItem.label}`}
          className="mt-0.5"
        />

        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor={`perm-${actionItem.action}`}
              className={cn(
                'font-semibold cursor-pointer select-none',
                isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
              )}
            >
              {actionItem.label}
            </label>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60">
              {actionItem.action}
            </span>
          </div>
          {actionItem.description && (
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
              {actionItem.description}
            </p>
          )}
        </div>
      </div>

      {/* Scopes & Limit Selectors */}
      <div className="flex items-center gap-3 pl-7 md:pl-0 shrink-0">
        {/* Scope Selector with Accessible Disabled Styling */}
        <div className="flex items-center gap-1.5" title={!isChecked ? 'Enable permission to modify scope' : undefined}>
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Scope:</span>
          <select
            value={currentScope}
            disabled={!isChecked || readOnly}
            onChange={(e) => onScopeChange(actionItem.action, e.target.value)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-lg border transition-all shadow-2xs font-medium cursor-pointer',
              isChecked
                ? 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand'
                : 'border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
            )}
          >
            {actionItem.allowedScopes.map((sc) => (
              <option key={sc} value={sc}>
                {sc.charAt(0).toUpperCase() + sc.slice(1)}
              </option>
            ))}
          </select>
        </div>

        {/* Approval Threshold Limit (Slice 26.9) */}
        {(actionItem.action.includes('approve') ||
          actionItem.action.includes('expense') ||
          actionItem.hasLimit) && (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Limit:</span>
            <input
              type="number"
              min="0"
              placeholder="No cap"
              value={currentLimit !== undefined ? currentLimit : ''}
              disabled={!isChecked || readOnly}
              onChange={(e) => onLimitChange(actionItem.action, e.target.value)}
              className={cn(
                'w-20 px-2 py-1 text-xs rounded-lg border font-mono transition-all shadow-2xs',
                isChecked
                  ? 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-brand'
                  : 'border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400 cursor-not-allowed opacity-60'
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export function PermissionMatrix({
  value = [],
  onChange,
  readOnly = false,
  className = ''
}) {
  const { data: catalogueResponse, isLoading, isError, refetch } = useGetPermissionsQuery();
  const catalogue = catalogueResponse?.data || [];

  // Local UI Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [activeModuleFilter, setActiveModuleFilter] = useState('ALL');
  const [showScopeInfo, setShowScopeInfo] = useState(false);

  // Accordion state (all expanded by default)
  const [expandedModules, setExpandedModules] = useState({});

  // Helper map for fast rule lookups O(1)
  const ruleMap = useMemo(() => {
    const map = new Map();
    value.forEach((r) => map.set(r.action, r));
    return map;
  }, [value]);

  const toggleModuleAccordion = useCallback((moduleKey) => {
    setExpandedModules((prev) => ({
      ...prev,
      [moduleKey]: prev[moduleKey] === false ? true : false
    }));
  }, []);

  // Expand All / Collapse All
  const handleToggleExpandAll = useCallback((expand) => {
    const newState = {};
    catalogue.forEach((m) => {
      newState[m.module] = expand;
    });
    setExpandedModules(newState);
  }, [catalogue]);

  // Toggle single action rule
  const handleToggleAction = useCallback((moduleItem, actionItem) => {
    if (readOnly) return;
    const existing = ruleMap.get(actionItem.action);

    if (existing) {
      const updated = value.filter((r) => r.action !== actionItem.action);
      onChange?.(updated);
    } else {
      const newRule = {
        action: actionItem.action,
        subject: moduleItem.subject,
        scope: actionItem.defaultScope || actionItem.allowedScopes[0] || 'all',
        fields: [],
        limit: undefined
      };
      onChange?.([...value, newRule]);
    }
  }, [readOnly, ruleMap, value, onChange]);

  // Update scope
  const handleScopeChange = useCallback((actionName, newScope) => {
    if (readOnly) return;
    const updated = value.map((r) => {
      if (r.action === actionName) {
        return { ...r, scope: newScope };
      }
      return r;
    });
    onChange?.(updated);
  }, [readOnly, value, onChange]);

  // Update limit
  const handleLimitChange = useCallback((actionName, newLimit) => {
    if (readOnly) return;
    const numLimit = newLimit === '' ? undefined : Number(newLimit);
    const updated = value.map((r) => {
      if (r.action === actionName) {
        return { ...r, limit: numLimit };
      }
      return r;
    });
    onChange?.(updated);
  }, [readOnly, value, onChange]);

  // Select all or deselect all for a single module
  const handleSelectAllModule = useCallback((moduleItem, isSelected) => {
    if (readOnly) return;
    const moduleActionNames = new Set(moduleItem.actions.map((a) => a.action));

    if (isSelected) {
      // Deselect all
      const updated = value.filter((r) => !moduleActionNames.has(r.action));
      onChange?.(updated);
    } else {
      // Select all
      const otherRules = value.filter((r) => !moduleActionNames.has(r.action));
      const newModuleRules = moduleItem.actions.map((a) => {
        const existing = ruleMap.get(a.action);
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
  }, [readOnly, ruleMap, value, onChange]);

  // Bulk Grant All / Revoke All across visible / entire catalogue
  const handleBulkGrantAll = useCallback(() => {
    if (readOnly) return;
    const allRules = [];
    catalogue.forEach((mod) => {
      mod.actions.forEach((act) => {
        const existing = ruleMap.get(act.action);
        allRules.push(
          existing || {
            action: act.action,
            subject: mod.subject,
            scope: act.defaultScope || act.allowedScopes[0] || 'all',
            fields: [],
            limit: undefined
          }
        );
      });
    });
    onChange?.(allRules);
  }, [readOnly, catalogue, ruleMap, onChange]);

  const handleBulkRevokeAll = useCallback(() => {
    if (readOnly) return;
    onChange?.([]);
  }, [readOnly, onChange]);

  // Filter catalogue by search query, enabled flag, and active module tab
  const filteredCatalogue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();

    return catalogue
      .filter((moduleItem) => {
        if (activeModuleFilter !== 'ALL' && moduleItem.module !== activeModuleFilter) {
          return false;
        }
        return true;
      })
      .map((moduleItem) => {
        const matchingActions = moduleItem.actions.filter((act) => {
          // If onlyEnabled is on, rule must be present
          if (onlyEnabled && !ruleMap.has(act.action)) {
            return false;
          }
          // Search query check (name or action key)
          if (q) {
            const matchName = act.label?.toLowerCase().includes(q);
            const matchKey = act.action?.toLowerCase().includes(q);
            const matchDesc = act.description?.toLowerCase().includes(q);
            const matchMod = moduleItem.label?.toLowerCase().includes(q);
            return matchName || matchKey || matchDesc || matchMod;
          }
          return true;
        });

        return {
          ...moduleItem,
          actions: matchingActions
        };
      })
      .filter((moduleItem) => moduleItem.actions.length > 0);
  }, [catalogue, searchQuery, onlyEnabled, activeModuleFilter, ruleMap]);

  // Module summaries for the sticky module navigator
  const moduleNavItems = useMemo(() => {
    return catalogue.map((m) => {
      const total = m.actions.length;
      const active = m.actions.filter((a) => ruleMap.has(a.action)).length;
      return {
        key: m.module,
        label: m.label,
        total,
        active
      };
    });
  }, [catalogue, ruleMap]);

  const totalPossiblePermissions = useMemo(() => {
    return catalogue.reduce((sum, m) => sum + m.actions.length, 0);
  }, [catalogue]);

  if (isLoading) {
    return (
      <ScreenSkeleton
        variant="matrix"
        title="Security & RBAC Matrix"
        message="Loading permission catalogue taxonomy and authorization scopes..."
      />
    );
  }

  if (isError) {
    return (
      <div className="p-6 rounded-2xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <AlertCircle className="w-5 h-5 text-rose-500" />
          <span>Failed to load permission catalogue. Please refresh or retry.</span>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-semibold cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-4', className)}>
      {/* 1. Matrix Header & Live Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1A3125]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand" />
              Permission Matrix & CASL Governance
            </h3>
            <button
              type="button"
              onClick={() => setShowScopeInfo(!showScopeInfo)}
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
              title="Explain Authorization Scopes"
            >
              <HelpCircle className="w-3.5 h-3.5" />
            </button>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure granular operations, data bounds, and approval thresholds.
          </p>
        </div>

        {/* Live Active Permissions Pill */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-brand border border-emerald-200/80 dark:border-emerald-800/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-brand animate-pulse" />
            <span className="font-bold tabular-nums">{value.length}</span>
            <span>of {totalPossiblePermissions} Active Permissions</span>
          </div>
        </div>
      </div>

      {/* Scope Explanations Card Popover */}
      {showScopeInfo && (
        <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0E1A14] text-xs space-y-2 animate-in fade-in duration-150">
          <div className="flex items-center justify-between font-bold text-slate-800 dark:text-slate-200">
            <span className="flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-brand" />
              Authorization Scope Definitions
            </span>
            <button
              type="button"
              onClick={() => setShowScopeInfo(false)}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-[11px] cursor-pointer"
            >
              Dismiss
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 pt-1">
            {Object.entries(SCOPE_DEFINITIONS).map(([key, def]) => (
              <div key={key} className="p-2.5 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-slate-800">
                <span className="font-semibold text-slate-900 dark:text-white capitalize mr-1.5">
                  {def.label}:
                </span>
                <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                  {def.desc}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 2. Sticky Toolbar Above Matrix */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#111D17]/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions by name or key (e.g. role.manage)..."
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#13221B] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand shadow-2xs"
          />
        </div>

        {/* Toolbar Controls */}
        <div className="flex items-center gap-2 flex-wrap text-xs">
          {/* Only Enabled Toggle */}
          <button
            type="button"
            onClick={() => setOnlyEnabled(!onlyEnabled)}
            className={cn(
              'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border transition-all cursor-pointer font-medium',
              onlyEnabled
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-brand border-emerald-300 dark:border-emerald-800'
                : 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
            title="Toggle to show only currently granted permissions"
          >
            <Filter className="w-3 h-3" />
            <span>Show Enabled Only</span>
          </button>

          {/* Expand / Collapse All */}
          <div className="flex items-center rounded-xl border border-slate-200 dark:border-[#1A3125] overflow-hidden bg-white dark:bg-[#111D17]">
            <button
              type="button"
              onClick={() => handleToggleExpandAll(true)}
              className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-r border-slate-200 dark:border-[#1A3125] cursor-pointer"
              title="Expand all module categories"
            >
              Expand All
            </button>
            <button
              type="button"
              onClick={() => handleToggleExpandAll(false)}
              className="px-2.5 py-1.5 text-[11px] font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
              title="Collapse all module categories"
            >
              Collapse All
            </button>
          </div>

          {/* Bulk Grant / Revoke (Hidden if Readonly) */}
          {!readOnly && (
            <div className="flex items-center gap-1.5 border-l border-slate-200 dark:border-[#1A3125] pl-2">
              <button
                type="button"
                onClick={handleBulkGrantAll}
                className="px-2.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-brand border border-emerald-200/80 dark:border-emerald-800/60 font-semibold hover:bg-emerald-100/60 transition-colors cursor-pointer"
                title="Grant all permissions in the system"
              >
                Grant All
              </button>
              <button
                type="button"
                onClick={handleBulkRevokeAll}
                className="px-2.5 py-1.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/80 dark:border-rose-900/60 font-semibold hover:bg-rose-100/60 transition-colors cursor-pointer"
                title="Revoke all permissions"
              >
                Revoke All
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. Horizontal Module Navigator Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
        <button
          type="button"
          onClick={() => setActiveModuleFilter('ALL')}
          className={cn(
            'px-3 py-1.5 rounded-xl font-semibold whitespace-nowrap transition-all cursor-pointer shadow-2xs',
            activeModuleFilter === 'ALL'
              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
              : 'bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          )}
        >
          All Modules ({catalogue.length})
        </button>

        {moduleNavItems.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setActiveModuleFilter(item.key)}
            className={cn(
              'px-3 py-1.5 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs',
              activeModuleFilter === item.key
                ? 'bg-brand text-white font-bold'
                : 'bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <span>{item.label}</span>
            <span
              className={cn(
                'text-[10px] px-1.5 py-0.2 rounded-full tabular-nums font-semibold',
                activeModuleFilter === item.key
                  ? 'bg-black/20 text-white'
                  : item.active > 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-brand'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
              )}
            >
              {item.active}/{item.total}
            </span>
          </button>
        ))}
      </div>

      {/* 4. Filtered Accordion Groups */}
      <div className="space-y-3">
        {filteredCatalogue.length === 0 ? (
          <div className="p-12 text-center rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]">
            <Search className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              No permissions match current filters
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
              Try adjusting your search query, or clear the "Show Enabled Only" filter.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setOnlyEnabled(false);
                setActiveModuleFilter('ALL');
              }}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredCatalogue.map((moduleItem) => {
            const isExpanded = expandedModules[moduleItem.module] !== false;
            const moduleActionCount = moduleItem.actions.length;
            const selectedActionCount = moduleItem.actions.filter((a) =>
              ruleMap.has(a.action)
            ).length;
            const isAllSelected = selectedActionCount === moduleActionCount && moduleActionCount > 0;
            const isIndeterminate =
              selectedActionCount > 0 && selectedActionCount < moduleActionCount;

            return (
              <div
                key={moduleItem.module}
                className="border border-slate-200 dark:border-[#1A3125] rounded-xl overflow-hidden bg-white dark:bg-[#111D17] transition-all shadow-2xs"
              >
                {/* Group Accordion Header */}
                <div
                  className="px-4 py-3 bg-slate-50/80 dark:bg-[#0E1A14] flex items-center justify-between cursor-pointer select-none border-b border-slate-200/80 dark:border-[#1A3125]/80 hover:bg-slate-100/60 dark:hover:bg-[#14261D] transition-colors"
                  onClick={() => toggleModuleAccordion(moduleItem.module)}
                >
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="p-1 rounded text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none cursor-pointer"
                      aria-label={isExpanded ? 'Collapse module' : 'Expand module'}
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

                  {/* Tri-state Module Checkbox & Counter */}
                  <div className="flex items-center gap-3.5" onClick={(e) => e.stopPropagation()}>
                    <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
                      {selectedActionCount} of {moduleActionCount}
                    </span>

                    {!readOnly && (
                      <Checkbox
                        checked={isAllSelected}
                        indeterminate={isIndeterminate}
                        disabled={readOnly}
                        onChange={() => handleSelectAllModule(moduleItem, isAllSelected)}
                        aria-label={`Select all permissions in ${moduleItem.label}`}
                      />
                    )}
                  </div>
                </div>

                {/* Module Action Rows */}
                {isExpanded && (
                  <div className="divide-y divide-slate-100 dark:divide-[#1A3125]/60">
                    {moduleItem.actions.map((act) => {
                      const rule = ruleMap.get(act.action);
                      return (
                        <PermissionRow
                          key={act.action}
                          moduleItem={moduleItem}
                          actionItem={act}
                          rule={rule}
                          readOnly={readOnly}
                          onToggle={handleToggleAction}
                          onScopeChange={handleScopeChange}
                          onLimitChange={handleLimitChange}
                        />
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

export default PermissionMatrix;
