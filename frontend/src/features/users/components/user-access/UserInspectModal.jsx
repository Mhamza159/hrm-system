/**
 * @file UserInspectModal.jsx
 * @description Forensic 5-Tab Inspection Modal for User Account, Roles & Effective Permissions Matrix.
 * Strictly adheres to docs/UI-REFERENCE.md (Elvara Forest & Emerald Enterprise Craft).
 */

import React, { useState } from 'react';
import {
  X,
  User,
  Shield,
  KeyRound,
  ShieldAlert,
  Unlock,
  Building2,
  Briefcase,
  Phone,
  Calendar,
  Layers,
  History
} from 'lucide-react';
import {
  useGetUserByIdQuery,
  useGetEffectivePermissionsQuery
} from '../../usersApi.js';
import {
  getUserStatusBadge,
  getRoleBadge,
  get2faBadge
} from './userAccessTheme.js';
import { formatDate } from '../../../../lib/formatters.js';

export function UserInspectModal({
  userId,
  isOpen,
  onClose,
  onAssignRole,
  onUnlockAccount,
  onToggleStatus: _onToggleStatus
}) {
  const [activeTab, setActiveTab] = useState('identity'); // 'identity' | 'roles' | 'permissions' | 'security' | 'history'

  const {
    data: userDetailResponse,
    isLoading: isUserLoading
  } = useGetUserByIdQuery(userId, { skip: !isOpen || !userId });

  const {
    data: permissionsResponse,
    isLoading: isPermsLoading
  } = useGetEffectivePermissionsQuery(userId, { skip: !isOpen || !userId || activeTab !== 'permissions' });

  if (!isOpen) return null;

  if (isUserLoading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
        <div className="w-full max-w-3xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl p-6 space-y-4">
          <div className="h-10 bg-slate-100 dark:bg-white/5 rounded-xl animate-pulse" />
          <div className="h-48 bg-slate-100 dark:bg-white/5 rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  const user = userDetailResponse?.data || {};
  const emp = user.employeeId || {};
  const statusCfg = getUserStatusBadge(user.accountStatus);
  const twoFaCfg = get2faBadge(user.twoFactorEnabled);
  const StatusIcon = statusCfg.icon;

  const displayName = user.name || emp.name || user.email?.split('@')[0] || 'User Account';
  const roles = Array.isArray(user.roles) ? user.roles : [];

  // Group effective permissions by subject/module
  const effectivePermissions = permissionsResponse?.data?.permissions || [];
  const permissionsByModule = {};
  effectivePermissions.forEach((p) => {
    const mod = p.subject || 'General';
    if (!permissionsByModule[mod]) permissionsByModule[mod] = [];
    permissionsByModule[mod].push(p);
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="w-full max-w-3xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] rounded-3xl shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-6 border-b border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] flex items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00C471] flex items-center justify-center font-bold text-base shrink-0 border border-emerald-200/80 dark:border-emerald-800/60">
              {user.avatar || emp.avatar ? (
                <img
                  src={user.avatar || emp.avatar}
                  alt={displayName}
                  className="w-full h-full object-cover rounded-2xl"
                />
              ) : (
                displayName ? displayName.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {displayName}
                </h3>
                <span
                  className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${statusCfg.badgeClass}`}
                >
                  <StatusIcon className="w-3 h-3" />
                  {statusCfg.label}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
                <span className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{user.email}</span>
                {emp.employeeCode && (
                  <>
                    <span>•</span>
                    <span className="font-mono">Code: {emp.employeeCode}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 px-6 border-b border-slate-100 dark:border-[#1A3125] bg-white dark:bg-[#111D17] text-xs font-semibold overflow-x-auto">
          {[
            { id: 'identity', label: 'User & Employee Identity', icon: User },
            { id: 'roles', label: `Assigned Roles (${roles.length})`, icon: Shield },
            { id: 'permissions', label: 'Effective Permissions Matrix', icon: Layers },
            { id: 'security', label: 'Account Security & Sessions', icon: KeyRound },
            { id: 'history', label: 'Access History', icon: History }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                type="button"
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3 px-3.5 border-b-2 font-semibold flex items-center gap-1.5 transition-colors cursor-pointer whitespace-nowrap ${
                  isSelected
                    ? 'border-[#00C471] text-[#00C471]'
                    : 'border-transparent text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Body: Scrollable */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* TAB 1: User & Employee Identity */}
          {activeTab === 'identity' && (
            <div className="space-y-6">
              {/* Account Credentials Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>System User Account Metadata</span>
                  <span className="font-mono text-[10px]">UID: {user._id}</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Primary Email</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 font-mono">{user.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Account Registered</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Latest Login</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">
                      {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never logged in'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Linked Employee Record Card */}
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-3">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                  <span>Linked Employee Master Coordinates</span>
                  {emp._id ? (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-[#00C471] font-semibold">
                      Linked ({emp.employeeCode})
                    </span>
                  ) : (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-600 font-semibold">
                      Standalone Admin
                    </span>
                  )}
                </div>

                {emp._id ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Full Staff Name</span>
                      <span className="font-semibold text-slate-900 dark:text-white flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" /> {emp.name}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Department</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Building2 className="w-3 h-3 text-slate-400" /> {emp.departmentId?.name || 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Designation</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Briefcase className="w-3 h-3 text-slate-400" /> {emp.designationId?.title || 'Unassigned'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Employment Status</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {emp.employmentStatus || 'Active'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Official Phone</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1 font-mono">
                        <Phone className="w-3 h-3 text-slate-400" /> {emp.phone || '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Date of Joining</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-slate-400" /> {emp.joiningDate ? formatDate(emp.joiningDate) : '—'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500 italic">
                    This user account is a direct administrative system user without an attached staff employee record.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: Assigned Roles */}
          {activeTab === 'roles' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Assigned System Roles ({roles.length})
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onAssignRole(user);
                  }}
                  className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-[#00C471] dark:border-emerald-800/60 font-semibold text-xs hover:bg-emerald-100 transition-colors cursor-pointer"
                >
                  Modify Assigned Roles
                </button>
              </div>

              {roles.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40">
                  <ShieldAlert className="w-6 h-6 text-amber-500 mx-auto mb-2" />
                  <h5 className="font-bold text-amber-900 dark:text-amber-200">No Roles Assigned</h5>
                  <p className="text-slate-500 dark:text-slate-400 max-w-sm mx-auto mt-1">
                    This user account does not have any assigned roles. They will default to basic employee view privileges.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {roles.map((r, idx) => {
                    const rBadge = getRoleBadge(r.name);
                    const RIcon = rBadge.icon;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${rBadge.colorClass}`}
                          >
                            <RIcon className="w-3.5 h-3.5" />
                            {r.name}
                          </span>
                          {r.isSystem && (
                            <span className="text-[10px] text-slate-400 font-mono uppercase font-bold">
                              System Role
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2">
                          {r.description || 'Standard corporate role configuration.'}
                        </p>
                        {Array.isArray(r.permissions) && (
                          <div className="text-[11px] text-slate-400 pt-1 border-t border-slate-200/60 dark:border-slate-800 font-mono">
                            {r.permissions.length} Granular Permissions Assigned
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: Effective Permissions Matrix */}
          {activeTab === 'permissions' && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/80 dark:border-emerald-800/40 text-xs text-emerald-800 dark:text-emerald-300">
                <span className="font-bold">Compiled Authorization Matrix:</span> These represent the user's active, effective runtime CASL permissions derived from their assigned roles and organizational scoping.
              </div>

              {isPermsLoading ? (
                <div className="p-8 text-center text-xs text-slate-400 animate-pulse">
                  Compiling effective permissions matrix...
                </div>
              ) : Object.keys(permissionsByModule).length === 0 ? (
                <div className="p-8 text-center text-xs text-slate-400">
                  No explicit permissions granted.
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(permissionsByModule).map(([moduleName, perms]) => (
                    <div
                      key={moduleName}
                      className="p-4 rounded-2xl bg-white dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] shadow-xs space-y-2.5"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#1A3125] pb-2">
                        <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider text-[11px]">
                          Module: {moduleName}
                        </span>
                        <span className="text-[10px] font-mono text-slate-400">
                          {perms.length} Action(s) Granted
                        </span>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {perms.map((p, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-[#1A3125] flex items-center justify-between gap-2"
                          >
                            <span className="font-mono text-slate-800 dark:text-slate-200 font-semibold truncate">
                              {p.action}
                            </span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-bold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-[#00C471] dark:border-emerald-800/60 shrink-0">
                              Scope: {p.scope || p.conditions?.scope || 'all'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Account Security & Sessions */}
          {activeTab === 'security' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Lockout State Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Brute-Force Lockout Defense</span>
                    {user.isLocked ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold">LOCKED</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">NORMAL</span>
                    )}
                  </div>
                  <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    <div><span className="text-slate-400">Failed Login Attempts:</span> <span className="font-mono font-bold">{user.failedAttempts || 0} / 5</span></div>
                    <div><span className="text-slate-400">Lockout Expiry:</span> {user.lockUntil ? formatDate(user.lockUntil) : 'None'}</div>
                    {user.isLocked && (
                      <div className="pt-2">
                        <button
                          type="button"
                          onClick={() => {
                            onClose();
                            onUnlockAccount(user);
                          }}
                          className="px-3 py-1.5 rounded-xl bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-colors cursor-pointer flex items-center gap-1.5"
                        >
                          <Unlock className="w-3.5 h-3.5" /> Unlock Account Now
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* 2FA Posture Card */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Two-Factor Authentication</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold border ${twoFaCfg.colorClass}`}>
                      {twoFaCfg.label}
                    </span>
                  </div>
                  <div className="text-xs space-y-1 text-slate-700 dark:text-slate-300">
                    <div><span className="text-slate-400">Status:</span> {user.twoFactorEnabled ? 'Mandatory TOTP verified' : 'Optional'}</div>
                    <div><span className="text-slate-400">Must Change Password:</span> {user.mustChangePassword ? 'Yes (Next Login)' : 'No'}</div>
                  </div>
                </div>

                {/* Hardware QR Device Binding */}
                <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-2 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Physical Device Binding (M13 QR Kiosk)</span>
                    {user.deviceId ? (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-bold">BOUND</span>
                    ) : (
                      <span className="text-[10px] px-2 py-0.5 rounded bg-slate-200 text-slate-700 font-bold">UNBOUND</span>
                    )}
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-slate-700 dark:text-slate-300">
                    <div><span className="text-slate-400">Device Model:</span> <span className="font-semibold">{user.deviceModel || 'None'}</span></div>
                    <div><span className="text-slate-400">Device ID:</span> <span className="font-mono">{user.deviceId ? `${user.deviceId.slice(0, 16)}...` : 'None'}</span></div>
                    <div><span className="text-slate-400">Bound On:</span> {user.deviceBoundAt ? formatDate(user.deviceBoundAt) : 'Never'}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Access History */}
          {activeTab === 'history' && (
            <div className="space-y-3">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Recent Security & Access Events
              </div>
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0A110D] border border-slate-200 dark:border-[#1A3125] space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-[#00C471] flex items-center justify-center shrink-0 mt-0.5 font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white block">Account Provisioned</span>
                    <span className="text-slate-400 text-[10px]">
                      Registered on {user.createdAt ? formatDate(user.createdAt) : 'N/A'}
                    </span>
                  </div>
                </div>

                {user.lastLoginAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 flex items-center justify-center shrink-0 mt-0.5 font-bold">
                      🔑
                    </div>
                    <div>
                      <span className="font-semibold text-slate-900 dark:text-white block">Latest Authentication Succeeded</span>
                      <span className="text-slate-400 text-[10px]">
                        {formatDate(user.lastLoginAt)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-[#1A3125] bg-slate-50/50 dark:bg-[#0A110D] flex items-center justify-between">
          <div className="text-[11px] text-slate-400 font-mono">
            Status: {user.isActive ? 'Active' : 'Deactivated'} • 2FA: {user.twoFactorEnabled ? 'On' : 'Off'}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close Details
          </button>
        </div>
      </div>
    </div>
  );
}
