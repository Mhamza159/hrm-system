/**
 * @file UserAccessDashboard.jsx
 * @description Actionable KPI Metrics Deck and Pure SVG Security Analytics for User Access.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React from 'react';
import {
  Users,
  UserCheck,
  UserX,
  Lock,
  ShieldAlert,
  ShieldCheck,
  Activity,
  Layers
} from 'lucide-react';

export function UserAccessDashboard({
  stats,
  isLoading,
  selectedStatus,
  onSelectStatus,
  selectedAccessStatus,
  onSelectAccessStatus
}) {
  if (isLoading && !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="h-24 rounded-2xl bg-slate-100 dark:bg-white/5 animate-pulse"
          />
        ))}
      </div>
    );
  }

  const {
    totalUsers = 0,
    activeUsers = 0,
    inactiveUsers = 0,
    lockedUsers = 0,
    assignedUsers = 0,
    unassignedUsers = 0,
    twoFactorUsers = 0,
    roleBreakdown = []
  } = stats || {};

  const safeRoleBreakdown = Array.isArray(roleBreakdown) ? roleBreakdown : [];

  const kpis = [
    {
      id: 'total',
      label: 'Total Users',
      value: totalUsers,
      sublabel: `${assignedUsers} with roles`,
      icon: Users,
      color: 'emerald',
      active: selectedStatus === 'all' && selectedAccessStatus === 'all',
      onClick: () => {
        onSelectStatus('all');
        onSelectAccessStatus('all');
      }
    },
    {
      id: 'active',
      label: 'Active Accounts',
      value: activeUsers,
      sublabel: 'Authentication open',
      icon: UserCheck,
      color: 'emerald',
      active: selectedStatus === 'active',
      onClick: () => onSelectStatus(selectedStatus === 'active' ? 'all' : 'active')
    },
    {
      id: 'inactive',
      label: 'Deactivated',
      value: inactiveUsers,
      sublabel: 'Login blocked',
      icon: UserX,
      color: 'slate',
      active: selectedStatus === 'inactive',
      onClick: () => onSelectStatus(selectedStatus === 'inactive' ? 'all' : 'inactive')
    },
    {
      id: 'locked',
      label: 'Locked Out',
      value: lockedUsers,
      sublabel: '5+ bad attempts',
      icon: Lock,
      color: 'amber',
      active: selectedStatus === 'locked',
      onClick: () => onSelectStatus(selectedStatus === 'locked' ? 'all' : 'locked')
    },
    {
      id: 'unassigned',
      label: 'No Roles',
      value: unassignedUsers,
      sublabel: 'Access setup needed',
      icon: ShieldAlert,
      color: 'purple',
      active: selectedAccessStatus === 'unassigned',
      onClick: () => onSelectAccessStatus(selectedAccessStatus === 'unassigned' ? 'all' : 'unassigned')
    },
    {
      id: '2fa',
      label: '2FA Enforced',
      value: twoFactorUsers,
      sublabel: `${totalUsers ? Math.round((twoFactorUsers / totalUsers) * 100) : 0}% compliance`,
      icon: ShieldCheck,
      color: 'emerald',
      active: false,
      onClick: () => {}
    }
  ];

  // Calculate percentage for SVG Donut
  const activePct = totalUsers ? Math.round((activeUsers / totalUsers) * 100) : 0;

  // Max count for role breakdown bars
  const maxRoleCount = Math.max(1, ...safeRoleBreakdown.map((r) => Number(r?.count) || 0));

  return (
    <div className="space-y-4">
      {/* 6-Card Actionable KPI Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {kpis.map((kpi) => {
          const Icon = kpi.icon;
          return (
            <button
              type="button"
              key={kpi.id}
              onClick={kpi.onClick}
              className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                kpi.active
                  ? 'bg-emerald-50/80 border-[#00C471] ring-2 ring-[#00C471]/20 dark:bg-emerald-950/40 dark:border-[#00C471]'
                  : 'bg-white dark:bg-[#111D17] border-slate-200 dark:border-[#1A3125] hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex items-center justify-between gap-1 mb-2">
                <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider truncate">
                  {kpi.label}
                </span>
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                    kpi.color === 'emerald'
                      ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-[#00C471]'
                      : kpi.color === 'amber'
                      ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      : kpi.color === 'purple'
                      ? 'bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300'
                      : 'bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {kpi.value}
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 font-medium truncate mt-0.5">
                {kpi.sublabel}
              </div>
            </button>
          );
        })}
      </div>

      {/* Pure SVG Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Role Breakdown Chart (2 Cols) */}
        <div className="lg:col-span-2 p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-3">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#00C471]" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Users by Assigned Role Distribution
              </h4>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">
              {safeRoleBreakdown.length} Roles Registered
            </span>
          </div>

          {safeRoleBreakdown.length === 0 ? (
            <div className="py-6 text-center text-xs text-slate-400">
              No role assignments recorded.
            </div>
          ) : (
            <div className="space-y-2.5 pt-1">
              {safeRoleBreakdown.map((r) => {
                const count = Number(r?.count) || 0;
                const pct = Math.round((count / maxRoleCount) * 100);
                const roleName = r?.roleName || 'Assigned Role';
                return (
                  <div key={r?.roleId || roleName} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {roleName}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400 font-bold">
                        {count} users ({totalUsers ? Math.round((count / totalUsers) * 100) : 0}%)
                      </span>
                    </div>
                    {/* SVG Progress Track */}
                    <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-[#00C471] transition-all duration-500"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Account Security Health Donut / Posture */}
        <div className="p-4 rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-3 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#1A3125] pb-2.5">
              <Activity className="w-4 h-4 text-[#00C471]" />
              <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Account Security Posture
              </h4>
            </div>

            <div className="py-3 flex items-center justify-center">
              {/* Pure SVG Donut Meter */}
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                  {/* Background Track */}
                  <path
                    className="text-slate-100 dark:text-white/5"
                    strokeWidth="3.8"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  {/* Active Segment (Emerald) */}
                  <path
                    className="text-[#00C471]"
                    strokeDasharray={`${activePct}, 100`}
                    strokeWidth="3.8"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center justify-center text-center">
                  <span className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {activePct}%
                  </span>
                  <span className="text-[9px] uppercase tracking-wider text-slate-400 font-bold">
                    Active Rate
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown Legend */}
          <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 dark:border-[#1A3125] text-center text-xs">
            <div className="p-1.5 rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20">
              <div className="text-[10px] text-emerald-700 dark:text-emerald-400 font-bold uppercase">Active</div>
              <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{activeUsers}</div>
            </div>
            <div className="p-1.5 rounded-xl bg-slate-50 dark:bg-white/5">
              <div className="text-[10px] text-slate-500 font-bold uppercase">Inactive</div>
              <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{inactiveUsers}</div>
            </div>
            <div className="p-1.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20">
              <div className="text-[10px] text-amber-700 dark:text-amber-400 font-bold uppercase">Locked</div>
              <div className="font-extrabold text-slate-900 dark:text-white mt-0.5">{lockedUsers}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
