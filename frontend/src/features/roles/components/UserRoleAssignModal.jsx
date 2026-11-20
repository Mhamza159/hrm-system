/**
 * @file UserRoleAssignModal.jsx
 * @description Modal for assigning or updating roles for a staff user.
 * Includes privilege escalation guards and additive permission calculation preview.
 * Follows the Forest & Emerald Enterprise theme (#061A14, #111D17, #1A3125, #00C471).
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  X,
  Search,
  Check,
  Crown,
  Shield,
  Layers,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import { useGetRolesQuery, useAssignUserRolesMutation } from '../rolesApi.js';
import { useAuth } from '../../../hooks/useAuth.js';
import { cn } from '../../../lib/utils.js';

export function UserRoleAssignModal({ isOpen, onClose, user }) {
  const { user: currentUser } = useAuth();
  const [selectedRoleIds, setSelectedRoleIds] = useState([]);
  const [roleSearch, setRoleSearch] = useState('');

  const { data: rolesResponse, isLoading: isLoadingRoles } = useGetRolesQuery(
    { page: 1, limit: 100 },
    { skip: !isOpen }
  );

  const [assignUserRoles, { isLoading: isAssigning }] = useAssignUserRolesMutation();

  const allRoles = rolesResponse?.data || [];
  const isCurrentSuperAdmin =
    currentUser?.roles?.some((r) => (r.name || r) === 'Super Admin') ||
    currentUser?.isSuperAdmin;

  useEffect(() => {
    if (user?.roles) {
      const initialIds = user.roles.map((r) => (typeof r === 'object' ? r._id : r));
      setSelectedRoleIds(initialIds);
    } else {
      setSelectedRoleIds([]);
    }
  }, [user]);

  // Additive permissions calculation across all selected roles
  const additivePermissionsCount = useMemo(() => {
    const permSet = new Set();
    allRoles
      .filter((r) => selectedRoleIds.includes(r._id))
      .forEach((r) => {
        (r.permissions || []).forEach((p) => {
          if (p.action) permSet.add(p.action);
        });
      });
    return permSet.size;
  }, [allRoles, selectedRoleIds]);

  if (!isOpen || !user) return null;

  const filteredRoles = allRoles.filter((r) => {
    const q = roleSearch.toLowerCase();
    return (
      (r.name && r.name.toLowerCase().includes(q)) ||
      (r.description && r.description.toLowerCase().includes(q))
    );
  });

  const toggleRole = (role) => {
    // Privilege Escalation Guard: Prevent non-Super Admin from granting Super Admin
    if (role.name === 'Super Admin' && !isCurrentSuperAdmin) {
      toast.error('Privilege Escalation Blocked: Only Super Admins can assign the Super Admin role.');
      return;
    }

    if (selectedRoleIds.includes(role._id)) {
      setSelectedRoleIds(selectedRoleIds.filter((id) => id !== role._id));
    } else {
      setSelectedRoleIds([...selectedRoleIds, role._id]);
    }
  };

  const handleSave = async () => {
    if (selectedRoleIds.length === 0) {
      toast.error('At least one role must be assigned to the user.');
      return;
    }

    try {
      await assignUserRoles({
        userId: user._id || user.id,
        roleIds: selectedRoleIds
      }).unwrap();

      toast.success(`Roles updated successfully for ${user.name || 'user'}.`);
      onClose();
    } catch (err) {
      toast.error(err?.data?.message || 'Failed to update user roles.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/15 backdrop-blur-xs">
      <div className="relative w-full max-w-lg rounded-2xl bg-white dark:bg-[#111D17] border border-slate-200 dark:border-[#1A3125] shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-[#1A3125] text-brand">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Assign Security Roles
              </h3>
              <p className="text-[11px] text-slate-400">
                Configure RBAC membership for <strong className="text-slate-700 dark:text-slate-200">{user.name || user.email}</strong>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Additive Capability Preview Card */}
          <div className="p-3.5 rounded-xl bg-emerald-50/60 dark:bg-[#061A14] border border-emerald-200/50 dark:border-[#1A3125] flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300">
              <Layers className="w-4 h-4 text-[#00C471]" />
              <span>Additive Capability Envelope:</span>
            </div>
            <span className="font-mono text-xs font-bold text-slate-900 dark:text-white">
              {additivePermissionsCount} unique actions granted
            </span>
          </div>

          {/* Search box */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              placeholder="Search available roles..."
              className="w-full pl-9 pr-3 py-2 rounded-xl text-xs bg-white dark:bg-[#061A14] border border-slate-200 dark:border-[#1A3125] text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#00C471]/30 focus:border-[#00C471]"
            />
          </div>

          {/* Roles Checkbox List */}
          <div className="max-h-60 overflow-y-auto space-y-2 pr-1">
            {isLoadingRoles ? (
              <div className="p-8 text-center">
                <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#00C471]" />
              </div>
            ) : filteredRoles.length === 0 ? (
              <div className="p-6 text-center text-xs text-slate-400">
                No roles matched search query.
              </div>
            ) : (
              filteredRoles.map((role) => {
                const isSelected = selectedRoleIds.includes(role._id);
                const isSystem = Boolean(role.isSystem);
                const isSuperAdminRole = role.name === 'Super Admin';
                const isLockedForCurrentActor = isSuperAdminRole && !isCurrentSuperAdmin;

                return (
                  <div
                    key={role._id}
                    onClick={() => !isLockedForCurrentActor && toggleRole(role)}
                    className={cn(
                      'p-3 rounded-xl border transition-all flex items-start justify-between gap-3 select-none',
                      isLockedForCurrentActor
                        ? 'opacity-50 cursor-not-allowed bg-slate-100/50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800'
                        : 'cursor-pointer',
                      isSelected
                        ? 'border-[#00C471] bg-emerald-50/40 dark:bg-[#061A14] ring-1 ring-[#00C471]/30'
                        : 'border-slate-200 dark:border-[#1A3125] bg-white dark:bg-[#111D17] hover:border-slate-300 dark:hover:border-[#00C471]/40'
                    )}
                  >
                    <div className="flex items-start gap-2.5">
                      <div
                        className={cn(
                          'w-4 h-4 rounded mt-0.5 flex items-center justify-center transition-all',
                          isSelected
                            ? 'bg-[#00C471] text-white'
                            : 'border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800'
                        )}
                      >
                        {isSelected && <Check className="w-3 h-3 stroke-3" />}
                      </div>

                      <div>
                        <div className="flex items-center gap-1.5">
                          {isSystem ? (
                            <Crown className="w-3.5 h-3.5 text-amber-500" />
                          ) : (
                            <Shield className="w-3.5 h-3.5 text-brand" />
                          )}
                          <span className="text-xs font-bold text-slate-900 dark:text-white">
                            {role.name}
                          </span>
                          <span
                            className={cn(
                              'text-[9px] font-semibold px-1.5 py-0.2 rounded-full uppercase',
                              isSystem
                                ? 'bg-amber-100/70 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                : 'bg-indigo-100/70 text-indigo-700 dark:bg-indigo-950/60 dark:text-indigo-400'
                            )}
                          >
                            {isSystem ? 'System' : 'Custom'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
                          {role.description || 'Enterprise role with granular module actions.'}
                        </p>
                      </div>
                    </div>

                    <div className="text-[11px] font-mono text-slate-400 shrink-0">
                      {role.permissions?.length || 0} perms
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-3.5 border-t border-slate-200 dark:border-[#1A3125] bg-slate-50/70 dark:bg-[#061A14]">
          <button
            type="button"
            onClick={onClose}
            disabled={isAssigning}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={isAssigning || selectedRoleIds.length === 0}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand hover:bg-[#049856] shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-brand/30 disabled:opacity-50 cursor-pointer"
          >
            {isAssigning && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Save Role Assignments</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default UserRoleAssignModal;
