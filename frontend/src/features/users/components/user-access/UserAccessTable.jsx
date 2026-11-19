/**
 * @file UserAccessTable.jsx
 * @description Enterprise DataTable for System Users & Access Administration.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React from 'react';
import {
  Shield,
  Eye,
  KeyRound,
  UserCog,
  UserCheck,
  UserX,
  Unlock,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  Building2,
  Briefcase
} from 'lucide-react';
import {
  getUserStatusBadge,
  getRoleBadge,
  get2faBadge
} from './userAccessTheme.js';
import { formatDate } from '../../../../lib/formatters.js';

export function UserAccessTable({
  users = [],
  isLoading,
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  onLimitChange,
  currentUser,
  canManage = true,
  canAssignRole = true,
  onInspect,
  onAssignRole,
  onToggleStatus,
  onUnlockAccount,
  onRevokeSessions: _onRevokeSessions,
  onResetPassword,
  onResetDevice
}) {
  const safeUsers = Array.isArray(users) ? users : [];

  if (isLoading && safeUsers.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] p-6 space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-xl bg-slate-100 dark:bg-white/5 animate-pulse" />
        ))}
      </div>
    );
  }

  if (safeUsers.length === 0) {
    return (
      <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] p-12 text-center">
        <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-[#00C471] flex items-center justify-center mx-auto mb-3">
          <Shield className="w-6 h-6 stroke-[1.5]" />
        </div>
        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">No Users Found</h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
          No user accounts match your selected filter criteria. Try searching with different terms or resetting filters.
        </p>
      </div>
    );
  }

  const safeTotal = Number(total) || safeUsers.length;
  const startRecord = safeTotal === 0 ? 0 : (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, safeTotal);

  return (
    <div className="bg-white dark:bg-[#111D17] rounded-2xl border border-slate-200 dark:border-[#1A3125] shadow-xs overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#0A110D] text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <th className="py-3 px-4">User Identity</th>
              <th className="py-3 px-3">Organization</th>
              <th className="py-3 px-3">Assigned Roles</th>
              <th className="py-3 px-3">Account Status</th>
              <th className="py-3 px-3">Security & 2FA</th>
              <th className="py-3 px-3">Last Login</th>
              <th className="py-3 px-4 text-right">Access Controls</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
            {safeUsers.map((row) => {
              if (!row) return null;
              const isSelf = row._id === currentUser?._id;
              const statusCfg = getUserStatusBadge(row.accountStatus);
              const twoFaCfg = get2faBadge(row.twoFactorEnabled);
              const StatusIcon = statusCfg?.icon || Shield;
              const TwoFaIcon = twoFaCfg?.icon || Shield;

              const emp = row.employee;
              const displayName = row.name || emp?.name || (row.email ? row.email.split('@')[0] : 'User');
              const empCode = emp?.employeeCode || null;
              const deptName = emp?.department || 'Unassigned';
              const desigTitle = emp?.designation || 'Unassigned';

              return (
                <tr
                  key={row._id}
                  className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition-colors"
                >
                  {/* User Identity Cell */}
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00C471] flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-200/80 dark:border-emerald-800/60">
                        {row.avatar || emp?.avatar ? (
                          <img
                            src={row.avatar || emp.avatar}
                            alt={displayName}
                            className="w-full h-full object-cover rounded-xl"
                          />
                        ) : (
                          displayName ? displayName.charAt(0).toUpperCase() : 'U'
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                          <span>{displayName}</span>
                          {isSelf && (
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-[#00C471] font-semibold">
                              You
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">
                          {row.email}
                        </div>
                        {empCode && (
                          <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                            Code: {empCode}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Organization Coordinates Cell */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1 text-slate-800 dark:text-slate-200 font-medium truncate max-w-[150px]">
                      <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{deptName}</span>
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500 truncate max-w-[150px] mt-0.5">
                      <Briefcase className="w-3 h-3 text-slate-400 shrink-0" />
                      <span className="truncate">{desigTitle}</span>
                    </div>
                  </td>

                  {/* Assigned Roles Cell */}
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1 max-w-[180px]">
                      {Array.isArray(row.roles) && row.roles.filter(Boolean).length > 0 ? (
                        row.roles.filter(Boolean).map((r, idx) => {
                          const roleName = typeof r === 'string' ? r : (r?.name || 'Assigned Role');
                          const rBadge = getRoleBadge(roleName);
                          return (
                            <span
                              key={idx}
                              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${rBadge.colorClass}`}
                            >
                              {rBadge.label}
                            </span>
                          );
                        })
                      ) : (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                          No Roles Assigned
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Account Status Cell */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="space-y-1">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${statusCfg.badgeClass}`}
                      >
                        <StatusIcon className="w-3 h-3 shrink-0" />
                        {statusCfg.label}
                      </span>
                      {row.isLocked && (
                        <div className="text-[10px] text-amber-600 dark:text-amber-400 font-bold font-mono">
                          Locked out ({row.failedAttempts || 5} bad attempts)
                        </div>
                      )}
                    </div>
                  </td>

                  {/* Security Posture Cell */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${twoFaCfg.colorClass}`}
                      >
                        <TwoFaIcon className="w-3 h-3" />
                        {twoFaCfg.shortLabel}
                      </span>
                      {row.deviceId && (
                        <span
                          className="p-1 rounded bg-slate-100 dark:bg-white/5 text-slate-500"
                          title={`Device bound: ${row.deviceModel || 'Bound'}`}
                        >
                          <Smartphone className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Last Login Cell */}
                  <td className="py-3 px-3 whitespace-nowrap">
                    <div className="text-slate-700 dark:text-slate-300 font-medium">
                      {row.lastLoginAt ? formatDate(row.lastLoginAt) : 'Never logged in'}
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Joined {row.createdAt && !isNaN(new Date(row.createdAt).getTime()) ? new Date(row.createdAt).toLocaleDateString() : 'N/A'}
                    </div>
                  </td>

                  {/* Action Controls Cell */}
                  <td className="py-3 px-4 text-right whitespace-nowrap">
                    <div className="inline-flex items-center gap-1">
                      {/* Inspect User Forensic Details */}
                      <button
                        type="button"
                        onClick={() => onInspect(row)}
                        className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                        title="Inspect forensic identity and permissions matrix"
                      >
                        <Eye className="w-3.5 h-3.5" /> Inspect
                      </button>

                      {/* Role Assignment Action */}
                      {canAssignRole && (
                        <button
                          type="button"
                          onClick={() => onAssignRole(row)}
                          className="px-2.5 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-800/60 bg-emerald-50/60 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#00C471] hover:bg-emerald-100 text-[11px] font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                          title="Assign or modify user roles"
                        >
                          <UserCog className="w-3.5 h-3.5" /> Roles
                        </button>
                      )}

                      {/* Unlock Action if Locked */}
                      {row.isLocked && canManage && (
                        <button
                          type="button"
                          onClick={() => onUnlockAccount(row)}
                          className="p-1.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900/60 transition-colors cursor-pointer"
                          title="Clear lockout and reset attempts"
                        >
                          <Unlock className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Reset Password Action */}
                      {canManage && !isSelf && (
                        <button
                          type="button"
                          onClick={() => onResetPassword(row)}
                          className="p-1.5 rounded-xl border border-slate-200 dark:border-[#1A3125] text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
                          title="Trigger emergency temporary password reset"
                        >
                          <KeyRound className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Reset Device Binding */}
                      {row.deviceId && canManage && (
                        <button
                          type="button"
                          onClick={() => onResetDevice(row)}
                          className="p-1.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-400 transition-colors cursor-pointer"
                          title="Reset hardware device binding"
                        >
                          <Smartphone className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Activation / Deactivation Action */}
                      {canManage && !isSelf && (
                        <button
                          type="button"
                          onClick={() => onToggleStatus(row)}
                          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
                            row.isActive
                              ? 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-900/60'
                              : 'bg-emerald-50 text-[#00C471] border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/60'
                          }`}
                          title={row.isActive ? 'Deactivate user account' : 'Re-activate user account'}
                        >
                          {row.isActive ? (
                            <UserX className="w-3.5 h-3.5" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5" />
                          )}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] text-xs">
        <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400">
          <span>
            Showing <span className="font-semibold text-slate-800 dark:text-slate-200">{startRecord}</span> to{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{endRecord}</span> of{' '}
            <span className="font-semibold text-slate-800 dark:text-slate-200">{total}</span> users
          </span>
          <select
            value={limit}
            onChange={(e) => onLimitChange(Number(e.target.value))}
            className="px-2 py-1 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-700 dark:text-slate-300 text-xs focus:outline-none"
          >
            <option value={10}>10 per page</option>
            <option value={25}>25 per page</option>
            <option value={50}>50 per page</option>
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="px-3 py-1 font-semibold text-slate-700 dark:text-slate-300">
            Page {page} of {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            className="p-1.5 rounded-lg border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-slate-600 dark:text-slate-300 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
