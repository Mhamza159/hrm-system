/**
 * @file PermissionMatrix.jsx
 * @description High-Performance Visual Permission Matrix Studio for Roles & Access Governance.
 * Features Sticky Command Toolbar, Category Quick-Jump Ribbon, Module Permission Cards with Tri-State Checkboxes,
 * Fine-Grained Action Grid with Scopes and Approval Limits, and Dependency Auto-Granting.
 * 
 * Follows Elvara Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState, useMemo, useCallback } from 'react';
import {
  Shield,
  Search,
  Filter,
  HelpCircle,
  Info,
  AlertCircle
} from 'lucide-react';
import { useGetPermissionsQuery } from '../rolesApi.js';
import { MatrixCategoryNav, MATRIX_CATEGORIES } from './MatrixCategoryNav.jsx';
import { ModulePermissionCard } from './ModulePermissionCard.jsx';
import { ScreenSkeleton } from '../../../components/common/ScreenSkeleton.jsx';
import { cn } from '../../../lib/utils.js';

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

export function PermissionMatrix({
  value = [],
  onChange,
  readOnly = false,
  className = ''
}) {
  const { data: catalogueResponse, isLoading, isError, refetch } = useGetPermissionsQuery();
  const catalogue = useMemo(() => catalogueResponse?.data || [], [catalogueResponse]);

  // Local UI Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyEnabled, setOnlyEnabled] = useState(false);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [showScopeInfo, setShowScopeInfo] = useState(false);

  // Accordion state (all expanded by default)
  const [expandedModules, setExpandedModules] = useState({});

  // Fast O(1) rule lookup map
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

  // Toggle single action rule with dependency auto-grant
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
        scope: actionItem.defaultScope || actionItem.allowedScopes?.[0] || 'all',
        fields: [],
        limit: undefined
      };

      // Dependency validation: if granting mutation/approval, ensure module's view action is also granted
      const newRules = [newRule];
      const viewAction = (moduleItem.actions || []).find(
        (a) => a.action.endsWith('.view') || a.action.endsWith('.read')
      );
      if (
        viewAction &&
        viewAction.action !== actionItem.action &&
        !ruleMap.has(viewAction.action)
      ) {
        newRules.push({
          action: viewAction.action,
          subject: moduleItem.subject,
          scope: viewAction.defaultScope || viewAction.allowedScopes?.[0] || 'all',
          fields: [],
          limit: undefined
        });
      }

      onChange?.([...value, ...newRules]);
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
    const moduleActionNames = new Set((moduleItem.actions || []).map((a) => a.action));

    if (isSelected) {
      // Deselect all
      const updated = value.filter((r) => !moduleActionNames.has(r.action));
      onChange?.(updated);
    } else {
      // Select all
      const otherRules = value.filter((r) => !moduleActionNames.has(r.action));
      const newModuleRules = (moduleItem.actions || []).map((a) => {
        const existing = ruleMap.get(a.action);
        return (
          existing || {
            action: a.action,
            subject: moduleItem.subject,
            scope: a.defaultScope || a.allowedScopes?.[0] || 'all',
            fields: [],
            limit: undefined
          }
        );
      });
      onChange?.([...otherRules, ...newModuleRules]);
    }
  }, [readOnly, ruleMap, value, onChange]);

  // Bulk set scope for all enabled actions in a module
  const handleBulkModuleScope = useCallback((moduleItem, newScope) => {
    if (readOnly) return;
    const moduleActionNames = new Set((moduleItem.actions || []).map((a) => a.action));
    const updated = value.map((r) => {
      if (moduleActionNames.has(r.action)) {
        return { ...r, scope: newScope };
      }
      return r;
    });
    onChange?.(updated);
  }, [readOnly, value, onChange]);

  // Bulk Grant All / Revoke All across entire catalogue
  const handleBulkGrantAll = useCallback(() => {
    if (readOnly) return;
    const allRules = [];
    catalogue.forEach((mod) => {
      (mod.actions || []).forEach((act) => {
        const existing = ruleMap.get(act.action);
        allRules.push(
          existing || {
            action: act.action,
            subject: mod.subject,
            scope: act.defaultScope || act.allowedScopes?.[0] || 'all',
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

  // Compute category statistics for the ribbon
  const categoryStats = useMemo(() => {
    const stats = {};
    MATRIX_CATEGORIES.forEach((cat) => {
      if (cat.key === 'ALL') return;
      let total = 0;
      let active = 0;
      catalogue.forEach((mod) => {
        if (cat.modules.includes(mod.module)) {
          total += mod.actions?.length || 0;
          (mod.actions || []).forEach((act) => {
            if (ruleMap.has(act.action)) active++;
          });
        }
      });
      stats[cat.key] = { active, total };
    });
    return stats;
  }, [catalogue, ruleMap]);

  // Filter catalogue by search query, enabled flag, and active category tab
  const filteredCatalogue = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const currentCatObj = MATRIX_CATEGORIES.find((c) => c.key === activeCategory);

    return catalogue
      .filter((moduleItem) => {
        if (activeCategory !== 'ALL' && currentCatObj) {
          if (!currentCatObj.modules.includes(moduleItem.module)) {
            return false;
          }
        }
        return true;
      })
      .map((moduleItem) => {
        const matchingActions = (moduleItem.actions || []).filter((act) => {
          if (onlyEnabled && !ruleMap.has(act.action)) {
            return false;
          }
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
  }, [catalogue, searchQuery, onlyEnabled, activeCategory, ruleMap]);

  const totalPossiblePermissions = useMemo(() => {
    return catalogue.reduce((sum, m) => sum + (m.actions?.length || 0), 0) || 127;
  }, [catalogue]);

  if (isLoading) {
    return (
      <ScreenSkeleton
        variant="matrix"
        title="Security & RBAC Matrix Studio"
        message="Loading master permission catalogue and CASL authorization bindings..."
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
      {/* 1. Matrix Studio Header & Live Stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1A3125]">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-brand" />
              Permission Matrix & CASL Policy Studio
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
            Configure fine-grained module capabilities, data boundary filters, and approval limits.
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
              <div
                key={key}
                className="p-2.5 rounded-lg bg-white dark:bg-[#111D17] border border-slate-200/80 dark:border-slate-800"
              >
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

      {/* 2. Sticky Command Toolbar Above Matrix */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-[#111D17]/95 backdrop-blur-md p-3 rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search permissions by name or key (e.g. attendance.approve)..."
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

      {/* 3. Category Quick-Jump Ribbon */}
      <MatrixCategoryNav
        activeCategory={activeCategory}
        onSelectCategory={setActiveCategory}
        categoryStats={categoryStats}
        totalActive={value.length}
        totalPossible={totalPossiblePermissions}
      />

      {/* 4. Filtered Module Cards List */}
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
                setActiveCategory('ALL');
              }}
              className="mt-3 px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredCatalogue.map((moduleItem) => {
            const isExpanded = expandedModules[moduleItem.module] !== false;

            return (
              <ModulePermissionCard
                key={moduleItem.module}
                moduleItem={moduleItem}
                isExpanded={isExpanded}
                onToggleExpand={toggleModuleAccordion}
                ruleMap={ruleMap}
                readOnly={readOnly}
                onToggleAction={handleToggleAction}
                onScopeChange={handleScopeChange}
                onLimitChange={handleLimitChange}
                onSelectAllModule={handleSelectAllModule}
                onBulkModuleScope={handleBulkModuleScope}
              />
            );
          })
        )}
      </div>
    </div>
  );
}

export default PermissionMatrix;
