/**
 * @file ChangeRequestDashboard.jsx
 * @description Executive KPI Deck & Pure SVG Analytics for Change Request Module.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React from 'react';
import {
  FileText,
  Clock,
  UserCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  PieChart as PieIcon,
  TrendingUp,
  Activity
} from 'lucide-react';
import { Card } from '../../../../components/common/Card.jsx';
import { CATEGORY_CONFIG } from './changeRequestTheme.js';

export function ChangeRequestDashboard({ stats, isLoading }) {
  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 animate-pulse">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-slate-100 dark:bg-[#111D17] border border-slate-200/80 dark:border-[#1A3125]"
          />
        ))}
      </div>
    );
  }

  const {
    total = 0,
    pending = 0,
    under_review = 0,
    approved = 0,
    rejected = 0,
    returned = 0,
    myPendingAction = 0,
    categoryBreakdown = {}
  } = stats || {};

  const totalActionablePending = pending + under_review;
  const approvalRate = total > 0 ? Math.round((approved / total) * 100) : 0;

  const kpis = [
    {
      id: 'total',
      label: 'Total Requests',
      value: total,
      sublabel: `${approvalRate}% approved overall`,
      icon: FileText,
      accent: 'text-slate-700 dark:text-slate-200',
      bg: 'bg-slate-50 dark:bg-slate-900/50',
      border: 'border-slate-200 dark:border-[#1A3125]'
    },
    {
      id: 'pending',
      label: 'Pending Review',
      value: totalActionablePending,
      sublabel: `${under_review} currently in review`,
      icon: Clock,
      accent: 'text-amber-600 dark:text-amber-400',
      bg: 'bg-amber-50/70 dark:bg-amber-950/20',
      border: 'border-amber-200/80 dark:border-amber-800/30'
    },
    {
      id: 'my-action',
      label: 'Requires My Action',
      value: myPendingAction,
      sublabel: 'Awaiting your decision',
      icon: UserCheck,
      accent: 'text-emerald-600 dark:text-emerald-400',
      bg: 'bg-emerald-50/70 dark:bg-emerald-950/20',
      border: 'border-emerald-200/80 dark:border-emerald-800/30'
    },
    {
      id: 'approved',
      label: 'Approved',
      value: approved,
      sublabel: 'Profile updates applied',
      icon: CheckCircle2,
      accent: 'text-[#00C471] dark:text-[#00C471]',
      bg: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      border: 'border-emerald-200/80 dark:border-emerald-800/30'
    },
    {
      id: 'rejected',
      label: 'Rejected',
      value: rejected,
      sublabel: 'Declined requests',
      icon: XCircle,
      accent: 'text-rose-600 dark:text-rose-400',
      bg: 'bg-rose-50/70 dark:bg-rose-950/20',
      border: 'border-rose-200/80 dark:border-rose-800/30'
    },
    {
      id: 'returned',
      label: 'Returned for Revision',
      value: returned,
      sublabel: 'Awaiting resubmission',
      icon: RotateCcw,
      accent: 'text-purple-600 dark:text-purple-400',
      bg: 'bg-purple-50/70 dark:bg-purple-950/20',
      border: 'border-purple-200/80 dark:border-purple-800/30'
    }
  ];

  // Category breakdown calculations for pure SVG donut/bars
  const categoryEntries = Object.entries(categoryBreakdown);
  const maxCategoryCount = Math.max(...categoryEntries.map(([, c]) => c), 1);

  return (
    <div className="space-y-4">
      {/* 6-Card KPI Deck */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.id}
              className={`p-3.5 rounded-2xl border ${kpi.bg} ${kpi.border} transition-all duration-200 hover:shadow-xs`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 truncate">
                  {kpi.label}
                </span>
                <div className={`p-1 rounded-lg ${kpi.accent} bg-white/60 dark:bg-white/5`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className={`text-xl font-bold font-mono tracking-tight ${kpi.accent}`}>
                {kpi.value}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 truncate mt-0.5">
                {kpi.sublabel}
              </div>
            </div>
          );
        })}
      </div>

      {/* Visual Analytics Row: Category Distribution & Status Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        {/* Category Breakdown (2 Cols) */}
        <Card className="lg:col-span-2 p-4 border-slate-200 dark:border-[#1A3125]">
          <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#1A3125] pb-2.5">
            <div className="flex items-center gap-2">
              <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#00C471]">
                <PieIcon className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                Request Volume by Change Category
              </h4>
            </div>
            <span className="text-[10px] font-mono text-slate-400 dark:text-slate-500">
              {categoryEntries.length} active categories
            </span>
          </div>

          {categoryEntries.length === 0 ? (
            <div className="h-28 flex items-center justify-center text-xs text-slate-400 dark:text-slate-500">
              No category data recorded yet
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5">
              {categoryEntries.map(([catKey, count]) => {
                const config = CATEGORY_CONFIG[catKey] || {
                  label: catKey,
                  shortLabel: catKey,
                  icon: Activity
                };
                const CatIcon = config.icon;
                const percent = total > 0 ? Math.round((count / total) * 100) : 0;
                const barWidth = Math.round((count / maxCategoryCount) * 100);

                return (
                  <div key={catKey} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 truncate">
                        <CatIcon className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 shrink-0" />
                        <span className="font-medium text-slate-700 dark:text-slate-300 truncate text-[11px]">
                          {config.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-[11px] font-mono">
                        <span className="font-bold text-slate-900 dark:text-white">{count}</span>
                        <span className="text-slate-400">({percent}%)</span>
                      </div>
                    </div>
                    {/* Visual Bar */}
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#00C471] rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(barWidth, 6)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        {/* Status Distribution Meter (1 Col) */}
        <Card className="p-4 border-slate-200 dark:border-[#1A3125] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 dark:border-[#1A3125] pb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-[#00C471]">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  Resolution Velocity
                </h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                {approvalRate}% approved
              </span>
            </div>

            {/* Stacked Proportional Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-white/5 flex overflow-hidden mb-3">
              {approved > 0 && (
                <div
                  className="bg-[#00C471] h-full transition-all duration-500"
                  style={{ width: `${(approved / Math.max(total, 1)) * 100}%` }}
                  title={`Approved: ${approved}`}
                />
              )}
              {totalActionablePending > 0 && (
                <div
                  className="bg-amber-400 h-full transition-all duration-500"
                  style={{ width: `${(totalActionablePending / Math.max(total, 1)) * 100}%` }}
                  title={`Pending: ${totalActionablePending}`}
                />
              )}
              {rejected > 0 && (
                <div
                  className="bg-rose-500 h-full transition-all duration-500"
                  style={{ width: `${(rejected / Math.max(total, 1)) * 100}%` }}
                  title={`Rejected: ${rejected}`}
                />
              )}
              {returned > 0 && (
                <div
                  className="bg-purple-500 h-full transition-all duration-500"
                  style={{ width: `${(returned / Math.max(total, 1)) * 100}%` }}
                  title={`Returned: ${returned}`}
                />
              )}
            </div>

            {/* Legend */}
            <div className="space-y-1.5 text-[11px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-[#00C471]" />
                  <span>Approved & Applied</span>
                </div>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {approved}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Awaiting Review</span>
                </div>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {totalActionablePending}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-rose-500" />
                  <span>Rejected / Declined</span>
                </div>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {rejected}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <span className="w-2 h-2 rounded-full bg-purple-500" />
                  <span>Returned for Correction</span>
                </div>
                <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                  {returned}
                </span>
              </div>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-[#1A3125] text-[10px] text-slate-400 dark:text-slate-500 flex items-center justify-between">
            <span>Enterprise SLA Standard</span>
            <span className="font-semibold text-slate-600 dark:text-slate-300">Within 48h</span>
          </div>
        </Card>
      </div>
    </div>
  );
}
