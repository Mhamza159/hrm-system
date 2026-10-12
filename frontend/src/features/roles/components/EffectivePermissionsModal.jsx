/**
 * @file EffectivePermissionsModal.jsx
 * @description Effective Permissions Inspector ("View As User") Modal Component (Slice 26.15).
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.15)
 * - Layer: Frontend Feature Component
 * - Displays unified additive abilities, active scopes, and originating sources (Role vs Delegation).
 */

import React from 'react';
import {
  ShieldCheck,
  X,
  Lock,
  CalendarRange,
  Users,
  Loader2,
  CheckCircle2,
  Clock
} from 'lucide-react';
import { useGetEffectivePermissionsQuery } from '../rolesApi.js';

export function EffectivePermissionsModal({
  isOpen,
  onClose,
  userId,
  userEmail
}) {
  const { data: response, isLoading } = useGetEffectivePermissionsQuery(userId, {
    skip: !isOpen || !userId
  });

  if (!isOpen) return null;

  const userData = response?.data;
  const roles = userData?.roles || [];
  const permissions = userData?.effectivePermissions || [];
  const delegations = userData?.activeDelegations || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-2xl p-6 shadow-2xl space-y-4 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100 dark:border-[#1A3125]">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-emerald-50 text-[#00C471] border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Effective Permissions Inspector
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Auditing compiled capabilities for: <strong className="text-slate-700 dark:text-slate-200">{userEmail}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-[#00C471]" />
            <span className="text-xs font-medium">Resolving authorization union...</span>
          </div>
        ) : (
          <div className="overflow-y-auto space-y-4 pr-1 text-xs">
            {/* Assigned Roles Summary */}
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0E1A14] border border-slate-200/80 dark:border-[#1A3125] space-y-1.5">
              <span className="font-semibold text-slate-700 dark:text-slate-300 block text-[11px] uppercase tracking-wider">
                Assigned Roles ({roles.length})
              </span>
              <div className="flex flex-wrap gap-1.5">
                {roles.map((r, idx) => {
                  const roleName = typeof r === 'string' ? r : r.name;
                  const isSys = r.isSystem;
                  return (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] text-slate-800 dark:text-slate-200 shadow-2xs"
                    >
                      {isSys && <Lock className="w-2.5 h-2.5 text-slate-400" />}
                      <span>{roleName}</span>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Active Delegations (if any) */}
            {delegations.length > 0 && (
              <div className="p-3 rounded-xl bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40 space-y-1.5">
                <span className="font-semibold text-emerald-800 dark:text-emerald-300 block text-[11px] uppercase tracking-wider flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[#00C471]" />
                  Active Inbound Delegations ({delegations.length})
                </span>
                <div className="text-[11px] text-slate-600 dark:text-slate-300 space-y-1">
                  {delegations.map((d, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span>Temporary approvals from colleague</span>
                      <span className="text-[10px] font-mono text-slate-400">
                        Until {new Date(d.endDate).toLocaleDateString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Consolidated Permissions List */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-800 dark:text-slate-200 text-xs">
                  Compiled Permissions ({permissions.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  Additive union of roles + delegations
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-[#1A3125] border border-slate-200 dark:border-[#1A3125] rounded-xl overflow-hidden bg-white dark:bg-[#111D17]">
                {permissions.length === 0 ? (
                  <div className="py-6 text-center text-slate-400">
                    No active permissions granted.
                  </div>
                ) : (
                  permissions.map((perm, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 flex items-center justify-between gap-2 hover:bg-slate-50/50 dark:hover:bg-[#14261D]/50 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-[#00C471] shrink-0" />
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 font-mono">
                            {perm.action}
                          </span>
                          <span className="text-[10px] text-slate-400 ml-2">
                            on {perm.subject || 'all'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* Scope pill */}
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {perm.scope || 'all'}
                        </span>

                        {/* Origin badge */}
                        {perm.isDelegated ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900">
                            Delegated
                          </span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-50 dark:bg-slate-800/60 text-slate-500">
                            Role
                          </span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-100 dark:border-[#1A3125] flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-100 dark:hover:bg-[#14261D] transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
}
export default EffectivePermissionsModal;
