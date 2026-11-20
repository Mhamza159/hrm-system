/**
 * @file RoleDetailModal.jsx
 * @description Deep Inspection Modal for Roles & Permissions Access Governance.
 * Displays tabs for Permissions Breakdown, Assigned Staff Roster, and Governance Audit.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState } from 'react';
import {
  X,
  Crown,
  Shield,
  Layers,
  Users,
  Calendar,
  Lock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Search,
  Download
} from 'lucide-react';
import { useGetRoleByIdQuery } from '../rolesApi.js';
import { cn } from '../../../lib/utils.js';

export function RoleDetailModal({ isOpen, onClose, roleId }) {
  const [activeTab, setActiveTab] = useState('permissions'); // 'permissions' | 'users' | 'audit'
  const [userSearch, setUserSearch] = useState('');

  const { data: roleResponse, isLoading, isError } = useGetRoleByIdQuery(roleId, {
    skip: !isOpen || !roleId
  });

  if (!isOpen) return null;

  const role = roleResponse?.data || {};
  const isSystem = Boolean(role.isSystem);
  const isActive = role.isActive !== false;
  const assignedUsers = role.assignedUsers || [];
  const permissions = role.permissions || [];

  // Group permissions by module
  const permissionsByModule = permissions.reduce((acc, p) => {
    const parts = (p.action || '').split('.');
    const mod = parts[0] || 'general';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  const filteredUsers = assignedUsers.filter((u) => {
    const q = userSearch.toLowerCase();
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.employeeId && u.employeeId.toLowerCase().includes(q))
    );
  });

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14]">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'p-2.5 rounded-xl shrink-0',
                isSystem
                  ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-500 ring-1 ring-amber-400/20'
                  : 'bg-emerald-50 dark:bg-[#1A3125]/60 text-brand ring-1 ring-[#00C471]/20'
              )}
            >
              {isSystem ? <Crown className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  {role.name || 'Role Profile Inspection'}
                </h3>
                <span
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider',
                    isSystem
                      ? 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                      : 'bg-indigo-100/70 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                  )}
                >
                  {isSystem ? 'System Core' : 'Custom'}
                </span>
                <span
                  className={cn(
                    'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                    isActive
                      ? 'bg-emerald-100/70 text-brand dark:bg-emerald-950/60 dark:text-[#00C471]'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  )}
                >
                  {isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-xs font-mono text-slate-400 dark:text-slate-500 mt-0.5">
                slug: {role.slug || '—'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]">
          <button
            type="button"
            onClick={() => setActiveTab('permissions')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer',
              activeTab === 'permissions'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Layers className="w-4 h-4" />
            <span>Permissions Breakdown ({permissions.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('users')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer',
              activeTab === 'users'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Users className="w-4 h-4" />
            <span>Assigned Staff Roster ({assignedUsers.length})</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audit')}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-all cursor-pointer',
              activeTab === 'audit'
                ? 'border-[#00C471] text-[#00C471]'
                : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'
            )}
          >
            <Calendar className="w-4 h-4" />
            <span>Governance & Audit</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {isLoading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-6 w-48 bg-slate-200 dark:bg-slate-800 rounded" />
              <div className="h-24 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
              <div className="h-40 bg-slate-100 dark:bg-slate-800/40 rounded-xl" />
            </div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-60" />
              <p className="text-xs font-semibold">Failed to load detailed role telemetry.</p>
            </div>
          ) : (
            <>
              {/* Description preview */}
              <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#061A14]/70 border border-slate-100 dark:border-[#1A3125] mb-5">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                  Role Intent & Description
                </span>
                <p className="text-xs text-slate-700 dark:text-slate-300 mt-1">
                  {role.description || 'No specific description provided for this security role.'}
                </p>
              </div>

              {/* Tab 1: Permissions Breakdown */}
              {activeTab === 'permissions' && (
                <div className="space-y-4">
                  {isSystem && role.name === 'Super Admin' ? (
                    <div className="p-6 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/40 text-center">
                      <Crown className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                        Full Unrestricted System Super Administrator
                      </h4>
                      <p className="text-xs text-slate-600 dark:text-slate-400 max-w-md mx-auto mt-1">
                        Super Admin bypasses granular permission lists with full <code className="font-mono text-brand">manage:all</code> capability across every module and action.
                      </p>
                    </div>
                  ) : Object.keys(permissionsByModule).length === 0 ? (
                    <div className="p-8 text-center text-slate-400">
                      <p className="text-xs">No permissions currently assigned to this role.</p>
                    </div>
                  ) : (
                    Object.entries(permissionsByModule).map(([mod, perms]) => (
                      <div
                        key={mod}
                        className="rounded-xl border border-slate-200 dark:border-[#1A3125] p-3.5 bg-white dark:bg-[#111D17]"
                      >
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-slate-100 dark:border-[#1A3125]">
                          <span className="text-xs font-bold text-slate-800 dark:text-slate-200 capitalize">
                            Module: {mod.replace(/_/g, ' ')}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                            {perms.length} actions
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {perms.map((p, idx) => (
                            <div
                              key={idx}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs bg-slate-50 dark:bg-[#061A14] border border-slate-200/60 dark:border-[#1A3125]"
                            >
                              <span className="font-mono text-slate-800 dark:text-slate-200">
                                {p.action}
                              </span>
                              {p.scope && (
                                <span className="text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded bg-emerald-100/70 text-brand dark:bg-emerald-950/70 dark:text-[#00C471]">
                                  {p.scope}
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}

              {/* Tab 2: Assigned Staff Roster */}
              {activeTab === 'users' && (
                <div className="space-y-4">
                  <div className="relative max-w-sm">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      placeholder="Search assigned staff members..."
                      className="w-full pl-9 pr-3 py-1.5 rounded-lg text-xs bg-white dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white"
                    />
                  </div>

                  {filteredUsers.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 border border-dashed border-slate-200 dark:border-[#1A3125] rounded-xl">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-40" />
                      <p className="text-xs">
                        {userSearch ? 'No staff matched search query.' : 'No users currently assigned to this role.'}
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 dark:border-[#1A3125] rounded-xl overflow-hidden">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 dark:bg-[#061A14] border-b border-slate-200 dark:border-[#1A3125] text-slate-500 font-semibold">
                          <tr>
                            <th className="px-4 py-2.5">Employee Name</th>
                            <th className="px-4 py-2.5">Employee ID</th>
                            <th className="px-4 py-2.5">Work Email</th>
                            <th className="px-4 py-2.5">Department</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#1A3125]">
                          {filteredUsers.map((u) => (
                            <tr key={u._id} className="hover:bg-slate-50/50 dark:hover:bg-[#1A3125]/20">
                              <td className="px-4 py-2.5 font-medium text-slate-900 dark:text-white">
                                {u.name || 'Unnamed Employee'}
                              </td>
                              <td className="px-4 py-2.5 font-mono text-slate-500">
                                {u.employeeId || '—'}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                                {u.email}
                              </td>
                              <td className="px-4 py-2.5 text-slate-600 dark:text-slate-400">
                                {u.department?.name || u.department || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Tab 3: Governance & Audit */}
              {activeTab === 'audit' && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Security Classification
                      </span>
                      <p className="text-sm font-semibold text-slate-900 dark:text-white mt-1">
                        {isSystem ? 'Core System Role (Protected)' : 'Tenant Custom Role'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {isSystem
                          ? 'Protected from deletion, rename, and structural removal by backend policy.'
                          : 'User-created role subject to tenant RBAC/PBAC management rules.'}
                      </p>
                    </div>

                    <div className="p-4 rounded-xl border border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17]">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        Role Creation Timestamp
                      </span>
                      <p className="text-sm font-semibold font-mono text-slate-900 dark:text-white mt-1">
                        {role.createdAt ? new Date(role.createdAt).toLocaleString('en-US', { timeZone: 'Asia/Karachi' }) : 'Initial Seed'}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        Last modified:{' '}
                        {role.updatedAt ? new Date(role.updatedAt).toLocaleString('en-US', { timeZone: 'Asia/Karachi' }) : 'Never'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14]">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

export default RoleDetailModal;
