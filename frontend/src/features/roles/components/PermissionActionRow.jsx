/**
 * @file PermissionActionRow.jsx
 * @description High-performance memoized row for granular permission actions.
 * Supports primary emerald checkbox, action identifier badge, data scope selector,
 * and numerical approval limit input.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { memo } from 'react';
import { Sliders } from 'lucide-react';
import { Checkbox } from '../../../components/common/Checkbox.jsx';
import { cn } from '../../../lib/utils.js';

export const PermissionActionRow = memo(function PermissionActionRow({
  moduleItem,
  actionItem,
  rule,
  readOnly,
  onToggle,
  onScopeChange,
  onLimitChange
}) {
  const isChecked = Boolean(rule);
  const currentScope =
    rule?.scope || actionItem.defaultScope || actionItem.allowedScopes?.[0] || 'all';
  const currentLimit = rule?.limit;

  const hasApprovalLimit =
    actionItem.action.includes('approve') ||
    actionItem.action.includes('expense') ||
    actionItem.action.includes('limit') ||
    actionItem.hasLimit;

  return (
    <div
      className={cn(
        'p-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs transition-colors duration-150',
        isChecked
          ? 'bg-emerald-50/30 dark:bg-emerald-950/20'
          : 'hover:bg-slate-50/80 dark:hover:bg-white/[0.02]'
      )}
    >
      {/* 1. Action Checkbox & Identity */}
      <div className="flex items-start gap-3 flex-1 min-w-0">
        <Checkbox
          id={`perm-${actionItem.action}`}
          checked={isChecked}
          disabled={readOnly}
          onChange={() => onToggle(moduleItem, actionItem)}
          aria-label={`Toggle permission for ${actionItem.label}`}
          className="mt-0.5"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <label
              htmlFor={`perm-${actionItem.action}`}
              className={cn(
                'font-bold cursor-pointer select-none leading-tight',
                isChecked ? 'text-slate-900 dark:text-white' : 'text-slate-700 dark:text-slate-300'
              )}
            >
              {actionItem.label}
            </label>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 dark:bg-[#061A14] text-slate-500 dark:text-slate-400 border border-slate-200/60 dark:border-[#1A3125]">
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

      {/* 2. Scopes & Limit Selectors */}
      <div className="flex items-center gap-3 pl-7 md:pl-0 shrink-0">
        {/* Data Scope Selector */}
        <div
          className="flex items-center gap-1.5"
          title={!isChecked ? 'Enable permission to configure data scope' : undefined}
        >
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            Scope:
          </span>
          <select
            value={currentScope}
            disabled={!isChecked || readOnly}
            onChange={(e) => onScopeChange(actionItem.action, e.target.value)}
            className={cn(
              'px-2.5 py-1 text-xs rounded-lg border transition-all shadow-2xs font-medium cursor-pointer',
              isChecked
                ? 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00C471]'
                : 'border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400 dark:text-slate-600 cursor-not-allowed opacity-60'
            )}
          >
            {(actionItem.allowedScopes || ['all', 'department', 'team', 'own']).map((sc) => (
              <option key={sc} value={sc}>
                {sc === 'all'
                  ? 'All Records'
                  : sc === 'department'
                  ? 'Department'
                  : sc === 'team'
                  ? 'Direct Team'
                  : 'Self Only'}
              </option>
            ))}
          </select>
        </div>

        {/* Approval Threshold Limit (Slice 26.9) */}
        {hasApprovalLimit && (
          <div
            className="flex items-center gap-1.5"
            title={!isChecked ? 'Enable permission to configure threshold limit' : undefined}
          >
            <Sliders className="w-3 h-3 text-slate-400" />
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
              Limit:
            </span>
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
                  ? 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-[#00C471]'
                  : 'border-slate-200/50 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/40 text-slate-400 cursor-not-allowed opacity-60'
              )}
            />
          </div>
        )}
      </div>
    </div>
  );
});

export default PermissionActionRow;
