/**
 * @file MyAccessTab.jsx
 * @description Employee Self-Service "My Access" Tab Component (Slice 26.17).
 * 
 * SPECIFICATION & FEATURES:
 * - Module: M26 Roles & Permissions (BUILD-GUIDE Section 5 · Row 26.17)
 * - Layer: Frontend Component
 * - Read-only transparency screen displaying user's assigned roles, effective data scopes, and powers.
 */

import React from 'react';
import {
  ShieldCheck,
  Lock,
  Layers,
  CheckCircle2,
  Clock,
  Info
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth.js';

export function MyAccessTab() {
  const { user } = useAuth();
  const roles = user?.roles || [];
  const permissions = user?.effectivePermissions || [];
  const delegations = user?.activeDelegations || [];

  return (
    <div className="space-y-6 max-w-4xl text-xs">
      {/* Overview Banner */}
      <div className="p-4 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm flex items-start gap-3.5">
        <div className="p-2.5 rounded-xl bg-emerald-50 text-[#00C471] border border-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60 shrink-0">
          <ShieldCheck className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Security Profile & System Authorization
          </h3>
          <p className="text-slate-500 dark:text-slate-400 mt-0.5">
            This dashboard displays your assigned organizational roles and CASL authorization boundaries across company systems.
          </p>
        </div>
      </div>

      {/* Active Roles Card */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-[#00C471]" />
          Assigned Roles ({roles.length})
        </h4>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {roles.map((r, idx) => {
            const roleName = typeof r === 'string' ? r : r.name;
            const description =
              typeof r === 'object' && r.description
                ? r.description
                : 'Standard organizational authorization profile';

            return (
              <div
                key={idx}
                className="p-3.5 rounded-xl border border-slate-200/80 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0E1A14] space-y-1"
              >
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
                  <span className="w-2 h-2 rounded-full bg-[#00C471]" />
                  <span>{roleName}</span>
                </div>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  {description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Temporary Delegations (if active) */}
      {delegations.length > 0 && (
        <div className="p-4 rounded-xl border border-amber-200/80 dark:border-amber-900/60 bg-amber-50/50 dark:bg-amber-950/20 text-amber-900 dark:text-amber-300 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <span>Active Temporary Approvals Handover</span>
          </div>
          <p className="text-[11px]">
            You have received temporary authorization from a colleague during their scheduled absence.
          </p>
        </div>
      )}

      {/* Granular Capabilities Breakdown */}
      <div className="p-6 rounded-2xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] shadow-sm space-y-3">
        <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#00C471]" />
          Active Operations & Data Scopes
        </h4>

        {permissions.length === 0 ? (
          <p className="text-slate-400 py-4 text-center">
            Standard self-service capabilities active.
          </p>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-[#1A3125]">
            {permissions.map((perm, idx) => (
              <div
                key={idx}
                className="py-2.5 flex items-center justify-between gap-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                    {perm.action}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    ({perm.subject || 'all'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                    Scope: {perm.scope || 'own'}
                  </span>
                  {perm.limit !== undefined && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 dark:bg-emerald-950/40 text-[#00C471] border border-emerald-200/60 dark:border-emerald-800/60">
                      Cap: {perm.limit}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default MyAccessTab;
