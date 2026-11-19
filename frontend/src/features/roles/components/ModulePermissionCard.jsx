/**
 * @file ModulePermissionCard.jsx
 * @description Enterprise Module Permission Card & Accordion Component.
 * Supports tri-state selection, batch scope dropdown, module metadata, and granular action list.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React from 'react';
import {
  ChevronDown,
  ChevronRight,
  Shield,
  Users,
  Clock,
  Calendar,
  BadgeDollarSign,
  Coins,
  Receipt,
  Laptop,
  UserPlus,
  FolderKanban,
  Award,
  ListChecks,
  Bot,
  Trophy,
  ShieldAlert,
  MessageSquare,
  TrendingDown,
  BarChart3,
  BookOpen,
  Megaphone,
  Bell,
  History,
  Building2,
  Lock,
  Layers
} from 'lucide-react';
import { Checkbox } from '../../../components/common/Checkbox.jsx';
import { PermissionActionRow } from './PermissionActionRow.jsx';

// Module Icon Registry
const MODULE_ICON_MAP = {
  auth: Lock,
  user: Users,
  role: Shield,
  employee: Users,
  department: Building2,
  designation: Award,
  org: Building2,
  attendance: Clock,
  shift: Clock,
  wfh: Clock,
  leave: Calendar,
  holiday: Calendar,
  payroll: BadgeDollarSign,
  loan: Coins,
  salary_structure: BadgeDollarSign,
  expense: Receipt,
  asset: Laptop,
  recruitment: UserPlus,
  job: UserPlus,
  candidate: UserPlus,
  interview: UserPlus,
  project: FolderKanban,
  timesheet: FolderKanban,
  performance: Award,
  onboard: ListChecks,
  offboard: ListChecks,
  resignation: ListChecks,
  chatbot: Bot,
  rewards: Trophy,
  feedback: ShieldAlert,
  grievance: ShieldAlert,
  chat: MessageSquare,
  attrition: TrendingDown,
  report: BarChart3,
  reports: BarChart3,
  policy: BookOpen,
  announcement: Megaphone,
  notification: Bell,
  login: History,
  audit: Shield,
  settings: Layers
};

export function ModulePermissionCard({
  moduleItem,
  isExpanded,
  onToggleExpand,
  ruleMap,
  readOnly,
  onToggleAction,
  onScopeChange,
  onLimitChange,
  onSelectAllModule,
  onBulkModuleScope
}) {
  const moduleActionCount = moduleItem.actions?.length || 0;
  const selectedActionCount = (moduleItem.actions || []).filter((a) =>
    ruleMap.has(a.action)
  ).length;

  const isAllSelected = selectedActionCount === moduleActionCount && moduleActionCount > 0;
  const isIndeterminate = selectedActionCount > 0 && selectedActionCount < moduleActionCount;

  const Icon = MODULE_ICON_MAP[moduleItem.module] || MODULE_ICON_MAP[moduleItem.subject?.toLowerCase()] || Shield;

  return (
    <div className="border border-slate-200 dark:border-[#1A3125] rounded-xl overflow-hidden bg-white dark:bg-[#111D17] transition-all shadow-2xs">
      {/* Group Accordion Header */}
      <div
        className="px-4 py-3 bg-slate-50/80 dark:bg-[#0E1A14] flex items-center justify-between cursor-pointer select-none border-b border-slate-200/80 dark:border-[#1A3125]/80 hover:bg-slate-100/60 dark:hover:bg-[#14261D] transition-colors"
        onClick={() => onToggleExpand(moduleItem.module)}
      >
        <div className="flex items-center gap-3 min-w-0">
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

          <div className="p-1.5 rounded-lg bg-emerald-50 dark:bg-[#1A3125]/60 text-brand shrink-0">
            <Icon className="w-4 h-4" />
          </div>

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-bold text-slate-900 dark:text-white">
                {moduleItem.label}
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-slate-200/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {moduleItem.subject}
              </span>
            </div>
            {moduleItem.description && (
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                {moduleItem.description}
              </p>
            )}
          </div>
        </div>

        {/* Tri-state Module Checkbox, Bulk Scope & Counter */}
        <div className="flex items-center gap-3.5 shrink-0" onClick={(e) => e.stopPropagation()}>
          {/* Bulk Module Scope Dropdown */}
          {!readOnly && selectedActionCount > 0 && (
            <div className="flex items-center gap-1">
              <span className="text-[10px] text-slate-400 font-medium hidden sm:inline">
                Batch scope:
              </span>
              <select
                defaultValue=""
                onChange={(e) => {
                  if (e.target.value) {
                    onBulkModuleScope(moduleItem, e.target.value);
                    e.target.value = '';
                  }
                }}
                className="px-2 py-0.5 text-[10px] rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 font-medium cursor-pointer"
              >
                <option value="" disabled>
                  Batch Scope...
                </option>
                <option value="all">All Records</option>
                <option value="department">Department</option>
                <option value="team">Direct Team</option>
                <option value="own">Self Only</option>
              </select>
            </div>
          )}

          <span className="text-xs text-slate-500 dark:text-slate-400 font-semibold tabular-nums">
            {selectedActionCount} of {moduleActionCount}
          </span>

          {!readOnly && (
            <Checkbox
              checked={isAllSelected}
              indeterminate={isIndeterminate}
              disabled={readOnly}
              onChange={() => onSelectAllModule(moduleItem, isAllSelected)}
              aria-label={`Select all permissions in ${moduleItem.label}`}
            />
          )}
        </div>
      </div>

      {/* Module Action Rows */}
      {isExpanded && (
        <div className="divide-y divide-slate-100 dark:divide-[#1A3125]/60">
          {(moduleItem.actions || []).map((act) => {
            const rule = ruleMap.get(act.action);
            return (
              <PermissionActionRow
                key={act.action}
                moduleItem={moduleItem}
                actionItem={act}
                rule={rule}
                readOnly={readOnly}
                onToggle={onToggleAction}
                onScopeChange={onScopeChange}
                onLimitChange={onLimitChange}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

export default ModulePermissionCard;
